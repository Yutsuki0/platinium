import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGameForUser, updateStore } from "@/lib/json/store";

export async function POST(
  _request: Request,
  { params }: { params: { appId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const appId = Number(params.appId);
  if (!Number.isInteger(appId) || appId <= 0) {
    return NextResponse.json({ error: "Jeu invalide" }, { status: 400 });
  }

  const game = await getGameForUser(session.user.id, appId);
  if (!game) {
    return NextResponse.json({ error: "Jeu introuvable" }, { status: 404 });
  }

  let favorite = false;
  await updateStore((store) => {
    const index = store.favoriteGames.findIndex(
      (item) => item.userId === session.user.id && item.appId === appId
    );

    if (index >= 0) {
      store.favoriteGames.splice(index, 1);
      favorite = false;
    } else {
      store.favoriteGames.push({
        userId: session.user.id,
        appId,
        createdAt: new Date().toISOString(),
      });
      favorite = true;
    }
  });

  return NextResponse.json({ ok: true, favorite });
}
