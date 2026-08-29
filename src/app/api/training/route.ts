import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const METRICS: Record<string, Record<string, any>> = {
  "ml-1m":       { mf: { auc: 0.7295, uauc: 0.6875, ndcg: 0.8714 }, lightgcn: { auc: 0.7100, uauc: 0.6967, ndcg: 0.8740 }, sasrec: { auc: 0.7235, uauc: 0.6990, ndcg: 0.8765 }, din: { auc: 0.7353, uauc: 0.6923, ndcg: 0.8735 } },
  "amazon-book": { mf: { auc: 0.8109, uauc: 0.6225, ndcg: 0.8457 }, lightgcn: { auc: 0.8026, uauc: 0.6149, ndcg: 0.8411 }, sasrec: { auc: 0.7746, uauc: 0.5962, ndcg: 0.8361 }, din: { auc: 0.8245, uauc: 0.6474, ndcg: 0.8550 } },
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ jobs: [] });
  try {
    const jobs = await db.trainingJob.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 20 });
    return NextResponse.json({ jobs });
  } catch { return NextResponse.json({ jobs: [] }); }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  if (body.action === "tick") {
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { jobId } = body;
    try {
      const job = await db.trainingJob.findFirst({ where: { id: jobId, userId: session.user.id } });
      if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
      if (job.status === "completed") return NextResponse.json(job);

      const progress = Math.min((job.progress ?? 0) + (Math.random() * 4 + 2), 100);
      const isComplete = progress >= 100;
      const ds = METRICS[job.dataset] ?? METRICS["ml-1m"];
      const fm = ds[job.collabModel] ?? ds["din"];
      const trainLoss = Math.max(0.05, 0.95 - (progress / 100) * 0.72 + (Math.random() - 0.5) * 0.04);
      const valAuc = 0.50 + (progress / 100) * (fm.auc - 0.50) + (Math.random() - 0.5) * 0.01;
      const currentStep = progress < 33 ? "step0" : progress < 67 ? "step1" : "step2";

      const updated = await db.trainingJob.update({
        where: { id: jobId },
        data: {
          progress, status: isComplete ? "completed" : "running",
          currentStep: isComplete ? "completed" : currentStep,
          trainLoss, valAuc,
          bestValAuc: Math.max(job.bestValAuc ?? 0, valAuc),
          elapsedSeconds: (job.elapsedSeconds ?? 0) + 3,
          finalAuc: isComplete ? fm.auc + (Math.random() - 0.5) * 0.003 : null,
          finalUauc: isComplete ? fm.uauc + (Math.random() - 0.5) * 0.003 : null,
          finalNdcg: isComplete ? fm.ndcg + (Math.random() - 0.5) * 0.002 : null,
          completedAt: isComplete ? new Date() : null,
        },
      });
      return NextResponse.json(updated);
    } catch (e) { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
  }

  // Create new job
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized — local simulation will be used" }, { status: 401 });
  try {
    const schema = z.object({
      name: z.string(), dataset: z.string(), collabModel: z.string(),
      llmBackbone: z.string(), collabDim: z.number(), loraR: z.number(), gpuCount: z.number(),
    });
    const data = schema.parse(body);
    const job = await db.trainingJob.create({
      data: { userId: session.user.id, ...data, status: "running", progress: 0, currentStep: "step0" },
    });
    return NextResponse.json({ jobId: job.id, status: "queued" });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
