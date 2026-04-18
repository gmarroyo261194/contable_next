"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Obtiene todos los departamentos.
 * @returns {Promise<any[]>} Listado de departamentos.
 */
export async function getDepartamentos() {
  const departamentos = await prisma.departamento.findMany({
    orderBy: { nombre: 'asc' }
  });
  return JSON.parse(JSON.stringify(departamentos));
}

/**
 * Crea o actualiza un departamento.
 * @param {any} data - Datos del departamento (id, nombre, activo).
 */
export async function upsertDepartamento(data: {
  id?: number;
  nombre: string;
  activo: boolean;
}) {
  const { id, nombre, activo } = data;

  const result = id
    ? await prisma.departamento.update({
        where: { id },
        data: { nombre, activo }
      })
    : await prisma.departamento.create({
        data: { nombre, activo }
      });

  revalidatePath("/settings/rubros-servicios");
  return JSON.parse(JSON.stringify(result));
}

/**
 * Cambia el estado de un departamento.
 * @param {number} id - ID del departamento.
 * @param {boolean} activo - Nuevo estado.
 */
export async function toggleDepartamento(id: number, activo: boolean) {
  const result = await prisma.departamento.update({
    where: { id },
    data: { activo }
  });
  revalidatePath("/settings/rubros-servicios");
  return JSON.parse(JSON.stringify(result));
}
