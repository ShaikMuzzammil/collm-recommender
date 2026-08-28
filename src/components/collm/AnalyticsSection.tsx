"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Zap, Users, RefreshCw, Activity, Database, Download } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from "recharts";

const PALETTE = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

const WARM_COLD = [
  { name: "ML-1M Warm", mf: 72.0, tallrec: 71.0, collm: 75.0 },
  { name: "ML-1M Cold", mf: 50.5, tallrec: 75.0, collm: 76.0 },
  { name: "Book Warm", mf: 78.0, tallrec: 74.5, collm: 83.5 },
  { name: "Book Cold", mf: 51.0, tallrec: 73.8, collm: 75.6 },
];

const ABLATION = [
  { name: "CoLLM-MF", auc: 0.7295, uauc: 0.6875, ndcg: 0.8714 },
  { name: "w/o CIE", auc: 0.7097, uauc: 0.6818, ndcg: 0.8711 },
  { name: "w/ UI-token", auc: 0.7214, uauc: 0.6563, ndcg: 0.8690 },
];

const EFFICIENCY = [
  { name: "Train Time", tallrec: 32, collm: 36 },
  { name: "Inference Time (s)", tallrec: 72, collm: 82 },
];

export default function AnalyticsSection() {
  const [summary, setSummary] = useState<any>(null);
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [modelUsage, setModelUsage] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    const res = await fetch("/api/analytics");
    setLoading(false);
    if (res.ok) {
      const d = await res.json();
      setSummary(d.summary);
      setTimeSeries(d.timeSeries?.recommendations ?? []);
      setModelUsage(Object.entries(d.modelUsage ?? {}).map(([name, value]) => ({ name, value: value as number })));
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const summaryCards = summary ? [
    { label: "Total Recommendations", value: summary.totalRecs, icon: TrendingUp, color: "text-emerald-400" },
    { label: "Training Jobs", value: summary.totalJobs, icon: Activity, color: "text-blue-400" },
    { label: "Evaluations", value: summary.totalEvals, icon: BarChart3, color: "text-purple-400" },
    { label: "Exports", value: summary.totalExports, icon: Download, color: "text-amber-400" },
    { label: "Avg AUC", value: summary.avgAuc, icon: Zap, color: "text-emerald-400" },
    { label: "Avg Latency (ms)", value: summary.avgLatency, icon: Users, color: "text-blue-400" },
  ] : [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground text-sm">Performance metrics, usage patterns & research insights</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
          <RefreshCw className={`size-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />Refresh
        </Button>
      </div>

      {/* Summary cards */}
      {summaryCards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {summaryCards.map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="border-border">
                <CardContent className="p-4">
                  <c.icon className={`size-5 ${c.color} mb-2`} />
                  <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{c.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Time series & model usage */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="size-4 text-emerald-500" />Recommendations — Last 7 Days</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" />
                  <YAxis tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="count" stroke="#10b981" fill="url(#recGrad)" strokeWidth={2} name="Recommendations" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Database className="size-4 text-emerald-500" />Model Usage</CardTitle></CardHeader>
          <CardContent>
            {modelUsage.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={modelUsage} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" nameKey="name" paddingAngle={3}>
                      {modelUsage.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Run predictions to see usage</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Warm/Cold comparison */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="size-4 text-emerald-500" />Warm vs Cold AUC (%) — MF vs TALLRec vs CoLLM</CardTitle></CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WARM_COLD} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" />
                <YAxis domain={[45, 90]} tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" unit="%" />
                <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="mf" name="MF" fill="#475569" radius={[2, 2, 0, 0]} />
                <Bar dataKey="tallrec" name="TALLRec" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="collm" name="CoLLM" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Ablation + Efficiency */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Ablation Study — ML-1M</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ABLATION} layout="vertical" margin={{ top: 0, right: 8, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" domain={[0.62, 0.76]} tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" />
                  <Tooltip formatter={(v: any) => v.toFixed(4)} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="auc" name="AUC" fill="#10b981" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="uauc" name="UAUC" fill="#3b82f6" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Overhead vs TALLRec (min)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={EFFICIENCY} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" />
                  <YAxis tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="tallrec" name="TALLRec" fill="#475569" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="collm" name="CoLLM" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">CoLLM adds only ~13–18% overhead in training and ~12.5% in inference.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
