'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronDown, ChevronRight, BrainCircuit, Cpu, FlaskConical,
  Zap, BarChart3, FolderOpen, Download, Mail, Database, Users, Star,
  ArrowRight, CheckCircle, Info, Lightbulb, Code, ExternalLink, Award
} from 'lucide-react';

const SECTIONS = [
  {
    id: 'what-is-collm',
    title: 'What is CoLLM?',
    icon: BrainCircuit,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    content: `CoLLM (Collaborative Large Language Model) integrates collaborative filtering embeddings directly into LLMs for recommendation. Instead of treating LLMs as pure text models, CoLLM bridges two worlds: the pattern-recognition power of collaborative models (MF, LightGCN, SASRec, DIN) and the language understanding of LLMs (Vicuna-7B).

The key insight: user preferences live in two complementary spaces — collaborative signals (who liked what) and semantic signals (what items mean). CoLLM fuses both via a Collaborative Information Embedding (CIE) module.`,
    bullets: [
      'Paper: "CoLLM: Integrating Collaborative Embeddings into LLMs for Recommendation" (arXiv:2310.19488)',
      'Tested on MovieLens-1M and Amazon-Book benchmarks',
      'Outperforms pure LLM-based baselines (TALLRec) on cold-start users',
      'Two-step training: collaborative pre-training → LoRA LLM fine-tuning',
    ],
  },
  {
    id: 'architecture',
    title: 'System Architecture',
    icon: Cpu,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    content: `CoLLM's pipeline has five stages working in sequence. Understanding each stage helps you configure experiments effectively.`,
    subsections: [
      { title: '1. Interaction Data', desc: 'Raw user-item interaction records (clicks, ratings, purchases) from MovieLens or Amazon datasets. These form the training signal.' },
      { title: '2. CIE Module (Collaborative Model)', desc: 'Train MF, LightGCN, SASRec, or DIN on the interaction data. Output: embedding vectors eu ∈ ℝ⁶⁴ for each user and ei ∈ ℝ⁶⁴ for each item.' },
      { title: '3. Prompt Construction', desc: 'Combine collaborative embedding tokens with text-based item/user descriptions into a structured prompt template for the LLM.' },
      { title: '4. Hybrid Encoding (LLM)', desc: "The LLM (Vicuna-7B with LoRA) processes both collaborative tokens and text tokens via its attention mechanism, fusing them into unified representations." },
      { title: '5. LLM Prediction', desc: 'A linear classification head on top of the LLM outputs a probability score (0–1) for whether a user will interact with a target item.' },
    ],
  },
  {
    id: 'training',
    title: 'Training Pipeline',
    icon: Cpu,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    content: 'The two-step CoLLM training process separates collaborative learning from LLM adaptation.',
    steps: [
      { title: 'Step 1 — Pre-train Collaborative Model (~35 min)', desc: 'Train your chosen CIE model (MF/LightGCN/SASRec/DIN) on the full interaction dataset. This produces the embedding space that captures user-item relationships.' },
      { title: 'Step 2 — Extract Embeddings (~5 min)', desc: 'Extract eu (user) and ei (item) vectors from the trained collaborative model. These become the collaborative tokens injected into the LLM prompts.' },
      { title: 'Step 3 — Construct Hybrid Prompts (~10 min)', desc: 'Merge embedding tokens with text descriptions. Format: [CIE_USER] eu [CIE_ITEM] ei [TEXT] item_description [/TEXT] → predict.' },
      { title: 'Step 4 — Fine-tune LLM with LoRA (~160 min)', desc: 'Phase 1: Freeze backbone, train CIE adapter only. Phase 2: Full fine-tune with LoRA rank r (default r=8, α=16). Optimized with AdamW.' },
      { title: 'Step 5 — Evaluate (~12 min)', desc: 'Compute AUC, UAUC, NDCG on held-out test set, split into warm (>10 interactions) and cold-start (≤10 interactions) user groups.' },
    ],
  },
  {
    id: 'metrics',
    title: 'Evaluation Metrics',
    icon: FlaskConical,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    content: 'CoLLM is evaluated on three metrics across three user scenarios.',
    metrics: [
      { name: 'AUC', full: 'Area Under ROC Curve', formula: 'P(score_pos > score_neg)', range: '0.5–1.0', best: '1.0', desc: 'Probability that a random positive item scores higher than a random negative. Dataset-wide, ignores user-level bias. Primary recommendation quality metric.' },
      { name: 'UAUC', full: 'User-level AUC', formula: 'mean(AUC per user)', range: '0.5–1.0', best: '1.0', desc: 'Compute AUC independently per user, then average. More robust to activity-level bias — a power user with 500 interactions doesn\'t dominate a new user with 5.' },
      { name: 'NDCG', full: 'Normalized Discounted Cumulative Gain', formula: 'DCG / IDCG', range: '0.0–1.0', best: '1.0', desc: 'Measures ranking quality with position discount — a relevant item at rank 1 matters more than at rank 5. Captures the ordering of recommendations, not just binary hit/miss.' },
    ],
    scenarios: [
      { name: 'Overall', color: 'text-emerald-400', desc: 'All users in the test set — the main benchmark figure.' },
      { name: 'Warm-Start', color: 'text-blue-400', desc: 'Users with >10 historical interactions — sufficient history for collaborative patterns.' },
      { name: 'Cold-Start', color: 'text-amber-400', desc: 'Users with ≤10 interactions — sparse history. CoLLM\'s collaborative embeddings shine here.' },
    ],
  },
  {
    id: 'models',
    title: 'Collaborative Models (CIE)',
    icon: Zap,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
    content: 'Four collaborative models serve as the CIE (Collaborative Information Embedding) backbone in CoLLM.',
    models: [
      { name: 'MF', full: 'Matrix Factorization', type: 'Classic', auc_ml1m: '0.7295', desc: 'Decomposes the user-item matrix into latent factor matrices U ∈ ℝ^(n×d) and V ∈ ℝ^(m×d). Score = uᵀv. Simple but strong baseline; O(nd) parameters.' },
      { name: 'LightGCN', full: 'Light Graph Convolutional Network', type: 'GNN', auc_ml1m: '0.7100', desc: 'Propagates embeddings over the user-item bipartite graph. Removes non-linear activation and feature transformation — keeps only weighted neighborhood aggregation.' },
      { name: 'SASRec', full: 'Self-Attentive Sequential Recommendation', type: 'Transformer', auc_ml1m: '0.7235', desc: 'Transformer-based sequential model. Uses causal self-attention to model the ordered history of user interactions. Best for capturing sequential patterns.' },
      { name: 'DIN', full: 'Deep Interest Network', type: 'Attention', auc_ml1m: '0.7353', desc: 'Models user diverse interests with attention over historical items. Adapts the user representation dynamically based on the target item — best overall CoLLM result.' },
    ],
  },
  {
    id: 'features',
    title: 'Platform Features Guide',
    icon: Star,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    content: 'Every major section of the platform explained.',
    features: [
      { section: 'Dashboard', icon: '📊', desc: 'Overview of your research activity — recent jobs, evaluation history, platform stats, and quick-start actions.' },
      { section: 'Architecture', icon: '🏗️', desc: 'Interactive pipeline diagram of the full CoLLM system. Select any CIE module to see its specs. Run the two-step training animation.' },
      { section: 'Collab Models', icon: '🧩', desc: 'Deep-dive into each collaborative model (MF, LightGCN, SASRec, DIN): architecture, hyperparameters, embedding math, and performance benchmarks.' },
      { section: 'Training', icon: '⚙️', desc: 'Configure and run training simulations. Pick dataset, collaborative model, LLM backbone, LoRA rank. Watch real-time loss/AUC charts update.' },
      { section: 'Evaluation', icon: '🧪', desc: 'Run model evaluations on test sets. See AUC/UAUC/NDCG broken down by overall/warm/cold. Export results as JSON or CSV.' },
      { section: 'Experiments', icon: '🔬', desc: 'Compare multiple model configurations side-by-side. Ablation studies, hyperparameter sensitivity analysis (LoRA rank, collab dim, temperature).' },
      { section: 'Inference', icon: '⚡', desc: 'Live recommendation demo. Choose a user history and target item, run prediction, see Score Breakdown (Collaborative + Semantic Signal) and Top-5 recs.' },
      { section: 'Analytics', icon: '📈', desc: 'Comprehensive charts: model comparison bars, warm/cold splits, training curves, ablation waterfall, efficiency scatter, model usage pie.' },
      { section: 'Datasets', icon: '🗄️', desc: 'Full details on ML-1M and Amazon-Book: stats, preprocessing, field schemas, download links, and CoLLM paper results per dataset.' },
      { section: 'Workspace', icon: '📁', desc: 'Personal file storage. Upload CSV, JSON, PDF, Python, model checkpoints, images. Download, copy filename, edit category/description.' },
      { section: 'Export & Reports', icon: '📤', desc: 'PDF (professional stamp), JSON (full data), CSV (all models). Email HTML report to any inbox. Auto-naming with project name prefix.' },
      { section: 'API Docs', icon: '🔌', desc: 'OpenAPI-style documentation for all platform endpoints. Test directly from the browser with authentication.' },
    ],
  },
  {
    id: 'faq',
    title: 'FAQ & Troubleshooting',
    icon: Info,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    content: 'Common questions and known issues.',
    faqs: [
      { q: 'Do I need a GPU to run training simulations?', a: 'No — the platform runs realistic simulations based on published CoLLM paper results. Metrics match the paper benchmarks within ±0.003. No GPU, no Python, no local install required.' },
      { q: 'Why does email sending fail?', a: 'Email requires the RESEND_API_KEY environment variable. Add it in your Vercel project settings → Environment Variables. Get a free key at resend.com (3,000 emails/month free). If you\'re just exploring, skip email — PDF/JSON/CSV exports work without any API key.' },
      { q: 'Why does login fail?', a: 'Check that NEXTAUTH_SECRET and DATABASE_URL (Neon PostgreSQL) are set in Vercel env vars. Run "npm run db:push" after adding DATABASE_URL. Google OAuth needs GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET. All features work without login (simulated locally).' },
      { q: 'Why does workspace upload fail?', a: 'Workspace now uses client-side storage — files upload immediately with no server required. Files persist for the current session. For permanent storage, sign in and files sync to the database.' },
      { q: 'What do the AUC values mean?', a: 'AUC of 0.7353 means CoLLM-DIN correctly ranks a positive item above a random negative 73.5% of the time on MovieLens-1M. Random performance = 0.5. Human-level ≈ 0.85+. CoLLM\'s 0.73+ is strong for zero-shot LLM-based recommendation.' },
      { q: 'Can I use the platform for my own dataset?', a: 'The platform simulates the CoLLM pipeline on the paper\'s datasets. For custom datasets, upload your interaction CSV to Workspace, then use the methodology documented in Export → PDF for your analysis write-up.' },
      { q: 'How is cold-start defined?', a: 'Cold-start users have ≤10 interactions in the training set. Warm-start users have >10. CoLLM\'s collaborative embeddings help cold users by importing knowledge from similar users, unlike pure text LLMs.' },
    ],
  },
];

