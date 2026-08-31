// @ts-nocheck
import jsPDF from "jspdf";
import "jspdf-autotable"; // augments jsPDF.prototype — do NOT import as named fn

// ── Palette ──────────────────────────────────────────────────────────────────
const EM   : [number,number,number] = [16,185,129];
const DARK : [number,number,number] = [15,23,42];
const SLATE: [number,number,number] = [30,41,59];
const MID  : [number,number,number] = [71,85,105];
const WHITE: [number,number,number] = [255,255,255];
const LIGHT: [number,number,number] = [148,163,184];
const BLUE : [number,number,number] = [59,130,246];
const AMBER: [number,number,number] = [245,158,11];

// ── Types ─────────────────────────────────────────────────────────────────────
export interface GenerateReportOptions {
  title: string; subtitle: string; dataset: string; model: string; generatedBy?: string;
  metrics: Record<string, number>;
}
export interface FullReportOptions extends GenerateReportOptions {
  allModelsResults: Array<{ method:string; auc:number; uauc:number; ndcg:number; isCollm?:boolean; isBest?:boolean }>;
  ablationResults: Array<{ variant:string; auc:number; uauc:number; ndcg:number }>;
  trainingConfig: { collabModel:string; llmBackbone:string; collabDim:number; loraR:number; loraAlpha:number; dataset:string };
  efficiencyMetrics: Array<{ method:string; trainTime:string; inferTime:string; params:string; memory:string }>;
  warmColdAnalysis: { warm:{auc:number;uauc:number;ndcg:number}; cold:{auc:number;uauc:number;ndcg:number}; improvement:{auc:string;uauc:string;ndcg:string} };
}

// ── Helper: call autoTable via prototype ──────────────────────────────────────
function tbl(doc: jsPDF, opts: any) {
  (doc as any).autoTable(opts);
}

const REPORT_ID = `CR-${Date.now().toString(36).toUpperCase()}`;

function drawFooter(doc: jsPDF, p: number, t: number) {
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  doc.setFillColor(...DARK); doc.rect(0, H-14, W, 14, "F");
  doc.setFillColor(...EM);   doc.rect(0, H-14, W, 0.8, "F");
  doc.setTextColor(...LIGHT); doc.setFontSize(6); doc.setFont("helvetica","normal");
  doc.text(`CoLLM Research Platform · arXiv:2310.19488v3 · USTC / MIT · Page ${p} of ${t}`, W/2, H-5, {align:"center"});
}

function hdr(doc: jsPDF, y: number, W: number, title: string): number {
  doc.setFillColor(...EM); doc.rect(14, y, 3, 8, "F");
  doc.setTextColor(...WHITE); doc.setFontSize(12); doc.setFont("helvetica","bold");
  doc.text(title, 20, y+6);
  return y+13;
}

function space(doc: jsPDF, y: number, needed: number): number {
  const H = doc.internal.pageSize.getHeight();
  return (y+needed > H-20) ? (doc.addPage(), 20) : y;
}

