"use client";

import { useEffect, useState } from "react";

export type GameMode = "solo" | "online" | "mixed" | "unknown";
const STORAGE_KEY = "platinum-game-modes-v1";

export function useGameModes(appIds: number[]) {
  const [modes, setModes] = useState<Record<number, GameMode>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!appIds.length) return;
    let cancelled = false;
    let cached: Record<number, GameMode> = {};
    try { cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch {}
    setModes(cached);
    const missing = appIds.filter((appId) => !cached[appId]);
    if (!missing.length) return;

    (async () => {
      setLoading(true);
      const next = { ...cached };
      for (let index = 0; index < missing.length; index += 25) {
        const batch = missing.slice(index, index + 25);
        try {
          const response = await fetch("/api/games/classifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appIds: batch }),
          });
          if (!response.ok) continue;
          const payload = await response.json() as { modes?: Record<string, GameMode> };
          for (const [appId, mode] of Object.entries(payload.modes ?? {})) next[Number(appId)] = mode;
          if (!cancelled) setModes({ ...next });
        } catch {}
      }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [appIds.join(",")]);

  return { modes, loading };
}
