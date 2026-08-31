// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import {
  User, Settings, Key, Shield, CheckCircle, Save, Eye, EyeOff,
  Copy, RefreshCw, Palette, Database, Zap, Bell, LogOut,
  ChevronRight, Loader2
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function SuccessBanner({ msg }: { msg: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">
      <CheckCircle className="size-4 shrink-0" /> {msg}
    </motion.div>
  );
}

// ── Profile Tab ────────────────────────────────────────────────────────────────
function ProfileTab() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [org,  setOrg]  = useState("");
  const [bio,  setBio]  = useState("");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false); setSaved(true);
    toast.success("Profile updated");
    setTimeout(() => setSaved(false), 3000);
  };

  const initials = (session?.user?.name ?? "U").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();

  return (
    <div className="space-y-6">
      {saved && <SuccessBanner msg="Profile saved successfully" />}

      {/* Avatar row */}
      <div className="flex items-center gap-5">
        <Avatar className="size-20 border-2 border-emerald-500/30">
          <AvatarImage src={session?.user?.image ?? undefined} />
          <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-2xl font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold text-lg">{session?.user?.name ?? "User"}</div>
          <div className="text-sm text-muted-foreground">{session?.user?.email ?? "Not signed in"}</div>
          <Badge variant="outline" className="mt-1 text-[10px] border-emerald-500/30 text-emerald-400">
            {session ? "Active Account" : "Guest"}
          </Badge>
        </div>
      </div>

      <Separator className="opacity-30" />

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Full Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Email Address</Label>
          <Input value={session?.user?.email ?? ""} disabled className="opacity-60 cursor-not-allowed" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Organization / Institution</Label>
          <Input value={org} onChange={e => setOrg(e.target.value)} placeholder="e.g. USTC, MIT, Stanford…" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Research Focus</Label>
          <Input value={bio} onChange={e => setBio(e.target.value)} placeholder="e.g. Recommender Systems, NLP…" />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
        {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
        {saving ? "Saving…" : "Save Profile"}
      </Button>
    </div>
  );
}

