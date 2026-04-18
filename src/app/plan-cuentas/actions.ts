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

  console.log(`Iniciando importación de ${rawRows.length} cuentas...`);

  // Ordenar las filas por longitud de código para asegurar que los padres aparezcan antes que los hijos
  const sortedRows = [...rawRows].sort((a, b) => {
    const colA = String(a.codigoCta || "");
    const colB = String(b.codigoCta || "");
    return colA.length - colB.length || colA.localeCompare(colB);
  });

  const mapCapitulo: { [key: string]: string } = {
    "0": "ACTIVO",
    "1": "PASIVO",
    "2": "RESULTADO", // User said "2 = RESULTADO"
    "3": "PATRIMONIO_NETO", // Missing in prompt but standard
    "4": "CUENTAS TRANSITORIAS"
  };

  const codeToId: { [code: string]: number } = {};
  let count = 0;

  // Validate IDs
    if (isNaN(empresaId) || isNaN(ejercicioId)) {
      console.error("Invalid context IDs:", { empresaId, ejercicioId });
      throw new Error("ID de empresa o ejercicio inválido.");
    }

    // Process rows
    for (const row of sortedRows) {
      const codigo = String(row.codigoCta || "").trim();
      if (!codigo) continue; // Skip empty rows

      const nombre = String(row.nombreCta || "").trim();
      
      let codigoCorto: number | null = null;
      if (row.codigoAlt && row.codigoAlt !== "NULL") {
        const parsedAlt = parseInt(row.codigoAlt);
        if (!isNaN(parsedAlt)) codigoCorto = parsedAlt;
      }

      const tipo = mapCapitulo[String(row.capitulo)] || "ACTIVO";
      const imputable = String(row.imputable) === "-1" || String(row.imputable).toUpperCase() === "S";

      // Find parentId logic
      let padreId: number | null = null;
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
      try {
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
            padreId: padreId
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
      } catch (err: any) {
        console.error(`Error upserting account ${codigo}:`, {
          nombre,
          padreId,
          empresaId,
          ejercicioId,
          errorMessage: err.message,
          errorCode: err.code,
          meta: err.meta
        });
        throw new Error(`Error en cuenta ${codigo}: ${err.message}`);
      }
    }

  revalidatePath("/plan-cuentas");
  return { success: true, count, message: `Se importaron ${count} cuentas correctamente.` };
}

export async function importCuentasLegacy() {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;
  const ejercicioId = (session?.user as any)?.ejercicioId;

  if (!empresaId || !ejercicioId) throw new Error("Contexto no configurado.");

  try {
    // 0. Obtener el número de ejercicio actual
    const ejercicioActual = await prisma.ejercicio.findUnique({
      where: { id: parseInt(ejercicioId) },
      select: { numero: true }
    });

    if (!ejercicioActual) throw new Error("Ejercicio no encontrado.");
    const anio = ejercicioActual.numero;

    // 1. Obtener cuentas de la base vieja
    const rawRows: any[] = await prisma.$queryRawUnsafe(`
      SELECT codigoCta, nombreCta, codigoAlt, capitulo, imputable
      FROM [ContableFundacion].[dbo].[PlanCtaEjercicio]
      WHERE ejercicio = ${anio}
    `);

    if (rawRows.length === 0) {
      return { success: false, message: `No se encontró un plan de cuentas para el ejercicio ${anio} en la base legacy.` };
    }

    // 2. Usar la lógica de importación existente
    // Adaptamos imputable: -1 es imputable en legacy
    const processedRows = rawRows.map(row => ({
      ...row,
      imputable: String(row.imputable) === "-1" ? "-1" : "0"
    }));

    return await importCuentas(processedRows);

  } catch (error: any) {
    console.error("Legacy Import Error:", error);
    throw new Error(error.message || "Error al importar el plan de cuentas legacy.");
  }
}
