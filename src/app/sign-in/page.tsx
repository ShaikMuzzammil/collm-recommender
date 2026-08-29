// @ts-nocheck
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { BrainCircuit, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password too short"),
});
type FormData = z.infer<typeof schema>;

const FEATURES = [
  "Real-time training pipeline simulation",
  "AUC · UAUC · NDCG evaluation suite",
  "PDF, JSON & CSV report exports",
  "Workspace file storage & management",
];

export default function SignInPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const res = await signIn("credentials", { ...data, redirect: false });
    setLoading(false);
    if (res?.error) { toast.error("Invalid email or password"); return; }
    toast.success("Welcome back!");
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left branding panel */}
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <BrainCircuit className="size-6 text-emerald-500" />
            </div>
            <div>
              <div className="text-emerald-500 text-xs font-semibold tracking-widest uppercase">CoLLM</div>
              <div className="text-foreground text-xl font-bold">Research Platform</div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">Welcome back to your research workspace</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Sign in to access your full research toolkit — training jobs, evaluations, exports, and analytics all in one place.
          </p>
          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="size-4 text-emerald-500 shrink-0" />
                <span className="text-sm text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right form panel */}
        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
          <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4 lg:hidden">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <BrainCircuit className="size-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-emerald-500 text-[10px] font-semibold tracking-widest uppercase">CoLLM</div>
                  <div className="text-sm font-bold">Research Platform</div>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Sign in</h1>
              <p className="text-muted-foreground text-sm mt-1">Access your research workspace</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@research.edu" className="pl-10" {...register("email")} />
                </div>
                {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input id="password" type={showPw ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10" {...register("password")} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <ArrowRight className="size-4 mr-2" />}
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button variant="outline" className="w-full border-border" onClick={() => signIn("google", { callbackUrl: "/" })}>
              <svg className="size-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              Continue with Google
            </Button>

            <div className="mt-5 space-y-2">
              <p className="text-center text-sm text-muted-foreground">
                No account?{" "}
                <Link href="/sign-up" className="text-emerald-500 hover:text-emerald-400 font-medium">Create one free</Link>
              </p>
              <Link href="/" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <LayoutDashboard className="size-4" />
                Go to Dashboard (explore without signing in)
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
