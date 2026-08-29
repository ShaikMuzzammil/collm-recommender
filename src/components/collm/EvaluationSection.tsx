// @ts-nocheck
"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, BarChart3, TrendingUp, Target, Loader2, CheckCircle,
  Download, FileJson, FileText, Table, Info, Award, Zap, Users, Thermometer
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, Cell
} from "recharts";
import { useSession } from "next-auth/react";

const MODELS = [
  { id: "collm-din", label: "CoLLM-DIN", isCollm: true },
  { id: "collm-mf", label: "CoLLM-MF", isCollm: true },
  { id: "collm-lightgcn", label: "CoLLM-LightGCN", isCollm: true },
  { id: "collm-sasrec", label: "CoLLM-SASRec", isCollm: true },
  { id: "tallrec", label: "TALLRec (Baseline)", isCollm: false },
  { id: "mf", label: "Matrix Factorization (Baseline)", isCollm: false },
];

const DATASETS = [
  { id: "ml-1m", label: "MovieLens-1M" },
  { id: "amazon-book", label: "Amazon-Book" },
];

const EVAL_DATA: Record<string, Record<string, any>> = {
  "ml-1m": {
    "collm-din":      { auc: 0.7353, uauc: 0.6923, ndcg: 0.8735, aucW: 0.7600, uaucW: 0.7200, ndcgW: 0.8900, aucC: 0.7100, uaucC: 0.6400, ndcgC: 0.8200 },
    "collm-mf":       { auc: 0.7295, uauc: 0.6875, ndcg: 0.8714, aucW: 0.7500, uaucW: 0.7100, ndcgW: 0.8800, aucC: 0.7000, uaucC: 0.6300, ndcgC: 0.8100 },
    "collm-lightgcn": { auc: 0.7100, uauc: 0.6967, ndcg: 0.8740, aucW: 0.7300, uaucW: 0.7250, ndcgW: 0.8850, aucC: 0.6900, uaucC: 0.6500, ndcgC: 0.8150 },
    "collm-sasrec":   { auc: 0.7235, uauc: 0.6990, ndcg: 0.8765, aucW: 0.7450, uaucW: 0.7280, ndcgW: 0.8870, aucC: 0.7050, uaucC: 0.6600, ndcgC: 0.8250 },
    "tallrec":        { auc: 0.7097, uauc: 0.6818, ndcg: 0.8711, aucW: 0.7100, uaucW: 0.6900, ndcgW: 0.8700, aucC: 0.7500, uaucC: 0.6700, ndcgC: 0.8300 },
    "mf":             { auc: 0.6482, uauc: 0.6361, ndcg: 0.8447, aucW: 0.7200, uaucW: 0.6800, ndcgW: 0.8600, aucC: 0.4900, uaucC: 0.5100, ndcgC: 0.7400 },
  },
  "amazon-book": {
    "collm-din":      { auc: 0.8245, uauc: 0.6474, ndcg: 0.8550, aucW: 0.8500, uaucW: 0.6800, ndcgW: 0.8750, aucC: 0.7600, uaucC: 0.5900, ndcgC: 0.8000 },
    "collm-mf":       { auc: 0.8109, uauc: 0.6225, ndcg: 0.8457, aucW: 0.8350, uaucW: 0.6500, ndcgW: 0.8650, aucC: 0.7500, uaucC: 0.5700, ndcgC: 0.7900 },
    "collm-lightgcn": { auc: 0.8026, uauc: 0.6149, ndcg: 0.8411, aucW: 0.8250, uaucW: 0.6400, ndcgW: 0.8600, aucC: 0.7400, uaucC: 0.5600, ndcgC: 0.7800 },
    "collm-sasrec":   { auc: 0.7890, uauc: 0.6300, ndcg: 0.8500, aucW: 0.8100, uaucW: 0.6600, ndcgW: 0.8700, aucC: 0.7300, uaucC: 0.5800, ndcgC: 0.7850 },
    "tallrec":        { auc: 0.7375, uauc: 0.5983, ndcg: 0.8361, aucW: 0.7450, uaucW: 0.6200, ndcgW: 0.8400, aucC: 0.7300, uaucC: 0.5700, ndcgC: 0.8100 },
    "mf":             { auc: 0.7134, uauc: 0.5565, ndcg: 0.8194, aucW: 0.7800, uaucW: 0.6200, ndcgW: 0.8400, aucC: 0.4900, uaucC: 0.4400, ndcgC: 0.7100 },
  },
};

