"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Trophy, LockKeyhole, CheckCircle2 } from "lucide-react";
import type { StoredAchievement, StoredGame } from "@/lib/json/store";

type Filter = "all" | "unlocked" | "locked" | "hidden";
type Sort = "recent" | "game" | "name";

export function GlobalAchievementsExplorer({ achievements, games }: { achievements: StoredAchievement[]; games: StoredGame[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const gameById = useMemo(() => new Map(games.map((game) => [game.appId, game])), [games]);

  const counts = useMemo(() => ({
    all: achievements.length,
    unlocked: achievements.filter((a) => a.achieved).length,
    locked: achievements.filter((a) => !a.achieved).length,
    hidden: achievements.filter((a) => a.hidden).length,
  }), [achievements]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr-FR");
    return achievements
      .filter((achievement) => {
        if (filter === "unlocked" && !achievement.achieved) return false;
        if (filter === "locked" && achievement.achieved) return false;
        if (filter === "hidden" && !achievement.hidden) return false;
        const game = gameById.get(achievement.appId);
        return !normalized || `${achievement.displayName} ${achievement.description ?? ""} ${game?.name ?? ""}`.toLocaleLowerCase("fr-FR").includes(normalized);
      })
      .sort((a, b) => {
        if (sort === "name") return a.displayName.localeCompare(b.displayName, "fr");
        if (sort === "game") return (gameById.get(a.appId)?.name ?? "").localeCompare(gameById.get(b.appId)?.name ?? "", "fr");
        return (b.unlockTime ?? 0) - (a.unlockTime ?? 0);
      });
  }, [achievements, filter, gameById, query, sort]);

  return (
    <div className="flex flex-col gap-5">
      <div className="glass-panel grid gap-3 p-4 md:grid-cols-[1fr_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un succès ou un jeu…" className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-steam/50" />
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-xl border border-white/10 bg-[#06130b] px-4 py-3 text-sm text-slate-200 outline-none">
          <option value="recent">Plus récents</option><option value="game">Par jeu</option><option value="name">Par nom</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "unlocked", "locked", "hidden"] as Filter[]).map((value) => {
          const labels = { all: "Tous", unlocked: "Débloqués", locked: "Verrouillés", hidden: "Cachés" };
          return <button key={value} onClick={() => setFilter(value)} className={`rounded-full border px-4 py-2 text-xs transition ${filter === value ? "border-steam/40 bg-steam/15 text-steam" : "border-white/10 bg-white/[0.025] text-slate-400 hover:text-white"}`}>{labels[value]} · {counts[value]}</button>;
        })}
      </div>

      {visible.length === 0 ? <div className="glass-panel p-10 text-center text-sm text-slate-500">Aucun succès ne correspond à ces filtres.</div> : (
        <div className="grid gap-3 xl:grid-cols-2">
          {visible.map((achievement) => {
            const game = gameById.get(achievement.appId);
            return (
              <Link href={`/games/${achievement.appId}`} key={`${achievement.appId}-${achievement.apiName}`} className="glass-panel flex gap-4 p-4 transition hover:border-steam/30">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  {achievement.iconUrl || achievement.iconGrayUrl ? <Image src={(achievement.achieved ? achievement.iconUrl : achievement.iconGrayUrl) ?? achievement.iconUrl!} alt="" fill sizes="56px" className={`object-cover ${achievement.achieved ? "" : "opacity-55 grayscale"}`} unoptimized /> : <Trophy className="absolute inset-0 m-auto h-6 w-6 text-slate-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3"><h2 className="font-medium text-white">{achievement.displayName}</h2>{achievement.achieved ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <LockKeyhole className="h-4 w-4 shrink-0 text-slate-600" />}</div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{achievement.description || (achievement.hidden ? "Description masquée par Steam." : "Aucune description fournie.")}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600"><span>{game?.name ?? `Jeu ${achievement.appId}`}</span>{achievement.hidden && <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-amber-300">Caché</span>}{achievement.unlockTime && <time>{new Date(achievement.unlockTime * 1000).toLocaleDateString("fr-FR")}</time>}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
