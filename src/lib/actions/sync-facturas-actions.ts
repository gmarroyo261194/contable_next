"use server";

import dbFacturacion from "@/lib/dbFacturacion";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export interface FacturaExterna {
  id: number;
  tipo: string;
  puntoVenta: number;
  numero: number;
  fecha: string;
  clienteId: number;
  clienteNombre: string;
  clienteDoc: string;
  importeTotal: number;
  servicioId: number;
  rubroId: number;
  fechaPago: string | null;
}

/**
 * Obtiene facturas pagadas desde la base externa que aún no han sido sincronizadas localmente.
 */
export async function getFacturasExternasPendientes(): Promise<FacturaExterna[]> {
  try {
    const session = await auth();
    const empresaId = (session?.user as any)?.empresaId;
    if (!empresaId) throw new Error("No hay empresa activa en la sesión.");

    // 1. Obtener todas las facturas de clientes ya sincronizadas para esta empresa
    const locales = await prisma.documentoClientes.findMany({
      where: { empresaId },
      select: { tipo: true, numero: true }
    });

    const localKeys = new Set(locales.map(l => `${l.tipo}|${l.numero}`));

    // 2. Consultar facturas pagadas (EstadoId = 2) en la base externa
    const rows = await dbFacturacion.$queryRawUnsafe<any[]>(`
      SELECT 
        c.Id,
        c.Tipo,
        c.PtoVenta,
        c.NroComprobante,
        c.CreatedAt as Fecha,
        c.ClienteId,
        c.ServicioId,
        c.RubroId,
        c.FechaPago,
        cl.Nombre as ClienteNombre,
        cl.Identificacion as ClienteDoc,
        (SELECT SUM(ImporteTotal) FROM ItemsComprobantes WHERE ComprobanteId = c.Id) as ImporteTotal
      FROM Comprobantes c
      INNER JOIN Clientes cl ON cl.Id = c.ClienteId
      WHERE c.EstadoId = 2
      ORDER BY c.CreatedAt DESC
    `);

    // 3. Filtrar las que ya existen localmente
    const filtradas = rows.filter(row => {
      const numeroFormateado = `${String(row.PtoVenta).padStart(4, '0')}-${String(row.NroComprobante).padStart(8, '0')}`;
      const key = `${row.Tipo}|${numeroFormateado}`;
      return !localKeys.has(key);
    });

    return filtradas.map(row => ({
      id: Number(row.Id),
      tipo: row.Tipo,
      puntoVenta: Number(row.PtoVenta),
      numero: Number(row.NroComprobante),
      fecha: row.Fecha.toISOString(),
      clienteId: Number(row.ClienteId),
      clienteNombre: row.ClienteNombre,
      clienteDoc: row.ClienteDoc,
      importeTotal: Number(row.ImporteTotal || 0),
      servicioId: Number(row.ServicioId),
      rubroId: Number(row.RubroId),
      fechaPago: row.FechaPago ? row.FechaPago.toISOString() : null
    }));

  } catch (error) {
    console.error("Error en getFacturasExternasPendientes:", error);
    throw new Error("No se pudo obtener las facturas desde la base externa.");
  }
}

/**
 * Asegura la existencia de un Rubro por ID, migrándolo si es necesario.
 */
