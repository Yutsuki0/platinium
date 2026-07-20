import "server-only";
import { steamApiFetch } from "./client";
import { getOrSetCache, CACHE_TTL } from "./rate-limit";
import {
  getOwnedGamesResponseSchema,
  buildGameIconUrl,
  type SteamOwnedGame,
} from "./types";
import { gamesListPrivateError, apiError } from "./errors";

export interface OwnedGame extends SteamOwnedGame {
  iconUrl: string | null;
}

/**
 * IPlayerService/GetOwnedGames/v1
 * include_appinfo=1 pour récupérer le nom et l'icône de chaque jeu.
 * include_played_free_games=1 pour inclure les jeux gratuits déjà joués.
 */
export async function getOwnedGames(steamId64: string): Promise<OwnedGame[]> {
  return getOrSetCache(
    `owned-games:${steamId64}`,
    CACHE_TTL.ownedGames,
    async () => {
      const raw = await steamApiFetch("IPlayerService", "GetOwnedGames", "v1", {
        steamid: steamId64,
        include_appinfo: 1,
        include_played_free_games: 1,
      });

      const parsed = getOwnedGamesResponseSchema.safeParse(raw);
      if (!parsed.success) {
        throw apiError("format de réponse GetOwnedGames inattendu");
      }

      const { games } = parsed.data.response;

      // Steam renvoie une réponse vide (pas d'erreur HTTP) quand la liste
      // de jeux du compte est privée.
      if (!games) {
        throw gamesListPrivateError();
      }

      return games.map((game) => ({
        ...game,
        iconUrl: buildGameIconUrl(game.appid, game.img_icon_url),
      }));
    }
  );
}