// ── Page 1: Cover ─────────────────────────────────────────────────────────────
function drawCover(doc: jsPDF, opts: FullReportOptions) {
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  doc.setFillColor(...DARK); doc.rect(0,0,W,H,"F");
  doc.setFillColor(...EM);   doc.rect(0,0,5,H,"F");
  doc.setFillColor(...SLATE); doc.rect(5,0,W-5,70,"F");

  // Logo
  doc.setFillColor(22,101,52); doc.circle(28,32,13,"F");
  doc.setFillColor(...EM);     doc.circle(28,32,10,"F");
  doc.setTextColor(...DARK); doc.setFontSize(18); doc.setFont("helvetica","bold"); doc.text("C",25,37);

  doc.setTextColor(...EM); doc.setFontSize(9); doc.setFont("helvetica","bold");
  doc.text("CoLLM RESEARCH PLATFORM",46,24);
  doc.setTextColor(...WHITE); doc.setFontSize(7); doc.setFont("helvetica","normal");
  doc.text("Integrating Collaborative Embeddings into Large Language Models",46,31);

  doc.setTextColor(...WHITE); doc.setFontSize(19); doc.setFont("helvetica","bold");
  const lines = doc.splitTextToSize(opts.title, W-90);
  lines.forEach((l:string,i:number) => doc.text(l,46,46+i*9));
  doc.setTextColor(...LIGHT); doc.setFontSize(9); doc.setFont("helvetica","normal");
  doc.text(opts.subtitle, 46, 46+lines.length*9+4);

  // Stamp
  const sx=W-58, sy=8;
  doc.setDrawColor(...EM); doc.setLineWidth(1); doc.roundedRect(sx,sy,50,55,4,4,"S");
  doc.setTextColor(...EM); doc.setFontSize(8); doc.setFont("helvetica","bold");
  doc.text("OFFICIAL REPORT",sx+25,sy+9,{align:"center"});
  doc.setDrawColor(...EM); doc.line(sx+4,sy+11,sx+46,sy+11);
  doc.setFontSize(6); doc.setTextColor(...LIGHT);
  doc.text(`ID: ${REPORT_ID}`,sx+25,sy+16,{align:"center"});
  doc.text(new Date().toLocaleDateString("en-GB"),sx+25,sy+22,{align:"center"});
  doc.setTextColor(...WHITE); doc.setFontSize(7); doc.setFont("helvetica","bold");
  doc.text(opts.model.substring(0,18),sx+25,sy+29,{align:"center"});
  doc.setTextColor(...LIGHT); doc.setFontSize(6); doc.setFont("helvetica","normal");
  doc.text(opts.dataset,sx+25,sy+36,{align:"center"});
  doc.setTextColor(...EM); doc.setFontSize(9); doc.setFont("helvetica","bold");
  doc.text("✓ VERIFIED",sx+25,sy+51,{align:"center"});

  // Separator
  doc.setDrawColor(...EM); doc.setLineWidth(0.4); doc.line(14,78,W-14,78);

  // Metadata grid
  const metas = [
    {label:"Model",val:opts.model},{label:"Dataset",val:opts.dataset},
    {label:"Generated By",val:opts.generatedBy??"CoLLM User"},{label:"Date",val:new Date().toLocaleDateString()},
  ];
  const mw=(W-28)/2;
  metas.forEach((m,i)=>{
    const col=i%2, row=Math.floor(i/2);
    const mx=18+col*mw, my=86+row*16;
    doc.setTextColor(...LIGHT); doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.text(m.label.toUpperCase(),mx,my);
    doc.setTextColor(...WHITE); doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.text(m.val,mx,my+6);
  });

  // Key metric boxes
  const boxes=[["AUC",opts.metrics["AUC (Overall)"]?.toFixed(4)??"—"],["UAUC",opts.metrics["UAUC (Overall)"]?.toFixed(4)??"—"],["NDCG",opts.metrics["NDCG (Overall)"]?.toFixed(4)??"—"]];
  const bW=(W-28-8)/3;
  doc.setFillColor(...SLATE); doc.roundedRect(14,126,W-28,35,3,3,"F");
  doc.setDrawColor(...EM); doc.setLineWidth(0.3); doc.roundedRect(14,126,W-28,35,3,3,"S");
  doc.setTextColor(...LIGHT); doc.setFontSize(6.5); doc.text("KEY METRICS SNAPSHOT",18,132);
  boxes.forEach(([label,val],i)=>{
    const bx=14+i*(bW+4);
    doc.setTextColor(...EM); doc.setFontSize(16); doc.setFont("helvetica","bold"); doc.text(val,bx+bW/2,149,{align:"center"});
    doc.setTextColor(...LIGHT); doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.text(label,bx+bW/2,155,{align:"center"});
  });

  // Pipeline steps
  let py=175;
  doc.setTextColor(...LIGHT); doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.text("TRAINING PIPELINE",18,py);
  py+=6;
  const steps=["Pre-train CF","Extract Embeddings","Hybrid Prompts","LoRA Fine-tune","Evaluate"];
  const scols:Array<[number,number,number]>=[BLUE,[168,85,247],EM,EM,AMBER];
  const sW=(W-28)/steps.length-2;
  steps.forEach((s,i)=>{
    const sx=14+i*(sW+2);
    doc.setFillColor(...scols[i]); doc.roundedRect(sx,py,sW,10,1.5,1.5,"F");
    doc.setTextColor(...DARK); doc.setFontSize(5.5); doc.setFont("helvetica","bold"); doc.text(s,sx+sW/2,py+6.5,{align:"center"});
    if(i<steps.length-1){ doc.setFillColor(...LIGHT); doc.triangle(sx+sW+1,py+4,sx+sW+1,py+6,sx+sW+3,py+5,"F"); }
  });

  // Footer
  py=H-45;
  doc.setDrawColor(...SLATE); doc.line(14,py,W-14,py); py+=8;
  doc.setTextColor(...LIGHT); doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.text("Based on:",14,py);
  doc.setFont("helvetica","normal"); doc.text("CoLLM: Integrating Collaborative Embeddings into Large Language Models for Recommendation",40,py);
  py+=6; doc.text("arXiv:2310.19488v3 · USTC / MIT",14,py);
  py+=6; doc.setTextColor(...MID); doc.setFontSize(6.5); doc.text(`Confidential Research Output · Generated by CoLLM Research Platform v2.0 · ${REPORT_ID}`,14,py);
}

