"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { auditCreate, auditUpdate, auditDelete } from "@/lib/audit/auditLogger";

/**
 * Obtiene todos los documentos de proveedores para la empresa actual.
 */
export async function getDocumentosProveedores() {
  const session = await auth();
  const empresaId = parseInt((session?.user as any)?.empresaId);
  if (!empresaId) return [];

  const docs = await db.documentoProveedores.findMany({
    where: { empresaId },
    include: {
      entidad: true,
      asiento: {
        include: { renglones: { include: { cuenta: true } } }
      },
      asientoPago: {
        include: { renglones: { include: { cuenta: true } } }
      },
      ejercicio: {
        include: { empresa: true }
      }
    },
    orderBy: { fecha: 'desc' }
  });

  return JSON.parse(JSON.stringify(docs));
}

/**
 * Crea o actualiza un documento de proveedor y genera su asiento automático si se requiere.
 */
export async function upsertDocumentoProveedor(data: {
  id?: number;
  tipo: string;
  letra: string;
  numero: string;
  fecha: string;
  vencimiento?: string;
  cai?: string;
  montoTotal: number;
  iva: number;
  retencion: number;
  detalle?: string;
  entidadId: number;
  cuentaDebeId?: number;
  cuentaHaberId?: number;
  leyendaDebe?: string;
  leyendaHaber?: string;
  generarAsiento?: boolean;
}) {
  const session = await auth();
  const empresaId = parseInt((session?.user as any)?.empresaId);
  const ejercicioId = parseInt((session?.user as any)?.ejercicioId);
  const userEmail = session?.user?.email;

  if (!empresaId || !ejercicioId) {
    return { error: "Faltan datos de sesión (empresa o ejercicio)." };
  }

  try {
    return await db.$transaction(async (tx) => {
      const { id, generarAsiento, cuentaDebeId, cuentaHaberId, leyendaDebe, leyendaHaber, ...fields } = data;

      // Validar ejercicio cerrado
      const ejercicio = await tx.ejercicio.findUnique({
        where: { id: ejercicioId },
        select: { cerrado: true }
      });
      if (ejercicio?.cerrado) throw new Error("El ejercicio contable está cerrado.");

      // 1. Preparar datos del documento
      const docData = {
        tipo: fields.tipo,
        letra: fields.letra,
        numero: fields.numero,
        fecha: new Date(fields.fecha),
        vencimiento: fields.vencimiento ? new Date(fields.vencimiento) : null,
        cai: fields.cai,
        montoTotal: fields.montoTotal,
        iva: fields.iva,
        retencion: fields.retencion,
        detalle: fields.detalle,
        entidadId: fields.entidadId,
        cuentaDebeId,
        cuentaHaberId,
        leyendaDebe,
        leyendaHaber,
        updatedBy: userEmail
      };

      // 2. Upsert del Documento
      const doc = id 
        ? await tx.documentoProveedores.update({
            where: { id },
            data: docData,
            include: { asiento: true }
          })
        : await tx.documentoProveedores.create({
            data: { ...docData, empresaId, ejercicioId, createdBy: userEmail }
          });

      // 3. Obtener nombre del proveedor para el concepto del asiento
      const entidad = await tx.entidad.findUnique({
        where: { id: fields.entidadId },
        select: { nombre: true }
      });
      const conceptoAsiento = entidad?.nombre || `Factura Proveedor: ${fields.numero}`;

      // 4. Manejo de Asiento Automático
      if (generarAsiento && cuentaDebeId && cuentaHaberId) {
        let asientoId = doc.asientoId;

        // Estructura de renglones para el asiento
        const renglonesData = [
          {
            cuentaId: cuentaDebeId,
            debe: fields.montoTotal,
            haber: 0,
            leyenda: leyendaDebe || fields.detalle || `Factura Prov. ${fields.numero}`,
            monedaId: 1, // PES
            cotizacion: 1.0,
            createdBy: userEmail
          },
          {
            cuentaId: cuentaHaberId,
            debe: 0,
            haber: fields.montoTotal,
            leyenda: leyendaHaber || fields.detalle || `Factura Prov. ${fields.numero}`,
            monedaId: 1,
            cotizacion: 1.0,
            createdBy: userEmail
          }
        ];

        if (!asientoId) {
          // Crear Asiento
          const lastAsiento = await tx.asiento.findFirst({
            where: { ejercicioId },
            orderBy: { numero: "desc" },
            select: { numero: true },
          });
          const nextNumero = (lastAsiento?.numero ?? 0) + 1;

          const asiento = await tx.asiento.create({
            data: {
              numero: nextNumero,
              fecha: new Date(fields.fecha),
              descripcion: conceptoAsiento,
              ejercicioId,
              createdBy: userEmail,
              renglones: {
                create: renglonesData
              }
            }
          });
          asientoId = asiento.id;
          
          await tx.documentoProveedores.update({
            where: { id: doc.id },
            data: { asientoId }
          });
          
          await auditCreate("Asiento", asiento.id, JSON.parse(JSON.stringify(asiento)), userEmail, empresaId);
        } else {
          // Actualizar Asiento Existente
          await tx.renglonAsiento.deleteMany({ where: { asientoId } });
          const asientoUpdate = await tx.asiento.update({
            where: { id: asientoId },
            data: {
              fecha: new Date(fields.fecha),
              descripcion: conceptoAsiento,
              updatedBy: userEmail,
              renglones: {
                create: renglonesData
              }
            },
            include: { renglones: true }
          });
          await auditUpdate("Asiento", asientoId, {}, JSON.parse(JSON.stringify(asientoUpdate)), userEmail, empresaId);
        }
      }

      const finalResult = JSON.parse(JSON.stringify(doc));
      if (id) {
        await auditUpdate("DocumentoProveedores", id, {}, finalResult, userEmail, empresaId);
      } else {
        await auditCreate("DocumentoProveedores", doc.id, finalResult, userEmail, empresaId);
      }

      revalidatePath("/docprov");
      return { success: true, data: finalResult };
    });
  } catch (error: any) {
    console.error("Error al procesar documento de proveedor:", error);
    return { error: error.message || "Error al procesar el documento." };
  }
}

