// @ts-nocheck
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { models, experimentResults, chartConfig } from '@/lib/data';
import { useStore, type DatasetId } from '@/lib/store';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { Layers, Cpu, BarChart3, Radio } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'Traditional CF': Layers,
  'GNN-based CF': Cpu,
  'Sequential CF': BarChart3,
  'Attention-based CF': Radio,
};

export default function ModelsSection() {
  const { selectedDataset, setSelectedDataset } = useStore();
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);

  const results = experimentResults[selectedDataset as DatasetId];
  const collmResults = results.filter(r => r.method.includes('CoLLM'));
  const baseResults = results.filter(r => !r.method.includes('CoLLM'));

  const comparisonData = [
    { name: 'MF', ...baseResults.find(r => r.method === 'MF')! },
    { name: 'LightGCN', ...baseResults.find(r => r.method === 'LightGCN')! },
    { name: 'CoLLM+MF', ...collmResults.find(r => r.method === 'CoLLM (MF)')! },
    { name: 'CoLLM+GCN', ...collmResults.find(r => r.method === 'CoLLM (LightGCN)')! },
    { name: 'CoLLM+SAS', ...collmResults.find(r => r.method === 'CoLLM (SASRec)')! },
    { name: 'CoLLM+DIN', ...collmResults.find(r => r.method === 'CoLLM (DIN)')! },
  ];

  return (
    <div className="space-y-6">
      {/* Model Cards */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Collaborative Models</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {models.map((model, i) => {
            const Icon = iconMap[model.type] || Layers;
            const collmResult = collmResults.find(r => r.method === `CoLLM (${model.shortName})`);
            const baseResult = baseResults.find(r => r.method === model.shortName);
            const isHovered = hoveredModel === model.id;
            return (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onMouseEnter={() => setHoveredModel(model.id)}
                onMouseLeave={() => setHoveredModel(null)}
              >
                <Card className={`h-full transition-all duration-300 ${isHovered ? 'glow-emerald-sm scale-[1.02]' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${model.color}15` }}>
                        <span className="size-5 block" style={{ color: model.color }}>●</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-normal">{model.type}</Badge>
                    </div>
                    <CardTitle className="text-base mt-2">{model.name}</CardTitle>
                    <CardDescription className="text-xs">{model.dim}D embeddings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{model.description}</p>
                    {collmResult && baseResult && (
                      <div className="space-y-1.5 pt-2 border-t">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">AUC Gain</span>
                          <span className="text-emerald-500 font-mono">+{((collmResult.auc - baseResult.auc) * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">CoLLM AUC</span>
                          <span className="font-mono">{collmResult.auc.toFixed(4)}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-emerald-500" />
              <CardTitle className="text-base">Performance Comparison</CardTitle>
            </div>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant={selectedDataset === 'ml-1m' ? 'default' : 'outline'}
                onClick={() => setSelectedDataset('ml-1m')}
                className={selectedDataset === 'ml-1m' ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-xs' : 'text-xs'}
              >
                ML-1M
              </Button>
              <Button
                size="sm"
                variant={selectedDataset === 'amazon-book' ? 'default' : 'outline'}
                onClick={() => setSelectedDataset('amazon-book')}
                className={selectedDataset === 'amazon-book' ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-xs' : 'text-xs'}
              >
                Amazon-Book
              </Button>
            </div>
          </div>
          <CardDescription>
            All methods evaluated on {selectedDataset === 'ml-1m' ? 'MovieLens-1M' : 'Amazon-Book'} dataset
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto custom-scrollbar rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">AUC</TableHead>
                  <TableHead className="text-right">UAUC</TableHead>
                  <TableHead className="text-right">NDCG</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.method} className={r.best ? 'bg-emerald-500/5' : ''}>
                    <TableCell className={`font-mono text-xs ${r.best ? 'text-emerald-400 font-semibold' : ''}`}>
                      {r.method}
                      {r.best && <Badge className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">BEST</Badge>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{r.auc.toFixed(4)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{r.uauc.toFixed(4)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{r.ndcg.toFixed(4)}</TableCell>
                    <TableCell className="text-center">
                      {r.method.includes('CoLLM') ? (
                        <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">CoLLM</Badge>
                      ) : r.method.includes('Llama') || r.method.includes('Vicuna') || r.method.includes('Adapter') || r.method.includes('P-tuning') ? (
                        <Badge variant="outline" className="text-[9px]">LLM</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[9px]">CF</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Visual Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CoLLM Improvement Over Base Models</CardTitle>
          <CardDescription>AUC comparison showing collaborative model vs. CoLLM-enhanced version</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: -10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={10} tickLine={false} />
              <YAxis domain={[0.75, 0.88]} fontSize={10} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="auc" fill="var(--color-auc)" radius={[3, 3, 0, 0]} name="AUC" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