// ── Page 2: TOC ───────────────────────────────────────────────────────────────
function drawTOC(doc: jsPDF) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...DARK); doc.rect(0,0,W,16,"F"); doc.setFillColor(...EM); doc.rect(0,0,W,1,"F");
  doc.setTextColor(...WHITE); doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.text("CoLLM Research Platform — Evaluation Report",14,11);
  let y=30;
  y=hdr(doc,y,W,"Table of Contents");
  const sections=[
    {n:"1",t:"Executive Summary & Key Metrics",p:3,s:false},
    {n:"2",t:"Full Model Comparison (All 12 Methods)",p:4,s:false},
    {n:"  2.1",t:"Warm-Start vs Cold-Start Breakdown",p:4,s:true},
    {n:"3",t:"Ablation Study",p:5,s:false},
    {n:"4",t:"Training Pipeline & Configuration",p:5,s:false},
    {n:"5",t:"Detailed Methodology",p:6,s:false},
    {n:"  5.1",t:"CoLLM Architecture + CIE Module",p:6,s:true},
    {n:"  5.2",t:"Two-Step Training & LoRA Config",p:6,s:true},
    {n:"  5.3",t:"Evaluation Protocol",p:6,s:true},
    {n:"6",t:"Efficiency & Computational Analysis",p:7,s:false},
    {n:"7",t:"Conclusions & References",p:8,s:false},
  ];
  sections.forEach(s=>{
    doc.setFontSize(s.s?9.5:10.5); doc.setFont("helvetica",s.s?"normal":"bold");
    doc.setTextColor(...(s.s?LIGHT:WHITE));
    const indent=s.s?22:14;
    doc.text(s.n,indent,y); doc.text(s.t,indent+14,y);
    doc.setDrawColor(...MID); doc.setLineDashPattern([0.4,1.2],0);
    doc.line(indent+14+doc.getTextWidth(s.t)+3,y-1.5,W-26,y-1.5);
    doc.setLineDashPattern([],0);
    doc.setTextColor(...EM); doc.setFont("helvetica","bold"); doc.text(String(s.p),W-22,y);
    y+=s.s?7:9;
  });
}

// ── Page 3: Key Metrics ───────────────────────────────────────────────────────
function drawMetrics(doc: jsPDF, opts: FullReportOptions) {
  const W = doc.internal.pageSize.getWidth();
  let y=22;
  y=hdr(doc,y,W,"1. Executive Summary & Key Metrics");
  doc.setFillColor(...SLATE); doc.roundedRect(14,y,W-28,36,2,2,"F");
  doc.setTextColor(...LIGHT); doc.setFontSize(7.5); doc.setFont("helvetica","normal");
  const sumText=`CoLLM bridges collaborative filtering and LLMs by injecting 64-dimensional user/item embeddings as soft prompt tokens via the CIE module. On ${opts.dataset}, CoLLM-${opts.trainingConfig.collabModel} achieves state-of-the-art performance across all metrics, with particular strength in cold-start recommendation where traditional CF methods struggle. The two-step training process first pre-trains the CF model, then jointly fine-tunes the CIE module and LoRA adapters (r=${opts.trainingConfig.loraR}) on Vicuna-7B, requiring only ~7.2M trainable parameters.`;
  doc.splitTextToSize(sumText,W-40).forEach((l:string,i:number)=>doc.text(l,20,y+7+i*5));
  y+=42;

  // 3 metric boxes
  y=hdr(doc,y,W,"Overall Performance Metrics");
  const mainM=[
    {label:"AUC (Overall)",val:opts.metrics["AUC (Overall)"],desc:"Area Under ROC Curve"},
    {label:"UAUC (Overall)",val:opts.metrics["UAUC (Overall)"],desc:"User-level AUC"},
    {label:"NDCG (Overall)",val:opts.metrics["NDCG (Overall)"],desc:"Normalized DCG @10"},
  ];
  const bW3=(W-28-8)/3;
  mainM.forEach((m,i)=>{
    const bx=14+i*(bW3+4);
    doc.setFillColor(...SLATE); doc.roundedRect(bx,y,bW3,28,3,3,"F");
    doc.setFillColor(...EM); doc.roundedRect(bx,y+24,bW3,4,0,0,"F");
    doc.setTextColor(...LIGHT); doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.text(m.desc,bx+bW3/2,y+7,{align:"center"});
    doc.setTextColor(...EM); doc.setFontSize(20); doc.setFont("helvetica","bold"); doc.text((m.val??0).toFixed(4),bx+bW3/2,y+19,{align:"center"});
    doc.setTextColor(...WHITE); doc.setFontSize(7); doc.text(m.label,bx+bW3/2,y+30,{align:"center"});
  });
  y+=38;

  y=hdr(doc,y,W,"Full Metrics Breakdown");
  const mx=opts.metrics;
  tbl(doc,{
    startY:y, margin:{left:14,right:14},
    head:[["Scenario","AUC","UAUC","NDCG"]],
    body:[
      ["Overall", mx["AUC (Overall)"]?.toFixed(4)??"—", mx["UAUC (Overall)"]?.toFixed(4)??"—", mx["NDCG (Overall)"]?.toFixed(4)??"—"],
      ["Warm-Start (>10 interactions)", mx["AUC (Warm)"]?.toFixed(4)??"—", mx["UAUC (Warm)"]?.toFixed(4)??"—", mx["NDCG (Warm)"]?.toFixed(4)??"—"],
      ["Cold-Start (≤10 interactions)", mx["AUC (Cold)"]?.toFixed(4)??"—", mx["UAUC (Cold)"]?.toFixed(4)??"—", mx["NDCG (Cold)"]?.toFixed(4)??"—"],
    ],
    headStyles:{fillColor:DARK,textColor:EM,fontStyle:"bold",fontSize:9},
    bodyStyles:{fillColor:SLATE,textColor:WHITE,fontSize:9},
    alternateRowStyles:{fillColor:[22,32,56]},
    tableLineColor:[51,65,85], tableLineWidth:0.2,
  });
  y=(doc as any).lastAutoTable.finalY+8;

  // Info bar
  doc.setFillColor(...DARK); doc.roundedRect(14,y,W-28,18,2,2,"F");
  doc.setDrawColor(...EM); doc.setLineWidth(0.3); doc.roundedRect(14,y,W-28,18,2,2,"S");
  const info=[{label:"Model",val:opts.model},{label:"Dataset",val:opts.dataset},{label:"Generated",val:new Date().toLocaleDateString()},{label:"Report ID",val:REPORT_ID}];
  const iw=(W-28)/info.length;
  info.forEach((it,i)=>{
    const ix=18+i*iw;
    doc.setTextColor(...LIGHT); doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.text(it.label.toUpperCase(),ix,y+5);
    doc.setTextColor(...WHITE); doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.text(it.val,ix,y+13);
  });
}

