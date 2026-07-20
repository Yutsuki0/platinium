import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readStore } from "@/lib/json/store";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const userId = session.user.id;
  const store = await readStore();
  const payload = {
    exportedAt: new Date().toISOString(),
    user: store.users.find((u) => u.id === userId) ?? null,
    games: store.games.filter((x) => x.userId === userId),
    achievements: store.achievements.filter((x) => x.userId === userId),
    achievementSummaries: store.achievementSummaries.filter((x) => x.userId === userId),
    favoriteGames: store.favoriteGames.filter((x) => x.userId === userId),
    gameObjectives: store.gameObjectives.filter((x) => x.userId === userId),
    syncLogs: store.syncLogs.filter((x) => x.userId === userId),
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="platinum-tracker-export-${new Date().toISOString().slice(0,10)}.json"` },
  });
}
