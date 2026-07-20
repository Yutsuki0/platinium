"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Bug,
  CircleUserRound,
  Code2,
  GitBranch,
  Search,
  Settings,
  SplitSquareHorizontal,
  TerminalSquare,
  Trophy,
  X,
} from "lucide-react";

const PAGE_META: Record<string, { file: string; folder: string; type: string }> = {
  "/dashboard": { file: "dashboard.tsx", folder: "src / app / dashboard", type: "TSX" },
  "/games": { file: "games.library.tsx", folder: "src / app / games", type: "TSX" },
  "/achievements": { file: "achievements.tsx", folder: "src / app / achievements", type: "TSX" },
  "/objectives": { file: "objectives.json", folder: "src / data", type: "JSON" },
  "/planner": { file: "planner.ts", folder: "src / services", type: "TS" },
  "/hunt": { file: "hunt-mode.tsx", folder: "src / app / hunt", type: "TSX" },
  "/recommendations": { file: "recommendations.ts", folder: "src / engine", type: "TS" },
  "/statistics": { file: "statistics.sql", folder: "database / queries", type: "SQL" },
  "/history": { file: "sync-history.log", folder: "logs / steam", type: "LOG" },
  "/settings": { file: "settings.config.ts", folder: "src / config", type: "TS" },
};

function getMeta(pathname: string) {
  const key = Object.keys(PAGE_META).find(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  return PAGE_META[key ?? "/dashboard"];
}

export function EditorChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const meta = getMeta(pathname);

  return (
    <div className="ide-window">
      <header className="ide-titlebar">
        <div className="ide-traffic" aria-hidden="true">
          <span className="ide-traffic-dot ide-traffic-red" />
          <span className="ide-traffic-dot ide-traffic-yellow" />
          <span className="ide-traffic-dot ide-traffic-green" />
        </div>
        <div className="ide-title">
          <Code2 className="h-3.5 w-3.5" />
          <span>PLATINUM.EXE</span>
          <span className="text-emerald-300/40">—</span>
          <span className="text-emerald-100/55">steam-platinum-tracker</span>
        </div>
        <div className="ide-title-actions">
          <Search className="h-3.5 w-3.5" />
          <SplitSquareHorizontal className="h-3.5 w-3.5" />
        </div>
      </header>

      <div className="ide-workbench">
        <aside className="ide-activitybar" aria-label="Barre d’activité">
          <div className="ide-activity-group">
            <Link href="/dashboard" className="ide-activity active" title="Explorateur">
              <Boxes className="h-5 w-5" />
            </Link>
            <Link href="/games" className="ide-activity" title="Recherche">
              <Search className="h-5 w-5" />
            </Link>
            <Link href="/history" className="ide-activity" title="Contrôle de source">
              <GitBranch className="h-5 w-5" />
            </Link>
            <Link href="/hunt" className="ide-activity" title="Exécuter et déboguer">
              <Bug className="h-5 w-5" />
            </Link>
            <Link href="/achievements" className="ide-activity" title="Extensions">
              <Trophy className="h-5 w-5" />
            </Link>
          </div>
          <div className="ide-activity-group mt-auto">
            <Link href="/settings" className="ide-activity" title="Compte">
              <CircleUserRound className="h-5 w-5" />
            </Link>
            <Link href="/settings" className="ide-activity" title="Paramètres">
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </aside>

        <section className="ide-editor-area">
          <div className="ide-tabs">
            <div className="ide-tab active">
              <span className="ide-file-icon">{meta.type}</span>
              <span>{meta.file}</span>
              <X className="h-3 w-3 opacity-45" />
            </div>
            <div className="ide-tab ide-tab-muted">
              <span className="ide-file-icon">ENV</span>
              <span>runtime.env</span>
            </div>
          </div>

          <div className="ide-breadcrumbs">
            <span>{meta.folder}</span>
            <span className="text-emerald-400/70">›</span>
            <span className="text-emerald-100/80">{meta.file}</span>
          </div>

          <div className="ide-editor-scroll">
            <div className="ide-gutter" aria-hidden="true">
              {Array.from({ length: 42 }, (_, index) => (
                <span key={index}>{String(index + 1).padStart(2, "0")}</span>
              ))}
            </div>
            <main className="ide-page">{children}</main>
          </div>
        </section>
      </div>

      <footer className="ide-statusbar">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" /> main*</span>
          <span>× 0</span>
          <span>△ 0</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Ln 1, Col 1</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span className="hidden sm:inline">TypeScript React</span>
          <span className="flex items-center gap-1"><TerminalSquare className="h-3 w-3" /> Steam API: ONLINE</span>
        </div>
      </footer>
    </div>
  );
}
