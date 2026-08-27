import { Bell, ChevronRight } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { demoPatient } from "@/lib/demo-data";

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/upload": "Upload Records",
  "/documents": "Document Library",
  "/summaries": "Summaries",
  "/settings": "Settings",
};

export function TopBar() {
  const location = useLocation();
  const currentLabel = routeLabels[location.pathname] || "MediSync";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">MediSync</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">{currentLabel}</span>
      </div>

      {/* Patient Pill */}
      <div className="flex items-center gap-2.5 rounded-full border border-border bg-background px-3 py-1.5 shadow-sm">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(226,71%,48%)] text-[10px] font-bold text-white">
          {demoPatient.initials}
        </div>
        <span className="text-sm font-medium text-foreground">{demoPatient.name}</span>
        <span className="text-xs font-mono text-muted-foreground">{demoPatient.mrn}</span>
        <span className="h-2 w-2 rounded-full bg-[hsl(160,84%,39%)] animate-pulse" />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted">
          <Bell className="h-4.5 w-4.5 text-muted-foreground" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[hsl(350,89%,60%)]" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(270,60%,55%)] to-[hsl(290,60%,45%)] text-[11px] font-bold text-white">
          SC
        </div>
      </div>
    </header>
  );
}
