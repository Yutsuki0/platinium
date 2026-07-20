"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Lock,
  Search,
  SlidersHorizontal,
  Trophy,
} from "lucide-react";
import type { StoredAchievement } from "@/lib/json/store";

type FilterMode = "all" | "locked" | "unlocked" | "hidden";
type SortMode = "locked-first" | "name" | "unlock-date";

export function AchievementsExplorer({ achievements }: { achievements: StoredAchievement[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortMode>("locked-first");

  const counts = useMemo(
    () => ({
      all: achievements.length,
      locked: achievements.filter((item) => !item.achieved).length,
      unlocked: achievements.filter((item) => item.achieved).length,
      hidden: achievements.filter((item) => item.hidden).length,
    }),
    [achievements]
  );

  const visibleAchievements = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("fr-FR");

    return [...achievements]
      .filter((achievement) => {
        if (filter === "locked") return !achievement.achieved;
        if (filter === "unlocked") return achievement.achieved;
        if (filter === "hidden") return achievement.hidden;
        return true;
      })
      .filter((achievement) => {
        if (!normalizedSearch) return true;
        return `${achievement.displayName} ${achievement.description ?? ""}`
          .toLocaleLowerCase("fr-FR")
          .includes(normalizedSearch);
      })
      .sort((a, b) => {
        if (sort === "name") return a.displayName.localeCompare(b.displayName, "fr");
        if (sort === "unlock-date") {
          if (a.achieved !== b.achieved) return a.achieved ? -1 : 1;
          return (b.unlockTime ?? 0) - (a.unlockTime ?? 0);
        }
        if (a.achieved !== b.achieved) return a.achieved ? 1 : -1;
        return a.displayName.localeCompare(b.displayName, "fr");
      });
  }, [achievements, filter, search, sort]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 px-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Tous les succès</h2>
          <p className="mt-1 text-sm text-slate-500">
            Noms et descriptions officiels Steam en français lorsqu’ils sont disponibles.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          {visibleAchievements.length} résultat{visibleAchievements.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="glass-panel flex flex-col gap-3 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un succès…"
              className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.035] pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-steam/50 focus:bg-white/[0.055]"
            />
          </label>

          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortMode)}
              className="h-11 w-full appearance-none rounded-lg border border-white/10 bg-[#06130b] pl-10 pr-3 text-sm text-slate-200 outline-none focus:border-steam/50"
            >
              <option value="locked-first">Manquants en premier</option>
              <option value="name">Nom A → Z</option>
              <option value="unlock-date">Déblocage récent</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
            Tous · {counts.all}
          </FilterButton>
          <FilterButton active={filter === "locked"} onClick={() => setFilter("locked")}>
            À débloquer · {counts.locked}
          </FilterButton>
          <FilterButton active={filter === "unlocked"} onClick={() => setFilter("unlocked")}>
            Obtenus · {counts.unlocked}
          </FilterButton>
          <FilterButton active={filter === "hidden"} onClick={() => setFilter("hidden")}>
            Cachés · {counts.hidden}
          </FilterButton>
        </div>
      </div>

      {visibleAchievements.length === 0 ? (
        <div className="glass-panel flex min-h-48 flex-col items-center justify-center p-8 text-center">
          <Trophy className="h-8 w-8 text-slate-600" />
          <p className="mt-3 font-display text-base font-semibold text-white">Aucun succès trouvé</p>
          <p className="mt-1 text-sm text-slate-500">Modifie la recherche ou le filtre.</p>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {visibleAchievements.map((achievement) => (
            <article
              key={achievement.apiName}
              className={`glass-panel flex gap-4 p-4 transition ${achievement.achieved ? "opacity-75" : "hover:border-steam/25"}`}
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                {(achievement.achieved ? achievement.iconUrl : achievement.iconGrayUrl) ? (
                  <Image
                    src={(achievement.achieved ? achievement.iconUrl : achievement.iconGrayUrl)!}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <Trophy className="absolute inset-0 m-auto h-6 w-6 text-slate-600" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-semibold text-white">
                      {achievement.displayName}
                    </h3>
                    {achievement.hidden && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                        <Lock className="h-3 w-3" /> Succès caché
                      </span>
                    )}
                  </div>
                  {achievement.achieved ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  ) : (
                    <Trophy className="h-5 w-5 shrink-0 text-steam" />
                  )}
                </div>

                <p className="mt-2 text-sm leading-5 text-slate-400">
                  {achievement.description || "Steam ne fournit aucune description pour ce succès."}
                </p>

                {achievement.achieved && achievement.unlockTime && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-600">
                    <Clock3 className="h-3.5 w-3.5" />
                    Obtenu le {new Date(achievement.unlockTime * 1000).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
        active
          ? "border-steam/50 bg-steam/15 text-white"
          : "border-white/10 bg-white/[0.025] text-slate-400 hover:border-white/20 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
