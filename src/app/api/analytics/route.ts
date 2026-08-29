// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // Return empty analytics for unauthenticated users (no 401)
  if (!session?.user?.id) {
    return NextResponse.json({
      summary: { totalJobs: 0, totalEvals: 0, totalRecs: 0, totalExports: 0, avgAuc: 0, avgLatency: 0 },
      timeSeries: [],
      modelUsage: [],
    });
  }

  const userId = session.user.id;

  try {
    const [jobs, evals, recs, exports_] = await Promise.all([
      db.trainingJob.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
      db.evaluation.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 }),
      db.recommendationLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 }),
      db.exportRecord.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
    ]);

    const completedJobs = jobs.filter(j => j.status === "completed");
    const avgAuc = completedJobs.length > 0
      ? completedJobs.reduce((s, j) => s + (j.finalAuc ?? 0), 0) / completedJobs.length
      : 0;
    const avgLatency = recs.length > 0
      ? recs.reduce((s, r) => s + (r.latencyMs ?? 0), 0) / recs.length
      : 0;

    // Time series - last 7 days
    const now = Date.now();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now - (6 - i) * 86400000);
      return d.toISOString().slice(0, 10);
    });

    const timeSeries = days.map(day => ({
      date: day,
      jobs: jobs.filter(j => j.createdAt.toISOString().startsWith(day)).length,
      evals: evals.filter(e => e.createdAt.toISOString().startsWith(day)).length,
      recs: recs.filter(r => r.createdAt.toISOString().startsWith(day)).length,
    }));

    const modelCounts: Record<string, number> = {};
    jobs.forEach(j => { modelCounts[j.collabModel] = (modelCounts[j.collabModel] ?? 0) + 1; });

    return NextResponse.json({
      summary: {
        totalJobs: jobs.length, totalEvals: evals.length,
        totalRecs: recs.length, totalExports: exports_.length,
        avgAuc: +avgAuc.toFixed(4), avgLatency: +avgLatency.toFixed(1),
      },
      timeSeries,
      modelUsage: Object.entries(modelCounts).map(([model, count]) => ({ model, count })),
    });
  } catch {
    return NextResponse.json({
      summary: { totalJobs: 0, totalEvals: 0, totalRecs: 0, totalExports: 0, avgAuc: 0, avgLatency: 0 },
      timeSeries: [],
      modelUsage: [],
    });
  }
}
