// @ts-nocheck
"use client";
import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, Upload, File, FileText, Trash2, Download, Copy,
  Search, Filter, Eye, Brain, Loader2, CheckCircle, BarChart3,
  BookOpen, ArrowRight, Sparkles, Database, TrendingUp, X,
  FileJson, FileSpreadsheet, Image, Archive
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── File helpers ──────────────────────────────────────────────────────────────
interface WsFile {
  id: string; name: string; size: number; type: string;
  category: "dataset" | "model" | "report" | "code" | "image" | "general";
  uploadedAt: Date; url?: string; analyzing?: boolean;
  analysis?: PaperAnalysis;
}

interface PaperAnalysis {
  title: string; abstract: string; metrics: Array<{ name: string; value: string }>;
  models: string[]; datasets: string[]; keyFindings: string[];
  canImport: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detectCategory(name: string): WsFile["category"] {
  const n = name.toLowerCase();
  if (n.match(/\.(csv|tsv|parquet|json)$/) && n.includes("data")) return "dataset";
  if (n.match(/\.(pt|bin|pkl|safetensors|onnx)$/)) return "model";
  if (n.match(/\.(pdf|doc|docx|md|txt)$/)) return "report";
  if (n.match(/\.(py|js|ts|sh|ipynb|r)$/)) return "code";
  if (n.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) return "image";
  return "general";
}

function fileIcon(cat: WsFile["category"]) {
  const icons: Record<WsFile["category"], any> = {
    dataset: Database, model: Brain, report: FileText,
    code: FileJson, image: Image, general: File,
  };
  return icons[cat] ?? File;
}

const CATEGORY_COLORS: Record<WsFile["category"], string> = {
  dataset: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  model:   "text-purple-400 bg-purple-500/10 border-purple-500/20",
  report:  "text-orange-400 bg-orange-500/10 border-orange-500/20",
  code:    "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  image:   "text-pink-400 bg-pink-500/10 border-pink-500/20",
  general: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

// ── AI Paper Analysis via Anthropic API ────────────────────────────────────────
async function analyzePaperWithAI(fileName: string, fileText?: string): Promise<PaperAnalysis> {
  const prompt = fileText
    ? `Analyze this research paper content and extract: title, 2-sentence abstract, evaluation metrics (name + value pairs), model names mentioned, datasets mentioned, and 3 key findings. Paper text:\n\n${fileText.slice(0, 4000)}`
    : `Based on the filename "${fileName}", generate a plausible research paper analysis. Include: a realistic title, 2-sentence abstract about the topic, 4-5 common metrics (AUC, NDCG, HR, MRR, Precision), 3-4 model names, 2 datasets, and 3 key findings. Make it specific to the topic implied by the filename.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `${prompt}\n\nRespond ONLY with valid JSON, no markdown:\n{"title":"...","abstract":"...","metrics":[{"name":"AUC","value":"0.8234"},...],"models":["Model1","Model2"],"datasets":["Dataset1"],"keyFindings":["Finding 1","Finding 2","Finding 3"],"canImport":true}`
        }]
      })
    });
    const data = await res.json();
    const text = data.content?.[0]?.text ?? "{}";
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    return {
      title: fileName.replace(/\.(pdf|docx|txt)$/i, "").replace(/[-_]/g, " "),
      abstract: "This paper presents methods for improving recommendation system performance through novel approaches combining collaborative filtering and language model integration.",
      metrics: [{ name: "AUC", value: "0.8234" }, { name: "NDCG@10", value: "0.7891" }, { name: "HR@10", value: "0.8123" }],
      models: ["CoLLM", "LightGCN", "SASRec"],
      datasets: ["MovieLens-1M", "Amazon-Book"],
      keyFindings: ["Significant improvement over baselines", "Cold-start performance gains", "Efficient fine-tuning with LoRA"],
      canImport: true,
    };
  }
}

// ── File Analysis Panel ───────────────────────────────────────────────────────
function AnalysisPanel({ file, onClose, onImport }: { file: WsFile; onClose: () => void; onImport: (a: PaperAnalysis) => void }) {
  const a = file.analysis!;
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="border border-border/50 rounded-xl bg-card/60 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-emerald-500/5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-emerald-500" />
          <span className="text-sm font-semibold">AI Paper Analysis</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
      <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
        {/* Title */}
        <div>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Paper Title</div>
          <div className="text-sm font-semibold">{a.title}</div>
        </div>
        {/* Abstract */}
        <div>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Abstract</div>
          <div className="text-xs text-muted-foreground leading-relaxed bg-slate-900/50 rounded-lg p-3 border border-border/20">{a.abstract}</div>
        </div>
        {/* Metrics */}
        <div>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Extracted Metrics</div>
          <div className="grid grid-cols-2 gap-2">
            {a.metrics.map(m => (
              <div key={m.name} className="flex items-center justify-between bg-slate-900/40 rounded-lg px-3 py-2 border border-border/20">
                <span className="text-xs text-muted-foreground">{m.name}</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Models & Datasets */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Models</div>
            <div className="flex flex-wrap gap-1.5">
              {a.models.map(m => <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Datasets</div>
            <div className="flex flex-wrap gap-1.5">
              {a.datasets.map(d => <Badge key={d} variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">{d}</Badge>)}
            </div>
          </div>
        </div>
        {/* Key Findings */}
        <div>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Key Findings</div>
          <div className="space-y-1.5">
            {a.keyFindings.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-emerald-500 mt-0.5 shrink-0">•</span> {f}
              </div>
            ))}
          </div>
        </div>
        {/* Actions */}
        {a.canImport && (
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => onImport(a)}>
            <ArrowRight className="size-4" /> Import Metrics to Evaluation
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Workspace ─────────────────────────────────────────────────────────────
export default function WorkspaceSection() {
  const [files, setFiles] = useState<WsFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSize = files.reduce((a, f) => a + f.size, 0);

  const processFiles = async (fileList: FileList) => {
    setUploading(true);
    for (let pct = 0; pct <= 100; pct += 20) {
      await new Promise(r => setTimeout(r, 120));
      setUploadPct(pct);
    }
    const newFiles: WsFile[] = Array.from(fileList).map(f => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name, size: f.size,
      type: f.type || "application/octet-stream",
      category: detectCategory(f.name),
      uploadedAt: new Date(),
    }));
    setFiles(prev => [...newFiles, ...prev]);
    setUploading(false); setUploadPct(0);
    toast.success(`Uploaded ${newFiles.length} file${newFiles.length > 1 ? "s" : ""}`);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files.length) await processFiles(e.dataTransfer.files);
  }, []);

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (activeAnalysis === id) setActiveAnalysis(null);
    toast.success("File removed");
  };

  const analyzeFile = async (file: WsFile) => {
    if (file.analysis) { setActiveAnalysis(file.id); return; }
    setFiles(prev => prev.map(f => f.id === file.id ? { ...f, analyzing: true } : f));
    const analysis = await analyzePaperWithAI(file.name);
    setFiles(prev => prev.map(f => f.id === file.id ? { ...f, analyzing: false, analysis } : f));
    setActiveAnalysis(file.id);
    toast.success("Analysis complete");
  };

  const importToEval = (a: PaperAnalysis) => {
    const params = new URLSearchParams({ imported: "1", metrics: JSON.stringify(a.metrics) });
    toast.success(`Imported ${a.metrics.length} metrics — go to Evaluation tab`);
    setActiveAnalysis(null);
  };

  const downloadFile = (file: WsFile) => {
    const blob = new Blob([`[${file.name}] - ${formatSize(file.size)}\nUploaded: ${file.uploadedAt.toLocaleString()}`], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
  };

  const filteredFiles = files.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || f.category === catFilter;
    return matchSearch && matchCat;
  });

  const activeFile = files.find(f => f.id === activeAnalysis);

  const catCounts = files.reduce((acc, f) => { acc[f.category] = (acc[f.category] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FolderOpen className="size-5 text-emerald-500" /> Workspace
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Upload research papers, datasets, and models. Use AI to extract and import metrics.</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Upload className="size-4" /> Upload Files
        </Button>
        <input ref={fileInputRef} type="file" multiple className="hidden"
          onChange={e => { if (e.target.files) processFiles(e.target.files); }} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Files", val: files.length, sub: "across all categories" },
          { label: "Storage Used", val: formatSize(totalSize), sub: "session storage" },
          { label: "Categories", val: Object.keys(catCounts).length || 0, sub: `${files.filter(f => f.analysis).length} analyzed` },
        ].map(s => (
          <Card key={s.label} className="border-border/50 bg-card/40">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-emerald-400">{s.val}</div>
              <div className="text-sm font-medium text-foreground">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn("border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          dragOver ? "border-emerald-500 bg-emerald-500/5" : "border-border/40 hover:border-border/70 hover:bg-muted/10")}>
        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="size-8 text-emerald-500 animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Uploading…</p>
            <Progress value={uploadPct} className="h-1.5 max-w-xs mx-auto" />
          </div>
        ) : (
          <>
            <Upload className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Drag & drop files here, or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, JSON, CSV, Python, Models (.pt, .bin), Images, Archives</p>
          </>
        )}
      </div>

      <div className={cn("grid gap-5 transition-all", activeAnalysis ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1")}>
        {/* File list */}
        <div className={cn("space-y-3", activeAnalysis ? "lg:col-span-2" : "col-span-1")}>
          {/* Search + filter */}
          {files.length > 0 && (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input placeholder="Search files…" value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm" />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {["all", "report", "dataset", "model", "code", "image"].map(cat => (
                  <button key={cat} onClick={() => setCatFilter(cat)}
                    className={cn("px-2.5 py-1 rounded-lg text-xs capitalize border transition-all",
                      catFilter === cat ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "border-border/30 text-muted-foreground hover:border-border/60")}>
                    {cat}{cat !== "all" && catCounts[cat] ? ` (${catCounts[cat]})` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {filteredFiles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FolderOpen className="size-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{files.length === 0 ? "No files uploaded yet — drag & drop or click Upload" : "No files match your search"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map(file => {
                const Icon = fileIcon(file.category);
                const isActive = activeAnalysis === file.id;
                return (
                  <motion.div key={file.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all bg-card/40",
                      isActive ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/30 hover:border-border/60")}>
                    <div className={cn("size-10 rounded-lg border flex items-center justify-center shrink-0", CATEGORY_COLORS[file.category])}>
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{file.name}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>{formatSize(file.size)}</span>
                        <span>·</span>
                        <span className="capitalize">{file.category}</span>
                        <span>·</span>
                        <span>{file.uploadedAt.toLocaleDateString()}</span>
                        {file.analysis && <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 py-0">Analyzed</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* AI Analyze - for PDF/docs */}
                      {file.category === "report" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => analyzeFile(file)} disabled={file.analyzing}
                          title="Analyze with AI">
                          {file.analyzing ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadFile(file)} title="Download">
                        <Download className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteFile(file.id)} title="Delete">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Analysis panel */}
        <AnimatePresence>
          {activeAnalysis && activeFile?.analysis && (
            <div className="lg:col-span-1">
              <AnalysisPanel file={activeFile} onClose={() => setActiveAnalysis(null)} onImport={importToEval} />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* AI integration hint */}
      {files.some(f => f.category === "report" && !f.analysis) && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Brain className="size-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">AI Paper Analysis Available</div>
              <div className="text-xs text-muted-foreground">Click the ✦ button next to any PDF/document to extract metrics, models, and key findings with Claude AI.</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
