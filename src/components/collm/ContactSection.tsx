// @ts-nocheck
"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, CheckCircle, Loader2, BookOpen, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

const CATEGORIES = [
  { value: "general",      label: "General Inquiry" },
  { value: "bug",          label: "Bug Report" },
  { value: "feature",      label: "Feature Request" },
  { value: "research",     label: "Research Collaboration" },
  { value: "data",         label: "Data / Results Question" },
];

export default function ContactSection() {
  const { data: session } = useSession();
  const [form, setForm] = useState({
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    category: "general",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send — please try again");
      } else {
        setSubmitted(true);
      }
    } catch {
      toast.error("Network error — check your connection");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="size-5 text-emerald-500" /> Contact
        </h2>
        <p className="text-muted-foreground text-sm mt-1">Send a message about the CoLLM platform or paper.</p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="size-4 text-emerald-500" /> Send a Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="py-14 flex flex-col items-center gap-4 text-center">
                <div className="size-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle className="size-8 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Message Received!</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    We'll respond within 24–48 hours. Check your email for a confirmation.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mt-2 gap-2"
                  onClick={() => { setSubmitted(false); setForm(f => ({ ...f, subject: "", message: "" })); }}>
                  <RefreshCw className="size-3.5" /> Send Another
                </Button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Full Name</Label>
                    <Input placeholder="Yang Zhang" value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input type="email" placeholder="you@ustc.edu.cn" value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Subject</Label>
                    <Input placeholder="Brief subject line" value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Message</Label>
                  <Textarea placeholder="Describe your question, bug, or idea in detail..."
                    rows={6} value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
                  {submitting ? "Sending…" : "Send Message"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* arXiv Paper Card Only */}
      <Card className="border-border/50 bg-card/40">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="size-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="size-5 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">CoLLM Paper</div>
            <div className="text-xs text-muted-foreground">arXiv:2310.19488v3 · Yang Zhang et al. · USTC / MIT</div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="https://arxiv.org/abs/2310.19488" target="_blank" rel="noopener noreferrer">
              Read Paper
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
