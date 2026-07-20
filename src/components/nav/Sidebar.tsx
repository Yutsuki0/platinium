"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Crosshair,
  FileCode2,
  FileJson2,
  FileText,
  FolderOpen,
  Gamepad2,
  History,
  LayoutDashboard,
  Settings,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "dashboard.tsx", icon: LayoutDashboard, tint: "text-emerald-300" },
  { href: "/games", label: "games.library.tsx", icon: Gamepad2, tint: "text-emerald-300" },
  { href: "/achievements", label: "achievements.tsx", icon: Trophy, tint: "text-yellow-300" },
  { href: "/objectives", label: "objectives.json", icon: Target, tint: "text-yellow-300" },
  { href: "/planner", label: "planner.ts", icon: CalendarDays, tint: "text-emerald-300" },
  { href: "/hunt", label: "hunt-mode.tsx", icon: Crosshair, tint: "text-emerald-300" },
  { href: "/recommendations", label: "recommendations.ts", icon: Sparkles, tint: "text-emerald-300" },
  { href: "/statistics", label: "statistics.sql", icon: BarChart3, tint: "text-orange-300" },
  { href: "/history", label: "sync-history.log", icon: History, tint: "text-slate-400" },
  { href: "/settings", label: "settings.config.ts", icon: Settings, tint: "text-emerald-300" },
] as const;

export function Sidebar({ embedded = false }: { embedded?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className={cn("ide-explorer flex h-full w-full shrink-0 flex-col", !embedded && "hidden lg:flex lg:w-[246px]")}>
      <div className="ide-explorer-title">
        <span>EXPLORER</span>
        <span className="tracking-normal text-emerald-300/50">•••</span>
      </div>

      <div className="ide-project-row">
        <ChevronDown className="h-3.5 w-3.5" />
        <span>FULLCLEAR-OS</span>
      </div>

      <div className="ide-tree">
        <div className="ide-folder ide-tree-static"><ChevronDown className="h-3.5 w-3.5" /><FolderOpen className="h-3.5 w-3.5 text-emerald-300/70" /><span>src</span></div>
        <div className="ide-folder ide-tree-static pl-5"><ChevronDown className="h-3.5 w-3.5" /><FolderOpen className="h-3.5 w-3.5 text-emerald-300/70" /><span>app</span></div>

        <nav className="mt-1 flex flex-col">
          {NAV_ITEMS.map(({ href, label, icon: Icon, tint }) => {
            const active = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn("ide-file-row", active && "active")}
              >
                <span className="ide-tree-guide" />
                <Icon className={cn("h-3.5 w-3.5 shrink-0", tint)} />
                <span className="truncate">{label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(53,255,122,.9)]" />}
              </Link>
            );
          })}
        </nav>

        <div className="ide-folder ide-tree-static mt-2"><ChevronRight className="h-3.5 w-3.5" /><FolderOpen className="h-3.5 w-3.5 text-emerald-300/55" /><span>components</span></div>
        <div className="ide-folder ide-tree-static"><ChevronRight className="h-3.5 w-3.5" /><FolderOpen className="h-3.5 w-3.5 text-emerald-300/55" /><span>lib</span></div>
        <div className="ide-folder ide-tree-static"><ChevronRight className="h-3.5 w-3.5" /><FolderOpen className="h-3.5 w-3.5 text-emerald-300/55" /><span>database</span></div>

        <div className="ide-static-file ide-tree-static"><FileJson2 className="h-3.5 w-3.5 text-yellow-300" /><span>package.json</span></div>
        <div className="ide-static-file ide-tree-static"><FileCode2 className="h-3.5 w-3.5 text-emerald-300" /><span>next.config.mjs</span></div>
        <div className="ide-static-file ide-tree-static"><FileText className="h-3.5 w-3.5 text-slate-400" /><span>README.md</span></div>
      </div>

      <div className="mt-auto border-t border-emerald-400/10">
        <div className="ide-panel-row"><ChevronRight className="h-3.5 w-3.5" /> OUTLINE</div>
        <div className="ide-panel-row"><ChevronRight className="h-3.5 w-3.5" /> TIMELINE</div>
      </div>
    </aside>
  );
}
