import type { JsonStore, StoredFullClearProfile } from "@/lib/json/store";
import { getHuntRank, getProfileTitle } from "./ranks";

export function levelFromXp(xp: number) {
  let level = 1;
  let remaining = Math.max(0, xp);
  while (level < 1000) {
    const need = 350 + Math.floor(level * 42 + Math.pow(level, 1.22) * 11);
    if (remaining < need) return { level, current: remaining, needed: need };
    remaining -= need;
    level += 1;
  }
  return { level: 1000, current: remaining, needed: 999999999 };
}

export function calculateLibraryXp(store: JsonStore, userId: string) {
  const achievements = store.achievements.filter((a) => a.userId === userId && a.achieved);
  const summaries = store.achievementSummaries.filter((s) => s.userId === userId);
  const completed = summaries.filter((s) => s.total > 0 && s.percentage >= 100);
  let xp = achievements.length * 4 + completed.length * 250;
  xp += completed.filter((s) => s.total >= 50).length * 75;
  xp += completed.filter((s) => s.total >= 100).length * 150;
  if (completed.length > 0) xp += 500;
  return { xp, achievements: achievements.length, completedGames: completed.length, trackedGames: summaries.length };
}

export function ensureProfile(store: JsonStore, userId: string): StoredFullClearProfile {
  let profile = store.fullClearProfiles.find((p) => p.userId === userId);
  if (!profile) {
    const now = new Date().toISOString();
    profile = { userId, xp: 0, huntPoints: 0, huntStreak: 0, bestHuntStreak: 0, completedHunts: 0, failedHunts: 0, lastHuntDate: null, selectedProfile: "fullclear", createdAt: now, updatedAt: now };
    store.fullClearProfiles.push(profile);
  }
  return profile;
}

export function buildProfileView(store: JsonStore, userId: string) {
  const user = store.users.find((u) => u.id === userId)!;
  const base = calculateLibraryXp(store, userId);
  const profile = store.fullClearProfiles.find((p) => p.userId === userId);
  const totalXp = base.xp + (profile?.xp ?? 0);
  const level = levelFromXp(totalXp);
  return { user, base, profile, totalXp, ...level, title: getProfileTitle(level.level), rank: getHuntRank(profile?.huntPoints ?? 0) };
}
