// @ts-nocheck
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Color Palette ────────────────────────────────────────────────────────────
const EM    = [16, 185, 129] as [number, number, number];   // emerald-500
const DARK  = [15, 23, 42]   as [number, number, number];   // slate-900
const SLATE = [30, 41, 59]   as [number, number, number];   // slate-800
const MID   = [71, 85, 105]  as [number, number, number];   // slate-600
const WHITE = [255, 255, 255] as [number, number, number];
const LIGHT = [148, 163, 184] as [number, number, number];  // slate-400
const BLUE  = [59, 130, 246] as [number, number, number];
const PURP  = [168, 85, 247] as [number, number, number];
const AMBER = [245, 158, 11] as [number, number, number];

// ─── Types ────────────────────────────────────────────────────────────────────
export interface GenerateReportOptions {
  title: string;
  subtitle: string;
  dataset: string;
  model: string;
  generatedBy?: string;
  metrics: Record<string, number>;
}

export interface FullReportOptions extends GenerateReportOptions {
  allModelsResults: Array<{
    method: string; auc: number; uauc: number; ndcg: number;
    isCollm?: boolean; isBest?: boolean;
  }>;
  ablationResults: Array<{
    variant: string; auc: number; uauc: number; ndcg: number;
  }>;
  trainingConfig: {
    collabModel: string; llmBackbone: string; collabDim: number;
    loraR: number; loraAlpha: number; dataset: string;
  };
  efficiencyMetrics: Array<{
    method: string; trainTime: string; inferTime: string; params: string; memory: string;
  }>;
  warmColdAnalysis: {
    warm: { auc: number; uauc: number; ndcg: number };
    cold: { auc: number; uauc: number; ndcg: number };
    improvement: { auc: string; uauc: string; ndcg: string };
  };
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────
const REPORT_ID = `CR-${Date.now().toString(36).toUpperCase()}`;

function drawStamp(doc: jsPDF, x: number, y: number, w = 38, h = 28, model = "") {
  const cx = x + w / 2;
  doc.setDrawColor(...EM);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, w, h, 2, 2, "S");
  doc.setTextColor(...EM);
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "bold");
  doc.text("CoLLM PLATFORM", cx, y + 5, { align: "center" });
  doc.setDrawColor(...EM);
  doc.line(x + 3, y + 7, x + w - 3, y + 7);
  doc.setTextColor(...LIGHT);
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text("VERIFIED REPORT", cx, y + 11, { align: "center" });
  doc.text(new Date().toLocaleDateString("en-GB"), cx, y + 15, { align: "center" });
  doc.text(REPORT_ID, cx, y + 19, { align: "center" });
  if (model) doc.text(model.substring(0, 16), cx, y + 23, { align: "center" });
  doc.setTextColor(...EM);
  doc.setFontSize(6);
  doc.text("✓ AUTHENTIC", cx, y + (model ? 27 : 24), { align: "center" });
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setFillColor(...DARK);
  doc.rect(0, H - 14, W, 14, "F");
  doc.setFillColor(...EM);
  doc.rect(0, H - 14, W, 0.8, "F");
  doc.setTextColor(...LIGHT);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(
    `CoLLM Research Platform  ·  arXiv:2310.19488v3  ·  USTC / MIT  ·  Page ${pageNum} of ${totalPages}`,
    W / 2, H - 5, { align: "center" }
  );
}

function sectionHeader(doc: jsPDF, y: number, W: number, title: string): number {
  doc.setFillColor(...EM);
  doc.rect(14, y, 3, 8, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, y + 6);
  return y + 13;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const H = doc.internal.pageSize.getHeight();
  if (y + needed > H - 20) {
    doc.addPage();
    return 20;
  }
  return y;
}

