import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ files: [] });
  try {
    const files = await db.workspaceFile.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ files });
  } catch { return NextResponse.json({ files: [] }); }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  if (body.action === "create") {
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
      const file = await db.workspaceFile.create({
        data: {
          userId: session.user.id,
          filename: body.filename ?? `file_${Date.now()}`,
          originalName: body.originalName ?? "unknown",
          mimeType: body.mimeType ?? "application/octet-stream",
          size: body.size ?? 0,
          url: body.url ?? "",
          category: body.category ?? "general",
          description: body.description ?? "",
          tags: body.tags ?? "",
        },
      });
      return NextResponse.json({ file });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
  }

  if (body.action === "update") {
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
      const file = await db.workspaceFile.update({
        where: { id: body.fileId, userId: session.user.id },
        data: { description: body.description, category: body.category },
      });
      return NextResponse.json({ file });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
  }

  if (body.action === "delete") {
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
      await db.workspaceFile.delete({ where: { id: body.fileId, userId: session.user.id } });
      return NextResponse.json({ success: true });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
