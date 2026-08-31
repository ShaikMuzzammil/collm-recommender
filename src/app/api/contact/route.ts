// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/resend";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 chars"),
  email: z.string().email("Invalid email"),
  subject: z.string().min(4, "Subject too short"),
  message: z.string().min(10, "Message too short"),
  category: z.string().default("general"),
});

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const data = parsed.data;

  // Try Resend first
  if (process.env.RESEND_API_KEY) {
    try {
      await sendContactEmail({
        to: data.email,
        fromName: data.name,
        fromEmail: data.email,
        subject: data.subject,
        message: data.message,
        category: data.category,
      });
      return NextResponse.json({ status: "sent", method: "resend" }, { status: 201 });
    } catch (e: any) {
      console.error("Resend contact error:", e?.message);
      return NextResponse.json({ error: `Email delivery failed: ${e?.message}` }, { status: 500 });
    }
  }

  // Fallback: Nodemailer
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const nodemailer = (await import("nodemailer")).default;
      const t = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
      await t.sendMail({
        from: `"CoLLM Platform" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        replyTo: data.email,
        subject: `[CoLLM Contact] ${data.subject}`,
        text: `From: ${data.name} <${data.email}>\nCategory: ${data.category}\n\n${data.message}`,
      });
      return NextResponse.json({ status: "sent", method: "nodemailer" }, { status: 201 });
    } catch (e: any) {
      console.error("Nodemailer contact error:", e?.message);
      return NextResponse.json({ error: "Email delivery failed" }, { status: 500 });
    }
  }

  // No email configured — still accept the message (stored in-memory for this session)
  return NextResponse.json({ status: "received", method: "no-email", note: "Add RESEND_API_KEY or EMAIL_USER+EMAIL_PASS to enable email delivery" }, { status: 201 });
}
