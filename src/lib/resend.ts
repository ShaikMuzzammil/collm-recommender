// @ts-nocheck
// Resend — used ONLY for contact form emails (not report delivery)

interface ContactEmailOpts {
  to: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
  category: string;
}

export async function sendContactEmail(opts: ContactEmailOpts) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const ADMIN = process.env.CONTACT_ADMIN_EMAIL ?? process.env.EMAIL_USER ?? process.env.RESEND_FROM_EMAIL?.match(/<(.+)>/)?.[1] ?? "admin@collm.ai";
  const FROM  = process.env.RESEND_FROM_EMAIL ?? "CoLLM Platform <onboarding@resend.dev>";

  const html = `<!DOCTYPE html>
<html><body style="background:#0f172a;font-family:sans-serif;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#1e293b;border-radius:14px;overflow:hidden;border:1px solid #334155;">
    <div style="background:linear-gradient(135deg,#064e3b,#065f46);padding:22px 28px;">
      <div style="color:#6ee7b7;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">CoLLM Platform</div>
      <div style="color:#fff;font-size:20px;font-weight:800;margin-top:4px;">New Contact Message</div>
    </div>
    <div style="padding:24px 28px;space-y:12px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#64748b;font-size:12px;width:110px;">Name</td><td style="padding:8px 0;color:#e2e8f0;font-size:13px;">${opts.fromName}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:12px;">Email</td><td style="padding:8px 0;color:#10b981;font-size:13px;">${opts.fromEmail}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:12px;">Category</td><td style="padding:8px 0;color:#e2e8f0;font-size:13px;">${opts.category}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:12px;">Subject</td><td style="padding:8px 0;color:#fff;font-size:13px;font-weight:600;">${opts.subject}</td></tr>
      </table>
      <div style="background:#0f172a;border-radius:8px;padding:16px;margin-top:16px;">
        <div style="color:#64748b;font-size:11px;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Message</div>
        <div style="color:#cbd5e1;font-size:13px;line-height:1.7;">${opts.message.replace(/\n/g,"<br>")}</div>
      </div>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #1e293b;">
        <p style="color:#475569;font-size:11px;margin:0;">CoLLM Research Platform · Automated message</p>
      </div>
    </div>
  </div>
</body></html>`;

  const ackHtml = `<!DOCTYPE html>
<html><body style="background:#0f172a;font-family:sans-serif;padding:32px;">
  <div style="max-width:520px;margin:0 auto;background:#1e293b;border-radius:14px;overflow:hidden;border:1px solid #334155;">
    <div style="background:linear-gradient(135deg,#064e3b,#065f46);padding:22px 28px;">
      <div style="color:#6ee7b7;font-size:11px;font-weight:700;letter-spacing:3px;">CoLLM</div>
      <div style="color:#fff;font-size:20px;font-weight:800;margin-top:4px;">Message Received ✓</div>
    </div>
    <div style="padding:24px 28px;">
      <p style="color:#cbd5e1;font-size:14px;margin:0 0 12px;">Hi ${opts.fromName},</p>
      <p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 16px;">
        We received your message: <strong style="color:#e2e8f0;">"${opts.subject}"</strong>.<br>
        We'll get back to you within 1–2 business days.
      </p>
      <div style="background:#0f172a;border-radius:8px;padding:14px;">
        <p style="color:#475569;font-size:12px;margin:0;">CoLLM Research Platform · arXiv:2310.19488v3</p>
      </div>
    </div>
  </div>
</body></html>`;

  // 1. Send notification to admin
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: FROM,
      to: [ADMIN],
      subject: `📬 [CoLLM Contact] ${opts.subject}`,
      html,
      reply_to: opts.fromEmail,
    }),
  }).then(async r => { if (!r.ok) { const e = await r.json(); throw new Error(e.message ?? `Resend ${r.status}`); } });

  // 2. Send acknowledgment to sender
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: FROM,
      to: [opts.fromEmail],
      subject: `✅ We received your message — ${opts.subject}`,
      html: ackHtml,
    }),
  }).then(async r => { if (!r.ok) { const e = await r.json(); throw new Error(e.message ?? `Resend ack ${r.status}`); } });
}
