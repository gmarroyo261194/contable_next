"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export interface DashboardStats {
  proveedores: {
    count: number;
    total: number;
  };
  facturasEmitidas: {
    count: number;
    total: number;
  };
  honorariosDocentes: {
    count: number;
    total: number;
  };
}

/**
 * Obtiene las estadísticas principales para el dashboard.
 * Filtra por la empresa y ejercicio activos en la sesión del usuario.
 * 
 * @returns {Promise<DashboardStats>} Objeto con las estadísticas calculadas.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;
  const ejercicioId = (session?.user as any)?.ejercicioId;

  if (!empresaId || !ejercicioId) {
    return {
      proveedores: { count: 0, total: 0 },
      facturasEmitidas: { count: 0, total: 0 },
      honorariosDocentes: { count: 0, total: 0 },
    };
  }

  // 1. Documentos de Proveedores
  const statsProveedores = await prisma.documentoProveedores.aggregate({
    where: { 
      empresaId, 
      ejercicioId,
      anulado: false 
    },
    _count: { id: true },
    _sum: { montoTotal: true }
  });

  // 2. Facturas Emitidas (DocumentoClientes)
  const statsFacturas = await prisma.documentoClientes.aggregate({
    where: { 
      empresaId, 
      ejercicioId 
    },
    _count: { id: true },
    _sum: { montoTotal: true }
  });

  // 3. Honorarios Docentes (FacturaDocente)
  const statsDocentes = await prisma.facturaDocente.aggregate({
    where: { 
      empresaId 
      // Nota: FacturaDocente no tiene ejercicioId directo, pero se filtra por empresa
      // Podríamos filtrar por año/mes si fuera necesario, pero el usuario pidió estadísticas generales
    },
    _count: { id: true },
    _sum: { importe: true }
  });

  return {
    proveedores: {
      count: statsProveedores._count.id || 0,
      total: Number(statsProveedores._sum.montoTotal || 0)
    },
    facturasEmitidas: {
      count: statsFacturas._count.id || 0,
      total: Number(statsFacturas._sum.montoTotal || 0)
    },
    honorariosDocentes: {
      count: statsDocentes._count.id || 0,
      total: Number(statsDocentes._sum.importe || 0)
    }
  };
}
