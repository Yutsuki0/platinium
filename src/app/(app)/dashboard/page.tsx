import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  Award,
  CheckCircle2,
  Clock3,
  Gamepad2,
  History,
  Target,
  Trophy,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { readStore } from "@/lib/json/store";
import { SyncButton } from "@/components/dashboard/SyncButton";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { formatPlaytime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const store = await readStore();

  const profile = store.users.find((user) => user.id === userId) ?? null;
  const games = store.games.filter((game) => game.userId === userId);
  const summaries = store.achievementSummaries.filter((item) => item.userId === userId);
  const achievements = store.achievements.filter((item) => item.userId === userId);
  const lastSync = store.syncLogs
    .filter((log) => log.userId === userId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null;

  const gameByAppId = new Map(games.map((game) => [game.appId, game]));
  const totalPlaytime = games.reduce((sum, game) => sum + game.playtimeForeverMinutes, 0);
  const totalAchievements = summaries.reduce((sum, summary) => sum + summary.total, 0);
  const unlockedAchievements = summaries.reduce((sum, summary) => sum + summary.unlocked, 0);
  const remainingAchievements = Math.max(totalAchievements - unlockedAchievements, 0);
  const globalPercentage = totalAchievements > 0
    ? Math.round((unlockedAchievements / totalAchievements) * 100)
    : 0;
  const completedGames = summaries.filter((summary) => summary.total > 0 && summary.percentage === 100);
  const nearlyCompleted = summaries
    .filter((summary) => summary.percentage >= 70 && summary.percentage < 100)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 6);
  const recentAchievements = achievements
    .filter((achievement) => achievement.achieved && achievement.unlockTime)
    .sort((a, b) => (b.unlockTime ?? 0) - (a.unlockTime ?? 0))
    .slice(0, 8);
  const mostPlayed = [...games]
    .sort((a, b) => b.playtimeForeverMinutes - a.playtimeForeverMinutes)
    .slice(0, 5);

  const monthMap = new Map<string, number>();
  for (const achievement of achievements) {
    if (!achievement.achieved || !achievement.unlockTime) continue;
    const date = new Date(achievement.unlockTime * 1000);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  }

  const monthlyActivity = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, count]) => ({
      month: new Date(`${month}-01`).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      count,
    }));

  const progressDistribution = [
    { name: "0 %", value: summaries.filter((item) => item.percentage === 0).length },
    { name: "1–49 %", value: summaries.filter((item) => item.percentage > 0 && item.percentage < 50).length },
    { name: "50–79 %", value: summaries.filter((item) => item.percentage >= 50 && item.percentage < 80).length },
    { name: "80–99 %", value: summaries.filter((item) => item.percentage >= 80 && item.percentage < 100).length },
    { name: "100 %", value: completedGames.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="glass-panel flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          {profile?.image ? (
            <Image
              src={profile.image}
              alt={profile.name}
              width={60}
              height={60}
              className="rounded-xl border border-white/10"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Gamepad2 className="h-6 w-6 text-steam" />
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-steam">Tableau de bord</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-white">
              Bonjour {profile?.name ?? session?.user?.name ?? "joueur"}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {lastSync
                ? `Dernière synchronisation : ${new Date(lastSync.startedAt).toLocaleString("fr-FR")}`
                : "Aucune synchronisation effectuée pour le moment."}
            </p>
          </div>
        </div>
        <SyncButton />
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<Gamepad2 />} value={String(games.length)} label="Jeux synchronisés" />
        <Stat icon={<Trophy />} value={unlockedAchievements.toLocaleString("fr-FR")} label="Succès obtenus" />
        <Stat icon={<Target />} value={remainingAchievements.toLocaleString("fr-FR")} label="Succès restants" />
        <Stat icon={<Award />} value={String(completedGames.length)} label="Jeux terminés à 100 %" />
      </section>

      <section className="glass-panel p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-steam">Progression globale</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-white">
              {unlockedAchievements.toLocaleString("fr-FR")} succès sur {totalAchievements.toLocaleString("fr-FR")}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Les statistiques utilisent uniquement les jeux dont les succès ont déjà été analysés.
            </p>
          </div>
          <span className="font-mono text-4xl font-bold text-white">{globalPercentage}%</span>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-steam transition-all" style={{ width: `${globalPercentage}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
          <span>{summaries.length} jeux analysés</span>
          <span>{formatPlaytime(totalPlaytime)} de jeu au total</span>
          <span>{lastSync?.status ? `Dernière synchro : ${lastSync.status}` : "Pas encore synchronisé"}</span>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="glass-panel p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-steam">À terminer</p>
              <h2 className="mt-1 font-display text-lg font-semibold text-white">Jeux proches du 100 %</h2>
            </div>
            <Link href="/games" className="text-xs text-slate-400 transition hover:text-white">Voir tous</Link>
          </div>

          {nearlyCompleted.length === 0 ? (
            <EmptyState text="Aucun jeu entre 70 % et 99 % pour le moment." />
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {nearlyCompleted.map((summary) => {
                const game = gameByAppId.get(summary.appId);
                if (!game) return null;
                return (
                  <Link
                    href={`/games/${game.appId}`}
                    key={game.appId}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 transition hover:border-steam/30 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-3">
                      <GameIcon appId={game.appId} name={game.name} iconUrl={game.iconUrl} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-medium text-white">{game.name}</p>
                          <span className="font-mono text-xs font-bold text-steam">{summary.percentage}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div className="h-full rounded-full bg-steam" style={{ width: `${summary.percentage}%` }} />
                        </div>
                        <p className="mt-1.5 text-[11px] text-slate-500">
                          {summary.total - summary.unlocked} succès restant{summary.total - summary.unlocked > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="glass-panel p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-steam">Activité récente</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-white">Derniers succès débloqués</h2>
          </div>

          {recentAchievements.length === 0 ? (
            <EmptyState text="Aucun succès récent enregistré. Resynchronise les succès de tes jeux." />
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {recentAchievements.map((achievement) => {
                const game = gameByAppId.get(achievement.appId);
                return (
                  <Link
                    href={`/games/${achievement.appId}`}
                    key={`${achievement.appId}-${achievement.apiName}`}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 transition hover:border-steam/30"
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/5">
                      {achievement.iconUrl ? (
                        <Image src={achievement.iconUrl} alt="" fill sizes="44px" className="object-cover" unoptimized />
                      ) : (
                        <Trophy className="absolute inset-0 m-auto h-5 w-5 text-steam" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{achievement.displayName}</p>
                      <p className="truncate text-xs text-slate-500">{game?.name ?? `Jeu ${achievement.appId}`}</p>
                    </div>
                    <time className="shrink-0 text-right text-[10px] text-slate-600">
                      {new Date((achievement.unlockTime ?? 0) * 1000).toLocaleDateString("fr-FR")}
                    </time>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <DashboardCharts monthly={monthlyActivity} distribution={progressDistribution} />

      <section className="glass-panel p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-steam">Bibliothèque</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-white">Tes jeux les plus joués</h2>
          </div>
          <Clock3 className="h-5 w-5 text-steam" />
        </div>
        {mostPlayed.length === 0 ? (
          <EmptyState text="Synchronise ton compte Steam pour afficher ta bibliothèque." />
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {mostPlayed.map((game) => (
              <Link
                href={`/games/${game.appId}`}
                key={game.appId}
                className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025] transition hover:-translate-y-0.5 hover:border-steam/30"
              >
                <div className="relative aspect-[460/215] bg-white/5">
                  <Image
                    src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appId}/header.jpg`}
                    alt={game.name}
                    fill
                    sizes="240px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-3">
                  <p className="truncate text-xs font-medium text-white">{game.name}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{formatPlaytime(game.playtimeForeverMinutes)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactElement; value: string; label: string }) {
  return (
    <div className="glass-panel flex items-center gap-4 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-steam/10 text-steam [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>
      <div>
        <p className="font-mono text-2xl font-bold text-white">{value}</p>
        <p className="mt-0.5 text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function GameIcon({ appId, name, iconUrl }: { appId: number; name: string; iconUrl: string | null }) {
  return (
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
      {iconUrl ? (
        <Image src={iconUrl} alt={name} fill sizes="44px" className="object-cover" />
      ) : (
        <Image
          src={`https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`}
          alt={name}
          fill
          sizes="44px"
          className="object-cover"
          unoptimized
        />
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-4 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.015] p-5 text-center">
      <p className="max-w-md text-sm text-slate-500">{text}</p>
    </div>
  );
}
