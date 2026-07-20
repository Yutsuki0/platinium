import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { todayKey } from "@/lib/fullclear/hunt";
import { updateStore } from "@/lib/json/store";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { objectiveIds } = await request.json() as { objectiveIds:string[] };
  if (!Array.isArray(objectiveIds) || objectiveIds.length !== 3) return NextResponse.json({ error: "Choisis exactement 3 objectifs." }, { status: 400 });
  let found = false;
  await updateStore((store) => {
    const hunt = store.dailyHunts.find((h) => h.userId === session.user.id && h.dateKey === todayKey());
    if (!hunt || hunt.status !== "DRAFT") return;
    const valid = objectiveIds.every((id) => hunt.objectives.some((o) => o.id === id));
    if (!valid) return;
    hunt.objectives.forEach((o) => { o.selected = objectiveIds.includes(o.id); });
    hunt.status = "ACTIVE";
    found = true;
  });
  return found ? NextResponse.json({ ok:true }) : NextResponse.json({ error:"Hunt introuvable ou déjà démarrée." }, { status:400 });
}
