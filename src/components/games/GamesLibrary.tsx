"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Gamepad2,
  Search,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import type { StoredAchievementSummary, StoredGame } from "@/lib/json/store";
import { formatPlaytime } from "@/lib/utils";
import { useGameModes, type GameMode } from "@/lib/games/useGameModes";

type SortMode =
  | "favorites"
  | "progress-desc"
  | "progress-asc"
  | "playtime-desc"
  | "playtime-asc"
  | "name-asc"
  | "name-desc";
type StatusFilter = "all" | "favorites" | "completed" | "in-progress" | "not-started" | "not-analysed";
type ModeFilter = "all" | "solo" | "online" | "mixed";

export function GamesLibrary({
  games,
  summaries,
  initialFavoriteAppIds,
}: {
  games: StoredGame[];
  summaries: StoredAchievementSummary[];
  initialFavoriteAppIds: number[];
}) {
  const summaryByAppId = useMemo(
    () => new Map(summaries.map((summary) => [summary.appId, summary])),
    [summaries]
  );
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("favorites");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const appIds = useMemo(() => games.map((game) => game.appId), [games]);
  const { modes, loading: modesLoading } = useGameModes(appIds);
  const [favoriteAppIds, setFavoriteAppIds] = useState(() => new Set(initialFavoriteAppIds));
  const [pendingAppId, setPendingAppId] = useState<number | null>(null);

  const stats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let notAnalysed = 0;

    for (const game of games) {
      const summary = summaryByAppId.get(game.appId);
      if (!summary || summary.total === 0) notAnalysed += 1;
      else if (summary.percentage === 100) completed += 1;
      else if (summary.unlocked > 0) inProgress += 1;
      else notStarted += 1;
    }

    return { completed, inProgress, notStarted, notAnalysed };
  }, [games, summaryByAppId]);

  const visibleGames = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("fr-FR");

    return games
      .filter((game) => game.name.toLocaleLowerCase("fr-FR").includes(normalizedSearch))
      .filter((game) => {
        const mode = modes[game.appId] ?? "unknown";
        if (modeFilter !== "all" && mode !== modeFilter) return false;
        const summary = summaryByAppId.get(game.appId);
        if (statusFilter === "favorites") return favoriteAppIds.has(game.appId);
        if (statusFilter === "completed") return summary?.total && summary.percentage === 100;
        if (statusFilter === "in-progress") return !!summary && summary.unlocked > 0 && summary.percentage < 100;
        if (statusFilter === "not-started") return !!summary && summary.total > 0 && summary.unlocked === 0;
        if (statusFilter === "not-analysed") return !summary || summary.total === 0;
        return true;
      })
      .sort((a, b) => {
        const aFavorite = favoriteAppIds.has(a.appId) ? 1 : 0;
        const bFavorite = favoriteAppIds.has(b.appId) ? 1 : 0;
        const aProgress = summaryByAppId.get(a.appId)?.percentage ?? -1;
        const bProgress = summaryByAppId.get(b.appId)?.percentage ?? -1;

        if (sortMode === "favorites") {
          if (bFavorite !== aFavorite) return bFavorite - aFavorite;
          if (bProgress !== aProgress) return bProgress - aProgress;
          return a.name.localeCompare(b.name, "fr");
        }
        if (sortMode === "progress-desc") return bProgress - aProgress;
        if (sortMode === "progress-asc") return aProgress - bProgress;
        if (sortMode === "playtime-desc") return b.playtimeForeverMinutes - a.playtimeForeverMinutes;
        if (sortMode === "playtime-asc") return a.playtimeForeverMinutes - b.playtimeForeverMinutes;
        if (sortMode === "name-desc") return b.name.localeCompare(a.name, "fr");
        return a.name.localeCompare(b.name, "fr");
      });
  }, [favoriteAppIds, games, modeFilter, modes, search, sortMode, statusFilter, summaryByAppId]);

  async function toggleFavorite(appId: number) {
    setPendingAppId(appId);
    const wasFavorite = favoriteAppIds.has(appId);
    setFavoriteAppIds((current) => {
      const next = new Set(current);
      wasFavorite ? next.delete(appId) : next.add(appId);
      return next;
    });

    try {
      const response = await fetch(`/api/games/${appId}/favorite`, { method: "POST" });
      if (!response.ok) throw new Error("Impossible d'enregistrer le favori");
    } catch {
      setFavoriteAppIds((current) => {
        const next = new Set(current);
        wasFavorite ? next.add(appId) : next.delete(appId);
        return next;
      });
    } finally {
      setPendingAppId(null);
    }
  }

  const filterButtons: Array<{ value: StatusFilter; label: string; count: number }> = [
    { value: "all", label: "Tous", count: games.length },
    { value: "favorites", label: "Favoris", count: favoriteAppIds.size },
    { value: "in-progress", label: "En cours", count: stats.inProgress },
    { value: "completed", label: "100 %", count: stats.completed },
    { value: "not-started", label: "À commencer", count: stats.notStarted },
    { value: "not-analysed", label: "Non analysés", count: stats.notAnalysed },
  ];

  return (
    <section className="flex flex-col gap-4">
      <div className="glass-panel flex flex-col gap-4 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_230px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un jeu…"
              className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.035] pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-steam/50 focus:bg-white/[0.055]"
            />
          </label>

          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="h-11 w-full appearance-none rounded-lg border border-white/10 bg-[#06130b] pl-10 pr-3 text-sm text-slate-200 outline-none focus:border-steam/50"
            >
              <option value="favorites">Favoris en premier</option>
              <option value="progress-desc">Progression décroissante</option>
              <option value="progress-asc">Progression croissante</option>
              <option value="playtime-desc">Plus joués</option>
              <option value="playtime-asc">Moins joués</option>
              <option value="name-asc">Nom A → Z</option>
              <option value="name-desc">Nom Z → A</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10px] uppercase tracking-[0.18em] text-emerald-200/45">Progression</span>
          {filterButtons.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                statusFilter === filter.value
                  ? "border-steam/50 bg-steam/15 text-white"
                  : "border-white/10 bg-white/[0.025] text-slate-400 hover:border-white/20 hover:text-white"
              }`}
            >
              {filter.label} <span className="ml-1 text-[10px] opacity-65">{filter.count}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-emerald-400/10 pt-3">
          <span className="mr-1 text-[10px] uppercase tracking-[0.18em] text-emerald-200/45">Type de jeu</span>
          {([
            ["all", "Tous les modes"],
            ["solo", "Jeux solo"],
            ["online", "Jeux en ligne"],
            ["mixed", "Solo + en ligne"],
          ] as Array<[ModeFilter, string]>).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setModeFilter(value)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                modeFilter === value
                  ? "border-emerald-300/50 bg-emerald-300/15 text-white"
                  : "border-white/10 bg-white/[0.025] text-slate-400 hover:border-emerald-300/25 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
          {modesLoading ? <span className="text-[10px] text-emerald-200/40">Analyse Steam en cours…</span> : null}
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-xs text-slate-500">
        <span>{visibleGames.length} résultat{visibleGames.length > 1 ? "s" : ""}</span>
        <span>Étoile un jeu pour le garder en haut</span>
      </div>

      {visibleGames.length === 0 ? (
        <div className="glass-panel flex min-h-56 flex-col items-center justify-center p-8 text-center">
          <Gamepad2 className="h-8 w-8 text-slate-600" />
          <p className="mt-3 font-display text-base font-semibold text-white">Aucun jeu trouvé</p>
          <p className="mt-1 text-sm text-slate-500">Essaie une autre recherche ou modifie le filtre.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleGames.map((game) => {
            const summary = summaryByAppId.get(game.appId);
            const favorite = favoriteAppIds.has(game.appId);
            const completed = summary?.total && summary.percentage === 100;

            return (
              <article
                key={game.appId}
                className="game-card-3d group relative overflow-hidden"
              >
                <button
                  type="button"
                  aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                  title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                  disabled={pendingAppId === game.appId}
                  onClick={() => toggleFavorite(game.appId)}
                  className={`absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full border backdrop-blur transition ${
                    favorite
                      ? "border-amber-300/40 bg-amber-300/20 text-amber-200"
                      : "border-white/15 bg-black/35 text-white/70 hover:bg-black/60 hover:text-white"
                  } disabled:opacity-50`}
                >
                  <Star className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
                </button>

                <Link href={`/games/${game.appId}`} className="block">
                  <div className="relative aspect-[460/215] overflow-hidden bg-white/[0.025]">
                    <Image
                      src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appId}/header.jpg`}
                      alt={game.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.025]"
                      unoptimized
                    />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#04110a] to-transparent" />
                    {completed ? (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-200 backdrop-blur">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Terminé
                      </div>
                    ) : null}
                    {modes[game.appId] && modes[game.appId] !== "unknown" ? (
                      <div className="absolute bottom-3 right-3 rounded-full border border-emerald-300/20 bg-black/50 px-2.5 py-1 text-[10px] uppercase tracking-wide text-emerald-100/80 backdrop-blur">
                        {modes[game.appId] === "solo" ? "Solo" : modes[game.appId] === "online" ? "En ligne" : "Solo + en ligne"}
                      </div>
                    ) : null}
                  </div>

                  <div className="p-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                        {game.iconUrl ? (
                          <Image src={game.iconUrl} alt="" fill sizes="40px" className="object-cover" />
                        ) : (
                          <Gamepad2 className="absolute inset-0 m-auto h-5 w-5 text-slate-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-display text-sm font-semibold text-white" title={game.name}>
                          {game.name}
                        </h2>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock3 className="h-3.5 w-3.5 text-steam" />
                          <span>{formatPlaytime(game.playtimeForeverMinutes)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full ${completed ? "bg-emerald-400/80" : "bg-steam/70"}`}
                        style={{ width: summary ? `${summary.percentage}%` : "0%" }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span>
                        {summary
                          ? `${summary.unlocked} / ${summary.total} succès`
                          : "Succès non analysés"}
                      </span>
                      <span className={completed ? "font-semibold text-emerald-300" : "text-slate-300"}>
                        {summary ? `${summary.percentage}%` : "—"}
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
