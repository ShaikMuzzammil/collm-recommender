import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area,
  PieChart as RPieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import {
  Brain, Zap, TrendingUp, Users, BookOpen, Activity,
  ArrowRight, CheckCircle, AlertCircle, Loader, Database,
  Layers, GitBranch, Cpu, Sparkles, ChevronRight,
  Star, Clock, BarChart3, Network, Filter, Play,
  RefreshCw, ChevronDown, ChevronUp, Wifi,
  Globe, Award, Box, FlaskConical,
  Settings, Menu, LayoutDashboard, GitCompare, Telescope
} from 'lucide-react';

/* ─── CONSTANTS ────────────────────────────────────────────── */

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS  = API.replace(/^http/, 'ws') + '/ws/training';

const C = {
  primary:   '#6366f1',
  secondary: '#8b5cf6',
  accent:    '#f59e0b',
  success:   '#10b981',
  danger:    '#ef4444',
  warning:   '#f97316',
  info:      '#3b82f6',
  dark:      '#1e293b',
  darker:    '#0f172a',
  light:     '#f8fafc',
  muted:     '#64748b',
  border:    'rgba(99,102,241,0.15)',
};

const MODEL_COLORS = {
  'MF':             '#6366f1',
  'LightGCN':       '#8b5cf6',
  'SASRec':         '#f59e0b',
  'DIN':            '#10b981',
  'CTRL (DIN)':     '#3b82f6',
  'TALLRec':        '#f97316',
  'CoLLM-MF':       '#ef4444',
  'CoLLM-LightGCN': '#ec4899',
  'CoLLM-SASRec':   '#06b6d4',
  'CoLLM-DIN':      '#84cc16',
};

const TYPE_BADGE = {
  collab:     { bg: 'rgba(99,102,241,0.15)',  color: '#6366f1', label: 'Collaborative' },
  'lm+collab':{ bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6', label: 'LM+Collab' },
  llmrec:     { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', label: 'LLMRec' },
  ours:       { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', label: '⭐ CoLLM' },
};

/* ─── HOOKS ─────────────────────────────────────────────────── */

function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const call = useCallback(async (path, opts = {}) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...opts,
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const data = await res.json();
      setLoading(false);
      return data;
    } catch (e) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  return { call, loading, error };
}

function useWebSocket(_url) {
  // Vercel serverless does not support WebSockets.
  // Training returns full results instantly via HTTP POST /training/start.
  // This hook is a no-op; Training component handles results directly.
  return { msgs: [], connected: false, reconnect: () => {} };
}

/* ─── TINY COMPONENTS ────────────────────────────────────────── */

const Spinner = ({ size = 18 }) => (
  <span style={{ display:'inline-block', animation:'spin 0.8s linear infinite' }}>
    <Loader size={size} />
  </span>
);

const Badge = ({ children, color = C.primary, bg }) => (
  <span style={{
    background: bg || color + '22',
    color, borderRadius: 20, padding: '2px 10px',
    fontSize: 11, fontWeight: 700, letterSpacing: '.3px'
  }}>{children}</span>
);

const Card = ({ children, style = {}, glow = false }) => (
  <div style={{
    background: 'rgba(15,23,42,0.85)',
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: '20px 24px',
    backdropFilter: 'blur(12px)',
    boxShadow: glow ? `0 0 32px rgba(99,102,241,0.12)` : '0 4px 24px rgba(0,0,0,0.3)',
    ...style
  }}>{children}</div>
);

const Stat = ({ icon: Icon, label, value, color = C.primary, sub }) => (
  <Card style={{ display:'flex', alignItems:'center', gap:16 }}>
    <div style={{
      background: color + '22', color, borderRadius: 12,
      width: 48, height: 48, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
    }}><Icon size={22} /></div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: color, marginTop:2 }}>{sub}</div>}
    </div>
  </Card>
);

const AnimCounter = ({ end = 0, suffix = '', decimals = 0, duration = 1600 }) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    let start = null;
    const tick = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setV(+(p * end).toFixed(decimals));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [end, decimals, duration]);
  return <>{decimals ? v.toFixed(decimals) : v.toLocaleString()}{suffix}</>;
};

const Progress = ({ value, color = C.primary, height = 6 }) => (
  <div style={{ background:'rgba(255,255,255,0.06)', borderRadius: 99, height, overflow:'hidden' }}>
    <div style={{
      width: `${Math.min(100, value)}%`, height: '100%',
      background: `linear-gradient(90deg, ${color}, ${color}cc)`,
      borderRadius: 99, transition: 'width .4s ease'
    }} />
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'rgba(15,23,42,0.97)', border:`1px solid ${C.border}`,
      borderRadius:10, padding:'10px 14px', fontSize:12
    }}>
      <div style={{ color: C.muted, marginBottom:6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.primary, marginBottom:2 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(4) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* ─── PARTICLE CANVAS ────────────────────────────────────────── */

function Particles() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const pts = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - .5) * .45, vy: (Math.random() - .5) * .45,
      r: Math.random() * 1.8 + .8, op: Math.random() * .35 + .1
    }));
    let id;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.op})`; ctx.fill();
      });
      pts.forEach((a, i) => pts.slice(i+1).forEach(b => {
        const d = Math.hypot(a.x-b.x, a.y-b.y);
        if (d < 140) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(99,102,241,${.08*(1-d/140)})`; ctx.stroke();
        }
      }));
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }} />;
}

/* ─── NAVIGATION ──────────────────────────────────────────────── */

const NAV = [
  { id:'dashboard',    label:'Dashboard',        icon: LayoutDashboard },
  { id:'recommend',    label:'Recommendations',  icon: Sparkles },
  { id:'architecture', label:'Architecture',      icon: Brain },
  { id:'training',     label:'Training',          icon: GitBranch },
  { id:'analysis',     label:'Performance',       icon: BarChart3 },
  { id:'compare',      label:'Model Comparison',  icon: GitCompare },
  { id:'datasets',     label:'Datasets',          icon: Database },
  { id:'explorer',     label:'Paper Explorer',    icon: Telescope },
];

