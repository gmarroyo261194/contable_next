"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Obtiene todos los rubros.
 * @returns {Promise<any[]>} Listado de rubros.
 */
export async function getRubros() {
  const rubros = await prisma.rubro.findMany({
    orderBy: { nombre: 'asc' }
  });
  return JSON.parse(JSON.stringify(rubros));
}

/**
 * Crea o actualiza un rubro.
 * @param {any} data - Datos del rubro (id, nombre, activo).
 */
export async function upsertRubro(data: {
  id?: number;
  nombre: string;
  activo: boolean;
}) {
  const { id, nombre, activo } = data;

  const result = id
    ? await prisma.rubro.update({
        where: { id },
        data: { nombre, activo }
      })
    : await prisma.rubro.create({
        data: { nombre, activo }
      });

  revalidatePath("/settings/rubros-servicios");
  return JSON.parse(JSON.stringify(result));
}

/**
 * Cambia el estado de un rubro.
 * @param {number} id - ID del rubro.
 * @param {boolean} activo - Nuevo estado.
 */
export async function toggleRubro(id: number, activo: boolean) {
  const result = await prisma.rubro.update({
    where: { id },
    data: { activo }
  });
  revalidatePath("/settings/rubros-servicios");
  return JSON.parse(JSON.stringify(result));
}
