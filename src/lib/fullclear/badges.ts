import type { JsonStore } from "@/lib/json/store";

export const BADGES = [
  ["first-signal","FIRST SIGNAL","Premier succès synchronisé"], ["first-clear","FIRST CLEAR","Premier jeu terminé à 100 %"],
  ["clear-5","CLEAR ×5","5 jeux terminés"], ["clear-10","CLEAR ×10","10 jeux terminés"], ["clear-25","CLEAR ×25","25 jeux terminés"],
  ["clear-50","CLEAR ×50","50 jeux terminés"], ["clear-100","CLEAR ×100","100 jeux terminés"], ["achievement-node","ACHIEVEMENT NODE","500 succès"],
  ["data-hoarder","DATA HOARDER","1 000 succès"], ["archive-master","ARCHIVE MASTER","5 000 succès"], ["daily-boot","DAILY BOOT","Première Hunt lancée"],
  ["target-acquired","TARGET ACQUIRED","Première Hunt validée"], ["triple-execution","TRIPLE EXECUTION","Trois objectifs bonus validés"],
  ["weekly-process","WEEKLY PROCESS","7 Hunts validées"], ["monthly-kernel","MONTHLY KERNEL","30 Hunts validées"], ["hundred-days","HUNDRED DAYS","100 Hunts validées"],
  ["perfect-week","PERFECT WEEK","Série de 7 Hunts"], ["perfect-month","PERFECT MONTH","Série de 30 Hunts"], ["random-access","RANDOM ACCESS","Hunts sur 25 jeux différents"],
  ["lone-process","LONE PROCESS","10 Hunts solo"], ["multiplayer-node","MULTIPLAYER NODE","10 Hunts en ligne"], ["one-more","ONE MORE ACHIEVEMENT","Terminer un jeu sur son dernier succès"],
  ["marathon-process","MARATHON PROCESS","25 succès en une journée"], ["hidden-process","HIDDEN PROCESS","100 succès cachés"],
] as const;

export function computeUnlockedBadgeIds(store: JsonStore, userId: string) {
  const achievements = store.achievements.filter((a) => a.userId === userId && a.achieved);
  const completed = store.achievementSummaries.filter((s) => s.userId === userId && s.total > 0 && s.percentage >= 100).length;
  const hunts = store.dailyHunts.filter((h) => h.userId === userId && h.status === "COMPLETED");
  const profile = store.fullClearProfiles.find((p) => p.userId === userId);
  const ids = new Set<string>();
  if (achievements.length) ids.add("first-signal");
  if (completed >= 1) ids.add("first-clear");
  for (const n of [5,10,25,50,100]) if (completed >= n) ids.add(`clear-${n}`);
  if (achievements.length >= 500) ids.add("achievement-node");
  if (achievements.length >= 1000) ids.add("data-hoarder");
  if (achievements.length >= 5000) ids.add("archive-master");
  if (store.dailyHunts.some((h) => h.userId === userId)) ids.add("daily-boot");
  if (hunts.length >= 1) ids.add("target-acquired");
  if (hunts.some((h) => h.objectives.filter((o) => o.selected && o.completed).length === 3)) ids.add("triple-execution");
  if (hunts.length >= 7) ids.add("weekly-process");
  if (hunts.length >= 30) ids.add("monthly-kernel");
  if (hunts.length >= 100) ids.add("hundred-days");
  if ((profile?.bestHuntStreak ?? 0) >= 7) ids.add("perfect-week");
  if ((profile?.bestHuntStreak ?? 0) >= 30) ids.add("perfect-month");
  if (new Set(hunts.map((h) => h.appId)).size >= 25) ids.add("random-access");
  return ids;
}
