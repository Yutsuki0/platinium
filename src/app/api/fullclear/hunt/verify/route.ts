import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGameAchievements } from "@/lib/steam/achievements";
import { getOwnedGames } from "@/lib/steam/owned-games";
import { readStore, updateStore } from "@/lib/json/store";
import { ensureProfile } from "@/lib/fullclear/progression";
import { todayKey } from "@/lib/fullclear/hunt";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.steamId64) return NextResponse.json({ error:"Non authentifié" }, { status:401 });
  const current = await readStore();
  const hunt = current.dailyHunts.find((h) => h.userId === session.user.id && h.dateKey === todayKey());
  if (!hunt || hunt.status !== "ACTIVE") return NextResponse.json({ error:"Aucune Hunt active aujourd’hui." }, { status:400 });
  const [result, owned] = await Promise.all([getGameAchievements(session.user.steamId64, hunt.appId), getOwnedGames(session.user.steamId64)]);
  const game = owned.find((g) => g.appid === hunt.appId);
  const unlockedNow = result.achievements.filter((a) => a.achieved);
  const unlockedNames = new Set(unlockedNow.map((a) => a.apiName));
  const newUnlocks = unlockedNow.filter((a) => !hunt.baselineAchievementNames.includes(a.apiName));
  const total = result.achievements.length;
  const percentage = total ? Math.round(unlockedNow.length / total * 100) : 0;
  const playtimeGain = Math.max(0, (game?.playtime_forever ?? hunt.baselinePlaytimeMinutes) - hunt.baselinePlaytimeMinutes);
  let completed = false;
  let awardedPoints = 0;
  let awardedXp = 0;
  await updateStore((store) => {
    const live = store.dailyHunts.find((h) => h.id === hunt.id)!;
    for (const objective of live.objectives) {
      if (objective.kind === "ACHIEVEMENT") objective.completed = Boolean(live.achievementApiName && unlockedNames.has(live.achievementApiName) && !live.baselineAchievementNames.includes(live.achievementApiName));
      if (objective.kind === "PLAYTIME") objective.completed = playtimeGain >= objective.target;
      if (objective.kind === "PROGRESS") objective.completed = objective.target <= 3 ? newUnlocks.length >= objective.target : percentage - live.baselinePercentage >= objective.target;
      if (objective.kind === "COMPLETE_GAME") objective.completed = percentage >= 100;
    }
    const selected = live.objectives.filter((o) => o.selected);
    const successful = selected.filter((o) => o.completed);
    completed = successful.length === 3;
    if (completed) {
      awardedPoints = 40 + successful.reduce((sum,o) => sum + o.points, 0) + 100;
      awardedXp = 75 + successful.length * 40 + (percentage >= 100 ? 250 : 0);
      live.status = "COMPLETED"; live.completedAt = new Date().toISOString(); live.awardedHuntPoints = awardedPoints; live.awardedXp = awardedXp;
      const profile = ensureProfile(store, session.user.id);
      profile.xp += awardedXp; profile.huntPoints += awardedPoints; profile.completedHunts += 1; profile.huntStreak += 1; profile.bestHuntStreak = Math.max(profile.bestHuntStreak, profile.huntStreak); profile.lastHuntDate = live.dateKey; profile.updatedAt = new Date().toISOString();
    }
    const now = new Date().toISOString();
    store.achievements = store.achievements.filter((a) => !(a.userId === session.user.id && a.appId === hunt.appId));
    store.achievements.push(...result.achievements.map((a) => ({ userId:session.user.id, appId:hunt.appId, ...a, lastSyncedAt:now })));
    store.achievementSummaries = store.achievementSummaries.filter((s) => !(s.userId === session.user.id && s.appId === hunt.appId));
    store.achievementSummaries.push({ userId:session.user.id, appId:hunt.appId, total, unlocked:unlockedNow.length, percentage, lastSyncedAt:now });
  });
  return NextResponse.json({ completed, newUnlocks:newUnlocks.length, percentage, playtimeGain, awardedPoints, awardedXp });
}
