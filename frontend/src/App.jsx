import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area,
  PieChart as RPieChart, Pie, Cell, ScatterChart, Scatter, ZAxis,
} from "recharts";
import {
  Brain, Zap, TrendingUp, Users, BookOpen, Activity,
  ArrowRight, CheckCircle, AlertCircle, Loader, Database,
  Layers, GitBranch, Cpu, Sparkles, ChevronRight,
  Star, Clock, BarChart3, Network, Filter, Play,
  RefreshCw, Download, FileText, Globe, Award, Box,
  FlaskConical, Search, X, Settings, Menu,
  LayoutDashboard, GitCompare, Telescope, ShieldCheck,
  Gauge, Package, ChevronLeft, BarChart2, Sigma,
} from "lucide-react";

/* ── CONFIG ─────────────────────────────────────────────────────── */
const API = process.env.REACT_APP_API_URL || "https://collm-backend.onrender.com";
const C = {
  primary:"#6366f1",secondary:"#8b5cf6",accent:"#f59e0b",
  success:"#10b981",danger:"#ef4444",warning:"#f97316",
  info:"#3b82f6",darker:"#0f172a",light:"#f8fafc",
  muted:"#64748b",border:"rgba(99,102,241,0.18)",card:"rgba(15,23,42,0.88)",
};
const MC = {
  "MF":"#6366f1","LightGCN":"#8b5cf6","SASRec":"#f59e0b","DIN":"#10b981",
  "CTRL (DIN)":"#3b82f6","TALLRec":"#f97316","ICL":"#94a3b8",
  "CoLLM-MF":"#ef4444","CoLLM-LightGCN":"#ec4899","CoLLM-SASRec":"#06b6d4","CoLLM-DIN":"#84cc16",
};
const TB = {
  collab:{bg:"rgba(99,102,241,.15)",color:"#6366f1",label:"Collaborative"},
  "lm+collab":{bg:"rgba(59,130,246,.15)",color:"#3b82f6",label:"LM+Collab"},
  llmrec:{bg:"rgba(245,158,11,.15)",color:"#f59e0b",label:"LLMRec"},
  ours:{bg:"rgba(16,185,129,.15)",color:"#10b981",label:"⭐ CoLLM"},
};
const NAV = [
  {id:"dashboard",label:"Dashboard",icon:LayoutDashboard},
  {id:"recommend",label:"Recommendations",icon:Sparkles},
  {id:"catalog",label:"Item Catalog",icon:Package},
  {id:"architecture",label:"Architecture",icon:Brain},
  {id:"training",label:"Training",icon:GitBranch},
  {id:"analysis",label:"Performance",icon:BarChart3},
  {id:"compare",label:"Model Comparison",icon:GitCompare},
  {id:"datasets",label:"Datasets",icon:Database},
  {id:"explorer",label:"Paper Explorer",icon:Telescope},
];
const TABLE2 = [
  {m:"MF",ml1m_auc:.6482,ml1m_uauc:.6361,ml1m_ndcg:.8447,book_auc:.7134,book_uauc:.5565,book_ndcg:.8194,type:"collab"},
  {m:"LightGCN",ml1m_auc:.5959,ml1m_uauc:.6499,ml1m_ndcg:.8564,book_auc:.7103,book_uauc:.5639,book_ndcg:.8245,type:"collab"},
  {m:"SASRec",ml1m_auc:.7078,ml1m_uauc:.6884,ml1m_ndcg:.8612,book_auc:.6887,book_uauc:.5714,book_ndcg:.8244,type:"collab"},
  {m:"DIN",ml1m_auc:.7166,ml1m_uauc:.6459,ml1m_ndcg:.8496,book_auc:.8163,book_uauc:.6145,book_ndcg:.8419,type:"collab"},
  {m:"CTRL (DIN)",ml1m_auc:.7159,ml1m_uauc:.6492,ml1m_ndcg:.8483,book_auc:.8202,book_uauc:.5996,book_ndcg:.8412,type:"lm+collab"},
  {m:"ICL",ml1m_auc:.5320,ml1m_uauc:.5268,ml1m_ndcg:.8114,book_auc:.4820,book_uauc:.4856,book_ndcg:.7917,type:"llmrec"},
  {m:"TALLRec",ml1m_auc:.7097,ml1m_uauc:.6818,ml1m_ndcg:.8711,book_auc:.7375,book_uauc:.5983,book_ndcg:.8361,type:"llmrec"},
  {m:"CoLLM-MF",ml1m_auc:.7295,ml1m_uauc:.6875,ml1m_ndcg:.8714,book_auc:.8109,book_uauc:.6225,book_ndcg:.8457,type:"ours"},
  {m:"CoLLM-LightGCN",ml1m_auc:.7100,ml1m_uauc:.6967,ml1m_ndcg:.8740,book_auc:.8026,book_uauc:.6149,book_ndcg:.8411,type:"ours"},
  {m:"CoLLM-SASRec",ml1m_auc:.7235,ml1m_uauc:.6990,ml1m_ndcg:.8765,book_auc:.7746,book_uauc:.5962,book_ndcg:.8361,type:"ours"},
  {m:"CoLLM-DIN",ml1m_auc:.7353,ml1m_uauc:.6923,ml1m_ndcg:.8735,book_auc:.8245,book_uauc:.6474,book_ndcg:.8550,type:"ours"},
];

/* ── SHARED STYLES ──────────────────────────────────────────────── */
const primaryBtn  = {background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",borderRadius:10,padding:"10px 20px",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,fontFamily:"inherit"};
const secondaryBtn= {background:"rgba(99,102,241,.1)",border:`1px solid rgba(99,102,241,0.18)`,borderRadius:8,padding:"8px 14px",color:"#6366f1",fontWeight:600,fontSize:12,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,fontFamily:"inherit"};
const btnSmall    = {background:"rgba(255,255,255,.06)",border:`1px solid rgba(99,102,241,0.18)`,borderRadius:8,padding:"7px 9px",color:"#64748b",cursor:"pointer",display:"flex",alignItems:"center",fontFamily:"inherit"};
const inputStyle  = {background:"rgba(255,255,255,.06)",border:`1px solid rgba(99,102,241,0.18)`,borderRadius:8,padding:"8px 12px",color:"#f8fafc",fontSize:13,width:"100%",outline:"none",fontFamily:"inherit"};
const tabBtn      = a => ({padding:"6px 14px",borderRadius:8,border:`1px solid`,borderColor:a?C.primary:C.border,background:a?C.primary+"22":"transparent",color:a?C.primary:C.muted,fontSize:12,fontWeight:a?700:400,cursor:"pointer",fontFamily:"inherit"});
const modelBtn    = a => ({padding:"8px 12px",borderRadius:8,border:`1px solid`,borderColor:a?C.primary:C.border,background:a?C.primary+"22":"transparent",color:a?C.primary:C.muted,fontSize:12,fontWeight:a?700:400,cursor:"pointer",fontFamily:"inherit",width:"100%",textAlign:"left"});

/* ── UTILITIES ──────────────────────────────────────────────────── */
function dlCSV(data,name){
  if(!data?.length)return;
  const keys=Object.keys(data[0]);
  const csv=[keys.join(","),...data.map(r=>keys.map(k=>JSON.stringify(r[k]??"")).join(","))].join("\n");
  const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})),download:name});
  document.body.appendChild(a);a.click();document.body.removeChild(a);
}
function dlJSON(data,name){
  const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"})),download:name});
  document.body.appendChild(a);a.click();document.body.removeChild(a);
}
function dlBlob(url,name,toast){
  fetch(url).then(r=>r.blob()).then(b=>{
    const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(b),download:name});
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    toast&&toast(name+" downloaded!","success");
  });
}

/* ── HOOKS ──────────────────────────────────────────────────────── */
function useApi(){
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const call=useCallback(async(path,opts={})=>{
    setLoading(true);setError(null);
    try{
      const r=await fetch(`${API}${path}`,{headers:{"Content-Type":"application/json"},...opts});
      if(!r.ok)throw new Error(`${r.status}`);
      const d=await r.json();setLoading(false);return d;
    }catch(e){setError(e.message);setLoading(false);throw e;}
  },[]);
  return{call,loading,error};
}

