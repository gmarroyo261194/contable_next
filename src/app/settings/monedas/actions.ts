"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMonedas() {
  return await prisma.moneda.findMany({
    orderBy: {
      nombre: "asc",
    },
  });
}

export async function createMoneda(data: {
  codigo: string;
  nombre: string;
  simbolo: string;
}) {
  const moneda = await prisma.moneda.create({
    data,
  });
  revalidatePath("/settings/monedas");
  return moneda;
}

export async function updateMoneda(
  id: number,
  data: {
    codigo: string;
    nombre: string;
    simbolo: string;
  }
) {
  const moneda = await prisma.moneda.update({
    where: { id },
    data,
  });
  revalidatePath("/settings/monedas");
  return moneda;
}

export async function deleteMoneda(id: number) {
  // Check if moneda is used in any enterprise or transaction
  const enterpriseCount = await prisma.empresa.count({
    where: { monedaId: id },
  });

  if (enterpriseCount > 0) {
    throw new Error("No se puede eliminar una moneda que está siendo utilizada por una empresa.");
  }

  const transactionCount = await prisma.renglonAsiento.count({
    where: { monedaId: id },
  });

  if (transactionCount > 0) {
    throw new Error("No se puede eliminar una moneda con transacciones registradas.");
  }

  await prisma.moneda.delete({
    where: { id },
  });
  revalidatePath("/settings/monedas");
}
