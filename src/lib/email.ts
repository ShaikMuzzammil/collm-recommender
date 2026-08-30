// @ts-nocheck
import nodemailer from "nodemailer";

// ─── Transport ───────────────────────────────────────────────────────────────
function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) throw new Error("EMAIL_USER and EMAIL_PASS are not configured");
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReportEmailOptions {
  to: string;
  recipientName?: string;
  reportTitle: string;
  reportType: string;
  dataset: string;
  metrics: Record<string, number | string>;
  generatedAt: string;
  warmCold?: {
    warm: { auc: number; uauc: number; ndcg: number };
    cold: { auc: number; uauc: number; ndcg: number };
    improvement: { auc: string; uauc: string; ndcg: string };
  };
  allModels?: Array<{ method: string; auc: number; uauc: number; ndcg: number }>;
}

// ─── Helper: metric row ───────────────────────────────────────────────────────
function metricRow(key: string, val: number | string) {
  const formatted = typeof val === "number" ? val.toFixed(4) : val;
  return `
    <tr>
      <td style="padding:8px 14px;color:#94a3b8;font-size:13px;border-bottom:1px solid #1e293b;">${key}</td>
      <td style="padding:8px 14px;color:#10b981;font-weight:700;font-size:14px;font-family:monospace;border-bottom:1px solid #1e293b;">${formatted}</td>
    </tr>`;
}

// ─── Helper: model row ────────────────────────────────────────────────────────
function modelRow(m: { method: string; auc: number; uauc: number; ndcg: number }, isCollm: boolean) {
  const bg = isCollm ? "#064e3b" : "transparent";
  const color = isCollm ? "#6ee7b7" : "#cbd5e1";
  return `
    <tr style="background:${bg}">
      <td style="padding:7px 12px;color:${color};font-size:12px;border-bottom:1px solid #1e293b;">${m.method}</td>
      <td style="padding:7px 12px;color:${color};font-size:12px;font-family:monospace;border-bottom:1px solid #1e293b;">${m.auc.toFixed(4)}</td>
      <td style="padding:7px 12px;color:${color};font-size:12px;font-family:monospace;border-bottom:1px solid #1e293b;">${m.uauc.toFixed(4)}</td>
      <td style="padding:7px 12px;color:${color};font-size:12px;font-family:monospace;border-bottom:1px solid #1e293b;">${m.ndcg.toFixed(4)}</td>
    </tr>`;
}