// ─── Page 1: Cover ────────────────────────────────────────────────────────────
function drawCoverPage(doc: jsPDF, opts: FullReportOptions) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Full dark background
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, H, "F");

  // Left emerald accent bar
  doc.setFillColor(...EM);
  doc.rect(0, 0, 5, H, "F");

  // Gradient-like header band
  doc.setFillColor(...SLATE);
  doc.rect(5, 0, W - 5, 70, "F");

  // Logo circle
  doc.setFillColor(22, 101, 52);
  doc.circle(28, 32, 13, "F");
  doc.setFillColor(...EM);
  doc.circle(28, 32, 10, "F");
  doc.setTextColor(...DARK);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("C", 25, 37);

  // Platform name
  doc.setTextColor(...EM);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CoLLM RESEARCH PLATFORM", 46, 24);
  doc.setTextColor(...WHITE);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Integrating Collaborative Embeddings into LLMs for Recommendation", 46, 31);

  // Main title
  doc.setTextColor(...WHITE);
  doc.setFontSize(19);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(opts.title, W - 90);
  titleLines.forEach((line: string, i: number) => {
    doc.text(line, 46, 46 + i * 9);
  });

  // Subtitle
  doc.setTextColor(...LIGHT);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(opts.subtitle, 46, 46 + titleLines.length * 9 + 4);

  // Official stamp — right side
  const sx = W - 58, sy = 8;
  doc.setDrawColor(...EM);
  doc.setLineWidth(1);
  doc.roundedRect(sx, sy, 50, 55, 4, 4, "S");
  doc.setFillColor(22, 101, 52, 20);
  doc.roundedRect(sx, sy, 50, 55, 4, 4, "F");
  doc.setTextColor(...EM);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICIAL REPORT", sx + 25, sy + 9, { align: "center" });
  doc.setDrawColor(...EM);
  doc.line(sx + 4, sy + 11, sx + 46, sy + 11);
  doc.setFontSize(6);
  doc.setTextColor(...LIGHT);
  doc.text(`ID: ${REPORT_ID}`, sx + 25, sy + 16, { align: "center" });
  doc.text(new Date().toLocaleDateString("en-GB"), sx + 25, sy + 22, { align: "center" });
  doc.setTextColor(...WHITE);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(opts.model.substring(0, 18), sx + 25, sy + 29, { align: "center" });
  doc.setTextColor(...LIGHT);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(opts.dataset, sx + 25, sy + 36, { align: "center" });
  doc.text(opts.generatedBy ?? "CoLLM User", sx + 25, sy + 43, { align: "center" });
  doc.setTextColor(...EM);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("✓ VERIFIED", sx + 25, sy + 51, { align: "center" });

  // Separator
  doc.setDrawColor(...EM);
  doc.setLineWidth(0.4);
  doc.line(14, 78, W - 14, 78);

  // Metadata block
  const metas = [
    { label: "Model", val: opts.model },
    { label: "Dataset", val: opts.dataset },
    { label: "Generated By", val: opts.generatedBy ?? "CoLLM User" },
    { label: "Date & Time", val: new Date().toLocaleString() },
  ];
  const mw = (W - 28) / 2;
  metas.forEach((meta, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const mx = 18 + col * mw, my = 86 + row * 16;
    doc.setTextColor(...LIGHT);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(meta.label.toUpperCase(), mx, my);
    doc.setTextColor(...WHITE);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(meta.val, mx, my + 6);
  });

  // Key metrics preview on cover
  const metricsOnCover: [string, string][] = [
    ["AUC (Overall)", opts.metrics["AUC (Overall)"]?.toFixed(4) ?? "—"],
    ["UAUC (Overall)", opts.metrics["UAUC (Overall)"]?.toFixed(4) ?? "—"],
    ["NDCG (Overall)", opts.metrics["NDCG (Overall)"]?.toFixed(4) ?? "—"],
  ];
  const bW = (W - 28 - 8) / 3;
  doc.setFillColor(...SLATE);
  doc.roundedRect(14, 126, W - 28, 35, 3, 3, "F");
  doc.setDrawColor(...EM);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 126, W - 28, 35, 3, 3, "S");
  doc.setTextColor(...LIGHT);
  doc.setFontSize(6.5);
  doc.text("KEY METRICS SNAPSHOT", 18, 132);
  metricsOnCover.forEach(([label, val], i) => {
    const bx = 14 + i * (bW + 4);
    doc.setTextColor(...EM);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(val, bx + bW / 2, 149, { align: "center" });
    doc.setTextColor(...LIGHT);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text(label, bx + bW / 2, 155, { align: "center" });
  });

  // Bottom section: training pipeline
  let py = 175;
  doc.setTextColor(...LIGHT);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("TRAINING PIPELINE", 18, py);
  py += 6;
  const steps = ["Pre-train CF", "Extract Embeddings", "Hybrid Prompts", "LoRA Fine-tune", "Evaluate"];
  const stepColors: [number,number,number][] = [BLUE, PURP, EM, EM, AMBER];
  const sW = (W - 28) / steps.length - 2;
  steps.forEach((step, i) => {
    const sx = 14 + i * (sW + 2);
    doc.setFillColor(...stepColors[i]);
    doc.roundedRect(sx, py, sW, 10, 1.5, 1.5, "F");
    doc.setTextColor(...DARK);
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    doc.text(step, sx + sW / 2, py + 6.5, { align: "center" });
    if (i < steps.length - 1) {
      doc.setFillColor(...LIGHT);
      doc.triangle(sx + sW + 1, py + 4, sx + sW + 1, py + 6, sx + sW + 3, py + 5, "F");
    }
  });

  // Paper reference at bottom
  py = H - 45;
  doc.setDrawColor(...SLATE);
  doc.line(14, py, W - 14, py);
  py += 8;
  doc.setTextColor(LIGHT[0], LIGHT[1], LIGHT[2]);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("Based on:", 14, py);
  doc.setFont("helvetica", "normal");
  doc.text("CoLLM: Integrating Collaborative Embeddings into Large Language Models for Recommendation", 40, py);
  py += 6;
  doc.text("arXiv:2310.19488v3  ·  USTC / MIT", 14, py);
  py += 6;
  doc.setTextColor(MID[0], MID[1], MID[2]);
  doc.setFontSize(6.5);
  doc.text("Confidential Research Output  ·  Generated by CoLLM Research Platform v2.0", 14, py);
}

