"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Award, Gamepad2, Target, Trophy } from "lucide-react";

type Stats = { games: number; unlocked: number; remaining: number; completed: number; percentage: number };

export function DesktopStatsWidget() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/desktop/stats", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => { if (!cancelled && payload) setStats(payload); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const cards = [
    { label: "Jeux", value: stats?.games ?? "—", icon: Gamepad2 },
    { label: "Succès", value: stats?.unlocked ?? "—", icon: Trophy },
    { label: "Restants", value: stats?.remaining ?? "—", icon: Target },
    { label: "100 %", value: stats?.completed ?? "—", icon: Award },
  ];

  return (
    <div className="desktop-stats-widget">
      <div className="desktop-stats-grid">
        {cards.map(({ label, value, icon: Icon }) => (
          <div className="desktop-stat-cell" key={label}>
            <Icon className="h-4 w-4" />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="desktop-progress-line"><span style={{ width: `${stats?.percentage ?? 0}%` }} /></div>
      <div className="desktop-stats-footer"><span>Progression globale</span><strong>{stats?.percentage ?? 0}%</strong></div>
      <Link href="/statistics" className="desktop-widget-link">Ouvrir statistics.sql →</Link>
    </div>
  );
}