// ─── Report Email ─────────────────────────────────────────────────────────────
export async function sendReportEmail(opts: ReportEmailOptions) {
  const transporter = getTransporter();
  const metricsHtml = Object.entries(opts.metrics).map(([k, v]) => metricRow(k, v)).join("");

  const warmColdHtml = opts.warmCold ? `
    <tr><td colspan="2" style="padding:16px 32px 0;">
      <h3 style="color:#10b981;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 10px;">Warm / Cold Start Analysis</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #334155;border-radius:8px;overflow:hidden;">
        <tr>
          <th style="background:#0f172a;padding:8px 12px;color:#64748b;font-size:11px;text-align:left;">Scenario</th>
          <th style="background:#0f172a;padding:8px 12px;color:#64748b;font-size:11px;text-align:left;">AUC</th>
          <th style="background:#0f172a;padding:8px 12px;color:#64748b;font-size:11px;text-align:left;">UAUC</th>
          <th style="background:#0f172a;padding:8px 12px;color:#64748b;font-size:11px;text-align:left;">NDCG</th>
        </tr>
        <tr style="background:#1e293b">
          <td style="padding:8px 12px;color:#10b981;font-size:12px;border-bottom:1px solid #334155;">Warm Users</td>
          <td style="padding:8px 12px;color:#e2e8f0;font-size:12px;font-family:monospace;border-bottom:1px solid #334155;">${opts.warmCold.warm.auc.toFixed(4)}</td>
          <td style="padding:8px 12px;color:#e2e8f0;font-size:12px;font-family:monospace;border-bottom:1px solid #334155;">${opts.warmCold.warm.uauc.toFixed(4)}</td>
          <td style="padding:8px 12px;color:#e2e8f0;font-size:12px;font-family:monospace;border-bottom:1px solid #334155;">${opts.warmCold.warm.ndcg.toFixed(4)}</td>
        </tr>
        <tr style="background:#162032">
          <td style="padding:8px 12px;color:#60a5fa;font-size:12px;">Cold Users (&le;10 interactions)</td>
          <td style="padding:8px 12px;color:#e2e8f0;font-size:12px;font-family:monospace;">${opts.warmCold.cold.auc.toFixed(4)}</td>
          <td style="padding:8px 12px;color:#e2e8f0;font-size:12px;font-family:monospace;">${opts.warmCold.cold.uauc.toFixed(4)}</td>
          <td style="padding:8px 12px;color:#e2e8f0;font-size:12px;font-family:monospace;">${opts.warmCold.cold.ndcg.toFixed(4)}</td>
        </tr>
      </table>
      <p style="color:#64748b;font-size:11px;margin:8px 0 0;">Cold-start improvement over base: AUC ${opts.warmCold.improvement.auc} &nbsp;·&nbsp; UAUC ${opts.warmCold.improvement.uauc} &nbsp;·&nbsp; NDCG ${opts.warmCold.improvement.ndcg}</p>
    </td></tr>` : "";

  const allModelsHtml = opts.allModels && opts.allModels.length > 0 ? `
    <tr><td colspan="2" style="padding:16px 32px 0;">
      <h3 style="color:#10b981;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 10px;">Model Comparison</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #334155;border-radius:8px;overflow:hidden;">
        <tr>
          <th style="background:#0f172a;padding:8px 12px;color:#64748b;font-size:11px;text-align:left;">Method</th>
          <th style="background:#0f172a;padding:8px 12px;color:#64748b;font-size:11px;text-align:left;">AUC</th>
          <th style="background:#0f172a;padding:8px 12px;color:#64748b;font-size:11px;text-align:left;">UAUC</th>
          <th style="background:#0f172a;padding:8px 12px;color:#64748b;font-size:11px;text-align:left;">NDCG</th>
        </tr>
        ${opts.allModels.map(m => modelRow(m, m.method.includes("CoLLM"))).join("")}
      </table>
    </td></tr>` : "";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0f172a;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#064e3b,#065f46);padding:32px 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                  <tr>
                    <td style="background:#10b981;width:40px;height:40px;border-radius:10px;text-align:center;vertical-align:middle;">
                      <span style="color:#fff;font-weight:900;font-size:22px;line-height:40px;">C</span>
                    </td>
                    <td style="padding-left:12px;vertical-align:middle;">
                      <div style="color:#6ee7b7;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">CoLLM</div>
                      <div style="color:#fff;font-size:15px;font-weight:700;">Research Platform</div>
                    </td>
                  </tr>
                </table>
                <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 6px;">${opts.reportTitle}</h1>
                <p style="color:#a7f3d0;font-size:13px;margin:0;">${opts.reportType} &middot; ${opts.dataset}</p>
              </td>
              <td align="right" valign="top">
                <div style="border:2px solid #6ee7b7;border-radius:10px;padding:12px 16px;text-align:center;">
                  <div style="color:#6ee7b7;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">OFFICIAL</div>
                  <div style="color:#6ee7b7;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">REPORT</div>
                  <div style="color:#a7f3d0;font-size:10px;margin-top:4px;">${new Date().toLocaleDateString()}</div>
                  <div style="color:#10b981;font-size:11px;font-weight:700;margin-top:2px;">&#10003; VERIFIED</div>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:24px 32px 0;">
          <p style="color:#cbd5e1;font-size:14px;margin:0;">Hi ${opts.recipientName ?? "Researcher"},</p>
          <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:10px 0 0;">
            Your <strong style="color:#e2e8f0;">${opts.reportType}</strong> has been generated from the CoLLM Research Platform.
            Below are your full results for <strong style="color:#e2e8f0;">${opts.dataset}</strong>.
          </p>
        </td></tr>

        <!-- Key Metrics Table -->
        <tr><td style="padding:20px 32px 0;">
          <h3 style="color:#10b981;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 12px;">Key Evaluation Results</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #334155;border-radius:8px;overflow:hidden;">
            <tr>
              <th style="background:#0f172a;padding:10px 14px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;text-align:left;">Metric</th>
              <th style="background:#0f172a;padding:10px 14px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;text-align:left;">Value</th>
            </tr>
            ${metricsHtml}
          </table>
        </td></tr>

        <!-- Warm/Cold Analysis -->
        ${warmColdHtml}

        <!-- All Models -->
        ${allModelsHtml}

        <!-- Footer Info -->
        <tr><td style="padding:20px 32px 24px;">
          <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:16px;">
            <p style="color:#64748b;font-size:12px;margin:0;line-height:1.6;">
              This report is based on the CoLLM paper benchmarks (arXiv:2310.19488v3). Results reference published figures from the paper.<br><br>
              Generated at <span style="color:#10b981;">${opts.generatedAt}</span> &middot;
              <a href="https://arxiv.org/abs/2310.19488" style="color:#10b981;text-decoration:none;">arXiv:2310.19488v3</a>
            </p>
          </div>
        </td></tr>

        <!-- Footer Bar -->
        <tr><td style="background:#0f172a;padding:16px 32px;border-top:1px solid #1e293b;">
          <p style="color:#334155;font-size:11px;margin:0;text-align:center;">
            CoLLM Research Platform &middot; Based on arXiv:2310.19488v3 &middot; USTC / MIT
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"CoLLM Research Platform" <${process.env.EMAIL_USER}>`,
    to: opts.to,
    subject: `📊 ${opts.reportTitle}`,
    html,
  });
}

// ─── Contact Ack Email ────────────────────────────────────────────────────────
export async function sendContactAck(to: string, name: string, subject: string) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return; // Email not configured — silently skip

  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });

  const html = `<!DOCTYPE html>
<html>
<body style="background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;padding:32px;">
  <div style="max-width:520px;margin:0 auto;background:#1e293b;border-radius:14px;overflow:hidden;border:1px solid #334155;">
    <div style="background:linear-gradient(135deg,#064e3b,#065f46);padding:24px 28px;">
      <div style="color:#10b981;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px;">CoLLM</div>
      <div style="color:#fff;font-size:20px;font-weight:800;">Message Received &#10003;</div>
    </div>
    <div style="padding:24px 28px;">
      <p style="color:#cbd5e1;font-size:14px;margin:0 0 12px;">Hi ${name},</p>
      <p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 16px;">
        We received your message: <strong style="color:#e2e8f0;">"${subject}"</strong>.<br>
        Our research team will respond within 1–2 business days.
      </p>
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:14px;">
        <p style="color:#64748b;font-size:12px;margin:0;">CoLLM Research Platform &middot; arXiv:2310.19488v3 &middot; USTC / MIT</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"CoLLM Research Platform" <${user}>`,
    to,
    subject: `✅ Message received — ${subject}`,
    html,
  });
}