function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  return (
    <nav style={{
      width: collapsed ? 68 : 260, background:'rgba(8,12,26,0.97)',
      backdropFilter:'blur(20px)', borderRight:`1px solid ${C.border}`,
      padding: collapsed ? '20px 10px' : '20px 14px',
      display:'flex', flexDirection:'column',
      position:'fixed', height:'100vh', zIndex:200,
      transition:'width .25s ease', overflow:'hidden'
    }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, padding:'0 4px' }}>
        <div style={{
          background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
          borderRadius:10, width:36, height:36, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center'
        }}><Brain size={20} color="#fff" /></div>
        {!collapsed && <div>
          <div style={{ fontWeight:800, fontSize:17, background:'linear-gradient(90deg,#6366f1,#a855f7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>CoLLM</div>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:1 }}>ML CAPSTONE</div>
        </div>}
        <button onClick={() => setCollapsed(!collapsed)}
          style={{ marginLeft:'auto', background:'none', border:'none', color:C.muted, cursor:'pointer', padding:4, flexShrink:0 }}>
          <Menu size={16} />
        </button>
      </div>

      {!collapsed && <div style={{ fontSize:10, color:C.muted, padding:'6px 8px', marginBottom:6, letterSpacing:.8 }}>NAVIGATION</div>}

      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:3 }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setActive(n.id)}
            title={collapsed ? n.label : undefined}
            style={{
              display:'flex', alignItems:'center', gap:10,
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius:10, border:'none', cursor:'pointer',
              background: active === n.id ? 'linear-gradient(90deg,rgba(99,102,241,.25),rgba(139,92,246,.1))' : 'transparent',
              color: active === n.id ? C.primary : C.muted,
              fontSize:13, fontWeight: active === n.id ? 700 : 400,
              transition:'all .15s', borderLeft: active === n.id ? `2px solid ${C.primary}` : '2px solid transparent',
            }}>
            <n.icon size={18} style={{ flexShrink:0 }} />
            {!collapsed && <span>{n.label}</span>}
            {!collapsed && active === n.id && <ChevronRight size={14} style={{ marginLeft:'auto' }} />}
          </button>
        ))}
      </div>

      {!collapsed && (
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14, marginTop:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 8px' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:C.success, boxShadow:`0 0 6px ${C.success}` }} />
            <span style={{ fontSize:11, color:C.muted }}>API Online</span>
            <span style={{ marginLeft:'auto', fontSize:10, color:C.muted }}>v2.0</span>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── DASHBOARD ───────────────────────────────────────────────── */

function Dashboard() {
  const { call } = useApi();
  const [stats, setStats] = useState(null);

  useEffect(() => { call('/stats').then(setStats).catch(() => {}); }, [call]);

  const perf = [
    { name:'MF',         warmAUC:.6482, coldAUC:.7134, uauc:.6361 },
    { name:'LightGCN',   warmAUC:.5959, coldAUC:.7103, uauc:.6499 },
    { name:'SASRec',     warmAUC:.7078, coldAUC:.6887, uauc:.6884 },
    { name:'DIN',        warmAUC:.7166, coldAUC:.8163, uauc:.6459 },
    { name:'TALLRec',    warmAUC:.7097, coldAUC:.7375, uauc:.6818 },
    { name:'CoLLM-DIN',  warmAUC:.7353, coldAUC:.8245, uauc:.6923 },
  ];

  const radar = [
    { m:'Warm AUC',    MF:.65, TALLRec:.71, CoLLM:.74 },
    { m:'Cold AUC',    MF:.71, TALLRec:.74, CoLLM:.82 },
    { m:'UAUC',        MF:.64, TALLRec:.68, CoLLM:.70 },
    { m:'NDCG',        MF:.84, TALLRec:.87, CoLLM:.88 },
    { m:'Efficiency',  MF:.95, TALLRec:.60, CoLLM:.85 },
    { m:'Cold-Start',  MF:.30, TALLRec:.90, CoLLM:.88 },
  ];

  const trend = Array.from({length:12}, (_, i) => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
    recommendations: 3000 + i*500 + Math.floor(Math.random()*200),
    users: 150 + i*30,
  }));

  return (
    <div>
      <PageHeader
        icon={<LayoutDashboard size={22} />}
        title="Dashboard"
        sub="Real-time overview of CoLLM recommendation system"
      />

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:24 }}>
        <Stat icon={Users}    label="Users"        color={C.primary}   value={<AnimCounter end={stats?.num_users ?? 1000} />} />
        <Stat icon={BookOpen} label="Catalog Items" color={C.secondary} value={<AnimCounter end={stats?.num_items ?? 5000} />} />
        <Stat icon={Database} label="Interactions"  color={C.accent}    value={<AnimCounter end={stats?.num_interactions ?? 15000} />} />
        <Stat icon={Zap}      label="Avg Latency"   color={C.success}   value="~45ms" sub="P95 < 120ms" />
        <Stat icon={Award}    label="Best AUC"      color={C.info}      value="0.8245" sub="CoLLM-DIN on Amazon-Book" />
        <Stat icon={TrendingUp} label="Cold-Start ↑" color={C.warning}  value="+15%" sub="vs collaborative baseline" />
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
        <Card>
          <SectionTitle icon={<BarChart3 size={16}/>} title="Model Performance Comparison" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={perf} margin={{top:10,right:10,left:-10,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{fill:C.muted, fontSize:11}} />
              <YAxis domain={[0.5,0.85]} tick={{fill:C.muted, fontSize:11}} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{fontSize:11}} />
              <Bar dataKey="warmAUC" fill={C.primary}   name="Warm AUC" radius={[4,4,0,0]} />
              <Bar dataKey="coldAUC" fill={C.secondary} name="Cold AUC" radius={[4,4,0,0]} />
              <Bar dataKey="uauc"    fill={C.accent}    name="UAUC"     radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle icon={<Network size={16}/>} title="Capability Radar" />
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radar}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="m" tick={{fill:C.muted, fontSize:11}} />
              <PolarRadiusAxis domain={[0,1]} tick={false} />
              <Radar name="MF"      dataKey="MF"      stroke={C.primary}   fill={C.primary}   fillOpacity={.1} strokeWidth={1.5} />
              <Radar name="TALLRec" dataKey="TALLRec" stroke={C.secondary} fill={C.secondary} fillOpacity={.1} strokeWidth={1.5} />
              <Radar name="CoLLM"   dataKey="CoLLM"   stroke={C.accent}    fill={C.accent}    fillOpacity={.25} strokeWidth={2} />
              <Legend wrapperStyle={{fontSize:11}} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Trend */}
      <Card>
        <SectionTitle icon={<TrendingUp size={16}/>} title="Activity Trend (Simulated)" />
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trend}>
            <defs>
              <linearGradient id="gr1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.primary}   stopOpacity={.25} />
                <stop offset="95%" stopColor={C.primary}   stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{fill:C.muted,fontSize:11}} />
            <YAxis tick={{fill:C.muted,fontSize:11}} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="recommendations" stroke={C.primary} fill="url(#gr1)" name="Recommendations" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

/* ─── RECOMMENDATIONS ─────────────────────────────────────────── */

