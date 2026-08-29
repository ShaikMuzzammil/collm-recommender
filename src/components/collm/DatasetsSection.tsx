// @ts-nocheck
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Database, Users, Package, MousePointerClick, Star, ExternalLink, Download, FileText, BarChart3, Info } from 'lucide-react';
import { toast } from 'sonner';

const DATASETS = {
  'ml-1m': {
    name: 'MovieLens-1M',
    shortName: 'ML-1M',
    desc: 'Classic movie rating dataset from GroupLens Research. 1 million ratings from 6,000 users on 4,000 movies.',
    users: 6040, items: 3706, interactions: 1000209, density: '4.47%', sparsity: '95.53%', avgRating: '3.58',
    split: '8:1:1 (train/val/test)', source: 'GroupLens Research Lab',
    url: 'https://grouplens.org/datasets/movielens/1m/',
    paperUrl: 'https://dl.acm.org/doi/10.1145/2827872',
    kaggleUrl: 'https://www.kaggle.com/datasets/odedgolden/movielens-1m-dataset',
    coldThreshold: '≤10 ratings',
    warmThreshold: '>10 ratings',
    coldPct: '27.4%', warmPct: '72.6%',
    fields: ['UserID', 'MovieID', 'Rating (1-5)', 'Timestamp'],
    processing: ['Binarize ratings ≥4 as positive', 'Leave-one-out eval split', 'Cold/warm split by interaction count', 'Negative sampling 1:1 ratio'],
    format: 'UserID::MovieID::Rating::Timestamp',
    domainTags: ['Movies', 'Ratings', 'Sequential', 'Collaborative'],
    collmResults: { din: 0.7353, mf: 0.7295, lightgcn: 0.7100, sasrec: 0.7235 },
  },
  'amazon-book': {
    name: 'Amazon-Book',
    shortName: 'Amazon',
    desc: 'Book reviews and ratings from Amazon.com. Large-scale dataset covering diverse genres with rich interaction patterns.',
    users: 52643, items: 91599, interactions: 2984108, density: '0.06%', sparsity: '99.94%', avgRating: '4.13',
    split: '8:1:1 (train/val/test)', source: 'Amazon Product Reviews',
    url: 'https://cseweb.ucsd.edu/~jmcauley/datasets/amazon_v2/',
    paperUrl: 'https://arxiv.org/abs/1602.01585',
    kaggleUrl: 'https://www.kaggle.com/datasets/mohamedbakhet/amazon-books-reviews',
    coldThreshold: '≤10 interactions', warmThreshold: '>10 interactions',
    coldPct: '31.8%', warmPct: '68.2%',
    fields: ['ReviewerID', 'ASIN (BookID)', 'Rating (1-5)', 'ReviewText', 'Timestamp'],
    processing: ['Filter ≥5 core (both user and item)', 'Implicit feedback (rating→binary)', 'Sequential ordering by timestamp', 'Cold-start user identification'],
    format: 'JSON {reviewerID, asin, overall, unixReviewTime}',
    domainTags: ['Books', 'Amazon', 'Large-scale', 'Sparse'],
    collmResults: { din: 0.8245, mf: 0.8109, lightgcn: 0.8026, sasrec: 0.7890 },
  },
};

const COMPARISON = [
  { metric: 'Users', ml1m: '6,040', amazon: '52,643' },
  { metric: 'Items', ml1m: '3,706', amazon: '91,599' },
  { metric: 'Interactions', ml1m: '1,000,209', amazon: '2,984,108' },
  { metric: 'Density', ml1m: '4.47%', amazon: '0.06%' },
  { metric: 'Sparsity', ml1m: '95.53%', amazon: '99.94%' },
  { metric: 'Avg Rating', ml1m: '3.58', amazon: '4.13' },
  { metric: 'Cold Users', ml1m: '27.4%', amazon: '31.8%' },
  { metric: 'Split', ml1m: '8:1:1', amazon: '8:1:1' },
  { metric: 'Domain', ml1m: 'Movies', amazon: 'Books' },
];

