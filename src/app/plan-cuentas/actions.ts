"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getCuentas() {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;
  const ejercicioId = (session?.user as any)?.ejercicioId;

  if (!empresaId || !ejercicioId) return [];

  return await prisma.cuenta.findMany({
    where: {
      empresaId: parseInt(empresaId),
      ejercicioId: parseInt(ejercicioId),
    },
    include: {
      padre: true,
    },
    orderBy: {
      codigo: "asc",
    },
  });
}

export async function createCuenta(data: {
  codigo: string;
  codigoCorto?: number;
  nombre: string;
  tipo: string;
  imputable: boolean;
  padreId?: number;
}) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;
  const ejercicioId = (session?.user as any)?.ejercicioId;

  if (!empresaId || !ejercicioId) throw new Error("No hay contexto de empresa/ejercicio.");

  const cuenta = await prisma.cuenta.create({
    data: {
      ...data,
      empresaId: parseInt(empresaId),
      ejercicioId: parseInt(ejercicioId),
    },
  });

  revalidatePath("/plan-cuentas");
  return cuenta;
}

export async function updateCuenta(id: number, data: any) {
  const cuenta = await prisma.cuenta.update({
    where: { id },
    data,
  });
  revalidatePath("/plan-cuentas");
  return cuenta;
}

export async function deleteCuenta(id: number) {
  // Check if it has children
  const hijosCount = await prisma.cuenta.count({
    where: { padreId: id },
  });

  if (hijosCount > 0) {
    throw new Error("No se puede eliminar una cuenta que tiene subcuentas.");
  }

  // Check if used in journal entries
  const renglonesCount = await prisma.renglonAsiento.count({
    where: { cuentaId: id },
  });

  if (renglonesCount > 0) {
    throw new Error("No se puede eliminar una cuenta con movimientos contables.");
  }

  await prisma.cuenta.delete({
    where: { id },
  });
  revalidatePath("/plan-cuentas");
}

export async function importCuentas(rawRows: any[]) {
  const session = await auth();
  const empresaId = parseInt((session?.user as any)?.empresaId);
  const ejercicioId = parseInt((session?.user as any)?.ejercicioId);

  if (!empresaId || !ejercicioId) throw new Error("Contexto no configurado.");

  // Delete existing ones for this context before importing? 
  // User didn't specify, but usually import means start fresh or merge. 
  // Let's assume merge/update if exists, but for simplicity of padreId calculation, 
  // we'll process them in order.

  const mapCapitulo: { [key: string]: string } = {
    "0": "ACTIVO",
    "1": "PASIVO",
    "2": "RESULTADO", // User said "2 = RESULTADO"
    "3": "PATRIMONIO_NETO", // Missing in prompt but standard
    "4": "CUENTAS TRANSITORIAS"
  };

  const codeToId: { [code: string]: number } = {};
  let count = 0;

  // Process rows
  for (const row of rawRows) {
    const codigo = String(row.codigoCta).trim();
    const nombre = String(row.nombreCta).trim();
    const codigoCorto = row.codigoAlt && row.codigoAlt !== "NULL" ? parseInt(row.codigoAlt) : null;
    const tipo = mapCapitulo[String(row.capitulo)] || "ACTIVO";
    const imputable = String(row.imputable) === "-1" || String(row.imputable).toUpperCase() === "S";

    // Find parentId logic:
    // We look for a previous code that is a prefix of this one.
    // Since rows usually come level by level: 100, 110, 111...
    // The parent is the longest prefix in codeToId.
    let padreId: number | undefined = undefined;
    let longestPrefix = "";

    for (const existingCode of Object.keys(codeToId)) {
      if (codigo.startsWith(existingCode) && existingCode !== codigo) {
        if (existingCode.length > longestPrefix.length) {
          longestPrefix = existingCode;
          padreId = codeToId[existingCode];
        }
      }
    }

    // Upsert to handle existing
    const account = await prisma.cuenta.upsert({
      where: {
        codigo_ejercicioId: {
          codigo,
          ejercicioId
        }
      },
      update: {
        nombre,
        tipo,
        imputable,
        codigoCorto,
        padreId
      },
      create: {
        codigo,
        nombre,
        tipo,
        imputable,
        codigoCorto,
        padreId,
        empresaId,
        ejercicioId
      }
    });

    codeToId[codigo] = account.id;
    count++;
  }

  revalidatePath("/plan-cuentas");
  return { success: true, count };
}
