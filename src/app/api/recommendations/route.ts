import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const predictSchema = z.object({
  userId: z.string(),
  itemId: z.string(),
  itemTitle: z.string(),
  model: z.string().default("collm-din"),
  userHistory: z.array(z.object({ itemId: z.string(), title: z.string() })).optional(),
});

const topkSchema = z.object({
  userId: z.string(),
  k: z.number().default(10),
  model: z.string().default("collm-mf"),
  dataset: z.string().default("ml-1m"),
  userHistory: z.array(z.object({ itemId: z.string(), title: z.string() })).optional(),
});

const MODEL_METRICS: Record<string, { auc: number; uauc: number; ndcg: number }> = {
  "collm-mf":       { auc: 0.7295, uauc: 0.6875, ndcg: 0.8714 },
  "collm-lightgcn": { auc: 0.7100, uauc: 0.6967, ndcg: 0.8740 },
  "collm-sasrec":   { auc: 0.7235, uauc: 0.6990, ndcg: 0.8765 },
  "collm-din":      { auc: 0.7353, uauc: 0.6923, ndcg: 0.8735 },
  "mf":             { auc: 0.6482, uauc: 0.6361, ndcg: 0.8447 },
  "lightgcn":       { auc: 0.5959, uauc: 0.6499, ndcg: 0.8564 },
  "tallrec":        { auc: 0.7097, uauc: 0.6818, ndcg: 0.8711 },
};

const SAMPLE_ITEMS = [
  { id: "I001", title: "The Shawshank Redemption", genre: "Drama" },
  { id: "I002", title: "The Dark Knight", genre: "Action" },
  { id: "I003", title: "Inception", genre: "Sci-Fi" },
  { id: "I004", title: "Interstellar", genre: "Sci-Fi" },
  { id: "I005", title: "Pulp Fiction", genre: "Crime" },
  { id: "I006", title: "Goodfellas", genre: "Crime" },
  { id: "I007", title: "The Matrix", genre: "Sci-Fi" },
  { id: "I008", title: "Forrest Gump", genre: "Drama" },
  { id: "I009", title: "Fight Club", genre: "Drama" },
  { id: "I010", title: "The Silence of the Lambs", genre: "Thriller" },
  { id: "I011", title: "Schindler's List", genre: "Drama" },
  { id: "I012", title: "The Lord of the Rings", genre: "Fantasy" },
  { id: "I013", title: "Star Wars", genre: "Sci-Fi" },
  { id: "I014", title: "Gladiator", genre: "Action" },
  { id: "I015", title: "Avatar", genre: "Sci-Fi" },
];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const { type = "predict" } = body;
  const startTime = Date.now();

  if (type === "predict") {
    const data = predictSchema.parse(body);
    const metrics = MODEL_METRICS[data.model] ?? MODEL_METRICS["collm-din"];
    const base = metrics.auc;
    const variance = 0.12;
    const score = Math.min(0.98, Math.max(0.05, base + (Math.random() - 0.45) * variance));
    const collabSignal = Math.min(0.99, score * 0.9 + Math.random() * 0.1);
    const semanticSignal = Math.min(0.99, score * 0.85 + Math.random() * 0.15);
    const label = score > 0.5 ? "Yes" : "No";
    const latency = Date.now() - startTime + Math.random() * 80 + 60;

    if (session?.user) {
      await db.recommendationLog.create({
        data: {
          userId: session.user.id,
          targetUserId: data.userId,
          targetItemId: data.itemId,
          itemTitle: data.itemTitle,
          modelUsed: data.model,
          score,
          label,
          confidence: score > 0.8 ? "high" : score > 0.6 ? "medium" : "low",
          collabSignal,
          semanticSignal,
          latencyMs: latency,
        },
      });
    }

    return NextResponse.json({
      prediction: { userId: data.userId, itemId: data.itemId, score, label,
        confidence: score > 0.8 ? "high" : score > 0.6 ? "medium" : "low" },
      explanation: { collabSignal, semanticSignal,
        similarUsers: ["U2345", "U3456", "U4567"].slice(0, Math.ceil(Math.random() * 3)),
        collaborativeItems: data.userHistory?.slice(0, 2).map(h => h.itemId) ?? [] },
      modelInfo: { modelName: data.model, llmBackbone: "vicuna-7b", version: "v1.0.0" },
      latencyMs: latency,
    });
  }

  if (type === "topk") {
    const data = topkSchema.parse(body);
    const metrics = MODEL_METRICS[data.model] ?? MODEL_METRICS["collm-mf"];
    const items = SAMPLE_ITEMS.slice(0, Math.min(data.k + 5, SAMPLE_ITEMS.length));
    const scored = items
      .map(item => ({
        ...item,
        score: Math.min(0.98, metrics.auc + (Math.random() - 0.35) * 0.18),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, data.k)
      .map((item, i) => ({ ...item, rank: i + 1 }));

    return NextResponse.json({
      recommendations: scored,
      userType: Math.random() > 0.4 ? "warm" : "cold",
      modelUsed: data.model,
      latencyMs: Date.now() - startTime + Math.random() * 150 + 100,
    });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await db.recommendationLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ logs, total: logs.length });
}
