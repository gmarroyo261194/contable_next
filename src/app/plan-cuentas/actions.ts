"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { auditCreate, auditUpdate, auditDelete } from "@/lib/audit/auditLogger";

/**
 * Obtiene las cuentas del plan de cuentas para la empresa y ejercicio activo en la sesión.
 * @returns Lista de cuentas del ejercicio activo, ordenadas por código.
 */
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

/**
 * Crea una nueva cuenta contable en el ejercicio activo de la sesión.
 * @param data - Datos de la cuenta a crear.
 * @returns La cuenta creada.
 */
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

  // Registrar creación en el log de auditoría
  await auditCreate("Cuenta", cuenta.id, cuenta, session?.user?.email, parseInt(empresaId));

  revalidatePath("/plan-cuentas");
  return cuenta;
}

/**
 * Actualiza una cuenta contable, validando que pertenezca al ejercicio activo.
 * Esto garantiza que no se puedan modificar cuentas de ejercicios pasados (cerrados).
 * @param id - ID de la cuenta a actualizar.
 * @param data - Campos a actualizar (nombre, tipo, imputable, etc.).
 * @returns La cuenta actualizada.
 */
export async function updateCuenta(id: number, data: {
  codigo?: string;
  codigoCorto?: number | null;
  nombre?: string;
  tipo?: string;
  imputable?: boolean;
  padreId?: number | null;
}) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;
  const ejercicioId = (session?.user as any)?.ejercicioId;

  if (!empresaId || !ejercicioId) throw new Error("No hay contexto de empresa/ejercicio.");

  // Validar que la cuenta pertenece al ejercicio y empresa activos en sesión
  const cuentaExistente = await prisma.cuenta.findFirst({
    where: {
      id,
      empresaId: parseInt(empresaId),
      ejercicioId: parseInt(ejercicioId),
    },
  });

  if (!cuentaExistente) {
    throw new Error(
      "No se puede modificar esta cuenta. No pertenece al ejercicio activo o no tiene permisos."
    );
  }

  // Verificar que el ejercicio no esté cerrado
  const ejercicio = await prisma.ejercicio.findUnique({
    where: { id: parseInt(ejercicioId) },
    select: { cerrado: true, numero: true },
  });

  if (ejercicio?.cerrado) {
    throw new Error(
      `El ejercicio ${ejercicio.numero} está cerrado. No se puede modificar su plan de cuentas.`
    );
  }

  const cuenta = await prisma.cuenta.update({
    where: { id },
    data,
  });

  // Registrar modificación con snapshot de valores anteriores y nuevos
  await auditUpdate("Cuenta", id, cuentaExistente, cuenta, session?.user?.email, parseInt(empresaId));

  revalidatePath("/plan-cuentas");
  return cuenta;
}

/**
 * Elimina una cuenta contable, validando que pertenezca al ejercicio activo y no tenga movimientos.
 * Garantiza que cuentas de ejercicios pasados no puedan eliminarse.
 * @param id - ID de la cuenta a eliminar.
 */
export async function deleteCuenta(id: number) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;
  const ejercicioId = (session?.user as any)?.ejercicioId;

  if (!empresaId || !ejercicioId) throw new Error("No hay contexto de empresa/ejercicio.");

  // Validar que la cuenta pertenece al ejercicio y empresa activos en sesión
  const cuentaExistente = await prisma.cuenta.findFirst({
    where: {
      id,
      empresaId: parseInt(empresaId),
      ejercicioId: parseInt(ejercicioId),
    },
  });

  if (!cuentaExistente) {
    throw new Error(
      "No se puede eliminar esta cuenta. No pertenece al ejercicio activo o no tiene permisos."
    );
  }

  // Verificar que el ejercicio no esté cerrado
  const ejercicio = await prisma.ejercicio.findUnique({
    where: { id: parseInt(ejercicioId) },
    select: { cerrado: true, numero: true },
  });

  if (ejercicio?.cerrado) {
    throw new Error(
      `El ejercicio ${ejercicio.numero} está cerrado. No se puede modificar su plan de cuentas.`
    );
  }

  // Verificar que no tenga subcuentas hijas
  const hijosCount = await prisma.cuenta.count({
    where: { padreId: id },
  });

  if (hijosCount > 0) {
    throw new Error("No se puede eliminar una cuenta que tiene subcuentas.");
  }

  // Verificar que no tenga movimientos contables en el ejercicio activo
  const renglonesCount = await prisma.renglonAsiento.count({
    where: { cuentaId: id },
  });

  if (renglonesCount > 0) {
    throw new Error("No se puede eliminar una cuenta con movimientos contables registrados.");
  }

  // Guardar snapshot antes de eliminar para el log de auditoría
  await auditDelete("Cuenta", id, cuentaExistente, session?.user?.email, parseInt(empresaId));

  await prisma.cuenta.delete({
    where: { id },
  });

  revalidatePath("/plan-cuentas");
}

/**
 * Importa un conjunto de cuentas desde filas crudas (típicamente de un Excel).
 * Las cuentas se crean o actualizan en el ejercicio activo de la sesión.
 * @param rawRows - Filas con los datos de las cuentas a importar.
 * @returns Resultado de la importación con el conteo de cuentas procesadas.
 */
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
    "2": "RESULTADO",
    "3": "PATRIMONIO_NETO",
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

/**
 * Importa el plan de cuentas desde la base de datos legacy (ContableFundacion)
 * para el ejercicio activo en la sesión.
 * @returns Resultado de la importación.
 */
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
