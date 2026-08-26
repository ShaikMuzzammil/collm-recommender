"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { BrainCircuit, Mail, Lock, User, Building2, Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

const schema = z.object({
  name: z.string().min(2, "Name too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password min 8 characters"),
  confirm: z.string(),
  organization: z.string().optional(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

type FormData = z.infer<typeof schema>;

const FEATURES = ["Real-time training pipeline", "PDF report exports", "Workspace file storage", "Email report delivery"];

export default function SignUpPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name, email: data.email, password: data.password, organization: data.organization }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Registration failed");
      setLoading(false);
      return;
    }
    toast.success("Account created! Signing you in…");
    await signIn("credentials", { email: data.email, password: data.password, redirect: false });
    setLoading(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left panel */}
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <BrainCircuit className="size-6 text-emerald-500" />
            </div>
            <div>
              <div className="text-emerald-500 text-xs font-semibold tracking-widest uppercase">CoLLM</div>
              <div className="text-foreground text-lg font-bold">Research Platform</div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">Everything you need for LLM recommendation research</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">A full-stack platform based on the CoLLM paper — train models, evaluate performance, export reports, and more.</p>
          <div className="space-y-3">
            {FEATURES.map(f => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle className="size-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right panel */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
            <h1 className="text-xl font-bold text-foreground mb-1">Create your account</h1>
            <p className="text-muted-foreground text-sm mb-6">Free access to the full research platform</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input id="name" placeholder="John Doe" className="pl-9 h-9 text-sm" {...register("name")} />
                  </div>
                  {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="organization">Organization</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input id="organization" placeholder="USTC, MIT…" className="pl-9 h-9 text-sm" {...register("organization")} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@research.edu" className="pl-9 h-9 text-sm" {...register("email")} />
                </div>
                {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input id="password" type={showPw ? "text" : "password"} placeholder="••••••••" className="pl-9 pr-9 h-9 text-sm" {...register("password")} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input id="confirm" type="password" placeholder="••••••••" className="pl-9 h-9 text-sm" {...register("confirm")} />
                  </div>
                  {errors.confirm && <p className="text-destructive text-xs">{errors.confirm.message}</p>}
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-2" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                {loading ? "Creating account…" : "Create Account — Free"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-5">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-emerald-500 hover:text-emerald-400 font-medium">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
