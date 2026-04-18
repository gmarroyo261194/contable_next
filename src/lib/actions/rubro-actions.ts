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

/**
 * Elimina un rubro de la base de datos si no tiene servicios asociados.
 * @param {number} id - ID del rubro a eliminar.
 * @throws {Error} Si el rubro tiene servicios asociados.
 */
export async function deleteRubro(id: number) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buscamos los servicios asociados para borrar sus configs
      const servicios = await tx.servicio.findMany({
        where: { rubroId: id },
        select: { id: true }
      });
      
      const servicioIds = servicios.map(s => s.id);

      if (servicioIds.length > 0) {
        // 2. Borramos configs de los servicios del rubro
        await tx.servicioConfig.deleteMany({
          where: { servicioId: { in: servicioIds } }
        });

        // 3. Borramos los servicios del rubro
        await tx.servicio.deleteMany({
          where: { rubroId: id }
        });
      }

      // 4. Borramos el rubro
      return await tx.rubro.delete({
        where: { id }
      });
    });

    revalidatePath("/settings/rubros-servicios");
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    console.error("Error al eliminar rubro:", error);
    return { success: false, error: "Error al eliminar el rubro y sus servicios dependientes." };
  }
}
