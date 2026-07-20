"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Crosshair, Flame, Route, Trophy, Zap } from "lucide-react";
import { useGameModes } from "@/lib/games/useGameModes";

type HuntEntry = {
  achievement: {
    appId: number;
    apiName: string;
    displayName: string;
    iconGrayUrl: string | null;
    iconUrl: string | null;
  };
  game: { appId: number; name: string };
  summary: { total: number; unlocked: number; percentage: number };
  score: number;
};

type ModeFilter = "all" | "solo" | "online";

export function HuntModeClient({ entries }: { entries: HuntEntry[] }) {
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const appIds = useMemo(() => [...new Set(entries.map((entry) => entry.game.appId))], [entries]);
  const { modes, loading } = useGameModes(appIds);
  const ranked = useMemo(
    () => entries.filter((entry) => {
      const mode = modes[entry.game.appId] ?? "unknown";
      if (modeFilter === "solo") return mode === "solo" || mode === "mixed";
      if (modeFilter === "online") return mode === "online" || mode === "mixed";
      return true;
    }).slice(0, 8),
    [entries, modeFilter, modes]
  );
  const focus = ranked[0];

  return (
    <div className="space-y-6">
      <header className="code-hero">
        <div>
          <p className="code-kicker">$ platinum --hunt-mode</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">Mode chasse</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">Une file d’action calculée à partir de ta progression réelle : commencer par les succès visibles et les jeux les plus proches du 100 %.</p>
        </div>
        <Crosshair className="h-24 w-24 text-emerald-300/20" />
      </header>

      <section className="terminal-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10px] uppercase tracking-[0.18em] text-emerald-200/45">Type de chasse</span>
          {([[
            "all", "Tous les jeux"
          ], ["solo", "Jeux solo"], ["online", "Jeux en ligne"]] as Array<[ModeFilter, string]>).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setModeFilter(value)} className={`rounded-full border px-3 py-1.5 text-xs transition ${modeFilter === value ? "border-emerald-300/50 bg-emerald-300/15 text-white" : "border-white/10 bg-white/[0.025] text-slate-400 hover:border-emerald-300/25 hover:text-white"}`}>
              {label}
            </button>
          ))}
          {loading ? <span className="text-[10px] text-emerald-200/40">Classification Steam…</span> : null}
        </div>
      </section>

      {focus ? (
        <section className="mission-card">
          <div className="relative min-h-72 overflow-hidden rounded-[22px]">
            <Image src={`https://cdn.akamai.steamstatic.com/steam/apps/${focus.game.appId}/header.jpg`} alt={focus.game.name} fill unoptimized className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#05070d] via-[#05070d]/85 to-transparent" />
            <div className="relative z-10 flex min-h-72 max-w-2xl flex-col justify-end p-7">
              <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1 text-xs text-orange-200"><Flame className="h-3.5 w-3.5" />Mission prioritaire</div>
              <h2 className="text-3xl font-black text-white">{focus.game.name}</h2>
              <p className="mt-2 text-sm text-slate-300">{focus.summary.total - focus.summary.unlocked} succès à terminer • {focus.summary.percentage}% complété</p>
              <Link href={`/games/${focus.game.appId}`} className="cyber-button mt-5 w-fit"><Zap className="h-4 w-4" />Lancer la chasse</Link>
            </div>
          </div>
        </section>
      ) : (
        <div className="terminal-card p-10 text-center text-slate-400">Aucun jeu ne correspond à ce mode. Essaie un autre filtre.</div>
      )}

      <section className="terminal-card p-5">
        <div className="terminal-title"><span className="terminal-dot red" /><span className="terminal-dot amber" /><span className="terminal-dot green" /><span className="ml-3">queue/recommended-achievements.json</span></div>
        <div className="mt-5 grid gap-3">
          {ranked.map(({ achievement, game, summary }, index) => (
            <Link key={`${achievement.appId}-${achievement.apiName}`} href={`/games/${achievement.appId}`} className="code-row group">
              <div className="flex items-center gap-4">
                <span className="rank-token">{String(index + 1).padStart(2, "0")}</span>
                <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  {achievement.iconGrayUrl || achievement.iconUrl ? <Image src={achievement.iconGrayUrl || achievement.iconUrl!} alt="" fill unoptimized className="object-cover opacity-80" /> : <Trophy className="absolute inset-0 m-auto h-5 w-5 text-slate-500" />}
                </div>
                <div><p className="text-sm font-semibold text-white">{achievement.displayName}</p><p className="mt-1 text-xs text-slate-500">{game.name} • {summary.percentage}%</p></div>
              </div>
              <Route className="h-4 w-4 text-slate-600 transition group-hover:text-emerald-300" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
