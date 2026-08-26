'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { models } from '@/lib/data';
import type { ModelId } from '@/lib/store';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import {
  Network, ArrowRight, Layers, BrainCircuit, Cpu, Sparkles,
  Database, FileText, Wand2, GitBranch, Play, CheckCircle2
} from 'lucide-react';

function FlowStep({ icon: Icon, title, desc, delay, color = '#10b981' }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string; desc: string; delay: number; color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex items-start gap-4"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
        <Icon className="size-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

function ArrowConnector() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-center py-1 pl-6"
    >
      <ArrowRight className="size-5 text-emerald-500/60" />
    </motion.div>
  );
}

function CIEModule({ modelId }: { modelId: ModelId }) {
  const model = models.find(m => m.id === modelId) || models[1];
  return (
    <Card className="gradient-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="size-4 text-emerald-500" />
          <CardTitle className="text-base">CIE Module — {model.shortName}</CardTitle>
        </div>
        <CardDescription>Collaborative Information Embedding: bridges collaborative signals and LLM understanding</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Architecture</div>
            <div className="text-sm font-semibold">{model.type}</div>
          </div>
          <div className="rounded-lg border p-3 bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Embedding Dim</div>
            <div className="text-sm font-semibold">{model.dim}D</div>
          </div>
          <div className="rounded-lg border p-3 bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Status</div>
            <div className="text-sm font-semibold text-emerald-500">Pre-trained ✓</div>
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-2">Key Features</div>
          <div className="flex flex-wrap gap-1.5">
            {model.features.map(f => (
              <Badge key={f} variant="outline" className="text-[10px] font-normal border-emerald-500/30 text-emerald-400">{f}</Badge>
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed rounded-lg bg-muted/20 p-3 border">
          {model.description}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="size-3" />
          <span>Output: Collaborative embedding vector e<sub>u</sub>, e<sub>i</sub> ∈ ℝ<sup>{model.dim}</sup></span>
        </div>
      </CardContent>
    </Card>
  );
}

function TrainingPipeline() {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);

  const steps = [
    { label: 'Step 1: Train Collaborative Model', desc: 'Train MF/LightGCN/SASRec/DIN on interaction data', duration: 35, icon: Database },
    { label: 'Step 2: Extract Embeddings', desc: 'Obtain user/item collaborative embeddings from trained model', duration: 5, icon: Sparkles },
    { label: 'Step 3: Construct Prompts', desc: 'Build hybrid prompts with collaborative + text features', duration: 10, icon: FileText },
    { label: 'Step 4: Fine-tune LLM (LoRA)', desc: 'Two-step training: freeze → full fine-tune with LoRA adapters', duration: 160, icon: Cpu },
    { label: 'Step 5: Evaluate', desc: 'Compute AUC, UAUC, NDCG on test set', duration: 12, icon: CheckCircle2 },
  ];

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setStep(s => {
        if (s >= steps.length - 1) {
          setRunning(false);
          return s;
        }
        return s + 1;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [running, steps.length]);

  const totalProgress = steps.reduce((acc, s, i) => acc + (i <= step ? 100 : 0), 0) / steps.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="size-4 text-emerald-500" />
            <CardTitle className="text-base">Two-Step Training Pipeline</CardTitle>
          </div>
          <Button
            size="sm"
            variant={running ? 'outline' : 'default'}
            onClick={() => { if (!running) { setStep(0); setRunning(true); } }}
            className={running ? '' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
            disabled={running && step >= steps.length - 1}
          >
            {running ? (
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400 pulse-emerald" />
                Running
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Play className="size-3 mr-1" />
                Simulate
              </span>
            )}
          </Button>
        </div>
        <CardDescription>Animated simulation of the CoLLM training process</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={totalProgress} className="h-2" />
        <div className="text-xs text-muted-foreground text-right">Overall: {totalProgress.toFixed(0)}%</div>
        <div className="space-y-2">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step && running;
            const isDone = i < step || (i === step && !running && step === steps.length - 1);
            return (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  backgroundColor: isActive ? 'oklch(0.65 0.19 160 / 0.08)' : 'transparent',
                  borderColor: isDone ? 'oklch(0.65 0.19 160 / 0.4)' : isActive ? 'oklch(0.65 0.19 160 / 0.3)' : undefined,
                }}
                className="flex items-center gap-3 rounded-lg border p-3 transition-all"
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isDone ? 'bg-emerald-500/20' : isActive ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                  {isDone ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Icon className={`size-4 ${isActive ? 'text-emerald-500' : 'text-muted-foreground'}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${isDone ? 'text-emerald-400' : ''}`}>{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.desc} (~{s.duration} min)</div>
                </div>
                {isActive && <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-500">Processing...</Badge>}
                {isDone && <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-500">Done</Badge>}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ArchitectureSection() {
  const { selectedModel, setSelectedModel } = useStore();

  return (
    <div className="space-y-6">
      {/* System Architecture Flow */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Network className="size-4 text-emerald-500" />
            <CardTitle className="text-base">System Architecture</CardTitle>
          </div>
          <CardDescription>End-to-end pipeline from raw data to LLM prediction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <FlowStep icon={Database} title="Interaction Data" desc="User-item interaction records (clicks, ratings, purchases) from MovieLens or Amazon datasets" delay={0} />
          <ArrowConnector />
          <FlowStep icon={BrainCircuit} title="CIE Module (Collaborative Model)" desc="Train MF/LightGCN/SASRec/DIN to produce collaborative embeddings capturing user preferences and item characteristics" delay={0.15} color="#34d399" />
          <ArrowConnector />
          <FlowStep icon={FileText} title="Prompt Construction" desc="Combine collaborative embedding tokens with text-based item/user descriptions into a structured prompt template for the LLM" delay={0.3} color="#6ee7b7" />
          <ArrowConnector />
          <FlowStep icon={Wand2} title="Hybrid Encoding" desc="LLM processes both collaborative and semantic information through its attention mechanism, fusing them into unified representations" delay={0.45} color="#a7f3d0" />
          <ArrowConnector />
          <FlowStep icon={Cpu} title="LLM Prediction" desc="LLaMA-2-7B with LoRA adapters outputs probability score for user-item interaction via linear classification head" delay={0.6} color="#10b981" />
        </CardContent>
      </Card>

      {/* CIE Module + Training Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">CIE Module Detail</h3>
            <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as ModelId)}>
              <SelectTrigger size="sm" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.shortName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CIEModule modelId={selectedModel} />
        </div>
        <TrainingPipeline />
      </div>
    </div>
  );
}
