"use client";

import { useEffect, useRef } from "react";

const STORAGE_KEY = "platinum-inner-panel-layout-v2";

type SavedBox = { x: number; y: number; width: number; height: number };

export function FreeformCanvas({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const root = canvas.firstElementChild as HTMLElement | null;
    if (!root) return;
    const items = Array.from(root.children).filter((node): node is HTMLElement => node instanceof HTMLElement);
    if (items.length < 2) return;

    root.classList.add("freeform-root");
    let saved: Record<string, SavedBox> = {};
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch {}

    const columns = root.clientWidth > 1000 ? 2 : 1;
    let nextY = 12;
    const listeners: Array<() => void> = [];

    items.forEach((item, index) => {
      const key = `${location.pathname}:${index}`;
      item.classList.add("freeform-item");
      item.dataset.freeformKey = key;
      const previous = saved[key];
      const defaultWidth = columns === 2 && index > 0 ? Math.max(360, (root.clientWidth - 42) / 2) : Math.max(420, root.clientWidth - 24);
      const x = previous?.x ?? (columns === 2 && index > 0 ? 12 + ((index - 1) % 2) * (defaultWidth + 18) : 12);
      const y = previous?.y ?? (index === 0 ? 12 : 150 + Math.floor((index - 1) / columns) * 330);
      Object.assign(item.style, {
        left: `${x}px`, top: `${y}px`, width: `${previous?.width ?? defaultWidth}px`,
        height: previous?.height ? `${previous.height}px` : "auto",
      });
      nextY = Math.max(nextY, y + (previous?.height ?? 300) + 40);

      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = "freeform-handle";
      handle.setAttribute("aria-label", "Déplacer ce panneau");
      handle.innerHTML = "<span></span><span></span><span></span><span></span><span></span><span></span>";
      item.appendChild(handle);

      const save = () => {
        const current: Record<string, SavedBox> = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; } })();
        current[key] = { x: item.offsetLeft, y: item.offsetTop, width: item.offsetWidth, height: item.offsetHeight };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        root.style.minHeight = `${Math.max(700, ...items.map((el) => el.offsetTop + el.offsetHeight + 40))}px`;
      };

      const onPointerDown = (event: PointerEvent) => {
        event.preventDefault();
        const startX = event.clientX, startY = event.clientY;
        const startLeft = item.offsetLeft, startTop = item.offsetTop;
        item.classList.add("is-moving");
        const onMove = (move: PointerEvent) => {
          item.style.left = `${Math.max(0, startLeft + move.clientX - startX)}px`;
          item.style.top = `${Math.max(0, startTop + move.clientY - startY)}px`;
        };
        const onUp = () => {
          item.classList.remove("is-moving"); save();
          window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
      };
      handle.addEventListener("pointerdown", onPointerDown);
      const observer = new ResizeObserver(save); observer.observe(item);
      listeners.push(() => { handle.removeEventListener("pointerdown", onPointerDown); observer.disconnect(); handle.remove(); });
    });
    root.style.minHeight = `${Math.max(700, nextY)}px`;

    const reset = () => location.reload();
    window.addEventListener("platinum-reset-inner-layout", reset);
    return () => { listeners.forEach((dispose) => dispose()); window.removeEventListener("platinum-reset-inner-layout", reset); };
  }, []);

  return <div ref={ref} className="freeform-canvas">{children}</div>;
}
