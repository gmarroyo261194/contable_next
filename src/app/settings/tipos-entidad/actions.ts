"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTiposEntidad() {
  return await prisma.tipoEntidad.findMany({
    orderBy: {
      nombre: "asc",
    },
  });
}

export async function createTipoEntidad(data: { nombre: string }) {
  const tipo = await prisma.tipoEntidad.create({
    data,
  });
  revalidatePath("/settings/tipos-entidad");
  revalidatePath("/entidades");
  return tipo;
}

export async function updateTipoEntidad(id: number, data: { nombre: string }) {
  const tipo = await prisma.tipoEntidad.update({
    where: { id },
    data,
  });
  revalidatePath("/settings/tipos-entidad");
  revalidatePath("/entidades");
  return tipo;
}

export async function deleteTipoEntidad(id: number) {
  // Check if used
  const count = await prisma.entidad.count({
    where: { tipoId: id },
  });

  if (count > 0) {
    throw new Error("No se puede eliminar un tipo de entidad que está siendo utilizado.");
  }

  await prisma.tipoEntidad.delete({
    where: { id },
  });
  revalidatePath("/settings/tipos-entidad");
  revalidatePath("/entidades");
}
