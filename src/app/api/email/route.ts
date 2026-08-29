import { NextRequest, NextResponse } from "next/server";
import { sendReportEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  to: z.string().email(),
  reportTitle: z.string().optional().default("CoLLM Evaluation Report"),
  reportType: z.string().optional().default("Evaluation Report"),
  dataset: z.string().optional().default("MovieLens-1M"),
  metrics: z.record(z.union([z.number(), z.string()])).optional().default({}),
});

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email not configured — add RESEND_API_KEY in Vercel environment variables" },
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
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const msg = err?.message ?? "Failed to send email";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
