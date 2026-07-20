import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readStore, updateStore } from "@/lib/json/store";
import { buildProfileView, ensureProfile } from "@/lib/fullclear/progression";
import { BADGES, computeUnlockedBadgeIds } from "@/lib/fullclear/badges";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  await updateStore((store) => { ensureProfile(store, session.user.id); });
  const store = await readStore();
  const view = buildProfileView(store, session.user.id);
  const unlocked = computeUnlockedBadgeIds(store, session.user.id);
  return NextResponse.json({ ...view, badges: BADGES.map(([id,name,description]) => ({ id,name,description,unlocked:unlocked.has(id), icon:`/fullclear/badges/${id}.svg` })) });
}
