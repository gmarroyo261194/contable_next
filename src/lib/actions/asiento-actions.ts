"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getAsientoById(id: number) {
  const session = await auth();
  if (!session) return null;

  const asiento = await db.asiento.findUnique({
    where: { id },
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
    db.asiento.findMany({
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
      },
      orderBy: { [actualSortBy]: sortOrder },
      skip,
      take,
    }),
    db.asiento.count({ where })
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

export async function getCuentas() {
  const session = await auth();
  const ejercicioId = (session?.user as any)?.ejercicioId;

  if (!ejercicioId) return [];

  return await db.cuenta.findMany({
    where: { 
      ejercicioId,
      imputable: true 
    },
    orderBy: { codigo: "asc" },
  });
}

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

  // Validar balance
  const totalDebe = data.renglones.reduce((sum, r) => sum + r.debe, 0);
  const totalHaber = data.renglones.reduce((sum, r) => sum + r.haber, 0);

  if (Math.abs(totalDebe - totalHaber) > 0.01) {
    return { error: "El asiento no está balanceado." };
  }

  try {
    return await db.$transaction(async (tx) => {
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
      return { success: true, asiento: JSON.parse(JSON.stringify(asiento)) };
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

  try {
    return await db.$transaction(async (tx) => {
      // 1. Buscar el asiento original
      const original = await tx.asiento.findUnique({
        where: { id: asientoId },
        include: { renglones: true },
      });

      if (!original) return { error: "Asiento no encontrado." };

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

  // Validar balance
  const totalDebe = data.renglones.reduce((sum, r) => sum + r.debe, 0);
  const totalHaber = data.renglones.reduce((sum, r) => sum + r.haber, 0);

  if (Math.abs(totalDebe - totalHaber) > 0.01) {
    return { error: "El asiento no está balanceado." };
  }

  try {
    return await db.$transaction(async (tx) => {
      // 1. Verificar existencia
      const existing = await tx.asiento.findUnique({
        where: { id },
        include: { renglones: true }
      });

      if (!existing) throw new Error("Asiento no encontrado.");

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
      return { success: true, asiento: JSON.parse(JSON.stringify(updated)) };
    });
  } catch (error) {
    console.error("Error updating asiento:", error);
    return { error: "Error al actualizar el asiento contable." };
  }
}