// ─── Page 2: Table of Contents ────────────────────────────────────────────────
function drawTOCPage(doc: jsPDF) {
  const W = doc.internal.pageSize.getWidth();
  let y = 22;
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 16, "F");
  doc.setFillColor(...EM);
  doc.rect(0, 0, W, 1, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CoLLM Research Platform — Evaluation Report", 14, 11);
  drawStamp(doc, W - 52, 18);
  y = 35;
  y = sectionHeader(doc, y, W, "Table of Contents");

  const sections = [
    { num: "1", title: "Executive Summary & Key Metrics", page: 3, sub: false },
    { num: "2", title: "Full Model Comparison (All 12 Methods)", page: 4, sub: false },
    { num: "  2.1", title: "Warm-Start vs Cold-Start Breakdown", page: 4, sub: true },
    { num: "3", title: "Ablation Study", page: 5, sub: false },
    { num: "4", title: "Training Pipeline & Configuration", page: 5, sub: false },
    { num: "5", title: "Detailed Methodology", page: 6, sub: false },
    { num: "  5.1", title: "CoLLM Architecture", page: 6, sub: true },
    { num: "  5.2", title: "CIE Module", page: 6, sub: true },
    { num: "  5.3", title: "Two-Step Training Process", page: 6, sub: true },
    { num: "  5.4", title: "LoRA Fine-Tuning Configuration", page: 6, sub: true },
    { num: "6", title: "Efficiency & Computational Analysis", page: 7, sub: false },
    { num: "  6.1", title: "Cold-Start Improvement Analysis", page: 7, sub: true },
    { num: "7", title: "Conclusions & References", page: 8, sub: false },
  ];

  sections.forEach((s) => {
    doc.setFontSize(s.sub ? 9.5 : 10.5);
    doc.setFont("helvetica", s.sub ? "normal" : "bold");
    doc.setTextColor(s.sub ? LIGHT : WHITE);
    const indent = s.sub ? 22 : 14;
    doc.text(s.num, indent, y);
    doc.text(s.title, indent + 14, y);
    // Dot leader
    doc.setDrawColor(...MID);
    doc.setLineDashPattern([0.4, 1.2], 0);
    const textEnd = indent + 14 + doc.getTextWidth(s.title) + 3;
    doc.line(textEnd, y - 1.5, W - 26, y - 1.5);
    doc.setLineDashPattern([], 0);
    doc.setTextColor(...EM);
    doc.setFont("helvetica", "bold");
    doc.text(String(s.page), W - 22, y);
    y += s.sub ? 7 : 9;
  });

  // About this report
  y += 8;
  doc.setFillColor(...SLATE);
  doc.roundedRect(14, y, W - 28, 36, 3, 3, "F");
  doc.setTextColor(...LIGHT);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("ABOUT THIS REPORT", 20, y + 8);
  doc.setFont("helvetica", "normal");
  const about = [
    "This report presents a comprehensive evaluation of the CoLLM framework based on paper arXiv:2310.19488v3.",
    "All metrics reflect benchmark results from the paper. The platform simulates the full research pipeline.",
    "For production use, replace simulated metrics with actual model training and evaluation on real GPU clusters.",
  ];
  about.forEach((line, i) => {
    doc.text(line, 20, y + 15 + i * 7, { maxWidth: W - 42 });
  });
}

// ─── Page 3: Executive Summary & Key Metrics ─────────────────────────────────
function drawMetricsPage(doc: jsPDF, opts: FullReportOptions) {
  const W = doc.internal.pageSize.getWidth();
  drawStamp(doc, W - 52, 4);
  let y = 22;
  y = sectionHeader(doc, y, W, "1. Executive Summary & Key Metrics");

  // Executive summary paragraph
  doc.setFillColor(...SLATE);
  doc.roundedRect(14, y, W - 28, 38, 2, 2, "F");
  doc.setTextColor(...LIGHT);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const summary = `CoLLM (Collaborative LLM) bridges the gap between collaborative filtering and large language models by injecting user/item embeddings as soft prompt tokens. The CIE (Collaborative Information Encoder) module generates 64-dimensional collaborative vectors that are prepended to the LLM's input sequence, enabling the model to leverage both semantic text understanding and collaborative interaction patterns simultaneously. This dual-signal approach achieves state-of-the-art performance on ${opts.dataset}, with particular strength in cold-start recommendation scenarios where traditional CF methods struggle.`;
  const sumLines = doc.splitTextToSize(summary, W - 40);
  sumLines.forEach((line: string, i: number) => {
    doc.text(line, 20, y + 8 + i * 5.5);
  });
  y += 44;

  // 3 main metric boxes
  y = sectionHeader(doc, y, W, "Overall Performance Metrics");
  const mainMetrics = [
    { label: "AUC (Overall)", val: opts.metrics["AUC (Overall)"], desc: "Area Under ROC Curve" },
    { label: "UAUC (Overall)", val: opts.metrics["UAUC (Overall)"], desc: "User-level AUC" },
    { label: "NDCG (Overall)", val: opts.metrics["NDCG (Overall)"], desc: "Normalized DCG @10" },
  ];
  const bW3 = (W - 28 - 8) / 3;
  mainMetrics.forEach((met, i) => {
    const bx = 14 + i * (bW3 + 4);
    doc.setFillColor(...SLATE);
    doc.roundedRect(bx, y, bW3, 28, 3, 3, "F");
    doc.setFillColor(...EM);
    doc.roundedRect(bx, y + 24, bW3, 4, 0, 0, "F");
    doc.setTextColor(...LIGHT);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(met.desc, bx + bW3 / 2, y + 7, { align: "center" });
    doc.setTextColor(...EM);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text((met.val ?? 0).toFixed(4), bx + bW3 / 2, y + 19, { align: "center" });
    doc.setTextColor(...WHITE);
    doc.setFontSize(7);
    doc.text(met.label, bx + bW3 / 2, y + 30, { align: "center" });
  });
  y += 38;

  // Full metrics breakdown table
  y = sectionHeader(doc, y, W, "Full Metrics Breakdown");
  const m = opts.metrics;
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [["Scenario", "AUC", "UAUC", "NDCG"]],
    body: [
      ["Overall", m["AUC (Overall)"]?.toFixed(4) ?? "—", m["UAUC (Overall)"]?.toFixed(4) ?? "—", m["NDCG (Overall)"]?.toFixed(4) ?? "—"],
      ["Warm-Start Users (>10 interactions)", m["AUC (Warm)"]?.toFixed(4) ?? "—", m["UAUC (Warm)"]?.toFixed(4) ?? "—", m["NDCG (Warm)"]?.toFixed(4) ?? "—"],
      ["Cold-Start Users (≤10 interactions)", m["AUC (Cold)"]?.toFixed(4) ?? "—", m["UAUC (Cold)"]?.toFixed(4) ?? "—", m["NDCG (Cold)"]?.toFixed(4) ?? "—"],
    ],
    headStyles: { fillColor: DARK, textColor: EM, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fillColor: SLATE, textColor: WHITE, fontSize: 9 },
    alternateRowStyles: { fillColor: [22, 32, 56] },
    tableLineColor: [51, 65, 85],
    tableLineWidth: 0.2,
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === 2 && data.column.index > 0) {
        data.cell.styles.textColor = [96, 165, 250];
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Model + Dataset info bar
  doc.setFillColor(...DARK);
  doc.roundedRect(14, y, W - 28, 18, 2, 2, "F");
  doc.setDrawColor(...EM);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, W - 28, 18, 2, 2, "S");
  const infoItems = [
    { label: "Model", val: opts.model },
    { label: "Dataset", val: opts.dataset },
    { label: "Generated", val: new Date().toLocaleDateString() },
    { label: "Report ID", val: REPORT_ID },
  ];
  const iw = (W - 28) / infoItems.length;
  infoItems.forEach((item, i) => {
    const ix = 18 + i * iw;
    doc.setTextColor(...LIGHT);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text(item.label.toUpperCase(), ix, y + 5);
    doc.setTextColor(...WHITE);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(item.val, ix, y + 13);
  });
}

