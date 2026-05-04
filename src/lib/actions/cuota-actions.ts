"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { auditCreate, auditUpdate } from "@/lib/audit/auditLogger";

/**
 * Obtiene todas las cuotas de una inscripción.
 * @param inscripcionId - ID de la inscripción.
 */
export async function getCuotasByInscripcion(inscripcionId: number) {
  const cuotas = await prisma.cuota.findMany({
    where: { inscripcionId },
    orderBy: { numeroCuota: "asc" },
  });
  return JSON.parse(JSON.stringify(cuotas));
}

/**
 * Emite (genera) las cuotas para una inscripción basándose en el costo del curso.
 * Si ya existen cuotas, retorna error.
 * @param inscripcionId - ID de la inscripción objetivo.
 * @param fechaInicio - Fecha base de vencimiento del primer mes (YYYY-MM-DD).
 * @param importeOverride - Importe optativo por cuota (sino usa costo/cantidadCuotas).
 */
export async function emitirCuotas(params: {
  inscripcionId: number;
  fechaInicio: string;
  importeOverride?: number;
}) {
  const { inscripcionId, fechaInicio, importeOverride } = params;

  const session = await auth();
  const userEmail = session?.user?.email;
  const empresaId = (session?.user as any)?.empresaId || 1;

  const inscripcion = await prisma.inscripcion.findUnique({
    where: { id: inscripcionId },
    include: { curso: true },
  });
  if (!inscripcion) throw new Error("Inscripción no encontrada.");

  const existingCount = await prisma.cuota.count({ where: { inscripcionId } });
  if (existingCount > 0) {
    throw new Error(
      "Ya existen cuotas emitidas para esta inscripción. Elimínelas primero."
    );
  }

  const cantidadCuotas = inscripcion.curso.cantidadCuotas;
  const costoTotal = Number(inscripcion.curso.costo);
  const importePorCuota =
    importeOverride ?? Math.round((costoTotal / cantidadCuotas) * 100) / 100;

  const fechaBase = new Date(fechaInicio + "T12:00:00");

  const cuotasData = Array.from({ length: cantidadCuotas }, (_, i) => {
    const vencimiento = new Date(fechaBase);
    vencimiento.setMonth(vencimiento.getMonth() + i);
    return {
      inscripcionId,
      numeroCuota: i + 1,
      importe: importePorCuota,
      fechaVencimiento: vencimiento,
      estado: "Pendiente",
      createdBy: userEmail,
      updatedBy: userEmail,
    };
  });

  const result = await prisma.cuota.createMany({ data: cuotasData });

  await auditCreate(
    "CuotaEmision",
    inscripcionId,
    { inscripcionId, cantidadCuotas, importePorCuota },
    userEmail,
    empresaId
  );

  revalidatePath(`/inscripciones/${inscripcionId}/cuotas`);
  revalidatePath("/inscripciones");
  return { success: true, count: result.count };
}

/**
 * Registra el pago de una cuota individual.
 * @param cuotaId - ID de la cuota a marcar como pagada.
 * @param fechaPago - Fecha de pago (YYYY-MM-DD).
 */
export async function pagarCuota(cuotaId: number, fechaPago: string) {
  const session = await auth();
  const userEmail = session?.user?.email;
  const empresaId = (session?.user as any)?.empresaId || 1;

  const existing = await prisma.cuota.findUnique({ where: { id: cuotaId } });
  if (!existing) throw new Error("Cuota no encontrada.");
  if (existing.estado === "Pagada") throw new Error("La cuota ya está pagada.");

  const result = await prisma.cuota.update({
    where: { id: cuotaId },
    data: {
      estado: "Pagada",
      fechaPago: new Date(fechaPago + "T12:00:00"),
      updatedBy: userEmail,
    },
  });

  await auditUpdate("Cuota", cuotaId, existing, result, userEmail, empresaId);

  revalidatePath(`/inscripciones/${existing.inscripcionId}/cuotas`);
  return JSON.parse(JSON.stringify(result));
}

/**
 * Revierte el pago de una cuota (pasa a Pendiente).
 * @param cuotaId - ID de la cuota.
 */
export async function revertirPagoCuota(cuotaId: number) {
  const session = await auth();
  const userEmail = session?.user?.email;
  const empresaId = (session?.user as any)?.empresaId || 1;

  const existing = await prisma.cuota.findUnique({ where: { id: cuotaId } });
  if (!existing) throw new Error("Cuota no encontrada.");

  const result = await prisma.cuota.update({
    where: { id: cuotaId },
    data: { estado: "Pendiente", fechaPago: null, updatedBy: userEmail },
  });

  await auditUpdate("Cuota", cuotaId, existing, result, userEmail, empresaId);
  revalidatePath(`/inscripciones/${existing.inscripcionId}/cuotas`);
  return JSON.parse(JSON.stringify(result));
}

/**
 * Elimina todas las cuotas de una inscripción (solo si ninguna está pagada).
 * @param inscripcionId - ID de la inscripción.
 */
export async function eliminarCuotas(inscripcionId: number) {
  const pagadas = await prisma.cuota.count({
    where: { inscripcionId, estado: "Pagada" },
  });
  if (pagadas > 0) {
    throw new Error(
      `No se pueden eliminar: hay ${pagadas} cuota(s) pagada(s).`
    );
  }
  await prisma.cuota.deleteMany({ where: { inscripcionId } });
  revalidatePath(`/inscripciones/${inscripcionId}/cuotas`);
  return { success: true };
}

/**
 * Actualiza el importe o la fecha de vencimiento de una cuota individual.
 */
export async function updateCuota(data: {
  id: number;
  importe?: number;
  fechaVencimiento?: string;
  observaciones?: string;
}) {
  const session = await auth();
  const userEmail = session?.user?.email;
  const empresaId = (session?.user as any)?.empresaId || 1;

  const existing = await prisma.cuota.findUnique({ where: { id: data.id } });
  if (!existing) throw new Error("Cuota no encontrada.");

  const payload: any = { updatedBy: userEmail };
  if (data.importe !== undefined) payload.importe = data.importe;
  if (data.fechaVencimiento)
    payload.fechaVencimiento = new Date(data.fechaVencimiento + "T12:00:00");
  if (data.observaciones !== undefined)
    payload.observaciones = data.observaciones;

  const result = await prisma.cuota.update({ where: { id: data.id }, data: payload });
  await auditUpdate("Cuota", data.id, existing, result, userEmail, empresaId);

  revalidatePath(`/inscripciones/${existing.inscripcionId}/cuotas`);
  return JSON.parse(JSON.stringify(result));
}
