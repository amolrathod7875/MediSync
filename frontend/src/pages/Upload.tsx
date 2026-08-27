import { useState, useCallback, useRef, useEffect } from "react";
import { UploadCloud, FileText, FileSpreadsheet, FileImage, File, Trash2, Eye, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useAppStore } from "@/stores/useAppStore";
import { api } from "@/lib/api";
import type { UploadItem } from "@/lib/types";

const fileIcon = (type: string) => {
  if (type.includes("pdf")) return <FileText className="h-4 w-4 text-[hsl(350,89%,50%)]" />;
  if (type.includes("csv") || type.includes("json")) return <FileSpreadsheet className="h-4 w-4 text-[hsl(160,84%,39%)]" />;
  if (type.includes("image") || type.includes("png") || type.includes("jpg")) return <FileImage className="h-4 w-4 text-[hsl(270,60%,55%)]" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
};

function formatSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Upload() {
  const { documents, addDocument, removeDocument, fetchDocuments } = useAppStore();
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const uploadFile = async (file: File) => {
    const id = crypto.randomUUID();
    const item: UploadItem = { id, file, progress: 0, status: "uploading" };
    setQueue((q) => [...q, item]);
    try {
      const res = await api.uploadFile(file, (p) => {
        setQueue((q) => q.map((x) => (x.id === id ? { ...x, progress: p } : x)));
      });
      setQueue((q) => q.map((x) => (x.id === id ? { ...x, progress: 100, status: "done", result: res.document } : x)));
      if (res.document) addDocument(res.document);
      toast.success(`${file.name} uploaded successfully`);
    } catch (err: any) {
      setQueue((q) => q.map((x) => (x.id === id ? { ...x, status: "error", error: err.message } : x)));
      toast.error(`Upload failed: ${err.message}`);
    }
  };

  const handleFiles = (files: FileList | File[]) => {
    Array.from(files).forEach(uploadFile);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteDocument(id);
      removeDocument(id);
      toast.success("Document deleted");
    } catch {
      removeDocument(id);
      toast.success("Document removed");
    }
  };

  const stats = {
    total: documents.length,
    processed: documents.filter((d) => d.status === "chunked").length,
    pending: documents.filter((d) => d.status === "created").length,
  };

  return (
    <div className="bg-dot-grid min-h-full p-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Uploaded", value: stats.total, color: "text-[hsl(226,71%,48%)]" },
          { label: "Processed", value: stats.processed, color: "text-[hsl(160,84%,39%)]" },
          { label: "Pending", value: stats.pending, color: "text-[hsl(38,92%,50%)]" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${
          isDragging ? "border-[hsl(226,71%,60%)] bg-[hsl(226,71%,97%)]" : "border-border hover:border-[hsl(226,71%,60%)] hover:bg-[hsl(226,71%,97%)]"
        }`}
      >
        <input ref={fileInputRef} type="file" multiple className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.tiff,.csv,.json,.txt"
          onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        <UploadCloud className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-semibold text-foreground">Drop clinical documents here</h3>
        <p className="text-sm text-muted-foreground mt-1">PDF, PNG, JPG, JPEG, TIFF, CSV, JSON, TXT — max 50MB each</p>
        <Button className="mt-4 shimmer-btn border-0 text-white">Browse Files</Button>
      </div>

      {/* Upload Queue */}
      {queue.length > 0 && (
        <div className="mt-4 space-y-2">
          {queue.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center gap-3 p-3">
                {fileIcon(item.file.type)}
                <span className="text-sm font-medium text-foreground flex-1 truncate">{item.file.name}</span>
                {item.status === "uploading" && <Progress value={item.progress} className="w-32 h-1.5" />}
                {item.status === "done" && <CheckCircle2 className="h-4 w-4 text-[hsl(160,84%,39%)]" />}
                {item.status === "error" && <XCircle className="h-4 w-4 text-[hsl(350,89%,50%)]" />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Documents Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {documents.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No documents uploaded yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc, i) => (
                  <TableRow key={doc.document_id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{doc.filename}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{doc.file_type}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatSize(doc.metadata?.size)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(doc.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] ${
                        doc.status === "chunked" ? "bg-[hsl(160,84%,90%)] text-[hsl(160,84%,30%)]" :
                        doc.status === "error" ? "bg-[hsl(350,89%,90%)] text-[hsl(350,89%,40%)]" :
                        "bg-[hsl(38,92%,90%)] text-[hsl(38,92%,35%)]"
                      }`}>{doc.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><Eye className="h-3 w-3" /> View</Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-[hsl(350,89%,50%)]"
                        onClick={() => handleDelete(doc.document_id)}><Trash2 className="h-3 w-3" /> Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
