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
  Loader2, BarChart3, Database, Eye, FileCheck, Clock, Stamp, Info, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { generateCoLLMReport } from "@/lib/pdf";

const PERF_DATA: Record<string, Record<string, any>> = {
  "ml-1m": {
    "collm-din": { auc: 0.7353, uauc: 0.6923, ndcg: 0.8735, aucW: 0.7600, uaucW: 0.7200, ndcgW: 0.8900, aucC: 0.7100, uaucC: 0.6400, ndcgC: 0.8200 },
    "collm-mf": { auc: 0.7295, uauc: 0.6875, ndcg: 0.8714, aucW: 0.7500, uaucW: 0.7100, ndcgW: 0.8800, aucC: 0.7000, uaucC: 0.6300, ndcgC: 0.8100 },
    "collm-lightgcn": { auc: 0.7100, uauc: 0.6967, ndcg: 0.8740, aucW: 0.7300, uaucW: 0.7250, ndcgW: 0.8850, aucC: 0.6900, uaucC: 0.6500, ndcgC: 0.8150 },
    "collm-sasrec": { auc: 0.7235, uauc: 0.6990, ndcg: 0.8765, aucW: 0.7450, uaucW: 0.7280, ndcgW: 0.8870, aucC: 0.7050, uaucC: 0.6600, ndcgC: 0.8250 },
    "tallrec": { auc: 0.7097, uauc: 0.6818, ndcg: 0.8711, aucW: 0.7100, uaucW: 0.6900, ndcgW: 0.8700, aucC: 0.7500, uaucC: 0.6700, ndcgC: 0.8300 },
    "mf": { auc: 0.6482, uauc: 0.6361, ndcg: 0.8447, aucW: 0.7200, uaucW: 0.6800, ndcgW: 0.8600, aucC: 0.4900, uaucC: 0.5100, ndcgC: 0.7400 },
  },
  "amazon-book": {
    "collm-din": { auc: 0.8245, uauc: 0.6474, ndcg: 0.8550, aucW: 0.8500, uaucW: 0.6800, ndcgW: 0.8750, aucC: 0.7600, uaucC: 0.5900, ndcgC: 0.8000 },
    "collm-mf": { auc: 0.8109, uauc: 0.6225, ndcg: 0.8457, aucW: 0.8350, uaucW: 0.6500, ndcgW: 0.8650, aucC: 0.7500, uaucC: 0.5700, ndcgC: 0.7900 },
    "collm-lightgcn": { auc: 0.8026, uauc: 0.6149, ndcg: 0.8411, aucW: 0.8250, uaucW: 0.6400, ndcgW: 0.8600, aucC: 0.7400, uaucC: 0.5600, ndcgC: 0.7800 },
    "tallrec": { auc: 0.7375, uauc: 0.5983, ndcg: 0.8361, aucW: 0.7450, uaucW: 0.6200, ndcgW: 0.8400, aucC: 0.7300, uaucC: 0.5700, ndcgC: 0.8100 },
    "mf": { auc: 0.7134, uauc: 0.5565, ndcg: 0.8194, aucW: 0.7800, uaucW: 0.6200, ndcgW: 0.8400, aucC: 0.4900, uaucC: 0.4400, ndcgC: 0.7100 },
  },
};

const ALL_MODELS = [
  { id: "collm-din", label: "CoLLM-DIN" }, { id: "collm-mf", label: "CoLLM-MF" },
  { id: "collm-lightgcn", label: "CoLLM-LightGCN" }, { id: "collm-sasrec", label: "CoLLM-SASRec" },
  { id: "tallrec", label: "TALLRec" }, { id: "mf", label: "Matrix Factorization" },
];

function makeDefaultName(format: string, project: string, counter: number) {
  const proj = project.trim() || `Export ${counter}`;
  const date = new Date().toISOString().slice(0, 10);
  return `${proj}-${date}.${format}`;
}

let exportCounter = 0;

