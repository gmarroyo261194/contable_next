"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { auditCreate, auditUpdate, auditDelete } from "@/lib/audit/auditLogger";

/**
 * Obtiene los rubros habilitados para el usuario actual.
 */
export async function getRubros() {
  const session = await auth();
  const userId = session?.user?.id;
  const roles: string[] = (session?.user as any)?.roles || [];
  const isAdmin = roles.some(role => 
    role.toLowerCase() === 'admin' || 
    role.toLowerCase() === 'superadmin' || 
    role.toLowerCase() === 'administrador'
  );

  if (isAdmin) {
    const rubros = await prisma.rubro.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
    return JSON.parse(JSON.stringify(rubros));
  }

  const userRubros = await prisma.userRubro.findMany({
    where: { userId },
    include: { rubro: true }
  });

  const rubros = userRubros
    .map(ur => ur.rubro)
    .filter(r => r.activo)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

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
  const session = await auth();
  const userEmail = session?.user?.email;
  const empresaId = (session?.user as any)?.empresaId;

  // 0. Obtener para auditoría si es edición
  const existing = id ? await prisma.rubro.findUnique({ where: { id } }) : null;

  const result = id
    ? await prisma.rubro.update({
        where: { id },
        data: { nombre, activo }
      })
    : await prisma.rubro.create({
        data: { nombre, activo }
      });

  if (empresaId) {
    if (id && existing) {
      await auditUpdate("Rubro", id, existing, result, userEmail, empresaId);
    } else {
      await auditCreate("Rubro", result.id, result, userEmail, empresaId);
    }
  }

  revalidatePath("/settings/rubros-servicios");
  return JSON.parse(JSON.stringify(result));
}

export async function toggleRubro(id: number, activo: boolean) {
  const session = await auth();
  const userEmail = session?.user?.email;
  const empresaId = (session?.user as any)?.empresaId;

  const existing = await prisma.rubro.findUnique({ where: { id } });

  const result = await prisma.rubro.update({
    where: { id },
    data: { activo }
  });

  if (empresaId) {
    await auditUpdate("Rubro", id, existing, result, userEmail, empresaId);
  }

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
    const session = await auth();
    const userEmail = session?.user?.email;
    const empresaId = (session?.user as any)?.empresaId;

    const result = await prisma.$transaction(async (tx) => {
      // 0. Obtener para auditoría
      const existing = await tx.rubro.findUnique({ where: { id } });

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
      const deleted = await tx.rubro.delete({
        where: { id }
      });

      if (empresaId && existing) {
        await auditDelete("Rubro", id, existing, userEmail, empresaId);
      }

      return deleted;
    });

    revalidatePath("/settings/rubros-servicios");
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    console.error("Error al eliminar rubro:", error);
    return { success: false, error: "Error al eliminar el rubro y sus servicios dependientes." };
  }
}