function Recommendations() {
  const { call, loading, error } = useApi();
  const [userId, setUserId]   = useState(42);
  const [num, setNum]         = useState(5);
  const [modelType, setModel] = useState('mf');
  const [result, setResult]   = useState(null);
  const [history, setHistory] = useState([]);

  const fetchHistory = useCallback((uid) => {
    call(`/users/${uid}/history?limit=10`).then(d => setHistory(d.history || [])).catch(() => {});
  }, [call]);

  useEffect(() => { fetchHistory(userId); }, [userId, fetchHistory]);

  const go = async () => {
    try {
      const d = await call(`/recommend/${userId}?num=${num}&model=${modelType}`);
      setResult(d);
    } catch {}
  };

  const models = [
    { id:'mf',       label:'MF',       desc:'Matrix Factorization' },
    { id:'lightgcn', label:'LightGCN', desc:'Graph Convolution' },
    { id:'sasrec',   label:'SASRec',   desc:'Sequential Attention' },
    { id:'din',      label:'DIN',      desc:'Deep Interest Network' },
  ];

  return (
    <div>
      <PageHeader icon={<Sparkles size={22}/>} title="Smart Recommendations"
        sub="Get personalized recommendations powered by CoLLM hybrid encoding" />

      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:16 }}>
        {/* Control panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Card>
            <SectionTitle icon={<Settings size={15}/>} title="Configuration" />
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <label style={labelStyle}>
                <span style={{ fontSize:12, color:C.muted }}>User ID</span>
                <div style={{ display:'flex', gap:8 }}>
                  <input type="number" value={userId}
                    onChange={e => setUserId(+e.target.value)} min={0} max={999}
                    style={inputStyle} />
                  <button onClick={() => setUserId(Math.floor(Math.random()*500))}
                    style={btnSmall}><RefreshCw size={14} /></button>
                </div>
              </label>

              <label style={labelStyle}>
                <span style={{ fontSize:12, color:C.muted }}>Recommendations: <strong style={{color:'#f8fafc'}}>{num}</strong></span>
                <input type="range" min={1} max={20} value={num}
                  onChange={e => setNum(+e.target.value)} style={{ width:'100%', accentColor:C.primary }} />
              </label>

              <div>
                <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Collaborative Model</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  {models.map(m => (
                    <button key={m.id} onClick={() => setModel(m.id)}
                      style={{
                        padding:'8px 10px', borderRadius:8, border:`1px solid`,
                        borderColor: modelType === m.id ? C.primary : C.border,
                        background: modelType === m.id ? C.primary+'22' : 'transparent',
                        color: modelType === m.id ? C.primary : C.muted,
                        fontSize:12, fontWeight: modelType===m.id ? 700 : 400, cursor:'pointer',
                        textAlign:'left'
                      }}>
                      <div style={{ fontWeight:700 }}>{m.label}</div>
                      <div style={{ fontSize:10, opacity:.7 }}>{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={go} disabled={loading}
                style={{ ...primaryBtn, marginTop:4, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading ? <Spinner /> : <Sparkles size={16} />}
                {loading ? 'Generating…' : 'Get Recommendations'}
              </button>
              {error && <ErrBadge msg={error} />}
            </div>
          </Card>

          {history.length > 0 && (
            <Card>
              <SectionTitle icon={<Clock size={15}/>} title={`History (${history.length})`} />
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {history.slice(0,8).map(item => (
                  <div key={item.item_id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:8, background:'rgba(255,255,255,0.03)' }}>
                    <Star size={12} color={C.accent} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, color:'#f8fafc', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</div>
                      <div style={{ fontSize:10, color:C.muted }}>{item.genre}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Results */}
        <div>
          {result ? (
            <Card>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>User {result.user_id} • {modelType.toUpperCase()}</div>
                  <div style={{ fontSize:12, color:C.muted }}>History: {result.history_count} items</div>
                </div>
                <Badge color={C.success}>{result.latency_ms}ms</Badge>
                <Badge color={C.primary}>{result.model_type?.toUpperCase()}</Badge>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {result.recommendations.map((rec, i) => (
                  <div key={rec.item_id} style={{
                    display:'flex', alignItems:'center', gap:14,
                    padding:'14px 16px', borderRadius:12,
                    background:'rgba(255,255,255,0.03)',
                    border:`1px solid ${i===0 ? C.primary+'44' : C.border}`,
                    animation:'fadeIn .3s ease both', animationDelay:`${i*.06}s`
                  }}>
                    <div style={{
                      width:32, height:32, borderRadius:10, flexShrink:0,
                      background: `linear-gradient(135deg,${C.primary}44,${C.secondary}44)`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontWeight:800, color:C.primary, fontSize:14
                    }}>#{i+1}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:14, color:'#f8fafc', marginBottom:3 }}>{rec.title}</div>
                      <div style={{ display:'flex', gap:8 }}>
                        <Badge color={C.muted} bg="rgba(255,255,255,0.07)">{rec.genre}</Badge>
                        <Badge color={C.muted} bg="rgba(255,255,255,0.07)">{rec.year}</Badge>
                      </div>
                    </div>
                    <ConfRing pct={+(rec.confidence*100).toFixed(1)} />
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:340, gap:12, textAlign:'center' }}>
              <Sparkles size={48} color={C.border} />
              <div style={{ color:C.muted, maxWidth:260, lineHeight:1.6 }}>Choose a user and model, then click <strong style={{color:'#f8fafc'}}>Get Recommendations</strong> to see AI-powered suggestions.</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfRing({ pct }) {
  const r=18, c=2*Math.PI*r, dash=c*(pct/100);
  const color = pct>80?C.success:pct>60?C.primary:C.warning;
  return (
    <div style={{ position:'relative', width:52, height:52, flexShrink:0 }}>
      <svg width={52} height={52} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={26} cy={26} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} />
        <circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round" style={{transition:'stroke-dasharray .6s ease'}} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color }}>{pct}%</div>
    </div>
  );
}

/* ─── ARCHITECTURE ────────────────────────────────────────────── */

function Architecture() {
  const steps = [
    { title:'Prompt Construction', icon:Layers, color:C.primary,
      desc:'Structured template with text + UserID/TargetItemID placeholders',
      items:['HisItemTitleList (text)', 'UserID placeholder', 'TargetItemTitle (text)', 'TargetItemID placeholder'] },
    { title:'LLM Tokenization', icon:Database, color:C.secondary,
      desc:'Standard BPE tokenization and embedding lookup for all text tokens',
      items:['Text → token IDs', 'Embedding lookup', 'Positional encoding', 'Attention mask'] },
    { title:'CIE Module', icon:Cpu, color:C.accent,
      desc:'Maps collaborative embeddings (d₁=128) → LLM token space (d₂=768)',
      items:['Collab model (MF/LightGCN/SASRec/DIN)', '3-layer MLP', 'LayerNorm + ReLU', 'Linear projection'] },
    { title:'Hybrid Encoding', icon:GitBranch, color:C.success,
      desc:'Concatenate text embeddings + collaborative embeddings into unified sequence',
      items:['[collab_user, text_tokens, collab_item]', 'Unified attention mask', 'Position-aware fusion', 'Same d₂ dimension'] },
    { title:'LLM + LoRA', icon:Brain, color:C.info,
      desc:'Frozen LLM backbone + low-rank adapters (r=8, α=16) on q_proj, v_proj',
      items:['Frozen Vicuna-7B weights', 'LoRA: r=8, alpha=16', '~0.1% trainable params', 'Parameter-efficient'] },
    { title:'Recommendation Head', icon:Award, color:C.danger,
      desc:'Binary classification: "Yes" or "No" → interaction probability',
      items:['CLS pooling', 'Linear → ReLU → Linear', 'Sigmoid activation', 'BCE loss'] },
  ];

  return (
    <div>
      <PageHeader icon={<Brain size={22}/>} title="Model Architecture"
        sub="CoLLM: hybrid text+collaborative encoding with two-step LoRA training" />

      {/* Architecture flow */}
      <Card style={{ marginBottom:20 }}>
        <SectionTitle icon={<Network size={16}/>} title="Information Flow" />
        <div style={{ display:'flex', alignItems:'stretch', gap:0, overflowX:'auto', paddingBottom:8 }}>
          {steps.map((s,i) => (
            <React.Fragment key={i}>
              <div style={{ flex:'0 0 160px', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                <div style={{ width:48, height:48, borderRadius:12, background:s.color+'22', border:`1px solid ${s.color}44`,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <s.icon size={22} color={s.color} />
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#f8fafc', marginBottom:4 }}>{s.title}</div>
                  <div style={{ fontSize:10, color:C.muted, lineHeight:1.5 }}>{s.desc}</div>
                </div>
                <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:4 }}>
                  {s.items.map((it,j) => (
                    <div key={j} style={{ fontSize:10, color:s.color, background:s.color+'11', borderRadius:6, padding:'2px 6px', textAlign:'center' }}>{it}</div>
                  ))}
                </div>
              </div>
              {i < steps.length-1 && (
                <div style={{ display:'flex', alignItems:'center', padding:'0 8px', color:C.border, flexShrink:0 }}>
                  <ArrowRight size={18} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Two-step training */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <Card style={{ borderColor:C.primary+'44' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <Badge color={C.primary}>Step 1</Badge>
            <span style={{ fontWeight:700 }}>LoRA Fine-tuning (Text-Only)</span>
          </div>
          <p style={{ fontSize:13, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
            Train only LoRA adapters on text-only prompts (no UserID/TargetItemID).
            Builds cold-start recommendation capability from language semantics alone.
          </p>
          <div style={{ background:'rgba(99,102,241,.1)', borderRadius:10, padding:'10px 14px', fontFamily:'monospace', fontSize:12, color:C.primary }}>
            θ' = argmin<sub>θ'</sub> Σ ℓ(h<sub>Θ̂+θ'</sub>(E<sub>t</sub>), y)
          </div>
          <ul style={{ marginTop:12, display:'flex', flexDirection:'column', gap:6 }}>
            {['Frozen LLM backbone','Trainable: LoRA q_proj, v_proj','Text-only prompt template','Cold-start capability built here'].map((t,i)=>
              <li key={i} style={{ fontSize:12, color:C.muted, display:'flex', gap:6 }}>
                <CheckCircle size={13} color={C.primary} style={{flexShrink:0, marginTop:2}} />{t}
              </li>)}
          </ul>
        </Card>

        <Card style={{ borderColor:C.success+'44' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <Badge color={C.success}>Step 2</Badge>
            <span style={{ fontWeight:700 }}>CIE Module Tuning (Full Prompt)</span>
          </div>
          <p style={{ fontSize:13, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
            Freeze LoRA. Train CIE mapping layer (and optionally collaborative model)
            to align collaborative embeddings with LLM token space.
          </p>
          <div style={{ background:'rgba(16,185,129,.1)', borderRadius:10, padding:'10px 14px', fontFamily:'monospace', fontSize:12, color:C.success }}>
            min<sub>Ω</sub> Σ ℓ(h<sub>Θ̂+θ̂'</sub>(E), y)
          </div>
          <ul style={{ marginTop:12, display:'flex', flexDirection:'column', gap:6 }}>
            {['Frozen LLM + LoRA','Trainable: CIE mapping + collab model','Full prompt with UserID + TargetItemID','Warm-start boost achieved here'].map((t,i)=>
              <li key={i} style={{ fontSize:12, color:C.muted, display:'flex', gap:6 }}>
                <CheckCircle size={13} color={C.success} style={{flexShrink:0, marginTop:2}} />{t}
              </li>)}
          </ul>
        </Card>
      </div>

      {/* CIE detail */}
      <Card>
        <SectionTitle icon={<Cpu size={16}/>} title="CIE Module Architecture" />
        <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <div style={cieBox(C.secondary)}>
            <div style={{ fontWeight:700, fontSize:13 }}>Collaborative Model</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>MF / LightGCN / SASRec / DIN</div>
            <div style={{ fontSize:10, color:C.secondary, marginTop:8, fontFamily:'monospace' }}>Output: d₁ = 128</div>
          </div>
          {['Linear(128,512)', 'LayerNorm + ReLU', 'Linear(512,512)', 'LayerNorm + ReLU', 'Linear(512,768)', 'Projection(768,768)'].map((l,i) => (
            <React.Fragment key={i}>
              <ArrowRight size={14} color={C.border} />
              <div style={{ background:'rgba(245,158,11,.12)', border:`1px solid ${C.accent}33`, borderRadius:8, padding:'6px 12px', fontSize:11, color:C.accent, fontFamily:'monospace', whiteSpace:'nowrap' }}>{l}</div>
            </React.Fragment>
          ))}
          <ArrowRight size={14} color={C.border} />
          <div style={cieBox(C.success)}>
            <div style={{ fontWeight:700, fontSize:13 }}>LLM Token Space</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>Aligned with text embeddings</div>
            <div style={{ fontSize:10, color:C.success, marginTop:8, fontFamily:'monospace' }}>Output: d₂ = 768</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

const cieBox = color => ({
  background: color+'15', border:`1px solid ${color}44`, borderRadius:12,
  padding:'12px 18px', minWidth:140
});

/* ─── TRAINING ────────────────────────────────────────────────── */

function Training() {
  const { call, loading: apiLoading } = useApi();
  const [collab, setCollab]     = useState('mf');
  const [ep1, setEp1]           = useState(5);
  const [ep2, setEp2]           = useState(5);
  const [bs, setBs]             = useState(64);
  const [status, setStatus]     = useState(null);
  const [history, setHistory]   = useState({ step1:[], step2:[] });
  useWebSocket(WS); // kept for API compat — no-op on Vercel

  // Training results arrive instantly via HTTP POST — no WebSocket sync needed.

  const startTraining = async () => {
    setHistory({ step1:[], step2:[] });
    setStatus({ type:'running', progress:0 });
    const res = await call('/training/start', {
      method:'POST',
      body: JSON.stringify({ collab_type:collab, epochs_step1:ep1, epochs_step2:ep2, batch_size:bs })
    });
    // Serverless / Vercel: training returns instantly with full metrics
    if (res && (res.status === 'done' || res.type === 'done') && res.step1) {
      setHistory({ step1: res.step1 || [], step2: res.step2 || [] });
      setStatus({ type:'done', progress:100, final_auc: res.final_auc,
                  val_auc: res.final_auc, model: res.model });
    }
  };

  const pollStatus = async () => {
    const d = await call('/training/status');
    setStatus(d);
  };

  const combLoss = [
    ...(history.step1||[]).map(r=>({ epoch:`S1-${r.epoch}`, step1_loss:r.loss })),
    ...(history.step2||[]).map(r=>({ epoch:`S2-${r.epoch}`, step2_loss:r.loss })),
  ];
  const combAuc = [
    ...(history.step1||[]).map(r=>({ epoch:`S1-${r.epoch}`, step1_auc:r.val_auc })),
    ...(history.step2||[]).map(r=>({ epoch:`S2-${r.epoch}`, step2_auc:r.val_auc })),
  ];

  return (
    <div>
      <PageHeader icon={<GitBranch size={22}/>} title="Training Pipeline"
        sub="Two-step training: LoRA (cold-start) → CIE module (warm-start boost)" />

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:16 }}>
        {/* Config */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Card>
            <SectionTitle icon={<Settings size={15}/>} title="Training Config" />
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>Collaborative Model</div>
                {['mf','lightgcn','sasrec','din'].map(m => (
                  <button key={m} onClick={() => setCollab(m)}
                    style={{ ...modelBtn(m===collab), marginBottom:4, width:'100%' }}>
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
              <SliderRow label="Step 1 Epochs" val={ep1} setVal={setEp1} min={1} max={20} />
              <SliderRow label="Step 2 Epochs" val={ep2} setVal={setEp2} min={1} max={20} />
              <SliderRow label="Batch Size" val={bs} setVal={setBs} min={16} max={256} step={16} />

              <button onClick={startTraining} disabled={apiLoading}
                style={{ ...primaryBtn, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {apiLoading ? <Spinner /> : <Play size={16} />}
                Start Training
              </button>
              <button onClick={pollStatus}
                style={{ ...secondaryBtn, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <RefreshCw size={14} /> Refresh Status
              </button>
            </div>
          </Card>

          <Card>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <Wifi size={14} color={C.primary} />
              <span style={{fontSize:12,color:C.primary}}>Serverless Mode — Results instant</span>
            </div>
            {status && (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                  <span style={{color:C.muted}}>Status</span>
                  <Badge color={status.status==='done'?C.success:status.status==='training'?C.primary:C.muted}>
                    {status.status || 'idle'}
                  </Badge>
                </div>
                {status.progress !== undefined && (
                  <>
                    <Progress value={status.progress} />
                    <div style={{ fontSize:11, color:C.muted, textAlign:'right' }}>{status.progress}%</div>
                  </>
                )}
                {status.step && <div style={{ fontSize:12 }}><span style={{color:C.muted}}>Step</span> <strong>{status.step}/2</strong> Epoch <strong>{status.epoch}</strong></div>}
                {status.val_auc && <div style={{ fontSize:12 }}><span style={{color:C.muted}}>Val AUC</span> <strong style={{color:C.success}}>{status.val_auc}</strong></div>}
                {status.loss && <div style={{ fontSize:12 }}><span style={{color:C.muted}}>Loss</span> <strong>{status.loss}</strong></div>}
              </div>
            )}
          </Card>
        </div>

        {/* Charts */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <Card>
              <SectionTitle icon={<TrendingUp size={15}/>} title="Loss Curves" />
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={combLoss}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="epoch" tick={{fill:C.muted,fontSize:10}} />
                  <YAxis tick={{fill:C.muted,fontSize:10}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Line type="monotone" dataKey="step1_loss" stroke={C.primary}   name="Step 1 Loss" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="step2_loss" stroke={C.secondary} name="Step 2 Loss" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <SectionTitle icon={<Award size={15}/>} title="AUC Improvement" />
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={combAuc}>
                  <defs>
                    <linearGradient id="ga1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.primary}   stopOpacity={.25} />
                      <stop offset="95%" stopColor={C.primary}   stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="ga2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.success}   stopOpacity={.25} />
                      <stop offset="95%" stopColor={C.success}   stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="epoch" tick={{fill:C.muted,fontSize:10}} />
                  <YAxis domain={[0.5,0.9]} tick={{fill:C.muted,fontSize:10}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Area type="monotone" dataKey="step1_auc" stroke={C.primary} fill="url(#ga1)" name="Step 1 AUC" strokeWidth={2} />
                  <Area type="monotone" dataKey="step2_auc" stroke={C.success} fill="url(#ga2)" name="Step 2 AUC" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Hyperparams */}
          <Card>
            <SectionTitle icon={<Filter size={15}/>} title="Hyperparameters (Paper)" />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                { title:'LoRA', rows:[['Rank (r)','8'],['Alpha','16'],['Dropout','0.05'],['Modules','q_proj, v_proj']] },
                { title:'Training', rows:[['Optimizer','AdamW'],['LR (LoRA)','1e-4'],['LR (Collab)','1e-3'],['Max Seq Len','512']] },
                { title:'CIE Module', rows:[['Hidden Layers','3'],['Hidden Dim','512'],['Collab Dim','128'],['Dropout','0.1']] },
              ].map((g,i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:12 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#f8fafc', marginBottom:10 }}>{g.title}</div>
                  {g.rows.map(([k,v],j) => (
                    <div key={j} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:`1px solid ${C.border}` }}>
                      <span style={{color:C.muted}}>{k}</span>
                      <strong style={{color:'#f8fafc'}}>{v}</strong>
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

/* ─── PERFORMANCE ─────────────────────────────────────────────── */

function Performance() {
  const { call } = useApi();
  const [ablation, setAblation]   = useState(null);
  const [tuning, setTuning]       = useState(null);
  const [warmcold, setWarmCold]   = useState(null);

  useEffect(() => {
    call('/analytics/ablation').then(d => setAblation(d.data)).catch(()=>{});
    call('/analytics/tuning').then(d => setTuning(d.data)).catch(()=>{});
    call('/analytics/warm-cold').then(d => setWarmCold(d.data)).catch(()=>{});
  }, [call]);

  const overall = [
    { m:'MF',             ml1m_auc:.6482, ml1m_uauc:.6361, book_auc:.7134, book_uauc:.5565, type:'collab' },
    { m:'LightGCN',       ml1m_auc:.5959, ml1m_uauc:.6499, book_auc:.7103, book_uauc:.5639, type:'collab' },
    { m:'SASRec',         ml1m_auc:.7078, ml1m_uauc:.6884, book_auc:.6887, book_uauc:.5714, type:'collab' },
    { m:'DIN',            ml1m_auc:.7166, ml1m_uauc:.6459, book_auc:.8163, book_uauc:.6145, type:'collab' },
    { m:'CTRL (DIN)',     ml1m_auc:.7159, ml1m_uauc:.6492, book_auc:.8202, book_uauc:.5996, type:'lm+collab' },
    { m:'ICL',            ml1m_auc:.5320, ml1m_uauc:.5268, book_auc:.4820, book_uauc:.4856, type:'llmrec' },
    { m:'TALLRec',        ml1m_auc:.7097, ml1m_uauc:.6818, book_auc:.7375, book_uauc:.5983, type:'llmrec' },
    { m:'CoLLM-MF',       ml1m_auc:.7295, ml1m_uauc:.6875, book_auc:.8109, book_uauc:.6225, type:'ours' },
    { m:'CoLLM-LightGCN', ml1m_auc:.7100, ml1m_uauc:.6967, book_auc:.8026, book_uauc:.6149, type:'ours' },
    { m:'CoLLM-SASRec',   ml1m_auc:.7235, ml1m_uauc:.6990, book_auc:.7746, book_uauc:.5962, type:'ours' },
    { m:'CoLLM-DIN',      ml1m_auc:.7353, ml1m_uauc:.6923, book_auc:.8245, book_uauc:.6474, type:'ours' },
  ];

  return (
    <div>
      <PageHeader icon={<BarChart3 size={22}/>} title="Performance Analysis"
        sub="Comprehensive evaluation from paper — ML-1M and Amazon-Book datasets" />

      {/* Full table */}
      <Card style={{ marginBottom:20 }}>
        <SectionTitle icon={<Award size={16}/>} title="Table 2 — Overall Performance Comparison" />
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                {['Method','Type','ML-1M AUC','ML-1M UAUC','ML-1M NDCG','Book AUC','Book UAUC','Book NDCG'].map(h => (
                  <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:C.muted, fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {overall.map((r, i) => {
                const tb = TYPE_BADGE[r.type] || {};
                const isOurs = r.type === 'ours';
                return (
                  <tr key={i} style={{
                    borderBottom:`1px solid ${C.border}`,
                    background: isOurs ? 'rgba(16,185,129,0.06)' : 'transparent'
                  }}>
                    <td style={{ padding:'8px 12px', fontWeight: isOurs ? 700 : 400, color: isOurs ? C.success : '#f8fafc' }}>{r.m}</td>
                    <td style={{ padding:'8px 12px' }}><Badge color={tb.color} bg={tb.bg}>{tb.label}</Badge></td>
                    {[r.ml1m_auc, r.ml1m_uauc, undefined, r.book_auc, r.book_uauc, undefined].map((v, j) => (
                      v !== undefined
                        ? <td key={j} style={{ padding:'8px 12px', fontFamily:'monospace', color: isOurs ? C.success : '#f8fafc' }}>{v.toFixed(4)}</td>
                        : <td key={j} style={{ padding:'8px 12px', color:C.muted }}>—</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Warm / Cold */}
      {warmcold && (
        <Card style={{ marginBottom:20 }}>
          <SectionTitle icon={<Activity size={16}/>} title="Warm vs Cold Scenario Analysis" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={warmcold} layout="vertical" margin={{left:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" domain={[0.45,0.85]} tick={{fill:C.muted,fontSize:11}} />
              <YAxis dataKey="scenario" type="category" width={130} tick={{fill:C.muted,fontSize:11}} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{fontSize:11}} />
              <Bar dataKey="MF"      fill={C.primary}   name="MF"      radius={[0,4,4,0]} />
              <Bar dataKey="TALLRec" fill={C.secondary} name="TALLRec" radius={[0,4,4,0]} />
              <Bar dataKey="CoLLM"   fill={C.success}   name="CoLLM"   radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Ablation */}
        {ablation && (
          <Card>
            <SectionTitle icon={<FlaskConical size={16}/>} title="Ablation Study — CIE Module" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ablation}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="variant" tick={{fill:C.muted,fontSize:11}} />
                <YAxis domain={[0.55,0.76]} tick={{fill:C.muted,fontSize:11}} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{fontSize:11}} />
                <Bar dataKey="ml1m_auc"  fill={C.primary}   name="ML-1M AUC"  radius={[4,4,0,0]} />
                <Bar dataKey="ml1m_uauc" fill={C.secondary} name="ML-1M UAUC" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop:12, fontSize:12, color:C.muted, lineHeight:1.7, background:'rgba(255,255,255,0.03)', borderRadius:8, padding:10 }}>
              <strong style={{color:'#f8fafc'}}>Key insight:</strong> Removing CIE (w/o CIE) drops to TALLRec level. Direct UI-token approach actually hurts performance due to tokenization redundancy — CIE's low-rank structure is essential.
            </div>
          </Card>
        )}

        {/* Tuning */}
        {tuning && (
          <Card>
            <SectionTitle icon={<GitBranch size={16}/>} title="Tuning Strategy Comparison" />
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={tuning}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="method" tick={{fill:C.muted,fontSize:10}} />
                <YAxis domain={[0.65,0.75]} tick={{fill:C.muted,fontSize:11}} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{fontSize:11}} />
                <Line type="monotone" dataKey="ml1m_auc"  stroke={C.primary}   name="ML-1M AUC"  strokeWidth={2} dot={{ r:4 }} />
                <Line type="monotone" dataKey="book_auc"  stroke={C.secondary} name="Amazon AUC" strokeWidth={2} dot={{ r:4 }} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ marginTop:12, fontSize:12, color:C.muted, lineHeight:1.7, background:'rgba(255,255,255,0.03)', borderRadius:8, padding:10 }}>
              <strong style={{color:'#f8fafc'}}>Key insight:</strong> T3 one-step hurts cold-start badly. T1/T2 two-step strategies provide marginal extra gain at 5× training cost. Default two-step is the optimal trade-off.
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ─── MODEL COMPARISON ────────────────────────────────────────── */

function ModelComparison() {
  const { call } = useApi();
  const [data, setData]       = useState([]);
  const [dataset, setDataset] = useState('ml1m');
  const [metric, setMetric]   = useState('auc');
  const [selected, setSelected] = useState(new Set(['CoLLM-DIN','CoLLM-MF','TALLRec','DIN','MF']));

  useEffect(() => {
    call('/model/comparison').then(d => setData(d.comparison)).catch(() => {});
  }, [call]);

  const key = dataset === 'ml1m' ? `ml1m_${metric}` : `book_${metric}`;
  const filtered = data.filter(d => selected.has(d.model));
  const chartData = filtered.map(d => ({ name:d.model, value:d[key], type:d.type }));

  const toggleModel = m => setSelected(prev => {
    const n = new Set(prev);
    n.has(m) ? n.delete(m) : n.add(m);
    return n;
  });

  return (
    <div>
      <PageHeader icon={<GitCompare size={22}/>} title="Model Comparison"
        sub="Side-by-side comparison of all methods from Table 2 of the paper" />

      {/* Controls */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>Dataset</div>
            <div style={{ display:'flex', gap:6 }}>
              {[['ml1m','ML-1M'],['book','Amazon-Book']].map(([id,label]) => (
                <button key={id} onClick={() => setDataset(id)}
                  style={tabBtn(dataset===id)}>{label}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>Metric</div>
            <div style={{ display:'flex', gap:6 }}>
              {['auc','uauc','ndcg'].map(m => (
                <button key={m} onClick={() => setMetric(m)} style={tabBtn(metric===m)}>{m.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop:14 }}>
          <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>Toggle Models</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {data.map(d => {
              return (
                <button key={d.model} onClick={() => toggleModel(d.model)}
                  style={{
                    padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer',
                    border:`1px solid ${selected.has(d.model) ? (MODEL_COLORS[d.model]||C.primary) : C.border}`,
                    background: selected.has(d.model) ? (MODEL_COLORS[d.model]||C.primary)+'22' : 'transparent',
                    color: selected.has(d.model) ? (MODEL_COLORS[d.model]||C.primary) : C.muted,
                    transition:'all .15s'
                  }}>
                  {d.model}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Bar chart */}
      <Card style={{ marginBottom:16 }}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{top:10,right:20,left:-10,bottom:60}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" tick={{fill:C.muted,fontSize:11}} angle={-30} textAnchor="end" />
            <YAxis tick={{fill:C.muted,fontSize:11}} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name={metric.toUpperCase()} radius={[6,6,0,0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={MODEL_COLORS[entry.name] || C.primary} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Scatter: warmAUC vs coldAUC */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card>
          <SectionTitle icon={<Activity size={16}/>} title="Warm vs Cold AUC (ML-1M)" />
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{top:10,right:20,bottom:10,left:-10}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="x" name="Warm AUC" type="number" domain={[0.55,0.76]} tick={{fill:C.muted,fontSize:11}} label={{value:'Warm AUC',fill:C.muted,fontSize:11,dy:14}} />
              <YAxis dataKey="y" name="Cold AUC" type="number" domain={[0.45,0.73]} tick={{fill:C.muted,fontSize:11}} label={{value:'Cold AUC',fill:C.muted,fontSize:11,angle:-90,dx:-14}} />
              <ZAxis range={[60,60]} />
              <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload;
                return <div style={{ background:'rgba(15,23,42,.95)', border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 12px', fontSize:12 }}>
                  <div style={{ fontWeight:700, color:'#f8fafc' }}>{p.name}</div>
                  <div style={{ color:C.muted }}>Warm AUC: <strong style={{color:C.primary}}>{p.x.toFixed(4)}</strong></div>
                  <div style={{ color:C.muted }}>Cold AUC: <strong style={{color:C.success}}>{p.y.toFixed(4)}</strong></div>
                </div>;
              }} />
              <Scatter data={data.map(d=>({ name:d.model, x:d.ml1m_auc, y:d.book_auc, fill: MODEL_COLORS[d.model]||C.primary }))}
                shape={({ cx, cy, payload }) => (
                  <g>
                    <circle cx={cx} cy={cy} r={8} fill={payload.fill} fillOpacity={.85} />
                    <text x={cx} y={cy-12} textAnchor="middle" fill={payload.fill} fontSize={9}>{payload.name}</text>
                  </g>
                )} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle icon={<Box size={16}/>} title="Relative Improvement over Baselines" />
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
            {data.filter(d=>d.type==='ours').map((d,i) => (
              <div key={i}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                  <span style={{ color:'#f8fafc', fontWeight:600 }}>{d.model}</span>
                  <span style={{ color:C.success }}>{d.rel_imp || '—'}</span>
                </div>
                <Progress value={parseFloat(d.rel_imp)||0} color={C.success} height={5} />
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, fontSize:12, color:C.muted, lineHeight:1.6 }}>
            Relative improvement averaged over AUC and UAUC metrics compared to the corresponding collaborative baseline.
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─── DATASETS ────────────────────────────────────────────────── */

function Datasets() {
  const ds = [
    { name:'ML-1M', full:'MovieLens 1M', color:C.primary,
      desc:'Movie recommendation dataset with 1M ratings (scale 1–5) from 6,040 users on 3,706 movies, collected 2000–2003.',
      stats:{ Users:839, Items:3256, Train:33891, Valid:10401, Test:7331 },
      threshold:'Rating > 3 → positive', split:'Temporal: first 10 months train | 5 months val | 5 months test',
      url:'https://grouplens.org/datasets/movielens/1m/' },
    { name:'Amazon-Book', full:'Amazon Product Reviews', color:C.secondary,
      desc:'Book subset of Amazon reviews (1996–2018). Sparse dataset filtered to users/items with ≥ 20 interactions.',
      stats:{ Users:22967, Items:34154, Train:727468, Valid:25747, Test:25747 },
      threshold:'Rating ≥ 4 → positive (higher threshold prevents imbalance)', split:'Temporal: first 11 months train | last 2 half-months val/test',
      url:'https://cseweb.ucsd.edu/~jmcauley/datasets.html#amazon_reviews' },
  ];

  const pipeline = [
    { step:'Load', desc:'Raw interaction CSV with timestamps' },
    { step:'Temporal Split', desc:'Sort by time; split to prevent data leakage' },
    { step:'Binarize', desc:'Ratings → binary labels via threshold' },
    { step:'Filter', desc:'Remove sparse users/items (Amazon: ≥20 interactions)' },
    { step:'Prompt Gen', desc:'Fill template: HisItemTitleList, UserID, TargetItemTitle, TargetItemID' },
    { step:'Tokenize', desc:'LLM tokenizer for text; CIE module for IDs' },
  ];

  const distribution = [
    { name:'ML-1M Train',    value:33891,  color:C.primary },
    { name:'ML-1M Valid',    value:10401,  color:C.secondary },
    { name:'ML-1M Test',     value:7331,   color:C.accent },
    { name:'Amazon Train',   value:727468, color:C.success },
    { name:'Amazon Valid',   value:25747,  color:C.info },
    { name:'Amazon Test',    value:25747,  color:C.warning },
  ];

  return (
    <div>
      <PageHeader icon={<Database size={22}/>} title="Datasets"
        sub="Evaluation benchmarks used in the CoLLM paper" />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {ds.map((d,i) => (
          <Card key={i} style={{ borderColor: d.color+'44' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:d.color+'22', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Database size={20} color={d.color} />
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:16 }}>{d.name}</div>
                <div style={{ fontSize:12, color:C.muted }}>{d.full}</div>
              </div>
              <a href={d.url} target="_blank" rel="noreferrer"
                style={{ marginLeft:'auto', color:d.color, fontSize:11, textDecoration:'none' }}>
                <Globe size={14} style={{ verticalAlign:'middle' }} /> Dataset
              </a>
            </div>
            <p style={{ fontSize:12, color:C.muted, lineHeight:1.7, marginBottom:14 }}>{d.desc}</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
              {Object.entries(d.stats).map(([k,v]) => (
                <div key={k} style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                  <div style={{ fontWeight:700, fontSize:15, color:d.color }}>{v.toLocaleString()}</div>
                  <div style={{ fontSize:10, color:C.muted }}>{k}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, color:C.muted }}>
              <div style={{ marginBottom:4 }}>🏷️ <strong>Threshold:</strong> {d.threshold}</div>
              <div>📅 <strong>Split:</strong> {d.split}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card>
          <SectionTitle icon={<BarChart3 size={16}/>} title="Data Distribution" />
          <ResponsiveContainer width="100%" height={260}>
            <RPieChart>
              <Pie data={distribution} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent*100).toFixed(1)}%`}
                labelLine={{ stroke:C.muted }}>
                {distribution.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={v => v.toLocaleString()} />
            </RPieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle icon={<Filter size={16}/>} title="Preprocessing Pipeline" />
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {pipeline.map((s,i) => (
              <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:24, height:24, borderRadius:6, background:C.primary+'22', flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:C.primary, marginTop:2 }}>{i+1}</div>
                <div>
                  <div style={{ fontWeight:600, fontSize:13 }}>{s.step}</div>
                  <div style={{ fontSize:12, color:C.muted }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─── PAPER EXPLORER ─────────────────────────────────────────── */

function PaperExplorer() {
  const [open, setOpen] = useState({ intro:true });
  const toggle = k => setOpen(p => ({ ...p, [k]:!p[k] }));

  const sections = [
    { id:'intro', title:'1. Introduction', icon:'🧠',
      content:`LLMs like GPT-3 and LLaMA have remarkable capabilities in context comprehension and world knowledge. Recommendation systems stand to benefit hugely from LLMs — especially for cold-start users where text-based world knowledge can substitute for missing interaction data.

However, existing LLMRec approaches (TALLRec, BIGRec, ICL) rely predominantly on text semantics and overlook collaborative filtering signals. Two items with similar descriptions may have distinct collaborative patterns if consumed by different user groups — text alone misses this.

CoLLM introduces a novel solution: treat collaborative information as a separate modality (like visual features in multimodal LLMs), encode it externally via traditional CF models, and map it into LLM token space via an MLP-based CIE module.`,
      highlight:'Problem: LLMRec methods ignore collaborative information, hurting warm-start performance.' },

    { id:'method', title:'4. Methodology', icon:'⚙️',
      content:`CoLLM architecture has three components:

1. Prompt Construction: Standard text template + <UserID> and <TargetItemID> placeholder fields.
2. Hybrid Encoding: Text tokens via LLM embedding lookup. UserID/TargetItemID via CIE module (traditional collab model → MLP → LLM space).
3. LLM Prediction: Frozen LLM + LoRA adapters. Recommendation head outputs Yes/No probability.

Two-step tuning:
• Step 1 — LoRA only, text-only prompts → learns recommendation from language (cold-start)
• Step 2 — CIE module + collab model, full prompts → integrates collaborative info (warm-start)

The CIE module maintains low-rank structure (inherits from CF models), avoiding the tokenization redundancy that plagues direct UI-token approaches.`,
      highlight:'CIE module: maps collaborative embeddings (d₁=128) → LLM token space (d₂=768) via 3-layer MLP.' },

    { id:'results', title:'5. Experiments', icon:'📊',
      content:`Datasets: ML-1M (839 users, 3,256 items) and Amazon-Book (22,967 users, 34,154 items). Temporal split prevents data leakage.

Baselines: MF, LightGCN, SASRec, DIN (collaborative); CTRL+DIN (LM+collab); ICL, Prompt4NR, TALLRec (LLMRec).

Key results (Amazon-Book AUC):
• MF: 0.7134 | TALLRec: 0.7375 | CoLLM-DIN: 0.8245 ✓ (best)

Warm scenario: CoLLM > MF > TALLRec (collaborative info crucial)
Cold scenario: CoLLM ≈ TALLRec > MF (LLM semantics preserved)

Ablation: Removing CIE drops to TALLRec level. Direct UI-tokens hurt performance (tokenization redundancy). Two-step training necessary for cold-start capability.

Efficiency: CoLLM adds only ~13% training time and ~12% inference time over TALLRec.`,
      highlight:'CoLLM achieves best of both worlds: +15% warm-start over TALLRec, cold-start parity.' },

    { id:'related', title:'2. Related Work', icon:'📚',
      content:`LLMRec methods:
• In-Context Learning (Chat-Rec, ICL): Directly query LLMs without fine-tuning → suboptimal
• Instruction Tuning (TALLRec, P5): Fine-tune with recommendation data → better but still misses collaborative info
• BIGRec: Ensembles LLM + CF → external, doesn't integrate into LLM generation

Multimodal LLMs (inspiration):
• MiniGPT-4: Align frozen visual encoder → LLM space
• Palm-E: Map continuous sensor inputs → language model
• CoLLM treats collaborative information as another modality, analogous to visual features

Key distinction from concurrent works [35,36]: Those learn ID embeddings directly in LLM space. CoLLM maps pre-trained collaborative embeddings, leveraging existing CF model expertise.`,
      highlight:'Collaborative filtering → new modality, mapped to LLM space, exactly like vision in multimodal LLMs.' },

    { id:'conclusion', title:'6. Conclusion & Future Work', icon:'🔭',
      content:`CoLLM successfully integrates collaborative information into LLMs for recommendation, achieving superior performance in both warm and cold scenarios.

Key contributions:
1. Identified inadequate collaborative information modeling as LLMRec's primary weakness
2. Proposed CoLLM: external CF model → CIE mapping → LLM token space
3. Two-step training strategy preserving cold-start capability while adding warm-start strength
4. Flexible CIE supports any CF model (MF, LightGCN, SASRec, DIN)
5. Minimal overhead: ~13% training, ~12% inference over TALLRec baseline

Future directions:
• Explore larger LLM backbones (tested: Vicuna-7B, Qwen2-1.5B)
• Incremental learning for evolving collaborative information
• Extension to cross-domain recommendation
• Application to item cold-start (not just user cold-start)`,
      highlight:'GitHub: https://github.com/zyang1580/CoLLM — Full implementation with Vicuna-7B + LoRA.' },
  ];

  return (
    <div>
      <PageHeader icon={<Telescope size={22}/>} title="Paper Explorer"
        sub="Interactive walkthrough of CoLLM (arXiv:2310.19488v3 · Jun 2025)" />

      <Card style={{ marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>CoLLM: Integrating Collaborative Embeddings into Large Language Models for Recommendation</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>Yang Zhang, Fuli Feng, Jizhi Zhang, Keqin Bao, Qifan Wang, Xiangnan He · USTC + Meta AI</div>
          </div>
          <a href="https://arxiv.org/abs/2310.19488" target="_blank" rel="noreferrer"
            style={{ ...secondaryBtn, textDecoration:'none', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
            <Globe size={14} /> arXiv
          </a>
          <a href="https://github.com/zyang1580/CoLLM" target="_blank" rel="noreferrer"
            style={{ ...primaryBtn, textDecoration:'none', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
            <GitBranch size={14} /> GitHub
          </a>
        </div>
      </Card>

      {sections.map(s => (
        <Card key={s.id} style={{ marginBottom:12 }}>
          <button onClick={() => toggle(s.id)}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', padding:0 }}>
            <span style={{ fontSize:18 }}>{s.icon}</span>
            <span style={{ fontWeight:700, fontSize:14, color:'#f8fafc', flex:1, textAlign:'left' }}>{s.title}</span>
            {open[s.id] ? <ChevronUp size={16} color={C.muted} /> : <ChevronDown size={16} color={C.muted} />}
          </button>

          {open[s.id] && (
            <div style={{ marginTop:16 }}>
              <div style={{ background:C.primary+'15', border:`1px solid ${C.primary}33`, borderRadius:10, padding:'10px 14px', fontSize:12, color:C.primary, marginBottom:14, lineHeight:1.6 }}>
                💡 {s.highlight}
              </div>
              <div style={{ fontSize:13, color:C.muted, lineHeight:1.85, whiteSpace:'pre-wrap' }}>
                {s.content}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ─── SHARED HELPERS ─────────────────────────────────────────── */

function PageHeader({ icon, title, sub }) {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
        <span style={{ color:C.primary }}>{icon}</span>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#f8fafc', margin:0 }}>{title}</h1>
      </div>
      <p style={{ color:C.muted, fontSize:13, margin:0 }}>{sub}</p>
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
      <span style={{ color:C.primary }}>{icon}</span>
      <span style={{ fontWeight:700, fontSize:14, color:'#f8fafc' }}>{title}</span>
    </div>
  );
}

function ErrBadge({ msg }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderRadius:8, background:'rgba(239,68,68,.12)', border:`1px solid ${C.danger}44`, fontSize:12, color:C.danger }}>
      <AlertCircle size={13} /> {msg}
    </div>
  );
}

function SliderRow({ label, val, setVal, min, max, step=1 }) {
  return (
    <label style={labelStyle}>
      <span style={{ fontSize:12, color:C.muted }}>{label}: <strong style={{color:'#f8fafc'}}>{val}</strong></span>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => setVal(+e.target.value)} style={{ width:'100%', accentColor:C.primary }} />
    </label>
  );
}

/* ─── STYLES ──────────────────────────────────────────────────── */

const labelStyle = { display:'flex', flexDirection:'column', gap:6 };

const inputStyle = {
  background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`,
  borderRadius:8, padding:'8px 12px', color:'#f8fafc', fontSize:13,
  width:'100%', outline:'none'
};

const primaryBtn = {
  background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none',
  borderRadius:10, padding:'10px 20px', color:'#fff', fontWeight:700,
  fontSize:13, cursor:'pointer', transition:'opacity .15s'
};

const secondaryBtn = {
  background:'rgba(99,102,241,0.12)', border:`1px solid ${C.border}`,
  borderRadius:10, padding:'10px 20px', color:C.primary, fontWeight:600,
  fontSize:13, cursor:'pointer', transition:'all .15s'
};

const btnSmall = {
  background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`,
  borderRadius:8, padding:'8px', color:C.muted, cursor:'pointer', display:'flex', alignItems:'center'
};

const modelBtn = active => ({
  padding:'6px 12px', borderRadius:8, border:`1px solid`,
  borderColor: active ? C.primary : C.border,
  background: active ? C.primary+'22' : 'transparent',
  color: active ? C.primary : C.muted,
  fontSize:11, fontWeight: active ? 700 : 400, cursor:'pointer',
  marginBottom:0, textAlign:'left'
});

const tabBtn = active => ({
  padding:'6px 14px', borderRadius:8, border:`1px solid`,
  borderColor: active ? C.primary : C.border,
  background: active ? C.primary+'22' : 'transparent',
  color: active ? C.primary : C.muted,
  fontSize:12, fontWeight: active ? 700 : 400, cursor:'pointer'
});

/* ─── ROOT APP ────────────────────────────────────────────────── */

const PAGES = {
  dashboard:    Dashboard,
  recommend:    Recommendations,
  architecture: Architecture,
  training:     Training,
  analysis:     Performance,
  compare:      ModelComparison,
  datasets:     Datasets,
  explorer:     PaperExplorer,
};

export default function App() {
  const [page, setPage]       = useState('dashboard');
  const [collapsed, setCol]   = useState(false);
  const Page = PAGES[page] || Dashboard;

  return (
    <div style={{ minHeight:'100vh', background:C.darker, color:'#f8fafc', fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(99,102,241,.3); border-radius:3px; }
        input[type=range] { height:4px; border-radius:2px; cursor:pointer; }
        a:hover { opacity:.8; }
      `}</style>

      <Particles />
      <Sidebar active={page} setActive={setPage} collapsed={collapsed} setCollapsed={setCol} />

      <main style={{
        marginLeft: collapsed ? 68 : 260,
        padding: '32px 36px',
        minHeight:'100vh',
        position:'relative', zIndex:1,
        transition:'margin-left .25s ease'
      }}>
        <div style={{ maxWidth:1300 }}>
          <Page />
        </div>
      </main>
    </div>
  );
}
