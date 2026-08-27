import { useState, useEffect, useCallback, useRef } from "react";
import {
  Sparkles, FileText, Pill, StickyNote, Heart, Activity, Thermometer,
  Wind, Waves, Flame, Clock, AlertCircle, UploadCloud, TrendingUp,
  TrendingDown, Minus, Calendar, User, MapPin, Stethoscope, Copy,
  FileDown, FileCode, CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useAppStore } from "@/stores/useAppStore";
import { api } from "@/lib/api";
import { demoPatient, demoVitals, demoTimeline, demoSummary } from "@/lib/demo-data";
import type { Summary, SummaryContent } from "@/lib/types";

const vitalsIcons: Record<string, any> = { Heart, Activity, Thermometer, Wind, Waves, Flame };
const trendIcons = { up: TrendingUp, down: TrendingDown, stable: Minus };

function PatientPanel() {
  const { addDocument } = useAppStore();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const res = await api.uploadFile(file, setUploadProgress);
      if (res.document) addDocument(res.document);
      toast.success(`${file.name} uploaded successfully`);
    } catch {
      toast.error(`Upload failed for ${file.name}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card overflow-auto">
      {/* Hero Banner */}
      <div className="relative">
        <div className="h-24 bg-gradient-to-r from-[hsl(226,71%,40%)] to-[hsl(192,91%,45%)]" />
        <div className="absolute left-1/2 top-14 -translate-x-1/2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-card bg-card text-xl font-bold text-[hsl(226,71%,40%)] shadow-lg">
            {demoPatient.initials}
          </div>
        </div>
      </div>
      <div className="px-4 pt-10 pb-4 text-center">
        <h2 className="text-lg font-bold text-foreground">{demoPatient.name}</h2>
        <p className="font-mono text-xs text-muted-foreground">{demoPatient.mrn}</p>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[hsl(38,92%,95%)] px-2.5 py-0.5 text-xs font-medium text-[hsl(38,92%,35%)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(38,92%,50%)] animate-pulse" />
          In-Patient · {demoPatient.status}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {[`${demoPatient.age} yrs`, demoPatient.gender, demoPatient.bloodGroup, demoPatient.ward, `Bed ${demoPatient.bed}`].map((c) => (
            <span key={c} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{c}</span>
          ))}
        </div>
      </div>

      <div className="space-y-1 px-4 text-xs">
        {[
          { icon: Calendar, label: "Admitted", value: "Dec 15, 2024" },
          { icon: User, label: "Physician", value: demoPatient.attending },
          { icon: MapPin, label: "Ward", value: demoPatient.ward },
          { icon: Stethoscope, label: "Diagnosis", value: demoPatient.diagnosis },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2 py-1.5">
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground w-16 shrink-0">{label}</span>
            <span className="font-medium text-foreground truncate">{value}</span>
          </div>
        ))}
      </div>

      {/* Chief Complaint */}
      <div className="mx-4 mt-3 rounded-lg border-l-4 border-[hsl(38,92%,50%)] bg-[hsl(38,92%,95%)] p-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[hsl(38,92%,35%)]">
          <AlertCircle className="h-3.5 w-3.5" /> Chief Complaint
        </div>
        <p className="mt-1 text-sm font-bold text-foreground">{demoPatient.chiefComplaint}</p>
      </div>

      {/* Allergies */}
      <div className="mx-4 mt-3">
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Allergies</p>
        <div className="flex flex-wrap gap-1.5">
          {demoPatient.allergies.map((a) => (
            <span key={a} className="rounded-full bg-[hsl(350,89%,95%)] px-2.5 py-0.5 text-[11px] font-medium text-[hsl(350,89%,40%)]">{a}</span>
          ))}
        </div>
      </div>

      <Separator className="mx-4 my-3" />

      {/* Vitals */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-foreground">Current Vitals</h3>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" /> Live
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(160,84%,39%)] animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {demoVitals.map((v) => {
            const Icon = vitalsIcons[v.icon];
            const TrendIcon = trendIcons[v.trend];
            const colors = v.status === "normal"
              ? "bg-[hsl(160,84%,95%)] border-[hsl(160,84%,80%)]"
              : v.status === "elevated"
              ? "bg-[hsl(38,92%,95%)] border-[hsl(38,92%,80%)]"
              : "bg-[hsl(350,89%,95%)] border-[hsl(350,89%,80%)]";
            return (
              <div key={v.label} className={`rounded-lg border p-2 ${colors}`}>
                <div className="flex items-center justify-between">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <TrendIcon className="h-2.5 w-2.5" />{v.delta}
                  </div>
                </div>
                <p className="mt-1 text-base font-bold text-foreground leading-none">{v.value}<span className="ml-0.5 text-[10px] font-normal text-muted-foreground">{v.unit}</span></p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{v.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload Zone */}
      <div className="p-4 mt-auto">
        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.tiff,.csv,.json,.txt"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-border p-4 text-center transition-colors hover:border-[hsl(226,71%,60%)] hover:bg-[hsl(226,71%,97%)]"
        >
          <UploadCloud className="h-6 w-6 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Upload Records</span>
          <span className="text-[10px] text-muted-foreground">PDF · DOCX · JPG</span>
        </button>
        {uploading && <Progress value={uploadProgress} className="mt-2 h-1.5" />}
      </div>
    </aside>
  );
}

// Typewriter hook
function useTypewriter(text: string, speed = 16, charsPerTick = 6) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i += charsPerTick;
      if (i >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(interval);
      } else {
        setDisplayed(text.slice(0, i));
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, charsPerTick]);
  return { displayed, done };
}

function SummaryContentView({ content, citations }: { content: SummaryContent; citations?: any[] }) {
  return (
    <div className="space-y-5 animate-fadeInUp">
      {/* Chief Complaint */}
      <div className="rounded-lg border-l-4 border-[hsl(38,92%,50%)] bg-[hsl(38,92%,95%)] p-3">
        <p className="text-xs font-medium text-[hsl(38,92%,35%)] mb-1">Chief Complaint</p>
        <p className="text-sm font-semibold text-foreground">{content.chief_complaint}</p>
      </div>

      {/* Diagnosis */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Diagnosis</h4>
        <ul className="space-y-1">
          {content.diagnosis.map((d, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(226,71%,48%)]" />{d}
            </li>
          ))}
        </ul>
      </div>

      {/* Medications Table */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Medications</h4>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Dose</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Freq</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Route</th>
              </tr>
            </thead>
            <tbody>
              {content.medications.map((m, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2 font-medium text-foreground">{m.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{m.dosage}</td>
                  <td className="px-3 py-2 text-muted-foreground">{m.frequency}</td>
                  <td className="px-3 py-2 text-muted-foreground">{m.route}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allergies */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Allergies</h4>
        <div className="flex flex-wrap gap-1.5">
          {content.allergies.map((a) => (
            <span key={a} className="rounded-full bg-[hsl(350,89%,95%)] px-2.5 py-0.5 text-xs font-medium text-[hsl(350,89%,40%)]">{a}</span>
          ))}
        </div>
      </div>

      {/* Vitals Grid */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Vitals at Discharge</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(content.vitals).map(([k, v]) => (
            <div key={k} className="flex justify-between rounded-md bg-muted px-3 py-1.5">
              <span className="text-muted-foreground capitalize text-xs">{k.replace(/_/g, " ")}</span>
              <span className="font-medium text-foreground text-xs">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Procedures */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Procedures Performed</h4>
        <ul className="space-y-1">
          {content.procedures_performed.map((p, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(160,84%,39%)]" />{p}
            </li>
          ))}
        </ul>
      </div>

      {/* Follow-up */}
      <div className="rounded-lg border-l-4 border-[hsl(180,60%,45%)] bg-[hsl(180,60%,95%)] p-3">
        <p className="text-xs font-medium text-[hsl(180,60%,30%)] mb-1">Follow-up Instructions</p>
        <p className="text-sm text-foreground">{content.follow_up_instructions}</p>
      </div>

      {/* Disposition */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Disposition:</span>
        <Badge variant="secondary" className="text-xs">{content.discharge_disposition}</Badge>
      </div>

      {/* Citations */}
      {citations && citations.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Citations</h4>
          <div className="space-y-2">
            {citations.map((c, i) => (
              <div key={i} className="rounded-lg bg-muted p-3 text-xs">
                <p className="text-foreground">{c.claim}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{c.source_document}</Badge>
                  <span className="text-muted-foreground">chunk: {c.chunk_id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DischargeSummaryTab({ summary, isGenerating }: { summary: Summary | null; isGenerating: boolean }) {
  if (isGenerating) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fadeInUp">
        <div className="rounded-2xl bg-card p-8 shadow-sm border border-border text-center max-w-md">
          <Sparkles className="mx-auto h-12 w-12 text-[hsl(226,71%,48%)] mb-4" />
          <h3 className="text-lg font-bold text-foreground">Ready to Generate</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Upload clinical documents and click "Generate Summary" to create an AI-powered discharge summary.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {["Discharge Plan", "Clinical Notes", "Handoff Ready"].map((t) => (
              <div key={t} className="rounded-xl bg-muted p-3 text-center">
                <p className="text-xs font-medium text-foreground">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <SummaryContentView content={summary.content} citations={summary.citations} />
        {/* Export bar */}
        <Separator className="my-5" />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Export as:</span>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5"
            onClick={() => {
              const text = JSON.stringify(summary.content, null, 2);
              navigator.clipboard.writeText(text);
              toast.success("Copied to clipboard");
            }}>
            <Copy className="h-3 w-3" /> Copy Text
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5"
            onClick={() => toast.info("PDF export coming soon")}>
            <FileDown className="h-3 w-3" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5"
            onClick={() => toast.info("Markdown export coming soon")}>
            <FileCode className="h-3 w-3" /> Markdown
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MedicationsTab({ summary }: { summary: Summary | null }) {
  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Pill className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Generate a summary to see medications</p>
      </div>
    );
  }
  const meds = summary.content.medications;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Active Medication List</CardTitle>
          <Badge variant="secondary">{meds.length} drugs</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {meds.map((m, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-3">
              <Pill className="h-4 w-4 text-[hsl(226,71%,48%)]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.dosage} · {m.frequency} · {m.route}</p>
              </div>
              <Badge variant={m.frequency === "PRN" ? "outline" : "secondary"} className="text-[10px]">
                {m.frequency === "PRN" ? "PRN" : "Active"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineTab() {
  return (
    <div className="relative space-y-0 pl-6">
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
      {demoTimeline.map((e, i) => (
        <div key={i} className="relative flex gap-4 pb-6 animate-fadeInUp" style={{ animationDelay: `${i * 80}ms` }}>
          <div className={`absolute left-[-17px] top-1 h-3 w-3 rounded-full ${e.color} ring-4 ring-card`} />
          <Card className="flex-1">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] capitalize">{e.type}</Badge>
                <span className="text-[10px] text-muted-foreground font-mono">{e.time}</span>
              </div>
              <p className="text-sm text-foreground">{e.text}</p>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { documents, activeSummary, setActiveSummary, addSummary } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generateSummary({
        patient_id: "patient-001",
        document_ids: documents.map((d) => d.document_id),
        summary_type: "discharge",
        include_citations: true,
      });
      addSummary(res);
      setActiveSummary(res);
      toast.success("Discharge summary generated");
    } catch {
      // Fallback to demo
      addSummary(demoSummary);
      setActiveSummary(demoSummary);
      toast.success("Discharge summary generated (demo)");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full">
      <PatientPanel />
      <div className="flex-1 bg-dot-grid overflow-auto">
        <ScrollArea className="h-full">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <Sparkles className="h-5 w-5 text-[hsl(226,71%,48%)]" />
                  AI Discharge Copilot
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">Generate and manage discharge documentation</p>
              </div>
              <div className="flex items-center gap-3">
                {activeSummary && (
                  <Badge className="bg-[hsl(160,84%,39%)] text-white border-0">Summary Ready</Badge>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="shimmer-btn rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-shadow hover:shadow-lg disabled:opacity-50"
                >
                  {isGenerating ? "Generating..." : "Generate Summary"}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" /> Discharge Summary</TabsTrigger>
                <TabsTrigger value="medications" className="gap-1.5 text-xs"><Pill className="h-3.5 w-3.5" /> Medications</TabsTrigger>
                <TabsTrigger value="timeline" className="gap-1.5 text-xs"><StickyNote className="h-3.5 w-3.5" /> Timeline</TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="mt-4">
                <DischargeSummaryTab summary={activeSummary} isGenerating={isGenerating} />
              </TabsContent>
              <TabsContent value="medications" className="mt-4">
                <MedicationsTab summary={activeSummary} />
              </TabsContent>
              <TabsContent value="timeline" className="mt-4">
                <TimelineTab />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
