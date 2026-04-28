"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export interface CategoryStats {
  totalPagado: number;
  totalPendiente: number;
  countPagado: number;
  countPendiente: number;
}

export interface DeptoParticipation {
  nombre: string;
  total: number;
}

export interface DashboardStats {
  proveedores: CategoryStats;
  facturasEmitidas: CategoryStats & {
    totalFundacion: number;
    totalDepartamentos: number;
    participacionesDepto: DeptoParticipation[];
  };
  honorariosDocentes: CategoryStats;
}

/**
 * Obtiene las estadísticas principales para el dashboard, separando montos pagados y pendientes.
 * También desglosa participaciones de fundación y departamentos para las facturas.
 * 
 * @returns {Promise<DashboardStats>} Objeto con las estadísticas detalladas.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;
  const ejercicioId = (session?.user as any)?.ejercicioId;

  if (!empresaId || !ejercicioId) {
    const emptyStats: CategoryStats = { totalPagado: 0, totalPendiente: 0, countPagado: 0, countPendiente: 0 };
    return {
      proveedores: emptyStats,
      facturasEmitidas: { ...emptyStats, totalFundacion: 0, totalDepartamentos: 0, participacionesDepto: [] },
      honorariosDocentes: emptyStats,
    };
  }

  // 1. Documentos de Proveedores
  const provPagados = await prisma.documentoProveedores.aggregate({
    where: { empresaId, ejercicioId, anulado: false, pagado: true },
    _count: { id: true },
    _sum: { montoTotal: true }
  });
  const provPendientes = await prisma.documentoProveedores.aggregate({
    where: { empresaId, ejercicioId, anulado: false, pagado: false },
    _count: { id: true },
    _sum: { montoTotal: true }
  });

  // 2. Facturas Emitidas (DocumentoClientes) + Participaciones
  const todasFacturas = await prisma.documentoClientes.findMany({
    where: { empresaId, ejercicioId },
    select: { 
      montoTotal: true, 
      montoPagado: true,
      servicio: {
        select: {
          participacionFundacion: true,
          porcentajeFundacion: true,
          participacionDepto: true,
          porcentajeDepto: true,
          departamento: {
            select: { nombre: true }
          }
        }
      }
    }
  });

  const deptosMap = new Map<string, number>();

  const factStats = todasFacturas.reduce((acc, f) => {
    const total = Number(f.montoTotal || 0);
    const pagado = Number(f.montoPagado || 0);
    
    // Estadísticas de pago
    if (pagado >= total && total > 0) {
      acc.totalPagado += total;
      acc.countPagado++;
    } else {
      acc.totalPendiente += (total - pagado);
      acc.countPendiente++;
    }

    // Estadísticas de participaciones
    if (f.servicio) {
      if (f.servicio.participacionFundacion && f.servicio.porcentajeFundacion) {
        acc.totalFundacion += (total * Number(f.servicio.porcentajeFundacion) / 100);
      }
      if (f.servicio.participacionDepto && f.servicio.porcentajeDepto) {
        const montoDepto = (total * Number(f.servicio.porcentajeDepto) / 100);
        acc.totalDepartamentos += montoDepto;
        
        const deptoNombre = f.servicio.departamento?.nombre || "Sin Departamento";
        deptosMap.set(deptoNombre, (deptosMap.get(deptoNombre) || 0) + montoDepto);
      }
    }

    return acc;
  }, { 
    totalPagado: 0, 
    totalPendiente: 0, 
    countPagado: 0, 
    countPendiente: 0, 
    totalFundacion: 0, 
    totalDepartamentos: 0,
    participacionesDepto: [] as DeptoParticipation[]
  });

  factStats.participacionesDepto = Array.from(deptosMap.entries()).map(([nombre, total]) => ({
    nombre,
    total
  })).sort((a, b) => b.total - a.total);

  // 3. Honorarios Docentes (FacturaDocente)
  const docentesPagados = await prisma.facturaDocente.aggregate({
    where: { 
      empresaId, 
      OR: [
        { asientoPagoId: { not: null } },
        { gestionPagoId: { not: null } },
        { estado: "Pagado" }
      ]
    },
    _count: { id: true },
    _sum: { importe: true }
  });
  const docentesPendientes = await prisma.facturaDocente.aggregate({
    where: { 
      empresaId, 
      asientoPagoId: null,
      gestionPagoId: null,
      estado: { not: "Pagado" }
    },
    _count: { id: true },
    _sum: { importe: true }
  });

  return {
    proveedores: {
      totalPagado: Number(provPagados._sum.montoTotal || 0),
      totalPendiente: Number(provPendientes._sum.montoTotal || 0),
      countPagado: provPagados._count.id || 0,
      countPendiente: provPendientes._count.id || 0,
    },
    facturasEmitidas: factStats,
    honorariosDocentes: {
      totalPagado: Number(docentesPagados._sum.importe || 0),
      totalPendiente: Number(docentesPendientes._sum.importe || 0),
      countPagado: docentesPagados._count.id || 0,
      countPendiente: docentesPendientes._count.id || 0,
    }
  };
}
