import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendReportEmail } from "@/lib/email";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  to: z.string().email(),
  reportTitle: z.string(),
  reportType: z.string(),
  dataset: z.string(),
  metrics: z.record(z.union([z.number(), z.string()])),
  exportId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  try {
    const data = schema.parse(body);
    const result = await sendReportEmail({
      to: data.to,
      recipientName: session.user.name ?? "Researcher",
      reportTitle: data.reportTitle,
      reportType: data.reportType,
      dataset: data.dataset,
      metrics: data.metrics,
      generatedAt: new Date().toISOString(),
    });

    if (data.exportId) {
      await db.exportRecord.update({
        where: { id: data.exportId },
        data: { emailSent: true, emailTo: data.to },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, messageId: result.data?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to send email" }, { status: 500 });
  }
}
