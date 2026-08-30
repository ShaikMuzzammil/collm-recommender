// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organization: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Check DATABASE_URL first
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    return NextResponse.json(
      { error: "Database not configured. Add DATABASE_URL to environment variables." },
      { status: 503 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let data: any;
  try {
    data = schema.parse(body);
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    const exists = await db.user.findUnique({ where: { email: data.email } });
    if (exists) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await db.user.create({
      data: {
        name:         data.name,
        email:        data.email,
        password:     hashedPassword,
        organization: data.organization ?? null,
      },
    });

    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Registration DB error:", err?.message ?? err);
    // Prisma unique constraint error
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    // Connection error
    if (err?.message?.includes("connect") || err?.message?.includes("ECONNREFUSED")) {
      return NextResponse.json(
        { error: "Database connection failed. Check DATABASE_URL environment variable." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Registration failed — please try again" }, { status: 500 });
  }
}
