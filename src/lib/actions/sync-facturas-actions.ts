"use server";
import { Trash2 } from "lucide-react";

import dbFacturacion from "@/lib/dbFacturacion";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { parseFacturaPDF } from "@/lib/facturas/facturaParser";

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
  servicioNombre?: string;
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
        s.Nombre as ServicioNombre,
        (SELECT SUM(ImporteTotal) FROM ItemsComprobantes WHERE ComprobanteId = c.Id) as ImporteTotal
      FROM Comprobantes c
      INNER JOIN Clientes cl ON cl.Id = c.ClienteId
      LEFT JOIN Servicios s ON s.Id = c.ServicioId
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
      servicioNombre: row.ServicioNombre,
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
export async function syncFacturasSeleccionadas(facturas: FacturaExterna[], ejercicioId: number) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;
  const userEmail = session?.user?.email;

  if (!empresaId) return { success: false, error: "No hay empresa activa." };
  if (!ejercicioId) return { success: false, error: "No hay ejercicio seleccionado." };
  if (facturas.length === 0) return { success: true, syncedCount: 0 };

  try {
    let syncedCount = 0;

    await prisma.$transaction(async (tx) => {
      // 0. Asegurar que existe el tipo "CLIENTE" y obtener su ID
      let tipoCliente = await tx.tipoEntidad.findFirst({ where: { nombre: "CLIENTE" } });
      if (!tipoCliente) {
        tipoCliente = await tx.tipoEntidad.create({ data: { nombre: "CLIENTE" } });
      }
      const tipoClienteId = tipoCliente.id;

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
              tipoId: tipoClienteId,
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
              ejercicioId,
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
export async function getDocumentosClientes(ejercicioId: number | null) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId || !ejercicioId) return [];

  const docs = await prisma.documentoClientes.findMany({
    where: { 
      empresaId,
      ejercicioId
    },
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
    montoPagado: doc.montoPagado ? Number(doc.montoPagado) : null,
    items: doc.items.map(item => ({
      ...item,
      cantidad: Number(item.cantidad),
      precioUnitario: Number(item.precioUnitario),
      importeTotal: Number(item.importeTotal)
    }))
  }));
}

/**
 * Obtiene el ejercicio activo por defecto para una empresa.
 */
export async function getDefaultEjercicio(empresaId: number) {
  const ej = await prisma.ejercicio.findFirst({
    where: { empresaId, cerrado: false },
    orderBy: { inicio: 'desc' }
  });
  return ej ? ej.id : null;
}

/**
 * Procesa un PDF de factura emitida para extraer sus datos.
 */
export async function parseFacturaEmitidaPDF(formData: FormData) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;
  if (!session || !empresaId) return { error: "No autorizado." };

  const file = formData.get("file") as File;
  if (!file) return { error: "No se ha proporcionado ningún archivo." };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const extractedData = await parseFacturaPDF(buffer);

    // Intentar buscar al cliente por CUIT del RECEPTOR o Emisor (fallback)
    const entidad = await prisma.entidad.findFirst({
      where: {
        OR: [
          { cuit: extractedData.cuitReceptor },
          { cuit: extractedData.cuitEmisor }
        ].filter(q => !!q.cuit),
        empresaId
      }
    });

    // Si encontramos la entidad en el sistema, priorizamos su nombre/razón social
    // ya que la extracción por OCR del PDF puede ser inexacta.
    if (entidad) {
      if (extractedData.cuitReceptor && entidad.cuit === extractedData.cuitReceptor) {
        extractedData.nombreReceptor = entidad.nombre;
      } else if (extractedData.cuitEmisor && entidad.cuit === extractedData.cuitEmisor) {
        extractedData.nombreEmisor = entidad.nombre;
      }
    }

    return {
      success: true,
      data: extractedData,
      entidad: entidad ? JSON.parse(JSON.stringify(entidad)) : null
    };
  } catch (error: any) {
    console.error("Error al procesar PDF:", error);
    return { error: error.message || "Error al procesar el archivo PDF." };
  }
}

/**
 * Guarda una factura importada manualmente desde PDF.
 */
