import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  dataset: z.string(),
  collabModel: z.string(),
  llmBackbone: z.string().default("vicuna-7b"),
  collabDim: z.number().default(64),
  loraR: z.number().default(8),
  loraAlpha: z.number().default(16),
  gpuCount: z.number().default(1),
});

// Simulate final metrics per model/dataset
const FINAL_METRICS: Record<string, Record<string, { auc: number; uauc: number; ndcg: number }>> = {
  "ml-1m": {
    mf:       { auc: 0.7295, uauc: 0.6875, ndcg: 0.8714 },
    lightgcn: { auc: 0.7100, uauc: 0.6967, ndcg: 0.8740 },
    sasrec:   { auc: 0.7235, uauc: 0.6990, ndcg: 0.8765 },
    din:      { auc: 0.7353, uauc: 0.6923, ndcg: 0.8735 },
  },
  "amazon-book": {
    mf:       { auc: 0.8109, uauc: 0.6225, ndcg: 0.8457 },
    lightgcn: { auc: 0.8026, uauc: 0.6149, ndcg: 0.8411 },
    sasrec:   { auc: 0.7746, uauc: 0.5962, ndcg: 0.8361 },
    din:      { auc: 0.8245, uauc: 0.6474, ndcg: 0.8550 },
  },
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "create") {
    const data = createSchema.parse(body);
    const job = await db.trainingJob.create({
      data: {
        userId: session.user.id,
        name: data.name,
        dataset: data.dataset,
        collabModel: data.collabModel,
        llmBackbone: data.llmBackbone,
        collabDim: data.collabDim,
        loraR: data.loraR,
        loraAlpha: data.loraAlpha,
        gpuCount: data.gpuCount,
        status: "queued",
        currentStep: "step0_collab_pretrain",
      },
    });
    return NextResponse.json({ jobId: job.id, status: "queued", estimatedMinutes: 35 + Math.floor(Math.random() * 20) }, { status: 201 });
  }

  if (action === "tick") {
    // Simulate progress update
    const { jobId } = body;
    const job = await db.trainingJob.findFirst({ where: { id: jobId, userId: session.user.id } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const steps = ["step0_collab_pretrain", "step1_lora_tuning", "step2_cie_tuning"];
    const stepIdx = steps.indexOf(job.currentStep ?? "step0_collab_pretrain");
    const newProgress = Math.min(job.progress + (Math.random() * 8 + 4), 100);
    const isComplete = newProgress >= 100;

    const dataset = job.dataset in FINAL_METRICS ? job.dataset : "ml-1m";
    const model = job.collabModel in (FINAL_METRICS[dataset] ?? {}) ? job.collabModel : "mf";
    const finalMetrics = FINAL_METRICS[dataset][model];

    const progressInStep = newProgress % 34;
    const trainLoss = 0.95 - (progressInStep / 34) * 0.6 + (Math.random() - 0.5) * 0.05;
    const valAuc = 0.5 + (newProgress / 100) * 0.23 + (Math.random() - 0.5) * 0.02;
    const newStep = newProgress < 34 ? steps[0] : newProgress < 67 ? steps[1] : steps[2];

    const updated = await db.trainingJob.update({
      where: { id: jobId },
      data: {
        progress: newProgress,
        currentStep: isComplete ? "completed" : newStep,
        status: isComplete ? "completed" : "running",
        trainLoss: Math.max(0.05, trainLoss),
        valAuc,
        bestValAuc: Math.max(job.bestValAuc ?? 0, valAuc),
        elapsedSeconds: (job.elapsedSeconds ?? 0) + 5,
        finalAuc: isComplete ? finalMetrics.auc + (Math.random() - 0.5) * 0.005 : undefined,
        finalUauc: isComplete ? finalMetrics.uauc + (Math.random() - 0.5) * 0.005 : undefined,
        finalNdcg: isComplete ? finalMetrics.ndcg + (Math.random() - 0.5) * 0.003 : undefined,
        completedAt: isComplete ? new Date() : undefined,
      },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobs = await db.trainingJob.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ jobs });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("id");
  if (!jobId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db.trainingJob.deleteMany({ where: { id: jobId, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
