import { z } from "zod";

/**
 * ISteamUser/GetPlayerSummaries/v2
 * communityvisibilitystate: 1 = privé, 3 = public
 */
export const steamPlayerSummarySchema = z.object({
  steamid: z.string(),
  personaname: z.string(),
  profileurl: z.string(),
  avatar: z.string(),
  avatarmedium: z.string(),
  avatarfull: z.string(),
  personastate: z.number().int(),
  communityvisibilitystate: z.number().int(),
  profilestate: z.number().int().optional(),
  lastlogoff: z.number().int().optional(),
  timecreated: z.number().int().optional(),
  loccountrycode: z.string().optional(),
});

export type SteamPlayerSummary = z.infer<typeof steamPlayerSummarySchema>;

const getPlayerSummariesResponseSchema = z.object({
  response: z.object({
    players: z.array(steamPlayerSummarySchema),
  }),
});

export type GetPlayerSummariesResponse = z.infer<
  typeof getPlayerSummariesResponseSchema
>;
export { getPlayerSummariesResponseSchema };

/**
 * IPlayerService/GetOwnedGames/v1
 */
export const steamOwnedGameSchema = z.object({
  appid: z.number().int(),
  name: z.string().optional(),
  playtime_forever: z.number().int(),
  playtime_2weeks: z.number().int().optional(),
  img_icon_url: z.string().optional(),
  has_community_visible_stats: z.boolean().optional(),
});

export type SteamOwnedGame = z.infer<typeof steamOwnedGameSchema>;

const getOwnedGamesResponseSchema = z.object({
  response: z.object({
    game_count: z.number().int().optional(),
    games: z.array(steamOwnedGameSchema).optional(),
  }),
});

export type GetOwnedGamesResponse = z.infer<typeof getOwnedGamesResponseSchema>;
export { getOwnedGamesResponseSchema };

export function buildGameIconUrl(appId: number, iconHash?: string): string | null {
  if (!iconHash) return null;
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`;
}