export async function saveFacturaImportada(data: {
  tipo: string;
  numero: string;
  fecha: string;
  montoTotal: number;
  entidadId?: number;
  nuevaEntidad?: { nombre: string; cuit: string };
  rubroId: number;
  servicioId: number;
  items?: { descripcion: string; cantidad: number; precioUnitario: number; importeTotal: number }[];
}) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;
  const userEmail = session?.user?.email;

  if (!empresaId) return { error: "No hay empresa activa." };

  // Obtener ejercicio activo
  const ejercicioId = await getDefaultEjercicio(empresaId);
  if (!ejercicioId) return { error: "No hay un ejercicio contable activo para esta empresa." };

  try {
    return await prisma.$transaction(async (tx) => {
      let finalEntidadId = data.entidadId;

      if (!finalEntidadId && data.nuevaEntidad) {
        // Buscar si ya existe por CUIT antes de crear
        let ent = await tx.entidad.findFirst({
          where: { cuit: data.nuevaEntidad.cuit, empresaId }
        });

        if (!ent) {
          // Obtener o crear Tipo CLIENTE
          let tipoCliente = await tx.tipoEntidad.findFirst({ where: { nombre: "CLIENTE" } });
          if (!tipoCliente) {
            tipoCliente = await tx.tipoEntidad.create({ data: { nombre: "CLIENTE" } });
          }

          ent = await tx.entidad.create({
            data: {
              nombre: data.nuevaEntidad.nombre,
              cuit: data.nuevaEntidad.cuit,
              tipoId: tipoCliente.id,
              empresaId,
              createdBy: userEmail
            }
          });
        }
        finalEntidadId = ent.id;
      }

      if (!finalEntidadId) throw new Error("Debe seleccionar o crear una entidad.");

      const factura = await tx.documentoClientes.create({
        data: {
          tipo: data.tipo,
          numero: data.numero,
          fecha: new Date(data.fecha),
          montoTotal: data.montoTotal,
          iva: 0,
          entidadId: finalEntidadId,
          empresaId,
          ejercicioId,
          servicioId: data.servicioId,
          rubroId: data.rubroId,
          createdBy: userEmail,
          items: data.items ? {
            create: data.items.map(item => ({
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              importeTotal: item.importeTotal
            }))
          } : undefined
        }
      });

      revalidatePath("/doccli");
      return { success: true, data: JSON.parse(JSON.stringify(factura)) };
    });
  } catch (error: any) {
    console.error("Error al guardar factura importada:", error);
    return { error: error.message || "Error al guardar el comprobante." };
  }
}

/**
 * Elimina físicamente un documento de cliente si no está contabilizado.
 */
export async function deleteDocumentoCliente(id: number) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;
  if (!session || !empresaId) return { error: "No autorizado." };

  try {
    const doc = await prisma.documentoClientes.findUnique({
      where: { id, empresaId },
      select: { asientoId: true }
    });

    if (!doc) return { error: "Documento no encontrado." };
    if (doc.asientoId) return { error: "No se puede eliminar un documento ya contabilizado." };

    await prisma.documentoClientes.delete({
      where: { id }
    });

    revalidatePath("/doccli");
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar documento:", error);
    return { error: "No se pudo eliminar el documento debido a dependencias o error de servidor." };
  }
}

/**
 * Server action para enviar un PDF directamente al backend y procesarlo con pdf-parse
 */
export async function parseFacturaPdfAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No se adjuntó archivo.");

    const buffer = Buffer.from(await file.arrayBuffer());
    // Se invoca el parser desde el backend Node.js, donde funciona correctamente
    const result = await parseFacturaPDF(buffer);
    
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al procesar el PDF en el servidor." };
  }
}

/**
 * Registra el pago (cobro) de un documento de cliente y genera los asientos contables correspondientes.
 */
