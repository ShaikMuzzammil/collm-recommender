// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  // Always return 200 — unauthenticated users get empty data, never 401
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({
        summary: { trainingSessions: 0, evaluations: 0, exports: 0, recommendations: 0 },
        recentExports: [],
        recentEvals: [],
      });
    }

    const userId = session.user.id;
    const [trainingCount, evalCount, exportCount, recommendCount] = await Promise.all([
      db.trainingJob.count({ where: { userId } }),
      db.evaluation.count({ where: { userId } }),
      db.exportRecord.count({ where: { userId } }),
      db.recommendationLog.count({ where: { userId } }),
    ]);

    const [recentExports, recentEvals] = await Promise.all([
      db.exportRecord.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
      db.evaluation.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

    return NextResponse.json({
      summary: {
        trainingSessions: trainingCount,
        evaluations:      evalCount,
        exports:          exportCount,
        recommendations:  recommendCount,
      },
      recentExports,
      recentEvals,
    });
  } catch (err: any) {
    console.error("Analytics error:", err?.message);
    // Return empty data instead of error
    return NextResponse.json({
      summary: { trainingSessions: 0, evaluations: 0, exports: 0, recommendations: 0 },
      recentExports: [],
      recentEvals: [],
    });
  }
}
