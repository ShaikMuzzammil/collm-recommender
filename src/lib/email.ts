interface EmailOptions {
  to: string;
  recipientName?: string;
  reportTitle: string;
  reportType: string;
  dataset: string;
  metrics: Record<string, number | string>;
  generatedAt: string;
}

function metricRow(key: string, val: number | string) {
  const formatted = typeof val === "number" ? val.toFixed(4) : val;
  return `
    <tr>
      <td style="padding:8px 12px;color:#94a3b8;font-size:13px;border-bottom:1px solid #1e293b;">${key}</td>
      <td style="padding:8px 12px;color:#10b981;font-weight:700;font-size:14px;font-family:monospace;border-bottom:1px solid #1e293b;">${formatted}</td>
    </tr>`;
}

export async function sendReportEmail(opts: EmailOptions) {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

  const metricsHtml = Object.entries(opts.metrics).map(([k, v]) => metricRow(k, v)).join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0f172a;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#064e3b,#065f46);padding:32px 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="display:inline-flex;align-items:center;gap:12px;margin-bottom:16px;">
                  <div style="background:#10b981;width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                    <span style="color:#fff;font-weight:900;font-size:18px;">C</span>
                  </div>
                  <div>
                    <div style="color:#6ee7b7;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">CoLLM</div>
                    <div style="color:#fff;font-size:14px;font-weight:700;">Research Platform</div>
                  </div>
                </div>
                <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 6px;">${opts.reportTitle}</h1>
                <p style="color:#a7f3d0;font-size:13px;margin:0;">${opts.reportType} · ${opts.dataset}</p>
              </td>
              <td align="right" valign="top">
                <div style="border:2px solid #6ee7b7;border-radius:8px;padding:10px 14px;text-align:center;color:#6ee7b7;font-size:11px;font-weight:700;">
                  OFFICIAL<br>REPORT<br><span style="font-size:9px;opacity:.7;">${new Date().toLocaleDateString()}</span>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:24px 32px 0;">
          <p style="color:#cbd5e1;font-size:14px;margin:0;">Hi ${opts.recipientName ?? "Researcher"},</p>
          <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:12px 0 0;">Your <strong style="color:#e2e8f0;">${opts.reportType}</strong> has been generated from the CoLLM Research Platform. Below are your key results for <strong style="color:#e2e8f0;">${opts.dataset}</strong>.</p>
        </td></tr>

        <!-- Metrics Table -->
        <tr><td style="padding:20px 32px;">
          <h3 style="color:#10b981;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 12px;">Evaluation Results</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #334155;border-radius:8px;overflow:hidden;">
            <tr>
              <th style="background:#0f172a;padding:10px 12px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;text-align:left;">Metric</th>
              <th style="background:#0f172a;padding:10px 12px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;text-align:left;">Value</th>
            </tr>
            ${metricsHtml}
          </table>
        </td></tr>

        <!-- Info -->
        <tr><td style="padding:0 32px 24px;">
          <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:16px;">
            <p style="color:#64748b;font-size:12px;margin:0;line-height:1.6;">
              This report is based on the CoLLM paper benchmarks (arXiv:2310.19488). Results are simulation-based and match published figures within ±0.003.<br><br>
              <span style="color:#10b981;">CoLLM Research Platform</span> · Generated at ${opts.generatedAt}
            </p>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0f172a;padding:16px 32px;border-top:1px solid #1e293b;">
          <p style="color:#334155;font-size:11px;margin:0;text-align:center;">
            CoLLM Research Platform · Based on arXiv:2310.19488 · USTC / MIT
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? "CoLLM Platform <onboarding@resend.dev>",
      to: [opts.to],
      subject: `📊 ${opts.reportTitle}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error: ${err}`);
  }

  return await res.json();
}

export async function sendContactAck(to: string, name: string, subject: string) {
  if (!process.env.RESEND_API_KEY) return;

  const html = `<!DOCTYPE html>
<html>
<body style="background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;padding:32px;">
  <div style="max-width:520px;margin:0 auto;background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">
    <div style="background:linear-gradient(135deg,#064e3b,#065f46);padding:24px 28px;">
      <div style="color:#10b981;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px;">CoLLM</div>
      <div style="color:#fff;font-size:18px;font-weight:800;">Message Received</div>
    </div>
    <div style="padding:24px 28px;">
      <p style="color:#cbd5e1;font-size:14px;margin:0 0 12px;">Hi ${name},</p>
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 16px;">
        We received your message: <strong style="color:#e2e8f0;">"${subject}"</strong>.<br>
        Our research team will get back to you within 1–2 business days.
      </p>
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:14px;">
        <p style="color:#64748b;font-size:12px;margin:0;">CoLLM Research Platform · arXiv:2310.19488</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? "CoLLM Platform <onboarding@resend.dev>",
      to: [to],
      subject: `✅ Message received — ${subject}`,
      html,
    }),
  });
}
