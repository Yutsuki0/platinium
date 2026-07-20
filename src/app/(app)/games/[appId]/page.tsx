import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, Clock3, Trophy } from "lucide-react";
import { authOptions } from "@/lib/auth";
import {
  getAchievementsForGame,
  getAchievementSummaryForGame,
  getGameForUser,
  getGameObjective,
  getResearchForGame,
} from "@/lib/json/store";
import { formatPlaytime } from "@/lib/utils";
import { AchievementSyncButton } from "@/components/games/AchievementSyncButton";
import { AchievementsExplorer } from "@/components/games/AchievementsExplorer";
import { ObjectiveEditor } from "@/components/objectives/ObjectiveEditor";
import { DlcMarketplacePanel } from "@/components/games/DlcMarketplacePanel";

export const dynamic = "force-dynamic";

export default async function GameDetailsPage({ params }: { params: { appId: string } }) {
  const session = await getServerSession(authOptions);
  const appId = Number(params.appId);
  if (!session?.user?.id || !Number.isInteger(appId)) notFound();

  const [game, achievements, summary, objective, research] = await Promise.all([
    getGameForUser(session.user.id, appId),
    getAchievementsForGame(session.user.id, appId),
    getAchievementSummaryForGame(session.user.id, appId),
    getGameObjective(session.user.id, appId),
    getResearchForGame(session.user.id, appId),
  ]);

  if (!game) notFound();



  return (
    <div className="flex flex-col gap-6">
      <Link href="/games" className="inline-flex w-fit items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Retour à mes jeux
      </Link>

      <header className="mission-card overflow-hidden">
        <div className="relative min-h-64">
          <Image
            src={`https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`}
            alt={game.name}
            fill
            priority
            unoptimized
            className="object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#031109] via-[#031109]/85 to-[#031109]/30" />
          <div className="relative flex min-h-64 flex-col justify-end gap-5 p-6 md:flex-row md:items-end md:justify-between md:p-8">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-steam">Fiche du jeu</p>
              <h1 className="mt-2 max-w-3xl font-display text-3xl font-bold text-white md:text-4xl">{game.name}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-steam" />{formatPlaytime(game.playtimeForeverMinutes)}</span>
                {summary && <span className="inline-flex items-center gap-2"><Trophy className="h-4 w-4 text-steam" />{summary.unlocked} / {summary.total} succès</span>}
              </div>
            </div>
            <AchievementSyncButton appId={appId} />
          </div>
        </div>
      </header>

      {summary ? (
        <section className="grid gap-4 md:grid-cols-3">
          <Stat value={`${summary.percentage} %`} label="Progression" />
          <Stat value={`${summary.unlocked}`} label="Succès obtenus" />
          <Stat value={`${Math.max(summary.total - summary.unlocked, 0)}`} label="Succès restants" />
        </section>
      ) : (
        <section className="glass-panel p-6 text-center">
          <Trophy className="mx-auto h-9 w-9 text-steam" />
          <h2 className="mt-3 font-display text-lg font-semibold text-white">Les succès ne sont pas encore analysés</h2>
          <p className="mt-2 text-sm text-slate-400">Clique sur « Analyser les succès ». Ils seront enregistrés dans ton fichier JSON.</p>
        </section>
      )}

      {summary && (
        <section className="glass-panel p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Progression</h2>
              <p className="mt-1 text-sm text-slate-400">{summary.unlocked} succès obtenus sur {summary.total}</p>
            </div>
            <span className="font-mono text-2xl font-bold text-white">{summary.percentage}%</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-steam transition-all" style={{ width: `${summary.percentage}%` }} />
          </div>
        </section>
      )}

      <ObjectiveEditor appId={appId} initialObjective={objective} />

      <DlcMarketplacePanel gameName={game.name} groups={research?.groups ?? []} />

      {achievements.length > 0 && <AchievementsExplorer achievements={achievements} />}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass-panel p-5">
      <p className="font-mono text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}
