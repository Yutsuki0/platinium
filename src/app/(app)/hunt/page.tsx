import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readStore } from "@/lib/json/store";
import { HuntModeClient } from "@/components/games/HuntModeClient";

export const dynamic = "force-dynamic";

export default async function HuntPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const store = await readStore();
  const games = new Map(store.games.filter((game) => game.userId === userId).map((game) => [game.appId, game]));
  const summaries = new Map(store.achievementSummaries.filter((summary) => summary.userId === userId).map((summary) => [summary.appId, summary]));

  const entries = store.achievements
    .filter((achievement) => achievement.userId === userId && !achievement.achieved)
    .map((achievement) => {
      const summary = summaries.get(achievement.appId);
      const game = games.get(achievement.appId);
      const remaining = summary ? Math.max(summary.total - summary.unlocked, 0) : 999;
      let score = 0;
      if (!achievement.hidden) score += 30;
      if (achievement.description) score += 10;
      if (summary) score += summary.percentage;
      score += Math.max(0, 25 - remaining);
      return { achievement, summary, game, score };
    })
    .filter((entry): entry is typeof entry & { game: NonNullable<typeof entry.game>; summary: NonNullable<typeof entry.summary> } => Boolean(entry.game && entry.summary))
    .sort((a, b) => b.score - a.score)
    .map(({ achievement, game, summary, score }) => ({
      achievement: {
        appId: achievement.appId,
        apiName: achievement.apiName,
        displayName: achievement.displayName,
        iconGrayUrl: achievement.iconGrayUrl,
        iconUrl: achievement.iconUrl,
      },
      game: { appId: game.appId, name: game.name },
      summary: { total: summary.total, unlocked: summary.unlocked, percentage: summary.percentage },
      score,
    }));

  return <HuntModeClient entries={entries} />;
}
