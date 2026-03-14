"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getEjercicios() {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) return [];

  return await prisma.ejercicio.findMany({
    where: {
      empresaId: parseInt(empresaId),
    },
    orderBy: {
      numero: "desc",
    },
  });
}

export async function createEjercicio(data: {
  numero: number;
  inicio: Date;
  fin: Date;
}) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) throw new Error("No hay una empresa activa seleccionada.");

  const ejercicio = await prisma.ejercicio.create({
    data: {
      numero: data.numero,
      inicio: data.inicio,
      fin: data.fin,
      empresaId: parseInt(empresaId),
      cerrado: false,
    },
  });

  revalidatePath("/ejercicios");
  return ejercicio;
}

export async function updateEjercicio(
  id: number,
  data: {
    numero: number;
    inicio: Date;
    fin: Date;
    cerrado: boolean;
  }
) {
  const ejercicio = await prisma.ejercicio.update({
    where: { id },
    data,
  });

  revalidatePath("/ejercicios");
  return ejercicio;
}

export async function deleteEjercicio(id: number) {
  const asientoCount = await prisma.asiento.count({
    where: { ejercicioId: id },
  });

  if (asientoCount > 0) {
    throw new Error("No se puede eliminar un ejercicio que ya tiene asientos contables registrados.");
  }

  await prisma.ejercicio.delete({
    where: { id },
  });
  revalidatePath("/ejercicios");
}

export async function toggleCerrarEjercicio(id: number, cerrado: boolean) {
  await prisma.ejercicio.update({
    where: { id },
    data: { cerrado },
  });
  revalidatePath("/ejercicios");
}
