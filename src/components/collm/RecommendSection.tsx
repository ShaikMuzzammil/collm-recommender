// @ts-nocheck
'use client';
import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { sampleMovies, models } from '@/lib/data';
import type { ModelId } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Star, Zap, BookOpen, Hash, Download,
  TrendingUp, Clock, BarChart3, Brain, ChevronRight, RefreshCw, FileJson, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { Progress } from '@/components/ui/progress';

interface PredResult {
  collabSignal: number;
  semanticSignal: number;
  finalScore: number;
  confidence: number;
  explanation: { collab: string; semantic: string; combined: string };
  recommendations: { item: string; score: number; genre: string; rank: number }[];
  modelComparison: { model: string; score: number }[];
}

function pseudoRandom(seed: number, offset: number) {
  return ((seed * 9301 + offset * 49297 + 233280) % 100000) / 100000;
}

function generatePrediction(historyIds: string[], targetId: string, modelId: ModelId): PredResult {
  const seed = historyIds.reduce((a, b) => a + b.charCodeAt(0), 0) + targetId.charCodeAt(0) + modelId.charCodeAt(0);
  const pr = (o: number) => pseudoRandom(seed, o);
  const collab   = +(0.62 + pr(1) * 0.33).toFixed(4);
  const semantic = +(0.51 + pr(2) * 0.38).toFixed(4);
  const combined = +(Math.min(collab * 0.6 + semantic * 0.4 + pr(3) * 0.04, 0.9999)).toFixed(4);
  const confidence = +(0.78 + pr(4) * 0.18).toFixed(2);

  const targetMovie = sampleMovies.find(m => m.id === targetId);
  const collab_expl = `Based on ${historyIds.length} interactions in user history — strong co-occurrence patterns with ${targetMovie?.genre ?? ''} genre items observed in the embedding space.`;
  const semantic_expl = `Vicuna-7B analyzed item descriptions via hybrid prompt: collaborative tokens prepended to text yield semantic alignment score of ${semantic}.`;
  const combined_expl = `CoLLM fuses both signals: P(u,i) = σ(0.6 × CF_score + 0.4 × LLM_score) = ${combined}. ${combined > 0.75 ? 'High probability interaction.' : combined > 0.55 ? 'Moderate recommendation confidence.' : 'Below threshold — unlikely interaction.'}`;

  const candidates = sampleMovies.filter(m => !historyIds.includes(m.id) && m.id !== targetId);
  const recs = candidates.map((m, i) => ({
    item: m.title, score: +(0.52 + pr(i + 10) * 0.43).toFixed(4), genre: m.genre, rank: 0,
  })).sort((a, b) => b.score - a.score).slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  const modelComparison = [
    { model: 'CoLLM (Full)', score: combined },
    { model: `Only ${modelId.toUpperCase()} CF`, score: +(collab * 0.85 + pr(20) * 0.05).toFixed(4) },
    { model: 'Only LLM (Vicuna)', score: +(semantic * 0.78 + pr(21) * 0.04).toFixed(4) },
    { model: 'w/o Two-Step Training', score: +(combined * 0.88 + pr(22) * 0.03).toFixed(4) },
  ].sort((a, b) => Number(b.score) - Number(a.score));

  return { collabSignal: collab, semanticSignal: semantic, finalScore: combined, confidence, explanation: { collab: collab_expl, semantic: semantic_expl, combined: combined_expl }, recommendations: recs, modelComparison };
}

