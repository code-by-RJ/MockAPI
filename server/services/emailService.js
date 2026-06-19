import { Resend } from 'resend'

// Lazy init — server startup crash nahi hoga if key missing
// Only fails when actually sending email
let _resend = null
const getResend = () => {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM = 'MockAPI <noreply@mail.spacego.online>'

export async function sendVerifyOTP(email, name, otp) {
  await getResend().emails.send({
    from:    FROM,
    to:      email,
    subject: `${otp} — your MockAPI verification code`,
    html:    buildEmail({
      title:   'Verify your email',
      otp,
      message: `Hi ${name}, use the code below to verify your MockAPI account. It expires in 10 minutes.`,
      footer:  "If you didn't create a MockAPI account, you can safely ignore this email.",
    }),
  })
}

export async function sendResetOTP(email, name, otp) {
  await getResend().emails.send({
    from:    FROM,
    to:      email,
    subject: `${otp} — your MockAPI password reset code`,
    html:    buildEmail({
      title:   'Reset your password',
      otp,
      message: `Hi ${name}, use the code below to reset your MockAPI password. It expires in 10 minutes.`,
      footer:  "If you didn't request a password reset, ignore this email — your account is safe.",
    }),
  })
}

function buildEmail({ title, otp, message, footer }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#1E293B;border-radius:16px;border:1px solid #334155;overflow:hidden;">

        <tr><td style="padding:24px 32px;border-bottom:1px solid #334155;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:30px;height:30px;background:#22C55E;border-radius:7px;text-align:center;vertical-align:middle;">
              <span style="color:#0F172A;font-weight:800;font-size:15px;">M</span>
            </td>
            <td style="padding-left:9px;font-size:14px;font-weight:700;color:#F8FAFC;letter-spacing:-0.01em;">MockAPI</td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 10px;font-size:19px;font-weight:700;color:#F8FAFC;letter-spacing:-0.02em;">${title}</h1>
          <p style="margin:0 0 28px;font-size:13px;color:#94A3B8;line-height:1.65;">${message}</p>

          <div style="background:#0F172A;border:1px solid #334155;border-radius:12px;padding:22px;text-align:center;margin-bottom:28px;">
            <div style="letter-spacing:10px;font-size:34px;font-weight:700;color:#22C55E;font-family:'Courier New',monospace;padding-left:10px;">${otp}</div>
            <div style="margin-top:10px;font-size:11px;color:#475569;">Expires in 10 minutes</div>
          </div>

          <p style="margin:0;font-size:11px;color:#475569;line-height:1.55;">${footer}</p>
        </td></tr>

        <tr><td style="padding:14px 32px;border-top:1px solid #334155;text-align:center;">
          <p style="margin:0;font-size:11px;color:#475569;">mockapi.spacego.online</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}