async function ensureRubroExists(tx: any, rubroId: number) {
  // 1. Prioridad: Buscar por ID exacto
  const localById = await tx.rubro.findUnique({ where: { id: rubroId } });
  if (localById) return localById;

  // 2. Obtener datos de la base externa
  const ext = await dbFacturacion.$queryRaw<any[]>`SELECT Nombre, Activo FROM Rubros WHERE Id = ${rubroId}`;
  if (ext.length === 0) return null;

  const nombreExt = ext[0].Nombre;

  // 3. Verificar si existe por NOMBRE para evitar conflictos de UNIQUE KEY
  const localByName = await tx.rubro.findUnique({ where: { nombre: nombreExt } });
  if (localByName) {
    console.log(`Rubro '${nombreExt}' encontrado por nombre con ID ${localByName.id}. Usando este en lugar del ID externo ${rubroId}.`);
    return localByName;
  }

  // 4. Si no existe de ninguna forma, migrar preservando el ID
  const nombreEscaped = nombreExt.replace(/'/g, "''");
  const activo = ext[0].Activo ? 1 : 0;

  await tx.$executeRawUnsafe(`
    SET IDENTITY_INSERT rubros ON;
    INSERT INTO rubros (id, nombre, activo, createdAt, updatedAt) 
    VALUES (${rubroId}, '${nombreEscaped}', ${activo}, GETDATE(), GETDATE());
    SET IDENTITY_INSERT rubros OFF;
  `);

  return await tx.rubro.findUnique({ where: { id: rubroId } });
}

/**
 * Asegura la existencia de un Servicio por ID, migrándolo si es necesario.
 */
async function ensureServicioExists(tx: any, servicioId: number) {
  // 1. Buscar por ID exacto
  const localById = await tx.servicio.findUnique({ where: { id: servicioId } });
  if (localById) return localById;

  // 2. Obtener datos externos
  const ext = await dbFacturacion.$queryRaw<any[]>`SELECT Nombre, Activo, RubroId FROM Servicios WHERE Id = ${servicioId}`;
  if (ext.length === 0) return null;

  const nombreExt = ext[0].Nombre;

  // 3. Verificar por NOMBRE
  const localByName = await tx.servicio.findUnique({ where: { nombre: nombreExt } });
  if (localByName) {
    console.log(`Servicio '${nombreExt}' encontrado por nombre con ID ${localByName.id}.`);
    return localByName;
  }

  // Asegurar que el rubro existe primero (usando su ID original)
  const rubro = await ensureRubroExists(tx, ext[0].RubroId);
  const effectiveRubroId = rubro?.id || ext[0].RubroId;

  // 4. Migrar
  const nombreEscaped = nombreExt.replace(/'/g, "''");
  const activo = ext[0].Activo ? 1 : 0;

  await tx.$executeRawUnsafe(`
    SET IDENTITY_INSERT servicios ON;
    INSERT INTO servicios (id, nombre, activo, rubroId, participacionFundacion, participacionDepto, createdAt, updatedAt)
    VALUES (${servicioId}, '${nombreEscaped}', ${activo}, ${effectiveRubroId}, 0, 0, GETDATE(), GETDATE());
    SET IDENTITY_INSERT servicios OFF;
  `);

  return await tx.servicio.findUnique({ where: { id: servicioId } });
}

/**
 * Sincroniza un conjunto de facturas seleccionadas.
 * Crea automáticamente las entidades (clientes) omitiendo duplicados.
 */
export async function syncFacturasSeleccionadas(facturas: FacturaExterna[]) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;
  const userEmail = session?.user?.email;

  if (!empresaId) return { success: false, error: "No hay empresa activa." };
  if (facturas.length === 0) return { success: true, syncedCount: 0 };

  try {
    let syncedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const fact of facturas) {
        // 1. Asegurar la existencia de la Entidad (Cliente)
        let entidad = await tx.entidad.findFirst({
          where: {
            empresaId,
            OR: [
              { cuit: fact.clienteDoc },
              { nroDoc: fact.clienteDoc },
              { nombre: fact.clienteNombre }
            ]
          }
        });

        if (!entidad) {
          entidad = await tx.entidad.create({
            data: {
              nombre: fact.clienteNombre,
              cuit: fact.clienteDoc,
              tipoId: 1002, // CLIENTE
              empresaId,
              createdBy: userEmail
            }
          });
        }

        // 2. Asegurar Rubro y Servicio y obtener su ID local real
        const rubroObj = fact.rubroId ? await ensureRubroExists(tx, fact.rubroId) : null;
        const servicioObj = fact.servicioId ? await ensureServicioExists(tx, fact.servicioId) : null;

        const effectiveRubroId = rubroObj?.id || null;
        const effectiveServicioId = servicioObj?.id || null;

        // 3. Crear el Documento de Cliente
        const numeroFormateado = `${String(fact.puntoVenta).padStart(4, '0')}-${String(fact.numero).padStart(8, '0')}`;
        
        const existe = await tx.documentoClientes.findFirst({
          where: {
            empresaId,
            tipo: fact.tipo,
            numero: numeroFormateado
          }
        });

        if (!existe) {
          // Obtener ítems de la base externa
          const itemsExt = await dbFacturacion.$queryRaw<any[]>`SELECT Linea, Cantidad, ImporteUnit, ImporteTotal FROM ItemsComprobantes WHERE ComprobanteId = ${fact.id}`;

          await tx.documentoClientes.create({
            data: {
              tipo: fact.tipo,
              numero: numeroFormateado,
              fecha: new Date(fact.fecha),
              montoTotal: fact.importeTotal,
              iva: 0,
              entidadId: entidad.id,
              empresaId,
              servicioId: effectiveServicioId,
              rubroId: effectiveRubroId,
              asientoId: null,
              fechaPago: fact.fechaPago ? new Date(fact.fechaPago) : null,
              createdBy: userEmail,
              items: {
                create: itemsExt.map(item => ({
                  descripcion: item.Linea,
                  cantidad: item.Cantidad,
                  precioUnitario: item.ImporteUnit,
                  importeTotal: item.ImporteTotal
                }))
              }
            }
          });
          syncedCount++;
        }
      }
    }, {
      timeout: 30000 // Aumentar timeout para transacciones largas con muchos ítems
    });

    revalidatePath("/doccli");
    return { success: true, syncedCount };

  } catch (error: any) {
    console.error("Error en syncFacturasSeleccionadas:", error);
    return { success: false, error: error.message || "Error al sincronizar facturas." };
  }
}

/**
 * Obtiene los documentos de clientes locales para la empresa activa.
 */
export async function getDocumentosClientes() {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) return [];

  const docs = await prisma.documentoClientes.findMany({
    where: { empresaId },
    include: {
      entidad: true,
      servicio: {
        select: { nombre: true }
      },
      items: true,
      asiento: {
        select: {
          numero: true,
          fecha: true
        }
      }
    },
    orderBy: { fecha: 'desc' }
  });

  return docs.map(doc => ({
    ...doc,
    montoTotal: Number(doc.montoTotal),
    iva: Number(doc.iva),
    fechaPago: doc.fechaPago,
    items: doc.items.map(item => ({
      ...item,
      cantidad: Number(item.cantidad),
      precioUnitario: Number(item.precioUnitario),
      importeTotal: Number(item.importeTotal)
    }))
  }));
}
