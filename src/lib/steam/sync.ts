import "server-only";

import { randomUUID } from "crypto";
import {
  findUserById,
  findUserBySteamId,
  updateStore,
  type StoredUser,
} from "@/lib/json/store";
import { getPlayerSummary, isProfilePublic } from "./player";
import { getOwnedGames } from "./owned-games";
import { profilePrivateError, SteamServiceError } from "./errors";
import { redactApiKey } from "./client";

export async function provisionUserFromSteamProfile(
  steamId64: string
): Promise<StoredUser> {
  const player = await getPlayerSummary(steamId64);
  if (!isProfilePublic(player)) throw profilePrivateError();

  const now = new Date().toISOString();
  const existing = await findUserBySteamId(steamId64);
  const user: StoredUser = {
    id: existing?.id ?? `steam-${steamId64}`,
    steamId64,
    name: player.personaname,
    image: player.avatarfull ?? null,
    profileUrl: player.profileurl,
    countryCode: player.loccountrycode ?? null,
    profileIsPublic: true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastSyncedAt: existing?.lastSyncedAt ?? null,
  };

  await updateStore((store) => {
    const index = store.users.findIndex((item) => item.steamId64 === steamId64);
    if (index >= 0) store.users[index] = user;
    else store.users.push(user);
  });

  return user;
}

export interface SyncSummary {
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  gamesSynced: number;
  newGamesAdded: number;
  totalPlaytimeMinutes: number;
  startedAt: string;
  finishedAt: string;
  errors: string[];
}

const MIN_RESYNC_INTERVAL_MS = 30 * 60 * 1000;

export async function performInitialSync(
  userId: string,
  options: { force?: boolean } = {}
): Promise<SyncSummary> {
  const user = await findUserById(userId);
  if (!user) {
    throw new SteamServiceError("PROFILE_NOT_FOUND", "Aucun profil Steam lié à ce compte.");
  }

  if (
    !options.force &&
    user.lastSyncedAt &&
    Date.now() - new Date(user.lastSyncedAt).getTime() < MIN_RESYNC_INTERVAL_MS
  ) {
    throw new SteamServiceError(
      "RATE_LIMITED",
      "Ta bibliothèque a déjà été synchronisée récemment. Réessaie plus tard."
    );
  }

  const startedAt = new Date().toISOString();
  const logId = randomUUID();
  await updateStore((store) => {
    store.syncLogs.push({
      id: logId,
      userId,
      status: "RUNNING",
      startedAt,
      finishedAt: null,
      gamesSynced: 0,
      newGamesAdded: 0,
      errors: [],
    });
  });

  const errors: string[] = [];

  try {
    const ownedGames = await getOwnedGames(user.steamId64);
    const syncedAt = new Date().toISOString();
    let newGamesAdded = 0;
    let totalPlaytimeMinutes = 0;

    await updateStore((store) => {
      for (const owned of ownedGames) {
        try {
          const index = store.games.findIndex(
            (game) => game.userId === userId && game.appId === owned.appid
          );
          const game = {
            userId,
            appId: owned.appid,
            name: owned.name ?? `Jeu ${owned.appid}`,
            iconUrl: owned.iconUrl ?? null,
            playtimeForeverMinutes: owned.playtime_forever,
            playtime2WeeksMinutes: owned.playtime_2weeks ?? 0,
            hasCommunityStats: owned.has_community_visible_stats ?? false,
            lastSyncedAt: syncedAt,
          };

          if (index >= 0) store.games[index] = game;
          else {
            store.games.push(game);
            newGamesAdded += 1;
          }
          totalPlaytimeMinutes += owned.playtime_forever;
        } catch (error) {
          errors.push(
            redactApiKey(
              `Jeu ${owned.appid} : ${error instanceof Error ? error.message : "erreur inconnue"}`
            )
          );
        }
      }

      const userIndex = store.users.findIndex((item) => item.id === userId);
      if (userIndex >= 0) {
        store.users[userIndex].lastSyncedAt = syncedAt;
        store.users[userIndex].updatedAt = syncedAt;
      }

      const log = store.syncLogs.find((item) => item.id === logId);
      if (log) {
        log.status = errors.length ? "PARTIAL" : "SUCCESS";
        log.finishedAt = syncedAt;
        log.gamesSynced = ownedGames.length;
        log.newGamesAdded = newGamesAdded;
        log.errors = errors;
      }
    });

    return {
      status: errors.length ? "PARTIAL" : "SUCCESS",
      gamesSynced: ownedGames.length,
      newGamesAdded,
      totalPlaytimeMinutes,
      startedAt,
      finishedAt: syncedAt,
      errors,
    };
  } catch (error) {
    const finishedAt = new Date().toISOString();
    const message = redactApiKey(
      error instanceof Error ? error.message : "erreur inconnue"
    );
    await updateStore((store) => {
      const log = store.syncLogs.find((item) => item.id === logId);
      if (log) {
        log.status = "FAILED";
        log.finishedAt = finishedAt;
        log.errors = [message];
      }
    });
    throw error;
  }
}
