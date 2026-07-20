"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Crosshair, Flame, Route, Target, Trophy, Zap } from "lucide-react";
import { useGameModes } from "@/lib/games/useGameModes";

type HuntEntry = {
  achievement: { appId: number; apiName: string; displayName: string; iconGrayUrl: string | null; iconUrl: string | null };
  game: { appId: number; name: string };
  summary: { total: number; unlocked: number; percentage: number };
  score: number;
};

type ModeFilter = "all" | "solo" | "online" | "mixed";
type HuntState = { mode: ModeFilter; appId: number; apiName: string } | null;
const HUNT_KEY = "platinum-active-hunt-v1";

export function HuntModeClient({ entries }: { entries: HuntEntry[] }) {
  const [selectedMode, setSelectedMode] = useState<ModeFilter>("all");
  const [activeHunt, setActiveHunt] = useState<HuntState>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const appIds = useMemo(() => [...new Set(entries.map((entry) => entry.game.appId))], [entries]);
  const { modes, loading } = useGameModes(appIds);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HUNT_KEY);
      if (stored) setActiveHunt(JSON.parse(stored));
    } catch {}
  }, []);

  const filtered = useMemo(() => entries.filter((entry) => {
    if (selectedMode === "all") return true;
    return (modes[entry.game.appId] ?? "unknown") === selectedMode;
  }), [entries, modes, selectedMode]);

  const activeEntry = useMemo(() => {
    if (!activeHunt) return null;
    return entries.find((entry) => entry.game.appId === activeHunt.appId && entry.achievement.apiName === activeHunt.apiName) ?? null;
  }, [activeHunt, entries]);

  const queue = activeEntry
    ? entries.filter((entry) => entry.game.appId === activeEntry.game.appId).slice(0, 8)
    : filtered.slice(0, 8);

  function launchHunt() {
    const target = filtered[0];
    if (!target) return;
    const next = { mode: selectedMode, appId: target.game.appId, apiName: target.achievement.apiName } satisfies NonNullable<HuntState>;
    setActiveHunt(next);
    setCompletedSteps([]);
    localStorage.setItem(HUNT_KEY, JSON.stringify(next));
  }

  function stopHunt() {
    setActiveHunt(null);
    setCompletedSteps([]);
    localStorage.removeItem(HUNT_KEY);
  }

  const labels: Record<ModeFilter, string> = {
    all: "Tous les jeux",
    solo: "Jeux solo uniquement",
    online: "Jeux en ligne uniquement",
    mixed: "Solo + en ligne uniquement",
  };

  return (
    <div className="space-y-6">
      <header className="code-hero">
        <div>
          <p className="code-kicker">$ platinum --hunt-mode</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">Mode chasse</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">Choisis précisément le type de jeu, puis lance une mission. Le filtre ne change plus seulement l’affichage : il détermine vraiment la chasse créée.</p>
        </div>
        <Crosshair className="h-24 w-24 text-emerald-300/20" />
      </header>

      <section className="terminal-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10px] uppercase tracking-[0.18em] text-emerald-200/45">Type de chasse</span>
          {(Object.entries(labels) as Array<[ModeFilter, string]>).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setSelectedMode(value)} className={`rounded-full border px-3 py-1.5 text-xs transition ${selectedMode === value ? "border-emerald-300/50 bg-emerald-300/15 text-white" : "border-white/10 bg-white/[0.025] text-slate-400 hover:border-emerald-300/25 hover:text-white"}`}>{label}</button>
          ))}
          {loading ? <span className="text-[10px] text-emerald-200/40">Classification Steam…</span> : null}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-400/10 pt-4">
          <p className="text-xs text-slate-400"><strong className="text-white">{filtered.length}</strong> objectif{filtered.length > 1 ? "s" : ""} compatible{filtered.length > 1 ? "s" : ""} avec « {labels[selectedMode]} »</p>
          <button type="button" onClick={launchHunt} disabled={loading || filtered.length === 0} className="cyber-button"><Crosshair className="h-4 w-4" />Lancer cette chasse</button>
        </div>
      </section>

      {activeEntry ? (
        <section className="mission-card overflow-hidden">
          <div className="relative min-h-80 overflow-hidden rounded-[22px]">
            <Image src={`https://cdn.akamai.steamstatic.com/steam/apps/${activeEntry.game.appId}/header.jpg`} alt={activeEntry.game.name} fill unoptimized className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#05070d] via-[#05070d]/90 to-[#05070d]/40" />
            <div className="relative z-10 grid min-h-80 gap-6 p-7 lg:grid-cols-[1.2fr_.8fr]">
              <div className="flex flex-col justify-end">
                <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1 text-xs text-orange-200"><Flame className="h-3.5 w-3.5" />Chasse active · {labels[activeHunt?.mode ?? "all"]}</div>
                <h2 className="text-3xl font-black text-white">{activeEntry.game.name}</h2>
                <p className="mt-2 text-sm text-slate-300">Objectif prioritaire : <strong className="text-white">{activeEntry.achievement.displayName}</strong></p>
                <p className="mt-1 text-xs text-slate-400">{activeEntry.summary.total - activeEntry.summary.unlocked} succès restants • {activeEntry.summary.percentage}% complété</p>
                <div className="mt-5 flex flex-wrap gap-3"><Link href={`/games/${activeEntry.game.appId}`} className="cyber-button"><Zap className="h-4 w-4" />Ouvrir le jeu</Link><button type="button" onClick={stopHunt} className="ghost-button">Abandonner la chasse</button></div>
              </div>
              <div className="hunt-objectives-panel">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[.16em] text-emerald-200/55"><Target className="h-4 w-4" />Objectifs de mission</div>
                {["Consulter la fiche du jeu", `Débloquer « ${activeEntry.achievement.displayName} »`, "Synchroniser Steam pour valider"].map((label, index) => {
                  const done = completedSteps.includes(index);
                  return <button key={label} type="button" onClick={() => setCompletedSteps((current) => done ? current.filter((step) => step !== index) : [...current, index])} className={`hunt-objective ${done ? "done" : ""}`}><CheckCircle2 className="h-4 w-4" /><span>{label}</span></button>;
                })}
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5"><span className="block h-full bg-emerald-400 transition-all" style={{ width: `${(completedSteps.length / 3) * 100}%` }} /></div>
                <p className="mt-2 text-right text-[10px] text-slate-500">{completedSteps.length}/3 étapes cochées</p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="terminal-card p-10 text-center"><Crosshair className="mx-auto h-9 w-9 text-emerald-300/30" /><p className="mt-3 text-white">Aucune chasse active</p><p className="mt-1 text-sm text-slate-500">Sélectionne un type de jeu puis clique sur « Lancer cette chasse ».</p></div>
      )}

      <section className="terminal-card p-5">
        <div className="terminal-title"><span className="terminal-dot red" /><span className="terminal-dot amber" /><span className="terminal-dot green" /><span className="ml-3">queue/recommended-achievements.json</span></div>
        <div className="mt-5 grid gap-3">
          {queue.map(({ achievement, game, summary }, index) => (
            <Link key={`${achievement.appId}-${achievement.apiName}`} href={`/games/${achievement.appId}`} className="code-row group">
              <div className="flex items-center gap-4"><span className="rank-token">{String(index + 1).padStart(2, "0")}</span><div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-white/5">{achievement.iconGrayUrl || achievement.iconUrl ? <Image src={achievement.iconGrayUrl || achievement.iconUrl!} alt="" fill unoptimized className="object-cover opacity-80" /> : <Trophy className="absolute inset-0 m-auto h-5 w-5 text-slate-500" />}</div><div><p className="text-sm font-semibold text-white">{achievement.displayName}</p><p className="mt-1 text-xs text-slate-500">{game.name} • {summary.percentage}% • {modes[game.appId] === "mixed" ? "Solo + en ligne" : modes[game.appId] === "online" ? "En ligne" : modes[game.appId] === "solo" ? "Solo" : "Non classé"}</p></div></div><Route className="h-4 w-4 text-slate-600 transition group-hover:text-emerald-300" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
