"use client";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Trash2, CheckCircle, Clock, Cpu, Activity, BarChart3, RefreshCw, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const STEPS = [
  { id: "step0_collab_pretrain", label: "Step 0: Collab Pre-training", color: "text-blue-400", pct: [0, 33] },
  { id: "step1_lora_tuning", label: "Step 1: LoRA Text Tuning", color: "text-purple-400", pct: [33, 67] },
  { id: "step2_cie_tuning", label: "Step 2: CIE Module Tuning", color: "text-emerald-400", pct: [67, 100] },
];

export default function TrainingSection() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [lossHistory, setLossHistory] = useState<{ epoch: number; loss: number; auc: number }[]>([]);
  const [form, setForm] = useState({ name: "CoLLM-DIN on ML-1M", dataset: "ml-1m", collabModel: "din", llmBackbone: "vicuna-7b", collabDim: "64", loraR: "8", gpuCount: "1" });
  const tickerRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const fetchJobs = async () => {
    const res = await fetch("/api/training");
    if (res.ok) { const d = await res.json(); setJobs(d.jobs ?? []); }
  };

  useEffect(() => { fetchJobs(); }, []);

  const startTick = (jobId: string) => {
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
          ...prev.slice(-30),
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

  useEffect(() => {
    jobs.filter(j => j.status === "running" || j.status === "queued").forEach(j => startTick(j.id));
    return () => { Object.values(tickerRefs.current).forEach(clearInterval); };
  }, [jobs.length]);

  const handleCreate = async () => {
    setCreating(true);
    const res = await fetch("/api/training", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", ...form, collabDim: +form.collabDim, loraR: +form.loraR, gpuCount: +form.gpuCount }),
    });
    setCreating(false);
    if (!res.ok) { toast.error("Failed to start job"); return; }
    const d = await res.json();
    toast.success(`Job queued: ${d.jobId}`);
    setShowForm(false);
    setLossHistory([]);
    await fetchJobs();
  };

  const handleDelete = async (id: string) => {
    clearInterval(tickerRefs.current[id]);
    delete tickerRefs.current[id];
    await fetch(`/api/training?id=${id}`, { method: "DELETE" });
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const runningJob = jobs.find(j => j.status === "running" || j.status === "queued");
  const step = STEPS.find(s => s.id === runningJob?.currentStep) ?? STEPS[0];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Training Pipeline</h2>
          <p className="text-muted-foreground text-sm">Two-step CoLLM training: LoRA text tuning → CIE collaborative module</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchJobs}><RefreshCw className="size-3.5 mr-1" />Refresh</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowForm(!showForm)}>
            <Play className="size-3.5 mr-1" />New Job
          </Button>
        </div>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-emerald-500/30">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Cpu className="size-4 text-emerald-500" />Configure Training Job</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="col-span-full space-y-1.5">
                  <Label>Job Name</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="CoLLM-DIN on ML-1M" />
                </div>
                {[
                  { label: "Dataset", key: "dataset", opts: [["ml-1m","MovieLens-1M"],["amazon-book","Amazon Book"]] },
                  { label: "Collab Model", key: "collabModel", opts: [["mf","Matrix Factorization"],["lightgcn","LightGCN"],["sasrec","SASRec"],["din","DIN"]] },
                  { label: "LLM Backbone", key: "llmBackbone", opts: [["vicuna-7b","Vicuna-7B"],["qwen2-1.5b","Qwen2-1.5B"]] },
                  { label: "Collab Dim", key: "collabDim", opts: [["64","64"],["128","128"],["256","256"]] },
                  { label: "LoRA Rank", key: "loraR", opts: [["8","8"],["16","16"],["32","32"]] },
                  { label: "GPUs", key: "gpuCount", opts: [["1","1 GPU"],["2","2 GPUs"],["4","4 GPUs"]] },
                ].map(({ label, key, opts }) => (
                  <div key={key} className="space-y-1.5">
                    <Label>{label}</Label>
                    <Select value={(form as any)[key]} onValueChange={v => setForm(f => ({ ...f, [key]: v }))}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{opts.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ))}
                <div className="col-span-full flex gap-2 pt-2">
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreate} disabled={creating}>
                    {creating ? <Loader2 className="size-4 animate-spin mr-2" /> : <Play className="size-4 mr-2" />}
                    {creating ? "Queuing…" : "Start Training"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live progress */}
      {runningJob && (
        <Card className="border-emerald-500/30 glow-emerald-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 pulse-emerald inline-block" />
                <CardTitle className="text-base">{runningJob.name}</CardTitle>
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/40 text-[10px]">LIVE</Badge>
              </div>
              <span className="text-sm text-muted-foreground">{runningJob.progress?.toFixed(1)}%</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {STEPS.map(s => {
                const pct = runningJob.progress ?? 0;
                const done = pct >= s.pct[1];
                const active = pct >= s.pct[0] && pct < s.pct[1];
                const stepPct = active ? ((pct - s.pct[0]) / (s.pct[1] - s.pct[0])) * 100 : done ? 100 : 0;
                return (
                  <div key={s.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={done ? "text-emerald-400" : active ? s.color : "text-muted-foreground"}>{s.label}</span>
                      <span className={done ? "text-emerald-400" : "text-muted-foreground"}>{done ? "✓" : active ? `${stepPct.toFixed(0)}%` : "pending"}</span>
                    </div>
                    <Progress value={stepPct} className="h-1.5" />
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Train Loss", value: runningJob.trainLoss?.toFixed(4) ?? "—", color: "text-red-400" },
                { label: "Val AUC", value: runningJob.valAuc?.toFixed(4) ?? "—", color: "text-blue-400" },
                { label: "Best AUC", value: runningJob.bestValAuc?.toFixed(4) ?? "—", color: "text-emerald-400" },
              ].map(m => (
                <div key={m.label} className="bg-secondary/50 rounded-lg p-3 text-center">
                  <div className={`text-lg font-bold ${m.color}`}>{m.value}</div>
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                </div>
              ))}
            </div>

            {lossHistory.length > 2 && (
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lossHistory} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="epoch" tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" />
                    <YAxis tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" />
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                    <Line type="monotone" dataKey="loss" stroke="#f87171" strokeWidth={1.5} dot={false} name="Loss" />
                    <Line type="monotone" dataKey="auc" stroke="#10b981" strokeWidth={1.5} dot={false} name="Val AUC" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Jobs list */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="size-4 text-emerald-500" />Job History ({jobs.length})</CardTitle></CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Cpu className="size-10 mx-auto mb-3 opacity-30" />
              <p>No training jobs yet. Start one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => (
                <div key={job.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-secondary/20">
                  <div className="flex-shrink-0">
                    {job.status === "completed" ? <CheckCircle className="size-5 text-emerald-500" /> :
                     job.status === "running" ? <Activity className="size-5 text-blue-400 animate-pulse" /> :
                     <Clock className="size-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{job.name}</span>
                      <Badge variant="outline" className="text-[9px] shrink-0">{job.dataset}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{job.collabModel} · {job.llmBackbone}</div>
                    {job.status === "completed" && (
                      <div className="text-xs text-emerald-400 mt-0.5">
                        AUC: {job.finalAuc?.toFixed(4)} · UAUC: {job.finalUauc?.toFixed(4)} · NDCG: {job.finalNdcg?.toFixed(4)}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex gap-1">
                    <Badge variant={job.status === "completed" ? "default" : "secondary"} className={job.status === "completed" ? "bg-emerald-600" : ""}>
                      {job.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(job.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