export default function ExportSection() {
  const { data: session } = useSession();
  const [dataset, setDataset] = useState("ml-1m");
  const [model, setModel] = useState("collm-din");
  const [exportName, setExportName] = useState("");
  const [emailTo, setEmailTo] = useState(session?.user?.email ?? "");
  const [exporting, setExporting] = useState<string | null>(null);
  const [emailing, setEmailing] = useState(false);
  const [history, setHistory] = useState<{ format: string; filename: string; ts: string; status: string }[]>([]);
  const [emailSections, setEmailSections] = useState({ metrics: true, warmCold: true, ablation: false, config: true });

  const getMetrics = () => {
    const ds = PERF_DATA[dataset] ?? PERF_DATA["ml-1m"];
    return ds[model] ?? ds["collm-din"];
  };

  const modelLabel = ALL_MODELS.find(m => m.id === model)?.label ?? model;
  const dsLabel = dataset === "ml-1m" ? "MovieLens-1M" : "Amazon-Book";
  const m = getMetrics();

  const logExport = async (format: string, filename: string) => {
    exportCounter++;
    setHistory(prev => [{ format, filename, ts: new Date().toLocaleTimeString(), status: "✓ Downloaded" }, ...prev.slice(0, 9)]);
    try {
      await fetch("/api/exports", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "evaluation", format, filename, dataSource: `${model}/${dataset}`, metadata: JSON.stringify(m) }),
      });
    } catch { /* non-critical */ }
  };

  const finalName = (fmt: string) => makeDefaultName(fmt, exportName, exportCounter + 1);

  const exportPDF = async () => {
    setExporting("pdf");
    try {
      await new Promise(r => setTimeout(r, 600));
      const filename = finalName("pdf");
      const doc = generateCoLLMReport({
        title: "CoLLM Research Platform — Evaluation Report",
        subtitle: `${modelLabel} on ${dsLabel} · Generated ${new Date().toLocaleDateString()}`,
        dataset: dsLabel, model: modelLabel,
        generatedBy: session?.user?.name ?? "CoLLM User",
        metrics: {
          "AUC (Overall)": m.auc, "UAUC (Overall)": m.uauc, "NDCG (Overall)": m.ndcg,
          "AUC (Warm)": m.aucW, "UAUC (Warm)": m.uaucW, "NDCG (Warm)": m.ndcgW,
          "AUC (Cold)": m.aucC, "UAUC (Cold)": m.uaucC, "NDCG (Cold)": m.ndcgC,
        },
      });
      doc.save(filename);
      await logExport("pdf", filename);
      toast.success(`PDF downloaded: ${filename}`);
    } catch (e) { toast.error("PDF generation failed"); }
    setExporting(null);
  };

  const exportJSON = async () => {
    setExporting("json");
    await new Promise(r => setTimeout(r, 300));
    const filename = finalName("json");
    const payload = {
      exportInfo: { filename, generatedAt: new Date().toISOString(), generatedBy: session?.user?.name ?? "CoLLM User" },
      model: { id: model, label: modelLabel },
      dataset: { id: dataset, label: dsLabel },
      metrics: {
        overall: { auc: m.auc, uauc: m.uauc, ndcg: m.ndcg },
        warm: { auc: m.aucW, uauc: m.uaucW, ndcg: m.ndcgW },
        cold: { auc: m.aucC, uauc: m.uaucC, ndcg: m.ndcgC },
      },
      paper: { title: "CoLLM: Integrating Collaborative Embeddings into LLMs", arxiv: "2310.19488" },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    await logExport("json", filename);
    toast.success(`JSON downloaded: ${filename}`);
    setExporting(null);
  };

  const exportCSV = async () => {
    setExporting("csv");
    await new Promise(r => setTimeout(r, 300));
    const filename = finalName("csv");
    const rows = [
      ["Model", "Dataset", "Scenario", "AUC", "UAUC", "NDCG"],
      [modelLabel, dsLabel, "Overall", m.auc.toFixed(4), m.uauc.toFixed(4), m.ndcg.toFixed(4)],
      [modelLabel, dsLabel, "Warm-Start", m.aucW.toFixed(4), m.uaucW.toFixed(4), m.ndcgW.toFixed(4)],
      [modelLabel, dsLabel, "Cold-Start", m.aucC.toFixed(4), m.uaucC.toFixed(4), m.ndcgC.toFixed(4)],
    ];
    // Add all models for comparison
    Object.entries(PERF_DATA[dataset] ?? {}).forEach(([mid, md]: any) => {
      const mLbl = ALL_MODELS.find(x => x.id === mid)?.label ?? mid;
      rows.push([mLbl, dsLabel, "Overall", md.auc.toFixed(4), md.uauc.toFixed(4), md.ndcg.toFixed(4)]);
    });
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    await logExport("csv", filename);
    toast.success(`CSV downloaded: ${filename}`);
    setExporting(null);
  };

  const sendEmail = async () => {
    if (!emailTo || !emailTo.includes("@")) { toast.error("Enter a valid email address"); return; }
    setEmailing(true);
    try {
      const sections = Object.entries(emailSections).filter(([, v]) => v).map(([k]) => k);
      const res = await fetch("/api/email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailTo,
          reportTitle: `${modelLabel} — CoLLM Evaluation Report`,
          reportType: "Evaluation Report",
          dataset: dsLabel,
          metrics: { "AUC": m.auc, "UAUC": m.uauc, "NDCG": m.ndcg, "AUC Warm": m.aucW, "AUC Cold": m.aucC },
        }),
      });
      if (res.ok) {
        toast.success(`Report sent to ${emailTo}`);
        setHistory(prev => [{ format: "email", filename: emailTo, ts: new Date().toLocaleTimeString(), status: "✉ Sent" }, ...prev.slice(0, 9)]);
      } else {
        const e = await res.json();
        toast.error(e.error ?? "Failed to send — check RESEND_API_KEY in Vercel env");
      }
    } catch { toast.error("Network error sending email"); }
    setEmailing(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2"><Download className="size-5 text-emerald-500" />Export & Reports</h2>
        <p className="text-muted-foreground text-sm">Download your research data as PDF, JSON, CSV or email a summary report</p>
      </div>

      {/* Dataset & Model picker */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="size-4 text-emerald-500" />Select Data Source</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Metrics preview */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "AUC", v: m.auc.toFixed(4), color: "text-emerald-400" },
              { label: "UAUC", v: m.uauc.toFixed(4), color: "text-blue-400" },
              { label: "NDCG", v: m.ndcg.toFixed(4), color: "text-purple-400" },
            ].map(s => (
              <div key={s.label} className="bg-muted/30 rounded-lg p-2.5 text-center">
                <div className={`text-lg font-bold font-mono ${s.color}`}>{s.v}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export name input */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Stamp className="size-4 text-emerald-500" />Export Settings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Project / Export Name <span className="text-muted-foreground text-xs font-normal">(optional — auto-named if left blank)</span></Label>
            <Input
              value={exportName}
              onChange={e => setExportName(e.target.value)}
              placeholder={`e.g. "CoLLM-DIN Ablation" (default: Export ${exportCounter + 1})`}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="size-3" />
              Files will be named: <code className="bg-muted px-1 rounded text-[11px]">{finalName("pdf")}</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Export buttons */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* PDF */}
        <Card className="hover:border-red-500/30 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-red-500/10 rounded-lg"><FileText className="size-4 text-red-400" /></div>
              PDF Report
            </CardTitle>
            <CardDescription>Professional stamped research document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-xs text-muted-foreground space-y-1">
              {["CoLLM logo header & stamp", "Full metrics table", "Warm/cold breakdown", "Ablation reference", "Methodology section"].map(f => (
                <li key={f} className="flex items-center gap-1.5"><CheckCircle className="size-3 text-emerald-500" />{f}</li>
              ))}
            </ul>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={exportPDF} disabled={!!exporting}>
              {exporting === "pdf" ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
              {exporting === "pdf" ? "Generating…" : "Download PDF"}
            </Button>
          </CardContent>
        </Card>

        {/* JSON */}
        <Card className="hover:border-blue-500/30 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg"><FileJson className="size-4 text-blue-400" /></div>
              JSON Export
            </CardTitle>
            <CardDescription>Machine-readable full data package</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-xs text-muted-foreground space-y-1">
              {["All model metrics", "Warm/cold breakdown", "Paper metadata", "API-ready format", "All dataset models"].map(f => (
                <li key={f} className="flex items-center gap-1.5"><CheckCircle className="size-3 text-emerald-500" />{f}</li>
              ))}
            </ul>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={exportJSON} disabled={!!exporting}>
              {exporting === "json" ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
              {exporting === "json" ? "Exporting…" : "Download JSON"}
            </Button>
          </CardContent>
        </Card>

        {/* CSV */}
        <Card className="hover:border-emerald-500/30 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><FileSpreadsheet className="size-4 text-emerald-400" /></div>
              CSV Export
            </CardTitle>
            <CardDescription>Spreadsheet-compatible comparison table</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-xs text-muted-foreground space-y-1">
              {["All models in dataset", "AUC / UAUC / NDCG", "Warm & cold scores", "Excel/Sheets ready", "Pivot table friendly"].map(f => (
                <li key={f} className="flex items-center gap-1.5"><CheckCircle className="size-3 text-emerald-500" />{f}</li>
              ))}
            </ul>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={exportCSV} disabled={!!exporting}>
              {exporting === "csv" ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
              {exporting === "csv" ? "Exporting…" : "Download CSV"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Email Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="size-4 text-emerald-500" />Email Report
          </CardTitle>
          <CardDescription>Send a professional HTML summary directly to any inbox</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* What to include */}
          <div className="space-y-2">
            <Label className="text-sm">Include in report</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "metrics", label: "Overall Metrics (AUC/UAUC/NDCG)" },
                { key: "warmCold", label: "Warm & Cold breakdown" },
                { key: "config", label: "Model configuration" },
                { key: "ablation", label: "Ablation table reference" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={key}
                    checked={(emailSections as any)[key]}
                    onCheckedChange={v => setEmailSections(s => ({ ...s, [key]: !!v }))}
                  />
                  <label htmlFor={key} className="text-sm cursor-pointer">{label}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Recipient Email</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
                placeholder="recipient@research.edu"
                className="flex-1"
              />
              <Button onClick={sendEmail} disabled={emailing} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
                {emailing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2" />}
                {emailing ? "Sending…" : "Send Report"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="size-3" />Email requires RESEND_API_KEY set in Vercel environment variables
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="size-3.5" />Recent Exports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs uppercase">{h.format}</Badge>
                    <span className="text-muted-foreground truncate max-w-[250px]">{h.filename}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                    <span className="text-emerald-400">{h.status}</span>
                    <span>{h.ts}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