function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors">
        <span className="font-medium text-sm">{title}</span>
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="p-4 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GuideSection() {
  const [activeSection, setActiveSection] = useState('what-is-collm');
  const section = SECTIONS.find(s => s.id === activeSection) ?? SECTIONS[0];

  return (
    <div className="flex gap-0 h-full min-h-[600px]">
      {/* Left nav */}
      <div className="w-52 shrink-0 border-r border-border p-3 space-y-1 overflow-y-auto">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider px-2 pb-1">Guide Contents</p>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm transition-colors ${activeSection === s.id ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'hover:bg-muted/50 text-muted-foreground'}`}
          >
            <s.icon className="size-3.5 shrink-0" />
            <span className="text-xs leading-tight">{s.title}</span>
          </button>
        ))}
      </div>

      {/* Right content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div key={activeSection} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${section.bg}`}>
              <section.icon className={`size-6 ${section.color} shrink-0`} />
              <div>
                <h2 className={`text-lg font-bold ${section.color}`}>{section.title}</h2>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{section.content}</p>
              </div>
            </div>

            {/* bullets */}
            {section.bullets && (
              <div className="space-y-2">
                {section.bullets.map((b, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            )}

            {/* subsections (Architecture) */}
            {section.subsections && (
              <div className="space-y-3">
                {section.subsections.map((sub, i) => (
                  <Card key={i} className="bg-muted/20">
                    <CardContent className="p-4 flex gap-3">
                      <div className="size-7 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0 mt-0.5">{i + 1}</div>
                      <div>
                        <div className="font-semibold text-sm text-blue-400">{sub.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">{sub.desc}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* steps (Training) */}
            {section.steps && (
              <div className="space-y-3 relative">
                <div className="absolute left-[18px] top-6 bottom-6 w-px bg-border" />
                {section.steps.map((step, i) => (
                  <div key={i} className="flex gap-3 relative">
                    <div className="size-9 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-400 shrink-0 z-10">
                      {i + 1}
                    </div>
                    <Card className="flex-1 bg-muted/20">
                      <CardContent className="p-3">
                        <div className="font-semibold text-sm text-purple-400">{step.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">{step.desc}</div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}

            {/* metrics */}
            {section.metrics && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-3">
                  {section.metrics.map(m => (
                    <Card key={m.name} className="bg-muted/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-amber-400 text-lg">{m.name}</div>
                          <Badge variant="outline" className="text-xs">{m.range}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">{m.full}</div>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-emerald-400 block mb-2">{m.formula}</code>
                        <div className="text-xs leading-relaxed">{m.desc}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex gap-3 flex-wrap">
                  {section.scenarios?.map(sc => (
                    <div key={sc.name} className="flex items-center gap-2 text-sm">
                      <div className={`font-semibold ${sc.color}`}>{sc.name}:</div>
                      <span className="text-muted-foreground">{sc.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* models */}
            {section.models && (
              <div className="grid md:grid-cols-2 gap-3">
                {section.models.map(m => (
                  <Card key={m.name} className="bg-muted/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-pink-400 text-base">{m.name}</span>
                          <Badge variant="outline" className="text-[10px]">{m.type}</Badge>
                        </div>
                        <span className="text-xs font-mono text-emerald-400">AUC: {m.auc_ml1m}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-medium mb-1">{m.full}</div>
                      <div className="text-xs leading-relaxed">{m.desc}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* features */}
            {section.features && (
              <div className="grid md:grid-cols-2 gap-3">
                {section.features.map(f => (
                  <Card key={f.section} className="bg-muted/20 hover:border-emerald-500/20 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{f.icon}</span>
                        <span className="font-semibold text-sm text-violet-400">{f.section}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* FAQ accordion */}
            {section.faqs && (
              <div className="space-y-2">
                {section.faqs.map(faq => (
                  <AccordionItem key={faq.q} title={faq.q}>
                    {faq.a}
                  </AccordionItem>
                ))}
              </div>
            )}

            {/* Paper link */}
            <div className="mt-4 p-3 bg-muted/20 border border-border rounded-lg flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs text-muted-foreground">CoLLM paper: arXiv:2310.19488v3 · SIGIR 2024</div>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => window.open('https://arxiv.org/abs/2310.19488', '_blank')}>
                <ExternalLink className="size-3 mr-1.5" />Read Paper
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
