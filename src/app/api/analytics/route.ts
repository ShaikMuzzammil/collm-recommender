import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
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

  const recsByDay = days.map(day => ({
    date: day,
    count: recs.filter(r => r.createdAt.toISOString().startsWith(day)).length,
    avgScore: (() => {
      const dayRecs = recs.filter(r => r.createdAt.toISOString().startsWith(day));
      return dayRecs.length > 0 ? dayRecs.reduce((s, r) => s + r.score, 0) / dayRecs.length : 0;
    })(),
  }));

  const modelUsage = recs.reduce((acc, r) => {
    acc[r.modelUsed] = (acc[r.modelUsed] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({
    summary: {
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      totalEvals: evals.length,
      totalRecs: recs.length,
      totalExports: exports_.length,
      avgAuc: avgAuc.toFixed(4),
      avgLatency: avgLatency.toFixed(1),
    },
    timeSeries: { recommendations: recsByDay },
    modelUsage,
    recentActivity: [...jobs.slice(0, 3), ...evals.slice(0, 3), ...recs.slice(0, 4)].slice(0, 8),
  });
}
