"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, FileJson, FileSpreadsheet, Mail, Send, CheckCircle, Loader2, Stamp, BarChart3, Database, Eye } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { generateCoLLMReport } from "@/lib/pdf";

const PERFORMANCE_DATA = {
  "ml-1m": {
    "collm-din":      { auc: 0.7353, uauc: 0.6923, ndcg: 0.8735, aucW: 0.7600, aucC: 0.7600 },
    "collm-mf":       { auc: 0.7295, uauc: 0.6875, ndcg: 0.8714, aucW: 0.7500, aucC: 0.7400 },
    "collm-lightgcn": { auc: 0.7100, uauc: 0.6967, ndcg: 0.8740, aucW: 0.7300, aucC: 0.7200 },
    "collm-sasrec":   { auc: 0.7235, uauc: 0.6990, ndcg: 0.8765, aucW: 0.7450, aucC: 0.7350 },
    "tallrec":        { auc: 0.7097, uauc: 0.6818, ndcg: 0.8711, aucW: 0.7100, aucC: 0.7500 },
    "mf":             { auc: 0.6482, uauc: 0.6361, ndcg: 0.8447, aucW: 0.7200, aucC: 0.5100 },
  },
  "amazon-book": {
    "collm-din":      { auc: 0.8245, uauc: 0.6474, ndcg: 0.8550, aucW: 0.8500, aucC: 0.7600 },
    "collm-mf":       { auc: 0.8109, uauc: 0.6225, ndcg: 0.8457, aucW: 0.8350, aucC: 0.7500 },
    "collm-lightgcn": { auc: 0.8026, uauc: 0.6149, ndcg: 0.8411, aucW: 0.8250, aucC: 0.7400 },
    "tallrec":        { auc: 0.7375, uauc: 0.5983, ndcg: 0.8361, aucW: 0.7450, aucC: 0.7380 },
    "mf":             { auc: 0.7134, uauc: 0.5565, ndcg: 0.8194, aucW: 0.7800, aucC: 0.5100 },
  },
};

const ALL_MODELS = [
  { id: "collm-din", label: "CoLLM-DIN" },
  { id: "collm-mf", label: "CoLLM-MF" },
  { id: "collm-lightgcn", label: "CoLLM-LightGCN" },
  { id: "collm-sasrec", label: "CoLLM-SASRec" },
  { id: "tallrec", label: "TALLRec" },
  { id: "mf", label: "Matrix Factorization" },
];

type ExportFmt = "pdf" | "json" | "csv";

