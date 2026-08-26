import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "CoLLM Platform API",
    version: "1.0.0",
    description: "Collaborative LLM for Recommendation — API Reference",
    paper: "arXiv:2310.19488v3",
    endpoints: {
      auth: { signIn: "POST /api/auth/callback/credentials", signUp: "POST /api/register" },
      recommendations: { predict: "POST /api/recommendations {type:'predict'}", topk: "POST /api/recommendations {type:'topk'}", history: "GET /api/recommendations" },
      training: { create: "POST /api/training {action:'create'}", tick: "POST /api/training {action:'tick'}", list: "GET /api/training", delete: "DELETE /api/training?id=" },
      evaluation: { run: "POST /api/evaluation", list: "GET /api/evaluation" },
      analytics: { dashboard: "GET /api/analytics" },
      workspace: { list: "GET /api/workspace", upload: "POST /api/workspace {action:'create'}", delete: "POST /api/workspace {action:'delete'}" },
      exports: { log: "POST /api/exports", list: "GET /api/exports" },
      email: { send: "POST /api/email" },
      contact: { send: "POST /api/contact" },
    },
    status: "operational",
    timestamp: new Date().toISOString(),
  });
}
