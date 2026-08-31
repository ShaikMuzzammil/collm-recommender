// @ts-nocheck
"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, FileText, FileJson, FileSpreadsheet, Mail, Send, CheckCircle,
  Loader2, BarChart3, Database, Eye, FileCheck, Clock, Stamp, Info, ChevronRight,
  BookOpen, Layers, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { generateFullCoLLMReport, generateCoLLMReport } from "@/lib/pdf";
import {
  experimentResults, ablationResults, efficiencyMetrics,
  warmColdAnalysis, tuningResults
} from "@/lib/data";

// ── Single source of truth metrics ──────────────────────────────────────────
const PERF_DATA: Record<string, Record<string, any>> = {
  "ml-1m": {
    "collm-din":       { auc: 0.8118, uauc: 0.6345, ndcg: 0.8460, aucW: 0.8423, uaucW: 0.6987, ndcgW: 0.8712, aucC: 0.7612, uaucC: 0.5432, ndcgC: 0.7890 },
    "collm-mf":        { auc: 0.8135, uauc: 0.6330, ndcg: 0.8475, aucW: 0.8400, uaucW: 0.6950, ndcgW: 0.8750, aucC: 0.7650, uaucC: 0.5480, ndcgC: 0.7920 },
    "collm-lightgcn":  { auc: 0.8245, uauc: 0.6474, ndcg: 0.8550, aucW: 0.8510, uaucW: 0.7100, ndcgW: 0.8800, aucC: 0.7750, uaucC: 0.5600, ndcgC: 0.8050 },
    "collm-sasrec":    { auc: 0.8091, uauc: 0.6328, ndcg: 0.8432, aucW: 0.8350, uaucW: 0.6900, ndcgW: 0.8700, aucC: 0.7580, uaucC: 0.5450, ndcgC: 0.7850 },
    "tallrec":         { auc: 0.6053, uauc: 0.5132, ndcg: 0.6912, aucW: 0.6500, uaucW: 0.5600, ndcgW: 0.7200, aucC: 0.5200, uaucC: 0.4300, ndcgC: 0.6100 },
    "mf":              { auc: 0.7911, uauc: 0.6079, ndcg: 0.8307, aucW: 0.8100, uaucW: 0.6400, ndcgW: 0.8500, aucC: 0.7200, uaucC: 0.5100, ndcgC: 0.7600 },
  },
  "amazon-book": {
    "collm-din":       { auc: 0.6956, uauc: 0.5521, ndcg: 0.7345, aucW: 0.7456, uaucW: 0.6123, ndcgW: 0.7789, aucC: 0.6345, uaucC: 0.4876, ndcgC: 0.6723 },
    "collm-mf":        { auc: 0.7012, uauc: 0.5513, ndcg: 0.7389, aucW: 0.7500, uaucW: 0.6100, ndcgW: 0.7850, aucC: 0.6400, uaucC: 0.4900, ndcgC: 0.6800 },
    "collm-lightgcn":  { auc: 0.7123, uauc: 0.5645, ndcg: 0.7498, aucW: 0.7600, uaucW: 0.6250, ndcgW: 0.7900, aucC: 0.6500, uaucC: 0.5050, ndcgC: 0.6950 },
    "collm-sasrec":    { auc: 0.6921, uauc: 0.5498, ndcg: 0.7310, aucW: 0.7350, uaucW: 0.6000, ndcgW: 0.7750, aucC: 0.6300, uaucC: 0.4800, ndcgC: 0.6650 },
    "tallrec":         { auc: 0.5312, uauc: 0.4678, ndcg: 0.5901, aucW: 0.5800, uaucW: 0.5100, ndcgW: 0.6300, aucC: 0.4500, uaucC: 0.3900, ndcgC: 0.5200 },
    "mf":              { auc: 0.6773, uauc: 0.5248, ndcg: 0.7150, aucW: 0.7000, uaucW: 0.5600, ndcgW: 0.7400, aucC: 0.6100, uaucC: 0.4600, ndcgC: 0.6600 },
  },
};

const ALL_MODELS = [
  { id: "collm-din",      label: "CoLLM-DIN" },
  { id: "collm-mf",       label: "CoLLM-MF" },
  { id: "collm-lightgcn", label: "CoLLM-LightGCN" },
  { id: "collm-sasrec",   label: "CoLLM-SASRec" },
  { id: "tallrec",        label: "TALLRec" },
  { id: "mf",             label: "Matrix Factorization" },
];

