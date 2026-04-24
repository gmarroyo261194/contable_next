"use server";

import prisma from "@/lib/prisma";
import { generatePagos360Link } from "../pagos360";
import { sendEmail } from "../mail";
import { format } from "date-fns";

export async function generatePaymentLinkAction(documentoId: number) {
  try {
    const documento = await prisma.documentoClientes.findUnique({
      where: { id: documentoId },
      include: { entidad: true }
    });

    if (!documento) {
      return { success: false, error: "Documento no encontrado." };
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
    await prisma.documentoClientes.update({
      where: { id: documento.id },
      data: {
        pagos360Id: BigInt(result.data.id),
        pagos360Url: result.data.checkout_url,
        pagos360Estado: result.data.state
      }
    });

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
      include: { entidad: true }
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

    // Si tuvieras una función para generar PDF on the fly o obtener el binario de AFIP, lo podrías adjuntar aquí
    // const pdfBuffer = await generateInvoicePDF(documento.id);
    const attachments: any[] = [];

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
