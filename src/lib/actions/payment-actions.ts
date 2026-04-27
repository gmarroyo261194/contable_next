"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { generatePagos360Link } from "../pagos360";
import { sendEmail } from "../mail";
import { format } from "date-fns";
import { generateInvoicePdf, PdfInvoiceData } from "../afip/generatePdf";
import { auditUpdate } from "@/lib/audit/auditLogger";

export async function generatePaymentLinkAction(documentoId: number) {
  try {
    const session = await auth();
    const empresaId = (session?.user as any)?.empresaId;
    const userEmail = session?.user?.email;

    if (!empresaId) return { success: false, error: "No hay empresa activa." };

    const documento = await prisma.documentoClientes.findUnique({
      where: { id: documentoId, empresaId }, // Validar pertenencia a empresa
      include: { 
        entidad: true,
        ejercicio: { select: { cerrado: true } }
      }
    });

    if (!documento) {
      return { success: false, error: "Documento no encontrado o no pertenece a su empresa." };
    }

    if (documento.ejercicio?.cerrado) {
      return { success: false, error: "El ejercicio contable está cerrado. No se pueden generar links de pago." };
    }

    if (documento.pagos360Url) {
      return { success: false, error: "El documento ya tiene un link de pago generado." };
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15); // Vence en 15 días por defecto
    const formattedDate = format(dueDate, "dd-MM-yyyy");

    const paymentData = {
      description: `Comprobante ${documento.tipo} ${documento.numero}`,
      first_due_date: formattedDate,
      first_total: Number(documento.montoTotal),
      payer_name: documento.entidad.nombre,
      payer_email: documento.entidad.email || "sin_correo@ejemplo.com", // Se requiere un correo
      metadata: {
        documento_id: documento.id
      }
    };

    const result = await generatePagos360Link(paymentData);

    if (!result.success || !result.data) {
      return { success: false, error: result.error || "No data received from Pagos360" };
    }

    // Actualizar documento con el link
    const updated = await prisma.documentoClientes.update({
      where: { id: documento.id },
      data: {
        pagos360Id: BigInt(result.data.id),
        pagos360Url: result.data.checkout_url,
        pagos360Estado: result.data.state
      }
    });

    // Auditoría
    await auditUpdate("DocumentoClientes", documentoId, documento, updated, userEmail, empresaId);

    return { success: true, url: result.data.checkout_url };

  } catch (error: any) {
    console.error("Error en generatePaymentLinkAction:", error);
    return { success: false, error: error.message };
  }
}

