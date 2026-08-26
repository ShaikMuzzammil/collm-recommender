"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Send, CheckCircle, Github, BookOpen, ExternalLink, Loader2, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  subject: z.string().min(4, "Subject required"),
  message: z.string().min(10, "Message too short"),
  category: z.string(),
});
type FormData = z.infer<typeof schema>;

const CATEGORIES = ["general", "bug-report", "feature-request", "research-collaboration", "commercial", "other"];
const LINKS = [
  { label: "GitHub Repository", href: "https://github.com/zyang1580/CoLLM", icon: Github, desc: "Source code & issues" },
  { label: "arXiv Paper", href: "https://arxiv.org/abs/2310.19488", icon: BookOpen, desc: "arXiv:2310.19488v3" },
  { label: "USTC Research Lab", href: "https://rec.ustc.edu.cn", icon: ExternalLink, desc: "Fuli Feng · Xiangnan He" },
];
const TEAM = [
  { name: "Yang Zhang", role: "Lead Author", org: "National University of Singapore" },
  { name: "Fuli Feng", role: "Corresponding Author", org: "USTC" },
  { name: "Jizhi Zhang", role: "Author", org: "USTC" },
  { name: "Keqin Bao", role: "Author", org: "USTC" },
  { name: "Qifan Wang", role: "Author", org: "Meta AI" },
  { name: "Xiangnan He", role: "Corresponding Author", org: "USTC" },
];

export default function ContactSection() {
  const { data: session } = useSession();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: session?.user?.name ?? "",
      email: session?.user?.email ?? "",
      category: "general",
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (!res.ok) { toast.error("Failed to send message"); return; }
    setSent(true);
    reset();
    toast.success("Message sent! We'll respond within 24–48 hours.");
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-bold">Contact & Support</h2>
        <p className="text-muted-foreground text-sm">Reach the CoLLM research team or open a GitHub issue</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="size-4 text-emerald-500" />
                Send a Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sent ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="size-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <CheckCircle className="size-8 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">Message Received!</h3>
                    <p className="text-muted-foreground text-sm mt-1">We'll respond within 24–48 hours. Check your email for a confirmation.</p>
                  </div>
                  <Button variant="outline" onClick={() => setSent(false)}>Send Another</Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Full Name</Label>
                      <Input placeholder="Yang Zhang" {...register("name")} />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input type="email" placeholder="you@ustc.edu.cn" {...register("email")} />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <Select defaultValue="general" onValueChange={v => setValue("category", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => (
                            <SelectItem key={c} value={c} className="capitalize">{c.replace(/-/g, " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Subject</Label>
                      <Input placeholder="Brief subject line" {...register("subject")} />
                      {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Message</Label>
                    <Textarea placeholder="Describe your question, bug, or collaboration idea in detail…" rows={5} {...register("message")} />
                    {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                  </div>

                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 w-full" disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2" />}
                    {loading ? "Sending…" : "Send Message"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Links */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Resources</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {LINKS.map(l => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group">
                  <l.icon className="size-4 text-emerald-500 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium group-hover:text-emerald-400 transition-colors">{l.label}</div>
                    <div className="text-xs text-muted-foreground">{l.desc}</div>
                  </div>
                  <ExternalLink className="size-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                </a>
              ))}
            </CardContent>
          </Card>

          {/* Research Team */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="size-4 text-emerald-500" />Research Team</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {TEAM.map(m => (
                <div key={m.name} className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-0">
                  <div className="size-7 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0 text-xs font-bold text-emerald-500">
                    {m.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium leading-tight">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.role} · {m.org}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="size-4 text-emerald-500" />
                <span className="text-sm font-medium">Location</span>
              </div>
              <p className="text-xs text-muted-foreground">University of Science and Technology of China (USTC)</p>
              <p className="text-xs text-muted-foreground">Hefei, Anhui Province, China</p>
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">Supported by National Key R&D Program of China (2022YFB3104701) and NSFC (U24B20180)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