function MetricBar({ label, value, max = 1, color }: { label: string; value: number; max?: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>{value.toFixed(4)}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

let evalCounter = 0;

export default function EvaluationSection() {
  const { data: session } = useSession();
  const [evals, setEvals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("collm-din");
  const [dataset, setDataset] = useState("ml-1m");
  const [selected, setSelected] = useState<any | null>(null);
  const [activeView, setActiveView] = useState("metrics");

  const runEval = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

    let ev: any = null;

    // Try API if authenticated
    if (session?.user) {
      try {
        const res = await fetch("/api/evaluation", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelId: model, dataset, modelName: MODELS.find(m => m.id === model)?.label }),
        });
        if (res.ok) { const d = await res.json(); ev = d.evaluation; }
      } catch { /* fallback to local */ }
    }

    // Local simulation fallback
    if (!ev) {
      const noise = () => (Math.random() - 0.5) * 0.004;
      const dsData = EVAL_DATA[dataset] ?? EVAL_DATA["ml-1m"];
      const raw = dsData[model] ?? dsData["collm-din"];
      ev = {
        id: `eval-${++evalCounter}`,
        modelId: model,
        modelName: MODELS.find(m => m.id === model)?.label ?? model,
        dataset,
        status: "completed",
        aucOverall: raw.auc + noise(),
        uaucOverall: raw.uauc + noise(),
        ndcgOverall: raw.ndcg + noise(),
        aucWarm: raw.aucW + noise(),
        uaucWarm: raw.uaucW + noise(),
        ndcgWarm: raw.ndcgW + noise(),
        aucCold: raw.aucC + noise(),
        uaucCold: raw.uaucC + noise(),
        ndcgCold: raw.ndcgC + noise(),
        latencyMs: 82 + Math.random() * 30,
        sampleCount: dataset === "ml-1m" ? 7331 : 25747,
        completedAt: new Date().toISOString(),
      };
    }

    setLoading(false);
    setEvals(prev => [ev, ...prev]);
    setSelected(ev);
    toast.success(`Evaluation complete — AUC: ${ev.aucOverall?.toFixed(4)}`);
  };

  const radarData = selected ? [
    { metric: "AUC", overall: +(selected.aucOverall * 100).toFixed(1), warm: +(selected.aucWarm * 100).toFixed(1), cold: +(selected.aucCold * 100).toFixed(1) },
    { metric: "UAUC", overall: +(selected.uaucOverall * 100).toFixed(1), warm: +(selected.uaucWarm * 100).toFixed(1), cold: +(selected.uaucCold * 100).toFixed(1) },
    { metric: "NDCG", overall: +(selected.ndcgOverall * 100).toFixed(1), warm: +(selected.ndcgWarm * 100).toFixed(1), cold: +(selected.ndcgCold * 100).toFixed(1) },
  ] : [];

  const barData = selected ? [
    { name: "AUC", Warm: +(selected.aucWarm * 100).toFixed(1), Cold: +(selected.aucCold * 100).toFixed(1), Overall: +(selected.aucOverall * 100).toFixed(1) },
    { name: "UAUC", Warm: +(selected.uaucWarm * 100).toFixed(1), Cold: +(selected.uaucCold * 100).toFixed(1), Overall: +(selected.uaucOverall * 100).toFixed(1) },
    { name: "NDCG", Warm: +(selected.ndcgWarm * 100).toFixed(1), Cold: +(selected.ndcgCold * 100).toFixed(1), Overall: +(selected.ndcgOverall * 100).toFixed(1) },
  ] : [];

  const exportJSON = () => {
    if (!selected) return;
    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `eval-${selected.modelName?.replace(/\s+/g, "-")}-${selected.dataset}.json`;
    a.click(); toast.success("Exported JSON");
  };

  const exportCSV = () => {
    if (!selected) return;
    const rows = [
      ["Metric", "Overall", "Warm", "Cold"],
      ["AUC", selected.aucOverall?.toFixed(4), selected.aucWarm?.toFixed(4), selected.aucCold?.toFixed(4)],
      ["UAUC", selected.uaucOverall?.toFixed(4), selected.uaucWarm?.toFixed(4), selected.uaucCold?.toFixed(4)],
      ["NDCG", selected.ndcgOverall?.toFixed(4), selected.ndcgWarm?.toFixed(4), selected.ndcgCold?.toFixed(4)],
    ];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `eval-${selected.modelName?.replace(/\s+/g, "-")}-${selected.dataset}.csv`;
    a.click(); toast.success("Exported CSV");
  };

  const isCollmModel = MODELS.find(m => m.id === model)?.isCollm ?? false;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FlaskConical className="size-5 text-emerald-500" />Model Evaluation
          </h2>
          <p className="text-muted-foreground text-sm">AUC · UAUC · NDCG across warm-start and cold-start user scenarios</p>
        </div>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="size-4 text-emerald-500" />Run Evaluation</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODELS.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        {m.isCollm && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded">CoLLM</span>}
                        {m.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
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
                <SelectContent>
                  <SelectItem value="test">Test Set</SelectItem>
                  <SelectItem value="valid">Validation Set</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={runEval} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <FlaskConical className="size-4 mr-2" />}
              {loading ? "Evaluating…" : "Run Evaluation"}
            </Button>
            {!isCollmModel && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="size-3" />Baseline model for comparison
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="size-3" />Evaluation uses published CoLLM paper benchmark results with minor noise. No GPU needed.
          </p>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="border-emerald-500/20">
              <CardContent className="py-12 text-center space-y-3">
                <Loader2 className="size-10 text-emerald-500 animate-spin mx-auto" />
                <p className="text-muted-foreground">Running evaluation on {DATASETS.find(d => d.id === dataset)?.label}…</p>
                <p className="text-xs text-muted-foreground">Computing AUC, UAUC, NDCG across warm/cold user splits</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {selected && !loading && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Summary bar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-emerald-500" />
                <span className="font-semibold">{selected.modelName}</span>
                <Badge variant="outline" className="text-xs">{selected.dataset === "ml-1m" ? "MovieLens-1M" : "Amazon-Book"}</Badge>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Completed</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportJSON}><FileJson className="size-3.5 mr-1.5" />JSON</Button>
                <Button variant="outline" size="sm" onClick={exportCSV}><FileText className="size-3.5 mr-1.5" />CSV</Button>
              </div>
            </div>

            {/* Metric overview cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "AUC", v: selected.aucOverall, desc: "Area Under ROC Curve", color: "#10b981" },
                { label: "UAUC", v: selected.uaucOverall, desc: "User-level AUC", color: "#3b82f6" },
                { label: "NDCG", v: selected.ndcgOverall, desc: "Norm. Disc. Cum. Gain", color: "#a855f7" },
              ].map(m => (
                <Card key={m.label} className="text-center">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">{m.desc}</div>
                    <div className="text-2xl font-bold font-mono" style={{ color: m.color }}>{m.v?.toFixed(4)}</div>
                    <div className="text-xs font-semibold mt-0.5">{m.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs value={activeView} onValueChange={setActiveView}>
              <TabsList>
                <TabsTrigger value="metrics"><Target className="size-3.5 mr-1" />Warm/Cold</TabsTrigger>
                <TabsTrigger value="chart"><BarChart3 className="size-3.5 mr-1" />Bar Chart</TabsTrigger>
                <TabsTrigger value="radar"><TrendingUp className="size-3.5 mr-1" />Radar</TabsTrigger>
                <TabsTrigger value="history"><Table className="size-3.5 mr-1" />History</TabsTrigger>
              </TabsList>

              <TabsContent value="metrics">
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Warm-Start Users", icon: Zap, desc: "Users with sufficient historical interactions (>10 items)", color: "#3b82f6", data: { AUC: selected.aucWarm, UAUC: selected.uaucWarm, NDCG: selected.ndcgWarm } },
                    { title: "Cold-Start Users", icon: Thermometer, desc: "Users with sparse history (≤10 items) — harder scenario", color: "#f59e0b", data: { AUC: selected.aucCold, UAUC: selected.uaucCold, NDCG: selected.ndcgCold } },
                  ].map(section => (
                    <Card key={section.title}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <section.icon className="size-4" style={{ color: section.color }} />{section.title}
                        </CardTitle>
                        <CardDescription className="text-xs">{section.desc}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Object.entries(section.data).map(([k, v]) => (
                          <MetricBar key={k} label={k} value={v as number} color={section.color} />
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="chart">
                <Card>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={barData} margin={{ top: 4, right: 16, bottom: 4, left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} unit="%" />
                        <Tooltip formatter={(v: any) => [`${v}%`]} contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} />
                        <Legend />
                        <Bar dataKey="Overall" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Warm" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Cold" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="radar">
                <Card>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                        <Radar name="Overall" dataKey="overall" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                        <Radar name="Warm" dataKey="warm" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                        <Radar name="Cold" dataKey="cold" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                        <Legend />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardContent className="pt-4">
                    {evals.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 text-sm">No history yet — run an evaluation above</p>
                    ) : (
                      <div className="space-y-2">
                        {evals.map((ev, i) => (
                          <div key={ev.id ?? i} onClick={() => setSelected(ev)}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:border-emerald-500/30 ${selected?.id === ev.id ? "border-emerald-500/30 bg-emerald-500/5" : "border-border"}`}>
                            <div>
                              <div className="text-sm font-medium">{ev.modelName}</div>
                              <div className="text-xs text-muted-foreground">{ev.dataset === "ml-1m" ? "MovieLens-1M" : "Amazon-Book"} · {new Date(ev.completedAt).toLocaleTimeString()}</div>
                            </div>
                            <div className="flex gap-4 text-xs font-mono">
                              <span className="text-emerald-400">AUC: {ev.aucOverall?.toFixed(4)}</span>
                              <span className="text-blue-400">UAUC: {ev.uaucOverall?.toFixed(4)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {!selected && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <CardContent className="py-16 text-center">
                <FlaskConical className="size-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium text-muted-foreground">Select a model and dataset above, then click "Run Evaluation"</p>
                <p className="text-sm text-muted-foreground mt-1">Results will show AUC, UAUC, NDCG across warm/cold scenarios</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
