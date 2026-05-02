"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { auditCreate, auditUpdate, auditDelete } from "@/lib/audit/auditLogger";
import { Cuenta, ImportResult } from "@/types/cuenta";

/**
 * Obtiene las cuentas del plan de cuentas para la empresa y ejercicio activo en la sesión.
 * Soporta filtrado por padre para carga diferida en modo jerárquico.
 * 
 * @param parentId - ID de la cuenta padre (null para raíces, undefined para todas).
 * @returns Lista de cuentas ordenadas por código.
 */
export async function getCuentas(parentId?: number | null): Promise<Cuenta[]> {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;
  const ejercicioId = (session?.user as any)?.ejercicioId;

  if (!empresaId || !ejercicioId) return [];

  const results = await prisma.cuenta.findMany({
    where: {
      empresaId: parseInt(empresaId),
      ejercicioId: parseInt(ejercicioId),
      padreId: parentId === undefined ? undefined : parentId,
    },
    include: {
      padre: true,
    },
    orderBy: {
      codigo: "asc",
    },
  });

  return results as unknown as Cuenta[];
}

/**
 * Resuelve automáticamente el ID del padre basándose en el código de la cuenta.
 * Busca la cuenta no imputable más cercana cuyo código sea un prefijo del código dado.
 */
async function resolveParentId(codigo: string, empresaId: number, ejercicioId: number): Promise<number | null> {
  // Obtenemos todas las cuentas no imputables del ejercicio
  const nonImputableCuentas = await prisma.cuenta.findMany({
    where: { empresaId, ejercicioId, imputable: false },
    select: { id: true, codigo: true }
  });

  // Ordenar por longitud de código descendente para encontrar el prefijo más largo (padre más cercano)
  const sortedParents = nonImputableCuentas
    .filter(c => codigo.startsWith(c.codigo) && c.codigo !== codigo)
    .sort((a, b) => b.codigo.length - a.codigo.length);

  return sortedParents[0]?.id || null;
}

/**
 * Crea una nueva cuenta contable, calculando automáticamente su jerarquía.
 */
export async function createCuenta(data: {
  codigo: string;
  codigoCorto?: number | null;
  nombre: string;
  tipo: string;
  imputable: boolean;
  padreId?: number | null;
}): Promise<Cuenta> {
  const session = await auth();
  const empresaId = parseInt((session?.user as any)?.empresaId);
  const ejercicioId = parseInt((session?.user as any)?.ejercicioId);

  if (!empresaId || !ejercicioId) throw new Error("No hay contexto de empresa/ejercicio.");

  // Resolución automática del padre si no se provee o para asegurar consistencia
  const autoPadreId = await resolveParentId(data.codigo, empresaId, ejercicioId);
  const finalPadreId = data.padreId || autoPadreId;

  // Obtener info del padre para heredar path y level
  let parentPath = "/";
  let parentLevel = 0;

  if (finalPadreId) {
    const parent = await prisma.cuenta.findUnique({ where: { id: finalPadreId } });
    if (parent) {
      if (parent.imputable) throw new Error(`La cuenta padre ${parent.codigo} es imputable.`);
      parentPath = parent.path || "/";
      parentLevel = parent.level || 0;
      
      await prisma.cuenta.update({
        where: { id: finalPadreId },
        data: { hasChildren: true }
      });
    }
  }

  const cuenta = await prisma.cuenta.create({
    data: {
      ...data,
      padreId: finalPadreId,
      empresaId,
      ejercicioId,
      level: parentLevel + 1,
    },
  });

  const finalPath = `${parentPath}${cuenta.id}/`;
  const updatedCuenta = await prisma.cuenta.update({
    where: { id: cuenta.id },
    data: { path: finalPath }
  });

  await auditCreate("Cuenta", cuenta.id, updatedCuenta, session?.user?.email, empresaId);
  revalidatePath("/plan-cuentas");
  return updatedCuenta as unknown as Cuenta;
}

/**
 * Actualiza una cuenta contable, validando pertenencia al ejercicio activo.
 * Si el padreId cambia, se recalcula recursivamente la jerarquía de toda la rama.
 * 
 * @param id - ID de la cuenta a actualizar.
 * @param data - Campos a modificar.
 * @returns La cuenta actualizada.
 */
