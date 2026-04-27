"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { auditCreate, auditUpdate, auditDelete } from "@/lib/audit/auditLogger";

/**
 * Obtiene todos los servicios con su configuración para la empresa actual.
 * @param {number} empresaId - ID de la empresa activa.
 * @returns {Promise<any[]>} Listado de servicios con rubro, departamento y config.
 */
export async function getServicios(empresaId: number) {
  const servicios = await prisma.servicio.findMany({
    include: {
      rubro: true,
      departamento: true,
      configs: {
        where: { empresaId },
        include: {
          cuentaFundacionImputar: {
            select: { id: true, nombre: true, codigo: true, codigoCorto: true }
          },
          cuentaFundacionRetener: {
            select: { id: true, nombre: true, codigo: true, codigoCorto: true }
          },
          cuentaDeptoImputar: {
            select: { id: true, nombre: true, codigo: true, codigoCorto: true }
          },
          cuentaDeptoRetener: {
            select: { id: true, nombre: true, codigo: true, codigoCorto: true }
          },
          cuentaIngresos: {
            select: { id: true, nombre: true, codigo: true, codigoCorto: true }
          }
        }
      }
    },
    orderBy: { nombre: 'asc' }
  });

  return JSON.parse(JSON.stringify(servicios));
}

/**
 * Crea o actualiza un servicio y su configuración específica de empresa.
 * @param {any} data - Datos del servicio y configuración contable.
 */
export async function upsertServicio(data: {
  id?: number;
  nombre: string;
  activo: boolean;
  rubroId: number;
  departamentoId?: number | null;
  participacionFundacion: boolean;
  porcentajeFundacion?: number | null;
  participacionDepto: boolean;
  porcentajeDepto?: number | null;
  empresaId: number;
  config?: {
    cuentaFundacionImputarId?: number | null;
    cuentaFundacionRetenerId?: number | null;
    cuentaDeptoImputarId?: number | null;
    cuentaDeptoRetenerId?: number | null;
    cuentaIngresosId?: number | null;
  }
}) {
  const { 
    id, 
    nombre, 
    activo, 
    rubroId, 
    departamentoId, 
    participacionFundacion, 
    porcentajeFundacion, 
    participacionDepto, 
    porcentajeDepto, 
    empresaId, 
    config 
  } = data;

  const session = await auth();
  const userEmail = session?.user?.email;

  const result = await prisma.$transaction(async (tx) => {
    // 0. Obtener estado anterior si es una edición para auditoría
    const existing = id ? await tx.servicio.findUnique({ where: { id }, include: { configs: { where: { empresaId } } } }) : null;

    // 1. Upsert Servicio (Global)
    const servicio = id 
      ? await tx.servicio.update({
          where: { id },
          data: { 
            nombre, 
            activo, 
            rubroId, 
            departamentoId, 
            participacionFundacion, 
            porcentajeFundacion, 
            participacionDepto, 
            porcentajeDepto 
          }
        })
      : await tx.servicio.create({
          data: { 
            nombre, 
            activo, 
            rubroId, 
            departamentoId, 
            participacionFundacion, 
            porcentajeFundacion, 
            participacionDepto, 
            porcentajeDepto 
          }
        });

    // 2. Upsert ServicioConfig (Per Empresa)
    if (config) {
      await tx.servicioConfig.upsert({
        where: {
          servicioId_empresaId: {
            servicioId: servicio.id,
            empresaId
          }
        },
        create: {
          servicioId: servicio.id,
          empresaId,
          cuentaFundacionImputarId: config.cuentaFundacionImputarId,
          cuentaFundacionRetenerId: config.cuentaFundacionRetenerId,
          cuentaDeptoImputarId: config.cuentaDeptoImputarId,
          cuentaDeptoRetenerId: config.cuentaDeptoRetenerId,
          cuentaIngresosId: config.cuentaIngresosId
        },
        update: {
          cuentaFundacionImputarId: config.cuentaFundacionImputarId,
          cuentaFundacionRetenerId: config.cuentaFundacionRetenerId,
          cuentaDeptoImputarId: config.cuentaDeptoImputarId,
          cuentaDeptoRetenerId: config.cuentaDeptoRetenerId,
          cuentaIngresosId: config.cuentaIngresosId
        }
      });
    }
    if (id && existing) {
      await auditUpdate("Servicio", id, existing, servicio, userEmail, empresaId);
    } else {
      await auditCreate("Servicio", servicio.id, servicio, userEmail, empresaId);
    }

    return servicio;
  });

  revalidatePath("/settings/rubros-servicios");
  return JSON.parse(JSON.stringify(result));
}

export async function toggleServicio(id: number, activo: boolean) {
  const session = await auth();
  const userEmail = session?.user?.email;
  const empresaId = (session?.user as any)?.empresaId;

  const existing = await prisma.servicio.findUnique({ where: { id } });
  
  const result = await prisma.servicio.update({
    where: { id },
    data: { activo }
  });

  if (empresaId) {
    await auditUpdate("Servicio", id, existing, result, userEmail, empresaId);
  }

  revalidatePath("/settings/rubros-servicios");
  return JSON.parse(JSON.stringify(result));
}

/**
 * Elimina un servicio y todas sus configuraciones de empresa en cascada.
 * @param {number} id - ID del servicio.
 * @returns {{ success: boolean, data?: any, error?: string }}
 */
export async function deleteServicio(id: number) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;
    const empresaId = (session?.user as any)?.empresaId;

    const result = await prisma.$transaction(async (tx) => {
      // 0. Obtener para auditoría
      const existing = await tx.servicio.findUnique({ where: { id } });

      // 1. Borramos las configuraciones de empresa asociadas al servicio
      await tx.servicioConfig.deleteMany({
        where: { servicioId: id }
      });

      // 2. Borramos el servicio
      const deleted = await tx.servicio.delete({
        where: { id }
      });

      if (empresaId && existing) {
        await auditDelete("Servicio", id, existing, userEmail, empresaId);
      }

      return deleted;
    });

    revalidatePath("/settings/rubros-servicios");
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    console.error("Error al eliminar servicio:", error);
    return { success: false, error: "Error al eliminar el servicio y sus configuraciones." };
  }
}