export default function DatasetsSection() {
  const ml1m = DATASETS['ml-1m'];
  const amazon = DATASETS['amazon-book'];

  const openUrl = (url: string) => window.open(url, '_blank', 'noopener');

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2"><Database className="size-5 text-emerald-500" />Research Datasets</h2>
        <p className="text-muted-foreground text-sm">The two benchmark datasets used in CoLLM paper evaluation (arXiv:2310.19488)</p>
      </div>

      {/* Dataset cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {[ml1m, amazon].map((ds, i) => (
          <motion.div key={ds.shortName} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <Database className="size-4 text-emerald-500" />
                    </div>
                    {ds.name}
                  </CardTitle>
                  <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">{ds.shortName}</Badge>
                </div>
                <CardDescription className="leading-relaxed">{ds.desc}</CardDescription>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {ds.domainTags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Users, label: 'Users', value: ds.users.toLocaleString() },
                    { icon: Package, label: 'Items', value: ds.items.toLocaleString() },
                    { icon: MousePointerClick, label: 'Interactions', value: ds.interactions.toLocaleString() },
                    { icon: Star, label: 'Avg Rating', value: ds.avgRating },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-muted/30 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-0.5">
                        <Icon className="size-3" />{label}
                      </div>
                      <div className="font-bold text-sm font-mono">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Warm/cold split */}
                <div className="space-y-1.5">
                  <div className="text-xs text-muted-foreground font-medium">Cold/Warm User Split</div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                    <div className="bg-amber-500 h-full flex items-center justify-center text-[9px] font-bold text-black"
                      style={{ width: ds.coldPct }}>Cold {ds.coldPct}</div>
                    <div className="bg-emerald-500 h-full flex items-center justify-center text-[9px] font-bold text-black flex-1">
                      Warm {ds.warmPct}
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Cold: {ds.coldThreshold}</span>
                    <span>Warm: {ds.warmThreshold}</span>
                  </div>
                </div>

                {/* CoLLM results on this dataset */}
                <div className="space-y-1.5">
                  <div className="text-xs text-muted-foreground font-medium">CoLLM AUC Results (this dataset)</div>
                  {Object.entries(ds.collmResults).map(([model, auc]) => (
                    <div key={model} className="flex items-center gap-2">
                      <span className="text-xs w-16 text-muted-foreground uppercase">{model}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((auc as number) - 0.6) / 0.3 * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono text-emerald-400 w-14 text-right">{(auc as number).toFixed(4)}</span>
                    </div>
                  ))}
                </div>

                {/* Download / link buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => openUrl(ds.url)}>
                    <ExternalLink className="size-3 mr-1.5" />Official Source
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => openUrl(ds.kaggleUrl)}>
                    <Download className="size-3 mr-1.5" />Kaggle
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => openUrl(ds.paperUrl)}>
                    <FileText className="size-3 mr-1.5" />Paper
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detailed tabs */}
      <Tabs defaultValue="comparison">
        <TabsList>
          <TabsTrigger value="comparison"><BarChart3 className="size-3.5 mr-1" />Comparison</TabsTrigger>
          <TabsTrigger value="ml1m"><Database className="size-3.5 mr-1" />ML-1M Details</TabsTrigger>
          <TabsTrigger value="amazon"><Database className="size-3.5 mr-1" />Amazon Details</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison">
          <Card>
            <CardHeader><CardTitle className="text-sm">Side-by-Side Comparison</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-emerald-400">MovieLens-1M</TableHead>
                    <TableHead className="text-blue-400">Amazon-Book</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COMPARISON.map(row => (
                    <TableRow key={row.metric}>
                      <TableCell className="text-muted-foreground text-sm">{row.metric}</TableCell>
                      <TableCell className="font-mono text-sm">{row.ml1m}</TableCell>
                      <TableCell className="font-mono text-sm">{row.amazon}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {[{ key: 'ml1m', ds: ml1m }, { key: 'amazon', ds: amazon }].map(({ key, ds }) => (
          <TabsContent key={key} value={key}>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Data Fields</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {ds.fields.map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm py-1 border-b border-border/50 last:border-0">
                        <div className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{f}</code>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-2.5 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Sample Format</div>
                    <code className="text-xs text-emerald-400">{ds.format}</code>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Preprocessing Pipeline</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {ds.processing.map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="size-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-500 shrink-0 mt-0.5">{i + 1}</div>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                    <div className="text-xs text-emerald-400 font-medium mb-1">Data Source</div>
                    <div className="text-xs text-muted-foreground">{ds.source}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* CoLLM paper reference */}
      <Card className="bg-emerald-500/5 border-emerald-500/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="size-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-400">CoLLM Paper Reference</p>
            <p className="text-sm text-muted-foreground mt-1">
              Both datasets are used in <em>CoLLM: Integrating Collaborative Embeddings into Large Language Models for Recommendation</em> (arXiv:2310.19488v3). Results shown are from Table 2 of the paper.
            </p>
            <Button size="sm" variant="outline" className="mt-2 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => openUrl('https://arxiv.org/abs/2310.19488')}>
              <ExternalLink className="size-3 mr-1.5" />Read the Paper
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
