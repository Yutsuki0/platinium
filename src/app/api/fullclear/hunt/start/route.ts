import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readStore, updateStore } from "@/lib/json/store";
import { ensureProfile } from "@/lib/fullclear/progression";
import { expireOldHunts, makeDailyHunt, todayKey, type HuntMode } from "@/lib/fullclear/hunt";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { mode?: HuntMode; eligibleAppIds?: number[] };
  const mode = body.mode ?? "all";
  const store = await readStore();
  const dateKey = todayKey();
  const existing = store.dailyHunts.find((h) => h.userId === session.user.id && h.dateKey === dateKey);
  if (existing) return NextResponse.json({ hunt: existing, alreadyExists: true });

  const eligible = new Set((body.eligibleAppIds ?? []).filter(Number.isInteger));
  const summaries = store.achievementSummaries.filter((s) => s.userId === session.user.id && s.total > 0 && s.percentage < 100 && (eligible.size === 0 || eligible.has(s.appId)));
  if (!summaries.length) return NextResponse.json({ error: "Aucun jeu compatible avec ce type de Hunt." }, { status: 400 });
  const summary = summaries[Math.floor(Math.random() * summaries.length)];
  const game = store.games.find((g) => g.userId === session.user.id && g.appId === summary.appId)!;
  const locked = store.achievements.filter((a) => a.userId === session.user.id && a.appId === summary.appId && !a.achieved);
  const target = locked[Math.floor(Math.random() * Math.max(1, locked.length))] ?? null;
  const baselineNames = store.achievements.filter((a) => a.userId === session.user.id && a.appId === summary.appId && a.achieved).map((a) => a.apiName);
  const hunt = makeDailyHunt({ userId:session.user.id, dateKey, appId:summary.appId, apiName:target?.apiName ?? null, mode, baselineUnlocked:summary.unlocked, baselinePercentage:summary.percentage, baselinePlaytimeMinutes:game.playtimeForeverMinutes, baselineAchievementNames:baselineNames, targetName:target?.displayName ?? "un nouveau succès", remaining:Math.max(0, summary.total-summary.unlocked) });
  await updateStore((next) => { expireOldHunts(next, session.user.id, dateKey); ensureProfile(next, session.user.id); next.dailyHunts.push(hunt); });
  return NextResponse.json({ hunt });
}
