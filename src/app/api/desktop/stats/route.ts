import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readStore } from "@/lib/json/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const store = await readStore();
  const userId = session.user.id;
  const games = store.games.filter((game) => game.userId === userId);
  const summaries = store.achievementSummaries.filter((summary) => summary.userId === userId);
  const total = summaries.reduce((sum, summary) => sum + summary.total, 0);
  const unlocked = summaries.reduce((sum, summary) => sum + summary.unlocked, 0);
  const completed = summaries.filter((summary) => summary.total > 0 && summary.percentage === 100).length;

  return NextResponse.json({
    games: games.length,
    unlocked,
    remaining: Math.max(total - unlocked, 0),
    completed,
    percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
  });
}
