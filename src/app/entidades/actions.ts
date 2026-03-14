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
  cuit: string;
  tipoId: number;
}) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) throw new Error("No hay una empresa activa seleccionada.");

  const entidad = await prisma.entidad.create({
    data: {
      nombre: data.nombre,
      cuit: data.cuit,
      tipoId: data.tipoId,
      empresaId: parseInt(empresaId),
    },
  });

  revalidatePath("/entidades");
  return entidad;
}

export async function updateEntidad(
  id: number,
  data: {
    nombre: string;
    cuit: string;
    tipoId: number;
  }
) {
  const entidad = await prisma.entidad.update({
    where: { id },
    data: {
      nombre: data.nombre,
      cuit: data.cuit,
      tipoId: data.tipoId,
    },
  });

  revalidatePath("/entidades");
  return entidad;
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
