// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { sendReportEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  to: z.string().email(),
  reportTitle: z.string().optional().default("CoLLM Evaluation Report"),
  reportType: z.string().optional().default("Evaluation Report"),
  dataset: z.string().optional().default("MovieLens-1M"),
  metrics: z.record(z.union([z.number(), z.string()])).optional().default({}),
  warmCold: z.object({
    warm: z.object({ auc: z.number(), uauc: z.number(), ndcg: z.number() }),
    cold: z.object({ auc: z.number(), uauc: z.number(), ndcg: z.number() }),
    improvement: z.object({ auc: z.string(), uauc: z.string(), ndcg: z.string() }),
  }).optional(),
  allModels: z.array(z.object({
    method: z.string(), auc: z.number(), uauc: z.number(), ndcg: z.number(),
  })).optional(),
});

export async function POST(req: NextRequest) {
  const configured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  if (!configured) {
    return NextResponse.json(
      { error: "Email not configured — add EMAIL_USER and EMAIL_PASS in Vercel environment variables" },
      { status: 503 }
    );
  }

  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  try {
    const data = schema.parse(body);
    await sendReportEmail({
      to: data.to,
      recipientName: data.to.split("@")[0],
      reportTitle: data.reportTitle,
      reportType: data.reportType,
      dataset: data.dataset,
      metrics: data.metrics,
      generatedAt: new Date().toLocaleString(),
      warmCold: data.warmCold,
      allModels: data.allModels,
    });
    return NextResponse.json({ success: true, message: "Email sent via Gmail SMTP" });
  } catch (err: any) {
    const msg = err?.message ?? "Failed to send email";
    console.error("Email send error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
