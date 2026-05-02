"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { auditCreate, auditUpdate, auditDelete } from "@/lib/audit/auditLogger";

export async function getAlumnos(params: {
  page?: number,
  pageSize?: number | 'all',
  search?: string,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
} = {}) {
  const { page = 1, pageSize = 10, search = '', sortBy = 'apellido', sortOrder = 'asc' } = params;
  const skip = pageSize === 'all' ? 0 : (page - 1) * Number(pageSize);
  const take = pageSize === 'all' ? undefined : Number(pageSize);

  const where: any = {};
  if (search) {
    where.OR = [
      { nombre: { contains: search } },
      { apellido: { contains: search } },
      { documento: { contains: search } },
      { email: { contains: search } }
    ];
  }

  const [data, total] = await Promise.all([
    prisma.alumno.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
    }),
    prisma.alumno.count({ where })
  ]);

  return {
    data: JSON.parse(JSON.stringify(data)),
    total,
    page,
    pageSize
  };
}

export async function getAlumnoById(id: number) {
  const alumno = await prisma.alumno.findUnique({
    where: { id },
    include: {
      inscripciones: {
        include: {
          curso: true
        }
      }
    }
  });
  return JSON.parse(JSON.stringify(alumno));
}

export async function upsertAlumno(data: {
  id?: number;
  documento: string;
  apellido: string;
  nombre: string;
  email?: string;
  telefono?: string;
  celular?: string;
  fechaNacimiento?: string;
  sexo?: string;
}) {
  const session = await auth();
  const userEmail = session?.user?.email;
  const empresaId = (session?.user as any)?.empresaId || 1;

  const payload: any = {
    documento: data.documento,
    apellido: data.apellido,
    nombre: data.nombre,
    email: data.email,
    telefono: data.telefono,
    celular: data.celular,
    fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
    sexo: data.sexo,
  };

  const existing = data.id ? await prisma.alumno.findUnique({ where: { id: data.id } }) : null;

  const result = existing
    ? await prisma.alumno.update({ where: { id: data.id }, data: payload })
    : await prisma.alumno.create({ 
        data: { 
          ...payload, 
          ...(data.id ? { id: data.id } : {}) 
        } 
      });

  if (empresaId) {
    if (data.id && existing) {
      await auditUpdate("Alumno", data.id, existing, result, userEmail, empresaId);
    } else {
      await auditCreate("Alumno", result.id, result, userEmail, empresaId);
    }
  }

  revalidatePath("/alumnos");
  return JSON.parse(JSON.stringify(result));
}

export async function deleteAlumno(id: number) {
  const session = await auth();
  const userEmail = session?.user?.email;
  const empresaId = (session?.user as any)?.empresaId;

  const existing = await prisma.alumno.findUnique({ where: { id } });
  
  const countInscripciones = await prisma.inscripcion.count({ where: { alumnoId: id } });
  if (countInscripciones > 0) {
    return { error: "No se puede eliminar un alumno que tiene inscripciones activas." };
  }

  const result = await prisma.alumno.delete({ where: { id } });

  if (empresaId && existing) {
    await auditDelete("Alumno", id, existing, userEmail, empresaId);
  }

  revalidatePath("/alumnos");
  return { success: true };
}
