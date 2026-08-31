// @ts-nocheck
'use client';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { models } from '@/lib/data';
import type { ModelId } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import {
  Network, ArrowRight, BrainCircuit, Cpu, Sparkles, Database, FileText,
  Play, CheckCircle2, GitBranch, Download, BarChart3, TrendingDown,
  Layers, ChevronRight, Zap, Clock, Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ── CIE Module Detail ─────────────────────────────────────────────────────────
function CIEModule({ modelId }: { modelId: ModelId }) {
  const model = models.find(m => m.id === modelId) || models[1];
  const details: Record<ModelId, { type: string; tags: string[]; desc: string }> = {
    mf:       { type: 'Traditional CF', tags: ['Latent factor model','Dot product scoring','SGD optimization','No sequential modeling'], desc: 'Decomposes interaction matrix into low-rank user and item latent factors.' },
    lightgcn: { type: 'Graph CF', tags: ['Graph propagation','Multi-hop neighbors','Normalized aggregation','No non-linearity'], desc: 'Propagates embeddings over user-item bipartite graph for neighborhood-aware representations.' },
    sasrec:   { type: 'Sequential CF', tags: ['Self-attention','Causal masking','Positional encoding','Long-range dependencies'], desc: 'Transformer-based sequential model capturing temporal interaction patterns.' },
    din:      { type: 'Target-Aware CF', tags: ['Attention mechanism','Target-aware pooling','Feature interaction','CTR-optimized'], desc: 'Uses target-aware attention over user behavior history for personalized activation.' },
  };
  const d = details[modelId] ?? details.mf;
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="size-4 text-emerald-500" />
          <CardTitle className="text-base">CIE Module — {model.shortName}</CardTitle>
        </div>
        <CardDescription>Collaborative Information Encoder: bridges {d.type} signals and LLM understanding</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[['Architecture', d.type], ['Embedding Dim', `${model.dim}D`], ['Status', 'Pre-trained ✓']].map(([k, v]) => (
            <div key={k} className="rounded-lg border p-3 bg-muted/30">
              <div className="text-xs text-muted-foreground mb-1">{k}</div>
              <div className={`text-sm font-semibold ${v === 'Pre-trained ✓' ? 'text-emerald-500' : ''}`}>{v}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-2">Key Features</div>
          <div className="flex flex-wrap gap-2">
            {d.tags.map(t => <Badge key={t} variant="outline" className="text-[11px] font-normal">{t}</Badge>)}
          </div>
        </div>
        <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{d.desc}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
          <Layers className="size-3.5 text-emerald-500" />
          Output: Collaborative embedding vector e<sub>u</sub>, e<sub>i</sub> ∈ ℝ<sup>{model.dim}</sup>
        </div>

        {/* CIE MLP diagram */}
        <div className="bg-slate-900/60 rounded-lg p-4 border border-border/30">
          <div className="text-xs text-muted-foreground mb-3 font-semibold">CIE Architecture</div>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {[
              { label: `[e_u; e_i]\n∈ ℝ^${model.dim*2}`, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { label: '→ W1·x+b1', color: 'text-slate-400', bg: '' },
              { label: 'GELU', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
              { label: '→ W2·x+b2', color: 'text-slate-400', bg: '' },
              { label: 'LayerNorm', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
              { label: '→ K tokens', color: 'text-slate-400', bg: '' },
              { label: 'LLM Input', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            ].map((item, i) => (
              item.bg ? (
                <span key={i} className={`px-2 py-1 rounded border text-center whitespace-pre-wrap ${item.bg} ${item.color}`}>{item.label}</span>
              ) : (
                <span key={i} className={item.color}>{item.label}</span>
              )
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Simulation Results ────────────────────────────────────────────────────────
function SimulationResults({ modelId }: { modelId: ModelId }) {
  const seed = modelId.charCodeAt(0);
  const pr = (o: number) => ((seed * 9301 + o * 49297 + 233280) % 100000) / 100000;

  const lossData = Array.from({ length: 20 }, (_, i) => ({
    epoch: i + 1,
    train: +(3.2 * Math.exp(-i * 0.18) + 0.3 + pr(i) * 0.15).toFixed(4),
    val:   +(3.5 * Math.exp(-i * 0.16) + 0.45 + pr(i + 50) * 0.12).toFixed(4),
  }));

  const metrics = {
    auc:  +(0.79 + pr(1) * 0.04).toFixed(4),
    uauc: +(0.60 + pr(2) * 0.04).toFixed(4),
    ndcg: +(0.83 + pr(3) * 0.03).toFixed(4),
    aucW: +(0.83 + pr(4) * 0.03).toFixed(4),
    aucC: +(0.74 + pr(5) * 0.04).toFixed(4),
  };

  const exportResults = () => {
    const data = { model: modelId, metrics, lossHistory: lossData, completedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `collm-sim-${modelId}-${Date.now()}.json`; a.click();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Metrics row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'AUC Overall', val: metrics.auc, color: 'text-emerald-400' },
          { label: 'UAUC Overall', val: metrics.uauc, color: 'text-emerald-400' },
          { label: 'NDCG@10', val: metrics.ndcg, color: 'text-emerald-400' },
          { label: 'AUC Warm', val: metrics.aucW, color: 'text-blue-400' },
          { label: 'AUC Cold', val: metrics.aucC, color: 'text-purple-400' },
        ].map(m => (
          <div key={m.label} className="bg-slate-900/60 rounded-lg p-3 border border-border/30 text-center">
            <div className={`font-mono font-bold text-lg ${m.color}`}>{m.val}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Loss curve */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="size-4 text-emerald-500" /> Training Loss Curve
            </CardTitle>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={exportResults}>
              <Download className="size-3.5" /> Export Results
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={lossData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Epoch', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="train" stroke="#10b981" strokeWidth={2} dot={false} name="Train Loss" />
              <Line type="monotone" dataKey="val"   stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="4 2" name="Val Loss" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-2 justify-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 bg-emerald-500" /> Train Loss</div>
            <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 bg-blue-500" style={{ borderTop: '2px dashed #3b82f6' }} /> Val Loss</div>
          </div>
        </CardContent>
      </Card>

      {/* Embedding stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Database, label: 'Training Interactions', val: '800,167', sub: '80% of ML-1M' },
          { icon: Clock, label: 'Simulated Train Time', val: '~35 min', sub: '2× A100 80GB' },
          { icon: Activity, label: 'Embedding Pairs', val: '9.7M', sub: `${modelId.toUpperCase()}: 64D vectors` },
        ].map(({ icon: Icon, label, val, sub }) => (
          <div key={label} className="bg-slate-900/50 rounded-lg p-3 border border-border/30 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Icon className="size-4 text-emerald-500" />
            </div>
            <div>
              <div className="text-sm font-semibold">{val}</div>
              <div className="text-[10px] text-muted-foreground">{label}</div>
              <div className="text-[10px] text-slate-500">{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Training Pipeline ─────────────────────────────────────────────────────────
function TrainingPipeline({ modelId }: { modelId: ModelId }) {
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = [
    { label: 'Train Collaborative Model', desc: `Train ${modelId.toUpperCase()} on interaction data (~35 min)`, icon: Database },
    { label: 'Extract Embeddings', desc: 'Obtain 64D user/item embeddings from trained CF model (~5 min)', icon: Sparkles },
    { label: 'Construct Prompts', desc: 'Build hybrid prompts with collaborative + text features (~10 min)', icon: FileText },
    { label: 'Fine-tune LLM (LoRA)', desc: 'Two-step: freeze backbone → joint LoRA fine-tune (~160 min)', icon: Cpu },
    { label: 'Evaluate & Report', desc: 'Compute AUC, UAUC, NDCG@10 on warm/cold split (~12 min)', icon: CheckCircle2 },
  ];

  const startSim = () => {
    setStep(0); setRunning(true); setDone(false);
    let s = 0;
    intervalRef.current = setInterval(() => {
      s++;
      if (s >= steps.length) {
        clearInterval(intervalRef.current!);
        setStep(steps.length - 1);
        setRunning(false);
        setDone(true);
      } else {
        setStep(s);
      }
    }, 1800);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const progress = step < 0 ? 0 : ((step + 1) / steps.length) * 100;

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="size-4 text-emerald-500" />
              <CardTitle className="text-sm">Five-Step Training Pipeline</CardTitle>
            </div>
            <Button size="sm" onClick={startSim} disabled={running}
              className={running ? 'opacity-60' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}>
              {running ? (
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Running…
                </span>
              ) : (
                <span className="flex items-center gap-1.5"><Play className="size-3" /> Simulate</span>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-muted-foreground text-right">{progress.toFixed(0)}% complete</div>
          </div>
          <div className="space-y-2">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step && running;
              const isDone = done ? i <= step : i < step;
              return (
                <motion.div key={i} animate={{ backgroundColor: isActive ? 'rgba(16,185,129,0.06)' : 'transparent' }}
                  className="flex items-center gap-3 rounded-lg border border-border/30 p-3 transition-all">
                  <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-500/20' : isActive ? 'bg-emerald-500/10' : 'bg-muted/40'}`}>
                    {isDone ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Icon className={`size-4 ${isActive ? 'text-emerald-500 animate-pulse' : 'text-muted-foreground'}`} />}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${isDone ? 'text-emerald-400' : ''}`}>{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                  </div>
                  {isActive && <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 text-[10px]">Processing…</Badge>}
                  {isDone && <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 text-[10px]">✓ Done</Badge>}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Results appear after simulation */}
      <AnimatePresence>
        {done && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-emerald-400">
              <Zap className="size-4" /> Simulation Complete — Results
            </div>
            <SimulationResults modelId={modelId} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ArchitectureSection() {
  const { selectedModel, setSelectedModel } = useStore();

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Network className="size-5 text-emerald-500" /> System Architecture
          </h2>
          <p className="text-sm text-muted-foreground mt-1">CoLLM — Integrating Collaborative Embeddings into LLMs for Recommendation</p>
        </div>
        <Select value={selectedModel} onValueChange={v => setSelectedModel(v as ModelId)}>
          <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {models.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Signal flow diagram */}
      <Card className="border-border/50 bg-card/40">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            {[
              { label: 'eu, ei ∈ ℝ⁶⁴', sub: 'User & item collaborative vectors', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { label: '[CIE + TEXT]', sub: 'Hybrid prompt fusing tokens + text', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
              { label: 'P(u,i) ∈ [0,1]', sub: 'Interaction probability score', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            ].map(({ label, sub, color, bg }) => (
              <div key={label} className={`rounded-xl border p-4 ${bg}`}>
                <div className={`font-mono font-bold text-lg ${color}`}>{label}</div>
                <div className="text-xs text-muted-foreground mt-1">{sub}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="cie">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cie" className="text-xs gap-1.5"><BrainCircuit className="size-3.5" />CIE Module Detail</TabsTrigger>
          <TabsTrigger value="pipeline" className="text-xs gap-1.5"><GitBranch className="size-3.5" />Training Pipeline + Simulation</TabsTrigger>
        </TabsList>
        <TabsContent value="cie" className="mt-4">
          <CIEModule modelId={selectedModel} />
        </TabsContent>
        <TabsContent value="pipeline" className="mt-4">
          <TrainingPipeline modelId={selectedModel} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