export async function sendPaymentEmailAction(documentoId: number) {
  try {
    const documento = await prisma.documentoClientes.findUnique({
      where: { id: documentoId },
      include: { 
        entidad: true,
        items: true
      }
    });

    if (!documento) {
      return { success: false, error: "Documento no encontrado." };
    }

    if (!documento.entidad.email) {
      return { success: false, error: "El cliente no tiene un email registrado." };
    }

    if (!documento.pagos360Url) {
      return { success: false, error: "El documento no tiene un link de pago. Generalo primero." };
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Tienes un nuevo comprobante para pagar</h2>
        <p>Hola <strong>${documento.entidad.nombre}</strong>,</p>
        <p>Se ha emitido el comprobante <strong>${documento.tipo} ${documento.numero}</strong> por un total de <strong>$${Number(documento.montoTotal).toLocaleString('es-AR')}</strong>.</p>
        <p>Puedes abonarlo de forma rápida y segura a través del siguiente botón de pago:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${documento.pagos360Url}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Pagar Ahora</a>
        </div>
        <p style="font-size: 12px; color: #6b7280; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          Este es un correo automático, por favor no respondas a esta dirección.
        </p>
      </div>
    `;

    const attachments: any[] = [];
    
    try {
      const ptoVentaStr = documento.numero.split("-")[0] || "1";
      const nroComprobanteStr = documento.numero.split("-")[1] || "1";

      const pdfData: PdfInvoiceData = {
        Id: documento.id,
        PtoVenta: Number(ptoVentaStr),
        NroComprobante: Number(nroComprobanteStr),
        Tipo: documento.tipo,
        NroCae: documento.cae,
        FechaVtoCae: documento.caeVto,
        ServicioId: documento.servicioId || 0,
        Clientes: {
          Nombre: documento.entidad.nombre,
          Identificacion: documento.entidad.cuit || documento.entidad.nroDoc || "0",
          CondicionIva: documento.entidad.condicionIva || 5, // Default a CF
          Direccion: null
        },
        FechasComprobantes: {
          FechaDesde: documento.fecha,
          FechaHasta: documento.fecha,
          VtoPago: documento.fecha
        },
        ItemsComprobantes: documento.items.map(it => ({
          Linea: it.descripcion,
          Cantidad: Number(it.cantidad),
          ImporteUnit: Number(it.precioUnitario),
          ImporteTotal: Number(it.importeTotal)
        }))
      };

      const pdfBuffer = await generateInvoicePdf(pdfData, 'arraybuffer');
      if (pdfBuffer) {
        attachments.push({
          filename: `Factura_${documento.numero}.pdf`,
          content: Buffer.from(pdfBuffer as ArrayBuffer),
          contentType: 'application/pdf'
        });
      }
    } catch (pdfError) {
      console.error("Error al generar PDF adjunto:", pdfError);
      // Opcional: Podrías decidir abortar el mail, pero generalmente es mejor enviarlo sin el PDF si falla,
      // o avisarle al usuario. En este caso solo logueamos.
    }

    const emailResult = await sendEmail({
      to: documento.entidad.email,
      subject: `Nuevo Comprobante: ${documento.tipo} ${documento.numero}`,
      html: htmlContent,
      attachments
    });

    if (!emailResult.success) {
      return { success: false, error: emailResult.error };
    }

    return { success: true, message: "Email enviado correctamente." };
  } catch (error: any) {
    console.error("Error en sendPaymentEmailAction:", error);
    return { success: false, error: error.message };
  }
}

export async function downloadInvoicePdfAction(documentoId: number) {
  try {
    const documento = await prisma.documentoClientes.findUnique({
      where: { id: documentoId },
      include: { 
        entidad: true,
        items: true
      }
    });

    if (!documento) {
      return { success: false, error: "Documento no encontrado." };
    }

    const ptoVentaStr = documento.numero.split("-")[0] || "1";
    const nroComprobanteStr = documento.numero.split("-")[1] || "1";

    const pdfData: PdfInvoiceData = {
      Id: documento.id,
      PtoVenta: Number(ptoVentaStr),
      NroComprobante: Number(nroComprobanteStr),
      Tipo: documento.tipo,
      NroCae: documento.cae,
      FechaVtoCae: documento.caeVto,
      ServicioId: documento.servicioId || 0,
      Clientes: {
        Nombre: documento.entidad.nombre,
        Identificacion: documento.entidad.cuit || documento.entidad.nroDoc || "0",
        CondicionIva: documento.entidad.condicionIva || 5, // Default a CF
        Direccion: null
      },
      FechasComprobantes: {
        FechaDesde: documento.fecha,
        FechaHasta: documento.fecha,
        VtoPago: documento.fecha
      },
      ItemsComprobantes: documento.items.map(it => ({
        Linea: it.descripcion,
        Cantidad: Number(it.cantidad),
        ImporteUnit: Number(it.precioUnitario),
        ImporteTotal: Number(it.importeTotal)
      }))
    };

    const pdfBuffer = await generateInvoicePdf(pdfData, 'arraybuffer');
    
    if (!pdfBuffer) {
      return { success: false, error: "No se pudo generar el PDF" };
    }

    const base64Pdf = Buffer.from(pdfBuffer as ArrayBuffer).toString('base64');
    return { success: true, base64: base64Pdf, filename: `Factura_${documento.numero}.pdf` };
  } catch (error: any) {
    console.error("Error en downloadInvoicePdfAction:", error);
    return { success: false, error: error.message };
  }
}
