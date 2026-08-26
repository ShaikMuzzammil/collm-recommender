"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { FlaskConical, BarChart3, TrendingUp, Target, Thermometer, Loader2, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from "recharts";

const MODELS = [
  { id: "collm-din", label: "CoLLM-DIN" },
  { id: "collm-mf", label: "CoLLM-MF" },
  { id: "collm-lightgcn", label: "CoLLM-LightGCN" },
  { id: "collm-sasrec", label: "CoLLM-SASRec" },
  { id: "tallrec", label: "TALLRec (Baseline)" },
  { id: "mf", label: "MF (Baseline)" },
];

const DATASETS = [
  { id: "ml-1m", label: "MovieLens-1M" },
  { id: "amazon-book", label: "Amazon-Book" },
];

export default function EvaluationSection() {
  const [evals, setEvals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("collm-din");
  const [dataset, setDataset] = useState("ml-1m");
  const [selected, setSelected] = useState<any | null>(null);

  const runEval = async () => {
    setLoading(true);
    const res = await fetch("/api/evaluation", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: model, dataset, modelName: MODELS.find(m => m.id === model)?.label }),
    });
    setLoading(false);
    if (!res.ok) { toast.error("Evaluation failed"); return; }
    const d = await res.json();
    const ev = d.evaluation;
    setEvals(prev => [ev, ...prev]);
    setSelected(ev);
    toast.success("Evaluation complete!");
  };

  const fetchHistory = async () => {
    const res = await fetch("/api/evaluation");
    if (res.ok) { const d = await res.json(); setEvals(d.evaluations ?? []); }
  };

  const radarData = selected ? [
    { metric: "AUC", overall: +(selected.aucOverall * 100).toFixed(1), warm: +(selected.aucWarm * 100).toFixed(1), cold: +(selected.aucCold * 100).toFixed(1) },
    { metric: "UAUC", overall: +(selected.uaucOverall * 100).toFixed(1), warm: +(selected.uaucWarm * 100).toFixed(1), cold: +(selected.uaucCold * 100).toFixed(1) },
    { metric: "NDCG", overall: +(selected.ndcgOverall * 100).toFixed(1), warm: +(selected.ndcgWarm * 100).toFixed(1), cold: +(selected.ndcgCold * 100).toFixed(1) },
  ] : [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Model Evaluation</h2>
          <p className="text-muted-foreground text-sm">AUC · UAUC · NDCG across warm and cold scenarios</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHistory}><RefreshCw className="size-3.5 mr-1" />Load History</Button>
      </div>

      {/* Config */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FlaskConical className="size-4 text-emerald-500" />Run Evaluation</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <Label>Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MODELS.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Dataset</Label>
            <Select value={dataset} onValueChange={setDataset}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DATASETS.map(d => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Split</Label>
            <Select defaultValue="test">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="test">Test Set</SelectItem><SelectItem value="valid">Validation</SelectItem></SelectContent>
            </Select>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={runEval} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <FlaskConical className="size-4 mr-2" />}
            {loading ? "Evaluating…" : "Run Evaluation"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {selected && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 gap-6">
          {/* Metric cards */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="size-4 text-emerald-500" />Overall Metrics — {selected.modelName}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "AUC", v: selected.aucOverall, w: selected.aucWarm, c: selected.aucCold },
                { label: "UAUC", v: selected.uaucOverall, w: selected.uaucWarm, c: selected.uaucCold },
                { label: "NDCG", v: selected.ndcgOverall, w: selected.ndcgWarm, c: selected.ndcgCold },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{m.label}</span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-emerald-400">Overall: {m.v?.toFixed(4)}</span>
                      <span className="text-blue-400">Warm: {m.w?.toFixed(4)}</span>
                      <span className="text-amber-400">Cold: {m.c?.toFixed(4)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[{ v: m.v, c: "bg-emerald-500" }, { v: m.w, c: "bg-blue-500" }, { v: m.c, c: "bg-amber-500" }].map((bar, i) => (
                      <div key={i} className="bg-secondary rounded-full h-2 overflow-hidden">
                        <div className={`h-full ${bar.c} rounded-full`} style={{ width: `${(bar.v ?? 0) * 100}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
                <div className="text-xs text-muted-foreground">Dataset: {selected.dataset} · Samples: {selected.sampleCount?.toLocaleString()} · Latency: {selected.latencyMs?.toFixed(1)}ms avg</div>
              </div>
            </CardContent>
          </Card>

          {/* Radar */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Thermometer className="size-4 text-emerald-500" />Warm vs Cold Radar</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Radar name="Overall" dataKey="overall" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                    <Radar name="Warm" dataKey="warm" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={1.5} />
                    <Radar name="Cold" dataKey="cold" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={1.5} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* History table */}
      {evals.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Evaluation History ({evals.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    {["Model", "Dataset", "AUC", "UAUC", "NDCG", "Warm AUC", "Cold AUC", "Date", ""].map(h => (
                      <th key={h} className="text-left p-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {evals.map(ev => (
                    <tr key={ev.id} className={`border-b border-border/50 hover:bg-secondary/30 cursor-pointer ${selected?.id === ev.id ? "bg-emerald-500/5" : ""}`} onClick={() => setSelected(ev)}>
                      <td className="p-2 font-medium text-emerald-400">{ev.modelName}</td>
                      <td className="p-2 text-muted-foreground">{ev.dataset}</td>
                      <td className="p-2 font-mono">{ev.aucOverall?.toFixed(4)}</td>
                      <td className="p-2 font-mono">{ev.uaucOverall?.toFixed(4)}</td>
                      <td className="p-2 font-mono">{ev.ndcgOverall?.toFixed(4)}</td>
                      <td className="p-2 font-mono text-blue-400">{ev.aucWarm?.toFixed(4)}</td>
                      <td className="p-2 font-mono text-amber-400">{ev.aucCold?.toFixed(4)}</td>
                      <td className="p-2 text-muted-foreground">{new Date(ev.createdAt).toLocaleDateString()}</td>
                      <td className="p-2"><CheckCircle className="size-3.5 text-emerald-500" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
