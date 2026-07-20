import "server-only";
import { steamApiFetch } from "./client";
import { getOrSetCache, CACHE_TTL } from "./rate-limit";
import {
  getPlayerSummariesResponseSchema,
  type SteamPlayerSummary,
} from "./types";
import { profileNotFoundError, apiError } from "./errors";

/**
 * ISteamUser/GetPlayerSummaries/v2
 * Steam accepte jusqu'à 100 SteamID séparés par une virgule en une seule requête.
 */
export async function getPlayerSummaries(
  steamId64s: string[]
): Promise<SteamPlayerSummary[]> {
  if (steamId64s.length === 0) return [];

  const raw = await steamApiFetch("ISteamUser", "GetPlayerSummaries", "v2", {
    steamids: steamId64s.join(","),
  });

  const parsed = getPlayerSummariesResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw apiError("format de réponse GetPlayerSummaries inattendu");
  }

  return parsed.data.response.players;
}

export async function getPlayerSummary(
  steamId64: string
): Promise<SteamPlayerSummary> {
  return getOrSetCache(
    `player-summary:${steamId64}`,
    CACHE_TTL.playerSummary,
    async () => {
      const [player] = await getPlayerSummaries([steamId64]);
      if (!player) throw profileNotFoundError();
      return player;
    }
  );
}

/** communityvisibilitystate === 3 signifie profil public. */
export function isProfilePublic(player: SteamPlayerSummary): boolean {
  return player.communityvisibilitystate === 3;
}
