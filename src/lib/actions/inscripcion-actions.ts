"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { auditCreate, auditUpdate, auditDelete } from "@/lib/audit/auditLogger";

/**
 * Obtiene inscripciones paginadas con datos de alumno y curso.
 * @param params - Parámetros de paginación, búsqueda y ordenamiento.
 */
export async function getInscripciones(params: {
  page?: number;
  pageSize?: number | "all";
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  cursoId?: number;
  alumnoId?: number;
} = {}) {
  const {
    page = 1,
    pageSize = 10,
    search = "",
    sortBy = "fechaInscripcion",
    sortOrder = "desc",
    cursoId,
    alumnoId,
  } = params;

  const skip = pageSize === "all" ? 0 : (page - 1) * Number(pageSize);
  const take = pageSize === "all" ? undefined : Number(pageSize);

  const where: any = {};
  if (cursoId) where.cursoId = cursoId;
  if (alumnoId) where.alumnoId = alumnoId;

  if (search) {
    where.OR = [
      { alumno: { nombre: { contains: search } } },
      { alumno: { apellido: { contains: search } } },
      { alumno: { documento: { contains: search } } },
      { curso: { nombre: { contains: search } } },
    ];
  }

  let orderBy: any = {};
  if (sortBy === "alumno") {
    orderBy = { alumno: { apellido: sortOrder } };
  } else if (sortBy === "curso") {
    orderBy = { curso: { nombre: sortOrder } };
  } else {
    orderBy = { [sortBy]: sortOrder };
  }

  const [data, total] = await Promise.all([
    prisma.inscripcion.findMany({
      where,
      include: {
        alumno: true,
        curso: { include: { rubro: true, servicio: true } },
        _count: { select: { cuotas: true } },
      },
      orderBy,
      skip,
      take,
    }),
    prisma.inscripcion.count({ where }),
  ]);

  return {
    data: JSON.parse(JSON.stringify(data)),
    total,
    page,
    pageSize,
  };
}

/**
 * Obtiene una inscripción por ID con cuotas incluidas.
 * @param id - ID de la inscripción.
 */
export async function getInscripcionById(id: number) {
  const insc = await prisma.inscripcion.findUnique({
    where: { id },
    include: {
      alumno: true,
      curso: { include: { rubro: true, servicio: true } },
      cuotas: { orderBy: { numeroCuota: "asc" } },
    },
  });
  return JSON.parse(JSON.stringify(insc));
}

/**
 * Crea o actualiza una inscripción.
 * @param data - Datos de la inscripción a persistir.
 */
export async function upsertInscripcion(data: {
  id?: number;
  cursoId: number;
  alumnoId: number;
  fechaInscripcion?: string;
  estado?: string;
  observaciones?: string;
}) {
  const session = await auth();
  const userEmail = session?.user?.email;
  const empresaId = (session?.user as any)?.empresaId || 1;

  const payload: any = {
    cursoId: data.cursoId,
    alumnoId: data.alumnoId,
    fechaInscripcion: data.fechaInscripcion
      ? new Date(data.fechaInscripcion)
      : new Date(),
    estado: data.estado || "Activa",
    observaciones: data.observaciones || null,
  };

  const existing = data.id
    ? await prisma.inscripcion.findUnique({ where: { id: data.id } })
    : null;

  const result = existing
    ? await prisma.inscripcion.update({
        where: { id: data.id },
        data: { ...payload, updatedBy: userEmail },
      })
    : await prisma.inscripcion.create({
        data: { ...payload, createdBy: userEmail, updatedBy: userEmail },
      });

  if (empresaId) {
    if (data.id && existing) {
      await auditUpdate("Inscripcion", data.id, existing, result, userEmail, empresaId);
    } else {
      await auditCreate("Inscripcion", result.id, result, userEmail, empresaId);
    }
  }

  revalidatePath("/inscripciones");
  return JSON.parse(JSON.stringify(result));
}

/**
 * Elimina una inscripción y sus cuotas asociadas (cascade).
 * @param id - ID de la inscripción a eliminar.
 */
export async function deleteInscripcion(id: number) {
  const session = await auth();
  const userEmail = session?.user?.email;
  const empresaId = (session?.user as any)?.empresaId;

  const existing = await prisma.inscripcion.findUnique({
    where: { id },
    include: { _count: { select: { cuotas: true } } },
  });

  if (!existing) return { error: "Inscripción no encontrada." };

  const cuotasPagadas = await prisma.cuota.count({
    where: { inscripcionId: id, estado: "Pagada" },
  });

  if (cuotasPagadas > 0) {
    return {
      error: `No se puede eliminar: la inscripción tiene ${cuotasPagadas} cuota(s) pagada(s).`,
    };
  }

  await prisma.inscripcion.delete({ where: { id } });

  if (empresaId && existing) {
    await auditDelete("Inscripcion", id, existing, userEmail, empresaId);
  }

  revalidatePath("/inscripciones");
  return { success: true };
}
