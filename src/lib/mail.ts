import nodemailer from "nodemailer";

export async function sendEmail({
  to,
  subject,
  html,
  attachments = [],
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
}) {
  try {
    const transporterConfig: any = {
      host: process.env.SMTP_HOST || "190.114.210.211",
      port: Number(process.env.SMTP_PORT) || 25,
      secure: false, // true for 465, false for other ports
      tls: {
        rejectUnauthorized: false // útil para relays internos
      }
    };

    if (process.env.SMTP_USER) {
      transporterConfig.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      };
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || '"Pagos" <noreply@frm.utn.edu.ar>',
      to,
      subject,
      html,
      attachments,
    });

    console.log("Mensaje enviado: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error enviando email:", error);
    return { success: false, error: error.message };
  }
}
