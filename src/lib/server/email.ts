import { createTransport } from "nodemailer";
import { env } from "$env/dynamic/private";

const transporter = createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT ?? 587),
  secure: env.SMTP_SECURE === "true",
  auth:
    env.SMTP_USER && env.SMTP_PASSWORD
      ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
      : undefined,
});

export type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  if (!env.SMTP_HOST) {
    console.warn("[email] SMTP_HOST not configured; skipping send.", {
      to,
      subject,
    });
    return;
  }
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}
