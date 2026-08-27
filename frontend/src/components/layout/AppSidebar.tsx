import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  UploadCloud,
  FolderOpen,
  ClipboardList,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: UploadCloud, label: "Upload", path: "/upload" },
  { icon: FolderOpen, label: "Documents", path: "/documents" },
  { icon: ClipboardList, label: "Summaries", path: "/summaries" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="flex h-screen w-16 flex-col items-center bg-[hsl(222,47%,11%)] py-4">
      {/* Logo */}
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(226,71%,55%)] to-[hsl(192,91%,45%)] animate-pulse-ring">
        <Zap className="h-5 w-5 text-white" />
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
          const isExactDashboard = path === "/" && location.pathname === "/";
          const isActive = path === "/" ? isExactDashboard : active;

          return (
            <Tooltip key={path} delayDuration={100}>
              <TooltipTrigger asChild>
                <Link
                  to={path}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-[hsl(226,71%,48%)] text-white shadow-md"
                      : "text-[hsl(215,20%,65%)] hover:bg-[hsl(217,33%,18%)] hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Logout */}
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl text-[hsl(215,20%,65%)] transition-colors hover:text-[hsl(350,89%,60%)]">
            <LogOut className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          Log out
        </TooltipContent>
      </Tooltip>
    </aside>
  );
}