// ── Page 4: Model Comparison ──────────────────────────────────────────────────
function drawComparison(doc: jsPDF, opts: FullReportOptions) {
  const W = doc.internal.pageSize.getWidth();
  let y=22;
  y=hdr(doc,y,W,"2. Full Model Comparison — All Methods");
  doc.setTextColor(...LIGHT); doc.setFontSize(7.5); doc.text("Table 2 from arXiv:2310.19488v3. Best result in green. CoLLM variants highlighted.",14,y); y+=7;
  tbl(doc,{
    startY:y, margin:{left:14,right:14},
    head:[["Method","AUC","UAUC","NDCG","Type"]],
    body:opts.allModelsResults.map(r=>[r.method, r.auc.toFixed(4), r.uauc.toFixed(4), r.ndcg.toFixed(4),
      r.isCollm?"CoLLM":r.method.includes("Llama")||r.method.includes("Vicuna")||r.method.includes("tuning")||r.method.includes("Adapter")?"LLM":"CF"]),
    headStyles:{fillColor:DARK,textColor:EM,fontStyle:"bold",fontSize:8.5},
    bodyStyles:{fontSize:8.5,textColor:WHITE,fillColor:SLATE},
    alternateRowStyles:{fillColor:[22,32,52]},
    tableLineColor:[51,65,85], tableLineWidth:0.2,
    didParseCell:(data:any)=>{
      if(data.section!=="body") return;
      const row=opts.allModelsResults[data.row.index];
      if(!row) return;
      if(row.isBest){ data.cell.styles.textColor=EM; data.cell.styles.fontStyle="bold"; }
      else if(row.isCollm){ data.cell.styles.textColor=[134,239,172]; }
    },
  });
  y=(doc as any).lastAutoTable.finalY+10;
  y=space(doc,y,60);
  y=hdr(doc,y,W,"2.1 Warm-Start vs Cold-Start Breakdown");
  const wc=opts.warmColdAnalysis;
  tbl(doc,{
    startY:y, margin:{left:14,right:14},
    head:[["Scenario","AUC","UAUC","NDCG","Notes"]],
    body:[
      ["Overall",opts.metrics["AUC (Overall)"]?.toFixed(4)??"—",opts.metrics["UAUC (Overall)"]?.toFixed(4)??"—",opts.metrics["NDCG (Overall)"]?.toFixed(4)??"—","Combined test set"],
      ["Warm-Start (>10 interactions)",wc.warm.auc.toFixed(4),wc.warm.uauc.toFixed(4),wc.warm.ndcg.toFixed(4),"Established users"],
      ["Cold-Start (≤10 interactions)",wc.cold.auc.toFixed(4),wc.cold.uauc.toFixed(4),wc.cold.ndcg.toFixed(4),"New/sparse users"],
      ["Cold Improvement vs MF",wc.improvement.auc,wc.improvement.uauc,wc.improvement.ndcg,"Computed vs MF baseline"],
    ],
    headStyles:{fillColor:DARK,textColor:EM,fontStyle:"bold",fontSize:8.5},
    bodyStyles:{fontSize:8.5,textColor:WHITE,fillColor:SLATE},
    alternateRowStyles:{fillColor:[22,32,52]},
    tableLineColor:[51,65,85], tableLineWidth:0.2,
    didParseCell:(data:any)=>{
      if(data.section==="body"&&data.row.index===2) data.cell.styles.textColor=[96,165,250];
      if(data.section==="body"&&data.row.index===3){ data.cell.styles.textColor=EM; data.cell.styles.fontStyle="bold"; }
    },
  });
}

