import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAchievementSummariesForUser, getFavoriteGameIds, getGamesForUser } from "@/lib/json/store";
import { GamesLibrary } from "@/components/games/GamesLibrary";
import { BulkAchievementSyncButton } from "@/components/games/BulkAchievementSyncButton";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const [games, summaries, favoriteAppIds] = await Promise.all([
    getGamesForUser(userId),
    getAchievementSummariesForUser(userId),
    getFavoriteGameIds(userId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-steam">Bibliothèque Steam</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-white">Mes jeux</h1>
        <p className="mt-2 text-sm text-slate-400">
          Recherche un jeu, consulte ton temps de jeu et analyse tes succès.
        </p>
      </header>

      <BulkAchievementSyncButton
        appIds={games.map((game) => game.appId)}
        alreadySyncedAppIds={summaries.map((summary) => summary.appId)}
      />


      <GamesLibrary games={games} summaries={summaries} initialFavoriteAppIds={favoriteAppIds} />
    </div>
  );
}
