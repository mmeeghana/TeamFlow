import { OTP_EXPIRES_IN_MINUTES } from '../../utils/otp.js';

function renderOtpEmail(title: string, intro: string, otp: string) {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>
      <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:28px 32px;border-bottom:1px solid #e2e8f0;">
                    <div style="font-size:18px;font-weight:700;color:#0f172a;">TeamFlow</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">${title}</h1>
                    <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#475569;">${intro}</p>
                    <div style="letter-spacing:8px;font-size:32px;font-weight:700;color:#0f172a;background:#ecfeff;border:1px solid #a5f3fc;border-radius:10px;padding:18px 20px;text-align:center;">
                      ${otp}
                    </div>
                    <p style="margin:24px 0 0;font-size:14px;line-height:22px;color:#64748b;">This code expires in ${OTP_EXPIRES_IN_MINUTES} minutes. If you did not request this email, you can safely ignore it.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function verificationEmailTemplate(otp: string) {
  return {
    subject: 'Verify your TeamFlow account',
    html: renderOtpEmail(
      'Verify your TeamFlow account',
      'Use this verification code to activate your TeamFlow account.',
      otp,
    ),
  };
}

export function passwordResetEmailTemplate(otp: string) {
  return {
    subject: 'Reset your TeamFlow password',
    html: renderOtpEmail(
      'Reset your TeamFlow password',
      'Use this code to reset your TeamFlow password.',
      otp,
    ),
  };
}