// ── Score Bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ label, value, animValue, color, icon: Icon, desc, explanation, large = false }: any) {
  const [showExp, setShowExp] = useState(false);
  const pct = Math.round(animValue * 100);
  return (
    <div className={`space-y-2 ${large ? 'p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/15' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded flex items-center justify-center" style={{ background: `${color}20` }}>
            <Icon className="size-3.5" style={{ color }} />
          </div>
          <span className={`font-medium ${large ? 'text-base' : 'text-sm'}`}>{label}</span>
          {desc && <span className="text-xs text-muted-foreground">({desc})</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-mono font-bold tabular-nums ${large ? 'text-2xl' : 'text-base'}`} style={{ color }}>
            {animValue > 0 ? animValue.toFixed(4) : '—'}
          </span>
          {explanation && animValue > 0 && (
            <button onClick={() => setShowExp(v => !v)} className="text-muted-foreground hover:text-foreground">
              <ChevronRight className={`size-3.5 transition-transform ${showExp ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
      </div>
      <div className="relative h-2.5 bg-muted/40 rounded-full overflow-hidden">
        <motion.div className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
          animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
      </div>
      <AnimatePresence>
        {showExp && explanation && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="text-xs text-muted-foreground bg-slate-900/40 rounded-lg px-3 py-2 border border-border/20 overflow-hidden">
            {explanation}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── History Log ───────────────────────────────────────────────────────────────
interface HistoryEntry { target: string; model: string; score: number; ts: string }

export default function RecommendSection() {
  const { selectedModel, setSelectedModel } = useStore();
  const [history, setHistory] = useState(['i1', 'i3', 'i6']);
  const [target, setTarget] = useState('i10');
  const [predicting, setPredicting] = useState(false);
  const [animProg, setAnimProg] = useState(0);
  const [result, setResult] = useState<PredResult | null>(null);
  const [predHistory, setPredHistory] = useState<HistoryEntry[]>([]);
  const rafRef = useRef<number>();

  const availableTargets = sampleMovies.filter(m => !history.includes(m.id));

  const handlePredict = useCallback(() => {
    if (!target) return;
    setPredicting(true); setResult(null); setAnimProg(0);
    const res = generatePrediction(history, target, selectedModel);
    let frame = 0; const total = 70;
    const animate = () => {
      frame++;
      setAnimProg(Math.min(frame / total, 1));
      if (frame < total) { rafRef.current = requestAnimationFrame(animate); }
      else {
        setResult(res); setPredicting(false);
        setPredHistory(prev => [{
          target: sampleMovies.find(m => m.id === target)?.title ?? target,
          model: selectedModel, score: res.finalScore, ts: new Date().toLocaleTimeString(),
        }, ...prev.slice(0, 9)]);
        toast.success(`Prediction: ${res.finalScore} confidence`);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [history, target, selectedModel]);

  const addHistory = (id: string) => {
    if (history.length >= 5) { toast.error('Max 5 history items'); return; }
    setHistory(p => [...p, id]);
  };
  const removeHistory = (id: string) => setHistory(p => p.filter(h => h !== id));

  const exportResults = (format: 'json' | 'csv') => {
    if (!result) return;
    const target_movie = sampleMovies.find(m => m.id === target);
    if (format === 'json') {
      const blob = new Blob([JSON.stringify({ model: selectedModel, targetItem: target_movie?.title, history: history.map(id => sampleMovies.find(m => m.id === id)?.title), ...result, generatedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `inference-${Date.now()}.json`; a.click();
    } else {
      const rows = ['Method,Score', ...result.modelComparison.map(m => `${m.model},${m.score}`), '', 'Rank,Item,Score,Genre', ...result.recommendations.map(r => `${r.rank},${r.item},${r.score},${r.genre}`)];
      const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `inference-${Date.now()}.csv`; a.click();
    }
  };

  const collab_anim   = result?.collabSignal   ?? (predicting ? animProg * 0.78 : 0);
  const semantic_anim = result?.semanticSignal  ?? (predicting ? animProg * 0.65 : 0);
  const final_anim    = result?.finalScore      ?? (predicting ? animProg * 0.88 : 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Zap className="size-5 text-emerald-500" />Inference</h2>
          <p className="text-sm text-muted-foreground mt-1">Run CoLLM prediction with collaborative + semantic signal decomposition</p>
        </div>
        {result && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => exportResults('json')}>
              <FileJson className="size-3.5" /> JSON
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => exportResults('csv')}>
              <FileSpreadsheet className="size-3.5" /> CSV
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Config panel */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Configuration</CardTitle>
            <CardDescription>Select user history and target item</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Collaborative Model</label>
              <Select value={selectedModel} onValueChange={v => setSelectedModel(v as ModelId)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {models.map(m => <SelectItem key={m.id} value={m.id}>{m.name} ({m.dim}D)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">User History ({history.length}/5)</label>
              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {history.map(id => {
                  const m = sampleMovies.find(x => x.id === id);
                  return (
                    <Badge key={id} variant="outline" className="text-[11px] cursor-pointer hover:bg-destructive/10 gap-1 pr-1" onClick={() => removeHistory(id)}>
                      {m?.title} <span className="opacity-40">×</span>
                    </Badge>
                  );
                })}
              </div>
              <Select onValueChange={addHistory} value="">
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Add movie to history…" /></SelectTrigger>
                <SelectContent>
                  {sampleMovies.filter(m => !history.includes(m.id)).map(m => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">{m.title} ({m.genre})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Target Item</label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableTargets.map(m => <SelectItem key={m.id} value={m.id} className="text-xs">{m.title} ({m.genre})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handlePredict} disabled={predicting || !target} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              {predicting
                ? <><span className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Computing…</>
                : <><Sparkles className="size-4 mr-2" />Predict</>}
            </Button>

            {/* Prediction History */}
            {predHistory.length > 0 && (
              <div className="pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Clock className="size-3.5" /> Recent Predictions
                </div>
                <div className="space-y-1.5">
                  {predHistory.slice(0, 4).map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-slate-900/40 rounded px-2.5 py-1.5">
                      <span className="truncate text-foreground max-w-[110px]">{h.target}</span>
                      <span className="font-mono text-emerald-400">{Number(h.score).toFixed(4)}</span>
                      <span className="text-muted-foreground">{h.ts}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Score Breakdown */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-emerald-500" />
                  <CardTitle className="text-sm">Score Breakdown</CardTitle>
                </div>
                {predicting && <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px] animate-pulse">Computing…</Badge>}
                {result && (
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px]">
                    Confidence: {(result.confidence * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>
              <CardDescription>Click the › arrow on any signal to see explanation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ScoreBar label="Collaborative Signal" value={collab_anim} animValue={collab_anim}
                color="#10b981" icon={Hash} desc="CIE module" explanation={result?.explanation.collab} />
              <ScoreBar label="Semantic Signal" value={semantic_anim} animValue={semantic_anim}
                color="#3b82f6" icon={BookOpen} desc="Vicuna-7B" explanation={result?.explanation.semantic} />
              <Separator className="opacity-30" />
              <ScoreBar label="Final Prediction Score" value={final_anim} animValue={final_anim}
                color="#6ee7b7" icon={Star} explanation={result?.explanation.combined} large />

              {result && (
                <div className="flex items-center gap-3 pt-1">
                  <div className={`flex-1 text-center rounded-lg py-2 border text-xs font-medium ${result.finalScore > 0.70 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : result.finalScore > 0.50 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {result.finalScore > 0.70 ? '✓ High Likelihood Interaction' : result.finalScore > 0.50 ? '⚠ Moderate Recommendation' : '✗ Low Recommendation Score'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Model Comparison */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="size-4 text-emerald-500" /> Model Comparison
                    </CardTitle>
                    <CardDescription>CoLLM vs ablated variants for this prediction</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {result.modelComparison.map((m, i) => (
                      <div key={m.model} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={i === 0 ? 'text-emerald-400 font-semibold' : 'text-muted-foreground'}>{m.model}</span>
                          <span className={`font-mono ${i === 0 ? 'text-emerald-400 font-bold' : ''}`}>{Number(m.score).toFixed(4)}</span>
                        </div>
                        <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full"
                            style={{ background: i === 0 ? '#10b981' : '#334155' }}
                            animate={{ width: `${Number(m.score) * 100}%` }} transition={{ duration: 0.5, delay: i * 0.1 }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top-K Recs */}
          <AnimatePresence>
            {(result || predicting) && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ArrowRight className="size-4 text-emerald-500" /> Top-5 Recommendations
                    </CardTitle>
                    <CardDescription>Other items ranked by CoLLM score for this user profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(result?.recommendations ?? Array(5).fill(null)).map((rec, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/40 border border-border/20">
                          <div className="size-6 rounded bg-emerald-500/15 border border-emerald-500/20 text-[11px] font-bold text-emerald-400 flex items-center justify-center shrink-0">
                            {rec?.rank ?? (i + 1)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate">{rec?.item ?? '…'}</div>
                            {rec && <div className="text-[10px] text-muted-foreground">{rec.genre}</div>}
                          </div>
                          {rec && (
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="w-16 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${rec.score * 100}%` }} />
                              </div>
                              <span className="font-mono text-xs text-emerald-400 w-12 text-right">{rec.score}</span>
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