/* ── TOAST ──────────────────────────────────────────────────────── */
const ToastCtx=React.createContext(null);
function ToastProvider({children}){
  const[toasts,setToasts]=useState([]);
  const add=useCallback((msg,type="success")=>{
    const id=Date.now();
    setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3000);
  },[]);
  const col=t=>t.type==="error"?C.danger:t.type==="warn"?C.warning:C.success;
  return(
    <ToastCtx.Provider value={add}>
      {children}
      <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:8}}>
        {toasts.map(t=>(
          <div key={t.id} style={{background:"rgba(6,9,20,.97)",border:`1px solid ${col(t)}44`,borderRadius:10,padding:"10px 16px",display:"flex",alignItems:"center",gap:10,color:C.light,fontSize:13,fontWeight:500,boxShadow:"0 8px 32px rgba(0,0,0,.5)",minWidth:220,animation:"fadeIn .2s ease"}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:col(t),boxShadow:`0 0 8px ${col(t)}`}}/>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast=()=>React.useContext(ToastCtx);

/* ── TINY COMPONENTS ────────────────────────────────────────────── */
const Spin=({sz=16})=><span style={{display:"inline-flex",animation:"spin .8s linear infinite"}}><Loader size={sz}/></span>;
const Badge=({children,color=C.primary,bg})=><span style={{background:bg||color+"22",color,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700,letterSpacing:".3px"}}>{children}</span>;
const Card=({children,style={},glow=false})=><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 24px",backdropFilter:"blur(12px)",boxShadow:glow?"0 0 32px rgba(99,102,241,.18)":"0 4px 24px rgba(0,0,0,.3)",...style}}>{children}</div>;
const Skel=({h=20,w="100%",s={}})=><div style={{height:h,width:w,background:"rgba(255,255,255,.05)",borderRadius:6,animation:"shimmer 1.5s infinite",...s}}/>;
const Prog=({v,color=C.primary,h=6})=>(
  <div style={{background:"rgba(255,255,255,.06)",borderRadius:99,height:h,overflow:"hidden"}}>
    <div style={{width:`${Math.min(100,v)}%`,height:"100%",background:`linear-gradient(90deg,${color},${color}cc)`,borderRadius:99,transition:"width .5s ease"}}/>
  </div>
);
const Tip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(
    <div style={{background:"rgba(6,9,20,.97)",border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",fontSize:12,fontFamily:"'Inter',sans-serif"}}>
      {label&&<div style={{color:C.muted,marginBottom:6,fontSize:11}}>{label}</div>}
      {payload.map((p,i)=><div key={i} style={{color:p.color||C.primary,marginBottom:2}}>{p.name}: <strong>{typeof p.value==="number"?p.value.toFixed(4):p.value}</strong></div>)}
    </div>
  );
};
const Ring=({pct})=>{
  const r=18,c=2*Math.PI*r,d=c*(pct/100);
  const col=pct>80?C.success:pct>60?C.primary:C.warning;
  return(
    <div style={{position:"relative",width:52,height:52,flexShrink:0}}>
      <svg width={52} height={52} style={{transform:"rotate(-90deg)"}}>
        <circle cx={26} cy={26} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={4}/>
        <circle cx={26} cy={26} r={r} fill="none" stroke={col} strokeWidth={4} strokeDasharray={`${d} ${c}`} strokeLinecap="round" style={{transition:"stroke-dasharray .5s ease"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:col}}>{pct}%</div>
    </div>
  );
};
const PageHdr=({icon,title,sub,action})=>(
  <div style={{marginBottom:24,display:"flex",alignItems:"flex-start"}}>
    <div style={{flex:1}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}><span style={{color:C.primary}}>{icon}</span><h1 style={{fontSize:22,fontWeight:800,color:C.light,margin:0}}>{title}</h1></div>
      <p style={{color:C.muted,fontSize:13,margin:0}}>{sub}</p>
    </div>
    {action&&<div style={{flexShrink:0,marginLeft:12}}>{action}</div>}
  </div>
);
const SecTitle=({icon,title,action})=>(
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
    <span style={{color:C.primary}}>{icon}</span>
    <span style={{fontWeight:700,fontSize:14,color:C.light,flex:1}}>{title}</span>
    {action}
  </div>
);
const SliderRow=({label,val,setVal,min,max,step=1})=>(
  <label style={{display:"flex",flexDirection:"column",gap:6}}>
    <span style={{fontSize:12,color:C.muted}}>{label}: <strong style={{color:C.light}}>{val}</strong></span>
    <input type="range" min={min} max={max} step={step} value={val} onChange={e=>setVal(+e.target.value)} style={{width:"100%",accentColor:C.primary}}/>
  </label>
);
const AnimCnt=({end=0,decimals=0,duration=1200})=>{
  const[v,setV]=useState(0);
  useEffect(()=>{let s=null;const t=ts=>{if(!s)s=ts;const p=Math.min((ts-s)/duration,1);setV(+(p*end).toFixed(decimals));if(p<1)requestAnimationFrame(t);};requestAnimationFrame(t);},[end,decimals,duration]);
  return<>{decimals?v.toFixed(decimals):v.toLocaleString()}</>;
};
const Empty=({icon:Icon=Database,text="No data yet",sub})=>(
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:60,gap:12,textAlign:"center"}}>
    <Icon size={44} color={C.border}/>
    <div style={{color:C.muted,fontWeight:600}}>{text}</div>
    {sub&&<div style={{fontSize:12,color:C.muted,opacity:.7}}>{sub}</div>}
  </div>
);

/* ── PARTICLES ──────────────────────────────────────────────────── */
function Particles({count=40}){
  const ref=useRef(null);
  useEffect(()=>{
    const cv=ref.current;if(!cv)return;
    const ctx=cv.getContext("2d");
    const resize=()=>{cv.width=window.innerWidth;cv.height=window.innerHeight;};
    resize();window.addEventListener("resize",resize);
    const pts=Array.from({length:count},()=>({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,r:Math.random()*1.6+.6,op:Math.random()*.25+.06}));
    let af;
    const draw=()=>{
      ctx.clearRect(0,0,cv.width,cv.height);
      pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>cv.width)p.vx*=-1;if(p.y<0||p.y>cv.height)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(99,102,241,${p.op})`;ctx.fill();});
      pts.forEach((a,i)=>pts.slice(i+1).forEach(b=>{const d=Math.hypot(a.x-b.x,a.y-b.y);if(d<120){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`rgba(99,102,241,${.06*(1-d/120)})`;ctx.stroke();}}));
      af=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(af);window.removeEventListener("resize",resize);};
  },[count]);
  return<canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>;
}

/* ── SIDEBAR ────────────────────────────────────────────────────── */
function Sidebar({active,setActive,collapsed,setCollapsed}){
  return(
    <nav style={{width:collapsed?64:250,background:"rgba(5,8,18,.97)",backdropFilter:"blur(20px)",borderRight:`1px solid ${C.border}`,padding:collapsed?"16px 8px":"18px 12px",display:"flex",flexDirection:"column",position:"fixed",height:"100vh",zIndex:200,transition:"width .25s ease",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,padding:"0 4px"}}>
        <div style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",borderRadius:10,width:36,height:36,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}><Brain size={20} color="#fff"/></div>
        {!collapsed&&(
          <div style={{flex:1}}>
            <div style={{fontWeight:900,fontSize:16,background:"linear-gradient(90deg,#6366f1,#a855f7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>CoLLM</div>
            <div style={{fontSize:9,color:C.muted,letterSpacing:1,marginTop:1}}>RESEARCH PLATFORM</div>
          </div>
        )}
        <button onClick={()=>setCollapsed(!collapsed)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",padding:4,flexShrink:0}}><Menu size={15}/></button>
      </div>
      {!collapsed&&<div style={{fontSize:10,color:C.muted,padding:"6px 8px 4px",letterSpacing:.8}}>NAVIGATION</div>}
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:2,overflowY:"auto",overflowX:"hidden"}}>
        {NAV.map(n=>{
          const on=active===n.id;
          return(
            <button key={n.id} onClick={()=>setActive(n.id)} title={collapsed?n.label:undefined}
              style={{display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px 0":"8px 12px",justifyContent:collapsed?"center":"flex-start",borderRadius:10,border:"none",cursor:"pointer",background:on?"linear-gradient(90deg,rgba(99,102,241,.2),rgba(139,92,246,.06))":"transparent",color:on?C.primary:C.muted,fontSize:13,fontWeight:on?700:400,transition:"all .15s",borderLeft:on?`2px solid ${C.primary}`:"2px solid transparent",fontFamily:"inherit"}}>
              <n.icon size={17} style={{flexShrink:0}}/>
              {!collapsed&&<><span style={{flex:1,textAlign:"left"}}>{n.label}</span>{on&&<ChevronRight size={12}/>}</>}
            </button>
          );
        })}
      </div>
      {!collapsed&&(
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:8,padding:"10px 8px 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:C.success,boxShadow:`0 0 6px ${C.success}`}}/>
            <span style={{fontSize:11,color:C.muted}}>Backend Online</span>
            <span style={{marginLeft:"auto",fontSize:10,color:C.muted,fontFamily:"monospace"}}>v5</span>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ── LANDING PAGE ───────────────────────────────────────────────── */
function LandingPage({onEnter}){
  const feats=[
    {icon:Layers,color:C.primary,title:"Hybrid Encoding",desc:"Collaborative filtering signals fused into LLM token space via the CIE module — unlike any prior LLMRec approach."},
    {icon:GitBranch,color:C.secondary,title:"Two-Step Training",desc:"Step 1 LoRA text fine-tuning builds cold-start strength. Step 2 CIE alignment adds warm-start superiority."},
    {icon:TrendingUp,color:C.success,title:"SOTA Performance",desc:"Best AUC 0.8245 on Amazon-Book, 0.7353 on ML-1M. +15% cold-start over collaborative baselines."},
    {icon:Cpu,color:C.accent,title:"Plug-in CIE",desc:"Supports MF, LightGCN, SASRec, DIN as collaborative backbone — no LLM retraining needed."},
    {icon:ShieldCheck,color:C.info,title:"Parameter Efficient",desc:"LoRA r=8 updates only 0.1% of weights. CIE is a 3-layer MLP. Minimal overhead over TALLRec."},
    {icon:Gauge,color:C.warning,title:"Production API",desc:"FastAPI backend — recommendations, training, analytics, export. Full REST + WebSocket support."},
  ];
  return(
    <div style={{minHeight:"100vh",background:C.darker,color:C.light,fontFamily:"'Inter',sans-serif",position:"relative",overflow:"hidden"}}>
      <Particles count={55}/>
      <header style={{position:"relative",zIndex:10,display:"flex",alignItems:"center",padding:"18px 44px",borderBottom:`1px solid ${C.border}`,backdropFilter:"blur(8px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center"}}><Brain size={18} color="#fff"/></div>
          <span style={{fontWeight:900,fontSize:17,background:"linear-gradient(90deg,#6366f1,#a855f7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>CoLLM</span>
          <span style={{fontSize:11,color:C.muted,marginLeft:4}}>arXiv:2310.19488</span>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:10,alignItems:"center"}}>
          <a href="https://arxiv.org/abs/2310.19488" target="_blank" rel="noreferrer" style={{...secondaryBtn,textDecoration:"none",padding:"7px 14px",fontSize:12}}>📄 Paper</a>
          <a href="https://github.com/zyang1580/CoLLM" target="_blank" rel="noreferrer" style={{...secondaryBtn,textDecoration:"none",padding:"7px 14px",fontSize:12}}>⬡ GitHub</a>
          <button onClick={onEnter} style={{...primaryBtn,padding:"9px 22px",fontSize:13}}><LayoutDashboard size={15}/> Launch Dashboard</button>
        </div>
      </header>

      <section style={{position:"relative",zIndex:5,textAlign:"center",padding:"80px 44px 60px",maxWidth:960,margin:"0 auto"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(99,102,241,.1)",border:`1px solid ${C.primary}33`,borderRadius:20,padding:"5px 16px",marginBottom:26}}>
          <Sparkles size={13} color={C.accent}/>
          <span style={{fontSize:12,color:C.accent,fontWeight:600}}>USTC + Meta AI · arXiv:2310.19488 · 2025</span>
        </div>
        <h1 style={{fontSize:68,fontWeight:900,lineHeight:1.05,margin:"0 0 16px",letterSpacing:-2}}>
          <span style={{background:"linear-gradient(135deg,#6366f1 0%,#a855f7 50%,#ec4899 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>CoLLM</span>
        </h1>
        <h2 style={{fontSize:24,fontWeight:700,color:"#e2e8f0",marginBottom:16,lineHeight:1.35}}>
          Integrating Collaborative Embeddings<br/>into Large Language Models for Recommendation
        </h2>
        <p style={{fontSize:16,color:C.muted,maxWidth:680,margin:"0 auto 40px",lineHeight:1.8}}>
          A novel hybrid recommendation framework that treats collaborative filtering signals as a new modality, mapped into LLM token space via CIE — achieving SOTA warm-start AND cold-start performance simultaneously.
        </p>
        <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={onEnter} style={{...primaryBtn,padding:"13px 32px",fontSize:15,borderRadius:12}}><LayoutDashboard size={18}/> Open Full Dashboard <ArrowRight size={16}/></button>
          <a href="https://arxiv.org/abs/2310.19488" target="_blank" rel="noreferrer" style={{...secondaryBtn,padding:"13px 28px",fontSize:15,textDecoration:"none",borderRadius:12}}><BookOpen size={18}/> Read Paper</a>
        </div>
      </section>

      <div style={{position:"relative",zIndex:5,display:"flex",justifyContent:"center",borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,background:"rgba(99,102,241,.04)"}}>
        {[{v:"0.8245",l:"Best AUC",s:"Amazon-Book",c:C.primary},{v:"11",l:"Models Compared",s:"All categories",c:C.secondary},{v:"+15%",l:"Cold-Start Gain",s:"vs CF baseline",c:C.success},{v:"~12%",l:"Inference Overhead",s:"Over TALLRec",c:C.accent},{v:"0.1%",l:"Trainable Params",s:"LoRA + CIE only",c:C.info}].map((s,i,a)=>(
          <div key={i} style={{flex:1,textAlign:"center",padding:"36px 16px",borderRight:i<a.length-1?`1px solid ${C.border}`:"none"}}>
            <div style={{fontSize:42,fontWeight:900,color:s.c,lineHeight:1,letterSpacing:-1}}>{s.v}</div>
            <div style={{fontSize:13,fontWeight:700,color:C.light,marginTop:6}}>{s.l}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.s}</div>
          </div>
        ))}
      </div>

      <section style={{position:"relative",zIndex:5,maxWidth:1100,margin:"0 auto",padding:"70px 44px"}}>
        <div style={{textAlign:"center",marginBottom:44}}>
          <div style={{fontSize:11,fontWeight:700,color:C.primary,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Platform Capabilities</div>
          <h3 style={{fontSize:32,fontWeight:800,margin:0}}>Everything you need to explore CoLLM</h3>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
          {feats.map((f,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,.025)",border:`1px solid ${C.border}`,borderRadius:14,padding:"22px 18px",transition:"border-color .2s"}}>
              <div style={{width:42,height:42,borderRadius:10,background:f.color+"18",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}><f.icon size={20} color={f.color}/></div>
              <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>{f.title}</div>
              <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{position:"relative",zIndex:5,borderTop:`1px solid ${C.border}`,padding:"40px 44px",textAlign:"center",background:"rgba(99,102,241,.03)"}}>
        <div style={{color:C.muted,fontSize:12,lineHeight:1.8,marginBottom:28}}>
          Yang Zhang · Fuli Feng · Jizhi Zhang · Keqin Bao · Qifan Wang · Xiangnan He<br/>
          University of Science and Technology of China · Meta AI Research · arXiv:2310.19488
        </div>
        <button onClick={onEnter} style={{...primaryBtn,padding:"12px 32px",fontSize:14}}><LayoutDashboard size={16}/> Open Research Dashboard</button>
      </div>
    </div>
  );
}

/* ── DASHBOARD ──────────────────────────────────────────────────── */
function Dashboard(){
  const{call}=useApi();
  const[stats,setStats]=useState(null);
  const[wc,setWc]=useState([]);
  const[cold,setCold]=useState([]);
  useEffect(()=>{
    call("/stats").then(setStats).catch(()=>{});
    call("/analytics/warm-cold").then(d=>setWc(d.data||[])).catch(()=>{});
    call("/analytics/cold-start").then(d=>setCold(d.data||[])).catch(()=>{});
  },[call]);
  const radar=[
    {m:"Warm AUC",MF:.65,TALLRec:.71,CoLLM:.74},{m:"Cold AUC",MF:.71,TALLRec:.74,CoLLM:.82},
    {m:"UAUC",MF:.64,TALLRec:.68,CoLLM:.70},{m:"NDCG@10",MF:.84,TALLRec:.87,CoLLM:.88},
    {m:"Efficiency",MF:.95,TALLRec:.60,CoLLM:.85},{m:"Cold-Start",MF:.30,TALLRec:.90,CoLLM:.88},
  ];
  const perf=[
    {name:"MF",auc:.6482,uauc:.6361},{name:"LightGCN",auc:.5959,uauc:.6499},
    {name:"SASRec",auc:.7078,uauc:.6884},{name:"DIN",auc:.7166,uauc:.6459},
    {name:"TALLRec",auc:.7097,uauc:.6818},{name:"CoLLM-DIN",auc:.7353,uauc:.6923},
  ];
  return(
    <div>
      <PageHdr icon={<LayoutDashboard size={22}/>} title="Dashboard" sub="Real-time overview of the CoLLM recommendation research platform"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginBottom:22}}>
        {[
          {icon:Users,label:"Demo Users",val:<AnimCnt end={stats?.num_users??1000}/>,sub:"Synthetic profiles",color:C.primary},
          {icon:BookOpen,label:"Catalog Items",val:<AnimCnt end={stats?.num_items??5000}/>,sub:"Title+genre+year",color:C.secondary},
          {icon:Database,label:"Interactions",val:<AnimCnt end={stats?.num_interactions??15000}/>,sub:"User-item signals",color:C.accent},
          {icon:Award,label:"Best AUC",val:"0.8245",sub:"CoLLM-DIN · Amazon",color:C.success},
          {icon:TrendingUp,label:"Cold-Start Gain",val:"+15%",sub:"vs CF baseline",color:C.info},
          {icon:Gauge,label:"Infer Overhead",val:"~12%",sub:"Over TALLRec",color:C.warning},
        ].map((s,i)=>(
          <Card key={i} style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{background:s.color+"22",color:s.color,borderRadius:12,width:46,height:46,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><s.icon size={21}/></div>
            <div>
              <div style={{fontSize:24,fontWeight:800,color:C.light,lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{s.label}</div>
              <div style={{fontSize:10,color:s.color,marginTop:1}}>{s.sub}</div>
            </div>
          </Card>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
        <Card>
          <SecTitle icon={<BarChart3 size={16}/>} title="Model Performance Overview"/>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={perf} margin={{top:8,right:8,left:-14,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:10}} angle={-15} textAnchor="end" height={36}/>
              <YAxis domain={[0.5,.78]} tick={{fill:C.muted,fontSize:10}}/>
              <Tooltip content={<Tip/>}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="auc" fill={C.primary} name="AUC" radius={[4,4,0,0]}/>
              <Bar dataKey="uauc" fill={C.secondary} name="UAUC" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SecTitle icon={<Network size={16}/>} title="Capability Radar — MF vs TALLRec vs CoLLM"/>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radar}>
              <PolarGrid stroke="rgba(255,255,255,.05)"/>
              <PolarAngleAxis dataKey="m" tick={{fill:C.muted,fontSize:10}}/>
              <PolarRadiusAxis domain={[0,1]} tick={false}/>
              <Radar name="MF" dataKey="MF" stroke={C.primary} fill={C.primary} fillOpacity={.1} strokeWidth={1.5}/>
              <Radar name="TALLRec" dataKey="TALLRec" stroke={C.secondary} fill={C.secondary} fillOpacity={.1} strokeWidth={1.5}/>
              <Radar name="CoLLM" dataKey="CoLLM" stroke={C.success} fill={C.success} fillOpacity={.22} strokeWidth={2.5}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Tooltip content={<Tip/>}/>
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
        <Card>
          <SecTitle icon={<Activity size={16}/>} title="Warm vs Cold Scenario AUC"/>
          {wc.length>0?<ResponsiveContainer width="100%" height={210}>
            <BarChart data={wc} layout="vertical" margin={{left:8,right:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
              <XAxis type="number" domain={[0.45,.86]} tick={{fill:C.muted,fontSize:10}}/>
              <YAxis dataKey="scenario" type="category" width={105} tick={{fill:C.muted,fontSize:10}}/>
              <Tooltip content={<Tip/>}/><Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="MF" fill={C.primary} name="MF" radius={[0,4,4,0]}/>
              <Bar dataKey="TALLRec" fill={C.secondary} name="TALLRec" radius={[0,4,4,0]}/>
              <Bar dataKey="CoLLM" fill={C.success} name="CoLLM" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>:<Skel h={210}/>}
        </Card>
        <Card>
          <SecTitle icon={<TrendingUp size={16}/>} title="Cold-Start Robustness vs % Cold Users"/>
          {cold.length>0?<ResponsiveContainer width="100%" height={210}>
            <LineChart data={cold}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
              <XAxis dataKey="pct_cold" tickFormatter={v=>`${v}%`} tick={{fill:C.muted,fontSize:10}}/>
              <YAxis domain={[0.5,.78]} tick={{fill:C.muted,fontSize:10}}/>
              <Tooltip content={<Tip/>}/><Legend wrapperStyle={{fontSize:11}}/>
              <Line type="monotone" dataKey="MF" stroke={C.primary} strokeWidth={2} dot={false} name="MF"/>
              <Line type="monotone" dataKey="TALLRec" stroke={C.secondary} strokeWidth={2} dot={false} name="TALLRec"/>
              <Line type="monotone" dataKey="CoLLM" stroke={C.success} strokeWidth={2.5} dot={false} name="CoLLM"/>
            </LineChart>
          </ResponsiveContainer>:<Skel h={210}/>}
        </Card>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
        {[{l:"CoLLM-DIN",ml:.7353,bk:.8245,c:C.success,t:"Best Overall"},{l:"CoLLM-SASRec",ml:.7235,bk:.7746,c:C.primary,t:"Sequential"},{l:"CoLLM-MF",ml:.7295,bk:.8109,c:C.secondary,t:"Lightweight"}].map((m,i)=>(
          <Card key={i} style={{borderColor:m.c+"44"}}>
            <Badge color={m.c}>{m.t}</Badge>
            <div style={{fontWeight:800,fontSize:15,color:m.c,margin:"10px 0 12px"}}>{m.l}</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:C.muted}}>ML-1M AUC</span><strong>{m.ml}</strong></div><Prog v={m.ml*100} color={m.c}/></div>
              <div><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:C.muted}}>Amazon AUC</span><strong>{m.bk}</strong></div><Prog v={m.bk*100} color={m.c}/></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── RECOMMENDATIONS ────────────────────────────────────────────── */
function Recommendations(){
  const{call,loading,error}=useApi();
  const toast=useToast();
  const[uid,setUid]=useState(42);
  const[num,setNum]=useState(8);
  const[mdl,setMdl]=useState("mf");
  const[result,setResult]=useState(null);
  const[hist,setHist]=useState([]);
  const[genre,setGenre]=useState("");
  const fetchHist=useCallback(u=>{call(`/users/${u}/history?limit=12`).then(d=>setHist(d.history||[])).catch(()=>{});},[call]);
  useEffect(()=>{fetchHist(uid);},[uid,fetchHist]);
  const go=async()=>{
    try{const d=await call(`/recommend/${uid}?num=${num}&model=${mdl}`);setResult(d);toast("Recommendations generated!","success");}
    catch(e){toast("Error: "+e.message,"error");}
  };
  const recs=result?.recommendations?.filter(r=>!genre||r.genre===genre)||[];
  const GENRES=["","Action","Drama","Comedy","Sci-Fi","Romance","Thriller","Horror","Documentary","Animation","Fantasy"];
  return(
    <div>
      <PageHdr icon={<Sparkles size={22}/>} title="Smart Recommendations" sub="Personalized CoLLM-powered recommendations with confidence scoring"/>
      <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <SecTitle icon={<Settings size={14}/>} title="Configuration"/>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <label style={{display:"flex",flexDirection:"column",gap:6}}>
                <span style={{fontSize:12,color:C.muted}}>User ID (0–999)</span>
                <div style={{display:"flex",gap:8}}>
                  <input type="number" value={uid} onChange={e=>setUid(+e.target.value)} min={0} max={999} style={inputStyle}/>
                  <button onClick={()=>{const u=Math.floor(Math.random()*500);setUid(u);fetchHist(u);}} style={btnSmall}><RefreshCw size={14}/></button>
                </div>
              </label>
              <SliderRow label="Count" val={num} setVal={setNum} min={1} max={20}/>
              <div>
                <div style={{fontSize:12,color:C.muted,marginBottom:8}}>Backbone Model</div>
                {["mf","lightgcn","sasrec","din"].map((m,i)=>(
                  <button key={m} onClick={()=>setMdl(m)} style={{...modelBtn(m===mdl),marginBottom:4}}>
                    <span style={{fontWeight:700}}>{m.toUpperCase()}</span> — <span style={{opacity:.7,fontSize:11}}>{["Matrix Factorization","Light Graph Conv","Sequential Attn","Deep Interest Net"][i]}</span>
                  </button>
                ))}
              </div>
              <button onClick={go} disabled={loading} style={{...primaryBtn,justifyContent:"center",width:"100%",marginTop:4}}>
                {loading?<Spin/>:<Sparkles size={15}/>} {loading?"Generating…":"Get Recommendations"}
              </button>
              {error&&<div style={{fontSize:12,color:C.danger,display:"flex",gap:6,alignItems:"center"}}><AlertCircle size={13}/>{error}</div>}
            </div>
          </Card>
          {hist.length>0&&(
            <Card>
              <SecTitle icon={<Clock size={14}/>} title={`User ${uid} History (${hist.length})`}/>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {hist.map(item=>(
                  <div key={item.item_id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:8,background:"rgba(255,255,255,.03)"}}>
                    <Star size={11} color={C.accent}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,color:C.light,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
                      <div style={{fontSize:10,color:C.muted}}>{item.genre} · {item.year}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
        <div>
          {result?(
            <Card>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>User {result.user_id} · {mdl.toUpperCase()}</div>
                  <div style={{fontSize:12,color:C.muted}}>History: {result.history_count} · {result.latency_ms}ms · {result.trained?"Trained":"Untrained"}</div>
                </div>
                <select value={genre} onChange={e=>setGenre(e.target.value)} style={{...inputStyle,width:"auto",padding:"6px 10px",fontSize:12}}>
                  {GENRES.map(g=><option key={g} value={g}>{g||"All Genres"}</option>)}
                </select>
                <button onClick={()=>{dlCSV(recs,"recommendations.csv");toast("CSV downloaded!");}} style={secondaryBtn}><Download size={13}/> CSV</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {recs.map((rec,i)=>(
                  <div key={rec.item_id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:12,background:"rgba(255,255,255,.03)",border:`1px solid ${i===0?C.primary+"44":C.border}`,animation:"fadeIn .3s ease both",animationDelay:`${i*.04}s`}}>
                    <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${C.primary}44,${C.secondary}44)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:C.primary,fontSize:13,flexShrink:0}}>#{i+1}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:14,color:C.light,marginBottom:4}}>{rec.title}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        <Badge color={C.muted} bg="rgba(255,255,255,.07)">{rec.genre}</Badge>
                        <Badge color={C.muted} bg="rgba(255,255,255,.07)">{rec.year}</Badge>
                        <Badge color={C.accent} bg="rgba(245,158,11,.1)">★ {rec.rating}</Badge>
                      </div>
                    </div>
                    <Ring pct={+(rec.confidence*100).toFixed(1)}/>
                  </div>
                ))}
                {recs.length===0&&<Empty icon={Filter} text="No items match this genre filter" sub="Try \"All Genres\""/>}
              </div>
            </Card>
          ):(
            <Card style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:380,gap:14,textAlign:"center"}}>
              <Sparkles size={52} color={C.border}/>
              <div style={{color:C.muted,maxWidth:280,lineHeight:1.8}}>Configure a user + model on the left, then click <strong style={{color:C.light}}>Get Recommendations</strong> to see CoLLM predictions with confidence rings.</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── ITEM CATALOG ───────────────────────────────────────────────── */
function ItemCatalog(){
  const{call,loading}=useApi();
  const toast=useToast();
  const[items,setItems]=useState([]);
  const[total,setTotal]=useState(0);
  const[q,setQ]=useState("");
  const[genre,setGenre]=useState("");
  const[sort,setSort]=useState("popularity");
  const[page,setPage]=useState(0);
  const[sel,setSel]=useState(null);
  const PER=24;
  const load=useCallback(()=>{
    const p=new URLSearchParams({limit:PER,offset:page*PER,sort});
    if(q)p.append("q",q);if(genre)p.append("genre",genre);
    call(`/items?${p}`).then(d=>{setItems(d.items||[]);setTotal(d.total||0);}).catch(()=>{});
  },[call,q,genre,sort,page]);
  useEffect(()=>{load();},[load]);
  const GENRES=["","Action","Drama","Comedy","Sci-Fi","Romance","Thriller","Horror","Documentary","Animation","Fantasy"];
  const pages=Math.ceil(total/PER);
  return(
    <div>
      <PageHdr icon={<Package size={22}/>} title="Item Catalog" sub={`Browse ${total.toLocaleString()} synthetic catalogue items`}
        action={<button onClick={()=>dlBlob(`${API}/export/items`,"catalog_sample.csv",toast)} style={secondaryBtn}><Download size={13}/> Export Sample</button>}/>
      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:180,background:"rgba(255,255,255,.04)",borderRadius:8,padding:"0 10px"}}>
            <Search size={14} color={C.muted}/>
            <input placeholder="Search titles…" value={q} onChange={e=>{setQ(e.target.value);setPage(0);}} style={{...inputStyle,background:"transparent",border:"none",outline:"none"}}/>
            {q&&<button onClick={()=>{setQ("");setPage(0);}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",padding:0,display:"flex"}}><X size={14}/></button>}
          </div>
          <select value={genre} onChange={e=>{setGenre(e.target.value);setPage(0);}} style={{...inputStyle,width:"auto",padding:"8px 12px"}}>
            {GENRES.map(g=><option key={g} value={g}>{g||"All Genres"}</option>)}
          </select>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{...inputStyle,width:"auto",padding:"8px 12px"}}>
            {[["popularity","Most Popular"],["rating","Top Rated"],["year","Newest"],["title","A–Z"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </Card>
      {loading&&!items.length?(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:12}}>
          {Array(12).fill(0).map((_,i)=><Skel key={i} h={130}/>)}
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:12,marginBottom:16}}>
          {items.map(item=>(
            <Card key={item.item_id} style={{padding:"14px 16px",cursor:"pointer",borderColor:sel?.item_id===item.item_id?C.primary:C.border,transition:"border-color .2s"}} onClick={()=>setSel(item)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <Badge color={MC[item.genre]||C.muted} bg={(MC[item.genre]||C.muted)+"22"}>{item.genre}</Badge>
                <span style={{fontSize:10,color:C.muted}}>#{item.item_id}</span>
              </div>
              <div style={{fontWeight:700,fontSize:13,color:C.light,marginBottom:6,lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{item.title}</div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginBottom:8}}>
                <span>{item.year}</span><span style={{color:C.accent}}>★ {item.rating}</span>
              </div>
              <Prog v={item.popularity/10} color={C.primary} h={3}/>
            </Card>
          ))}
        </div>
      )}
      <div style={{display:"flex",alignItems:"center",gap:12,justifyContent:"center",marginTop:8}}>
        <button disabled={page===0} onClick={()=>setPage(p=>p-1)} style={{...btnSmall,opacity:page===0?.4:1}}><ChevronLeft size={15}/></button>
        <span style={{fontSize:13,color:C.muted}}>Page {page+1} / {pages} · {total.toLocaleString()} items</span>
        <button disabled={page>=pages-1} onClick={()=>setPage(p=>p+1)} style={{...btnSmall,opacity:page>=pages-1?.4:1}}><ChevronRight size={15}/></button>
      </div>
      {sel&&(
        <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.75)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setSel(null)}>
          <div style={{background:"rgba(8,12,26,.98)",border:`1px solid ${C.border}`,borderRadius:18,padding:30,maxWidth:420,width:"100%",margin:20}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
              <Badge color={MC[sel.genre]||C.muted} bg={(MC[sel.genre]||C.muted)+"22"}>{sel.genre}</Badge>
              <button onClick={()=>setSel(null)} style={btnSmall}><X size={15}/></button>
            </div>
            <h2 style={{fontSize:20,fontWeight:800,marginBottom:16,lineHeight:1.35}}>{sel.title}</h2>
            {[["Item ID",`#${sel.item_id}`],["Year",sel.year],["Rating",`★ ${sel.rating}`],["Popularity",sel.popularity],["Views",sel.views?.toLocaleString()]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}>
                <span style={{color:C.muted}}>{k}</span><strong>{v}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ARCHITECTURE ───────────────────────────────────────────────── */
function Architecture(){
  const steps=[
    {t:"Prompt",icon:Layers,c:C.primary,d:"HisItemTitleList + <UserID> + TargetItemTitle + <TargetItemID>",items:["Text history","<UserID>","TargetTitle","<TargetItemID>"]},
    {t:"Tokenize",icon:Database,c:C.secondary,d:"BPE tokenization + embedding lookup for all text tokens",items:["BPE tokens","Embedding lookup","Positional enc","Attn mask"]},
    {t:"CIE Module",icon:Cpu,c:C.accent,d:"CF embeddings (d₁=128) → LLM space (d₂=768) via 3-layer MLP",items:["CF model","Linear 128→512","LayerNorm+ReLU","Linear 512→768"]},
    {t:"Fusion",icon:GitBranch,c:C.success,d:"Concatenate [collab_user, text_tokens, collab_item] as unified sequence",items:["[collab_u,text]","[text,collab_i]","Unified mask","Same dim d₂"]},
    {t:"LLM+LoRA",icon:Brain,c:C.info,d:"Frozen Vicuna-7B + LoRA adapters r=8 on q_proj and v_proj",items:["Frozen LLM","LoRA r=8 α=16","~0.1% trainable","q/v_proj only"]},
    {t:"Output",icon:Award,c:C.danger,d:"Binary Yes/No prediction → interaction probability via BCE loss",items:["CLS pooling","Linear→ReLU","Sigmoid","BCE loss"]},
  ];
  return(
    <div>
      <PageHdr icon={<Brain size={22}/>} title="Model Architecture" sub="CoLLM two-step hybrid encoding — collaborative modality bridged into LLM via CIE module"/>
      <Card style={{marginBottom:18}}>
        <SecTitle icon={<Network size={16}/>} title="Full Information Flow"/>
        <div style={{display:"flex",alignItems:"stretch",gap:0,overflowX:"auto",paddingBottom:6}}>
          {steps.map((s,i)=>(
            <React.Fragment key={i}>
              <div style={{flex:"0 0 148px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"0 4px"}}>
                <div style={{width:46,height:46,borderRadius:12,background:s.c+"22",border:`1px solid ${s.c}44`,display:"flex",alignItems:"center",justifyContent:"center"}}><s.icon size={20} color={s.c}/></div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.light,marginBottom:3}}>{s.t}</div>
                  <div style={{fontSize:9,color:C.muted,lineHeight:1.5}}>{s.d}</div>
                </div>
                <div style={{width:"100%",display:"flex",flexDirection:"column",gap:3}}>
                  {s.items.map((it,j)=><div key={j} style={{fontSize:9,color:s.c,background:s.c+"11",borderRadius:4,padding:"2px 5px",textAlign:"center"}}>{it}</div>)}
                </div>
              </div>
              {i<steps.length-1&&<div style={{display:"flex",alignItems:"center",padding:"0 3px",color:C.border,flexShrink:0}}><ArrowRight size={15}/></div>}
            </React.Fragment>
          ))}
        </div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
        {[
          {step:"Step 1",title:"LoRA Fine-tuning (Text-Only)",color:C.primary,
           formula:"θ\'=argminθ\' Σ ℓ(h_{Θ̂+θ\'}(Eₜ), y)",
           items:["Frozen LLM backbone","Trainable: LoRA q/v_proj","Text-only prompts (no IDs)","Builds cold-start capability"]},
          {step:"Step 2",title:"CIE Tuning (Full Prompt)",color:C.success,
           formula:"min_Ω Σ ℓ(h_{Θ̂+θ̂\'}(E_full), y)",
           items:["Frozen LLM + LoRA adapters","Trainable: CIE MLP + collab model","Full prompt with UserID+ItemID","Adds warm-start strength"]},
        ].map((s,i)=>(
          <Card key={i} style={{borderColor:s.color+"44"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><Badge color={s.color}>{s.step}</Badge><span style={{fontWeight:700,fontSize:13}}>{s.title}</span></div>
            <div style={{background:s.color+"10",borderRadius:8,padding:"9px 12px",fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:s.color,marginBottom:12}}>{s.formula}</div>
            <ul style={{display:"flex",flexDirection:"column",gap:6}}>
              {s.items.map((t,j)=><li key={j} style={{fontSize:12,color:C.muted,display:"flex",gap:6}}><CheckCircle size={12} color={s.color} style={{flexShrink:0,marginTop:2}}/>{t}</li>)}
            </ul>
          </Card>
        ))}
      </div>
      <Card>
        <SecTitle icon={<Cpu size={15}/>} title="CIE Module — MLP Projection Chain"/>
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          {["CF Model (128)","Linear(128→512)","LayerNorm+ReLU","Linear(512→512)","LayerNorm+ReLU","Linear(512→768)","Proj(768→768)","LLM Space (768)"].map((l,i,a)=>(
            <React.Fragment key={i}>
              <div style={{background:i===0||i===a.length-1?C.success+"14":"rgba(245,158,11,.1)",border:`1px solid ${i===0||i===a.length-1?C.success+"44":C.accent+"33"}`,borderRadius:7,padding:"5px 10px",fontSize:10,color:i===0||i===a.length-1?C.success:C.accent,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap",fontWeight:i===0||i===a.length-1?700:400}}>{l}</div>
              {i<a.length-1&&<ArrowRight size={12} color={C.border} style={{flexShrink:0}}/>}
            </React.Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── TRAINING ───────────────────────────────────────────────────── */
function Training(){
  const{call,loading:aLoad}=useApi();
  const toast=useToast();
  const[col,setCol]=useState("mf");
  const[ep1,setEp1]=useState(8);
  const[ep2,setEp2]=useState(8);
  const[bs,setBs]=useState(64);
  const[status,setStatus]=useState(null);
  const[raw,setRaw]=useState({step1:[],step2:[]});
  const[disp,setDisp]=useState({step1:[],step2:[]});
  const[replaying,setReplaying]=useState(false);
  const[logs,setLogs]=useState([]);
  useEffect(()=>{
    if(!raw.step1.length&&!raw.step2.length)return;
    setDisp({step1:[],step2:[]});setReplaying(true);
    const all=[...raw.step1.map(s=>({...s,ph:"s1"})),...raw.step2.map(s=>({...s,ph:"s2"}))];
    let i=0;
    const iv=setInterval(()=>{
      if(i>=all.length){clearInterval(iv);setReplaying(false);return;}
      const s=all[i];
      if(s.ph==="s1")setDisp(p=>({...p,step1:[...p.step1,s]}));
      else setDisp(p=>({...p,step2:[...p.step2,s]}));
      i++;
    },160);
    return()=>clearInterval(iv);
  },[raw]);
  const start=async()=>{
    setLogs([]);setStatus({type:"running"});setRaw({step1:[],step2:[]});
    try{
      const r=await call("/training/start",{method:"POST",body:JSON.stringify({collab_type:col,epochs_step1:ep1,epochs_step2:ep2,batch_size:bs})});
      if(r?.status==="done"){setRaw({step1:r.step1||[],step2:r.step2||[]});setStatus({type:"done",final_auc:r.final_auc});setLogs(r.log||[]);toast(`Done! AUC: ${r.final_auc?.toFixed(4)}`,"success");}
    }catch(e){toast("Failed: "+e.message,"error");}
  };
  const cLoss=[...disp.step1.map(r=>({ep:`S1-${r.epoch}`,l1:r.loss})),...disp.step2.map(r=>({ep:`S2-${r.epoch}`,l2:r.loss}))];
  const cAuc=[...disp.step1.map(r=>({ep:`S1-${r.epoch}`,a1:r.val_auc})),...disp.step2.map(r=>({ep:`S2-${r.epoch}`,a2:r.val_auc}))];
  const total=ep1+ep2;
  const done=disp.step1.length+disp.step2.length;
  const pct=total>0?Math.round(done/total*100):0;
  return(
    <div>
      <PageHdr icon={<GitBranch size={22}/>} title="Training Pipeline" sub="Two-step CoLLM training: LoRA cold-start → CIE module warm-start alignment"/>
      <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <SecTitle icon={<Settings size={14}/>} title="Training Config"/>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div>
                <div style={{fontSize:12,color:C.muted,marginBottom:7}}>Collaborative Backbone</div>
                {["mf","lightgcn","sasrec","din"].map((m,i)=>(
                  <button key={m} onClick={()=>setCol(m)} style={{...modelBtn(m===col),marginBottom:4}}>
                    <strong>{m.toUpperCase()}</strong> <span style={{opacity:.7,fontSize:11}}>— {["Matrix Factorization","Light Graph Conv","Sequential Attn","Deep Interest Net"][i]}</span>
                  </button>
                ))}
              </div>
              <SliderRow label="Step 1 Epochs (LoRA)" val={ep1} setVal={setEp1} min={1} max={20}/>
              <SliderRow label="Step 2 Epochs (CIE)"  val={ep2} setVal={setEp2} min={1} max={20}/>
              <SliderRow label="Batch Size" val={bs} setVal={setBs} min={16} max={256} step={16}/>
              <button onClick={start} disabled={aLoad||replaying} style={{...primaryBtn,justifyContent:"center",width:"100%",marginTop:4}}>
                {aLoad||replaying?<Spin/>:<Play size={15}/>} {aLoad?"Training…":replaying?"Replaying…":"Start Training"}
              </button>
            </div>
          </Card>
          {(status||replaying)&&(
            <Card>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                {replaying?<Spin sz={13}/>:<div style={{width:8,height:8,borderRadius:"50%",background:status?.type==="done"?C.success:C.warning,boxShadow:`0 0 6px ${status?.type==="done"?C.success:C.warning}`}}/>}
                <span style={{fontSize:12,fontWeight:600,color:status?.type==="done"?C.success:C.primary}}>{replaying?"Replaying epochs…":status?.type==="done"?"Complete":"Running"}</span>
              </div>
              <Prog v={pct}/>
              <div style={{fontSize:11,color:C.muted,textAlign:"right",marginTop:5,marginBottom:8}}>{pct}% · {done}/{total} epochs</div>
              {status?.final_auc&&<div style={{fontSize:12}}><span style={{color:C.muted}}>Final AUC </span><strong style={{color:C.success}}>{status.final_auc.toFixed(4)}</strong></div>}
            </Card>
          )}
          {logs.length>0&&(
            <Card>
              <SecTitle icon={<Table2 size={13}/>} title="Training Log"/>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:C.muted,display:"flex",flexDirection:"column",gap:3}}>
                {logs.map((l,i)=><div key={i} style={{padding:"3px 7px",background:"rgba(255,255,255,.03)",borderRadius:5,color:l.includes("Done")||l.includes("done")?C.success:C.muted}}>{l}</div>)}
              </div>
              <button onClick={()=>{dlCSV([...disp.step1,...disp.step2],"training_metrics.csv");toast("CSV downloaded!");}} style={{...secondaryBtn,marginTop:10,width:"100%",justifyContent:"center"}}><Download size={12}/> Export Metrics</button>
            </Card>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Card>
              <SecTitle icon={<TrendingUp size={14}/>} title="Loss Curves"/>
              {cLoss.length>0?<ResponsiveContainer width="100%" height={200}><LineChart data={cLoss}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
                <XAxis dataKey="ep" tick={{fill:C.muted,fontSize:9}}/><YAxis tick={{fill:C.muted,fontSize:9}}/>
                <Tooltip content={<Tip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                <Line type="monotone" dataKey="l1" stroke={C.primary} name="Step 1 Loss" strokeWidth={2} dot={false}/>
                <Line type="monotone" dataKey="l2" stroke={C.secondary} name="Step 2 Loss" strokeWidth={2} dot={false}/>
              </LineChart></ResponsiveContainer>:<Empty text="Start training to see loss curves" sub="Animates epoch by epoch"/>}
            </Card>
            <Card>
              <SecTitle icon={<Award size={14}/>} title="AUC Progress"/>
              {cAuc.length>0?<ResponsiveContainer width="100%" height={200}><AreaChart data={cAuc}>
                <defs>
                  <linearGradient id="ga1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={.25}/><stop offset="95%" stopColor={C.primary} stopOpacity={0}/></linearGradient>
                  <linearGradient id="ga2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.success} stopOpacity={.25}/><stop offset="95%" stopColor={C.success} stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
                <XAxis dataKey="ep" tick={{fill:C.muted,fontSize:9}}/><YAxis domain={[0.5,.9]} tick={{fill:C.muted,fontSize:9}}/>
                <Tooltip content={<Tip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                <Area type="monotone" dataKey="a1" stroke={C.primary} fill="url(#ga1)" name="Step 1 AUC" strokeWidth={2}/>
                <Area type="monotone" dataKey="a2" stroke={C.success} fill="url(#ga2)" name="Step 2 AUC" strokeWidth={2}/>
              </AreaChart></ResponsiveContainer>:<Empty text="AUC curves appear here" sub="Step 2 shows collaborative boost"/>}
            </Card>
          </div>
          <Card>
            <SecTitle icon={<Filter size={14}/>} title="Hyperparameters (from paper)"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
              {[
                {t:"LoRA",rows:[["Rank (r)","8"],["Alpha (α)","16"],["Dropout","0.05"],["Target","q/v_proj"],["Trainable %","~0.1%"]]},
                {t:"Optimizer",rows:[["Type","AdamW"],["LR (LoRA)","1e-4"],["LR (CIE)","1e-3"],["Max Seq","512"],["Batch","64"]]},
                {t:"CIE Module",rows:[["Input","128"],["Hidden","512"],["Output","768"],["Layers","3"],["Dropout","0.1"]]},
              ].map((g,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,.03)",borderRadius:10,padding:12}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.light,marginBottom:9}}>{g.t}</div>
                  {g.rows.map(([k,v],j)=>(
                    <div key={j} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
                      <span style={{color:C.muted}}>{k}</span>
                      <strong style={{color:C.light,fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>{v}</strong>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── PERFORMANCE ────────────────────────────────────────────────── */
function Performance(){
  const{call}=useApi();
  const toast=useToast();
  const[abl,setAbl]=useState([]);
  const[tun,setTun]=useState([]);
  const[wc,setWc]=useState([]);
  const[ndcg,setNdcg]=useState([]);
  const[eff,setEff]=useState([]);
  useEffect(()=>{
    call("/analytics/ablation").then(d=>setAbl(d.data||[])).catch(()=>{});
    call("/analytics/tuning").then(d=>setTun(d.data||[])).catch(()=>{});
    call("/analytics/warm-cold").then(d=>setWc(d.data||[])).catch(()=>{});
    call("/analytics/ndcg").then(d=>setNdcg(d.data||[])).catch(()=>{});
    call("/analytics/efficiency").then(d=>setEff(d.data||[])).catch(()=>{});
  },[call]);
  return(
    <div>
      <PageHdr icon={<BarChart3 size={22}/>} title="Performance Analysis" sub="Full Table 2 results, ablation study, tuning strategies, NDCG@10 and efficiency"/>
      <Card style={{marginBottom:18}}>
        <SecTitle icon={<Award size={15}/>} title="Table 2 — Overall Performance"
          action={
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{dlCSV(TABLE2,"collm_table2.csv");toast("CSV exported!");}} style={{...secondaryBtn,padding:"4px 10px",fontSize:11}}><Download size={12}/> CSV</button>
              <button onClick={()=>{dlJSON({table2:TABLE2},"collm_table2.json");toast("JSON exported!");}} style={{...secondaryBtn,padding:"4px 10px",fontSize:11}}><FileText size={12}/> JSON</button>
            </div>
          }/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${C.border}`}}>
                {["Method","Type","ML-1M AUC","ML-1M UAUC","ML-1M NDCG","Book AUC","Book UAUC","Book NDCG"].map(h=>(
                  <th key={h} style={{padding:"8px 12px",textAlign:"left",color:C.muted,fontWeight:600,whiteSpace:"nowrap",fontSize:11}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TABLE2.map((r,i)=>{
                const tb=TB[r.type]||{};
                const isOurs=r.type==="ours";
                const maxes={ml1m_auc:Math.max(...TABLE2.map(x=>x.ml1m_auc)),ml1m_uauc:Math.max(...TABLE2.map(x=>x.ml1m_uauc)),ml1m_ndcg:Math.max(...TABLE2.map(x=>x.ml1m_ndcg)),book_auc:Math.max(...TABLE2.map(x=>x.book_auc)),book_uauc:Math.max(...TABLE2.map(x=>x.book_uauc)),book_ndcg:Math.max(...TABLE2.map(x=>x.book_ndcg))};
                return(
                  <tr key={i} style={{borderBottom:`1px solid ${C.border}`,background:isOurs?"rgba(16,185,129,.05)":i%2===0?"rgba(255,255,255,.01)":"transparent"}}>
                    <td style={{padding:"9px 12px",fontWeight:isOurs?700:400,color:isOurs?C.success:C.light}}>{r.m}</td>
                    <td style={{padding:"9px 12px"}}><Badge color={tb.color||C.muted} bg={tb.bg||"rgba(255,255,255,.07)"}>{tb.label||r.type}</Badge></td>
                    {["ml1m_auc","ml1m_uauc","ml1m_ndcg","book_auc","book_uauc","book_ndcg"].map(col=>{
                      const isMax=r[col]===maxes[col];
                      return<td key={col} style={{padding:"9px 12px",fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:isMax?C.accent:isOurs?C.success:C.light,fontWeight:isMax?700:400}}>{r[col].toFixed(4)}{isMax?" ▲":""}</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {wc.length>0&&(
        <Card style={{marginBottom:18}}>
          <SecTitle icon={<Activity size={15}/>} title="Warm vs Cold Scenario AUC Comparison"/>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={wc} layout="vertical" margin={{left:10,right:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
              <XAxis type="number" domain={[0.45,.86]} tick={{fill:C.muted,fontSize:11}}/>
              <YAxis dataKey="scenario" type="category" width={110} tick={{fill:C.muted,fontSize:11}}/>
              <Tooltip content={<Tip/>}/><Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="MF" fill={C.primary} name="MF" radius={[0,4,4,0]}/>
              <Bar dataKey="TALLRec" fill={C.secondary} name="TALLRec" radius={[0,4,4,0]}/>
              <Bar dataKey="CoLLM" fill={C.success} name="CoLLM" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
        {abl.length>0&&(
          <Card>
            <SecTitle icon={<FlaskConical size={15}/>} title="Table 4 — Ablation (CIE Module)"
              action={<button onClick={()=>{dlCSV(abl,"ablation.csv");toast("Exported!");}} style={{...secondaryBtn,padding:"4px 9px",fontSize:11}}><Download size={12}/></button>}/>
            <ResponsiveContainer width="100%" height={200}><BarChart data={abl} margin={{top:6,right:6,left:-14,bottom:40}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
              <XAxis dataKey="variant" tick={{fill:C.muted,fontSize:9}} angle={-15} textAnchor="end"/>
              <YAxis domain={[0.55,.76]} tick={{fill:C.muted,fontSize:10}}/><Tooltip content={<Tip/>}/><Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="ml1m_auc" fill={C.primary} name="ML-1M AUC" radius={[4,4,0,0]}/>
              <Bar dataKey="ml1m_uauc" fill={C.secondary} name="ML-1M UAUC" radius={[4,4,0,0]}/>
            </BarChart></ResponsiveContainer>
            <div style={{marginTop:8,fontSize:11,color:C.muted,background:"rgba(255,255,255,.03)",borderRadius:8,padding:9,lineHeight:1.7}}>CIE removal drops to TALLRec level. Direct UI-token insertion hurts due to tokenization redundancy.</div>
          </Card>
        )}
        {tun.length>0&&(
          <Card>
            <SecTitle icon={<GitBranch size={15}/>} title="Table 5 — Tuning Strategy"
              action={<button onClick={()=>{dlCSV(tun,"tuning.csv");toast("Exported!");}} style={{...secondaryBtn,padding:"4px 9px",fontSize:11}}><Download size={12}/></button>}/>
            <ResponsiveContainer width="100%" height={200}><LineChart data={tun} margin={{top:6,right:6,left:-14,bottom:40}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
              <XAxis dataKey="method" tick={{fill:C.muted,fontSize:9}} angle={-15} textAnchor="end"/>
              <YAxis domain={[0.65,.76]} tick={{fill:C.muted,fontSize:10}}/><Tooltip content={<Tip/>}/><Legend wrapperStyle={{fontSize:11}}/>
              <Line type="monotone" dataKey="ml1m_auc" stroke={C.primary} name="ML-1M AUC" strokeWidth={2} dot={{r:4,fill:C.primary}}/>
              <Line type="monotone" dataKey="book_auc" stroke={C.secondary} name="Amazon AUC" strokeWidth={2} dot={{r:4,fill:C.secondary}}/>
            </LineChart></ResponsiveContainer>
            <div style={{marginTop:8,fontSize:11,color:C.muted,background:"rgba(255,255,255,.03)",borderRadius:8,padding:9,lineHeight:1.7}}>One-step T3 training hurts cold-start. Two-step default is the optimal efficiency/performance tradeoff.</div>
          </Card>
        )}
      </div>
      {ndcg.length>0&&(
        <Card style={{marginBottom:18}}>
          <SecTitle icon={<Sigma size={15}/>} title="NDCG@10 Full Comparison"
            action={<button onClick={()=>{dlCSV(ndcg,"ndcg.csv");toast("Exported!");}} style={{...secondaryBtn,padding:"4px 9px",fontSize:11}}><Download size={12}/></button>}/>
          <ResponsiveContainer width="100%" height={240}><BarChart data={ndcg} margin={{top:8,right:20,left:-10,bottom:50}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
            <XAxis dataKey="model" tick={{fill:C.muted,fontSize:10}} angle={-25} textAnchor="end"/>
            <YAxis domain={[0.75,.91]} tick={{fill:C.muted,fontSize:10}}/><Tooltip content={<Tip/>}/><Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="ml1m_ndcg" name="ML-1M NDCG@10" radius={[4,4,0,0]}>
              {ndcg.map((e,i)=><Cell key={i} fill={MC[e.model]||C.primary}/>)}
            </Bar>
            <Bar dataKey="book_ndcg" fill={C.secondary} name="Amazon NDCG@10" radius={[4,4,0,0]}/>
          </BarChart></ResponsiveContainer>
        </Card>
      )}
      {eff.length>0&&(
        <Card>
          <SecTitle icon={<Gauge size={15}/>} title="Efficiency vs TALLRec Baseline (100%)"
            action={<button onClick={()=>{dlCSV(eff,"efficiency.csv");toast("Exported!");}} style={{...secondaryBtn,padding:"4px 9px",fontSize:11}}><Download size={12}/></button>}/>
          <ResponsiveContainer width="100%" height={220}><BarChart data={eff.filter(d=>["TALLRec","CoLLM-MF","CoLLM-LightGCN","CoLLM-SASRec","CoLLM-DIN"].includes(d.model))} margin={{top:6,right:20,left:-10,bottom:30}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
            <XAxis dataKey="model" tick={{fill:C.muted,fontSize:10}}/><YAxis tick={{fill:C.muted,fontSize:10}} unit="%"/>
            <Tooltip content={<Tip/>} formatter={v=>`${v}%`}/><Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="train_pct" fill={C.primary} name="Train Time %" radius={[4,4,0,0]}/>
            <Bar dataKey="infer_pct" fill={C.secondary} name="Infer Time %" radius={[4,4,0,0]}/>
          </BarChart></ResponsiveContainer>
          <div style={{marginTop:8,fontSize:11,color:C.muted,background:"rgba(255,255,255,.03)",borderRadius:8,padding:9,lineHeight:1.7}}>CoLLM adds only ~13–15% overhead over TALLRec while delivering significantly better AUC — making it highly practical for production deployment.</div>
        </Card>
      )}
    </div>
  );
}

/* ── MODEL COMPARISON ───────────────────────────────────────────── */
function ModelComparison(){
  const{call}=useApi();
  const toast=useToast();
  const[data,setData]=useState([]);
  const[ds,setDs]=useState("ml1m");
  const[metric,setMetric]=useState("auc");
  const[sel,setSel]=useState(new Set(["CoLLM-DIN","CoLLM-MF","TALLRec","DIN","MF","SASRec"]));
  useEffect(()=>{call("/model/comparison").then(d=>setData(d.comparison||[])).catch(()=>{});},[call]);
  const key=ds==="ml1m"?`ml1m_${metric}`:`book_${metric}`;
  const filt=data.filter(d=>sel.has(d.model));
  const chartData=filt.map(d=>({name:d.model,value:d[key],type:d.type}));
  const toggle=m=>setSel(p=>{const n=new Set(p);n.has(m)?n.delete(m):n.add(m);return n;});
  return(
    <div>
      <PageHdr icon={<GitCompare size={22}/>} title="Model Comparison" sub="Interactive comparison of all 11 methods from Table 2 — toggle, filter, export"/>
      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div><div style={{fontSize:11,color:C.muted,marginBottom:6}}>Dataset</div>
            <div style={{display:"flex",gap:6}}>
              {[["ml1m","ML-1M"],["book","Amazon-Book"]].map(([id,lbl])=><button key={id} onClick={()=>setDs(id)} style={tabBtn(ds===id)}>{lbl}</button>)}
            </div>
          </div>
          <div><div style={{fontSize:11,color:C.muted,marginBottom:6}}>Metric</div>
            <div style={{display:"flex",gap:6}}>
              {["auc","uauc","ndcg"].map(m=><button key={m} onClick={()=>setMetric(m)} style={tabBtn(metric===m)}>{m.toUpperCase()}</button>)}
            </div>
          </div>
          <button onClick={()=>{dlCSV(data.map(d=>({model:d.model,type:d.type,[key]:d[key]})),"comparison.csv");toast("CSV exported!");}} style={{...secondaryBtn,marginLeft:"auto"}}><Download size={13}/> Export</button>
        </div>
        <div style={{marginTop:14}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:8}}>Toggle Models</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {data.map(d=><button key={d.model} onClick={()=>toggle(d.model)} style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${sel.has(d.model)?(MC[d.model]||C.primary):C.border}`,background:sel.has(d.model)?(MC[d.model]||C.primary)+"22":"transparent",color:sel.has(d.model)?(MC[d.model]||C.primary):C.muted,transition:"all .15s",fontFamily:"inherit"}}>{d.model}</button>)}
          </div>
        </div>
      </Card>
      <Card style={{marginBottom:16}}>
        <SecTitle icon={<BarChart2 size={15}/>} title={`${ds==="ml1m"?"ML-1M":"Amazon-Book"} ${metric.toUpperCase()} — Bar Chart`}/>
        <ResponsiveContainer width="100%" height={280}><BarChart data={chartData} margin={{top:8,right:20,left:-10,bottom:55}}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
          <XAxis dataKey="name" tick={{fill:C.muted,fontSize:10}} angle={-30} textAnchor="end"/>
          <YAxis tick={{fill:C.muted,fontSize:10}}/><Tooltip content={<Tip/>}/>
          <Bar dataKey="value" name={metric.toUpperCase()} radius={[6,6,0,0]}>
            {chartData.map((e,i)=><Cell key={i} fill={MC[e.name]||C.primary}/>)}
          </Bar>
        </BarChart></ResponsiveContainer>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card>
          <SecTitle icon={<Activity size={15}/>} title="Scatter — ML-1M AUC vs Amazon-Book AUC"/>
          <ResponsiveContainer width="100%" height={260}><ScatterChart margin={{top:10,right:20,bottom:20,left:-10}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
            <XAxis type="number" dataKey="x" name="ML-1M AUC" domain={[0.45,.76]} tick={{fill:C.muted,fontSize:10}}/>
            <YAxis type="number" dataKey="y" name="Book AUC" domain={[0.45,.86]} tick={{fill:C.muted,fontSize:10}}/>
            <ZAxis range={[60,60]}/>
            <Tooltip cursor={{strokeDasharray:"3 3"}} content={({active,payload})=>{
              if(!active||!payload?.length)return null;
              const p=payload[0].payload;
              return<div style={{background:"rgba(6,9,20,.97)",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:12}}>
                <div style={{fontWeight:700,marginBottom:4}}>{p.name}</div>
                <div style={{color:C.muted}}>ML-1M: <strong style={{color:C.primary}}>{p.x?.toFixed(4)}</strong></div>
                <div style={{color:C.muted}}>Amazon: <strong style={{color:C.success}}>{p.y?.toFixed(4)}</strong></div>
              </div>;
            }}/>
            <Scatter data={data.map(d=>({name:d.model,x:d.ml1m_auc,y:d.book_auc,type:d.type}))}
              shape={({cx,cy,payload})=>(
                <g>
                  <circle cx={cx} cy={cy} r={8} fill={MC[payload.name]||C.primary} fillOpacity={.85} stroke={payload.type==="ours"?C.success:"transparent"} strokeWidth={2}/>
                  <text x={cx} y={cy-12} textAnchor="middle" fill={MC[payload.name]||C.primary} fontSize={9}>{payload.name}</text>
                </g>
              )}/>
          </ScatterChart></ResponsiveContainer>
        </Card>
        <Card>
          <SecTitle icon={<Box size={15}/>} title="CoLLM Relative Improvement vs Baseline"/>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:4}}>
            {data.filter(d=>d.type==="ours").map((d,i)=>{
              const ri=d.rel_imp||0;
              return<div key={i}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                  <span style={{color:C.light,fontWeight:600}}>{d.model}</span>
                  <span style={{color:ri>0?C.success:C.danger,fontWeight:700}}>{ri>0?"+":""}{ri}%</span>
                </div>
                <Prog v={Math.abs(ri)*8} color={ri>0?C.success:C.danger} h={5}/>
              </div>;
            })}
          </div>
          <div style={{marginTop:14,fontSize:11,color:C.muted,background:"rgba(255,255,255,.03)",borderRadius:8,padding:10,lineHeight:1.7}}>
            Relative improvement averaged over ML-1M AUC + UAUC vs corresponding collaborative baseline. CoLLM-MF shows largest relative uplift.
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── DATASETS ───────────────────────────────────────────────────── */
function Datasets(){
  const toast=useToast();
  const{call}=useApi();
  const[genreStats,setGS]=useState([]);
  useEffect(()=>{
    call("/items?limit=100").then(d=>{
      const cnt={};(d.items||[]).forEach(i=>{cnt[i.genre]=(cnt[i.genre]||0)+1;});
      setGS(Object.entries(cnt).map(([g,c])=>({genre:g,count:c})).sort((a,b)=>b.count-a.count));
    }).catch(()=>{});
  },[call]);
  const ds=[
    {name:"ML-1M",full:"MovieLens 1M",color:C.primary,desc:"Movie rating dataset, ~1M ratings (1–5 scale), 6,040 users, 3,706 movies. Collected 2000–2003.",stats:{Users:839,Items:3256,Train:33891,Valid:10401,Test:7331},thresh:"Rating > 3 → positive",split:"Temporal monthly split",url:"https://grouplens.org/datasets/movielens/1m/"},
    {name:"Amazon-Book",full:"Amazon Product Reviews",color:C.secondary,desc:"Book reviews from Amazon (1996–2018). Filtered to users/items with ≥20 interactions for quality.",stats:{Users:22967,Items:34154,Train:727468,Valid:25747,Test:25747},thresh:"Rating ≥ 4 → positive",split:"Temporal monthly split",url:"https://cseweb.ucsd.edu/~jmcauley/datasets.html"},
  ];
  const pieData=[
    {name:"ML Train",value:33891,color:C.primary},{name:"ML Valid",value:10401,color:C.info},{name:"ML Test",value:7331,color:C.secondary},
    {name:"AMZ Train",value:727468,color:C.success},{name:"AMZ Valid",value:25747,color:C.warning},{name:"AMZ Test",value:25747,color:C.accent},
  ];
  const pipe=[
    {step:"Load",icon:Database,desc:"Raw interaction CSV: user_id, item_id, rating, timestamp"},
    {step:"Sort",icon:Filter,desc:"Sort chronologically to prevent temporal data leakage"},
    {step:"Binarize",icon:CheckCircle,desc:"Convert rating to binary label via dataset threshold"},
    {step:"Filter",icon:Search,desc:"Remove sparse users/items (Amazon: ≥20 interactions)"},
    {step:"Split",icon:GitBranch,desc:"Temporal train/valid/test split preserving sequences"},
    {step:"Prompt",icon:Layers,desc:"Fill HisItemTitleList + <UserID> + TargetItem + <TargetItemID>"},
    {step:"Tokenize",icon:Cpu,desc:"BPE for text tokens; CIE processes collaborative IDs"},
  ];
  return(
    <div>
      <PageHdr icon={<Database size={22}/>} title="Datasets" sub="Benchmarks used in the CoLLM paper — preprocessing pipeline and statistics"
        action={
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>dlBlob(`${API}/export/interactions`,"interactions_sample.csv",toast)} style={secondaryBtn}><Download size={13}/> Interactions</button>
            <button onClick={()=>dlBlob(`${API}/export/items`,"catalog_sample.csv",toast)} style={secondaryBtn}><Download size={13}/> Catalog</button>
          </div>
        }/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
        {ds.map((d,i)=>(
          <Card key={i} style={{borderColor:d.color+"44"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{width:42,height:42,borderRadius:10,background:d.color+"22",display:"flex",alignItems:"center",justifyContent:"center"}}><Database size={19} color={d.color}/></div>
              <div style={{flex:1}}><div style={{fontWeight:800,fontSize:15,color:d.color}}>{d.name}</div><div style={{fontSize:12,color:C.muted}}>{d.full}</div></div>
              <a href={d.url} target="_blank" rel="noreferrer" style={{color:d.color,fontSize:11,textDecoration:"none",display:"flex",alignItems:"center",gap:3}}><Globe size={12}/> Source</a>
            </div>
            <p style={{fontSize:12,color:C.muted,lineHeight:1.7,marginBottom:12}}>{d.desc}</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
              {Object.entries(d.stats).map(([k,v])=>(
                <div key={k} style={{background:"rgba(255,255,255,.04)",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontWeight:700,fontSize:14,color:d.color}}>{v.toLocaleString()}</div>
                  <div style={{fontSize:10,color:C.muted}}>{k}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:C.muted,lineHeight:1.7}}>
              <div>🏷️ <strong style={{color:C.light}}>Threshold:</strong> {d.thresh}</div>
              <div>📅 <strong style={{color:C.light}}>Split:</strong> {d.split}</div>
            </div>
          </Card>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
        <Card>
          <SecTitle icon={<BarChart3 size={15}/>} title="Interaction Distribution by Split"/>
          <ResponsiveContainer width="100%" height={250}><RPieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={88} dataKey="value" label={({name,percent})=>`${name}: ${(percent*100).toFixed(1)}%`} labelLine={{stroke:C.muted}}>
              {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
            </Pie>
            <Tooltip formatter={v=>v.toLocaleString()}/><Legend wrapperStyle={{fontSize:11}}/>
          </RPieChart></ResponsiveContainer>
        </Card>
        {genreStats.length>0&&(
          <Card>
            <SecTitle icon={<BarChart2 size={15}/>} title="Demo Catalog Genre Distribution"/>
            <ResponsiveContainer width="100%" height={250}><BarChart data={genreStats} layout="vertical" margin={{left:0,right:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
              <XAxis type="number" tick={{fill:C.muted,fontSize:10}}/>
              <YAxis dataKey="genre" type="category" width={88} tick={{fill:C.muted,fontSize:10}}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey="count" radius={[0,4,4,0]}>{genreStats.map((_,i)=><Cell key={i} fill={Object.values(MC)[i]||C.primary}/>)}</Bar>
            </BarChart></ResponsiveContainer>
          </Card>
        )}
      </div>
      <Card>
        <SecTitle icon={<Filter size={15}/>} title="Data Preprocessing Pipeline"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {pipe.map((s,i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",gap:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:C.primary+"22",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}><s.icon size={13} color={C.primary}/></div>
                {i<pipe.length-1&&<div style={{flex:1,height:1,background:`linear-gradient(90deg,${C.primary}44,transparent)`}}/>}
              </div>
              <div style={{fontWeight:700,fontSize:12,color:C.light}}>{i+1}. {s.step}</div>
              <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>{s.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── PAPER EXPLORER ─────────────────────────────────────────────── */
function PaperExplorer(){
  const[open,setOpen]=useState({intro:true});
  const tog=k=>setOpen(p=>({...p,[k]:!p[k]}));
  const secs=[
    {id:"intro",emoji:"🧠",title:"1. Introduction & Problem",color:C.primary,hl:"LLMRec methods ignore collaborative filtering → CoLLM treats CF as a new LLM modality.",
     body:`LLMs like Vicuna-7B have remarkable recommendation capabilities via text understanding, especially for cold-start users where world knowledge substitutes missing interaction data.

However, existing LLMRec approaches (TALLRec, BIGRec, ICL) ignore collaborative filtering signals. Two items with identical descriptions may have very different collaborative patterns if consumed by different user groups.

CoLLM treats collaborative information as a separate modality — analogous to visual features in MiniGPT-4 — and bridges it into LLM token space via the CIE module. This gives the LLM direct access to collaborative signals during generation, enabling it to leverage both semantic understanding AND interaction patterns.`},
    {id:"method",emoji:"⚙️",title:"4. CoLLM Methodology",color:C.secondary,hl:"CIE maps CF embeddings (d₁=128) → LLM token space (d₂=768) via a trainable 3-layer MLP.",
     body:`Three core components:

1. Prompt: Standard template with <UserID> and <TargetItemID> placeholder fields. These positions are filled with CIE-projected collaborative embeddings rather than text tokens.

2. CIE Module: Takes pre-trained CF user/item embeddings → MLP(3 layers, 128→512→768) → mapped into LLM embedding dimension. Zero-initialised to preserve cold-start from Step 1 at init.

3. Two-Step Training:
   • Step 1 (LoRA only, text-only prompts): Build cold-start capability via LLM language understanding. No collaborative IDs in prompts.
   • Step 2 (CIE + CF model, full prompts): Integrate collaborative signals for warm-start. LoRA weights frozen; only CIE and CF model fine-tuned.

Why two steps? One-step training (T3) fails cold-start users because the model becomes over-reliant on collaborative IDs that don't exist for cold users. Step 1 first ensures LLM learns text-based recommendation, then Step 2 adds collaborative enhancement without catastrophic forgetting.`},
    {id:"results",emoji:"📊",title:"5. Experiments & Results",color:C.success,hl:"CoLLM-DIN: best AUC 0.8245 (Amazon-Book) and 0.7353 (ML-1M) — new SOTA across both datasets.",
     body:`Datasets: ML-1M (839 users, 3,256 items) and Amazon-Book (22,967 users, 34,154 items). Temporal split.

Baselines: MF, LightGCN, SASRec, DIN (collaborative); CTRL+DIN (LM+collab); ICL, TALLRec (LLMRec).

Key Amazon-Book results (AUC):
  • MF: 0.7134  |  TALLRec: 0.7375  |  CoLLM-DIN: 0.8245 ← SOTA (+11.8% over TALLRec)
  • CoLLM consistently best in both warm AND cold scenarios

Warm scenario (many interactions): CoLLM > DIN > TALLRec > MF
Cold scenario (few interactions): CoLLM ≈ TALLRec >> MF (CF approaches collapse)

Ablation (Table 4):
  • w/o CIE (= TALLRec): drops 2% AUC — CIE contribution clearly measurable
  • w/ UI-token (direct embed): hurts — BPE tokenization fragments ID representations

Efficiency: +13% training time, +12% inference time over TALLRec. Tiny overhead for large gains.`},
    {id:"related",emoji:"📚",title:"2. Related Work",color:C.accent,hl:"Collaborative as LLM modality — exactly analogous to MiniGPT-4 (vision → LLM) and PaLM-E (sensor → LLM).",
     body:`LLMRec categories:
• In-Context Learning (Chat-Rec, ICL): No fine-tuning. Query frozen LLMs. Limited personalisation.
• Instruction Tuning (TALLRec, P5, BIGRec): Fine-tune on rec data. Better but misses CF signals.
• Hybrid methods (CTRL): Separate CF + LM, ensembled post-hoc. Not integrated into generation.

Multimodal LLMs (CoLLM inspiration):
• MiniGPT-4: Align frozen CLIP visual encoder → LLM space via Q-Former projection
• PaLM-E: Map continuous sensor/robot state embeddings into language model input
• CoLLM: Map pre-trained CF model embeddings into LLM token space (same pattern!)

Key distinction from concurrent work (e.g., LLaRA, CoLLM-ID): Those learn ID embeddings from scratch jointly with the LLM. CoLLM uses pre-trained CF embeddings — lower-rank, faster training, leverages existing CF expertise.`},
    {id:"conclusion",emoji:"🔭",title:"6. Conclusion & Future Work",color:C.info,hl:"Code at github.com/zyang1580/CoLLM — Vicuna-7B + LoRA + CIE supporting MF/LightGCN/SASRec/DIN.",
     body:`CoLLM successfully bridges collaborative and language modalities for recommendation, achieving new SOTA with minimal overhead.

Contributions:
1. Identified CF signal absence as primary LLMRec weakness
2. CIE module: pre-trained CF → LLM space via simple MLP projection
3. Two-step training that maintains cold-start while adding warm-start collaborative strength
4. Plug-in design supporting any CF backbone (MF, LightGCN, SASRec, DIN)
5. Only ~0.1% trainable parameters; ~12% inference overhead

Future directions:
• Larger backbones (LLaMA-3, Qwen2-7B, Mistral)
• Item cold-start (current work addresses user cold-start)
• Incremental/online CIE updates for drift
• Cross-domain recommendation with shared CIE
• Better alignment (contrastive, optimal transport)
• Multi-modal items (image + text + collaborative)`},
  ];
  return(
    <div>
      <PageHdr icon={<Telescope size={22}/>} title="Paper Explorer" sub="Interactive walkthrough — CoLLM (arXiv:2310.19488v3, Yang Zhang et al., 2025)"/>
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>CoLLM: Integrating Collaborative Embeddings into Large Language Models for Recommendation</div>
            <div style={{fontSize:12,color:C.muted}}>Yang Zhang · Fuli Feng · Jizhi Zhang · Keqin Bao · Qifan Wang · Xiangnan He</div>
            <div style={{fontSize:11,color:C.muted,marginTop:1}}>USTC · Meta AI Research · arXiv:2310.19488 · 2025</div>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <a href="https://arxiv.org/abs/2310.19488" target="_blank" rel="noreferrer" style={{...secondaryBtn,textDecoration:"none",fontSize:12}}><Globe size={13}/> arXiv</a>
            <a href="https://github.com/zyang1580/CoLLM" target="_blank" rel="noreferrer" style={{...primaryBtn,textDecoration:"none",fontSize:12}}><GitBranch size={13}/> GitHub</a>
          </div>
        </div>
      </Card>
      {secs.map(s=>(
        <Card key={s.id} style={{marginBottom:10}}>
          <button onClick={()=>tog(s.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"inherit"}}>
            <span style={{fontSize:17}}>{s.emoji}</span>
            <span style={{fontWeight:700,fontSize:13,color:C.light,flex:1,textAlign:"left"}}>{s.title}</span>
            <Badge color={s.color}>{open[s.id]?"−":"+"}</Badge>
          </button>
          {open[s.id]&&(
            <div style={{marginTop:14}}>
              <div style={{background:s.color+"10",border:`1px solid ${s.color}33`,borderRadius:9,padding:"9px 13px",fontSize:12,color:s.color,marginBottom:12,lineHeight:1.6}}>💡 {s.hl}</div>
              <pre style={{fontSize:12,color:C.muted,lineHeight:1.9,whiteSpace:"pre-wrap",fontFamily:"'Inter',sans-serif",margin:0}}>{s.body}</pre>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ── ROOT APP ───────────────────────────────────────────────────── */
const PAGES={dashboard:Dashboard,recommend:Recommendations,catalog:ItemCatalog,architecture:Architecture,training:Training,analysis:Performance,compare:ModelComparison,datasets:Datasets,explorer:PaperExplorer};

export default function App(){
  const[page,setPage]=useState("dashboard");
  const[collapsed,setCollapsed]=useState(false);
  const[landing,setLanding]=useState(true);
  const Page=PAGES[page]||Dashboard;
  return(
    <ToastProvider>
      {landing?(
        <LandingPage onEnter={()=>setLanding(false)}/>
      ):(
        <div style={{minHeight:"100vh",background:C.darker,color:C.light,fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif"}}>
          <style>{`
            @keyframes spin{to{transform:rotate(360deg)}}
            @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
            @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.8}}
            *,:before,:after{box-sizing:border-box;margin:0;padding:0}
            ::-webkit-scrollbar{width:5px;height:5px}
            ::-webkit-scrollbar-track{background:transparent}
            ::-webkit-scrollbar-thumb{background:rgba(99,102,241,.3);border-radius:3px}
            input[type=range]{height:4px;border-radius:2px;cursor:pointer}
            select option{background:#0f172a}
            body{background:#0f172a}
          `}</style>
          <Particles count={30}/>
          <Sidebar active={page} setActive={setPage} collapsed={collapsed} setCollapsed={setCollapsed}/>
          <main style={{marginLeft:collapsed?64:250,padding:"28px 32px",minHeight:"100vh",position:"relative",zIndex:1,transition:"margin-left .25s ease"}}>
            <div style={{maxWidth:1320}}><Page/></div>
          </main>
        </div>
      )}
    </ToastProvider>
  );
}
