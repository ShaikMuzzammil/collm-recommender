'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { experimentResults, warmColdAnalysis, ablationResults, tuningResults, efficiencyMetrics, chartConfig } from '@/lib/data';
import { useStore, type DatasetId } from '@/lib/store';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { motion } from 'framer-motion';
import { FlaskConical, Thermometer, Puzzle, Clock, Snowflake, Sun, ArrowUpRight, TrendingUp, FileJson } from 'lucide-react';
import { toast } from 'sonner';

function BestValue({ value, isBest }: { value: string | number; isBest: boolean }) {
  return (
    <span className={`font-mono ${isBest ? 'text-emerald-400 font-semibold' : ''}`}>
      {typeof value === 'number' ? value.toFixed(4) : value}
    </span>
  );
}

export default function ExperimentsSection() {
  const { selectedDataset, setSelectedDataset } = useStore();
  const results = experimentResults[selectedDataset as DatasetId];
  const warmCold = warmColdAnalysis[selectedDataset as DatasetId];

  const radarData = [
    { metric: 'AUC', warm: warmCold.warm.auc, cold: warmCold.cold.auc },
    { metric: 'UAUC', warm: warmCold.warm.uauc, cold: warmCold.cold.uauc },
    { metric: 'NDCG', warm: warmCold.warm.ndcg, cold: warmCold.cold.ndcg },
  ];

  const efficiencyChartData = efficiencyMetrics.map(e => ({
    name: e.method.length > 14 ? e.method.slice(0, 14) + '..' : e.method,
    trainTime: parseFloat(e.trainTime),
    inferTime: parseFloat(e.inferTime),
  }));

  const exportExperiments = () => {
    const blob = new Blob([JSON.stringify({ dataset: selectedDataset, results, warmCold, ablation: ablationResults }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `experiments-${selectedDataset}-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    toast.success('Experiment data exported');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FlaskConical className="size-5 text-emerald-500" />Experiments & Ablation
          </h2>
          <p className="text-muted-foreground text-sm">Model comparisons, warm/cold analysis, hyperparameter sensitivity, efficiency metrics</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportExperiments}>
          <FileJson className="size-3.5 mr-1.5" />Export Results
        </Button>
      </div>
      <Tabs defaultValue="results" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="results" className="gap-1.5"><FlaskConical className="size-3.5" /> Results</TabsTrigger>
          <TabsTrigger value="warm-cold" className="gap-1.5"><Thermometer className="size-3.5" /> Warm vs Cold</TabsTrigger>
          <TabsTrigger value="ablation" className="gap-1.5"><Puzzle className="size-3.5" /> Ablation</TabsTrigger>
          <TabsTrigger value="tuning" className="gap-1.5"><TrendingUp className="size-3.5" /> Tuning</TabsTrigger>
          <TabsTrigger value="efficiency" className="gap-1.5"><Clock className="size-3.5" /> Efficiency</TabsTrigger>
        </TabsList>

        {/* Complete Results Table */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Table 2: Complete Results</CardTitle>
                  <CardDescription>Full evaluation across all methods</CardDescription>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant={selectedDataset === 'ml-1m' ? 'default' : 'outline'}
                    onClick={() => setSelectedDataset('ml-1m')}
                    className={selectedDataset === 'ml-1m' ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-xs' : 'text-xs'}>ML-1M</Button>
                  <Button size="sm" variant={selectedDataset === 'amazon-book' ? 'default' : 'outline'}
                    onClick={() => setSelectedDataset('amazon-book')}
                    className={selectedDataset === 'amazon-book' ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-xs' : 'text-xs'}>Amazon-Book</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[460px] overflow-y-auto custom-scrollbar rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent sticky top-0 bg-card z-10">
                      <TableHead className="min-w-[140px]">Method</TableHead>
                      <TableHead className="text-right">AUC</TableHead>
                      <TableHead className="text-right">UAUC</TableHead>
                      <TableHead className="text-right">NDCG</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r, i) => {
                      const isBest = r.best;
                      return (
                        <TableRow key={r.method} className={isBest ? 'bg-emerald-500/5' : ''}>
                          <TableCell className={`font-mono text-xs ${isBest ? 'text-emerald-400 font-semibold' : ''}`}>
                            {r.method}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">{r.auc.toFixed(4)}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{r.uauc.toFixed(4)}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{r.ndcg.toFixed(4)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Warm vs Cold */}
        <TabsContent value="warm-cold">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Warm vs Cold Start Analysis</CardTitle>
                <CardDescription>CoLLM (LightGCN) performance on warm and cold users</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ warm: { label: 'Warm', color: '#10b981' }, cold: { label: 'Cold', color: '#6ee7b7' } }} className="h-[300px] w-full">
                  <BarChart data={radarData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0.4, 1.0]} fontSize={10} />
                    <YAxis type="category" dataKey="metric" fontSize={11} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="warm" fill="var(--color-warm)" radius={[0, 3, 3, 0]} name="Warm" />
                    <Bar dataKey="cold" fill="var(--color-cold)" radius={[0, 3, 3, 0]} name="Cold" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Improvement Breakdown</CardTitle>
                <CardDescription>Performance gap between warm and cold users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {(['auc', 'uauc', 'ndcg'] as const).map((metric) => (
                  <div key={metric} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium uppercase tracking-wider">{metric}</span>
                      <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                        <ArrowUpRight className="size-3 mr-1" />{warmCold.improvement[metric]}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <Sun className="size-4 text-emerald-500" />
                        <div>
                          <div className="text-[10px] text-muted-foreground">Warm</div>
                          <div className="text-sm font-mono font-semibold">{warmCold.warm[metric].toFixed(4)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <Snowflake className="size-4 text-sky-400" />
                        <div>
                          <div className="text-[10px] text-muted-foreground">Cold</div>
                          <div className="text-sm font-mono font-semibold">{warmCold.cold[metric].toFixed(4)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ablation Study */}
        <TabsContent value="ablation">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ablation Study</CardTitle>
              <CardDescription>Impact of each component on CoLLM (LightGCN) performance (ML-1M)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto custom-scrollbar rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent sticky top-0 bg-card z-10">
                      <TableHead className="min-w-[240px]">Variant</TableHead>
                      <TableHead className="text-right">AUC</TableHead>
                      <TableHead className="text-right">UAUC</TableHead>
                      <TableHead className="text-right">NDCG</TableHead>
                      <TableHead className="text-right">Δ AUC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ablationResults.map((r, i) => {
                      const fullAuc = ablationResults[0].auc;
                      const delta = r.auc - fullAuc;
                      return (
                        <TableRow key={r.variant} className={i === 0 ? 'bg-emerald-500/5' : ''}>
                          <TableCell className={`text-xs ${i === 0 ? 'font-semibold text-emerald-400' : ''}`}>{r.variant}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{r.auc.toFixed(4)}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{r.uauc.toFixed(4)}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{r.ndcg.toFixed(4)}</TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            <span className={delta < 0 ? 'text-red-400' : delta > 0 ? 'text-emerald-400' : ''}>
                              {delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(4)}`}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tuning Strategy */}
        <TabsContent value="tuning">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tuning Strategy Comparison</CardTitle>
              <CardDescription>Effect of different LoRA tuning strategies on CoLLM performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={tuningResults.map(t => ({ name: t.strategy, AUC: t.auc, NDCG: t.ndcg }))} margin={{ top: 5, right: 10, left: -10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} />
                  <YAxis domain={[0.78, 0.84]} fontSize={10} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="AUC" fill="var(--color-auc)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="NDCG" fill="var(--color-ndcg)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartContainer>
              <div className="mt-4 max-h-48 overflow-y-auto custom-scrollbar rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent sticky top-0 bg-card z-10">
                      <TableHead>Strategy</TableHead>
                      <TableHead className="text-right">AUC</TableHead>
                      <TableHead className="text-right">UAUC</TableHead>
                      <TableHead className="text-right">NDCG</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tuningResults.map((t, i) => (
                      <TableRow key={t.strategy} className={i === tuningResults.length - 1 ? 'bg-emerald-500/5' : ''}>
                        <TableCell className={`text-xs font-medium ${i === tuningResults.length - 1 ? 'text-emerald-400' : ''}`}>{t.strategy}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{t.auc.toFixed(4)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{t.uauc.toFixed(4)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{t.ndcg.toFixed(4)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.desc}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Efficiency Metrics */}
        <TabsContent value="efficiency">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Training & Inference Time</CardTitle>
                <CardDescription>Comparison of computational efficiency across methods</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ trainTime: { label: 'Train (min)', color: '#10b981' }, inferTime: { label: 'Inference (ms)', color: '#6ee7b7' } }} className="h-[300px] w-full">
                  <BarChart data={efficiencyChartData} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" angle={-25} textAnchor="end" fontSize={9} tickLine={false} />
                    <YAxis fontSize={10} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="trainTime" fill="var(--color-trainTime)" radius={[3, 3, 0, 0]} name="Train (min)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resource Usage</CardTitle>
                <CardDescription>Parameters and memory requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[340px] overflow-y-auto custom-scrollbar rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent sticky top-0 bg-card z-10">
                        <TableHead>Method</TableHead>
                        <TableHead className="text-right">Train</TableHead>
                        <TableHead className="text-right">Infer</TableHead>
                        <TableHead className="text-right">Params</TableHead>
                        <TableHead className="text-right">Memory</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {efficiencyMetrics.map(e => (
                        <TableRow key={e.method}>
                          <TableCell className="text-xs font-medium">{e.method}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{e.trainTime}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{e.inferTime}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{e.params}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{e.memory}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
