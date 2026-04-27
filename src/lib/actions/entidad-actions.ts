'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * Obtiene el listado de entidades (clientes/proveedores) de la empresa activa en sesión.
 * Este helper es usado por componentes como el selector de asientos, donde solo
 * se necesitan los campos básicos para búsqueda/autocomplete.
 */
export async function getEntidades() {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) return [];

  try {
    const entidades = await prisma.entidad.findMany({
      where: {
        empresaId,
      },
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
