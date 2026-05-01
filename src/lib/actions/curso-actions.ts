"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { auditCreate, auditUpdate, auditDelete } from "@/lib/audit/auditLogger";

/**
 * Obtiene todos los cursos con sus rubros y servicios.
 */
export async function getCursos(params: {
  page?: number,
  pageSize?: number | 'all',
  search?: string,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
} = {}) {
  const { page = 1, pageSize = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = params;
  const skip = pageSize === 'all' ? 0 : (page - 1) * Number(pageSize);
  const take = pageSize === 'all' ? undefined : Number(pageSize);

  const where: any = {};
  if (search) {
    where.OR = [
      { nombre: { contains: search } },
      { estado: { contains: search } },
      { rubro: { nombre: { contains: search } } },
      { servicio: { nombre: { contains: search } } }
    ];
  }

  const orderBy: any = {};
  if (sortBy === 'rubro') {
    orderBy.rubro = { nombre: sortOrder };
  } else if (sortBy === 'servicio') {
    orderBy.servicio = { nombre: sortOrder };
  } else {
    orderBy[sortBy] = sortOrder;
  }

  const [data, total] = await Promise.all([
    prisma.curso.findMany({
      where,
      include: {
        rubro: true,
        servicio: true,
        _count: {
          select: { inscripciones: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.curso.count({ where })
  ]);

  return {
    data: JSON.parse(JSON.stringify(data)),
    total,
    page,
    pageSize
  };
}

export async function getCursoById(id: number) {
  const curso = await prisma.curso.findUnique({
    where: { id },
    include: {
      rubro: true,
      servicio: true,
      inscripciones: {
        include: {
          alumno: true
        }
      }
    }
  });
  return JSON.parse(JSON.stringify(curso));
}

export async function upsertCurso(data: {
  id?: number;
  nombre: string;
  anioAcademico: number;
  fechaInicio?: string;
  fechaFin?: string;
  rubroId: number;
  servicioId: number;
  costo: number;
  estado?: string;
}) {
  const session = await auth();
  const userEmail = session?.user?.email;
  const empresaId = (session?.user as any)?.empresaId || 1;

  const payload: any = {
    nombre: data.nombre,
    anioAcademico: data.anioAcademico,
    fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
    fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
    rubroId: data.rubroId,
    servicioId: data.servicioId,
    costo: data.costo,
    estado: data.estado,
    empresaId: empresaId,
  };

  const existing = data.id ? await prisma.curso.findUnique({ where: { id: data.id } }) : null;

  const result = data.id
    ? await prisma.curso.update({ where: { id: data.id }, data: payload })
    : await prisma.curso.create({ data: payload });

  if (empresaId) {
    if (data.id && existing) {
      await auditUpdate("Curso", data.id, existing, result, userEmail, empresaId);
    } else {
      await auditCreate("Curso", result.id, result, userEmail, empresaId);
    }
  }

  revalidatePath("/cursos");
  return JSON.parse(JSON.stringify(result));
}

export async function deleteCurso(id: number) {
  const session = await auth();
  const userEmail = session?.user?.email;
  const empresaId = (session?.user as any)?.empresaId;

  const existing = await prisma.curso.findUnique({ where: { id } });
  
  // No permitir borrar si tiene inscripciones
  const countInscripciones = await prisma.inscripcion.count({ where: { cursoId: id } });
  if (countInscripciones > 0) {
    return { error: "No se puede eliminar un curso que ya tiene alumnos inscriptos." };
  }

  const result = await prisma.curso.delete({ where: { id } });

  if (empresaId && existing) {
    await auditDelete("Curso", id, existing, userEmail, empresaId);
  }

  revalidatePath("/cursos");
  return { success: true };
}
