import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Trash2, CheckCircle2, Pencil, Save, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useAppStore } from "@/stores/useAppStore";
import { api } from "@/lib/api";
import type { Summary, SummaryContent } from "@/lib/types";

const statusColors: Record<string, string> = {
  generated: "bg-[hsl(38,92%,90%)] text-[hsl(38,92%,35%)]",
  edited: "bg-[hsl(270,60%,92%)] text-[hsl(270,60%,40%)]",
  signed: "bg-[hsl(160,84%,90%)] text-[hsl(160,84%,30%)]",
};
const typeColors: Record<string, string> = {
  discharge: "bg-[hsl(226,71%,93%)] text-[hsl(226,71%,40%)]",
  handoff: "bg-[hsl(180,60%,92%)] text-[hsl(180,60%,35%)]",
};

function SummaryViewContent({ content }: { content: SummaryContent }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-lg border-l-4 border-[hsl(38,92%,50%)] bg-[hsl(38,92%,95%)] p-3">
        <p className="text-xs font-medium text-[hsl(38,92%,35%)]">Chief Complaint</p>
        <p className="font-semibold text-foreground">{content.chief_complaint}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Diagnosis</p>
        <ul className="space-y-1">{content.diagnosis.map((d, i) => <li key={i} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(226,71%,48%)]" />{d}</li>)}</ul>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Medications</p>
        {content.medications.map((m, i) => <p key={i} className="text-xs text-muted-foreground">{m.name} {m.dosage} {m.frequency} {m.route}</p>)}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Follow-up</p>
        <p className="text-foreground text-xs">{content.follow_up_instructions}</p>
      </div>
      <Badge variant="secondary">{content.discharge_disposition}</Badge>
    </div>
  );
}

export default function Summaries() {
  const navigate = useNavigate();
  const { summaries, fetchSummaries, updateSummary, removeSummary } = useAppStore();
  const [viewSummary, setViewSummary] = useState<Summary | null>(null);
  const [signDialog, setSignDialog] = useState<Summary | null>(null);
  const [signing, setSigning] = useState(false);

  useEffect(() => { fetchSummaries(); }, [fetchSummaries]);

  const handleSignOff = async (s: Summary) => {
    setSigning(true);
    try {
      const res = await api.signOffSummary(s.summary_id, "Dr. Sarah Chen");
      updateSummary(s.summary_id, { status: "signed", signed_by: res.signed_by, signed_at: res.signed_at });
      toast.success("Signed off by Dr. Sarah Chen");
    } catch {
      updateSummary(s.summary_id, { status: "signed", signed_by: "Dr. Sarah Chen", signed_at: new Date().toISOString() });
      toast.success("Signed off by Dr. Sarah Chen (demo)");
    } finally {
      setSigning(false);
      setSignDialog(null);
    }
  };

  const handleDelete = async (id: string) => {
    try { await api.deleteSummary(id); } catch {}
    removeSummary(id);
    toast.success("Summary deleted");
  };

  return (
    <div className="bg-dot-grid min-h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">Generated Summaries</h1>
          <Badge variant="secondary">{summaries.length}</Badge>
        </div>
        <Button onClick={() => navigate("/")} className="gap-1.5 shimmer-btn border-0 text-white">
          <Plus className="h-4 w-4" /> New Summary
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {summaries.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No summaries yet. Generate one from the Dashboard.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Signed By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map((s, i) => (
                  <TableRow key={s.summary_id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{s.patient_id}</TableCell>
                    <TableCell><Badge className={`text-[10px] border-0 ${typeColors[s.summary_type]}`}>{s.summary_type}</Badge></TableCell>
                    <TableCell><Badge className={`text-[10px] border-0 ${statusColors[s.status]}`}>{s.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(s.generated_at).toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{s.signed_by || "—"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setViewSummary(s)}>
                        <Eye className="h-3 w-3" /> View
                      </Button>
                      {s.status !== "signed" && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-[hsl(160,84%,35%)]"
                          onClick={() => setSignDialog(s)}>
                          <CheckCircle2 className="h-3 w-3" /> Sign Off
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-[hsl(350,89%,50%)]"
                        onClick={() => handleDelete(s.summary_id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!viewSummary} onOpenChange={() => setViewSummary(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Summary — {viewSummary?.patient_id}</DialogTitle>
            <DialogDescription>
              {viewSummary?.summary_type} summary · {viewSummary?.status}
              {viewSummary?.signed_by && ` · Signed by ${viewSummary.signed_by}`}
            </DialogDescription>
          </DialogHeader>
          {viewSummary && <SummaryViewContent content={viewSummary.content} />}
        </DialogContent>
      </Dialog>

      {/* Sign Off Dialog */}
      <Dialog open={!!signDialog} onOpenChange={() => setSignDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Off Summary</DialogTitle>
            <DialogDescription>Signing as: Dr. Sarah Chen</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action will mark the summary as officially signed. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignDialog(null)}>Cancel</Button>
            <Button onClick={() => signDialog && handleSignOff(signDialog)} disabled={signing}
              className="gap-1.5 bg-[hsl(160,84%,39%)] hover:bg-[hsl(160,84%,35%)] text-white">
              {signing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <CheckCircle2 className="h-3.5 w-3.5" /> Confirm Sign Off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
