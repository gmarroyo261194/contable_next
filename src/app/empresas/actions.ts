"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getEmpresas() {
  return await prisma.empresa.findMany({
    include: {
      moneda: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getMonedas() {
  return await prisma.moneda.findMany({
    orderBy: {
      nombre: "asc",
    },
  });
}

export async function createEmpresa(data: {
  nombre: string;
  cuit: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  monedaId: number;
}) {
  const empresa = await prisma.empresa.create({
    data: {
      nombre: data.nombre,
      cuit: data.cuit,
      direccion: data.direccion,
      telefono: data.telefono,
      email: data.email,
      monedaId: data.monedaId,
    },
  });
  revalidatePath("/empresas");
  return empresa;
}

export async function updateEmpresa(
  id: number,
  data: {
    nombre: string;
    cuit: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    monedaId: number;
  }
) {
  const empresa = await prisma.empresa.update({
    where: { id },
    data: {
      nombre: data.nombre,
      cuit: data.cuit,
      direccion: data.direccion,
      telefono: data.telefono,
      email: data.email,
      monedaId: data.monedaId,
    },
  });
  revalidatePath("/empresas");
  return empresa;
}

export async function deleteEmpresa(id: number) {
  await prisma.empresa.delete({
    where: { id },
  });
  revalidatePath("/empresas");
}
