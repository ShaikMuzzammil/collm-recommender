// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendContactAck } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(4),
  message: z.string().min(10),
  category: z.string().default("general"),
});

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const session = await getServerSession(authOptions);
  try {
    const data = schema.parse(body);

    // Try to save to DB (non-critical)
    let msgId: string | undefined;
    try {
      if (process.env.DATABASE_URL) {
        const msg = await db.contactMessage.create({
          data: { ...data, userId: session?.user?.id ?? null },
        });
        msgId = msg.id;
      }
    } catch (dbErr: any) {
      console.error("Contact DB error:", dbErr?.message);
    }

    // Send ack email if Gmail SMTP is configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      sendContactAck(data.email, data.name, data.subject).catch(e =>
        console.error("Contact ack email error:", e?.message)
      );
    }

    return NextResponse.json({ id: msgId ?? "no-db", status: "received" }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed" }, { status: 400 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ messages: [] });
  try {
    const msgs = await db.contactMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ messages: msgs });
  } catch { return NextResponse.json({ messages: [] }); }
}
