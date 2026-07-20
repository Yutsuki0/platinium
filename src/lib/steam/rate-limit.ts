/**
 * Limitation de débit simple (token bucket) pour les appels sortants vers
 * l'API Steam, et petit cache mémoire TTL utilisé par les modules du
 * dossier steam/ pour respecter les durées de cache recommandées
 * (bibliothèque : 6h, succès joueur : 30 min, schéma : 7 jours, etc.).
 *
 * En production multi-instance, ce cache mémoire devrait être remplacé
 * par Redis — il suffit largement pour un usage personnel mono-instance.
 */

const MAX_REQUESTS_PER_WINDOW = 90; // marge sous la limite Steam (~100/min)
const WINDOW_MS = 60_000;

let requestTimestamps: number[] = [];

export async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter((t) => now - t < WINDOW_MS);

  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = requestTimestamps[0];
    const waitMs = WINDOW_MS - (now - oldest);
    await new Promise((resolve) => setTimeout(resolve, Math.max(waitMs, 0)));
  }

  requestTimestamps.push(Date.now());
  return fn();
}

type CacheEntry<T> = { value: T; expiresAt: number };

const cacheStore = new Map<string, CacheEntry<unknown>>();

export const CACHE_TTL = {
  ownedGames: 6 * 60 * 60 * 1000,
  playerAchievements: 30 * 60 * 1000,
  achievementSchema: 7 * 24 * 60 * 60 * 1000,
  storeInfo: 24 * 60 * 60 * 1000,
  globalPercentages: 24 * 60 * 60 * 1000,
  playerSummary: 10 * 60 * 1000,
} as const;

/**
 * Récupère une valeur en cache si elle n'a pas expiré, sinon exécute `fetcher`,
 * stocke le résultat et le retourne.
 */
export async function getOrSetCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = cacheStore.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const value = await fetcher();
  cacheStore.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function invalidateCache(keyPrefix: string) {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(keyPrefix)) cacheStore.delete(key);
  }
}
