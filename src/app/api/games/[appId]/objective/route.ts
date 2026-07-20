import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGameForUser, updateStore } from "@/lib/json/store";

export async function PUT(request: Request, { params }: { params: { appId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const appId = Number(params.appId);
  if (!Number.isInteger(appId) || appId <= 0) return NextResponse.json({ error: "Jeu invalide" }, { status: 400 });
  const game = await getGameForUser(session.user.id, appId);
  if (!game) return NextResponse.json({ error: "Jeu introuvable" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const status = ["ACTIVE", "PAUSED", "COMPLETED"].includes(body.status) ? body.status : "ACTIVE";
  const priority = ["LOW", "MEDIUM", "HIGH"].includes(body.priority) ? body.priority : "MEDIUM";
  const targetDate = typeof body.targetDate === "string" && body.targetDate ? body.targetDate : null;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";
  const now = new Date().toISOString();

  await updateStore((store) => {
    const index = store.gameObjectives.findIndex((item) => item.userId === session.user.id && item.appId === appId);
    const next = { userId: session.user.id, appId, status, priority, targetDate, note, createdAt: index >= 0 ? store.gameObjectives[index].createdAt : now, updatedAt: now };
    if (index >= 0) store.gameObjectives[index] = next;
    else store.gameObjectives.push(next);
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: { appId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const appId = Number(params.appId);
  await updateStore((store) => {
    store.gameObjectives = store.gameObjectives.filter((item) => !(item.userId === session.user.id && item.appId === appId));
  });
  return NextResponse.json({ ok: true });
}
