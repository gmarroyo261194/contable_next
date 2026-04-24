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
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || '"Pagos" <no-reply@pagos.com>',
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
