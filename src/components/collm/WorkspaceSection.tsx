"use client";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, FileText, FileCode, Image, Trash2, Download, Copy, Search, FolderOpen, HardDrive, RefreshCw, CheckCircle, Tag, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";

const CATEGORIES = ["all", "dataset", "model", "report", "code", "general"];

const MIME_ICONS: Record<string, any> = {
  "text/csv": FileText,
  "application/json": FileCode,
  "application/pdf": File,
  "image/png": Image,
  "image/jpeg": Image,
  "text/plain": FileText,
  "application/zip": File,
};

function FileIcon({ mimeType }: { mimeType: string }) {
  const Icon = MIME_ICONS[mimeType] ?? File;
  return <Icon className="size-5 text-emerald-400" />;
}

export default function WorkspaceSection() {
  const [files, setFiles] = useState<any[]>([]);
  const [stats, setStats] = useState({ count: 0, totalSize: 0 });
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    setLoading(true);
    const res = await fetch(`/api/workspace?category=${category === "all" ? "" : category}`);
    setLoading(false);
    if (res.ok) { const d = await res.json(); setFiles(d.files ?? []); setStats(d.stats ?? {}); }
  };

  useEffect(() => { fetchFiles(); }, [category]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    // Simulate upload — in prod use UploadThing or S3 presigned URL
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    const pseudo = {
      filename: `${Date.now()}_${file.name}`,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      url: URL.createObjectURL(file),
      category: detectCategory(file.name),
    };
    const res = await fetch("/api/workspace", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", ...pseudo }),
    });
    setUploading(false);
    if (res.ok) { const d = await res.json(); setFiles(prev => [d.file, ...prev]); toast.success(`Uploaded: ${file.name}`); }
    else toast.error("Upload failed");
  };

  const detectCategory = (name: string) => {
    if (name.endsWith(".csv") || name.endsWith(".json")) return "dataset";
    if (name.endsWith(".py") || name.endsWith(".ts") || name.endsWith(".js")) return "code";
    if (name.endsWith(".pdf") || name.endsWith(".md")) return "report";
    if (name.endsWith(".pt") || name.endsWith(".bin") || name.endsWith(".pkl")) return "model";
    if (name.match(/\.(png|jpg|jpeg|gif|svg)$/)) return "image";
    return "general";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    [...e.dataTransfer.files].forEach(uploadFile);
  };

  const handleDelete = async (fileId: string) => {
    await fetch("/api/workspace", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", fileId }),
    });
    setFiles(prev => prev.filter(f => f.id !== fileId));
    toast.success("File deleted");
  };

  const copyUrl = (url: string) => { navigator.clipboard.writeText(url); toast.success("URL copied!"); };
  const filtered = files.filter(f => f.originalName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Workspace</h2>
          <p className="text-muted-foreground text-sm">Your personal file storage — datasets, models, reports & code</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchFiles}><RefreshCw className="size-3.5 mr-1" />Refresh</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => fileRef.current?.click()}>
            <Upload className="size-3.5 mr-1" />Upload
          </Button>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={e => [...(e.target.files ?? [])].forEach(uploadFile)} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: File, label: "Total Files", value: stats.count, color: "text-emerald-400" },
          { icon: HardDrive, label: "Storage Used", value: formatBytes(stats.totalSize), color: "text-blue-400" },
          { icon: FolderOpen, label: "Categories", value: CATEGORIES.length - 1, color: "text-purple-400" },
        ].map(s => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`size-8 ${s.color} opacity-80`} />
              <div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragging ? "border-emerald-500 bg-emerald-500/10" : "border-border hover:border-emerald-500/50"}`}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="size-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-emerald-400">Uploading…</span>
          </div>
        ) : (
          <>
            <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drag & drop files here, or <span className="text-emerald-500 font-medium">browse</span></p>
            <p className="text-xs text-muted-foreground mt-1">CSV, JSON, PDF, Python, Models, Images</p>
          </>
        )}
      </div>

      {/* Filter + Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files…" className="pl-9" />
        </div>
        <div className="flex gap-1">
          {CATEGORIES.map(c => (
            <Button key={c} variant={category === c ? "default" : "outline"} size="sm"
              className={category === c ? "bg-emerald-600 hover:bg-emerald-700 capitalize" : "capitalize"}
              onClick={() => setCategory(c)}>
              {c}
            </Button>
          ))}
        </div>
      </div>

      {/* Files grid */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="size-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FolderOpen className="size-12 mx-auto mb-3 opacity-30" />
              <p>No files found. Upload something to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(file => (
                <motion.div key={file.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-4 p-4 hover:bg-secondary/30 group">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <FileIcon mimeType={file.mimeType} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{file.originalName}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{formatBytes(file.size)}</span>
                      <span>·</span>
                      <span>{file.mimeType}</span>
                      <span>·</span>
                      <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                    </div>
                    {file.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{file.description}</p>}
                  </div>
                  <Badge variant="outline" className="capitalize text-[10px] shrink-0">{file.category}</Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => copyUrl(file.url)} title="Copy URL">
                      <Copy className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7" asChild title="Download">
                      <a href={file.url} download={file.originalName}><Download className="size-3.5" /></a>
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7 hover:text-destructive" onClick={() => handleDelete(file.id)} title="Delete">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
