"use client";
import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, File, FileText, FileCode, Image, Trash2, Download, Copy,
  Search, FolderOpen, HardDrive, CheckCircle, Tag, Plus, Eye,
  FileJson, FileSpreadsheet, Archive, Edit3
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

const CATEGORIES = ["all", "dataset", "model", "report", "code", "image", "general"];

const CAT_COLORS: Record<string, string> = {
  dataset: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  model: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  report: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  code: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  image: "text-pink-400 border-pink-500/30 bg-pink-500/10",
  general: "text-muted-foreground border-border bg-muted/30",
};

function FileIcon({ name, mimeType }: { name: string; mimeType: string }) {
  if (mimeType.startsWith("image/")) return <Image className="size-5 text-pink-400" />;
  if (mimeType.includes("json") || name.endsWith(".json")) return <FileJson className="size-5 text-blue-400" />;
  if (name.endsWith(".csv") || mimeType.includes("csv")) return <FileSpreadsheet className="size-5 text-emerald-400" />;
  if (name.endsWith(".py") || name.endsWith(".ts") || name.endsWith(".js")) return <FileCode className="size-5 text-amber-400" />;
  if (name.endsWith(".pdf")) return <File className="size-5 text-red-400" />;
  if (name.endsWith(".zip") || name.endsWith(".tar")) return <Archive className="size-5 text-purple-400" />;
  return <FileText className="size-5 text-muted-foreground" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function detectCategory(name: string, mimeType: string): string {
  if (name.endsWith(".csv") || name.endsWith(".json") || name.endsWith(".tsv")) return "dataset";
  if (name.endsWith(".py") || name.endsWith(".ts") || name.endsWith(".js") || name.endsWith(".sh")) return "code";
  if (name.endsWith(".pdf") || name.endsWith(".md") || name.endsWith(".txt")) return "report";
  if (name.endsWith(".pt") || name.endsWith(".bin") || name.endsWith(".pkl") || name.endsWith(".onnx")) return "model";
  if (mimeType.startsWith("image/")) return "image";
  return "general";
}

let fileIdCounter = 0;

export default function WorkspaceSection() {
  const { data: session } = useSession();
  const [files, setFiles] = useState<any[]>([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editFile, setEditFile] = useState<any | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editCat, setEditCat] = useState("general");
  const fileRef = useRef<HTMLInputElement>(null);

  const totalSize = files.reduce((s, f) => s + (f.size ?? 0), 0);

  const uploadFiles = async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    setUploading(true);
    for (const file of arr) {
      await new Promise(r => setTimeout(r, 300 + Math.random() * 400));
      const cat = detectCategory(file.name, file.type || "application/octet-stream");
      const objectUrl = URL.createObjectURL(file);
      const localFile = {
        id: `ws-${++fileIdCounter}-${Date.now()}`,
        filename: `${Date.now()}_${file.name}`,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        url: objectUrl,
        category: cat,
        description: "",
        tags: "",
        createdAt: new Date().toISOString(),
        _localBlob: file,
      };

      // Try to persist via API if authenticated
      if (session?.user) {
        try {
          const res = await fetch("/api/workspace", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "create", ...localFile }),
          });
          if (res.ok) { const d = await res.json(); setFiles(prev => [{ ...d.file, _localBlob: file, url: objectUrl }, ...prev]); toast.success(`Uploaded: ${file.name}`); continue; }
        } catch { /* fallback to local */ }
      }

      setFiles(prev => [localFile, ...prev]);
      toast.success(`Added: ${file.name}`);
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    uploadFiles(e.dataTransfer.files);
  };

  const handleDelete = async (file: any) => {
    if (session?.user && !file.id.startsWith("ws-")) {
      try {
        await fetch("/api/workspace", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", fileId: file.id }),
        });
      } catch { /* local only */ }
    }
    if (file.url?.startsWith("blob:")) URL.revokeObjectURL(file.url);
    setFiles(prev => prev.filter(f => f.id !== file.id));
    toast.success("File removed");
  };

  const downloadFile = (file: any) => {
    const a = document.createElement("a");
    a.href = file.url; a.download = file.originalName;
    a.click(); toast.success("Download started");
  };

  const copyName = (name: string) => { navigator.clipboard.writeText(name); toast.success("Filename copied"); };

  const openEdit = (file: any) => { setEditFile(file); setEditDesc(file.description ?? ""); setEditCat(file.category ?? "general"); };

  const saveEdit = async () => {
    if (!editFile) return;
    setFiles(prev => prev.map(f => f.id === editFile.id ? { ...f, description: editDesc, category: editCat } : f));
    if (session?.user && !editFile.id.startsWith("ws-")) {
      try {
        await fetch("/api/workspace", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update", fileId: editFile.id, description: editDesc, category: editCat }),
        });
      } catch { /* local only */ }
    }
    setEditFile(null);
    toast.success("File updated");
  };

  const filtered = files.filter(f =>
    (category === "all" || f.category === category) &&
    f.originalName.toLowerCase().includes(search.toLowerCase())
  );

  const catCounts = CATEGORIES.reduce((acc, c) => {
    acc[c] = c === "all" ? files.length : files.filter(f => f.category === c).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><FolderOpen className="size-5 text-emerald-500" />Workspace</h2>
          <p className="text-muted-foreground text-sm">Personal file storage — datasets, models, reports & code</p>
        </div>
        <Button onClick={() => fileRef.current?.click()} className="bg-emerald-600 hover:bg-emerald-700" disabled={uploading}>
          <Upload className="size-4 mr-2" />{uploading ? "Uploading…" : "Upload Files"}
        </Button>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={e => e.target.files && uploadFiles(e.target.files)} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Files", value: files.length.toString(), icon: File, color: "text-emerald-400" },
          { label: "Storage Used", value: formatBytes(totalSize), icon: HardDrive, color: "text-blue-400" },
          { label: "Categories", value: (CATEGORIES.length - 1).toString(), icon: Tag, color: "text-purple-400" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`size-6 ${s.color}`} />
              <div>
                <div className="text-xl font-bold">{s.value}</div>
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
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragging ? "border-emerald-500 bg-emerald-500/10" : "border-border hover:border-emerald-500/50 hover:bg-muted/30"}`}
      >
        <Upload className={`size-8 mx-auto mb-2 ${dragging ? "text-emerald-400" : "text-muted-foreground"}`} />
        <p className="font-medium">{dragging ? "Drop to upload" : "Drag & drop files here, or click to browse"}</p>
        <p className="text-xs text-muted-foreground mt-1">CSV, JSON, PDF, Python, Models (.pt, .bin), Images, Archives</p>
      </div>

      {/* Search + Category filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files…" className="pl-9" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <Button key={c} size="sm" variant={category === c ? "default" : "outline"}
              className={category === c ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              onClick={() => setCategory(c)}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
              {catCounts[c] > 0 && <span className="ml-1.5 text-xs opacity-70">{catCounts[c]}</span>}
            </Button>
          ))}
        </div>
      </div>

      {/* File list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FolderOpen className="size-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">{files.length === 0 ? "No files yet — upload something to get started" : "No files match your filter"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(file => (
            <motion.div key={file.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="hover:border-emerald-500/20 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <FileIcon name={file.originalName} mimeType={file.mimeType} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{file.originalName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>{formatBytes(file.size ?? 0)}</span>
                        <span>·</span>
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                        {file.description && <><span>·</span><span className="truncate max-w-[150px]">{file.description}</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`text-[10px] ${CAT_COLORS[file.category] ?? CAT_COLORS.general}`}>
                        {file.category}
                      </Badge>
                      <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => openEdit(file)}>
                        <Edit3 className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => copyName(file.originalName)}>
                        <Copy className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => downloadFile(file)}>
                        <Download className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => handleDelete(file)}>
                        <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editFile} onOpenChange={() => setEditFile(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit File — {editFile?.originalName}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Describe this file…" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={editCat} onValueChange={setEditCat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.filter(c => c !== "all").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button className="bg-emerald-600 hover:bg-emerald-700 flex-1" onClick={saveEdit}>Save Changes</Button>
              <Button variant="outline" onClick={() => setEditFile(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