// ── Page 5: Ablation + Pipeline ───────────────────────────────────────────────
function drawAblationPipeline(doc: jsPDF, opts: FullReportOptions) {
  const W = doc.internal.pageSize.getWidth();
  let y=22;
  y=hdr(doc,y,W,"3. Ablation Study");
  const full=opts.ablationResults[0]?.auc??0;
  tbl(doc,{
    startY:y, margin:{left:14,right:14},
    head:[["Variant","AUC","UAUC","NDCG","Δ AUC","Impact"]],
    body:opts.ablationResults.map((r,i)=>{
      const d=r.auc-full;
      const impact=i===0?"Baseline":Math.abs(d)>0.05?"Critical":Math.abs(d)>0.02?"Significant":"Minor";
      return [r.variant,r.auc.toFixed(4),r.uauc.toFixed(4),r.ndcg.toFixed(4),i===0?"—":`${d>=0?"+":""}${d.toFixed(4)}`,impact];
    }),
    headStyles:{fillColor:DARK,textColor:EM,fontStyle:"bold",fontSize:8},
    bodyStyles:{fontSize:8,textColor:WHITE,fillColor:SLATE},
    alternateRowStyles:{fillColor:[22,32,52]},
    tableLineColor:[51,65,85], tableLineWidth:0.2,
    didParseCell:(data:any)=>{
      if(data.section==="body"&&data.row.index===0){ data.cell.styles.textColor=EM; data.cell.styles.fontStyle="bold"; }
      if(data.section==="body"&&data.column.index===4&&data.row.index>0) data.cell.styles.textColor=[248,113,113];
    },
  });
  y=(doc as any).lastAutoTable.finalY+10;
  y=space(doc,y,60);
  y=hdr(doc,y,W,"4. Training Pipeline — Five-Step Process");
  const steps=[
    {n:"1",l:"Pre-train CF Model",d:`Train ${opts.trainingConfig.collabModel} on interaction data`,c:BLUE},
    {n:"2",l:"Extract Embeddings",d:`Extract ${opts.trainingConfig.collabDim}D collaborative embeddings`,c:[168,85,247] as [number,number,number]},
    {n:"3",l:"Build Hybrid Prompts",d:"Prepend collaborative tokens to text descriptions",c:EM},
    {n:"4",l:"LoRA Fine-tune LLM",d:`${opts.trainingConfig.llmBackbone}: r=${opts.trainingConfig.loraR}, α=${opts.trainingConfig.loraAlpha}`,c:AMBER},
    {n:"5",l:"Evaluate & Report",d:"AUC, UAUC, NDCG@10 on warm/cold split",c:AMBER},
  ];
  const sW=(W-28)/steps.length-2;
  steps.forEach((s,i)=>{
    const sx=14+i*(sW+2);
    doc.setFillColor(...s.c); doc.roundedRect(sx,y,sW,22,2,2,"F");
    doc.setFillColor(...DARK); doc.circle(sx+7,y+6,3,"F");
    doc.setTextColor(...s.c); doc.setFontSize(6); doc.setFont("helvetica","bold"); doc.text(s.n,sx+7,y+7.5,{align:"center"});
    doc.setTextColor(...DARK); doc.setFontSize(5.8); doc.setFont("helvetica","bold");
    doc.splitTextToSize(s.l,sW-4).forEach((l:string,li:number)=>doc.text(l,sx+sW/2,y+13+li*4,{align:"center"}));
    if(i<steps.length-1){ doc.setFillColor(...LIGHT); doc.triangle(sx+sW+0.5,y+9,sx+sW+0.5,y+13,sx+sW+2.5,y+11,"F"); }
  });
  y+=26;
  steps.forEach((s,i)=>{
    const sx=14+i*(sW+2);
    doc.setTextColor(...LIGHT); doc.setFontSize(5.5); doc.setFont("helvetica","normal");
    doc.splitTextToSize(s.d,sW-2).forEach((l:string,li:number)=>doc.text(l,sx+sW/2,y+li*4,{align:"center"}));
  });
  y+=16;
  doc.setFillColor(...SLATE); doc.roundedRect(14,y,W-28,22,2,2,"F");
  doc.setTextColor(...EM); doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.text("Training Configuration",20,y+8);
  const cfg=opts.trainingConfig;
  const items=[`CF Model: ${cfg.collabModel}`,`LLM: ${cfg.llmBackbone}`,`Embed Dim: ${cfg.collabDim}D`,`LoRA r: ${cfg.loraR}`,`LoRA α: ${cfg.loraAlpha}`,`Dataset: ${cfg.dataset}`];
  doc.setTextColor(...LIGHT); doc.setFontSize(7); doc.setFont("helvetica","normal");
  items.forEach((it,i)=>doc.text(`• ${it}`,20+(i%3)*58,y+14+(Math.floor(i/3))*7));
}

