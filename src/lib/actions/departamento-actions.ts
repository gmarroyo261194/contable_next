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

/**
 * Elimina un departamento si no tiene servicios asociados.
 * @param {number} id - ID del departamento.
 * @throws {Error} Si el departamento tiene servicios asociados.
 */
export async function deleteDepartamento(id: number) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Desligamos los servicios asociados (poniéndolos en null ya que es opcional)
      await tx.servicio.updateMany({
        where: { departamentoId: id },
        data: { departamentoId: null }
      });

      // 2. Borramos el departamento
      return await tx.departamento.delete({
        where: { id }
      });
    });

    revalidatePath("/settings/rubros-servicios");
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    console.error("Error al eliminar departamento:", error);
    return { success: false, error: "Error al eliminar el departamento." };
  }
}
