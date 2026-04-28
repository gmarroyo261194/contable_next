"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { auditCreate, auditUpdate } from "@/lib/audit/auditLogger";

export async function getAsientoById(id: number) {
  const session = await auth();
  const ejercicioId = (session?.user as any)?.ejercicioId;

  if (!ejercicioId) return null;

  const asiento = await prisma.asiento.findFirst({
    where: { id, ejercicioId },
    include: {
      renglones: {
        include: { cuenta: true }
      },
      anulaA: true,
      anulaciones: true,
      pagosGestion: true
    }
  });

  if (!asiento) return null;

  return JSON.parse(JSON.stringify({
    ...asiento,
    renglones: asiento.renglones.map(r => ({
      ...r,
      debe: Number(r.debe),
      haber: Number(r.haber),
      cotizacion: Number(r.cotizacion)
    }))
  }));
}

export async function getAsientos(params: { 
  page?: number, 
  pageSize?: number | 'all',
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  search?: string
} = {}) {
  const session = await auth();
  const ejercicioId = (session?.user as any)?.ejercicioId;

  if (!ejercicioId) return { data: [], total: 0 };

  const { 
    page = 1, 
    pageSize = 10, 
    sortBy = 'numero', 
    sortOrder = 'desc',
    search = ''
  } = params;

  const skip = pageSize === 'all' ? 0 : (page - 1) * Number(pageSize);
  const take = pageSize === 'all' ? undefined : Number(pageSize);

  // Construir filtros
  let where: any = { ejercicioId };
  
  if (search) {
    const searchConditions: any[] = [
      { descripcion: { contains: search } },
      {
        renglones: {
          some: {
            leyenda: { contains: search }
          }
        }
      }
    ];

    // Intentar buscar por número exacto si el search es numérico
    const searchNum = parseFloat(search.replace(',', '.'));
    if (!isNaN(searchNum)) {
      searchConditions.push({ numero: Math.floor(searchNum) });
      searchConditions.push({
        renglones: {
          some: {
            OR: [
              { debe: searchNum },
              { haber: searchNum }
            ]
          }
        }
      });
    }

    // Intentar buscar por fecha si el formato coincide
    // Formato esperado: DD/MM/YYYY o YYYY-MM-DD
    const dateRegex = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/;
    const match = search.match(dateRegex);
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      const year = parseInt(match[3]);
      const searchDate = new Date(year, month - 1, day);
      if (!isNaN(searchDate.getTime())) {
        searchConditions.push({ fecha: searchDate });
      }
    }

    where.OR = searchConditions;
  }

  // Validador de columnas para ordenamiento
  const validSortColumns = ['fecha', 'numero', 'descripcion'];
  const actualSortBy = validSortColumns.includes(sortBy) ? sortBy : 'numero';

  const [asientos, total] = await Promise.all([
    prisma.asiento.findMany({
      where,
      include: {
        renglones: {
          include: {
            cuenta: true,
          },
        },
        anulaA: true,
        anulaciones: true,
        pagosGestion: true,
        ejercicio: {
          include: {
            empresa: true
          }
        }
      },
      orderBy: { [actualSortBy]: sortOrder },
      skip,
      take,
    }),
    prisma.asiento.count({ where })
  ]);

  // Serialización para Client Components
  const serialized = (asientos as any[]).map(asiento => ({
    ...asiento,
    renglones: (asiento.renglones || []).map((r: any) => ({
      ...r,
      debe: Number(r.debe),
      haber: Number(r.haber),
      cotizacion: Number(r.cotizacion),
    }))
  }));

  return {
    data: JSON.parse(JSON.stringify(serialized)),
    total,
    page,
    pageSize
  };
}

export async function getCuentas(prefix?: string) {
  const session = await auth();
  const ejercicioId = (session?.user as any)?.ejercicioId;

  if (!ejercicioId) return [];

  const where: any = { 
    ejercicioId,
    imputable: true 
  };

  if (prefix) {
    where.codigo = { startsWith: prefix };
  }

  return await prisma.cuenta.findMany({
    where,
    orderBy: { codigo: "asc" },
  });
}

import { isModuleEnabled } from "./module-actions";

