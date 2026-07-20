import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGameAchievements } from "@/lib/steam/achievements";
import { getGameForUser, updateStore } from "@/lib/json/store";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: { appId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.steamId64) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const appId = Number(params.appId);
  if (!Number.isInteger(appId) || appId <= 0) {
    return NextResponse.json({ error: "Identifiant de jeu invalide" }, { status: 400 });
  }

  const game = await getGameForUser(session.user.id, appId);
  if (!game) {
    return NextResponse.json({ error: "Jeu introuvable dans ta bibliothèque" }, { status: 404 });
  }

  try {
    const result = await getGameAchievements(session.user.steamId64, appId);
    const now = new Date().toISOString();
    const unlocked = result.achievements.filter((achievement) => achievement.achieved).length;
    const total = result.achievements.length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

    await updateStore((store) => {
      store.achievements = store.achievements.filter(
        (achievement) => !(achievement.userId === session.user.id && achievement.appId === appId)
      );
      store.achievements.push(
        ...result.achievements.map((achievement) => ({
          userId: session.user.id,
          appId,
          ...achievement,
          lastSyncedAt: now,
        }))
      );

      store.achievementSummaries = store.achievementSummaries.filter(
        (summary) => !(summary.userId === session.user.id && summary.appId === appId)
      );
      store.achievementSummaries.push({
        userId: session.user.id,
        appId,
        total,
        unlocked,
        percentage,
        lastSyncedAt: now,
      });
    });

    return NextResponse.json({ ok: true, total, unlocked, percentage });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur Steam inconnue";
    return NextResponse.json(
      { error: `Impossible de récupérer les succès : ${message}` },
      { status: 502 }
    );
  }
}