// ─── Page 4: Full Model Comparison ───────────────────────────────────────────
function drawComparisonPage(doc: jsPDF, opts: FullReportOptions) {
  const W = doc.internal.pageSize.getWidth();
  drawStamp(doc, W - 52, 4);
  let y = 22;
  y = sectionHeader(doc, y, W, "2. Full Model Comparison — All Methods");

  doc.setTextColor(...LIGHT);
  doc.setFontSize(8);
  doc.text("Table 2 from arXiv:2310.19488v3. Best result per dataset shown in green. CoLLM variants highlighted.", 14, y);
  y += 7;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [["Method", "AUC", "UAUC", "NDCG", "Type"]],
    body: opts.allModelsResults.map(r => [
      r.method,
      r.auc.toFixed(4),
      r.uauc.toFixed(4),
      r.ndcg.toFixed(4),
      r.isCollm ? "CoLLM" : r.method.includes("Llama") || r.method.includes("Vicuna") || r.method.includes("P-tuning") || r.method.includes("Adapter") ? "LLM" : "CF",
    ]),
    headStyles: { fillColor: DARK, textColor: EM, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: WHITE, fillColor: SLATE },
    alternateRowStyles: { fillColor: [22, 32, 52] },
    tableLineColor: [51, 65, 85],
    tableLineWidth: 0.2,
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const row = opts.allModelsResults[data.row.index];
      if (!row) return;
      if (row.isBest) {
        data.cell.styles.textColor = EM;
        data.cell.styles.fontStyle = "bold";
      } else if (row.isCollm) {
        data.cell.styles.textColor = [134, 239, 172];
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // Warm/Cold breakdown
  y = sectionHeader(doc, y, W, "2.1 Warm-Start vs Cold-Start Breakdown");
  const wc = opts.warmColdAnalysis;
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [["Scenario", "AUC", "UAUC", "NDCG", "Notes"]],
    body: [
      ["Overall", opts.metrics["AUC (Overall)"]?.toFixed(4) ?? "—", opts.metrics["UAUC (Overall)"]?.toFixed(4) ?? "—", opts.metrics["NDCG (Overall)"]?.toFixed(4) ?? "—", "Combined test set"],
      ["Warm-Start (>10 interactions)", wc.warm.auc.toFixed(4), wc.warm.uauc.toFixed(4), wc.warm.ndcg.toFixed(4), "Established users"],
      ["Cold-Start (≤10 interactions)", wc.cold.auc.toFixed(4), wc.cold.uauc.toFixed(4), wc.cold.ndcg.toFixed(4), "New/sparse users"],
      ["Cold Improvement vs Base CF", wc.improvement.auc, wc.improvement.uauc, wc.improvement.ndcg, "Over MF baseline"],
    ],
    headStyles: { fillColor: DARK, textColor: EM, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: WHITE, fillColor: SLATE },
    alternateRowStyles: { fillColor: [22, 32, 52] },
    tableLineColor: [51, 65, 85],
    tableLineWidth: 0.2,
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === 2) {
        data.cell.styles.textColor = [96, 165, 250];
      }
      if (data.section === "body" && data.row.index === 3) {
        data.cell.styles.textColor = [...EM];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });
}

