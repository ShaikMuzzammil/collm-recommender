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
import {
  BrainCircuit, Mail, Lock, User, Eye, EyeOff, ArrowRight,
  Loader2, Building, LayoutDashboard, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const schema = z.object({
  name:         z.string().min(2, "Name must be at least 2 characters"),
  email:        z.string().email("Invalid email address"),
  organization: z.string().optional(),
  password:     z.string().min(8, "Password must be at least 8 characters"),
  confirm:      z.string(),
}).refine(d => d.password === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});
type FormData = z.infer<typeof schema>;

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:         data.name,
          email:        data.email,
          password:     data.password,
          organization: data.organization || undefined,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        // Show the specific error from the server
        if (res.status === 409) {
          toast.error("This email is already registered — try signing in instead");
        } else if (res.status === 503) {
          toast.error("Database not configured — contact admin");
        } else {
          toast.error(json.error ?? "Registration failed — please try again");
        }
        setLoading(false);
        return;
      }

      // Auto sign in
      const signInRes = await signIn("credentials", {
        email:    data.email,
        password: data.password,
        redirect: false,
      });

      setLoading(false);
      if (signInRes?.error) {
        toast.success("Account created! Please sign in.");
        router.push("/sign-in");
      } else {
        toast.success("Account created — welcome to CoLLM!");
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error("Network error — please try again");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      toast.error("Google sign-up failed — check OAuth configuration");
      setGoogleLoading(false);
    }
  };

  const InputRow = ({ id, label, type, icon: Icon, placeholder, field, error, showToggle, show, onToggle }: any) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input id={id} type={showToggle ? (show ? "text" : "password") : type}
          placeholder={placeholder} className={`pl-9 h-11 ${showToggle ? "pr-10" : ""}`} {...field} />
        {showToggle && (
          <button type="button" onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">

        {/* Left branding */}
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
          <h2 className="text-3xl font-bold text-foreground mb-3">Everything you need for LLM recommendation research</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            A full-stack platform based on the CoLLM paper — train models, evaluate performance, export reports, and more.
          </p>
          <div className="space-y-3">
            {["Real-time training pipeline simulation","AUC · UAUC · NDCG evaluation suite","8-page PDF research reports","AI-powered workspace — analyze papers with Claude"].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="size-4 text-emerald-500 shrink-0" />
                <span className="text-sm text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right form */}
        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
          <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Create your account</h1>
              <p className="text-muted-foreground text-sm mt-1">Free access to the full research platform</p>
            </div>

            {/* Google */}
            <Button variant="outline" className="w-full gap-3 h-11 mb-4 font-medium"
              onClick={handleGoogle} disabled={googleLoading || loading}>
              {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
              {googleLoading ? "Redirecting…" : "Sign up with Google"}
            </Button>

            <div className="relative my-4">
              <Separator />
              <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                or create with email
              </span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <InputRow id="name" label="Full Name" type="text" icon={User}
                  placeholder="Nova" field={register("name")} error={errors.name?.message} />
                <InputRow id="org" label="Organization" type="text" icon={Building}
                  placeholder="USTC, MIT…" field={register("organization")} />
              </div>
              <InputRow id="email" label="Email" type="email" icon={Mail}
                placeholder="you@university.edu" field={register("email")} error={errors.email?.message} />
              <div className="grid grid-cols-2 gap-3">
                <InputRow id="password" label="Password" type="password" icon={Lock}
                  placeholder="Min 8 chars" field={register("password")} error={errors.password?.message}
                  showToggle show={showPw} onToggle={() => setShowPw(v => !v)} />
                <InputRow id="confirm" label="Confirm" type="password" icon={Lock}
                  placeholder="Repeat password" field={register("confirm")} error={errors.confirm?.message}
                  showToggle show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
              </div>

              <Button type="submit" disabled={loading || googleLoading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                {loading
                  ? <><Loader2 className="size-4 mr-2 animate-spin" />Creating account…</>
                  : <><ArrowRight className="size-4 mr-2" />Create Account — Free</>}
              </Button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-emerald-500 hover:text-emerald-400 font-medium">Sign in</Link>
              </p>
              <Link href="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5">
                <LayoutDashboard className="size-3" /> Go to Dashboard (explore without signing in)
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