/**
 * Anula un documento de proveedor y genera el contra-asiento correspondiente.
 */
export async function anularDocumentoProveedor(id: number) {
  const session = await auth();
  const empresaId = parseInt((session?.user as any)?.empresaId);
  const ejercicioId = parseInt((session?.user as any)?.ejercicioId);
  const userEmail = session?.user?.email;

  try {
    return await db.$transaction(async (tx) => {
      const doc = await tx.documentoProveedores.findUnique({
        where: { id },
        include: { asiento: { include: { renglones: true } } }
      });

      if (!doc) throw new Error("Documento no encontrado.");
      if (doc.anulado) throw new Error("El documento ya está anulado.");

      // 1. Marcar como anulado
      await tx.documentoProveedores.update({
        where: { id },
        data: {
          anulado: true,
          fechaAnulacion: new Date(),
          anuladoPor: userEmail
        }
      });

      // 2. Si tiene asiento, anularlo
      if (doc.asientoId && doc.asiento) {
        const lastAsiento = await tx.asiento.findFirst({
          where: { ejercicioId },
          orderBy: { numero: "desc" },
          select: { numero: true },
        });
        const nextNumero = (lastAsiento?.numero ?? 0) + 1;

        const contraAsiento = await tx.asiento.create({
          data: {
            numero: nextNumero,
            fecha: new Date(),
            descripcion: `ANULACION DOC ${doc.numero}: ${doc.asiento.descripcion}`,
            ejercicioId,
            createdBy: userEmail,
            anulaAId: doc.asientoId,
            renglones: {
              create: doc.asiento.renglones.map(r => ({
                cuentaId: r.cuentaId,
                debe: r.haber,
                haber: r.debe,
                leyenda: `Anulación Doc ${doc.numero}`,
                monedaId: r.monedaId,
                cotizacion: Number(r.cotizacion),
                createdBy: userEmail
              }))
            }
          }
        });

        await auditCreate("Asiento", contraAsiento.id, JSON.parse(JSON.stringify(contraAsiento)), userEmail, empresaId);
      }

      await auditUpdate("DocumentoProveedores", id, doc, { ...doc, anulado: true }, userEmail, empresaId);
      
      revalidatePath("/docprov");
      return { success: true };
    });
  } catch (error: any) {
    console.error("Error al anular documento:", error);
    return { error: error.message || "Error al anular el documento." };
  }
}

/**
 * Autoriza un documento para su pago, estableciendo la fecha permitida.
 */
export async function autorizarDocumentoProveedor(id: number, fechaAutorizacionPago: string) {
  const session = await auth();
  const empresaId = parseInt((session?.user as any)?.empresaId);
  const userEmail = session?.user?.email;

  if (!empresaId) return { error: "Sesión no válida." };

  try {
    const doc = await db.documentoProveedores.update({
      where: { id },
      data: {
        autorizado: true,
        fechaAutorizacionPago: new Date(fechaAutorizacionPago),
        updatedBy: userEmail
      }
    });

    await auditUpdate("DocumentoProveedores", id, { autorizado: false }, JSON.parse(JSON.stringify(doc)), userEmail, empresaId);
    
    revalidatePath("/docprov");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al autorizar el documento." };
  }
}

