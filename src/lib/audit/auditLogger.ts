/**
 * @module auditLogger
 * @description Servicio centralizado de auditoría para el sistema ContableNext.
 *
 * Registra cada operación de escritura (CREATE / UPDATE / DELETE) sobre las
 * entidades críticas del sistema, guardando un snapshot JSON de los valores
 * anteriores y nuevos para trazabilidad completa.
 *
 * Uso típico dentro de una server action:
 * ```ts
 * // En CREATE:
 * const cuenta = await db.cuenta.create({ data });
 * await auditCreate("Cuenta", cuenta.id, cuenta, userEmail, empresaId);
 *
 * // En UPDATE — siempre leer ANTES de modificar:
 * const anterior = await db.cuenta.findUnique({ where: { id } });
 * const actualizado = await db.cuenta.update({ where: { id }, data });
 * await auditUpdate("Cuenta", id, anterior, actualizado, userEmail, empresaId);
 *
 * // En DELETE — siempre leer ANTES de eliminar:
 * const anterior = await db.cuenta.findUnique({ where: { id } });
 * await db.cuenta.delete({ where: { id } });
 * await auditDelete("Cuenta", id, anterior, userEmail, empresaId);
 * ```
 */

import prisma from "@/lib/prisma";

/** Tipo de acción de auditoría */
export type AuditAccion = "CREATE" | "UPDATE" | "DELETE";

/**
 * Serializa un objeto a JSON, eliminando valores circulares y
 * convirtiendo tipos no serializables (BigInt, Decimal, Date).
 * @param data - Objeto a serializar
 * @returns String JSON o null si data es nulo/indefinido
 */
function serializarValores(data: unknown): string | null {
  if (data === null || data === undefined) return null;
  return JSON.stringify(data, (_, value) => {
    if (typeof value === "bigint") return value.toString();
    if (value instanceof Date) return value.toISOString();
    // Decimal de Prisma (tiene método toNumber)
    if (value !== null && typeof value === "object" && typeof value.toNumber === "function") {
      return value.toNumber();
    }
    return value;
  });
}

/**
 * Registra una operación de CREACIÓN en el log de auditoría.
 *
 * @param entidad - Nombre del modelo Prisma (ej: "Cuenta", "Asiento")
 * @param entidadId - ID del registro creado
 * @param valoresNuev - Objeto completo del registro recién creado
 * @param cambiadoPor - Email del usuario que realizó la acción
 * @param empresaId - ID de la empresa para filtrado multi-tenant
 */
export async function auditCreate(
  entidad: string,
  entidadId: number | string,
  valoresNuev: unknown,
  cambiadoPor: string | null | undefined,
  empresaId?: number | null
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        entidad,
        entidadId: String(entidadId),
        accion: "CREATE",
        valoresAnt: undefined,
        valoresNuev: serializarValores(valoresNuev) ?? undefined,
        cambiadoPor: cambiadoPor || undefined,
        empresaId: empresaId || undefined,
      },
    });
  } catch (error) {
    // El fallo del log nunca debe interrumpir la operación principal
    console.error(`[AuditLog] Error al registrar CREATE en ${entidad}:`, error);
  }
}

/**
 * Registra una operación de ACTUALIZACIÓN en el log de auditoría,
 * guardando tanto el estado anterior como el estado nuevo del registro.
 *
 * @param entidad - Nombre del modelo Prisma (ej: "Cuenta", "Asiento")
 * @param entidadId - ID del registro modificado
 * @param valoresAnt - Snapshot del objeto ANTES de la modificación
 * @param valoresNuev - Snapshot del objeto DESPUÉS de la modificación
 * @param cambiadoPor - Email del usuario que realizó la acción
 * @param empresaId - ID de la empresa para filtrado multi-tenant
 */
export async function auditUpdate(
  entidad: string,
  entidadId: number | string,
  valoresAnt: unknown,
  valoresNuev: unknown,
  cambiadoPor: string | null | undefined,
  empresaId?: number | null
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        entidad,
        entidadId: String(entidadId),
        accion: "UPDATE",
        valoresAnt: serializarValores(valoresAnt) ?? undefined,
        valoresNuev: serializarValores(valoresNuev) ?? undefined,
        cambiadoPor: cambiadoPor || undefined,
        empresaId: empresaId || undefined,
      },
    });
  } catch (error) {
    console.error(`[AuditLog] Error al registrar UPDATE en ${entidad}:`, error);
  }
}

/**
 * Registra una operación de ELIMINACIÓN en el log de auditoría,
 * guardando el snapshot completo del registro antes de borrarlo.
 *
 * @param entidad - Nombre del modelo Prisma (ej: "Cuenta", "Asiento")
 * @param entidadId - ID del registro eliminado
 * @param valoresAnt - Snapshot del objeto ANTES de la eliminación
 * @param cambiadoPor - Email del usuario que realizó la acción
 * @param empresaId - ID de la empresa para filtrado multi-tenant
 */
export async function auditDelete(
  entidad: string,
  entidadId: number | string,
  valoresAnt: unknown,
  cambiadoPor: string | null | undefined,
  empresaId?: number | null
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        entidad,
        entidadId: String(entidadId),
        accion: "DELETE",
        valoresAnt: serializarValores(valoresAnt) ?? undefined,
        valoresNuev: undefined,
        cambiadoPor: cambiadoPor || undefined,
        empresaId: empresaId || undefined,
      },
    });
  } catch (error) {
    console.error(`[AuditLog] Error al registrar DELETE en ${entidad}:`, error);
  }
}

/**
 * Obtiene el historial de auditoría de un registro específico.
 *
 * @param entidad - Nombre del modelo Prisma
 * @param entidadId - ID del registro a consultar
 * @returns Array de entradas de auditoría ordenadas de más reciente a más antiguo
 */
export async function getAuditHistory(entidad: string, entidadId: number | string) {
  return prisma.auditLog.findMany({
    where: {
      entidad,
      entidadId: String(entidadId),
    },
    orderBy: { cambiadoEn: "desc" },
  });
}

/**
 * Obtiene el historial de auditoría de una empresa, con paginación.
 *
 * @param empresaId - ID de la empresa
 * @param params - Opciones de paginación y filtrado
 * @returns Objeto con data y total
 */
export async function getAuditLogEmpresa(
  empresaId: number,
  params: {
    page?: number;
    pageSize?: number;
    entidad?: string;
    accion?: AuditAccion;
  } = {}
) {
  const { page = 1, pageSize = 50, entidad, accion } = params;
  const skip = (page - 1) * pageSize;

  const where: any = { empresaId };
  if (entidad) where.entidad = entidad;
  if (accion) where.accion = accion;

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { cambiadoEn: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { data, total };
}
