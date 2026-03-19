"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getEntidades() {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) return [];

  return await prisma.entidad.findMany({
    where: {
      empresaId: parseInt(empresaId),
    },
    include: {
      tipo: true,
    },
    orderBy: {
      nombre: "asc",
    },
  });
}

export async function getTiposEntidad() {
  return await prisma.tipoEntidad.findMany({
    orderBy: {
      nombre: "asc",
    },
  });
}

export async function createEntidad(data: {
  nombre: string;
  cuit?: string;
  nroDoc?: string;
  email?: string;
  telefono?: string;
  tipoId: number;
}) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) throw new Error("No hay una empresa activa seleccionada.");

  const entidad = await prisma.entidad.create({
    data: {
      nombre: data.nombre,
      cuit: data.cuit || null,
      nroDoc: data.nroDoc || null,
      email: data.email || null,
      telefono: data.telefono || null,
      tipoId: data.tipoId,
      empresaId: parseInt(empresaId),
    } as any,
  });

  revalidatePath("/entidades");
  return entidad;
}

export async function updateEntidad(
  id: number,
  data: {
    nombre: string;
    cuit?: string;
    nroDoc?: string;
    email?: string;
    telefono?: string;
    tipoId: number;
  }
) {
  const entidad = await prisma.entidad.update({
    where: { id },
    data: {
      nombre: data.nombre,
      cuit: data.cuit || null,
      nroDoc: data.nroDoc || null,
      email: data.email || null,
      telefono: data.telefono || null,
      tipoId: data.tipoId,
    } as any,
  });

  revalidatePath("/entidades");
  return entidad;
}

export async function importEntidadesDocentes(rawRows: any[]) {
  const session = await auth();
  const empresaId = parseInt((session?.user as any)?.empresaId);

  if (!empresaId) throw new Error("Contexto de empresa no configurado.");

  // 1. Get or create 'DOCENTE' type
  let tipoDocente = await prisma.tipoEntidad.findUnique({
    where: { nombre: 'DOCENTE' }
  });

  if (!tipoDocente) {
    tipoDocente = await prisma.tipoEntidad.create({
      data: { nombre: 'DOCENTE' }
    });
  }

  let count = 0;
  for (const row of rawRows) {
    const apellido = String(row.Apellido || "").trim();
    const nombre = String(row.Nombre || "").trim();
    const nombreCompleto = `${apellido} ${nombre}`.trim();

    if (!nombreCompleto) continue;

    const nroDoc = String(row.NroDocumento || "").trim();
    const cuil = String(row.NroCuil || "").trim();

    await prisma.entidad.create({
      data: {
        nombre: nombreCompleto,
        nroDoc: nroDoc || null,
        cuit: cuil || null,
        tipoId: tipoDocente.id,
        empresaId: empresaId,
      } as any
    });
    count++;
  }

  revalidatePath("/entidades");
  return { success: true, count };
}

export async function deleteEntidad(id: number) {
  const docProvCount = await prisma.documentoProveedores.count({
    where: { entidadId: id },
  });
  const docCliCount = await prisma.documentoClientes.count({
    where: { entidadId: id },
  });

  if (docProvCount > 0 || docCliCount > 0) {
    throw new Error("No se puede eliminar una entidad con documentos asociados.");
  }

  await prisma.entidad.delete({
    where: { id },
  });
  revalidatePath("/entidades");
}