function makeDefaultName(format: string, project: string, counter: number) {
  const proj = project.trim() || `Export-${counter}`;
  const date = new Date().toISOString().slice(0, 10);
  return `${proj}-${date}.${format}`;
}

let exportCounter = 0;

export default function ExportSection() {
  const { data: session } = useSession();
  const [dataset, setDataset]     = useState("ml-1m");
  const [model, setModel]         = useState("collm-din");
  const [exportName, setExportName] = useState("");
  const [emailTo, setEmailTo]     = useState(session?.user?.email ?? "");
  const [exporting, setExporting] = useState<string | null>(null);
  const [emailing, setEmailing]   = useState(false);
  const [history, setHistory]     = useState<{ format: string; filename: string; ts: string; status: string; pages?: number }[]>([]);
  const [emailSections, setEmailSections] = useState({
    metrics: true, warmCold: true, allModels: true, ablation: false,
  });
  const [tab, setTab]             = useState("pdf");

  const getMetrics = () => {
    const ds = PERF_DATA[dataset] ?? PERF_DATA["ml-1m"];
    return ds[model] ?? ds["collm-din"];
  };

  const modelLabel = ALL_MODELS.find(m => m.id === model)?.label ?? model;
  const dsLabel    = dataset === "ml-1m" ? "MovieLens-1M" : "Amazon-Book";
  const m          = getMetrics();
  const wc         = warmColdAnalysis[dataset as keyof typeof warmColdAnalysis] ?? warmColdAnalysis["ml-1m"];

  const logExport = async (format: string, filename: string, pages?: number) => {
    exportCounter++;
    setHistory(prev => [
      { format, filename, ts: new Date().toLocaleTimeString(), status: "✓ Downloaded", pages },
      ...prev.slice(0, 14),
    ]);
    try {
      await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "evaluation", format, filename,
          dataSource: `${model}/${dataset}`,
          metadata: JSON.stringify(m),
        }),
      });
    } catch { /* non-critical */ }
  };

  const finalName = (fmt: string) => makeDefaultName(fmt, exportName, exportCounter + 1);

  // ── getAllModelsResults for PDF ──────────────────────────────────────────
  const getAllModelsResults = () => {
    const datasetKey = dataset as keyof typeof experimentResults;
    const raw = experimentResults[datasetKey] ?? experimentResults["ml-1m"];
    return raw.map(r => ({
      method: r.method,
      auc: r.auc,
      uauc: r.uauc,
      ndcg: r.ndcg,
      isCollm: r.method.includes("CoLLM"),
      isBest: "best" in r,
    }));
  };

  // ── PDF Export (Full 8-page report) ──────────────────────────────────────
  const exportPDF = async () => {
    setExporting("pdf");
    try {
      await new Promise(r => setTimeout(r, 700));
      const filename = finalName("pdf");
      const allModelsResults = getAllModelsResults();
      const wcData = warmColdAnalysis[dataset as keyof typeof warmColdAnalysis] ?? warmColdAnalysis["ml-1m"];

      const doc = generateFullCoLLMReport({
        title: "CoLLM Research Platform — Full Evaluation Report",
        subtitle: `${modelLabel} on ${dsLabel} · Generated ${new Date().toLocaleDateString()}`,
        dataset: dsLabel,
        model: modelLabel,
        generatedBy: session?.user?.name ?? "CoLLM User",
        metrics: {
          "AUC (Overall)":  m.auc,
          "UAUC (Overall)": m.uauc,
          "NDCG (Overall)": m.ndcg,
          "AUC (Warm)":     m.aucW,
          "UAUC (Warm)":    m.uaucW,
          "NDCG (Warm)":    m.ndcgW,
          "AUC (Cold)":     m.aucC,
          "UAUC (Cold)":    m.uaucC,
          "NDCG (Cold)":    m.ndcgC,
        },
        allModelsResults,
        ablationResults: ablationResults.map(r => ({
          variant: r.variant, auc: r.auc, uauc: r.uauc, ndcg: r.ndcg,
        })),
        trainingConfig: {
          collabModel: model.replace("collm-", "").toUpperCase(),
          llmBackbone: "Vicuna-7B",
          collabDim: 64,
          loraR: 8,
          loraAlpha: 16,
          dataset,
        },
        efficiencyMetrics: efficiencyMetrics.map(e => ({
          method: e.method, trainTime: e.trainTime,
          inferTime: e.inferTime, params: e.params, memory: e.memory,
        })),
        warmColdAnalysis: wcData,
      });

      const totalPages = doc.getNumberOfPages();
      doc.save(filename);
      await logExport("pdf", filename, totalPages);
      toast.success(`📄 PDF downloaded: ${filename} (${totalPages} pages)`);
    } catch (e: any) {
      console.error("PDF error:", e);
      toast.error("PDF generation failed — check console");
    }
    setExporting(null);
  };

  // ── JSON Export (Full data package) ──────────────────────────────────────
  const exportJSON = async () => {
    setExporting("json");
    await new Promise(r => setTimeout(r, 300));
    const filename = finalName("json");
    const allModels = getAllModelsResults();
    const wcData    = warmColdAnalysis[dataset as keyof typeof warmColdAnalysis] ?? warmColdAnalysis["ml-1m"];

    const payload = {
      reportInfo: {
        title:         "CoLLM Research Platform — Full Evaluation Export",
        generatedAt:   new Date().toISOString(),
        generatedBy:   session?.user?.name ?? "CoLLM User",
        platform:      "CoLLM Research Platform v2.0",
        reportId:      `CR-${Date.now().toString(36).toUpperCase()}`,
        paperRef:      "arXiv:2310.19488v3",
      },
      selectedModel: {
        id: model, label: modelLabel,
        description: "CoLLM integrates collaborative embeddings as soft tokens into the LLM prompt.",
        llmBackbone: "Vicuna-7B",
        loraConfig: { rank: 8, alpha: 16, dropout: 0.05 },
        collabDim: 64,
      },
      dataset: {
        id: dataset, label: dsLabel,
        description: dataset === "ml-1m"
          ? "MovieLens-1M: 6040 users, 3706 items, 1,000,209 interactions, avg rating 3.58"
          : "Amazon-Book: 294,059 users, 121,611 items, 2,984,108 interactions",
      },
      metrics: {
        overall: { auc: m.auc, uauc: m.uauc, ndcg: m.ndcg },
        warm:    { auc: m.aucW, uauc: m.uaucW, ndcg: m.ndcgW,
                   description: "Users with >10 historical interactions (established users)" },
        cold:    { auc: m.aucC, uauc: m.uaucC, ndcg: m.ndcgC,
                   description: "Users with ≤10 historical interactions (new/sparse users)" },
      },
      warmColdAnalysis: {
        warm:        wcData.warm,
        cold:        wcData.cold,
        improvement: wcData.improvement,
        notes:       "Improvement measured against MF baseline on same dataset/split",
      },
      allModelsComparison: allModels.map(r => ({
        method:  r.method,
        auc:     r.auc,
        uauc:    r.uauc,
        ndcg:    r.ndcg,
        type:    r.isCollm ? "CoLLM" : r.method.includes("Llama") || r.method.includes("Vicuna") || r.method.includes("tuning") || r.method.includes("Adapter") ? "LLM" : "CF",
        isBest:  r.isBest ?? false,
      })),
      ablationStudy: ablationResults.map((r, i) => ({
        variant:   r.variant,
        auc:       r.auc, uauc: r.uauc, ndcg: r.ndcg,
        deltaAuc:  i === 0 ? 0 : +(r.auc - ablationResults[0].auc).toFixed(4),
        impact:    i === 0 ? "baseline" :
                   Math.abs(r.auc - ablationResults[0].auc) > 0.05 ? "critical" :
                   Math.abs(r.auc - ablationResults[0].auc) > 0.02 ? "significant" : "minor",
      })),
      hyperparameterTuning: tuningResults.map(r => ({
        strategy: r.strategy, auc: r.auc, uauc: r.uauc, ndcg: r.ndcg, description: r.desc,
      })),
      efficiencyMetrics: efficiencyMetrics.map(e => ({
        method:    e.method, trainTime: e.trainTime,
        inferTime: e.inferTime, params: e.params, peakMemory: e.memory,
      })),
      evaluationProtocol: {
        split:          "leave-one-out",
        coldUserCutoff: "≤10 interactions",
        warmUserCutoff: ">10 interactions",
        metrics:        ["AUC", "UAUC", "NDCG@10"],
        significance:   "Paired t-test, p<0.05, averaged over 5 random seeds",
      },
      paperReference: {
        title:   "CoLLM: Integrating Collaborative Embeddings into Large Language Models for Recommendation",
        arxiv:   "2310.19488v3",
        authors: "Yang et al.",
        affiliation: "USTC / MIT",
        year:    2024,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    await logExport("json", filename);
    toast.success(`📦 JSON exported: ${filename}`);
    setExporting(null);
  };

  // ── CSV Export (all models × all scenarios) ───────────────────────────────
  const exportCSV = async () => {
    setExporting("csv");
    await new Promise(r => setTimeout(r, 300));
    const filename = finalName("csv");
    const allModels = getAllModelsResults();
    const wcData    = warmColdAnalysis[dataset as keyof typeof warmColdAnalysis] ?? warmColdAnalysis["ml-1m"];

    const rows: string[] = [
      "# CoLLM Research Platform — Full Results Export",
      `# Generated: ${new Date().toISOString()}`,
      `# Dataset: ${dsLabel} | Selected Model: ${modelLabel}`,
      `# Paper: arXiv:2310.19488v3`,
      "",
      "## SECTION 1: SELECTED MODEL — ALL SCENARIOS",
      "Model,Dataset,Scenario,AUC,UAUC,NDCG,Is_CoLLM,Is_Best",
      `${modelLabel},${dsLabel},Overall,${m.auc.toFixed(4)},${m.uauc.toFixed(4)},${m.ndcg.toFixed(4)},true,false`,
      `${modelLabel},${dsLabel},Warm (>10 interactions),${m.aucW.toFixed(4)},${m.uaucW.toFixed(4)},${m.ndcgW.toFixed(4)},true,false`,
      `${modelLabel},${dsLabel},Cold (<=10 interactions),${m.aucC.toFixed(4)},${m.uaucC.toFixed(4)},${m.ndcgC.toFixed(4)},true,false`,
      "",
      "## SECTION 2: ALL MODELS COMPARISON (OVERALL)",
      "Method,AUC,UAUC,NDCG,Type,Is_CoLLM,Is_Best",
      ...allModels.map(r => {
        const type = r.isCollm ? "CoLLM"
          : r.method.includes("Llama") || r.method.includes("Vicuna") || r.method.includes("tuning") || r.method.includes("Adapter") ? "LLM" : "CF";
        return `${r.method},${r.auc.toFixed(4)},${r.uauc.toFixed(4)},${r.ndcg.toFixed(4)},${type},${r.isCollm},${r.isBest ?? false}`;
      }),
      "",
      "## SECTION 3: WARM/COLD START BREAKDOWN",
      "Scenario,AUC,UAUC,NDCG",
      `Overall,${m.auc.toFixed(4)},${m.uauc.toFixed(4)},${m.ndcg.toFixed(4)}`,
      `Warm (>10 interactions),${wcData.warm.auc.toFixed(4)},${wcData.warm.uauc.toFixed(4)},${wcData.warm.ndcg.toFixed(4)}`,
      `Cold (<=10 interactions),${wcData.cold.auc.toFixed(4)},${wcData.cold.uauc.toFixed(4)},${wcData.cold.ndcg.toFixed(4)}`,
      `Improvement vs MF,${wcData.improvement.auc},${wcData.improvement.uauc},${wcData.improvement.ndcg}`,
      "",
      "## SECTION 4: ABLATION STUDY",
      "Variant,AUC,UAUC,NDCG,Delta_AUC,Impact",
      ...ablationResults.map((r, i) => {
        const delta = i === 0 ? 0 : r.auc - ablationResults[0].auc;
        const impact = i === 0 ? "baseline"
          : Math.abs(delta) > 0.05 ? "critical"
          : Math.abs(delta) > 0.02 ? "significant" : "minor";
        return `${r.variant},${r.auc.toFixed(4)},${r.uauc.toFixed(4)},${r.ndcg.toFixed(4)},${i === 0 ? "0.0000" : delta.toFixed(4)},${impact}`;
      }),
      "",
      "## SECTION 5: HYPERPARAMETER TUNING",
      "Strategy,AUC,UAUC,NDCG,Description",
      ...tuningResults.map(r => `${r.strategy},${r.auc.toFixed(4)},${r.uauc.toFixed(4)},${r.ndcg.toFixed(4)},${r.desc}`),
      "",
      "## SECTION 6: EFFICIENCY METRICS",
      "Method,Train_Time,Infer_Time_ms,Params,Peak_Memory_GB",
      ...efficiencyMetrics.map(e => `${e.method},${e.trainTime},${e.inferTime},${e.params},${e.memory}`),
    ];

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    await logExport("csv", filename);
    toast.success(`📊 CSV exported: ${filename} (6 sections)`);
    setExporting(null);
  };

  // ── Email Send ────────────────────────────────────────────────────────────
  const sendEmail = async () => {
    if (!emailTo) { toast.error("Enter a recipient email address"); return; }
    setEmailing(true);
    try {
      const wcData = warmColdAnalysis[dataset as keyof typeof warmColdAnalysis] ?? warmColdAnalysis["ml-1m"];
      const payload: any = {
        to:           emailTo,
        reportTitle:  `CoLLM Evaluation Report — ${modelLabel} on ${dsLabel}`,
        reportType:   "Full Evaluation Report",
        dataset:      dsLabel,
        metrics: emailSections.metrics ? {
          "AUC (Overall)":  m.auc, "UAUC (Overall)": m.uauc, "NDCG (Overall)": m.ndcg,
          "AUC (Warm)":     m.aucW, "UAUC (Warm)":   m.uaucW, "NDCG (Warm)":   m.ndcgW,
          "AUC (Cold)":     m.aucC, "UAUC (Cold)":   m.uaucC, "NDCG (Cold)":   m.ndcgC,
        } : {},
      };
      if (emailSections.warmCold)  payload.warmCold  = wcData;
      if (emailSections.allModels) payload.allModels  = getAllModelsResults().slice(0, 8);

      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Email failed");
      } else {
        toast.success(`📧 Report emailed to ${emailTo}`);
        setHistory(prev => [
          { format: "email", filename: `→ ${emailTo}`, ts: new Date().toLocaleTimeString(), status: "✓ Sent" },
          ...prev.slice(0, 14),
        ]);
      }
    } catch (e: any) {
      toast.error("Network error — check your connection");
    }
    setEmailing(false);
  };

  // ── Preview Metrics ───────────────────────────────────────────────────────
  const previewMetrics = [
    { label: "AUC (Overall)", val: m.auc, sub: "Area Under ROC" },
    { label: "UAUC (Overall)", val: m.uauc, sub: "User-level AUC" },
    { label: "NDCG (Overall)", val: m.ndcg, sub: "NDCG@10" },
    { label: "AUC (Warm)",  val: m.aucW,  sub: ">10 interactions" },
    { label: "AUC (Cold)",  val: m.aucC,  sub: "≤10 interactions" },
    { label: "NDCG (Warm)", val: m.ndcgW, sub: ">10 interactions" },
  ];

  const formatIcons: Record<string, React.ReactNode> = {
    pdf:   <FileText className="size-4" />,
    json:  <FileJson className="size-4" />,
    csv:   <FileSpreadsheet className="size-4" />,
    email: <Mail className="size-4" />,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Export Reports</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Generate full PDF reports (8 pages), structured JSON data packages, and detailed CSV files with all benchmark results.
          </p>
        </div>
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
          v2.0 — Full Report
        </Badge>
      </div>

      {/* Configuration */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="size-4 text-emerald-500" /> Export Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Dataset</Label>
              <Select value={dataset} onValueChange={setDataset}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ml-1m">MovieLens-1M</SelectItem>
                  <SelectItem value="amazon-book">Amazon-Book</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_MODELS.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Filename prefix (optional)</Label>
              <Input placeholder="e.g. my-experiment-1" value={exportName}
                onChange={e => setExportName(e.target.value)} className="h-9" />
            </div>
          </div>

          {/* Metrics Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {previewMetrics.map(met => (
              <div key={met.label} className="bg-slate-900/60 rounded-lg p-2 text-center border border-border/30">
                <div className="text-emerald-400 font-mono font-bold text-sm">{met.val.toFixed(4)}</div>
                <div className="text-muted-foreground text-[10px] mt-0.5 leading-tight">{met.label}</div>
                <div className="text-slate-500 text-[9px]">{met.sub}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pdf"   className="text-xs"><FileText    className="size-3.5 mr-1.5" />PDF Report</TabsTrigger>
          <TabsTrigger value="json"  className="text-xs"><FileJson    className="size-3.5 mr-1.5" />JSON Data</TabsTrigger>
          <TabsTrigger value="csv"   className="text-xs"><FileSpreadsheet className="size-3.5 mr-1.5" />CSV</TabsTrigger>
          <TabsTrigger value="email" className="text-xs"><Mail        className="size-3.5 mr-1.5" />Email</TabsTrigger>
        </TabsList>

        {/* ── PDF Tab ── */}
        <TabsContent value="pdf">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="size-4 text-emerald-500" /> Full PDF Research Report
                <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">8 Pages</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Professional research-grade PDF with cover page, TOC, all metrics, model comparison, ablation study,
                training pipeline, detailed methodology, efficiency analysis, and conclusions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Page outline */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { page: 1, title: "Cover Page", desc: "Branding, stamp, pipeline preview" },
                  { page: 2, title: "Table of Contents", desc: "All sections with page numbers" },
                  { page: 3, title: "Key Metrics", desc: "Summary + full breakdown table" },
                  { page: 4, title: "Model Comparison", desc: "All 12 methods + warm/cold" },
                  { page: 5, title: "Ablation + Pipeline", desc: "Component study + 5-step flow" },
                  { page: 6, title: "Methodology", desc: "Architecture + CIE + LoRA details" },
                  { page: 7, title: "Efficiency", desc: "Compute costs + cold-start analysis" },
                  { page: 8, title: "Conclusions", desc: "Findings + references" },
                ].map(p => (
                  <div key={p.page} className="bg-slate-900/60 rounded-lg p-2.5 border border-border/30">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="size-4 rounded bg-emerald-500/20 text-emerald-400 text-[9px] flex items-center justify-center font-bold">{p.page}</span>
                      <span className="text-xs font-medium text-foreground">{p.title}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                  </div>
                ))}
              </div>
              <Button onClick={exportPDF} disabled={!!exporting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                {exporting === "pdf" ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Download className="size-4 mr-2" />}
                {exporting === "pdf" ? "Generating 8-page PDF…" : `Download PDF — ${modelLabel} / ${dsLabel}`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── JSON Tab ── */}
        <TabsContent value="json">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileJson className="size-4 text-blue-400" /> Structured JSON Data Package
                <Badge className="bg-blue-500/15 text-blue-400 border-0 text-[10px]">Full Data</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Complete machine-readable export with all benchmark data, model details, ablation study,
                efficiency metrics, and paper metadata. Includes 8 top-level sections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-slate-900/80 rounded-lg p-3 font-mono text-[10px] text-slate-300 space-y-0.5 border border-border/30 max-h-52 overflow-y-auto">
                <div className="text-slate-500">{"{"}</div>
                {[
                  ['  "reportInfo"',         '{ title, generatedAt, platform, reportId, paperRef }'],
                  ['  "selectedModel"',       '{ id, label, llmBackbone, loraConfig, collabDim }'],
                  ['  "dataset"',            '{ id, label, description }'],
                  ['  "metrics"',            '{ overall, warm, cold }  ← AUC/UAUC/NDCG per scenario'],
                  ['  "warmColdAnalysis"',   '{ warm, cold, improvement }'],
                  ['  "allModelsComparison"','[ ...12 methods with type/isBest flags ]'],
                  ['  "ablationStudy"',      '[ ...6 variants with deltaAuc and impact level ]'],
                  ['  "hyperparameterTuning"','[ ...4 tuning strategies ]'],
                  ['  "efficiencyMetrics"',  '[ ...6 methods with trainTime/inferTime/params ]'],
                  ['  "evaluationProtocol"', '{ split, coldUserCutoff, metrics, significance }'],
                  ['  "paperReference"',     '{ title, arxiv, authors, affiliation, year }'],
                ].map(([key, val], i) => (
                  <div key={i}>
                    <span className="text-blue-400">{key}</span>
                    <span className="text-slate-500">: </span>
                    <span className="text-emerald-400">{val}</span>
                    <span className="text-slate-500">{i < 10 ? "," : ""}</span>
                  </div>
                ))}
                <div className="text-slate-500">{"}"}</div>
              </div>
              <Button onClick={exportJSON} disabled={!!exporting} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {exporting === "json" ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Download className="size-4 mr-2" />}
                {exporting === "json" ? "Generating JSON…" : `Download JSON Package`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CSV Tab ── */}
        <TabsContent value="csv">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileSpreadsheet className="size-4 text-orange-400" /> Multi-Section CSV Export
                <Badge className="bg-orange-500/15 text-orange-400 border-0 text-[10px]">6 Sections</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Spreadsheet-ready CSV with 6 clearly labelled sections — all models, all scenarios, ablation,
                tuning, and efficiency. Open in Excel, Google Sheets, or pandas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { n: "§1", title: "Selected Model",      desc: "Overall + Warm + Cold rows" },
                  { n: "§2", title: "All Models",           desc: `All ${getAllModelsResults().length} methods, Overall AUC/UAUC/NDCG` },
                  { n: "§3", title: "Warm/Cold Breakdown",  desc: "3 scenarios + improvement row" },
                  { n: "§4", title: "Ablation Study",       desc: `${ablationResults.length} variants + ΔStat + impact` },
                  { n: "§5", title: "Hyperparameter Tuning", desc: `${tuningResults.length} strategies + description` },
                  { n: "§6", title: "Efficiency Metrics",   desc: "Train time, infer time, params, memory" },
                ].map(s => (
                  <div key={s.n} className="flex items-start gap-2 bg-slate-900/60 rounded-lg p-2.5 border border-border/30">
                    <span className="text-orange-400 font-mono font-bold text-xs mt-0.5">{s.n}</span>
                    <div>
                      <div className="text-xs font-medium text-foreground">{s.title}</div>
                      <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={exportCSV} disabled={!!exporting} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                {exporting === "csv" ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Download className="size-4 mr-2" />}
                {exporting === "csv" ? "Generating CSV…" : `Download CSV (6 sections)`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Email Tab ── */}
        <TabsContent value="email">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="size-4 text-purple-400" /> Email Report Delivery
              </CardTitle>
              <CardDescription className="text-xs">
                Send a formatted HTML report via Gmail SMTP. Requires EMAIL_USER + EMAIL_PASS in Vercel environment variables.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Recipient Email</Label>
                <Input
                  type="email" placeholder="researcher@university.edu"
                  value={emailTo} onChange={e => setEmailTo(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Section toggles */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Include in email</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "metrics",   label: "Key Metrics Table" },
                    { key: "warmCold",  label: "Warm/Cold Analysis" },
                    { key: "allModels", label: "Model Comparison" },
                    { key: "ablation",  label: "Ablation Study (coming)" },
                  ].map(sec => (
                    <div key={sec.key} className="flex items-center gap-2 bg-slate-900/40 rounded-lg px-3 py-2 border border-border/30">
                      <Checkbox
                        id={sec.key}
                        checked={emailSections[sec.key as keyof typeof emailSections]}
                        onCheckedChange={v => setEmailSections(p => ({ ...p, [sec.key]: !!v }))}
                        disabled={sec.key === "ablation"}
                      />
                      <label htmlFor={sec.key} className="text-xs text-muted-foreground cursor-pointer">{sec.label}</label>
                    </div>
                  ))}
                </div>
              </div>



              <Button onClick={sendEmail} disabled={emailing || !emailTo} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                {emailing ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
                {emailing ? "Sending via Gmail SMTP…" : "Send Report Email"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export History */}
      {history.length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" /> Export History (this session)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <AnimatePresence>
                {history.map((h, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 text-xs py-1.5 px-3 rounded-lg bg-slate-900/40 border border-border/20">
                    <span className="text-muted-foreground">{formatIcons[h.format] ?? <FileCheck className="size-3.5" />}</span>
                    <span className="font-mono text-foreground flex-1 truncate">{h.filename}</span>
                    {h.pages && <span className="text-muted-foreground shrink-0">{h.pages}pp</span>}
                    <span className="text-muted-foreground shrink-0">{h.ts}</span>
                    <span className="text-emerald-400 shrink-0">{h.status}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
