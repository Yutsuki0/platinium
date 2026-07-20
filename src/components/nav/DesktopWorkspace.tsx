"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Sidebar } from "@/components/nav/Sidebar";
import { EditorChrome } from "@/components/nav/EditorChrome";

type Frame = { x: number; y: number; width: number; height: number; z: number };
type FrameMap = { explorer: Frame; editor: Frame };

const DEFAULTS: FrameMap = {
  explorer: { x: 18, y: 42, width: 250, height: 720, z: 2 },
  editor: { x: 286, y: 18, width: 1180, height: 820, z: 1 },
};

const STORAGE_KEY = "platinum-desktop-layout-v2";

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
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(frames));
  }, [frames, ready]);

  const bringToFront = useCallback((id: keyof FrameMap) => {
    setFrames((current) => {
      const maxZ = Math.max(...Object.values(current).map((frame) => frame.z));
      return { ...current, [id]: { ...current[id], z: maxZ + 1 } };
    });
  }, []);

  const startDrag = useCallback((id: keyof FrameMap, event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("a,button,input,select,textarea,[data-no-window-drag]")) return;
    event.preventDefault();
    bringToFront(id);

    const startX = event.clientX;
    const startY = event.clientY;
    const start = frames[id];
    const bounds = desktopRef.current?.getBoundingClientRect();

    const onMove = (moveEvent: PointerEvent) => {
      const maxX = Math.max(0, (bounds?.width ?? window.innerWidth) - 120);
      const maxY = Math.max(0, (bounds?.height ?? window.innerHeight) - 50);
      setFrames((current) => ({
        ...current,
        [id]: {
          ...current[id],
          x: Math.min(maxX, Math.max(-start.width + 120, start.x + moveEvent.clientX - startX)),
          y: Math.min(maxY, Math.max(0, start.y + moveEvent.clientY - startY)),
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

  const startResize = useCallback((id: keyof FrameMap, event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    bringToFront(id);
    const startX = event.clientX;
    const startY = event.clientY;
    const start = frames[id];
    const onMove = (moveEvent: PointerEvent) => {
      setFrames((current) => ({
        ...current,
        [id]: {
          ...current[id],
          width: Math.max(id === "explorer" ? 210 : 560, start.width + moveEvent.clientX - startX),
          height: Math.max(340, start.height + moveEvent.clientY - startY),
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

  const reset = () => {
    setFrames(DEFAULTS);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("platinum-inner-panel-layout-v2");
    window.dispatchEvent(new Event("platinum-reset-inner-layout"));
  };

  return (
    <div ref={desktopRef} className="desktop-workspace hidden lg:block">
      <button type="button" className="desktop-reset" onClick={reset} title="Réinitialiser la disposition">
        <RotateCcw className="h-4 w-4" />
        <span>Reset layout</span>
      </button>

      <div
        className="desktop-window explorer-window"
        style={{ left: frames.explorer.x, top: frames.explorer.y, width: frames.explorer.width, height: frames.explorer.height, zIndex: frames.explorer.z }}
        onPointerDown={() => bringToFront("explorer")}
      >
        <div className="desktop-window-dragbar" onPointerDown={(event) => startDrag("explorer", event)}>
          <span className="desktop-window-dot" /><span>Explorer</span><span className="desktop-drag-hint">drag</span>
        </div>
        <div className="desktop-window-body"><Sidebar embedded /></div>
        <button className="desktop-resize-handle" aria-label="Redimensionner Explorer" onPointerDown={(event) => startResize("explorer", event)} />
      </div>

      <div
        className="desktop-window editor-window"
        style={{ left: frames.editor.x, top: frames.editor.y, width: frames.editor.width, height: frames.editor.height, zIndex: frames.editor.z }}
        onPointerDown={() => bringToFront("editor")}
      >
        <div className="desktop-window-dragbar" onPointerDown={(event) => startDrag("editor", event)}>
          <span className="desktop-window-dot" /><span>Steam Completion OS</span><span className="desktop-drag-hint">drag</span>
        </div>
        <div className="desktop-window-body"><EditorChrome>{children}</EditorChrome></div>
        <button className="desktop-resize-handle" aria-label="Redimensionner la fenêtre principale" onPointerDown={(event) => startResize("editor", event)} />
      </div>
    </div>
  );
}
