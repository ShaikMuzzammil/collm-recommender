'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { apiEndpoints } from '@/lib/data';
import { Copy, Check, ChevronDown, ChevronUp, BookOpen, Terminal } from 'lucide-react';

function CodeBlock({ code, language = 'json' }: { code: string; language?: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: 'Copied to clipboard', description: 'Code example copied' });
    setTimeout(() => setCopied(false), 2000);
  }, [code, toast]);

  return (
    <div className="relative group rounded-lg bg-muted/50 border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{language}</span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleCopy}>
          {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />} {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre className="p-3 text-xs font-mono leading-relaxed overflow-x-auto custom-scrollbar max-h-48">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function EndpointCard({ endpoint, index }: { endpoint: typeof apiEndpoints[0]; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const methodColor = endpoint.method === 'GET' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-500 bg-amber-500/10 border-amber-500/30';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
      <Card className="overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left"
        >
          <CardHeader className="py-3 hover:bg-muted/20 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={`text-[10px] font-mono font-bold px-2 ${methodColor}`}>{endpoint.method}</Badge>
              <code className="text-sm font-mono font-medium">{endpoint.path}</code>
              <span className="flex-1" />
              <span className="text-xs text-muted-foreground hidden sm:block">{endpoint.description.slice(0, 50)}...</span>
              {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
            </div>
          </CardHeader>
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <CardContent className="pt-0 pb-4 space-y-3 border-t">
                <p className="text-xs text-muted-foreground pt-3">{endpoint.description}</p>
                {endpoint.request && (
                  <div>
                    <div className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">Request Body</div>
                    <CodeBlock code={endpoint.request} language="json" />
                  </div>
                )}
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">Response</div>
                  <CodeBlock code={endpoint.response} language="json" />
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export default function ApiDocsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <BookOpen className="size-5 text-emerald-500" />
        <div>
          <h3 className="text-lg font-semibold">API Documentation</h3>
          <p className="text-sm text-muted-foreground">Interactive reference for the CoLLM prediction service</p>
        </div>
        <Badge variant="outline" className="ml-auto text-[10px] font-mono gap-1"><Terminal className="size-3" /> v1.0.0</Badge>
      </div>

      {/* Base URL info */}
      <Card className="bg-emerald-500/5 border-emerald-500/20">
        <CardContent className="py-3 flex items-center gap-3">
          <div className="size-2 rounded-full bg-emerald-500 pulse-emerald" />
          <span className="text-xs text-muted-foreground">Base URL: <code className="font-mono text-emerald-400">https://api.collm.dev/v1</code> — All endpoints accept and return JSON.</span>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {apiEndpoints.map((ep, i) => (
          <EndpointCard key={ep.path} endpoint={ep} index={i} />
        ))}
      </div>
    </div>
  );
}