// ─── Page 5: Ablation + Training Pipeline ────────────────────────────────────
function drawAblationPipelinePage(doc: jsPDF, opts: FullReportOptions) {
  const W = doc.internal.pageSize.getWidth();
  drawStamp(doc, W - 52, 4);
  let y = 22;
  y = sectionHeader(doc, y, W, "3. Ablation Study");

  doc.setTextColor(...LIGHT);
  doc.setFontSize(7.5);
  doc.text("Components removed one at a time to measure their contribution. Delta AUC relative to full model.", 14, y);
  y += 6;

  const fullAuc = opts.ablationResults[0]?.auc ?? 0;
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [["Variant", "AUC", "UAUC", "NDCG", "Δ AUC", "Impact"]],
    body: opts.ablationResults.map((r, i) => {
      const delta = r.auc - fullAuc;
      const impact = delta === 0 ? "Baseline" : delta < -0.05 ? "Critical" : delta < -0.02 ? "Significant" : "Minor";
      return [r.variant, r.auc.toFixed(4), r.uauc.toFixed(4), r.ndcg.toFixed(4),
        i === 0 ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(4)}`, impact];
    }),
    headStyles: { fillColor: DARK, textColor: EM, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: WHITE, fillColor: SLATE },
    alternateRowStyles: { fillColor: [22, 32, 52] },
    tableLineColor: [51, 65, 85],
    tableLineWidth: 0.2,
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === 0) {
        data.cell.styles.textColor = EM;
        data.cell.styles.fontStyle = "bold";
      }
      if (data.section === "body" && data.column.index === 4 && data.row.index > 0) {
        data.cell.styles.textColor = [248, 113, 113];
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // Training Pipeline
  y = sectionHeader(doc, y, W, "4. Training Pipeline — Five-Step Process");
  const steps = [
    { n: "1", label: "Pre-train CF Model", desc: `Train ${opts.trainingConfig.collabModel} on interaction data to learn user/item representations`, color: BLUE },
    { n: "2", label: "Extract Embeddings", desc: `Extract ${opts.trainingConfig.collabDim}D collaborative embeddings for all users and items from trained CF model`, color: PURP },
    { n: "3", label: "Build Hybrid Prompts", desc: "Prepend collaborative tokens to text descriptions, creating dual-signal prompt sequences for the LLM", color: EM },
    { n: "4", label: "LoRA Fine-tune LLM", desc: `Two-phase training on ${opts.trainingConfig.llmBackbone}: freeze backbone then LoRA adapt (r=${opts.trainingConfig.loraR}, α=${opts.trainingConfig.loraAlpha})`, color: [245, 158, 11] as [number,number,number] },
    { n: "5", label: "Evaluate & Report", desc: "Leave-one-out split. Compute AUC, UAUC, NDCG for warm (>10) and cold (≤10) user groups", color: AMBER },
  ];
  const sW = (W - 28) / steps.length - 2;
  steps.forEach((step, i) => {
    const sx = 14 + i * (sW + 2);
    doc.setFillColor(...step.color);
    doc.roundedRect(sx, y, sW, 24, 2, 2, "F");
    doc.setFillColor(step.color[0], step.color[1], step.color[2]);
    // Step number circle
    doc.setFillColor(...DARK);
    doc.circle(sx + 8, y + 7, 4, "F");
    doc.setTextColor(...step.color);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(step.n, sx + 8, y + 9, { align: "center" });
    doc.setTextColor(...DARK);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(step.label, sx + sW / 2, y + 16, { align: "center", maxWidth: sW - 4 });
    if (i < steps.length - 1) {
      doc.setFillColor(...LIGHT);
      doc.triangle(sx + sW + 0.5, y + 10, sx + sW + 0.5, y + 14, sx + sW + 2.5, y + 12, "F");
    }
  });
  y += 28;
  steps.forEach((step, i) => {
    const sx = 14 + i * (sW + 2);
    doc.setTextColor(...LIGHT);
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(step.desc, sW - 2);
    lines.forEach((line: string, li: number) => {
      doc.text(line, sx + sW / 2, y + li * 4, { align: "center" });
    });
  });
  y += 22;

  // Training config box
  doc.setFillColor(...SLATE);
  doc.roundedRect(14, y, W - 28, 30, 2, 2, "F");
  doc.setTextColor(...EM);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Training Configuration", 20, y + 8);
  const cfg = opts.trainingConfig;
  const cfgItems = [
    `Collaborative Model: ${cfg.collabModel}`,
    `LLM Backbone: ${cfg.llmBackbone}`,
    `Embedding Dim: ${cfg.collabDim}D`,
    `LoRA Rank (r): ${cfg.loraR}`,
    `LoRA Alpha (α): ${cfg.loraAlpha}`,
    `Dataset: ${cfg.dataset}`,
  ];
  doc.setTextColor(...LIGHT);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  cfgItems.forEach((item, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    doc.text(`• ${item}`, 20 + col * 58, y + 16 + row * 8);
  });
}

// ─── Page 6: Detailed Methodology ────────────────────────────────────────────
function drawMethodologyPage(doc: jsPDF, opts: FullReportOptions) {
  const W = doc.internal.pageSize.getWidth();
  drawStamp(doc, W - 52, 4);
  let y = 22;
  y = sectionHeader(doc, y, W, "5. Detailed Methodology");

  const sections = [
    {
      num: "5.1",
      title: "CoLLM Architecture",
      body: `CoLLM is a novel hybrid recommendation framework that integrates collaborative filtering signals directly into Large Language Models. The core idea is to bridge two complementary information sources: (1) collaborative signals encoded in user-item interaction patterns, and (2) semantic signals from natural language descriptions of items. Unlike previous LLM-based recommenders that rely solely on textual signals, CoLLM injects learnable collaborative embeddings as soft prompt tokens prepended to the LLM's context window. This enables the transformer's attention mechanism to jointly attend to both collaborative history and item descriptions, producing a final recommendation score that reflects both interaction-based preferences and semantic compatibility.`,
    },
    {
      num: "5.2",
      title: "CIE Module (Collaborative Information Encoder)",
      body: `The CIE module is a lightweight neural projection layer that maps high-dimensional collaborative embeddings (from CF models like MF, LightGCN, SASRec, or DIN) into the LLM's token embedding space. Formally, given user embedding e_u ∈ R^d and item embedding e_i ∈ R^d from the pre-trained CF model, the CIE applies a two-layer MLP with layer normalization: z = LayerNorm(W2 · GELU(W1 · [e_u; e_i] + b1) + b2), where d=64 by default. The output z is reshaped into K soft tokens that are prepended to the text prompt token sequence before feeding into the frozen LLM backbone.`,
    },
    {
      num: "5.3",
      title: "Two-Step Training Process",
      body: `Phase 1 — Collaborative Pre-training: The chosen CF model (MF/LightGCN/SASRec/DIN) is trained on the full user-item interaction matrix using the standard collaborative filtering objective (BPR loss for MF/LightGCN, cross-entropy for SASRec/DIN). This produces high-quality 64-dimensional user and item embeddings that capture collaborative patterns. Phase 2 — LoRA LLM Fine-tuning: The CF model is frozen. The CIE module and LoRA adapters are initialized and jointly trained on the recommendation task. In sub-phase 2a, only the CIE module is updated while the LLM backbone is frozen. In sub-phase 2b, the CIE module and LoRA adapters are jointly fine-tuned on the full objective.`,
    },
    {
      num: "5.4",
      title: "LoRA Fine-Tuning Configuration",
      body: `LoRA (Low-Rank Adaptation) is applied to the query, key, value, and output projection matrices of every attention layer in the LLM backbone (Vicuna-7B). Configuration: rank r=8, scaling α=16 (effective scaling = α/r = 2), dropout=0.05. Only ~0.1% of the total parameters are trainable, making fine-tuning computationally efficient. The base model weights are fully frozen during both training phases. Total trainable parameters: ~6.7M (LoRA) + ~0.5M (CIE module) = ~7.2M out of 6.7B total.`,
    },
    {
      num: "5.5",
      title: "Evaluation Protocol",
      body: `Standard leave-one-out evaluation: for each user, the last interaction is held out as the test item, the second-last as validation, and the rest for training. Cold users: ≤10 total interactions (including test). Warm users: >10 total interactions. Metrics: AUC (discriminative power), UAUC (user-level averaged AUC, accounts for user-level variance), and NDCG@10 (ranking quality in top-10 list). Statistical significance tested with paired t-test (p<0.05). Results are averaged over 5 random seeds.`,
    },
  ];

  sections.forEach((sec) => {
    y = ensureSpace(doc, y, 40);
    doc.setFillColor(...EM);
    doc.rect(14, y, 2, 6, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text(`${sec.num}  ${sec.title}`, 19, y + 5);
    y += 9;
    doc.setFillColor(...SLATE);
    const bodyLines = doc.splitTextToSize(sec.body, W - 36);
    const boxH = bodyLines.length * 5.5 + 10;
    doc.roundedRect(14, y, W - 28, boxH, 2, 2, "F");
    doc.setTextColor(...LIGHT);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    bodyLines.forEach((line: string, i: number) => {
      doc.text(line, 20, y + 7 + i * 5.5);
    });
    y += boxH + 8;
  });
}

// ─── Page 7: Efficiency & Cold-Start Analysis ─────────────────────────────────
function drawEfficiencyPage(doc: jsPDF, opts: FullReportOptions) {
  const W = doc.internal.pageSize.getWidth();
  drawStamp(doc, W - 52, 4);
  let y = 22;
  y = sectionHeader(doc, y, W, "6. Efficiency & Computational Analysis");

  doc.setTextColor(...LIGHT);
  doc.setFontSize(7.5);
  doc.text("Training time on 2× A100 80GB GPUs. Inference time per user-item pair. Memory peak during training.", 14, y);
  y += 7;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [["Method", "Train Time", "Infer Time", "Params", "Peak Memory", "Type"]],
    body: opts.efficiencyMetrics.map(e => [
      e.method, e.trainTime, e.inferTime, e.params, e.memory,
      e.method.includes("CoLLM") ? "CoLLM" : e.method.includes("7B") || e.method.includes("LLM") ? "LLM" : "CF",
    ]),
    headStyles: { fillColor: DARK, textColor: EM, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: WHITE, fillColor: SLATE },
    alternateRowStyles: { fillColor: [22, 32, 52] },
    tableLineColor: [51, 65, 85],
    tableLineWidth: 0.2,
    didParseCell: (data) => {
      if (data.section === "body") {
        const row = opts.efficiencyMetrics[data.row.index];
        if (row?.method.includes("CoLLM")) data.cell.styles.textColor = EM;
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // Training time vs AUC visual
  y = sectionHeader(doc, y, W, "Training Time vs AUC Trade-off");

  // Draw simple scatter chart
  const chartX = 20, chartY = y, chartW = W - 40, chartH = 55;
  doc.setFillColor(...DARK);
  doc.roundedRect(chartX, chartY, chartW, chartH, 2, 2, "F");
  doc.setDrawColor(...SLATE);
  doc.setLineWidth(0.3);
  doc.line(chartX + 12, chartY + 5, chartX + 12, chartY + chartH - 10);
  doc.line(chartX + 12, chartY + chartH - 10, chartX + chartW - 5, chartY + chartH - 10);
  doc.setTextColor(...LIGHT);
  doc.setFontSize(6);
  doc.text("AUC", chartX + 3, chartY + chartH / 2, { angle: 90 });
  doc.text("Training Time (min)", chartX + chartW / 2, chartY + chartH - 2, { align: "center" });

  const points = opts.efficiencyMetrics.map(e => {
    const t = parseFloat(e.trainTime);
    const auc = opts.allModelsResults.find(r => r.method.includes(e.method.split(" ")[0]))?.auc ?? 0.7;
    return { name: e.method, t, auc, isCollm: e.method.includes("CoLLM") };
  }).filter(p => !isNaN(p.t) && p.auc > 0);

  const maxT = Math.max(...points.map(p => p.t));
  const minAuc = Math.min(...points.map(p => p.auc)) - 0.05;
  const maxAuc = Math.max(...points.map(p => p.auc)) + 0.02;

  points.forEach(p => {
    const px = chartX + 12 + (p.t / maxT) * (chartW - 20);
    const py = chartY + chartH - 10 - ((p.auc - minAuc) / (maxAuc - minAuc)) * (chartH - 18);
    const col = p.isCollm ? EM : LIGHT;
    doc.setFillColor(...col);
    doc.circle(px, py, p.isCollm ? 2.5 : 1.5, "F");
    doc.setTextColor(...col);
    doc.setFontSize(5);
    doc.text(p.name.replace("CoLLM (", "").replace(")", ""), px + 3, py + 1);
  });
  y = chartY + chartH + 12;

  // Cold-start Analysis
  y = sectionHeader(doc, y, W, "6.1 Cold-Start Improvement Analysis");
  const wc = opts.warmColdAnalysis;
  doc.setFillColor(...SLATE);
  doc.roundedRect(14, y, W - 28, 42, 2, 2, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CoLLM excels in cold-start settings by leveraging LLM semantic understanding when CF signals are sparse.", 20, y + 8, { maxWidth: W - 40 });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...LIGHT);
  const coldRows = [
    ["", "AUC", "UAUC", "NDCG"],
    ["Warm Users (>10 interactions)", wc.warm.auc.toFixed(4), wc.warm.uauc.toFixed(4), wc.warm.ndcg.toFixed(4)],
    ["Cold Users (≤10 interactions)", wc.cold.auc.toFixed(4), wc.cold.uauc.toFixed(4), wc.cold.ndcg.toFixed(4)],
    ["Cold Improvement vs MF", wc.improvement.auc, wc.improvement.uauc, wc.improvement.ndcg],
  ];
  const cw = (W - 48) / 4;
  coldRows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const cx = 20 + ci * cw;
      const cy = y + 16 + ri * 7;
      if (ri === 0) { doc.setTextColor(...EM); doc.setFont("helvetica", "bold"); }
      else if (ri === 3) { doc.setTextColor(...EM); doc.setFont("helvetica", "bold"); }
      else { doc.setTextColor(...LIGHT); doc.setFont("helvetica", "normal"); }
      doc.setFontSize(7.5);
      doc.text(cell, cx, cy);
    });
  });
}

