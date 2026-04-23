'use server';

import prisma from '@/lib/prisma';

/**
 * Obtiene el listado de entidades (clientes/proveedores) para búsqueda.
 */
export async function getEntidades() {
  try {
    const entidades = await prisma.entidad.findMany({
      select: {
        id: true,
        nombre: true,
        cuit: true,
        nroDoc: true,
        condicionIva: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    return entidades;
  } catch (error) {
    console.error("Error al obtener entidades:", error);
    return [];
  }
}