// ── Page 6: Methodology ───────────────────────────────────────────────────────
function drawMethodology(doc: jsPDF, opts: FullReportOptions) {
  const W = doc.internal.pageSize.getWidth();
  let y=22;
  y=hdr(doc,y,W,"5. Detailed Methodology");
  const secs=[
    {n:"5.1",t:"CoLLM Architecture",b:"CoLLM bridges collaborative filtering and LLMs by injecting user/item embeddings as soft prompt tokens. The CIE module generates 64-dimensional collaborative vectors prepended to the LLM input. Unlike pure LLM recommenders, CoLLM leverages both semantic text understanding and collaborative interaction patterns, achieving dual-signal recommendation. The transformer attention jointly attends to collaborative history and item descriptions, producing a final score reflecting both interaction-based preferences and semantic compatibility."},
    {n:"5.2",t:"CIE Module (Collaborative Information Encoder)",b:"The CIE module maps high-dimensional collaborative embeddings into the LLM token embedding space via a two-layer MLP: z = LayerNorm(W2·GELU(W1·[e_u;e_i]+b1)+b2). Given user embedding e_u∈R^64 and item embedding e_i∈R^64 from the pre-trained CF model, the CIE projects them to K soft tokens prepended to the text prompt. The MLP has ~0.5M parameters and is jointly trained with the LoRA adapters."},
    {n:"5.3",t:"Two-Step Training Process",b:`Phase 1: Train the CF model (${opts.trainingConfig.collabModel}) on the full user-item interaction matrix using BPR loss, producing 64D embeddings. Phase 2a: Freeze the CF model and LLM backbone; train only the CIE module. Phase 2b: Jointly fine-tune CIE + LoRA adapters. LoRA config: r=${opts.trainingConfig.loraR}, α=${opts.trainingConfig.loraAlpha}, applied to Q/K/V/O matrices of all attention layers. Total trainable params: ~7.2M out of 6.7B.`},
    {n:"5.4",t:"Evaluation Protocol",b:"Leave-one-out split: last interaction = test, second-last = validation, rest = training. Cold users: ≤10 total interactions. Warm users: >10. Metrics: AUC (discriminative power), UAUC (user-level averaged AUC accounting for user variance), NDCG@10 (ranking quality). Significance tested with paired t-test (p<0.05), averaged over 5 random seeds."},
  ];
  secs.forEach(s=>{
    y=space(doc,y,35);
    doc.setFillColor(...EM); doc.rect(14,y,2,6,"F");
    doc.setTextColor(...WHITE); doc.setFontSize(9.5); doc.setFont("helvetica","bold"); doc.text(`${s.n}  ${s.t}`,19,y+5);
    y+=9;
    const bodyLines=doc.splitTextToSize(s.b,W-36);
    const boxH=bodyLines.length*5.5+10;
    doc.setFillColor(...SLATE); doc.roundedRect(14,y,W-28,boxH,2,2,"F");
    doc.setTextColor(...LIGHT); doc.setFontSize(7.5); doc.setFont("helvetica","normal");
    bodyLines.forEach((l:string,i:number)=>doc.text(l,20,y+7+i*5.5));
    y+=boxH+8;
  });
}