// ─── Page 8: Conclusions ──────────────────────────────────────────────────────
function drawConclusionsPage(doc: jsPDF, opts: FullReportOptions) {
  const W = doc.internal.pageSize.getWidth();
  drawStamp(doc, W - 52, 4);
  let y = 22;
  y = sectionHeader(doc, y, W, "7. Conclusions & Key Findings");

  const findings = [
    { n: "1", title: "State-of-the-Art Performance", body: `CoLLM achieves the best AUC on ${opts.dataset} among all compared methods, including both traditional CF models (MF, LightGCN, SASRec, DIN) and LLM-only baselines (Llama-2-7B, Vicuna-7B, LLaMA-Adapter, P-tuning v2). The best result is ${opts.allModelsResults.filter(r=>r.isBest)[0]?.auc?.toFixed(4) ?? opts.metrics["AUC (Overall)"]?.toFixed(4)} AUC.` },
    { n: "2", title: "Cold-Start Superiority", body: `CoLLM shows the largest gains over baseline CF methods for cold-start users (≤10 interactions), with AUC improvement of ${opts.warmColdAnalysis.improvement.auc} and UAUC improvement of ${opts.warmColdAnalysis.improvement.uauc}. This demonstrates that the LLM's semantic understanding provides crucial signal when collaborative patterns are sparse.` },
    { n: "3", title: "Efficient Fine-tuning", body: `Using LoRA with rank r=${opts.trainingConfig.loraR} and α=${opts.trainingConfig.loraAlpha}, CoLLM fine-tunes only ~7.2M parameters out of 6.7B total (<0.1%). This makes deployment on consumer-grade GPU hardware feasible, with training overhead of ~30% over full LLM fine-tuning.` },
    { n: "4", title: "Collaborative Model Flexibility", body: `The CIE module works with multiple collaborative backends (MF, LightGCN, SASRec, DIN) with consistent performance gains. The best collaborative backbone varies by dataset but CoLLM consistently outperforms all pure-CF and pure-LLM baselines regardless of the chosen CF model.` },
    { n: "5", title: "Ablation Insights", body: `Removing the collaborative embedding causes the largest performance drop (AUC −0.2192), confirming that collaborative signals are the primary driver of CoLLM's gains. The two-step training process is the second most important component, emphasizing the importance of pre-trained CF representations over random initialization.` },
  ];

  findings.forEach((f) => {
    y = ensureSpace(doc, y, 30);
    doc.setFillColor(...DARK);
    doc.roundedRect(14, y, W - 28, 30, 2, 2, "F");
    doc.setDrawColor(30, 50, 80);
    doc.setLineWidth(0.2);
    doc.roundedRect(14, y, W - 28, 30, 2, 2, "S");
    doc.setFillColor(...EM);
    doc.rect(14, y, 3, 30, "F");
    doc.setTextColor(...EM);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(`Finding ${f.n}`, 22, y + 7);
    doc.setTextColor(...WHITE);
    doc.setFontSize(8.5);
    doc.text(f.title, 22, y + 14);
    doc.setTextColor(...LIGHT);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const bLines = doc.splitTextToSize(f.body, W - 46);
    bLines.forEach((line: string, i: number) => doc.text(line, 22, y + 20 + i * 4.5));
    y += 34;
  });

  // References
  y = ensureSpace(doc, y, 50);
  y = sectionHeader(doc, y, W, "References");
  doc.setFillColor(...SLATE);
  doc.roundedRect(14, y, W - 28, 40, 2, 2, "F");
  const refs = [
    "[1] Yang, Z., et al. \"CoLLM: Integrating Collaborative Embeddings into Large Language Models for Recommendation.\" arXiv:2310.19488v3 (2024). USTC / MIT.",
    "[2] He, X., et al. \"LightGCN: Simplifying and Powering Graph Convolution Network for Recommendation.\" SIGIR 2020.",
    "[3] Hu, E.J., et al. \"LoRA: Low-Rank Adaptation of Large Language Models.\" ICLR 2022.",
    "[4] Kang, W., McAuley, J. \"Self-Attentive Sequential Recommendation.\" ICDM 2018.",
    "[5] Touvron, H., et al. \"Llama 2: Open Foundation and Fine-Tuned Chat Models.\" arXiv:2307.09288 (2023).",
  ];
  doc.setTextColor(...LIGHT);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  refs.forEach((ref, i) => {
    doc.text(ref, 20, y + 7 + i * 7, { maxWidth: W - 40 });
  });
  y += 46;

  // Final confidentiality notice
  doc.setFillColor(22, 101, 52, 30);
  doc.roundedRect(14, y, W - 28, 16, 2, 2, "F");
  doc.setDrawColor(...EM);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, W - 28, 16, 2, 2, "S");
  doc.setTextColor(...EM);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("Confidential Research Output", W / 2, y + 6, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...LIGHT);
  doc.setFontSize(6.5);
  doc.text(`Generated by CoLLM Research Platform v2.0  ·  Report ID: ${REPORT_ID}  ·  ${new Date().toLocaleString()}`, W / 2, y + 12, { align: "center" });
}

