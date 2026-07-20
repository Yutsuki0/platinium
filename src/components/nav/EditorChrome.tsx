"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FreeformCanvas } from "@/components/nav/FreeformCanvas";
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

type EditorTab = {
  id: string;
  label: string;
  type: string;
  muted?: boolean;
};

function getMeta(pathname: string) {
  const key = Object.keys(PAGE_META).find(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  return PAGE_META[key ?? "/dashboard"];
}

function SpatialCore() {
  return (
    <div className="spatial-core" aria-hidden="true">
      <div className="spatial-orbit spatial-orbit-a" />
      <div className="spatial-orbit spatial-orbit-b" />
      <div className="spatial-cube">
        <span className="cube-face cube-front" />
        <span className="cube-face cube-back" />
        <span className="cube-face cube-right" />
        <span className="cube-face cube-left" />
        <span className="cube-face cube-top" />
        <span className="cube-face cube-bottom" />
      </div>
      <span className="spatial-pulse" />
    </div>
  );
}

export function EditorChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const meta = getMeta(pathname);
  const initialTabs = useMemo<EditorTab[]>(
    () => [
      { id: "active", label: meta.file, type: meta.type },
      { id: "runtime", label: "runtime.env", type: "ENV", muted: true },
      { id: "steam", label: "steam.session", type: "API", muted: true },
    ],
    [meta.file, meta.type]
  );
  const [tabs, setTabs] = useState(initialTabs);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    setTabs((current) => {
      const rest = current.filter((tab) => tab.id !== "active");
      return [{ id: "active", label: meta.file, type: meta.type }, ...rest];
    });
  }, [meta.file, meta.type]);

  const moveTab = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    setTabs((current) => {
      const from = current.findIndex((tab) => tab.id === draggedId);
      const to = current.findIndex((tab) => tab.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  return (
    <div className="ide-window mac-liquid-window">
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
          <span className="text-emerald-100/55">Steam Completion OS</span>
        </div>
        <div className="ide-title-actions" aria-label="Actions de fenêtre">
          <Search className="h-3.5 w-3.5" />
          <SplitSquareHorizontal className="h-3.5 w-3.5" />
        </div>
      </header>

      <div className="ide-workbench">
        <aside className="ide-activitybar" aria-label="Navigation principale">
          <div className="ide-activity-group">
            <Link href="/dashboard" className="ide-activity active" aria-label="Tableau de bord" title="Tableau de bord">
              <Boxes className="h-5 w-5" />
            </Link>
            <Link href="/games" className="ide-activity" aria-label="Bibliothèque" title="Bibliothèque">
              <Search className="h-5 w-5" />
            </Link>
            <Link href="/history" className="ide-activity" aria-label="Historique" title="Historique">
              <GitBranch className="h-5 w-5" />
            </Link>
            <Link href="/hunt" className="ide-activity" aria-label="Mode chasse" title="Mode chasse">
              <Bug className="h-5 w-5" />
            </Link>
            <Link href="/achievements" className="ide-activity" aria-label="Succès" title="Succès">
              <Trophy className="h-5 w-5" />
            </Link>
          </div>
          <div className="ide-activity-group mt-auto">
            <Link href="/settings" className="ide-activity" aria-label="Compte" title="Compte">
              <CircleUserRound className="h-5 w-5" />
            </Link>
            <Link href="/settings" className="ide-activity" aria-label="Réglages" title="Réglages">
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </aside>

        <section className="ide-editor-area">
          <div className="ide-tabs" role="tablist" aria-label="Onglets déplaçables">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`ide-tab ${tab.id === "active" ? "active" : ""} ${tab.muted ? "ide-tab-muted" : ""} ${draggedId === tab.id ? "dragging" : ""}`}
                draggable
                onDragStart={(event) => {
                  setDraggedId(tab.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", tab.id);
                }}
                onDragEnter={(event) => {
                  event.preventDefault();
                  moveTab(tab.id);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragEnd={() => setDraggedId(null)}
                role="tab"
                aria-selected={tab.id === "active"}
              >
                <span className="ide-tab-grip" aria-hidden="true">··</span>
                <span className="ide-file-icon">{tab.type}</span>
                <span>{tab.label}</span>
                {tab.id === "active" && <X className="h-3 w-3 opacity-45" />}
              </div>
            ))}
            <div className="ide-tab-spacer" />
          </div>

          <div className="ide-breadcrumbs">
            <span>{meta.folder}</span>
            <span className="text-emerald-400/70">›</span>
            <span className="text-emerald-100/80">{meta.file}</span>
            <span className="mac-command-pill">⌘ K</span>
          </div>

          <div className="ide-editor-scroll">
            <div className="ide-gutter" aria-hidden="true">
              {Array.from({ length: 42 }, (_, index) => (
                <span key={index}>{String(index + 1).padStart(2, "0")}</span>
              ))}
            </div>
            <main className="ide-page">
              <SpatialCore />
              <FreeformCanvas>{children}</FreeformCanvas>
            </main>
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