/**
 * Elimina físicamente un documento de proveedor (solo si no está anulado ni tiene asiento).
 * Usualmente se prefiere anular.
 */
export async function deleteDocumentoProveedor(id: number) {
  const session = await auth();
  const empresaId = parseInt((session?.user as any)?.empresaId);
  const userEmail = session?.user?.email;

  try {
    const doc = await db.documentoProveedores.findUnique({ where: { id } });
    if (!doc) throw new Error("Documento no encontrado.");
    if (doc.asientoId) throw new Error("No se puede eliminar un documento con asiento contable. Debe anularlo.");

    await db.documentoProveedores.delete({ where: { id } });
    await auditDelete("DocumentoProveedores", id, doc, userEmail, empresaId);

    revalidatePath("/docprov");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al eliminar el documento." };
  }
}

/**
 * Registra el pago de un documento de proveedor y genera el asiento contable correspondiente.
 */
export async function pagarDocumentoProveedor(id: number, cuentaPagadoraId: number, fechaPago: string) {
  const session = await auth();
  const empresaId = parseInt((session?.user as any)?.empresaId);
  const ejercicioId = parseInt((session?.user as any)?.ejercicioId);
  const userEmail = session?.user?.email;

  if (!empresaId || !ejercicioId) return { error: "Sesión no válida." };

  try {
    return await db.$transaction(async (tx) => {
      const doc = await tx.documentoProveedores.findUnique({
        where: { id },
        include: { entidad: true }
      });

      if (!doc) throw new Error("Documento no encontrado.");
      if (doc.pagado) throw new Error("El documento ya está pagado.");
      if (!doc.autorizado) throw new Error("El documento no está autorizado para pago.");
      if (doc.anulado) throw new Error("No se puede pagar un documento anulado.");

      const hoy = new Date();
      hoy.setHours(0,0,0,0);
      const fechaPermitida = doc.fechaAutorizacionPago ? new Date(doc.fechaAutorizacionPago) : null;
      if (fechaPermitida) {
        fechaPermitida.setHours(0,0,0,0);
        if (hoy < fechaPermitida) {
          throw new Error(`El pago no está permitido hasta el ${fechaPermitida.toLocaleDateString()}.`);
        }
      }

      if (!doc.cuentaHaberId) throw new Error("El documento no tiene una cuenta de pasivo asociada.");

      // 1. Generar Asiento de Pago
      const lastAsiento = await tx.asiento.findFirst({
        where: { ejercicioId },
        orderBy: { numero: "desc" },
        select: { numero: true },
      });
      const nextNumero = (lastAsiento?.numero ?? 0) + 1;

      const conceptoAsiento = doc.entidad?.nombre || `Pago a Proveedor: ${doc.numero}`;

      const asientoPago = await tx.asiento.create({
        data: {
          numero: nextNumero,
          fecha: new Date(fechaPago),
          descripcion: conceptoAsiento,
          ejercicioId,
          createdBy: userEmail,
          renglones: {
            create: [
              {
                cuentaId: doc.cuentaHaberId, // Debe: Cancela el Pasivo
                debe: doc.montoTotal,
                haber: 0,
                leyenda: `Factura pagada ${doc.numero}`,
                monedaId: 1,
                cotizacion: 1.0,
                createdBy: userEmail
              },
              {
                cuentaId: cuentaPagadoraId, // Haber: Salida de Caja/Banco
                debe: 0,
                haber: doc.montoTotal,
                leyenda: `Transferencia`,
                monedaId: 1,
                cotizacion: 1.0,
                createdBy: userEmail
              }
            ]
          }
        }
      });

      // 2. Actualizar Documento
      const updatedDoc = await tx.documentoProveedores.update({
        where: { id },
        data: {
          pagado: true,
          fechaPago: new Date(fechaPago),
          montoPagado: doc.montoTotal,
          asientoPagoId: asientoPago.id,
          updatedBy: userEmail
        }
      });

      await auditCreate("Asiento", asientoPago.id, JSON.parse(JSON.stringify(asientoPago)), userEmail, empresaId);
      await auditUpdate("DocumentoProveedores", id, doc, JSON.parse(JSON.stringify(updatedDoc)), userEmail, empresaId);

      revalidatePath("/docprov");
      return { success: true };
    });
  } catch (error: any) {
    console.error("Error al pagar documento:", error);
    return { error: error.message || "Error al registrar el pago." };
  }
}