export async function createAsiento(data: {
  fecha: string;
  descripcion: string;
  renglones: {
    cuentaId: number;
    debe: number;
    haber: number;
    leyenda?: string;
    monedaId?: number;
  }[];
}) {
  const session = await auth();
  const ejercicioId = (session?.user as any)?.ejercicioId;
  const empresaId = (session?.user as any)?.empresaId;
  const userEmail = session?.user?.email;

  if (!ejercicioId || !empresaId) {
    return { error: "No hay sesión activa de ejercicio o empresa." };
  }

  // Validar si el módulo contable está habilitado
  const contabilidadHabilitada = await isModuleEnabled("CONTABILIDAD");
  if (!contabilidadHabilitada) {
    return { error: "El módulo contable está deshabilitado. No se pueden generar asientos." };
  }

  // Validar balance
  const totalDebe = data.renglones.reduce((sum, r) => sum + r.debe, 0);
  const totalHaber = data.renglones.reduce((sum, r) => sum + r.haber, 0);

  if (Math.abs(totalDebe - totalHaber) > 0.01) {
    return { error: "El asiento no está balanceado." };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Validar que el ejercicio no esté cerrado
      const ejercicio = await tx.ejercicio.findUnique({
        where: { id: ejercicioId },
        select: { cerrado: true }
      });

      if (!ejercicio) throw new Error("Ejercicio no encontrado.");
      if (ejercicio.cerrado) return { error: "El ejercicio contable está cerrado. No se permiten modificaciones." };

      // Obtener el último número de asiento para este ejercicio (Bloqueo implícito por transacción)
      const lastAsiento = await tx.asiento.findFirst({
        where: { ejercicioId },
        orderBy: { numero: "desc" },
        select: { numero: true },
      });

      const nextNumero = (lastAsiento?.numero ?? 0) + 1;

      // Obtener la moneda base de la empresa
      const empresa = await tx.empresa.findUnique({
        where: { id: empresaId },
        select: { monedaId: true },
      });

      if (!empresa) throw new Error("Empresa no encontrada.");

      const asiento = await tx.asiento.create({
        data: {
          numero: nextNumero,
          fecha: new Date(data.fecha),
          descripcion: data.descripcion,
          ejercicioId: ejercicioId,
          createdBy: userEmail,
          renglones: {
            create: data.renglones.map((r) => ({
              cuentaId: r.cuentaId,
              debe: r.debe,
              haber: r.haber,
              leyenda: r.leyenda,
              monedaId: r.monedaId || empresa.monedaId,
              cotizacion: 1.0,
              createdBy: userEmail,
            })),
          },
        },
      });

      revalidatePath("/asientos");
      // JSON.parse(JSON.stringify()) is a safe way to ensure it's a plain object
      const result = JSON.parse(JSON.stringify(asiento));

      // Registrar creación en el log de auditoría
      await auditCreate("Asiento", asiento.id, result, userEmail, empresaId);

      return { success: true, asiento: result };
    });
  } catch (error) {
    console.error("Error creating asiento:", error);
    return { error: "Error al crear el asiento contable." };
  }
}

export async function anularAsiento(asientoId: number) {
  const session = await auth();
  const ejercicioId = (session?.user as any)?.ejercicioId;
  const userEmail = session?.user?.email;

  if (!ejercicioId) return { error: "No hay sesión activa." };

  const contabilidadHabilitada = await isModuleEnabled("CONTABILIDAD");
  if (!contabilidadHabilitada) {
    return { error: "El módulo contable está deshabilitado." };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Validar que el ejercicio no esté cerrado
      const ejercicio = await tx.ejercicio.findUnique({
        where: { id: ejercicioId },
        select: { cerrado: true }
      });

      if (!ejercicio) throw new Error("Ejercicio no encontrado.");
      if (ejercicio.cerrado) return { error: "El ejercicio contable está cerrado. No se puede anular en este período." };

      // 1. Buscar el asiento original validando que pertenezca al ejercicio activo
      const original = await tx.asiento.findFirst({
        where: { id: asientoId, ejercicioId },
        include: { renglones: true },
      });

      if (!original) return { error: "Asiento no encontrado en el ejercicio activo." };

      // 2. Generar contra asiento
      const lastAsiento = await tx.asiento.findFirst({
        where: { ejercicioId },
        orderBy: { numero: "desc" },
        select: { numero: true },
      });

      const nextNumero = (lastAsiento?.numero ?? 0) + 1;

      const contraAsiento = await tx.asiento.create({
        data: {
          numero: nextNumero,
          fecha: new Date(),
          descripcion: `ANULACION ASIENTO Nº ${original.numero}: ${original.descripcion}`,
          ejercicioId: ejercicioId,
          createdBy: userEmail,
          anulaAId: original.id, // VINCULO
          renglones: {
            create: original.renglones.map((r) => ({
              cuentaId: r.cuentaId,
              debe: Number(r.haber), // INVERTIDO
              haber: Number(r.debe), // INVERTIDO
              leyenda: `Anulación Asiento ${original.numero}`,
              monedaId: r.monedaId,
              cotizacion: Number(r.cotizacion),
              createdBy: userEmail,
            })),
          },
        },
      });

      revalidatePath("/asientos");
      return { success: true, contraAsiento: JSON.parse(JSON.stringify(contraAsiento)) };
    });
  } catch (error) {
    console.error("Error anular asiento:", error);
    return { error: "Error al anular el asiento." };
  }
}

