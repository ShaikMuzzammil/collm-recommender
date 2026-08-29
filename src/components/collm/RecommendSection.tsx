// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sampleMovies, models } from '@/lib/data';
import type { ModelId } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Star, Zap, BookOpen, Hash, FileJson, Download } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface PredictionResult {
  collabSignal: number;
  semanticSignal: number;
  finalScore: number;
  recommendations: { item: string; score: number; genre: string }[];
}

function generatePrediction(historyIds: string[], targetId: string, modelId: ModelId): PredictionResult {
  const seed = historyIds.reduce((a, b) => a + b.charCodeAt(0), 0) + targetId.charCodeAt(0) + modelId.charCodeAt(0);
  const pseudoRandom = (offset: number) => ((seed * 9301 + offset * 49297 + 233280) % 100000) / 100000;

  const collabSignal = 0.6 + pseudoRandom(1) * 0.35;
  const semanticSignal = 0.5 + pseudoRandom(2) * 0.4;
  const finalScore = Math.min(collabSignal * 0.6 + semanticSignal * 0.4 + pseudoRandom(3) * 0.05, 0.9999);

  const candidates = sampleMovies.filter(m => !historyIds.includes(m.id) && m.id !== targetId);
  const recs = candidates
    .map(m => ({
      item: m.title,
      score: 0.5 + pseudoRandom(m.id.charCodeAt(1)) * 0.45,
      genre: m.genre,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return { collabSignal, semanticSignal, finalScore, recommendations: recs };
}

export default function RecommendSection() {
  const { selectedModel, setSelectedModel } = useStore();
  const { toast } = useToast();
  const [history, setHistory] = useState<string[]>(['i1', 'i3', 'i6']);
  const [target, setTarget] = useState<string>('i10');
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [animProgress, setAnimProgress] = useState(0);

  const availableTargets = sampleMovies.filter(m => !history.includes(m.id));

  const handlePredict = useCallback(() => {
    if (!target) return;
    setPredicting(true);
    setResult(null);
    setAnimProgress(0);

    const res = generatePrediction(history, target, selectedModel);

    let frame = 0;
    const totalFrames = 60;
    const animate = () => {
      frame++;
      setAnimProgress(Math.min(frame / totalFrames, 1));
      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        setResult(res);
        setPredicting(false);
        toast({
          title: 'Prediction Complete',
          description: `Score: ${res.finalScore.toFixed(4)} for ${sampleMovies.find(m => m.id === target)?.title}`,
        });
      }
    };
    requestAnimationFrame(animate);
  }, [history, target, selectedModel, toast]);

  const addHistory = (id: string) => {
    if (history.length >= 5) {
      toast({ title: 'Limit reached', description: 'Maximum 5 history items allowed', variant: 'destructive' });
      return;
    }
    setHistory(prev => [...prev, id]);
  };
  const removeHistory = (id: string) => setHistory(prev => prev.filter(h => h !== id));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Configuration</CardTitle>
            <CardDescription>Select user history and target item</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Model selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Collaborative Model</label>
              <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as ModelId)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {models.map(m => <SelectItem key={m.id} value={m.id}>{m.name} ({m.dim}D)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* History items */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">User History ({history.length}/5)</label>
              <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                {history.map(id => {
                  const movie = sampleMovies.find(m => m.id === id);
                  return (
                    <Badge key={id} variant="outline" className="text-[11px] gap-1 cursor-pointer hover:bg-destructive/10 pr-1"
                      onClick={() => removeHistory(id)}>
                      {movie?.title} <span className="ml-1 opacity-50">×</span>
                    </Badge>
                  );
                })}
              </div>
              <Select onValueChange={(v) => addHistory(v)}>
                <SelectTrigger className="w-full text-xs"><SelectValue placeholder="Add movie to history..." /></SelectTrigger>
                <SelectContent>
                  {sampleMovies.filter(m => !history.includes(m.id)).map(m => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">{m.title} ({m.genre})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target item */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Target Item</label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableTargets.map(m => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">{m.title} ({m.genre})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handlePredict}
              disabled={predicting || !target}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {predicting ? (
                <span className="flex items-center gap-2"><span className="size-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Computing...</span>
              ) : (
                <span className="flex items-center gap-2"><Sparkles className="size-4" /> Predict</span>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Score Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-emerald-500" />
                <CardTitle className="text-base">Score Breakdown</CardTitle>
                {predicting && <span className="ml-auto text-xs text-emerald-500 pulse-emerald">Computing...</span>}
              </div>
              <CardDescription>Signal decomposition from CIE module and LLM</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <SignalBar label="Collaborative Signal" value={result?.collabSignal ?? (predicting ? animProgress * 0.78 : 0)} color="#10b981" icon={Hash} predicting={predicting} />
              <SignalBar label="Semantic Signal" value={result?.semanticSignal ?? (predicting ? animProgress * 0.65 : 0)} color="#34d399" icon={BookOpen} predicting={predicting} />
              <div className="border-t pt-4">
                <SignalBar label="Final Prediction Score" value={result?.finalScore ?? (predicting ? animProgress * 0.89 : 0)} color="#6ee7b7" icon={Star} predicting={predicting} large />
              </div>
            </CardContent>
          </Card>

          {/* Top-K Recommendations */}
          <AnimatePresence>
            {(result || predicting) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="size-4 text-emerald-500" />
                        <CardTitle className="text-base">Top-5 Recommendations</CardTitle>
                      </div>
                      {result && (
                        <div className="flex gap-1.5">
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                            const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                            const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                            a.download = `inference-result-${Date.now()}.json`; a.click();
                            sonnerToast.success('Exported JSON');
                          }}>
                            <FileJson className="size-3 mr-1" />JSON
                          </Button>
                        </div>
                      )}
                    </div>
                    <CardDescription>Personalized recommendations generated for this user</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(result?.recommendations || Array(5).fill(null)).map((rec, i) => (
                        <motion.div
                          key={rec?.item || i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: predicting ? 0 : i * 0.1 }}
                          className="flex items-center gap-3 rounded-lg border p-3"
                        >
                          <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{rec ? rec.item : '---'}</div>
                            <div className="text-xs text-muted-foreground">{rec ? rec.genre : 'Computing...'}</div>
                          </div>
                          {rec && (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rec.score * 100}%` }} />
                              </div>
                              <span className="font-mono text-xs text-emerald-400 w-14 text-right">{rec.score.toFixed(4)}</span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SignalBar({ label, value, color, icon: Icon, predicting, large = false }: {
  label: string; value: number; color: string;
  icon: React.ComponentType<{ className?: string }>;
  predicting: boolean; large?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className={`flex items-center gap-1.5 ${large ? 'text-sm font-semibold' : 'text-xs text-muted-foreground'}`}>
          <span style={{ color }}><Icon className={large ? 'size-4' : 'size-3'} /></span>
          {label}
        </span>
        <span className={`font-mono ${large ? 'text-lg font-bold' : 'text-xs'}`} style={{ color }}>
          {value > 0 ? value.toFixed(4) : '---'}
        </span>
      </div>
      <div className={`rounded-full bg-muted/50 overflow-hidden ${large ? 'h-3' : 'h-2'}`}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${Math.min(value * 100, 100)}%` }}
          transition={{ duration: predicting ? 0.1 : 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
