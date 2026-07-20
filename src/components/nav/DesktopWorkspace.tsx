"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Sidebar } from "@/components/nav/Sidebar";
import { EditorChrome } from "@/components/nav/EditorChrome";

type WindowId = "explorer" | "editor";
type Frame = { x: number; y: number; width: number; height: number; z: number };
type FrameMap = Record<WindowId, Frame>;

const DEFAULTS: FrameMap = {
  explorer: { x: 22, y: 24, width: 270, height: 760, z: 3 },
  editor: { x: 310, y: 24, width: 1180, height: 860, z: 2 },
};

const STORAGE_KEY = "platinum-desktop-layout-v5";

export function DesktopWorkspace({ children }: { children: React.ReactNode }) {
  const desktopRef = useRef<HTMLDivElement>(null);
  const windowRefs = useRef<Record<WindowId, HTMLDivElement | null>>({ explorer: null, editor: null });
  const [frames, setFrames] = useState<FrameMap>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFrames({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timeout = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(frames));
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [frames, ready]);

  const bringToFront = useCallback((id: WindowId) => {
    setFrames((current) => {
      const maxZ = Math.max(...Object.values(current).map((frame) => frame.z));
      if (current[id].z === maxZ) return current;
      return { ...current, [id]: { ...current[id], z: maxZ + 1 } };
    });
  }, []);

  const startDrag = useCallback((id: WindowId, event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("a,button,input,select,textarea,[data-no-window-drag]")) return;

    event.preventDefault();
    bringToFront(id);

    const node = windowRefs.current[id];
    const desktop = desktopRef.current;
    if (!node || !desktop) return;

    event.currentTarget.setPointerCapture?.(event.pointerId);
    node.classList.add("is-interacting");

    const start = frames[id];
    const startX = event.clientX;
    const startY = event.clientY;
    let nextX = start.x;
    let nextY = start.y;
    let frameRequest = 0;
    let deltaX = 0;
    let deltaY = 0;

    const paint = () => {
      frameRequest = 0;
      node.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
    };

    const onMove = (moveEvent: PointerEvent) => {
      const bounds = desktop.getBoundingClientRect();
      nextX = Math.min(bounds.width - 90, Math.max(-start.width + 90, start.x + moveEvent.clientX - startX));
      nextY = Math.min(bounds.height - 38, Math.max(0, start.y + moveEvent.clientY - startY));
      deltaX = nextX - start.x;
      deltaY = nextY - start.y;
      if (!frameRequest) frameRequest = window.requestAnimationFrame(paint);
    };

    const finish = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      if (frameRequest) window.cancelAnimationFrame(frameRequest);
      node.style.transform = "";
      node.classList.remove("is-interacting");
      setFrames((current) => ({ ...current, [id]: { ...current[id], x: nextX, y: nextY } }));
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", finish, { once: true });
    window.addEventListener("pointercancel", finish, { once: true });
  }, [bringToFront, frames]);

  const startResize = useCallback((id: WindowId, event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    bringToFront(id);

    const node = windowRefs.current[id];
    const desktop = desktopRef.current;
    if (!node || !desktop) return;

    node.classList.add("is-interacting");
    const start = frames[id];
    const startX = event.clientX;
    const startY = event.clientY;
    const minimums: Record<WindowId, [number, number]> = {
      explorer: [220, 360],
      editor: [620, 440],
    };
    let nextWidth = start.width;
    let nextHeight = start.height;
    let frameRequest = 0;

    const paint = () => {
      frameRequest = 0;
      node.style.width = `${nextWidth}px`;
      node.style.height = `${nextHeight}px`;
    };

    const onMove = (moveEvent: PointerEvent) => {
      const bounds = desktop.getBoundingClientRect();
      const [minWidth, minHeight] = minimums[id];
      const maxWidth = Math.max(minWidth, bounds.width - Math.max(0, start.x) - 8);
      const maxHeight = Math.max(minHeight, bounds.height - start.y - 8);
      nextWidth = Math.min(maxWidth, Math.max(minWidth, start.width + moveEvent.clientX - startX));
      nextHeight = Math.min(maxHeight, Math.max(minHeight, start.height + moveEvent.clientY - startY));
      if (!frameRequest) frameRequest = window.requestAnimationFrame(paint);
    };

    const finish = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      if (frameRequest) window.cancelAnimationFrame(frameRequest);
      node.classList.remove("is-interacting");
      setFrames((current) => ({ ...current, [id]: { ...current[id], width: nextWidth, height: nextHeight } }));
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", finish, { once: true });
    window.addEventListener("pointercancel", finish, { once: true });
  }, [bringToFront, frames]);

  const reset = () => {
    setFrames(DEFAULTS);
    localStorage.removeItem(STORAGE_KEY);
  };

  const renderWindow = (
    id: WindowId,
    title: string,
    content: React.ReactNode,
    className: string
  ) => (
    <div
      ref={(node) => { windowRefs.current[id] = node; }}
      className={`desktop-window ${className}`}
      style={{
        left: frames[id].x,
        top: frames[id].y,
        width: frames[id].width,
        height: frames[id].height,
        zIndex: frames[id].z,
      }}
      onPointerDown={() => bringToFront(id)}
    >
      <div className="desktop-window-dragbar" onPointerDown={(event) => startDrag(id, event)}>
        <span className="desktop-window-dot" />
        <span>{title}</span>
        <span className="desktop-drag-hint">drag</span>
      </div>
      <div className="desktop-window-body">{content}</div>
      <button
        className="desktop-resize-handle"
        aria-label={`Redimensionner ${title}`}
        onPointerDown={(event) => startResize(id, event)}
      />
    </div>
  );

  return (
    <div ref={desktopRef} className="desktop-workspace hidden lg:block">
      <button type="button" className="desktop-reset" onClick={reset}>
        <RotateCcw className="h-4 w-4" />
        <span>Reset layout</span>
      </button>

      {renderWindow("explorer", "Explorer", <Sidebar embedded />, "explorer-window")}
      {renderWindow("editor", "FULLCLEAR // COMMAND CENTER", <EditorChrome>{children}</EditorChrome>, "editor-window")}
    </div>
  );
}