export async function registrarPagoDocumento(id: number, fechaPago: Date, montoPagado: number, cuentaHaberId: number) {
  try {
    const session = await auth();
    const empresaId = (session?.user as any)?.empresaId;
    const ejercicioId = (session?.user as any)?.ejercicioId;
    const userEmail = session?.user?.email;

    if (!empresaId || !ejercicioId) throw new Error("No hay empresa o ejercicio activo en la sesión.");

    return await prisma.$transaction(async (tx) => {
      // 1. Obtener el documento con su servicio y configuración
      const doc = await tx.documentoClientes.findUnique({
        where: { id, empresaId },
        include: {
          servicio: {
            include: {
              configs: {
                where: { empresaId }
              }
            }
          }
        }
      }) as any;

      if (!doc) throw new Error("Documento no encontrado.");
      if (!doc.servicioId || !doc.servicio?.configs?.[0]) {
        throw new Error("El servicio asociado no tiene una configuración contable definida para esta empresa.");
      }

      const config = doc.servicio.configs[0];
      if (!config.cuentaIngresosId) {
        throw new Error("El servicio no tiene configurada una cuenta de ingresos (DEBE).");
      }

      // Limpiar número de factura para la referencia (quitar ceros a la izquierda)
      // Formato esperado: "0001-00001234" -> "1-1234"
      const docNumeroLimpio = doc.numero.split('-').map((part: string) => parseInt(part, 10).toString()).join('-');

      // 2. Generar Asiento de Cobro (Principal)
      const lastAsiento = await tx.asiento.findFirst({
        where: { ejercicioId },
        orderBy: { numero: "desc" },
        select: { numero: true },
      });
      let nextNumero = (lastAsiento?.numero ?? 0) + 1;

      // Obtener moneda base de la empresa
      const empresa = await tx.empresa.findUnique({
        where: { id: empresaId },
        select: { monedaId: true }
      });
      const monedaId = empresa?.monedaId || 1;

      const asientoCobro = await tx.asiento.create({
        data: {
          numero: nextNumero++,
          fecha: fechaPago,
          descripcion: `Pago Factura ${docNumeroLimpio}`,
          ejercicioId,
          createdBy: userEmail,
          renglones: {
            create: [
              {
                cuentaId: config.cuentaIngresosId,
                debe: montoPagado,
                haber: 0,
                leyenda: `Factura ${docNumeroLimpio}`,
                monedaId,
                cotizacion: 1.0,
                createdBy: userEmail,
              },
              {
                cuentaId: cuentaHaberId,
                debe: 0,
                haber: montoPagado,
                leyenda: `Cobro Factura ${docNumeroLimpio}`,
                monedaId,
                cotizacion: 1.0,
                createdBy: userEmail,
              }
            ]
          }
        }
      });

      // 3. Asiento Fundación (si aplica)
      if (doc.servicio.participacionFundacion && doc.servicio.porcentajeFundacion) {
        if (!config.cuentaFundacionImputarId || !config.cuentaFundacionRetenerId) {
          throw new Error("Faltan cuentas configuradas para la participación de Fundación.");
        }

        const importeFundacion = Number(montoPagado) * (Number(doc.servicio.porcentajeFundacion) / 100);

        await tx.asiento.create({
          data: {
            numero: nextNumero++,
            fecha: fechaPago,
            descripcion: `Fundación Univer. Tecnologica (${doc.servicio.porcentajeFundacion}%) - Factura ${docNumeroLimpio}`,
            ejercicioId,
            createdBy: userEmail,
            renglones: {
              create: [
                {
                  cuentaId: config.cuentaFundacionImputarId,
                  debe: importeFundacion,
                  haber: 0,
                  leyenda: `Part. Fundación - Fac. ${docNumeroLimpio}`,
                  monedaId,
                  cotizacion: 1.0,
                  createdBy: userEmail,
                },
                {
                  cuentaId: config.cuentaFundacionRetenerId,
                  debe: 0,
                  haber: importeFundacion,
                  leyenda: `Part. Fundación - Fac. ${docNumeroLimpio}`,
                  monedaId,
                  cotizacion: 1.0,
                  createdBy: userEmail,
                }
              ]
            }
          }
        });
      }

      // 4. Asiento Departamento (si aplica)
      if (doc.servicio.participacionDepto && doc.servicio.porcentajeDepto) {
        if (!config.cuentaDeptoImputarId || !config.cuentaDeptoRetenerId) {
          throw new Error("Faltan cuentas configuradas para la participación de Departamento.");
        }

        const importeDepto = Number(montoPagado) * (Number(doc.servicio.porcentajeDepto) / 100);

        await tx.asiento.create({
          data: {
            numero: nextNumero++,
            fecha: fechaPago,
            descripcion: `Participación ${doc.servicio.porcentajeDepto}% a Departamentos - Factura ${docNumeroLimpio}`,
            ejercicioId,
            createdBy: userEmail,
            renglones: {
              create: [
                {
                  cuentaId: config.cuentaDeptoImputarId,
                  debe: importeDepto,
                  haber: 0,
                  leyenda: `Part. Depto - Fac. ${docNumeroLimpio}`,
                  monedaId,
                  cotizacion: 1.0,
                  createdBy: userEmail,
                },
                {
                  cuentaId: config.cuentaDeptoRetenerId,
                  debe: 0,
                  haber: importeDepto,
                  leyenda: `Part. Depto - Fac. ${docNumeroLimpio}`,
                  monedaId,
                  cotizacion: 1.0,
                  createdBy: userEmail,
                }
              ]
            }
          }
        });
      }

      // 5. Actualizar Documento
      await tx.documentoClientes.update({
        where: { id, empresaId },
        data: {
          fechaPago,
          montoPagado,
          asientoId: asientoCobro.id, // Vinculamos el asiento principal
          updatedBy: userEmail
        }
      });

      return { success: true };
    });
  } catch (error: any) {
    console.error("Error al registrar pago:", error);
    return { error: error.message || "Error al registrar el pago." };
  }
}
