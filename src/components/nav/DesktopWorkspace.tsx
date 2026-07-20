"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Gamepad2, RotateCcw, Zap } from "lucide-react";
import { Sidebar } from "@/components/nav/Sidebar";
import { EditorChrome } from "@/components/nav/EditorChrome";
import { DesktopStatsWidget } from "@/components/nav/DesktopStatsWidget";

type WindowId = "explorer" | "editor" | "steam" | "stats" | "quick";
type Frame = { x: number; y: number; width: number; height: number; z: number };
type FrameMap = Record<WindowId, Frame>;

const DEFAULTS: FrameMap = {
  explorer: { x: 22, y: 70, width: 260, height: 690, z: 3 },
  editor: { x: 300, y: 24, width: 1120, height: 850, z: 2 },
  steam: { x: 24, y: 24, width: 258, height: 122, z: 4 },
  stats: { x: 24, y: 780, width: 360, height: 225, z: 5 },
  quick: { x: 1438, y: 40, width: 255, height: 190, z: 1 },
};

const STORAGE_KEY = "platinum-desktop-layout-v3";

export function DesktopWorkspace({ children }: { children: React.ReactNode }) {
  const desktopRef = useRef<HTMLDivElement>(null);
  const [frames, setFrames] = useState<FrameMap>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFrames({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(frames));
  }, [frames, ready]);

  const bringToFront = useCallback((id: WindowId) => {
    setFrames((current) => {
      const maxZ = Math.max(...Object.values(current).map((frame) => frame.z));
      return { ...current, [id]: { ...current[id], z: maxZ + 1 } };
    });
  }, []);

  const startDrag = useCallback((id: WindowId, event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest("a,button,input,select,textarea,[data-no-window-drag]")) return;
    event.preventDefault();
    bringToFront(id);
    const startX = event.clientX;
    const startY = event.clientY;
    const start = frames[id];

    const onMove = (moveEvent: PointerEvent) => {
      const bounds = desktopRef.current?.getBoundingClientRect();
      const width = bounds?.width ?? window.innerWidth;
      const height = bounds?.height ?? window.innerHeight;
      setFrames((current) => ({
        ...current,
        [id]: {
          ...current[id],
          x: Math.min(width - 90, Math.max(-start.width + 90, start.x + moveEvent.clientX - startX)),
          y: Math.min(height - 38, Math.max(0, start.y + moveEvent.clientY - startY)),
        },
      }));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [bringToFront, frames]);

  const startResize = useCallback((id: WindowId, event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault(); event.stopPropagation(); bringToFront(id);
    const startX = event.clientX; const startY = event.clientY; const start = frames[id];
    const minimums: Record<WindowId, [number, number]> = {
      explorer: [210, 340], editor: [560, 400], steam: [220, 105], stats: [300, 190], quick: [220, 160],
    };
    const onMove = (moveEvent: PointerEvent) => {
      const [minWidth, minHeight] = minimums[id];
      setFrames((current) => ({ ...current, [id]: { ...current[id], width: Math.max(minWidth, start.width + moveEvent.clientX - startX), height: Math.max(minHeight, start.height + moveEvent.clientY - startY) } }));
    };
    const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
  }, [bringToFront, frames]);

  const reset = () => { setFrames(DEFAULTS); localStorage.removeItem(STORAGE_KEY); };

  const Window = ({ id, title, children, className = "" }: { id: WindowId; title: string; children: React.ReactNode; className?: string }) => (
    <div className={`desktop-window ${className}`} style={{ left: frames[id].x, top: frames[id].y, width: frames[id].width, height: frames[id].height, zIndex: frames[id].z }} onPointerDown={() => bringToFront(id)}>
      <div className="desktop-window-dragbar" onPointerDown={(event) => startDrag(id, event)}><span className="desktop-window-dot" /><span>{title}</span><span className="desktop-drag-hint">drag</span></div>
      <div className="desktop-window-body">{children}</div>
      <button className="desktop-resize-handle" aria-label={`Redimensionner ${title}`} onPointerDown={(event) => startResize(id, event)} />
    </div>
  );

  return (
    <div ref={desktopRef} className="desktop-workspace hidden lg:block">
      <button type="button" className="desktop-reset" onClick={reset}><RotateCcw className="h-4 w-4" /><span>Reset layout</span></button>
      <Window id="steam" title="Steam identity" className="steam-logo-window"><div className="steam-logo-card"><span className="steam-logo-orbit"><Gamepad2 className="h-8 w-8" /></span><div><strong>PLATINUM.EXE</strong><small>STEAM COMPLETION OS</small></div></div></Window>
      <Window id="explorer" title="Explorer" className="explorer-window"><Sidebar embedded /></Window>
      <Window id="editor" title="Steam Completion OS" className="editor-window"><EditorChrome>{children}</EditorChrome></Window>
      <Window id="stats" title="Game statistics" className="stats-window"><DesktopStatsWidget /></Window>
      <Window id="quick" title="Quick launch" className="quick-window"><div className="quick-launch-grid"><a href="/games"><Gamepad2 />Bibliothèque</a><a href="/hunt"><Zap />Lancer une chasse</a></div></Window>
    </div>
  );
}