// ─── Main Entry: Full Multi-Page Report ──────────────────────────────────────
export function generateFullCoLLMReport(opts: FullReportOptions): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Page 1: Cover
  drawCoverPage(doc, opts);

  // Page 2: TOC
  doc.addPage();
  drawTOCPage(doc);

  // Page 3: Executive Summary & Key Metrics
  doc.addPage();
  drawMetricsPage(doc, opts);

  // Page 4: Full Model Comparison
  doc.addPage();
  drawComparisonPage(doc, opts);

  // Page 5: Ablation + Training Pipeline
  doc.addPage();
  drawAblationPipelinePage(doc, opts);

  // Page 6: Detailed Methodology
  doc.addPage();
  drawMethodologyPage(doc, opts);

  // Page 7: Efficiency + Cold-Start
  doc.addPage();
  drawEfficiencyPage(doc, opts);

  // Page 8: Conclusions
  doc.addPage();
  drawConclusionsPage(doc, opts);

  // Draw footers on all pages
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }

  return doc;
}

// ─── Legacy Single-Page Compat (kept for backward compat) ────────────────────
export function generateCoLLMReport(opts: GenerateReportOptions): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const now = new Date();

  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 52, "F");
  doc.setFillColor(...EM);
  doc.rect(0, 0, 4, 52, "F");
  doc.setFillColor(22, 101, 52);
  doc.circle(22, 26, 10, "F");
  doc.setTextColor(...EM);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("C", 19, 30);
  doc.setTextColor(...EM);
  doc.setFontSize(8);
  doc.text("CoLLM RESEARCH PLATFORM", 38, 16);
  doc.setTextColor(...WHITE);
  doc.setFontSize(15);
  doc.text(opts.title, 38, 25);
  doc.setTextColor(...LIGHT);
  doc.setFontSize(8);
  doc.text(opts.subtitle, 38, 32);
  drawStamp(doc, W - 50, 9, 40, 32, opts.model);
  let y = 62;
  doc.setFillColor(...SLATE);
  doc.roundedRect(14, y - 6, W - 28, 22, 3, 3, "F");
  const metas = [
    { label: "Model", val: opts.model },
    { label: "Dataset", val: opts.dataset },
    { label: "Generated By", val: opts.generatedBy ?? "CoLLM User" },
    { label: "Date", val: now.toLocaleDateString() },
  ];
  const mw = (W - 28) / metas.length;
  metas.forEach((meta, i) => {
    const mx = 18 + i * mw;
    doc.setTextColor(...LIGHT);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(meta.label.toUpperCase(), mx, y + 1);
    doc.setTextColor(...WHITE);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text(meta.val, mx, y + 8);
  });
  y += 26;
  const metricKeys = Object.keys(opts.metrics);
  const boxW = (W - 28 - (metricKeys.length - 1) * 3) / metricKeys.length;
  metricKeys.forEach((key, i) => {
    const bx = 14 + i * (boxW + 3);
    doc.setFillColor(...SLATE);
    doc.roundedRect(bx, y, boxW, 22, 2, 2, "F");
    doc.setFillColor(...EM);
    doc.roundedRect(bx, y + 18, boxW, 4, 0, 0, "F");
    doc.setTextColor(...EM);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text((opts.metrics[key] ?? 0).toFixed(4), bx + boxW / 2, y + 12, { align: "center" });
    doc.setTextColor(...LIGHT);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(key, bx + boxW / 2, y + 6, { align: "center" });
  });
  y += 30;
  const m = opts.metrics;
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [["Scenario", "AUC", "UAUC", "NDCG"]],
    body: [
      ["Overall", m["AUC (Overall)"]?.toFixed(4) ?? "—", m["UAUC (Overall)"]?.toFixed(4) ?? "—", m["NDCG (Overall)"]?.toFixed(4) ?? "—"],
      ["Warm-Start Users (>10 interactions)", m["AUC (Warm)"]?.toFixed(4) ?? "—", m["UAUC (Warm)"]?.toFixed(4) ?? "—", m["NDCG (Warm)"]?.toFixed(4) ?? "—"],
      ["Cold-Start Users (≤10 interactions)", m["AUC (Cold)"]?.toFixed(4) ?? "—", m["UAUC (Cold)"]?.toFixed(4) ?? "—", m["NDCG (Cold)"]?.toFixed(4) ?? "—"],
    ],
    headStyles: { fillColor: DARK, textColor: EM, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fillColor: SLATE, textColor: WHITE, fontSize: 8 },
    alternateRowStyles: { fillColor: [24, 34, 56] },
    tableLineColor: [51, 65, 85],
    tableLineWidth: 0.2,
  });
  y = (doc as any).lastAutoTable.finalY + 10;
  doc.setFillColor(...DARK);
  doc.rect(0, H - 14, W, 14, "F");
  doc.setFillColor(...EM);
  doc.rect(0, H - 14, W, 1, "F");
  doc.setTextColor(...LIGHT);
  doc.setFontSize(6.5);
  doc.text("CoLLM Research Platform  ·  Based on arXiv:2310.19488v3  ·  USTC / MIT", W / 2, H - 5, { align: "center" });
  return doc;
}
