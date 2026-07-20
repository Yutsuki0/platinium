export const HUNT_RANK_FAMILIES = [
  "UNINITIALIZED","BOOT","INPUT","BUFFER","CACHE","THREAD","SCRIPT","PROCESS","MODULE","RUNTIME",
  "TERMINAL","COMPILER","EXECUTOR","PROTOCOL","FIREWALL","DATABASE","NETWORK","CLUSTER","ENGINE","SYSTEM",
  "KERNEL","OVERCLOCK","QUANTUM","SPECTRAL","VOID","ASCENDANT","LEGENDARY","FULLCLEAR","FULLCLEAR PRIME","INFINITE CORE",
] as const;

export const DIVISIONS = ["V", "IV", "III", "II", "I"] as const;
export const POINTS_PER_DIVISION = 600;

export function getHuntRank(points: number) {
  const safe = Math.max(0, Math.floor(points));
  const divisionIndex = Math.floor(safe / POINTS_PER_DIVISION);
  const regularCount = HUNT_RANK_FAMILIES.length * DIVISIONS.length;
  if (divisionIndex >= regularCount) {
    const prestige = Math.floor((divisionIndex - regularCount) / 5) + 1;
    return { name: `CORE PRESTIGE ${prestige}`, family: "CORE PRESTIGE", division: String(prestige), progress: safe % POINTS_PER_DIVISION, next: POINTS_PER_DIVISION, icon: "/fullclear/ranks/infinite-core.svg" };
  }
  const familyIndex = Math.floor(divisionIndex / DIVISIONS.length);
  const division = DIVISIONS[divisionIndex % DIVISIONS.length];
  const family = HUNT_RANK_FAMILIES[familyIndex];
  return { name: `${family} ${division}`, family, division, progress: safe % POINTS_PER_DIVISION, next: POINTS_PER_DIVISION, icon: `/fullclear/ranks/${family.toLowerCase().replaceAll(" ", "-")}.svg` };
}

export function getProfileTitle(level: number) {
  const tiers = [
    [1,"BOOT SEQUENCE"],[25,"CACHE RUNNER"],[50,"SCRIPT HUNTER"],[75,"ACHIEVEMENT NODE"],[100,"CLEAR OPERATOR"],
    [150,"TROPHY PROCESSOR"],[200,"COMPLETION ENGINE"],[300,"SYSTEM ARCHITECT"],[400,"KERNEL HUNTER"],[500,"MASTER EXECUTOR"],
    [600,"ASCENDED CORE"],[700,"VOID COMPLETIONIST"],[800,"LEGACY BREAKER"],[900,"FULLCLEAR PRIME"],[950,"INFINITE PROCESS"],[1000,"THE FINAL BUILD"],
  ] as const;
  return [...tiers].reverse().find(([min]) => level >= min)?.[1] ?? "BOOT SEQUENCE";
}
