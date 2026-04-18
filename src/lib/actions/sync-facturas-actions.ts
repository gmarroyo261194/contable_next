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
      importeTotal: Number(row.ImporteTotal || 0)
    }));

  } catch (error) {
    console.error("Error en getFacturasExternasPendientes:", error);
    throw new Error("No se pudo obtener las facturas desde la base externa.");
  }
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

        // 2. Crear el Documento de Cliente
        const numeroFormateado = `${String(fact.puntoVenta).padStart(4, '0')}-${String(fact.numero).padStart(8, '0')}`;
        
        // Verificación extra de duplicidad en la transacción
        const existe = await tx.documentoClientes.findFirst({
          where: {
            empresaId,
            tipo: fact.tipo,
            numero: numeroFormateado
          }
        });

        if (!existe) {
          await tx.documentoClientes.create({
            data: {
              tipo: fact.tipo,
              numero: numeroFormateado,
              fecha: new Date(fact.fecha),
              montoTotal: fact.importeTotal,
              iva: 0, // Según requerimiento: No considerar IVA
              entidadId: entidad.id,
              empresaId,
              asientoId: null, // Queda pendiente de contabilizar
              createdBy: userEmail
            }
          });
          syncedCount++;
        }
      }
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
    iva: Number(doc.iva)
  }));
}
