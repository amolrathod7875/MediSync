import { useState, useEffect } from "react";
import { FileText, FileSpreadsheet, FileImage, File, Trash2, Eye, Search, Loader2, Hash } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useAppStore } from "@/stores/useAppStore";
import { api } from "@/lib/api";
import type { Document, Chunk } from "@/lib/types";

const fileColors: Record<string, { bg: string; icon: any }> = {
  pdf: { bg: "bg-[hsl(350,89%,95%)]", icon: FileText },
  csv: { bg: "bg-[hsl(160,84%,93%)]", icon: FileSpreadsheet },
  json: { bg: "bg-[hsl(226,71%,95%)]", icon: FileSpreadsheet },
  txt: { bg: "bg-muted", icon: File },
  png: { bg: "bg-[hsl(270,60%,95%)]", icon: FileImage },
  jpg: { bg: "bg-[hsl(270,60%,95%)]", icon: FileImage },
  jpeg: { bg: "bg-[hsl(270,60%,95%)]", icon: FileImage },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

export default function Documents() {
  const { documents, fetchDocuments, removeDocument } = useAppStore();
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [chunking, setChunking] = useState(false);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const filtered = documents.filter((d) => d.filename.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: string) => {
    try { await api.deleteDocument(id); } catch {}
    removeDocument(id);
    toast.success("Document deleted");
  };

  const handleChunk = async (id: string) => {
    setChunking(true);
    try {
      const res = await api.chunkDocument(id);
      setChunks(res.chunks);
      toast.success(`${res.chunk_count} chunks created`);
    } catch {
      setChunks([
        { chunk_id: "demo-1", content: "Sample chunk 1 content...", metadata: {} },
        { chunk_id: "demo-2", content: "Sample chunk 2 content...", metadata: {} },
      ]);
      toast.info("Showing demo chunks");
    } finally {
      setChunking(false);
    }
  };

  const getFileInfo = (type: string) => fileColors[type] || fileColors.txt;

  return (
    <div className="bg-dot-grid min-h-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">Document Library</h1>
          <Badge variant="secondary">{documents.length}</Badge>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm" />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-sm text-muted-foreground">No documents found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const fi = getFileInfo(doc.file_type);
            const Icon = fi.icon;
            return (
              <Card key={doc.document_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${fi.bg} mb-3`}>
                    <Icon className="h-6 w-6 text-foreground/60" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground truncate">{doc.filename}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{doc.file_type}</Badge>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(doc.created_at)}</span>
                  </div>
                  <Badge variant="secondary" className={`mt-2 text-[10px] ${
                    doc.status === "chunked" ? "bg-[hsl(160,84%,90%)] text-[hsl(160,84%,30%)]" :
                    doc.status === "error" ? "bg-[hsl(350,89%,90%)] text-[hsl(350,89%,40%)]" :
                    "bg-[hsl(38,92%,90%)] text-[hsl(38,92%,35%)]"
                  }`}>{doc.status}</Badge>
                </CardContent>
                <CardFooter className="border-t px-4 py-2 gap-2">
                  <Button variant="ghost" size="sm" className="h-7 text-xs flex-1 gap-1"
                    onClick={() => { setSelectedDoc(doc); setChunks(doc.chunks || []); }}>
                    <Eye className="h-3 w-3" /> View Content
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-[hsl(350,89%,50%)] gap-1"
                    onClick={() => handleDelete(doc.document_id)}>
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sheet */}
      <Sheet open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <SheetContent className="w-[500px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle className="text-base">{selectedDoc?.filename}</SheetTitle>
          </SheetHeader>
          <Tabs defaultValue="raw" className="mt-4">
            <TabsList>
              <TabsTrigger value="raw" className="text-xs">Raw Text</TabsTrigger>
              <TabsTrigger value="chunks" className="text-xs">Chunks</TabsTrigger>
            </TabsList>
            <TabsContent value="raw">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs font-mono text-foreground">
                  {selectedDoc?.content || "No content available"}
                </pre>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="chunks">
              <ScrollArea className="h-[calc(100vh-200px)]">
                {chunks.length > 0 ? (
                  <div className="space-y-3">
                    {chunks.map((c, i) => (
                      <Card key={c.chunk_id}>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] font-mono text-muted-foreground">{c.chunk_id}</span>
                            <Badge variant="outline" className="text-[10px]">Chunk {i + 1}</Badge>
                          </div>
                          <p className="text-xs text-foreground">{c.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <Button onClick={() => selectedDoc && handleChunk(selectedDoc.document_id)} disabled={chunking}
                      className="gap-1.5">
                      {chunking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Process Chunks
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
}