export async function updateAsiento(id: number, data: {
  fecha: string;
  descripcion: string;
  renglones: {
    cuentaId: number;
    debe: number;
    haber: number;
    leyenda?: string;
    monedaId?: number;
  }[];
}) {
  const session = await auth();
  const ejercicioId = (session?.user as any)?.ejercicioId;
  const empresaId = (session?.user as any)?.empresaId;
  const userEmail = session?.user?.email;

  if (!ejercicioId || !empresaId) return { error: "No hay sesión activa." };

  const contabilidadHabilitada = await isModuleEnabled("CONTABILIDAD");
  if (!contabilidadHabilitada) {
    return { error: "El módulo contable está deshabilitado." };
  }

  // Validar balance
  const totalDebe = data.renglones.reduce((sum, r) => sum + r.debe, 0);
  const totalHaber = data.renglones.reduce((sum, r) => sum + r.haber, 0);

  if (Math.abs(totalDebe - totalHaber) > 0.01) {
    return { error: "El asiento no está balanceado." };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Validar que el ejercicio no esté cerrado
      const ejercicio = await tx.ejercicio.findUnique({
        where: { id: ejercicioId },
        select: { cerrado: true }
      });

      if (!ejercicio) throw new Error("Ejercicio no encontrado.");
      if (ejercicio.cerrado) return { error: "El ejercicio contable está cerrado. No se permiten ediciones." };

      // 1. Verificar existencia y pertenencia al ejercicio activo
      const existing = await tx.asiento.findFirst({
        where: { id, ejercicioId },
        include: { renglones: true }
      });

      if (!existing) throw new Error("Asiento no encontrado en el ejercicio activo.");

      // Obtener la moneda base de la empresa
      const empresa = await tx.empresa.findUnique({
        where: { id: empresaId },
        select: { monedaId: true },
      });

      if (!empresa) throw new Error("Empresa no encontrada.");

      // 2. Eliminar renglones anteriores
      await tx.renglonAsiento.deleteMany({
        where: { asientoId: id }
      });

      // 3. Actualizar cabecera (excluyendo el número)
      const updated = await tx.asiento.update({
        where: { id },
        data: {
          fecha: new Date(data.fecha),
          descripcion: data.descripcion,
          updatedBy: userEmail,
          renglones: {
            create: data.renglones.map((r) => ({
              cuentaId: r.cuentaId,
              debe: r.debe,
              haber: r.haber,
              leyenda: r.leyenda,
              monedaId: r.monedaId || empresa.monedaId, 
              cotizacion: 1.0,
              createdBy: userEmail,
            })),
          },
        },
      });

      revalidatePath("/asientos");
      const updatedResult = JSON.parse(JSON.stringify(updated));

      // Registrar edición con snapshot del estado anterior (cabecera) vs nuevo
      await auditUpdate("Asiento", id, existing, updatedResult, userEmail, empresaId);

      return { success: true, asiento: updatedResult };
    });
  } catch (error) {
    console.error("Error updating asiento:", error);
    return { error: "Error al actualizar el asiento contable." };
  }
}

