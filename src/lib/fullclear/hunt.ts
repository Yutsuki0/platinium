import { randomUUID } from "crypto";
import type { JsonStore, StoredDailyHunt, StoredHuntObjective } from "@/lib/json/store";

export type HuntMode = "all" | "solo" | "online" | "mixed";
export const todayKey = () => new Date().toISOString().slice(0, 10);

export function createObjectives(targetName: string, remaining: number): StoredHuntObjective[] {
  return [
    { id: randomUUID(), label: `Débloquer « ${targetName} »`, kind: "ACHIEVEMENT", target: 1, selected: false, completed: false, points: 80 },
    { id: randomUUID(), label: "Débloquer au moins 1 nouveau succès", kind: "PROGRESS", target: 1, selected: false, completed: false, points: 55 },
    { id: randomUUID(), label: "Jouer au moins 45 minutes", kind: "PLAYTIME", target: 45, selected: false, completed: false, points: 45 },
    { id: randomUUID(), label: "Gagner au moins 2 % de progression", kind: "PROGRESS", target: 2, selected: false, completed: false, points: 70 },
    remaining <= 3
      ? { id: randomUUID(), label: "Terminer le jeu à 100 %", kind: "COMPLETE_GAME", target: 100, selected: false, completed: false, points: 220 }
      : { id: randomUUID(), label: "Débloquer 3 nouveaux succès", kind: "PROGRESS", target: 3, selected: false, completed: false, points: 100 },
  ];
}

export function expireOldHunts(store: JsonStore, userId: string, dateKey: string) {
  for (const hunt of store.dailyHunts) {
    if (hunt.userId === userId && hunt.dateKey < dateKey && (hunt.status === "ACTIVE" || hunt.status === "DRAFT")) hunt.status = "EXPIRED";
  }
}

export function makeDailyHunt(input: {
  userId:string; dateKey:string; appId:number; apiName:string|null; mode:HuntMode; baselineUnlocked:number; baselinePercentage:number; baselinePlaytimeMinutes:number; baselineAchievementNames:string[]; targetName:string; remaining:number;
}): StoredDailyHunt {
  return { id: randomUUID(), userId: input.userId, dateKey: input.dateKey, appId: input.appId, achievementApiName: input.apiName, mode: input.mode, status: "DRAFT", startedAt: new Date().toISOString(), completedAt: null, baselineUnlocked: input.baselineUnlocked, baselinePercentage: input.baselinePercentage, baselinePlaytimeMinutes: input.baselinePlaytimeMinutes, baselineAchievementNames: input.baselineAchievementNames, objectives: createObjectives(input.targetName, input.remaining), awardedXp: 0, awardedHuntPoints: 0 };
}
