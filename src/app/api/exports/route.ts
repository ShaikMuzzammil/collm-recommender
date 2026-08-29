import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  type: z.string().default("evaluation"),
  format: z.string(),
  filename: z.string(),
  fileSize: z.number().optional(),
  dataSource: z.string().optional(),
  metadata: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  const session = await getServerSession(authOptions);

  // Always log to DB if authenticated, silently skip otherwise
  if (session?.user?.id) {
    try {
      const data = schema.parse(body);
      const record = await db.exportRecord.create({
        data: { userId: session.user.id, ...data },
      });
      return NextResponse.json({ record }, { status: 201 });
    } catch (e: any) {
      // Don't fail the export — just log the error
      console.error("Export log error:", e.message);
    }
  }

  return NextResponse.json({ success: true, message: "Export recorded (unauthenticated)" }, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ exports: [] });
  try {
    const exports = await db.exportRecord.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ exports });
  } catch { return NextResponse.json({ exports: [] }); }
}
