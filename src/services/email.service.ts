import nodemailer, { Transporter } from 'nodemailer';
import config from '../config';

// ─── Transporter Singleton ────────────────────────────────────────────────────
let transporter: Transporter;

const getTransporter = (): Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }
  return transporter;
};

// ─── Base Send Email ──────────────────────────────────────────────────────────
const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  // In development/test, log to console instead of sending
  if (config.nodeEnv !== 'production' && !config.email.user) {
    console.log('\n📧 ─── EMAIL (DEV MODE) ─────────────────────────');
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body:    ${html.replace(/<[^>]*>/g, '')}`);
    console.log('────────────────────────────────────────────────\n');
    return;
  }

  const mailOptions = {
    from: config.email.from,
    to,
    subject,
    html,
  };

  await getTransporter().sendMail(mailOptions);
};

// ─── OTP Email Template ───────────────────────────────────────────────────────
export const sendOtpEmail = async (
  email: string,
  name: string,
  otp: string,
  purpose: string
): Promise<void> => {
  const purposeText = {
    email_verification: 'verify your email address',
    login: 'log in to your account',
    password_reset: 'reset your password',
  }[purpose] || 'complete your request';

  const subject = `Your OTP Code — ${otp}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f9;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">🔐 Auth Module</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <p style="color:#374151;font-size:16px;margin:0 0 8px;">Hello, <strong>${name}</strong></p>
                <p style="color:#6b7280;font-size:15px;margin:0 0 32px;">Use the OTP below to ${purposeText}.</p>
                <div style="background:#f8fafc;border:2px dashed #e5e7eb;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
                  <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Your One-Time Password</p>
                  <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:12px;color:#1a1a2e;font-family:monospace;">${otp}</p>
                </div>
                <p style="color:#ef4444;font-size:13px;margin:0 0 8px;">⏱ Expires in <strong>${config.otp.expiryMinutes} minutes</strong></p>
                <p style="color:#6b7280;font-size:13px;margin:0;">If you didn't request this, please ignore this email. Your account is safe.</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Auth Module. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
};

// ─── Password Reset Email ─────────────────────────────────────────────────────
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${config.client.url}/reset-password?token=${resetToken}`;
  const subject = 'Reset Your Password';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f9;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">🔑 Password Reset</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <p style="color:#374151;font-size:16px;margin:0 0 8px;">Hello, <strong>${name}</strong></p>
                <p style="color:#6b7280;font-size:15px;margin:0 0 32px;">You requested a password reset. Click the button below to set a new password.</p>
                <div style="text-align:center;margin-bottom:32px;">
                  <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;">Reset My Password</a>
                </div>
                <p style="color:#6b7280;font-size:13px;margin:0 0 8px;">Or paste this URL into your browser:</p>
                <p style="word-break:break-all;color:#3b82f6;font-size:12px;margin:0 0 24px;">${resetUrl}</p>
                <p style="color:#ef4444;font-size:13px;margin:0 0 8px;">⏱ This link expires in <strong>15 minutes</strong>.</p>
                <p style="color:#6b7280;font-size:13px;margin:0;">If you didn't request this, please ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Auth Module. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
};

// ─── Welcome Email ────────────────────────────────────────────────────────────
export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const subject = 'Welcome to Auth Module! 🎉';
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f9;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Welcome! 🎉</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;text-align:center;">
                <p style="color:#374151;font-size:18px;margin:0 0 16px;">Hello, <strong>${name}</strong>!</p>
                <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">Your account has been verified successfully. You're all set to get started.</p>
                <a href="${config.client.url}" style="display:inline-block;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;">Go to Dashboard</a>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
  await sendEmail(email, subject, html);
};
