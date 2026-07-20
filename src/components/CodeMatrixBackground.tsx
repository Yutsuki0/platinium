"use client";

import { useEffect, useMemo, useState } from "react";

const SNIPPETS = [
  "await syncLibrary(steamId)",
  "achievement.unlock()",
  "progress += 1",
  "SELECT * FROM trophies",
  "git commit -m '100%'",
  "status: ONLINE",
  "dlc.required === false",
  "cache.write(player)",
  "while (!platinum) grind()",
  "const rarity = 0.7",
  "GET /api/steam/sync 200",
  "player.session.restore()",
  "target = nextAchievement",
  "database.persist(true)",
];

type Line = { id: number; text: string; left: number; top: number; speed: number; opacity: number; size: number };

export function CodeMatrixBackground() {
  const seed = useMemo(() => Array.from({ length: 26 }, (_, id) => ({
    id,
    text: SNIPPETS[id % SNIPPETS.length],
    left: (id * 37) % 96,
    top: (id * 19) % 96,
    speed: 13 + (id % 8) * 2.7,
    opacity: 0.08 + (id % 5) * 0.025,
    size: 10 + (id % 3),
  })), []);
  const [lines, setLines] = useState<Line[]>(seed);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLines((current) => current.map((line, index) => index % 4 === 0 ? {
        ...line,
        text: SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)],
        left: Math.random() * 94,
      } : line));
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="matrix-stage" aria-hidden="true">
      <div className="matrix-grid" />
      <div className="matrix-scan" />
      {lines.map((line) => (
        <span
          key={line.id}
          className="matrix-code-line"
          style={{
            left: `${line.left}%`,
            top: `${line.top}%`,
            opacity: line.opacity,
            fontSize: `${line.size}px`,
            animationDuration: `${line.speed}s`,
            animationDelay: `${-(line.id * 1.7)}s`,
          }}
        >
          <span className="matrix-prompt">&gt;</span> {line.text}
        </span>
      ))}
      <div className="matrix-vignette" />
    </div>
  );
}
