"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BrainCircuit, TrendingUp, Cpu, BarChart3, Activity, BookOpen, Github, ArrowRight, Zap, Database, FlaskConical, CheckCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useSession } from "next-auth/react";

const MODEL_PERF = [
  { name: "CoLLM-DIN", auc: 0.7353, uauc: 0.6923, fill: "#10b981" },
  { name: "CoLLM-MF",  auc: 0.7295, uauc: 0.6875, fill: "#10b981" },
  { name: "CoLLM-SAS", auc: 0.7235, uauc: 0.6990, fill: "#10b981" },
  { name: "TALLRec",   auc: 0.7097, uauc: 0.6818, fill: "#3b82f6" },
  { name: "MF",        auc: 0.6482, uauc: 0.6361, fill: "#475569" },
];

const WARMCOLD = [
  { scenario: "Warm AUC", mf: 72.0, tallrec: 71.0, collm: 75.0 },
  { scenario: "Cold AUC", mf: 50.5, tallrec: 75.0, collm: 76.0 },
];

const PIPELINE_STEPS = [
  { id: 1, label: "Collaborative Model Pre-training", sub: "MF / LightGCN / SASRec / DIN", color: "bg-blue-500", done: true },
  { id: 2, label: "LoRA Text-Only Tuning", sub: "Cold-start recommendation learning", color: "bg-purple-500", done: true },
  { id: 3, label: "CIE Module Tuning", sub: "Collaborative Information Encoding", color: "bg-emerald-500", done: false },
];

const STATS = [
  { label: "Best AUC (ML-1M)", value: "0.7353", sub: "CoLLM-DIN", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { label: "Best AUC (Book)", value: "0.8245", sub: "CoLLM-DIN", icon: BarChart3, color: "text-blue-400", bg: "bg-blue-500/10" },
  { label: "Training Overhead", value: "+15.5%", sub: "vs TALLRec baseline", icon: Cpu, color: "text-purple-400", bg: "bg-purple-500/10" },
  { label: "Inference Overhead", value: "+12.5%", sub: "avg across datasets", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10" },
];

export default function DashboardSection() {
  const { setActiveTab } = useStore();
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetch("/api/analytics").then(r => r.ok ? r.json() : null).then(d => d && setAnalytics(d)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Welcome banner */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="gradient-emerald rounded-2xl p-6 border border-emerald-700/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="size-6 text-emerald-300" />
              <Badge className="bg-emerald-400/20 text-emerald-300 border-emerald-400/30 text-xs">arXiv:2310.19488v3</Badge>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {session?.user ? `Welcome back, ${session.user.name?.split(" ")[0]}!` : "CoLLM Research Platform"}
            </h1>
            <p className="text-emerald-200 text-sm max-w-xl leading-relaxed">
              Integrating Collaborative Embeddings into Large Language Models for Recommendation — train, evaluate, and export results from one unified workspace.
            </p>
            <div className="flex gap-2 mt-4">
              <Button size="sm" className="bg-white text-emerald-900 hover:bg-emerald-50" onClick={() => setActiveTab("training")}>
                <Cpu className="size-3.5 mr-1" />Start Training
              </Button>
              <Button size="sm" variant="outline" className="border-emerald-400/50 text-emerald-200 hover:bg-emerald-800/50" onClick={() => setActiveTab("recommend")}>
                <Activity className="size-3.5 mr-1" />Run Inference
              </Button>
              <a href="https://arxiv.org/abs/2310.19488" target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="ghost" className="text-emerald-300 hover:text-white">
                  <BookOpen className="size-3.5 mr-1" />Read Paper
                </Button>
              </a>
            </div>
          </div>
          <div className="hidden md:block text-right text-emerald-300/60 text-xs space-y-1">
            <div>USTC · Meta AI</div>
            <div>Vicuna-7B · Qwen2-1.5B</div>
            <div>ML-1M · Amazon-Book</div>
          </div>
        </div>
      </motion.div>

      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="border-border hover:border-emerald-500/30 transition-colors">
              <CardContent className="p-4">
                <div className={`size-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`size-4 ${s.color}`} />
                </div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs font-medium text-foreground mt-0.5">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.sub}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="size-4 text-emerald-500" />Model AUC Comparison — ML-1M</CardTitle></CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MODEL_PERF} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" />
                  <YAxis domain={[0.6, 0.76]} tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" />
                  <Tooltip formatter={(v: any) => v.toFixed(4)} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="auc" name="AUC" radius={[3, 3, 0, 0]}
                    fill="#10b981"
                    label={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="size-4 text-emerald-500" />Warm vs Cold Scenario AUC (%)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WARMCOLD} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="scenario" tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" />
                  <YAxis domain={[45, 80]} tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" unit="%" />
                  <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="mf" name="MF" fill="#475569" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="tallrec" name="TALLRec" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="collm" name="CoLLM" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training pipeline + Quick actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Cpu className="size-4 text-emerald-500" />CoLLM Two-Step Training Pipeline</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.id} className="relative flex items-start gap-4">
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-8 bg-border" />
                )}
                <div className={`size-8 rounded-full ${step.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 z-10`}>
                  {step.done ? <CheckCircle className="size-4" /> : step.id}
                </div>
                <div className="flex-1 pb-2">
                  <div className="font-medium text-sm">{step.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{step.sub}</div>
                </div>
              </div>
            ))}
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 mt-2" onClick={() => setActiveTab("training")}>
              Launch Training Pipeline <ArrowRight className="size-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Run Inference", tab: "recommend" as const, icon: Zap, color: "text-emerald-400" },
              { label: "Evaluate Model", tab: "evaluation" as const, icon: FlaskConical, color: "text-blue-400" },
              { label: "Export PDF", tab: "export" as const, icon: BarChart3, color: "text-red-400" },
              { label: "Browse Datasets", tab: "datasets" as const, icon: Database, color: "text-purple-400" },
              { label: "Analytics", tab: "analytics" as const, icon: Activity, color: "text-amber-400" },
              { label: "Contact Team", tab: "contact" as const, icon: BookOpen, color: "text-pink-400" },
            ].map(a => (
              <button key={a.label} onClick={() => setActiveTab(a.tab)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/60 transition-colors text-left group">
                <a.icon className={`size-4 ${a.color}`} />
                <span className="text-sm group-hover:text-foreground text-muted-foreground transition-colors">{a.label}</span>
                <ArrowRight className="size-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* User stats (if logged in + analytics) */}
      {analytics?.summary && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Your Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4 text-center">
              {[
                { label: "Jobs", value: analytics.summary.totalJobs },
                { label: "Evaluations", value: analytics.summary.totalEvals },
                { label: "Predictions", value: analytics.summary.totalRecs },
                { label: "Exports", value: analytics.summary.totalExports },
                { label: "Avg AUC", value: analytics.summary.avgAuc },
              ].map(s => (
                <div key={s.label} className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-lg font-bold text-emerald-400">{s.value || "0"}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