export async function updateCuenta(id: number, data: {
  codigo?: string;
  codigoCorto?: number | null;
  nombre?: string;
  tipo?: string;
  imputable?: boolean;
  padreId?: number | null;
}): Promise<Cuenta> {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;
  const ejercicioId = (session?.user as any)?.ejercicioId;

  if (!empresaId || !ejercicioId) throw new Error("No hay contexto de empresa/ejercicio.");

  const cuentaExistente = await prisma.cuenta.findFirst({
    where: { id, empresaId: parseInt(empresaId), ejercicioId: parseInt(ejercicioId) },
  });

  if (!cuentaExistente) throw new Error("Cuenta no encontrada o sin permisos.");

  // Validar si el ejercicio está cerrado
  const ejercicio = await prisma.ejercicio.findUnique({
    where: { id: parseInt(ejercicioId) },
    select: { cerrado: true, numero: true },
  });
  if (ejercicio?.cerrado) throw new Error(`El ejercicio ${ejercicio.numero} está cerrado.`);

  // Si cambia el código o el padre, recalcular automáticamente
  let finalPadreId = data.padreId;
  if (data.codigo && data.codigo !== cuentaExistente.codigo) {
    finalPadreId = await resolveParentId(data.codigo, parseInt(empresaId), parseInt(ejercicioId));
  }

  let needsHierarchyUpdate = false;
  const oldPadreId = cuentaExistente.padreId;
  const newPadreId = finalPadreId !== undefined ? finalPadreId : oldPadreId;

  if (newPadreId !== oldPadreId) {
    if (newPadreId === id) throw new Error("Una cuenta no puede ser su propio padre.");
    
    // Validar circularidad
    if (newPadreId) {
      const nuevoPadre = await prisma.cuenta.findUnique({ where: { id: newPadreId } });
      if (nuevoPadre?.path?.includes(`/${id}/`)) {
        throw new Error("Movimiento inválido: El nuevo padre es un descendiente de esta cuenta.");
      }
    }
    needsHierarchyUpdate = true;
  }

  const cuenta = await prisma.cuenta.update({
    where: { id },
    data: {
      ...data,
      padreId: finalPadreId
    },
  });

  if (needsHierarchyUpdate) {
    await updateBranchHierarchy(id);
  }

  await auditUpdate("Cuenta", id, cuentaExistente, cuenta, session?.user?.email, parseInt(empresaId));
  revalidatePath("/plan-cuentas");
  return cuenta as unknown as Cuenta;
}

/**
 * Helper interno para actualizar recursivamente path y level de una rama del árbol.
 * Se utiliza cuando una cuenta cambia de padre.
 */
async function updateBranchHierarchy(id: number) {
  const node = await prisma.cuenta.findUnique({ 
    where: { id },
    include: { padre: true }
  });
  
  if (!node) return;

  const parentPath = node.padre?.path || "/";
  const parentLevel = node.padre?.level || 0;
  const currentPath = `${parentPath}${node.id}/`;
  const currentLevel = parentLevel + 1;

  const children = await prisma.cuenta.findMany({ where: { padreId: id } });

  await prisma.cuenta.update({
    where: { id },
    data: {
      path: currentPath,
      level: currentLevel,
      hasChildren: children.length > 0
    }
  });

  // Recursividad
  for (const child of children) {
    await updateBranchHierarchy(child.id);
  }
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
 * Importa un conjunto de cuentas desde filas de un archivo Excel.
 * Reconstruye la jerarquía basándose en los prefijos de los códigos.
 * 
 * @param rawRows - Filas provenientes del Excel.
 * @returns Resultado con el conteo de registros procesados.
 */
export async function importCuentas(rawRows: any[]): Promise<ImportResult> {
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

  const codeToId: { [code: string]: { id: number, imputable: boolean } } = {};
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
        // Solo puede ser padre si no es imputable
        if (!codeToId[existingCode].imputable) {
          if (existingCode.length > longestPrefix.length) {
            longestPrefix = existingCode;
            padreId = codeToId[existingCode].id;
          }
        }
      }
    }

    // Upsert to handle existing
    try {
      // Info del padre (ya procesado por el sort)
      let parentPath = "/";
      let parentLevel = 0;
      if (padreId) {
        const parent = await prisma.cuenta.findUnique({ where: { id: padreId } });
        if (parent) {
          parentPath = parent.path || "/";
          parentLevel = parent.level || 0;
          
          if (!parent.hasChildren) {
            await prisma.cuenta.update({ where: { id: padreId }, data: { hasChildren: true } });
          }
        }
      }

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
          padreId: padreId,
          level: parentLevel + 1
        },
        create: {
          codigo,
          nombre,
          tipo,
          imputable,
          codigoCorto,
          padreId,
          empresaId,
          ejercicioId,
          level: parentLevel + 1
        }
      });

      // Update path
      const finalPath = `${parentPath}${account.id}/`;
      const finalAccount = await prisma.cuenta.update({
        where: { id: account.id },
        data: { path: finalPath }
      });

      codeToId[codigo] = { id: account.id, imputable: account.imputable };
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

import { recalculateHierarchy } from "@/lib/scripts/hierarchy-utils";

export async function fixHierarchyAction() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.roles?.includes("ADMIN");
  if (!isAdmin) throw new Error("No tiene permisos.");
  
  await recalculateHierarchy();
  revalidatePath("/plan-cuentas");
  return { success: true };
}
