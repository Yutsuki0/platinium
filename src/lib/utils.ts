import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un temps de jeu exprimé en minutes (format Steam) en texte lisible.
 */
export function formatPlaytime(minutes: number): string {
  const hours = minutes / 60;
  if (hours < 1) return `${minutes} min`;
  if (hours < 100) return `${hours.toFixed(1)} h`;
  return `${Math.round(hours)} h`;
}

/**
 * Détermine la classe de rareté d'un succès à partir de son pourcentage
 * mondial d'obtention, selon les seuils définis dans le cahier des charges.
 */
export type RarityTier = "common" | "uncommon" | "rare" | "veryrare" | "ultrarare";

export function getRarityTier(globalPercent: number): RarityTier {
  if (globalPercent > 50) return "common";
  if (globalPercent >= 20) return "uncommon";
  if (globalPercent >= 5) return "rare";
  if (globalPercent >= 1) return "veryrare";
  return "ultrarare";
}

export const RARITY_LABELS: Record<RarityTier, string> = {
  common: "Commun",
  uncommon: "Peu commun",
  rare: "Rare",
  veryrare: "Très rare",
  ultrarare: "Ultra rare",
};
