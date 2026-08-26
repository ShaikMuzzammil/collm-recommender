import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export interface ReportEmailPayload {
  to: string;
  recipientName: string;
  reportTitle: string;
  reportType: string;
  dataset: string;
  metrics: Record<string, number | string>;
  generatedAt: string;
  downloadUrl?: string;
}

export async function sendReportEmail(payload: ReportEmailPayload) {
  const { to, recipientName, reportTitle, reportType, dataset, metrics, generatedAt, downloadUrl } = payload;

  const metricsHtml = Object.entries(metrics)
    .map(([key, val]) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px;">${key}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #1e293b;color:#10b981;font-size:13px;font-weight:600;">${typeof val === 'number' ? (val * 100).toFixed(2) + '%' : val}</td>
      </tr>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#064e3b,#065f46);border-radius:16px 16px 0 0;padding:32px;text-align:center;border:1px solid #065f46;">
      <div style="display:inline-flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="width:48px;height:48px;background:#10b981;border-radius:12px;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:24px;">🧠</span>
        </div>
        <div style="text-align:left;">
          <div style="color:#10b981;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">CoLLM Platform</div>
          <div style="color:#ffffff;font-size:20px;font-weight:700;">Research Lab</div>
        </div>
      </div>
      <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 8px;">Report Ready</h1>
      <p style="color:#6ee7b7;font-size:14px;margin:0;">${reportTitle}</p>
    </div>

    <!-- Body -->
    <div style="background:#1e293b;padding:32px;border:1px solid #334155;border-top:none;">
      <p style="color:#e2e8f0;font-size:15px;margin:0 0 24px;">Hello ${recipientName},</p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Your <strong style="color:#10b981;">${reportType}</strong> report for dataset 
        <strong style="color:#10b981;">${dataset}</strong> has been generated successfully.
        Here's a summary of the key metrics:
      </p>

      <table style="width:100%;border-collapse:collapse;border:1px solid #1e293b;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        <thead>
          <tr style="background:#0f172a;">
            <th style="padding:12px 16px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Metric</th>
            <th style="padding:12px 16px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Value</th>
          </tr>
        </thead>
        <tbody>${metricsHtml}</tbody>
      </table>

      <div style="background:#0f172a;border:1px solid #1e4d3b;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="color:#6ee7b7;font-size:12px;margin:0 0 4px;font-weight:600;">📅 Generated At</p>
        <p style="color:#94a3b8;font-size:13px;margin:0;">${generatedAt}</p>
      </div>

      ${downloadUrl ? `
      <div style="text-align:center;margin:32px 0;">
        <a href="${downloadUrl}" style="background:#10b981;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:14px;display:inline-block;">
          ⬇️ Download Full Report
        </a>
      </div>` : ""}
    </div>

    <!-- Footer -->
    <div style="background:#0f172a;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border:1px solid #1e293b;border-top:none;">
      <p style="color:#475569;font-size:12px;margin:0 0 8px;">CoLLM Platform · Collaborative LLM for Recommendation</p>
      <p style="color:#334155;font-size:11px;margin:0;">Based on arXiv:2310.19488v3 · University of Science and Technology of China</p>
    </div>
  </div>
</body>
</html>`;

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "CoLLM Platform <reports@collm.app>",
    to,
    subject: `📊 ${reportTitle} — CoLLM Platform`,
    html,
  });
}

export async function sendContactAck(to: string, name: string, subject: string) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "CoLLM Platform <noreply@collm.app>",
    to,
    subject: `We received your message: ${subject}`,
    html: `
<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
  <h2 style="color:#10b981;">Message Received ✓</h2>
  <p>Hi ${name},</p>
  <p>We've received your message and will respond within 24–48 hours.</p>
  <p style="color:#64748b;font-size:13px;">— CoLLM Platform Team</p>
</div>`,
  });
}