export default function ExportSection() {
  const { data: session } = useSession();
  const [dataset, setDataset] = useState("ml-1m");
  const [model, setModel] = useState("collm-din");
  const [emailTo, setEmailTo] = useState(session?.user?.email ?? "");
  const [exporting, setExporting] = useState<ExportFmt | null>(null);
  const [emailing, setEmailing] = useState(false);
  const [history, setHistory] = useState<{ format: string; filename: string; ts: string }[]>([]);

  const getMetrics = () => {
    const ds = PERFORMANCE_DATA[dataset as keyof typeof PERFORMANCE_DATA] ?? PERFORMANCE_DATA["ml-1m"];
    return ds[model as keyof typeof ds] ?? ds["collm-din"];
  };

  const logExport = async (format: string, filename: string) => {
    const m = getMetrics();
    await fetch("/api/exports", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "evaluation", format, filename, dataSource: `${model}/${dataset}`, metadata: JSON.stringify(m) }),
    });
    setHistory(prev => [{ format, filename, ts: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);
  };

  const exportPDF = async () => {
    setExporting("pdf");
    try {
      await new Promise(r => setTimeout(r, 600));
      const m = getMetrics();
      const modelLabel = ALL_MODELS.find(x => x.id === model)?.label ?? model;
      const dsLabel = dataset === "ml-1m" ? "MovieLens-1M" : "Amazon-Book";
      const now = new Date().toISOString();

      const doc = generateCoLLMReport({
        title: `CoLLM Evaluation Report`,
        subtitle: `${modelLabel} on ${dsLabel} · Generated ${new Date().toLocaleDateString()}`,
        dataset: dsLabel, model: modelLabel,
        generatedBy: session?.user?.name ?? "CoLLM User",
        generatedAt: new Date().toLocaleString(),
        sections: [
          {
            heading: "Executive Summary",
            description: `This report presents the evaluation results of ${modelLabel} on the ${dsLabel} dataset. CoLLM integrates collaborative embeddings into Large Language Models for enhanced recommendation performance across both warm-start and cold-start scenarios.`,
          },
          {
            heading: "Overall Performance Metrics",
            keyValues: {
              "AUC (Overall)": m.auc.toFixed(4),
              "UAUC (Overall)": m.uauc.toFixed(4),
              "NDCG (Overall)": m.ndcg.toFixed(4),
              "AUC (Warm)": m.aucW.toFixed(4),
              "AUC (Cold)": m.aucC.toFixed(4),
              "Dataset": dsLabel,
              "Model": modelLabel,
              "LLM Backbone": "Vicuna-7B",
            },
          },
          {
            heading: "Full Model Comparison",
            table: {
              headers: ["Model", "AUC", "UAUC", "NDCG", "Warm AUC", "Cold AUC", "vs Baseline"],
              rows: Object.entries(PERFORMANCE_DATA[dataset as keyof typeof PERFORMANCE_DATA] ?? {}).map(([mid, mt]: any) => {
                const base = (PERFORMANCE_DATA[dataset as keyof typeof PERFORMANCE_DATA] as any)["mf"] ?? mt;
                const relImp = (((mt.auc + mt.uauc) / 2 - (base.auc + base.uauc) / 2) / ((base.auc + base.uauc) / 2) * 100).toFixed(1);
                return [ALL_MODELS.find(x => x.id === mid)?.label ?? mid, mt.auc.toFixed(4), mt.uauc.toFixed(4), mt.ndcg.toFixed(4), mt.aucW.toFixed(4), mt.aucC.toFixed(4), `+${relImp}%`];
              }),
            },
          },
          {
            heading: "Ablation Study",
            description: "The CIE module is critical to CoLLM's performance. Removing it (w/o CIE) reverts to TALLRec behavior. Directly adding UI tokens (w/ UI-token) performs worse due to tokenization redundancy.",
            table: {
              headers: ["Variant", "ML-1M AUC", "ML-1M UAUC", "Book AUC", "Book UAUC"],
              rows: [
                ["CoLLM-MF (Best)", "0.7295", "0.6875", "0.8133", "0.6314"],
                ["w/o CIE (=TALLRec)", "0.7097", "0.6818", "0.7375", "0.5983"],
                ["w/ UI-token", "0.7214", "0.6563", "0.7273", "0.5956"],
              ],
            },
          },
          {
            heading: "Training Efficiency",
            description: "CoLLM adds only ~13–18% training overhead and ~12.5% inference overhead over TALLRec, demonstrating practical efficiency for production deployment.",
            table: {
              headers: ["Method", "ML-1M Train", "Book Train", "ML-1M Infer", "Book Infer"],
              rows: [
                ["TALLRec", "32 min", "354 min", "72 s", "360 s"],
                ["CoLLM-MF", "36 min (+13%)", "418 min (+18%)", "82 s (+14%)", "398 s (+11%)"],
              ],
            },
          },
          {
            heading: "Methodology",
            description: "CoLLM employs a three-component architecture: (1) Prompt Construction with user/item ID fields as collaborative placeholders, (2) Hybrid Encoding via the CIE module (Conventional Collaborative Model + MLP Mapping Layer), and (3) LLM Prediction enhanced by LoRA fine-tuning. The two-step training procedure first tunes LoRA for cold-start capability, then tunes CIE for collaborative information integration.",
          },
        ],
      });

      const fname = `CoLLM_Report_${model}_${dataset}_${Date.now()}.pdf`;
      doc.save(fname);
      await logExport("pdf", fname);
      toast.success("PDF report downloaded!");
    } catch (e) {
      toast.error("PDF generation failed");
    }
    setExporting(null);
  };

  const exportJSON = async () => {
    setExporting("json");
    await new Promise(r => setTimeout(r, 300));
    const m = getMetrics();
    const payload = {
      meta: { model, dataset, generatedAt: new Date().toISOString(), generator: "CoLLM Platform v1.0" },
      performance: { overall: m, scenarios: { warm: { auc: m.aucW }, cold: { auc: m.aucC } } },
      allModels: PERFORMANCE_DATA[dataset as keyof typeof PERFORMANCE_DATA],
      methodology: { llmBackbone: "vicuna-7b", loraConfig: { r: 8, alpha: 16, dropout: 0.05 }, trainingSteps: ["step0_collab_pretrain", "step1_lora_tuning", "step2_cie_tuning"] },
      paper: { title: "CoLLM: Integrating Collaborative Embeddings into Large Language Models for Recommendation", arxiv: "2310.19488v3", github: "https://github.com/zyang1580/CoLLM" },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const fname = `CoLLM_${model}_${dataset}_${Date.now()}.json`;
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fname; a.click();
    await logExport("json", fname);
    toast.success("JSON exported!");
    setExporting(null);
  };

  const exportCSV = async () => {
    setExporting("csv");
    await new Promise(r => setTimeout(r, 300));
    const dsData = PERFORMANCE_DATA[dataset as keyof typeof PERFORMANCE_DATA] ?? {};
    const rows = [
      ["Model", "AUC", "UAUC", "NDCG", "Warm AUC", "Cold AUC", "Dataset"],
      ...Object.entries(dsData).map(([mid, mt]: any) => [
        ALL_MODELS.find(x => x.id === mid)?.label ?? mid, mt.auc, mt.uauc, mt.ndcg, mt.aucW, mt.aucC, dataset,
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const fname = `CoLLM_Results_${dataset}_${Date.now()}.csv`;
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fname; a.click();
    await logExport("csv", fname);
    toast.success("CSV exported!");
    setExporting(null);
  };

  const sendEmail = async () => {
    if (!emailTo) { toast.error("Enter an email address"); return; }
    setEmailing(true);
    const m = getMetrics();
    const res = await fetch("/api/email", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: emailTo,
        reportTitle: `CoLLM Evaluation — ${ALL_MODELS.find(x => x.id === model)?.label}`,
        reportType: "Evaluation Report",
        dataset: dataset === "ml-1m" ? "MovieLens-1M" : "Amazon-Book",
        metrics: { "AUC (Overall)": m.auc, "UAUC (Overall)": m.uauc, "NDCG (Overall)": m.ndcg, "AUC (Warm)": m.aucW, "AUC (Cold)": m.aucC },
      }),
    });
    setEmailing(false);
    if (res.ok) toast.success(`Report emailed to ${emailTo}!`);
    else toast.error("Email failed — check RESEND_API_KEY in .env");
  };

  const m = getMetrics();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-bold">Export & Reports</h2>
        <p className="text-muted-foreground text-sm">Generate professional PDF reports, JSON/CSV data exports, and send via email</p>
      </div>

      {/* Config */}
      <Card className="border-emerald-500/20">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="size-4 text-emerald-500" />Report Configuration</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>Dataset</Label>
            <Select value={dataset} onValueChange={setDataset}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ml-1m">MovieLens-1M</SelectItem>
                <SelectItem value="amazon-book">Amazon-Book</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ALL_MODELS.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2 grid grid-cols-3 gap-2">
            {[
              { label: "AUC", value: m.auc.toFixed(4), color: "text-emerald-400" },
              { label: "UAUC", value: m.uauc.toFixed(4), color: "text-blue-400" },
              { label: "NDCG", value: m.ndcg.toFixed(4), color: "text-purple-400" },
            ].map(stat => (
              <div key={stat.label} className="bg-secondary/50 rounded-lg p-3 text-center">
                <div className={`font-bold text-sm ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export buttons */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* PDF */}
        <Card className="border-border hover:border-red-500/30 transition-colors group">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                <FileText className="size-5 text-red-400" />
              </div>
              <div>
                <div className="font-semibold text-sm">PDF Report</div>
                <div className="text-xs text-muted-foreground">Professional stamped document</div>
              </div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 mb-4">
              {["CoLLM logo header + stamp", "Full metrics table", "Ablation study", "Methodology section", "Training efficiency data"].map(f => (
                <li key={f} className="flex items-center gap-1.5"><CheckCircle className="size-3 text-emerald-500 flex-shrink-0" />{f}</li>
              ))}
            </ul>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={exportPDF} disabled={exporting === "pdf"}>
              {exporting === "pdf" ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
              {exporting === "pdf" ? "Generating…" : "Download PDF"}
            </Button>
          </CardContent>
        </Card>

        {/* JSON */}
        <Card className="border-border hover:border-blue-500/30 transition-colors group">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <FileJson className="size-5 text-blue-400" />
              </div>
              <div>
                <div className="font-semibold text-sm">JSON Export</div>
                <div className="text-xs text-muted-foreground">Machine-readable full data</div>
              </div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 mb-4">
              {["All model metrics", "Warm/cold breakdown", "Training config", "Paper metadata", "API-ready format"].map(f => (
                <li key={f} className="flex items-center gap-1.5"><CheckCircle className="size-3 text-emerald-500 flex-shrink-0" />{f}</li>
              ))}
            </ul>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={exportJSON} disabled={exporting === "json"}>
              {exporting === "json" ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
              {exporting === "json" ? "Exporting…" : "Download JSON"}
            </Button>
          </CardContent>
        </Card>

        {/* CSV */}
        <Card className="border-border hover:border-emerald-500/30 transition-colors group">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <FileSpreadsheet className="size-5 text-emerald-400" />
              </div>
              <div>
                <div className="font-semibold text-sm">CSV Export</div>
                <div className="text-xs text-muted-foreground">Spreadsheet-compatible table</div>
              </div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 mb-4">
              {["All models in dataset", "AUC / UAUC / NDCG", "Warm & cold scores", "Excel/Sheets ready", "Pivot table friendly"].map(f => (
                <li key={f} className="flex items-center gap-1.5"><CheckCircle className="size-3 text-emerald-500 flex-shrink-0" />{f}</li>
              ))}
            </ul>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={exportCSV} disabled={exporting === "csv"}>
              {exporting === "csv" ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
              {exporting === "csv" ? "Exporting…" : "Download CSV"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Email section */}
      <Card className="border-amber-500/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="size-4 text-amber-400" />
            Email Report
            <Badge variant="outline" className="text-amber-400 border-amber-500/40 text-[10px]">Resend API</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Send a professional HTML email report with metric summary directly to any inbox. Requires <code className="bg-secondary px-1 rounded text-xs">RESEND_API_KEY</code> in your environment.</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input type="email" placeholder="recipient@research.edu" value={emailTo} onChange={e => setEmailTo(e.target.value)} />
            </div>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white shrink-0" onClick={sendEmail} disabled={emailing}>
              {emailing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2" />}
              {emailing ? "Sending…" : "Send Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export history */}
      {history.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Export History (this session)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-3 text-sm py-1 border-b border-border/50 last:border-0">
                  <Badge variant="outline" className="text-[10px] uppercase w-10 justify-center">{h.format}</Badge>
                  <span className="flex-1 truncate font-mono text-xs text-muted-foreground">{h.filename}</span>
                  <span className="text-xs text-muted-foreground">{h.ts}</span>
                  <CheckCircle className="size-3.5 text-emerald-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
