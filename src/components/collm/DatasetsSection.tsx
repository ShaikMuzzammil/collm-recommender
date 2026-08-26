'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { datasets } from '@/lib/data';
import { motion } from 'framer-motion';
import { Database, Users, Package, MousePointerClick, Star, Filter, ArrowRight } from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" style={{ color }} />
        <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-lg font-bold font-mono">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function PipelineViz({ steps }: { steps: string[] }) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="flex items-center gap-2.5"
        >
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-500">
            {i + 1}
          </div>
          <span className="text-xs">{step}</span>
        </motion.div>
      ))}
    </div>
  );
}

export default function DatasetsSection() {
  const ml1m = datasets['ml-1m'];
  const amazon = datasets['amazon-book'];

  const comparisonData = [
    { metric: 'Users', ml1m: ml1m.users.toLocaleString(), amazon: amazon.users.toLocaleString() },
    { metric: 'Items', ml1m: ml1m.items.toLocaleString(), amazon: amazon.items.toLocaleString() },
    { metric: 'Interactions', ml1m: ml1m.interactions.toLocaleString(), amazon: amazon.interactions.toLocaleString() },
    { metric: 'Density', ml1m: ml1m.density, amazon: amazon.density },
    { metric: 'Sparsity', ml1m: ml1m.sparsity, amazon: amazon.sparsity },
    { metric: 'Avg Rating', ml1m: ml1m.avgRating, amazon: amazon.avgRating },
    { metric: 'Split', ml1m: ml1m.split, amazon: amazon.split },
  ];

  return (
    <div className="space-y-6">
      {/* Dataset Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(['ml-1m', 'amazon-book'] as const).map((id, idx) => {
          const ds = datasets[id];
          return (
            <motion.div key={id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.15 }}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="size-4 text-emerald-500" />
                    <CardTitle className="text-base">{ds.name}</CardTitle>
                  </div>
                  <CardDescription>{ds.domain}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <StatCard icon={Users} label="Users" value={ds.users.toLocaleString()} color="#10b981" />
                    <StatCard icon={Package} label="Items" value={ds.items.toLocaleString()} color="#34d399" />
                    <StatCard icon={MousePointerClick} label="Interactions" value={(ds.interactions / 1000000).toFixed(1) + 'M'} sub={ds.interactions.toLocaleString()} color="#6ee7b7" />
                    <StatCard icon={Star} label="Avg Rating" value={String(ds.avgRating)} color="#a7f3d0" />
                    <StatCard icon={Filter} label="Sparsity" value={String(ds.sparsity)} color="#10b981" />
                    <StatCard icon={Database} label="Density" value={String(ds.density)} color="#34d399" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1.5">Available Features</div>
                    <div className="flex flex-wrap gap-1">
                      {ds.features.map(f => (
                        <Badge key={f} variant="outline" className="text-[10px] font-normal border-emerald-500/20 text-emerald-400">{f}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Preprocessing Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="size-4 text-emerald-500" />
              {ml1m.name} Preprocessing
            </CardTitle>
          </CardHeader>
          <CardContent><PipelineViz steps={ml1m.preprocessing} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="size-4 text-emerald-500" />
              {amazon.name} Preprocessing
            </CardTitle>
          </CardHeader>
          <CardContent><PipelineViz steps={amazon.preprocessing} /></CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dataset Comparison</CardTitle>
          <CardDescription>Side-by-side statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-center">ML-1M</TableHead>
                  <TableHead className="text-center">Amazon-Book</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonData.map(row => (
                  <TableRow key={row.metric}>
                    <TableCell className="text-xs font-medium">{row.metric}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{row.ml1m}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{row.amazon}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
