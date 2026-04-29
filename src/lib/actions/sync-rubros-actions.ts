"use server";

import dbFacturacion, { dbLegacyFacturacion } from "@/lib/dbFacturacion";
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
 * Obtiene los rubros de la tabla Rubros de la base de datos LEGACY (Facturacion).
 * Se considera habilitado si tiene al menos un servicio habilitado (Habilitado = 'S').
 */
export async function getRubrosLegacy(): Promise<RubroExterno[]> {
  try {
    const rows = await dbLegacyFacturacion.$queryRaw<
      Array<{ id_rubro: number; nombrerubro: string; TotalServicios: number }>
    >`
      SELECT 
        r.id_rubro,
        r.nombrerubro,
        (SELECT COUNT(*) FROM DetalleRubros s WHERE s.id_rubro = r.id_rubro AND s.Habilitado = 'S') AS TotalServicios
      FROM Rubros r
      WHERE (SELECT COUNT(*) FROM DetalleRubros s WHERE s.id_rubro = r.id_rubro AND s.Habilitado = 'S') > 0
      ORDER BY r.nombrerubro
    `;

    return rows.map((row) => ({
      id: row.id_rubro,
      nombre: row.nombrerubro.trim(),
      activo: true,
      totalServicios: Number(row.TotalServicios),
    }));
  } catch (error) {
    console.error("Error al conectar con DB Legacy:", error);
    throw new Error("No se pudo conectar con la base de datos Legacy Facturación.");
  }
}

/**
 * Sincroniza los rubros seleccionados y sus servicios habilitados desde la DB LEGACY.
 * IMPORTANTE: Inserta con los mismos IDs de origen.
 */
export async function syncRubrosLegacySeleccionados(rubroIds: number[]): Promise<{
  success: boolean;
  rubrosSync: number;
  serviciosSync: number;
  error?: string;
}> {
  if (!rubroIds || rubroIds.length === 0) {
    return { success: false, rubrosSync: 0, serviciosSync: 0, error: "No se seleccionaron rubros." };
  }

  try {
    const idsValidos = rubroIds.map((id) => parseInt(String(id), 10)).filter(Number.isFinite);
    if (idsValidos.length === 0) {
      return { success: false, rubrosSync: 0, serviciosSync: 0, error: "IDs de rubros inválidos." };
    }

    // 1. Traer rubros seleccionados desde Legacy
    const rubrosExternos = await dbLegacyFacturacion.$queryRawUnsafe<
      Array<{ id_rubro: number; nombrerubro: string }>
    >(`
      SELECT id_rubro, nombrerubro
      FROM Rubros
      WHERE id_rubro IN (${idsValidos.join(",")})
    `);

    if (rubrosExternos.length === 0) {
      return { success: false, rubrosSync: 0, serviciosSync: 0, error: "No se encontraron los rubros seleccionados en el origen." };
    }

    // 2. Traer servicios habilitados (Habilitado = 'S') de esos rubros desde Legacy
    const externalRubroIds = rubrosExternos.map((r) => Number(r.id_rubro));
    const serviciosExternos = await dbLegacyFacturacion.$queryRawUnsafe<
      Array<{ id_detallerubro: number; id_rubro: number; nombredetalle: string }>
    >(`
      SELECT id_detallerubro, id_rubro, nombredetalle
      FROM DetalleRubros
      WHERE Habilitado = 'S'
        AND id_rubro IN (${externalRubroIds.join(",")})
    `);

    // 3. Upsert en ContableNext con IDs originales
    let rubrosSync = 0;
    let serviciosSync = 0;

    await prisma.$transaction(async (tx) => {
      // Para permitir insertar IDs específicos en SQL Server (IDENTITY_INSERT)
      // Prisma no lo hace automático con upsert/create si la columna es IDENTITY.
      // Usamos $executeRaw para activar y luego hacemos el upsert.
      
      for (const rubroExt of rubrosExternos) {
        const nombreTrim = rubroExt.nombrerubro.trim();
        const idExt = Number(rubroExt.id_rubro);

        // Prioridad: buscar por ID original
        const existeId = await tx.rubro.findUnique({ where: { id: idExt } });
        
        if (existeId) {
          // Si existe el ID, actualizamos el nombre y aseguramos que esté activo
          await tx.rubro.update({
            where: { id: idExt },
            data: { nombre: nombreTrim, activo: true }
          });
        } else {
          // Si no existe el ID, verificamos si existe el NOMBRE (conflicto de ID)
          const existeNombre = await tx.rubro.findUnique({ where: { nombre: nombreTrim } });
          if (existeNombre) {
            // Si el nombre existe con otro ID, lo eliminamos para poder insertar el ID correcto
            // (Asumiendo que no hay FKs restrictivas que impidan esto en este momento)
            await tx.rubro.delete({ where: { id: existeNombre.id } });
          }
          
          // Insertamos con el ID original
          await tx.$executeRawUnsafe(`
            SET IDENTITY_INSERT rubros ON;
            INSERT INTO rubros (id, nombre, activo, createdAt, updatedAt)
            VALUES (${idExt}, '${nombreTrim.replace(/'/g, "''")}', 1, GETDATE(), GETDATE());
            SET IDENTITY_INSERT rubros OFF;
          `);
        }
        rubrosSync++;
      }

      for (const svcExt of serviciosExternos) {
        const nombreTrim = svcExt.nombredetalle.trim();
        const idExt = Number(svcExt.id_detallerubro);
        const rubroIdExt = Number(svcExt.id_rubro);

        const existeId = await tx.servicio.findUnique({ where: { id: idExt } });

        if (existeId) {
          await tx.servicio.update({
            where: { id: idExt },
            data: { 
              nombre: nombreTrim, 
              activo: true,
              rubroId: rubroIdExt
            }
          });
        } else {
          const existeNombre = await tx.servicio.findUnique({ where: { nombre: nombreTrim } });
          if (existeNombre) {
            await tx.servicio.delete({ where: { id: existeNombre.id } });
          }

          await tx.$executeRawUnsafe(`
            SET IDENTITY_INSERT servicios ON;
            INSERT INTO servicios (id, nombre, activo, rubroId, participacionFundacion, participacionDepto, createdAt, updatedAt)
            VALUES (${idExt}, '${nombreTrim.replace(/'/g, "''")}', 1, ${rubroIdExt}, 0, 0, GETDATE(), GETDATE());
            SET IDENTITY_INSERT servicios OFF;
          `);
        }
        serviciosSync++;
      }
    });

    revalidatePath("/settings/rubros-servicios");
    return { success: true, rubrosSync, serviciosSync };
  } catch (error: any) {
    console.error("Error en syncRubrosLegacySeleccionados:", error);
    return {
      success: false,
      rubrosSync: 0,
      serviciosSync: 0,
      error: error?.message || "Error inesperado durante la sincronización legacy.",
    };
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
