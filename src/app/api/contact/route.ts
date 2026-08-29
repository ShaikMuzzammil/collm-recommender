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
  const session = await getServerSession(authOptions);
  const body = await req.json();

  try {
    const data = schema.parse(body);
    const msg = await db.contactMessage.create({
      data: { ...data, userId: session?.user?.id },
    });

    if (process.env.RESEND_API_KEY) {
      await sendContactAck(data.email, data.name, data.subject).catch(console.error);
    }

    return NextResponse.json({ id: msg.id, status: "received" }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const msgs = await db.contactMessage.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ messages: msgs });
}