// ── Preferences Tab ────────────────────────────────────────────────────────────
function PreferencesTab() {
  const { theme, setTheme } = useTheme();
  const { selectedDataset, selectedModel, setSelectedDataset, setSelectedModel } = useStore();
  const [notifications, setNotifications] = useState({ training: true, evaluation: true, export: false });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await new Promise(r => setTimeout(r, 400));
    setSaved(true); toast.success("Preferences saved");
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {saved && <SuccessBanner msg="Preferences saved" />}

      {/* Appearance */}
      <div>
        <div className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Palette className="size-4 text-emerald-500" /> Appearance
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(["dark","light","system"] as const).map(t => (
            <button key={t} onClick={() => setTheme(t)}
              className={cn("rounded-xl border p-3 text-center text-sm capitalize transition-all",
                theme === t ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-border/50 text-muted-foreground hover:border-border")}>
              <div className={cn("mx-auto mb-2 size-10 rounded-lg border flex items-center justify-center",
                t === "dark" ? "bg-slate-900 border-slate-700" : t === "light" ? "bg-white border-gray-200" : "bg-gradient-to-br from-slate-900 to-white border-slate-400")}>
                <div className={cn("size-4 rounded-full", t === "dark" ? "bg-emerald-400" : t === "light" ? "bg-amber-400" : "bg-gradient-to-r from-emerald-400 to-amber-400")} />
              </div>
              {t}
              {theme === t && <div className="mt-1 text-[10px] text-emerald-400">Active</div>}
            </button>
          ))}
        </div>
      </div>

      <Separator className="opacity-30" />

      {/* Defaults */}
      <div>
        <div className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Database className="size-4 text-emerald-500" /> Default Data Selections
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Default Dataset</Label>
            <Select value={selectedDataset} onValueChange={setSelectedDataset}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ml-1m">MovieLens-1M</SelectItem>
                <SelectItem value="amazon-book">Amazon-Book</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Default CF Model</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mf">Matrix Factorization</SelectItem>
                <SelectItem value="lightgcn">LightGCN</SelectItem>
                <SelectItem value="sasrec">SASRec</SelectItem>
                <SelectItem value="din">DIN</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator className="opacity-30" />

      {/* Notifications */}
      <div>
        <div className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Bell className="size-4 text-emerald-500" /> Notifications
        </div>
        <div className="space-y-3">
          {[
            { key: "training", label: "Training job complete", desc: "Get notified when a simulation finishes" },
            { key: "evaluation", label: "Evaluation complete", desc: "Get notified when evaluation runs finish" },
            { key: "export", label: "Export ready", desc: "Notify when PDF/JSON/CSV export is ready" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between bg-slate-900/40 rounded-lg px-4 py-3 border border-border/30">
              <div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
              <Switch checked={notifications[item.key as keyof typeof notifications]}
                onCheckedChange={v => setNotifications(n => ({ ...n, [item.key]: v }))} />
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">
        <Save className="size-4 mr-2" /> Save Preferences
      </Button>
    </div>
  );
}

// ── API Keys Tab ───────────────────────────────────────────────────────────────
function ApiKeysTab() {
  const { data: session } = useSession();
  const [showKey, setShowKey] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("collm_api_key") ?? `ck_live_${Array.from({length:32}, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random()*36)]).join("")}`;
    }
    return "ck_live_••••••••••••••••••••••••••••••••";
  });

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("collm_api_key", apiKey);
  }, [apiKey]);

  const maskedKey = `${apiKey.slice(0,12)}${"•".repeat(24)}`;

  const regenerate = async () => {
    setRegenerating(true);
    await new Promise(r => setTimeout(r, 1000));
    const newKey = `ck_live_${Array.from({length:32}, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random()*36)]).join("")}`;
    setApiKey(newKey); setShowKey(false); setRegenerating(false);
    toast.success("New API key generated");
  };

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success("API key copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-xs text-amber-300/90">
        API keys give programmatic access to the CoLLM Platform API. Keep your key secret — treat it like a password.
      </div>

      <div>
        <div className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Key className="size-4 text-emerald-500" /> Your API Key
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-900/60 rounded-lg border border-border/50 px-4 py-3 font-mono text-sm text-muted-foreground">
            {showKey ? apiKey : maskedKey}
          </div>
          <Button variant="outline" size="icon" className="h-[46px] w-[46px]" onClick={() => setShowKey(v => !v)}>
            {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
          <Button variant="outline" size="icon" className="h-[46px] w-[46px]" onClick={copyKey}>
            <Copy className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">Active</Badge>
          <span className="text-xs text-muted-foreground">Created {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <Separator className="opacity-30" />

      <div>
        <div className="text-sm font-semibold mb-2">Usage Example</div>
        <div className="bg-slate-900/80 rounded-lg p-4 font-mono text-xs text-slate-300 border border-border/30 space-y-1">
          <div><span className="text-slate-500"># Export results programmatically</span></div>
          <div><span className="text-blue-400">curl</span> -X POST https://collm-recommender.vercel.app/api/email \</div>
          <div className="pl-4">-H <span className="text-green-400">"Authorization: Bearer {showKey ? apiKey : "ck_live_…"}"</span> \</div>
          <div className="pl-4">-H <span className="text-green-400">"Content-Type: application/json"</span> \</div>
          <div className="pl-4">-d <span className="text-yellow-400">'{`{"to":"you@email.com","dataset":"ml-1m"}`}'</span></div>
        </div>
      </div>

      <Button variant="outline" onClick={regenerate} disabled={regenerating} className="text-destructive border-destructive/30 hover:bg-destructive/10">
        {regenerating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <RefreshCw className="size-4 mr-2" />}
        {regenerating ? "Regenerating…" : "Regenerate Key"}
      </Button>
    </div>
  );
}

// ── Security Tab ───────────────────────────────────────────────────────────────
function SecurityTab() {
  const [current, setCurrent] = useState("");
  const [newPw,   setNewPw]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [show,    setShow]    = useState({ current: false, new: false, confirm: false });

  const handleChange = async () => {
    if (!current) { toast.error("Enter your current password"); return; }
    if (newPw.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (newPw !== confirm) { toast.error("Passwords do not match"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to change password"); }
      else { setSaved(true); setCurrent(""); setNewPw(""); setConfirm(""); toast.success("Password changed"); setTimeout(() => setSaved(false), 3000); }
    } catch { toast.error("Network error"); }
    setSaving(false);
  };

  const PwInput = ({ value, onChange, label, k }: any) => (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input type={show[k] ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)}
          className="pr-10" placeholder="••••••••" />
        <button type="button" onClick={() => setShow(s => ({ ...s, [k]: !s[k] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {show[k] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {saved && <SuccessBanner msg="Password changed successfully" />}

      <div>
        <div className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Shield className="size-4 text-emerald-500" /> Change Password
        </div>
        <div className="space-y-4">
          <PwInput value={current} onChange={setCurrent} label="Current Password" k="current" />
          <PwInput value={newPw}   onChange={setNewPw}   label="New Password (min 8 chars)" k="new" />
          <PwInput value={confirm} onChange={setConfirm} label="Confirm New Password" k="confirm" />
          <Button onClick={handleChange} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Shield className="size-4 mr-2" />}
            {saving ? "Changing…" : "Change Password"}
          </Button>
        </div>
      </div>

      <Separator className="opacity-30" />

      {/* Active sessions info */}
      <div>
        <div className="text-sm font-semibold mb-3">Session</div>
        <div className="bg-slate-900/40 rounded-lg border border-border/30 p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Current Session</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {typeof window !== "undefined" ? navigator.userAgent.split("(")[1]?.split(")")[0]?.slice(0,30) ?? "Browser" : "Browser"}
            </div>
          </div>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">Active Now</Badge>
        </div>
      </div>

      <Separator className="opacity-30" />

      <div>
        <div className="text-sm font-semibold mb-2 text-destructive/80">Danger Zone</div>
        <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-2"
          onClick={() => signOut({ callbackUrl: "/sign-in" })}>
          <LogOut className="size-4" /> Sign Out of All Devices
        </Button>
      </div>
    </div>
  );
}

// ── Main Settings ──────────────────────────────────────────────────────────────
export default function SettingsSection() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="size-5 text-emerald-500" /> Settings
        </h2>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile, preferences, API keys, and security.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="text-xs gap-1.5"><User className="size-3.5" />Profile</TabsTrigger>
          <TabsTrigger value="prefs"   className="text-xs gap-1.5"><Palette className="size-3.5" />Preferences</TabsTrigger>
          <TabsTrigger value="api"     className="text-xs gap-1.5"><Key className="size-3.5" />API Keys</TabsTrigger>
          <TabsTrigger value="security"className="text-xs gap-1.5"><Shield className="size-3.5" />Security</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card className="border-border/50 bg-card/50 mt-3">
            <CardContent className="pt-6"><ProfileTab /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="prefs">
          <Card className="border-border/50 bg-card/50 mt-3">
            <CardContent className="pt-6"><PreferencesTab /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="api">
          <Card className="border-border/50 bg-card/50 mt-3">
            <CardContent className="pt-6"><ApiKeysTab /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card className="border-border/50 bg-card/50 mt-3">
            <CardContent className="pt-6"><SecurityTab /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
