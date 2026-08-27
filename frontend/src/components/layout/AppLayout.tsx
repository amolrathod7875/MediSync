import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { useAppStore } from "@/stores/useAppStore";

export function AppLayout() {
  const { backendOnline, checkBackendHealth } = useAppStore();

  useEffect(() => {
    checkBackendHealth();
  }, [checkBackendHealth]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {!backendOnline && (
          <div className="flex items-center gap-2 bg-[hsl(38,92%,50%)] px-4 py-1.5 text-sm font-medium text-white">
            <AlertCircle className="h-4 w-4" />
            Backend offline — running in demo mode
          </div>
        )}
        <TopBar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