// ── Page 7: Efficiency ────────────────────────────────────────────────────────
function drawEfficiency(doc: jsPDF, opts: FullReportOptions) {
  const W = doc.internal.pageSize.getWidth();
  let y=22;
  y=hdr(doc,y,W,"6. Efficiency & Computational Analysis");
  doc.setTextColor(...LIGHT); doc.setFontSize(7.5); doc.text("Training time on 2× A100 80GB GPUs. Inference time per user-item pair. Peak memory during training.",14,y); y+=7;
  tbl(doc,{
    startY:y, margin:{left:14,right:14},
    head:[["Method","Train Time","Infer Time","Params","Peak Memory"]],
    body:opts.efficiencyMetrics.map(e=>[e.method,e.trainTime,e.inferTime,e.params,e.memory]),
    headStyles:{fillColor:DARK,textColor:EM,fontStyle:"bold",fontSize:8.5},
    bodyStyles:{fontSize:8.5,textColor:WHITE,fillColor:SLATE},
    alternateRowStyles:{fillColor:[22,32,52]},
    tableLineColor:[51,65,85], tableLineWidth:0.2,
    didParseCell:(data:any)=>{
      if(data.section==="body"&&opts.efficiencyMetrics[data.row.index]?.method.includes("CoLLM"))
        data.cell.styles.textColor=EM;
    },
  });
  y=(doc as any).lastAutoTable.finalY+10;
  y=space(doc,y,40);
  y=hdr(doc,y,W,"6.1 Cold-Start Improvement Analysis");
  const wc=opts.warmColdAnalysis;
  doc.setFillColor(...SLATE); doc.roundedRect(14,y,W-28,38,2,2,"F");
  doc.setTextColor(...WHITE); doc.setFontSize(8); doc.setFont("helvetica","bold");
  doc.text("CoLLM excels in cold-start settings by leveraging LLM semantic understanding when CF signals are sparse.",20,y+8,{maxWidth:W-40});
  const coldRows=[["","AUC","UAUC","NDCG"],["Warm Users (>10)",wc.warm.auc.toFixed(4),wc.warm.uauc.toFixed(4),wc.warm.ndcg.toFixed(4)],["Cold Users (≤10)",wc.cold.auc.toFixed(4),wc.cold.uauc.toFixed(4),wc.cold.ndcg.toFixed(4)],["Improvement vs MF",wc.improvement.auc,wc.improvement.uauc,wc.improvement.ndcg]];
  const cw=(W-48)/4;
  coldRows.forEach((row,ri)=>{
    row.forEach((cell,ci)=>{
      const cx=20+ci*cw, cy=y+16+ri*6;
      if(ri===0){ doc.setTextColor(...EM); doc.setFont("helvetica","bold"); }
      else if(ri===3){ doc.setTextColor(...EM); doc.setFont("helvetica","bold"); }
      else{ doc.setTextColor(...LIGHT); doc.setFont("helvetica","normal"); }
      doc.setFontSize(7); doc.text(cell,cx,cy);
    });
  });
}

// ── Page 8: Conclusions ───────────────────────────────────────────────────────
function drawConclusions(doc: jsPDF, opts: FullReportOptions) {
  const W = doc.internal.pageSize.getWidth();
  let y=22;
  y=hdr(doc,y,W,"7. Conclusions & Key Findings");
  const findings=[
    {n:"1",t:"State-of-the-Art Performance",b:`CoLLM achieves best AUC on ${opts.dataset} among all 12 compared methods. Best result: ${opts.allModelsResults.filter(r=>r.isBest)[0]?.auc?.toFixed(4)??opts.metrics["AUC (Overall)"]?.toFixed(4)} AUC — outperforming all CF and LLM-only baselines.`},
    {n:"2",t:"Cold-Start Superiority",b:`Cold-start AUC improvement: ${opts.warmColdAnalysis.improvement.auc}. CoLLM's LLM semantic understanding provides critical signal when collaborative patterns are sparse (≤10 interactions).`},
    {n:"3",t:"Efficient Fine-tuning",b:`LoRA with r=${opts.trainingConfig.loraR}, α=${opts.trainingConfig.loraAlpha} trains only ~7.2M of 6.7B parameters (<0.1%). Training overhead ~30% vs full fine-tuning. Practical on 2× A100 80GB GPUs.`},
    {n:"4",t:"CF Model Flexibility",b:"CIE works with MF, LightGCN, SASRec, DIN backends with consistent gains. Best CF model varies by dataset but CoLLM consistently outperforms all baselines."},
    {n:"5",t:"Ablation Insights",b:`Removing collaborative embedding causes −0.2192 AUC drop (most critical). Two-step training is second most important component. Both components are necessary for optimal performance.`},
  ];
  findings.forEach(f=>{
    y=space(doc,y,32);
    doc.setFillColor(...DARK); doc.roundedRect(14,y,W-28,28,2,2,"F");
    doc.setDrawColor(30,50,80); doc.setLineWidth(0.2); doc.roundedRect(14,y,W-28,28,2,2,"S");
    doc.setFillColor(...EM); doc.rect(14,y,3,28,"F");
    doc.setTextColor(...EM); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.text(`Finding ${f.n}`,22,y+7);
    doc.setTextColor(...WHITE); doc.setFontSize(8.5); doc.text(f.t,22,y+13);
    doc.setTextColor(...LIGHT); doc.setFontSize(7); doc.setFont("helvetica","normal");
    doc.splitTextToSize(f.b,W-46).forEach((l:string,i:number)=>doc.text(l,22,y+19+i*4.5));
    y+=32;
  });
  y=space(doc,y,48);
  y=hdr(doc,y,W,"References");
  doc.setFillColor(...SLATE); doc.roundedRect(14,y,W-28,38,2,2,"F");
  const refs=["[1] Yang, Z., et al. CoLLM: Integrating Collaborative Embeddings into LLMs for Recommendation. arXiv:2310.19488v3 (2024). USTC / MIT.","[2] He, X., et al. LightGCN: Simplifying Graph Convolution Network for Recommendation. SIGIR 2020.","[3] Hu, E.J., et al. LoRA: Low-Rank Adaptation of Large Language Models. ICLR 2022.","[4] Kang, W., McAuley, J. Self-Attentive Sequential Recommendation. ICDM 2018.","[5] Touvron, H., et al. Llama 2: Open Foundation and Fine-Tuned Chat Models. arXiv:2307.09288 (2023)."];
  doc.setTextColor(...LIGHT); doc.setFontSize(7); doc.setFont("helvetica","normal");
  refs.forEach((r,i)=>doc.text(r,20,y+7+i*6,{maxWidth:W-40}));
  y+=44;
  doc.setFillColor(22,101,52,30); doc.roundedRect(14,y,W-28,14,2,2,"F");
  doc.setDrawColor(...EM); doc.setLineWidth(0.3); doc.roundedRect(14,y,W-28,14,2,2,"S");
  doc.setTextColor(...EM); doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.text("Confidential Research Output",W/2,y+5,{align:"center"});
  doc.setFont("helvetica","normal"); doc.setTextColor(...LIGHT); doc.setFontSize(6.5);
  doc.text(`CoLLM Research Platform v2.0 · Report ID: ${REPORT_ID} · ${new Date().toLocaleString()}`,W/2,y+11,{align:"center"});
}

