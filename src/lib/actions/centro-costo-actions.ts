"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { auditCreate, auditUpdate, auditDelete } from "@/lib/audit/auditLogger";
import { MayorRenglon, MayorResult, getLibroMayor } from "./reportes-actions";

/**
 * Obtiene todos los centros de costo de la empresa activa en la sesión.
 * @returns {Promise<any[]>} Listado de centros de costo con sus IDs de cuenta.
 */
export async function getCentrosCosto(empresaId?: number) {
  // Si no se pasa empresaId, lo obtenemos de la sesión
  let resolvedEmpresaId = empresaId;
  if (!resolvedEmpresaId) {
    const session = await auth();
    resolvedEmpresaId = (session?.user as any)?.empresaId;
  }

  if (!resolvedEmpresaId) return [];

  return await prisma.centroCosto.findMany({
    where: { empresaId: resolvedEmpresaId },
    include: {
      cuentas: {
        select: {
          cuentaId: true
        }
      }
    },
    orderBy: { nombre: 'asc' }
  });
}

/**
 * Crea o actualiza un centro de costo.
 * Valida que el empresaId corresponda a la empresa activa de la sesión.
 * @param {any} data - Datos del centro de costo (id, nombre, cuentaIds).
 */
export async function upsertCentroCosto(data: {
  id?: number;
  nombre: string;
  cuentaIds: number[];
}) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) throw new Error("No hay una empresa activa seleccionada.");

  const { id, nombre, cuentaIds } = data;

  if (id) {
    // Validar que el centro pertenece a la empresa activa
    const centroExistente = await prisma.centroCosto.findFirst({
      where: { id, empresaId },
    });

    if (!centroExistente) {
      throw new Error("No se puede modificar este centro de costo. No pertenece a la empresa activa.");
    }

    // Actualizar
    return await prisma.$transaction(async (tx) => {
      const centro = await tx.centroCosto.update({
        where: { id },
        data: { nombre }
      });

      // Resetear relaciones de cuentas
      await tx.centroCostoCuenta.deleteMany({
        where: { centroCostoId: id }
      });

      // Crear nuevas relaciones
      if (cuentaIds.length > 0) {
        await tx.centroCostoCuenta.createMany({
          data: cuentaIds.map(cuentaId => ({
            centroCostoId: id,
            cuentaId
          }))
        });
      }

      // Registrar auditoría
      await auditUpdate("CentroCosto", id, centroExistente, centro, session?.user?.email, empresaId);

      return centro;
    });
  } else {
    // Crear — usar empresaId de la sesión
    const centro = await prisma.centroCosto.create({
      data: {
        nombre,
        empresaId,
        cuentas: {
          create: cuentaIds.map(cuentaId => ({
            cuentaId
          }))
        }
      }
    });

    await auditCreate("CentroCosto", centro.id, centro, session?.user?.email, empresaId);
    return centro;
  }
}

/**
 * Elimina un centro de costo, validando que pertenezca a la empresa activa.
 * @param {number} id - ID del centro de costo.
 */
export async function deleteCentroCosto(id: number) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) throw new Error("No hay una empresa activa seleccionada.");

  // Validar que el centro pertenece a la empresa activa de la sesión
  const centroExistente = await prisma.centroCosto.findFirst({
    where: { id, empresaId },
  });

  if (!centroExistente) {
    throw new Error("No se puede eliminar este centro de costo. No pertenece a la empresa activa.");
  }

  await auditDelete("CentroCosto", id, centroExistente, session?.user?.email, empresaId);

  return await prisma.centroCosto.delete({
    where: { id }
  });
}

export interface ReporteCentroCostoResult {
  centroNombre: string;
  desglose: MayorResult[];
  consolidado: MayorResult;
}

/**
 * Genera el reporte mayor consolidado y desglosado por Centro de Costo.
 * @param {number} centroCostoId - ID del centro de costo.
 * @param {number} ejercicioId - ID del ejercicio activo.
 * @param {string} fechaDesde - Fecha inicial.
 * @param {string} fechaHasta - Fecha final.
 */
export async function getReporteMayorCentroCosto(
  centroCostoId: number,
  ejercicioId: number,
  fechaDesde: string,
  fechaHasta: string
): Promise<ReporteCentroCostoResult> {
  const centro = await prisma.centroCosto.findUnique({
    where: { id: centroCostoId },
    include: {
      cuentas: {
        select: { cuentaId: true }
      }
    }
  });

  if (!centro) throw new Error("Centro de costo no encontrado.");

  const cuentaIds = centro.cuentas.map(c => c.cuentaId);
  
  // 1. Obtener los mayores individuales (Desglose)
  const desglose = await getLibroMayor(ejercicioId, cuentaIds, fechaDesde, fechaHasta);

  // 2. Generar el consolidado
  const todosLosRenglones: MayorRenglon[] = [];
  
  let sumDebeInicial = 0;
  let sumHaberInicial = 0;

  desglose.forEach(mayor => {
    const transporte = mayor.renglones.find(r => r.esTransporte);
    if (transporte) {
      if (transporte.saldo >= 0) {
        sumDebeInicial += transporte.saldo;
      } else {
        sumHaberInicial += Math.abs(transporte.saldo);
      }
    }

    todosLosRenglones.push(...mayor.renglones.filter(r => !r.esTransporte));
  });

  todosLosRenglones.sort((a, b) => {
    const fA = new Date(a.fecha).getTime();
    const fB = new Date(b.fecha).getTime();
    if (fA !== fB) return fA - fB;
    return Number(a.nroAsiento) - Number(b.nroAsiento);
  });

  let saldoAcumulado = sumDebeInicial - sumHaberInicial;
  
  const renglonesConsolidados: MayorRenglon[] = [
    {
      id: 'transporte-consolidado',
      fecha: new Date(fechaDesde),
      nroAsiento: "-",
      descripcion: "Transporte Consolidado",
      debe: sumDebeInicial > sumHaberInicial ? saldoAcumulado : 0,
      haber: sumHaberInicial > sumDebeInicial ? Math.abs(saldoAcumulado) : 0,
      saldo: saldoAcumulado,
      esTransporte: true
    }
  ];

  for (const mov of todosLosRenglones) {
    saldoAcumulado = saldoAcumulado + Number(mov.debe) - Number(mov.haber);
    renglonesConsolidados.push({
      ...mov,
      saldo: saldoAcumulado
    });
  }

  return {
    centroNombre: centro.nombre,
    desglose,
    consolidado: {
      cuentaId: 0,
      codigo: "CONSOL",
      nombre: "CONSOLIDADO CENTRO DE COSTO",
      renglones: renglonesConsolidados
    }
  };
}
