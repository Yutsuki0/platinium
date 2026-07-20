"use client";

import { useMemo } from "react";

const SNIPPETS = [
  "await syncLibrary(steamId)",
  "achievement.unlock()",
  "SELECT * FROM trophies",
  "status: ONLINE",
  "while (!platinum) grind()",
  "GET /api/steam/sync 200",
  "target = nextAchievement",
  "database.persist(true)",
];

export function CodeMatrixBackground() {
  const lines = useMemo(() => SNIPPETS.map((text, id) => ({
    id,
    text,
    left: (id * 31) % 91,
    top: (id * 23) % 92,
    opacity: 0.07 + (id % 3) * 0.02,
    size: 10 + (id % 2),
  })), []);

  return (
    <div className="matrix-stage" aria-hidden="true">
      <div className="matrix-grid" />
      {lines.map((line) => (
        <span
          key={line.id}
          className="matrix-code-line"
          style={{
            left: `${line.left}%`,
            top: `${line.top}%`,
            opacity: line.opacity,
            fontSize: `${line.size}px`,
          }}
        >
          <span className="matrix-prompt">&gt;</span> {line.text}
        </span>
      ))}
      <div className="matrix-vignette" />
    </div>
  );
}