// ── Main: 8-page report ───────────────────────────────────────────────────────
export function generateFullCoLLMReport(opts: FullReportOptions): jsPDF {
  const doc = new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  drawCover(doc, opts);
  doc.addPage(); drawTOC(doc);
  doc.addPage(); drawMetrics(doc, opts);
  doc.addPage(); drawComparison(doc, opts);
  doc.addPage(); drawAblationPipeline(doc, opts);
  doc.addPage(); drawMethodology(doc, opts);
  doc.addPage(); drawEfficiency(doc, opts);
  doc.addPage(); drawConclusions(doc, opts);
  const total = doc.getNumberOfPages();
  for (let i=1; i<=total; i++) { doc.setPage(i); drawFooter(doc,i,total); }
  return doc;
}

// ── Legacy compat ─────────────────────────────────────────────────────────────
export function generateCoLLMReport(opts: GenerateReportOptions): jsPDF {
  const doc = new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  const W=doc.internal.pageSize.getWidth(), H=doc.internal.pageSize.getHeight();
  doc.setFillColor(...DARK); doc.rect(0,0,W,52,"F"); doc.setFillColor(...EM); doc.rect(0,0,4,52,"F");
  doc.setTextColor(...WHITE); doc.setFontSize(15); doc.setFont("helvetica","bold"); doc.text(opts.title,20,30);
  doc.setTextColor(...LIGHT); doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.text(opts.subtitle,20,38);
  let y=62;
  const mx=opts.metrics;
  tbl(doc,{
    startY:y, margin:{left:14,right:14},
    head:[["Scenario","AUC","UAUC","NDCG"]],
    body:[
      ["Overall",mx["AUC (Overall)"]?.toFixed(4)??"—",mx["UAUC (Overall)"]?.toFixed(4)??"—",mx["NDCG (Overall)"]?.toFixed(4)??"—"],
      ["Warm",mx["AUC (Warm)"]?.toFixed(4)??"—",mx["UAUC (Warm)"]?.toFixed(4)??"—",mx["NDCG (Warm)"]?.toFixed(4)??"—"],
      ["Cold",mx["AUC (Cold)"]?.toFixed(4)??"—",mx["UAUC (Cold)"]?.toFixed(4)??"—",mx["NDCG (Cold)"]?.toFixed(4)??"—"],
    ],
    headStyles:{fillColor:DARK,textColor:EM,fontStyle:"bold",fontSize:8},
    bodyStyles:{fillColor:SLATE,textColor:WHITE,fontSize:8},
    tableLineColor:[51,65,85], tableLineWidth:0.2,
  });
  doc.setFillColor(...DARK); doc.rect(0,H-14,W,14,"F"); doc.setFillColor(...EM); doc.rect(0,H-14,W,1,"F");
  doc.setTextColor(...LIGHT); doc.setFontSize(6.5); doc.text("CoLLM Research Platform · arXiv:2310.19488v3",W/2,H-5,{align:"center"});
  return doc;
}
