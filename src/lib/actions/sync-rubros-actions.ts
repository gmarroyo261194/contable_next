"use server";

import dbFacturacion from "@/lib/dbFacturacion";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/** Tipo que representa un Rubro externo de PagosFundacion */
export interface RubroExterno {
  id: number;
  nombre: string;
  activo: boolean;
  totalServicios: number;
}

/** Tipo que representa un Servicio externo de PagosFundacion */
interface ServicioExterno {
  id: number;
  rubroId: number;
  nombre: string;
  activo: boolean;
}

/**
 * Obtiene los rubros ACTIVOS de PagosFundacion con el conteo de sus
 * servicios activos. Se utiliza para poblar el modal de selección de sync.
 * @returns {Promise<RubroExterno[]>} Lista de rubros activos desde PagosFundacion.
 */
export async function getRubrosExternos(): Promise<RubroExterno[]> {
  try {
    const rows = await dbFacturacion.$queryRaw<
      Array<{ Id: number; Nombre: string; Activo: boolean; TotalServicios: number }>
    >`
      SELECT 
        r.Id,
        r.Nombre,
        r.Activo,
        COUNT(s.Id) AS TotalServicios
      FROM Rubros r
      LEFT JOIN Servicios s ON s.RubroId = r.Id AND s.Activo = 1
      WHERE r.Activo = 1
      GROUP BY r.Id, r.Nombre, r.Activo
      ORDER BY r.Nombre
    `;

    return rows.map((row) => ({
      id: row.Id,
      nombre: row.Nombre,
      activo: Boolean(row.Activo),
      totalServicios: Number(row.TotalServicios),
    }));
  } catch (error) {
    console.error("Error al conectar con PagosFundacion:", error);
    throw new Error("No se pudo conectar con la base de datos PagosFundacion.");
  }
}

/**
 * Sincroniza los rubros seleccionados y sus servicios activos desde PagosFundacion
 * hacia ContableNext. Solo importa registros con Activo=true en el origen.
 * Preserva los campos locales (departamentoId, porcentajes de retención, configs).
 *
 * @param {number[]} rubroIds - IDs de los rubros en PagosFundacion a sincronizar.
 * @returns {Promise<{ success: boolean; rubrosSync: number; serviciosSync: number; error?: string }>}
 */
export async function syncRubrosSeleccionados(rubroIds: number[]): Promise<{
  success: boolean;
  rubrosSync: number;
  serviciosSync: number;
  error?: string;
}> {
  if (!rubroIds || rubroIds.length === 0) {
    return { success: false, rubrosSync: 0, serviciosSync: 0, error: "No se seleccionaron rubros." };
  }

  try {
    // Validamos que los IDs sean enteros para evitar inyección SQL
    const idsValidos = rubroIds.map((id) => parseInt(String(id), 10)).filter(Number.isFinite);
    if (idsValidos.length === 0) {
      return { success: false, rubrosSync: 0, serviciosSync: 0, error: "IDs de rubros inválidos." };
    }

    // 1. Traer rubros activos seleccionados desde PagosFundacion
    // Se usa $queryRawUnsafe porque $queryRaw parametriza el array como un único string.
    const rubrosExternos = await dbFacturacion.$queryRawUnsafe<
      Array<{ Id: number; Nombre: string; Activo: boolean }>
    >(`
      SELECT Id, Nombre, Activo
      FROM Rubros
      WHERE Activo = 1
        AND Id IN (${idsValidos.join(",")})
    `);

    if (rubrosExternos.length === 0) {
      return { success: false, rubrosSync: 0, serviciosSync: 0, error: "Ninguno de los rubros seleccionados está activo en el origen." };
    }

    // 2. Traer servicios activos de esos rubros desde PagosFundacion
    const externalRubroIds = rubrosExternos.map((r) => Number(r.Id));
    // Se usa $queryRawUnsafe por la misma razón: IN dinámico con lista de enteros.
    const serviciosExternos = await dbFacturacion.$queryRawUnsafe<
      Array<{ Id: number; RubroId: number; Nombre: string; Activo: boolean }>
    >(`
      SELECT Id, RubroId, Nombre, Activo
      FROM Servicios
      WHERE Activo = 1
        AND RubroId IN (${externalRubroIds.join(",")})
      ORDER BY RubroId, Nombre
    `);

    // 3. Upsert en ContableNext dentro de una transacción
    let rubrosSync = 0;
    let serviciosSync = 0;

    await prisma.$transaction(async (tx) => {
      // Map: nombre de rubro externo → id local (para vincular servicios)
      const rubroNombreToLocalId = new Map<string, number>();

      for (const rubroExt of rubrosExternos) {
        // Upsert por nombre (clave de negocio única)
        const local = await tx.rubro.upsert({
          where: { nombre: rubroExt.Nombre },
          create: {
            nombre: rubroExt.Nombre,
            activo: Boolean(rubroExt.Activo),
          },
          update: {
            // Solo actualizamos nombre/activo; no tocamos campos locales
            activo: Boolean(rubroExt.Activo),
          },
        });
        rubroNombreToLocalId.set(rubroExt.Nombre, local.id);
        rubrosSync++;
      }

      // Construir mapa inverso: Id externo → nombre para resolver rubroId local
      const idExternoToNombre = new Map<number, string>(
        rubrosExternos.map((r) => [r.Id, r.Nombre])
      );

      for (const svcExt of serviciosExternos) {
        const rubroNombre = idExternoToNombre.get(svcExt.RubroId);
        const localRubroId = rubroNombre ? rubroNombreToLocalId.get(rubroNombre) : undefined;

        if (!localRubroId) continue; // No debería ocurrir

        // Upsert servicio por nombre (clave única)
        await tx.servicio.upsert({
          where: { nombre: svcExt.Nombre },
          create: {
            nombre: svcExt.Nombre,
            activo: Boolean(svcExt.Activo),
            rubroId: localRubroId,
            // Campos locales quedan en default (null/false)
            participacionFundacion: false,
            participacionDepto: false,
          },
          update: {
            // Solo sincronizamos activo y la vinculación al rubro
            activo: Boolean(svcExt.Activo),
            rubroId: localRubroId,
            // NO tocamos: departamentoId, porcentajes, configs
          },
        });
        serviciosSync++;
      }
    });

    revalidatePath("/settings/rubros-servicios");
    return { success: true, rubrosSync, serviciosSync };
  } catch (error: any) {
    console.error("Error en syncRubrosSeleccionados:", error);
    return {
      success: false,
      rubrosSync: 0,
      serviciosSync: 0,
      error: error?.message || "Error inesperado durante la sincronización.",
    };
  }
}
