"use client";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Square, Trash2, CheckCircle, Clock, Cpu, Activity, BarChart3,
  RefreshCw, Loader2, BookOpen, ChevronRight, Info, Zap, Download, FileJson
} from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useSession } from "next-auth/react";

const STEPS = [
  { id: "step0", label: "Step 1: Pre-train Collaborative Model", desc: "Train MF/LightGCN/SASRec/DIN on interaction data to learn user-item embeddings", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", pct: [0, 33] },
  { id: "step1", label: "Step 2: Extract & Fuse Embeddings", desc: "Extract user/item collaborative embedding vectors (eu, ei ∈ ℝ⁶⁴) and construct hybrid prompts", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30", pct: [33, 67] },
  { id: "step2", label: "Step 3: Fine-tune LLM with LoRA", desc: "Two-phase: freeze backbone then full fine-tune with LoRA adapters (rank r, α) for recommendation", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", pct: [67, 100] },
];

const FINAL_METRICS: Record<string, Record<string, { auc: number; uauc: number; ndcg: number }>> = {
  "ml-1m": {
    mf: { auc: 0.7295, uauc: 0.6875, ndcg: 0.8714 },
    lightgcn: { auc: 0.7100, uauc: 0.6967, ndcg: 0.8740 },
    sasrec: { auc: 0.7235, uauc: 0.6990, ndcg: 0.8765 },
    din: { auc: 0.7353, uauc: 0.6923, ndcg: 0.8735 },
  },
  "amazon-book": {
    mf: { auc: 0.8109, uauc: 0.6225, ndcg: 0.8457 },
    lightgcn: { auc: 0.8026, uauc: 0.6149, ndcg: 0.8411 },
    sasrec: { auc: 0.7746, uauc: 0.5962, ndcg: 0.8361 },
    din: { auc: 0.8245, uauc: 0.6474, ndcg: 0.8550 },
  },
};

const GLOSSARY = [
  { term: "LoRA", full: "Low-Rank Adaptation", desc: "A parameter-efficient fine-tuning technique that injects trainable rank-decomposition matrices into the LLM layers, drastically reducing GPU memory. Rank r controls capacity." },
  { term: "CIE Module", full: "Collaborative Information Embedding", desc: "CoLLM's bridge module that converts numerical collaborative embedding vectors into soft tokens the LLM can process via its attention mechanism." },
  { term: "AUC", full: "Area Under ROC Curve", desc: "Probability that the model ranks a positive item above a random negative. 1.0 = perfect, 0.5 = random. Primary metric for recommendation quality." },
  { term: "UAUC", full: "User-level AUC", desc: "AUC computed per-user and then averaged. More robust to user-activity bias than global AUC — measures personalization quality." },
  { term: "NDCG", full: "Normalized Discounted Cumulative Gain", desc: "Measures ranking quality by giving higher scores to relevant items ranked higher in the list. Captures position sensitivity." },
  { term: "LightGCN", full: "Light Graph Convolutional Network", desc: "Simplifies GCN for collaborative filtering by removing feature transformation and non-linear activations, keeping only graph convolution." },
  { term: "SASRec", full: "Self-Attentive Sequential Recommendation", desc: "Transformer-based model that uses self-attention to capture sequential patterns in user interaction histories." },
  { term: "DIN", full: "Deep Interest Network", desc: "Uses attention mechanism to model user's diverse interests from historical behaviors, dynamically adapting representations." },
  { term: "Vicuna-7B", full: "Fine-tuned LLaMA Backbone", desc: "7 billion parameter instruction-tuned LLaMA model. CoLLM uses this as the LLM backbone for text understanding and recommendation scoring." },
];

let localJobCounter = 0;

export default function TrainingSection() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [lossHistory, setLossHistory] = useState<{ epoch: number; loss: number; auc: number }[]>([]);
  const [form, setForm] = useState({
    name: "CoLLM-DIN on ML-1M", dataset: "ml-1m", collabModel: "din",
    llmBackbone: "vicuna-7b", collabDim: "64", loraR: "8", gpuCount: "1"
  });
  const tickerRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const [activeTab, setActiveTab] = useState("pipeline");

  // Local simulation — works with or without auth
  const simulateJobLocally = (jobData: any) => {
    const id = `local-${++localJobCounter}-${Date.now()}`;
    const newJob = {
      id, ...jobData, status: "running", progress: 0,
      currentStep: "step0", trainLoss: 0.95, valAuc: 0.50,
      bestValAuc: 0.50, elapsedSeconds: 0, finalAuc: null, finalUauc: null, finalNdcg: null,
      createdAt: new Date().toISOString(),
    };
    setJobs(prev => [newJob, ...prev]);
    setLossHistory([]);
    setShowForm(false);

    let progress = 0;
    tickerRefs.current[id] = setInterval(() => {
      progress = Math.min(progress + (Math.random() * 4 + 2), 100);
      const isComplete = progress >= 100;
      const ds = jobData.dataset in FINAL_METRICS ? jobData.dataset : "ml-1m";
      const model = jobData.collabModel in (FINAL_METRICS[ds] ?? {}) ? jobData.collabModel : "din";
      const fm = FINAL_METRICS[ds][model];
      const trainLoss = Math.max(0.05, 0.95 - (progress / 100) * 0.72 + (Math.random() - 0.5) * 0.04);
      const valAuc = 0.50 + (progress / 100) * (fm.auc - 0.50) + (Math.random() - 0.5) * 0.01;
      const currentStep = progress < 33 ? "step0" : progress < 67 ? "step1" : "step2";

      setLossHistory(prev => [
        ...prev.slice(-40),
        { epoch: prev.length + 1, loss: +trainLoss.toFixed(4), auc: +valAuc.toFixed(4) },
      ]);

      setJobs(prev => prev.map(j => j.id === id ? {
        ...j, progress, status: isComplete ? "completed" : "running",
        currentStep: isComplete ? "completed" : currentStep,
        trainLoss, valAuc,
        bestValAuc: Math.max(j.bestValAuc ?? 0, valAuc),
        elapsedSeconds: (j.elapsedSeconds ?? 0) + 3,
        finalAuc: isComplete ? fm.auc + (Math.random() - 0.5) * 0.003 : null,
        finalUauc: isComplete ? fm.uauc + (Math.random() - 0.5) * 0.003 : null,
        finalNdcg: isComplete ? fm.ndcg + (Math.random() - 0.5) * 0.002 : null,
        completedAt: isComplete ? new Date().toISOString() : null,
      } : j));

      if (isComplete) {
        clearInterval(tickerRefs.current[id]);
        delete tickerRefs.current[id];
        toast.success(`Training complete! AUC: ${(fm.auc).toFixed(4)}`);
      }
    }, 1200);
    return id;
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      if (session?.user) {
        // Try API first
        const res = await fetch("/api/training", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create", ...form, collabDim: +form.collabDim, loraR: +form.loraR, gpuCount: +form.gpuCount }),
        });
        if (res.ok) {
          const d = await res.json();
          toast.success(`Job queued: ${d.jobId}`);
          setShowForm(false);
          setLossHistory([]);
          const res2 = await fetch("/api/training");
          if (res2.ok) { const d2 = await res2.json(); setJobs(d2.jobs ?? []); }
          // Start ticking for DB job
          const jobId = d.jobId;
          startDbTick(jobId);
          setCreating(false);
          return;
        }
      }
      // Fallback to local simulation
      simulateJobLocally({ ...form });
      toast.success("Training simulation started!");
    } catch {
      simulateJobLocally({ ...form });
      toast.success("Training simulation started!");
    }
    setCreating(false);
  };

  const startDbTick = (jobId: string) => {
    if (tickerRefs.current[jobId]) return;
    tickerRefs.current[jobId] = setInterval(async () => {
      const res = await fetch("/api/training", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tick", jobId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setJobs(prev => prev.map(j => j.id === jobId ? updated : j));
        setLossHistory(prev => [
          ...prev.slice(-40),
          { epoch: prev.length + 1, loss: +(updated.trainLoss ?? 0.5).toFixed(4), auc: +(updated.valAuc ?? 0.5).toFixed(4) },
        ]);
        if (updated.status === "completed") {
          clearInterval(tickerRefs.current[jobId]);
          delete tickerRefs.current[jobId];
          toast.success(`Training complete! AUC: ${updated.finalAuc?.toFixed(4)}`);
        }
      }
    }, 1800);
  };

  const handleDelete = (id: string) => {
    clearInterval(tickerRefs.current[id]);
    delete tickerRefs.current[id];
    setJobs(prev => prev.filter(j => j.id !== id));
    toast.success("Job removed");
  };

  const exportJob = (job: any) => {
    if (!job.finalAuc) { toast.error("Job not complete yet"); return; }
    const data = {
      jobId: job.id, name: job.name, dataset: job.dataset,
      collabModel: job.collabModel, llmBackbone: job.llmBackbone,
      metrics: { auc: job.finalAuc, uauc: job.finalUauc, ndcg: job.finalNdcg },
      completedAt: job.completedAt,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `training-${job.name?.replace(/\s+/g, "-").toLowerCase() || "job"}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Training results exported");
  };

  const runningJob = jobs.find(j => j.status === "running" || j.status === "queued");
  const step = STEPS.find(s => s.id === runningJob?.currentStep) ?? STEPS[0];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cpu className="size-5 text-emerald-500" />Training Pipeline
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Live Simulation</Badge>
          </h2>
          <p className="text-muted-foreground text-sm">Two-step CoLLM training: Collaborative pre-training → LoRA LLM fine-tuning</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowForm(!showForm)}>
            <Play className="size-3.5 mr-1" />New Job
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="pipeline"><Cpu className="size-3.5 mr-1.5" />Pipeline</TabsTrigger>
          <TabsTrigger value="chart"><BarChart3 className="size-3.5 mr-1.5" />Loss Chart</TabsTrigger>
          <TabsTrigger value="guide"><BookOpen className="size-3.5 mr-1.5" />Glossary</TabsTrigger>
        </TabsList>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          {/* New Job Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Cpu className="size-4 text-emerald-500" />Configure Training Job</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Job Name</Label>
                      <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="CoLLM-DIN on ML-1M" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { label: "Dataset", key: "dataset", opts: [{ v: "ml-1m", l: "MovieLens-1M" }, { v: "amazon-book", l: "Amazon-Book" }] },
                        { label: "Collab Model (CIE)", key: "collabModel", opts: [{ v: "mf", l: "MF (Matrix Factorization)" }, { v: "lightgcn", l: "LightGCN" }, { v: "sasrec", l: "SASRec" }, { v: "din", l: "DIN" }] },
                        { label: "LLM Backbone", key: "llmBackbone", opts: [{ v: "vicuna-7b", l: "Vicuna-7B" }, { v: "llama-7b", l: "LLaMA-2-7B" }] },
                        { label: "Collab Dim", key: "collabDim", opts: [{ v: "32", l: "32D" }, { v: "64", l: "64D" }, { v: "128", l: "128D" }] },
                        { label: "LoRA Rank (r)", key: "loraR", opts: [{ v: "4", l: "r=4" }, { v: "8", l: "r=8" }, { v: "16", l: "r=16" }] },
                        { label: "GPUs", key: "gpuCount", opts: [{ v: "1", l: "1 GPU" }, { v: "2", l: "2 GPUs" }, { v: "4", l: "4 GPUs" }] },
                      ].map(({ label, key, opts }) => (
                        <div key={key} className="space-y-1.5">
                          <Label>{label}</Label>
                          <Select value={(form as any)[key]} onValueChange={v => setForm(f => ({ ...f, [key]: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{opts.map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreate} disabled={creating}>
                        {creating ? <Loader2 className="size-4 animate-spin mr-2" /> : <Play className="size-4 mr-2" />}
                        {creating ? "Starting…" : "Start Training Simulation"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="size-3" />This runs a realistic ML simulation — no actual GPU required. Results match the CoLLM paper benchmarks.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Running Job Progress */}
          {runningJob && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-emerald-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="size-4 text-emerald-500 animate-pulse" />
                      {runningJob.name}
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Running</Badge>
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {Math.round(runningJob.progress ?? 0)}%
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={runningJob.progress ?? 0} className="h-2" />
                  {/* Steps */}
                  <div className="space-y-2">
                    {STEPS.map((s, i) => {
                      const prog = runningJob.progress ?? 0;
                      const done = prog >= s.pct[1];
                      const active = !done && prog >= s.pct[0];
                      return (
                        <div key={s.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${done ? "bg-emerald-500/5 border-emerald-500/20" : active ? s.bg : "border-transparent opacity-50"}`}>
                          <div className={`mt-0.5 size-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? "bg-emerald-500 text-white" : active ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                            {done ? <CheckCircle className="size-3" /> : i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${done ? "text-emerald-400" : active ? s.color : ""}`}>{s.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
                          </div>
                          {done && <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs">Done</Badge>}
                          {active && <Loader2 className="size-3.5 text-emerald-400 animate-spin shrink-0 mt-0.5" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Train Loss", v: runningJob.trainLoss?.toFixed(4) ?? "—" },
                      { label: "Val AUC", v: runningJob.valAuc?.toFixed(4) ?? "—" },
                      { label: "Elapsed", v: `${Math.round((runningJob.elapsedSeconds ?? 0) / 60)}m ${(runningJob.elapsedSeconds ?? 0) % 60}s` },
                    ].map(m => (
                      <div key={m.label} className="bg-muted/30 rounded-lg p-2.5 text-center">
                        <div className="text-xs text-muted-foreground">{m.label}</div>
                        <div className="font-mono text-sm font-bold text-emerald-400">{m.v}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Completed Jobs */}
          {jobs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Job History ({jobs.length})</h3>
              {jobs.map(job => (
                <motion.div key={job.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                  <Card className={job.status === "completed" ? "border-emerald-500/20" : "border-border"}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`size-2.5 rounded-full ${job.status === "completed" ? "bg-emerald-500" : job.status === "running" ? "bg-amber-500 animate-pulse" : "bg-muted-foreground"}`} />
                          <div>
                            <div className="font-medium text-sm">{job.name}</div>
                            <div className="text-xs text-muted-foreground">{job.collabModel?.toUpperCase()} · {job.dataset === "ml-1m" ? "MovieLens-1M" : "Amazon-Book"} · LoRA r={job.loraR ?? 8}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {job.status === "completed" && job.finalAuc && (
                            <div className="flex gap-3 text-xs">
                              <span className="text-emerald-400">AUC: <b>{job.finalAuc?.toFixed(4)}</b></span>
                              <span className="text-blue-400">UAUC: <b>{job.finalUauc?.toFixed(4)}</b></span>
                              <span className="text-purple-400">NDCG: <b>{job.finalNdcg?.toFixed(4)}</b></span>
                            </div>
                          )}
                          {job.status === "running" && <Progress value={job.progress ?? 0} className="w-24 h-1.5" />}
                          <div className="flex gap-1">
                            {job.status === "completed" && (
                              <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => exportJob(job)}>
                                <FileJson className="size-3.5 text-blue-400" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => handleDelete(job.id)}>
                              <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {jobs.length === 0 && !showForm && (
            <div className="text-center py-16 text-muted-foreground">
              <Cpu className="size-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No training jobs yet</p>
              <p className="text-sm">Click "New Job" to start a simulation</p>
            </div>
          )}
        </TabsContent>

        {/* Loss Chart Tab */}
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Training Loss & Validation AUC</CardTitle>
              <CardDescription>Real-time metrics from the active training job</CardDescription>
            </CardHeader>
            <CardContent>
              {lossHistory.length > 1 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={lossHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="epoch" tick={{ fontSize: 11 }} stroke="rgba(255,255,255,0.2)" label={{ value: "Epoch", position: "insideBottom", offset: -2, fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} stroke="rgba(255,255,255,0.2)" />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="loss" stroke="#f87171" strokeWidth={2} dot={false} name="Train Loss" />
                    <Line type="monotone" dataKey="auc" stroke="#10b981" strokeWidth={2} dot={false} name="Val AUC" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <BarChart3 className="size-12 opacity-20" />
                  <p className="text-sm">Start a training job to see live metrics</p>
                  <Button size="sm" variant="outline" onClick={() => { setActiveTab("pipeline"); setShowForm(true); }}>
                    <Play className="size-3.5 mr-1.5" />Start Training
                  </Button>
                </div>
              )}
              {lossHistory.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="bg-muted/30 rounded p-2 text-center">
                    <div className="text-xs text-muted-foreground">Current Loss</div>
                    <div className="font-mono text-sm text-red-400 font-bold">{lossHistory[lossHistory.length - 1]?.loss ?? "—"}</div>
                  </div>
                  <div className="bg-muted/30 rounded p-2 text-center">
                    <div className="text-xs text-muted-foreground">Current AUC</div>
                    <div className="font-mono text-sm text-emerald-400 font-bold">{lossHistory[lossHistory.length - 1]?.auc ?? "—"}</div>
                  </div>
                  <div className="bg-muted/30 rounded p-2 text-center">
                    <div className="text-xs text-muted-foreground">Epochs</div>
                    <div className="font-mono text-sm text-blue-400 font-bold">{lossHistory.length}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Glossary Tab */}
        <TabsContent value="guide" className="space-y-3">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-emerald-400 flex items-center gap-2 mb-1">
              <BookOpen className="size-4" />Training Pipeline — How It Works
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              CoLLM uses a two-step training pipeline: first, a collaborative model (MF/LightGCN/SASRec/DIN) is pre-trained on interaction data to produce embedding vectors. Then, these vectors are injected as soft tokens into an LLM (Vicuna-7B) which is fine-tuned with LoRA adapters. The result: a model that understands both collaborative patterns and language context.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {GLOSSARY.map(g => (
              <Card key={g.term} className="bg-muted/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2.5">
                    <div className="shrink-0 mt-0.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-xs font-mono font-bold">{g.term}</div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">{g.full}</div>
                      <div className="text-sm leading-relaxed">{g.desc}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
