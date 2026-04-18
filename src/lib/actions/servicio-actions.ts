"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

  const result = await prisma.$transaction(async (tx) => {
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
          cuentaDeptoRetenerId: config.cuentaDeptoRetenerId
        },
        update: {
          cuentaFundacionImputarId: config.cuentaFundacionImputarId,
          cuentaFundacionRetenerId: config.cuentaFundacionRetenerId,
          cuentaDeptoImputarId: config.cuentaDeptoImputarId,
          cuentaDeptoRetenerId: config.cuentaDeptoRetenerId
        }
      });
    }
    return servicio;
  });

  revalidatePath("/settings/rubros-servicios");
  return JSON.parse(JSON.stringify(result));
}

/**
 * Cambia el estado de un servicio.
 */
export async function toggleServicio(id: number, activo: boolean) {
  const result = await prisma.servicio.update({
    where: { id },
    data: { activo }
  });
  revalidatePath("/settings/rubros-servicios");
  return JSON.parse(JSON.stringify(result));
}
