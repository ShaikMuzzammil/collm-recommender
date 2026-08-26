import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createFileSchema = z.object({
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  url: z.string(),
  category: z.string().default("general"),
  description: z.string().optional(),
  tags: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const files = await db.workspaceFile.findMany({
    where: { userId: session.user.id, ...(category ? { category } : {}) },
    orderBy: { createdAt: "desc" },
  });

  const stats = await db.workspaceFile.aggregate({
    where: { userId: session.user.id },
    _count: { id: true },
    _sum: { size: true },
  });

  return NextResponse.json({ files, stats: { count: stats._count.id, totalSize: stats._sum.size ?? 0 } });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "create") {
    const data = createFileSchema.parse(body);
    const file = await db.workspaceFile.create({
      data: { ...data, userId: session.user.id },
    });
    return NextResponse.json({ file }, { status: 201 });
  }

  if (action === "delete") {
    const { fileId } = body;
    await db.workspaceFile.deleteMany({ where: { id: fileId, userId: session.user.id } });
    return NextResponse.json({ success: true });
  }

  if (action === "update") {
    const { fileId, description, tags, category } = body;
    const file = await db.workspaceFile.updateMany({
      where: { id: fileId, userId: session.user.id },
      data: { description, tags, category },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
