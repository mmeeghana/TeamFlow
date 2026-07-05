import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { HttpError } from '../../utils/http-error.js';
import { passwordResetEmailTemplate, verificationEmailTemplate } from './email.templates.js';

function createTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
    throw new HttpError(500, 'Email service is not configured.');
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

async function sendEmail(to: string, subject: string, html: string) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail(to: string, otp: string) {
  const template = verificationEmailTemplate(otp);
  await sendEmail(to, template.subject, template.html);
}

export async function sendPasswordResetEmail(to: string, otp: string) {
  const template = passwordResetEmailTemplate(otp);
  await sendEmail(to, template.subject, template.html);
}
