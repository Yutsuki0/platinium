import "server-only";
import { steamApiFetch } from "./client";

interface PlayerAchievementRaw {
  apiname: string;
  achieved: number;
  unlocktime: number;
}

interface PlayerAchievementsResponse {
  playerstats?: {
    steamID?: string;
    gameName?: string;
    success?: boolean;
    error?: string;
    achievements?: PlayerAchievementRaw[];
  };
}

interface SchemaAchievementRaw {
  name: string;
  displayName?: string;
  hidden?: number;
  description?: string;
  icon?: string;
  icongray?: string;
}

interface GameSchemaResponse {
  game?: {
    gameName?: string;
    gameVersion?: string;
    availableGameStats?: {
      achievements?: SchemaAchievementRaw[];
    };
  };
}

interface PublicAchievement {
  name: string;
  description: string | null;
}

export interface SteamAchievementDetails {
  apiName: string;
  displayName: string;
  description: string | null;
  achieved: boolean;
  unlockTime: number | null;
  hidden: boolean;
  iconUrl: string | null;
  iconGrayUrl: string | null;
}

export interface SteamGameAchievements {
  gameName: string;
  achievements: SteamAchievementDetails[];
}

function decodeHtml(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_match, entity: string) => {
      if (entity.startsWith("#x") || entity.startsWith("#X")) {
        return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
      }
      if (entity.startsWith("#")) {
        return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
      }
      return named[entity.toLowerCase()] ?? `&${entity};`;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[™®©]/g, "")
    .toLocaleLowerCase("fr-FR")
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractElementText(block: string, tag: "h3" | "h5"): string | null {
  const expression = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(expression);
  if (!match) return null;
  const text = decodeHtml(match[1]);
  return text.length > 0 ? text : null;
}

function parsePublicAchievements(html: string): PublicAchievement[] {
  const rows = html.match(/<div[^>]+class=["'][^"']*achieveRow[^"']*["'][^>]*>[\s\S]*?(?=<div[^>]+class=["'][^"']*achieveRow|<div[^>]+class=["'][^"']*footer|<\/body>)/gi) ?? [];

  return rows
    .map((row) => ({
      name: extractElementText(row, "h3") ?? "",
      description: extractElementText(row, "h5"),
    }))
    .filter((achievement) => achievement.name.length > 0);
}

async function fetchPublicAchievements(appId: number, language: "french" | "english") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(
      `https://steamcommunity.com/stats/${appId}/achievements?l=${language}`,
      {
        cache: "no-store",
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": language === "french" ? "fr-FR,fr;q=0.9,en;q=0.7" : "en-US,en;q=0.9",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        },
        signal: controller.signal,
      }
    );

    if (!response.ok) return [];
    return parsePublicAchievements(await response.text());
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function findPublicAchievement(
  publicAchievements: PublicAchievement[],
  names: Array<string | undefined>
): PublicAchievement | null {
  const normalizedNames = names.filter(Boolean).map((name) => normalize(name!));
  if (normalizedNames.length === 0) return null;

  return (
    publicAchievements.find((achievement) =>
      normalizedNames.includes(normalize(achievement.name))
    ) ?? null
  );
}


export async function getGameAchievements(
  steamId64: string,
  appId: number
): Promise<SteamGameAchievements> {
  const [playerResponse, frenchSchema, englishSchema, frenchPublic, englishPublic] = await Promise.all([
    steamApiFetch<PlayerAchievementsResponse>(
      "ISteamUserStats",
      "GetPlayerAchievements",
      "v1",
      { steamid: steamId64, appid: appId, l: "french" }
    ),
    steamApiFetch<GameSchemaResponse>(
      "ISteamUserStats",
      "GetSchemaForGame",
      "v2",
      { appid: appId, l: "french" }
    ),
    steamApiFetch<GameSchemaResponse>(
      "ISteamUserStats",
      "GetSchemaForGame",
      "v2",
      { appid: appId, l: "english" }
    ),
    fetchPublicAchievements(appId, "french"),
    fetchPublicAchievements(appId, "english"),
  ]);

  const playerStats = playerResponse.playerstats;
  const playerAchievements = playerStats?.achievements ?? [];
  const frenchAchievements = frenchSchema.game?.availableGameStats?.achievements ?? [];
  const englishAchievements = englishSchema.game?.availableGameStats?.achievements ?? [];

  const playerByName = new Map(
    playerAchievements.map((achievement) => [achievement.apiname, achievement])
  );
  const englishByName = new Map(
    englishAchievements.map((achievement) => [achievement.name, achievement])
  );

  const sourceAchievements = frenchAchievements.length > 0 ? frenchAchievements : englishAchievements;
  const frenchByName = new Map(
    frenchAchievements.map((achievement) => [achievement.name, achievement])
  );

  const achievements = sourceAchievements.map((sourceSchema, index) => {
    const french = frenchByName.get(sourceSchema.name);
    const english = englishByName.get(sourceSchema.name);
    const player = playerByName.get(sourceSchema.name);
    const hidden = french?.hidden === 1 || english?.hidden === 1 || sourceSchema.hidden === 1;

    // La page publique Steam française contient parfois une traduction plus complète
    // que GetSchemaForGame, notamment pour les succès cachés. On privilégie toujours
    // cette traduction officielle, jamais une traduction automatique inventée.
    const exactFrenchPublic = findPublicAchievement(frenchPublic, [
      french?.displayName,
      sourceSchema.displayName,
      english?.displayName,
    ]);
    const positionalFrenchPublic =
      !exactFrenchPublic && frenchPublic.length === sourceAchievements.length
        ? frenchPublic[index]
        : null;
    const officialFrenchPublic = exactFrenchPublic ?? positionalFrenchPublic;

    const exactEnglishPublic = findPublicAchievement(englishPublic, [
      english?.displayName,
      sourceSchema.displayName,
      french?.displayName,
    ]);

    const officialFrenchName = officialFrenchPublic?.name?.trim();
    const officialFrenchDescription = officialFrenchPublic?.description?.trim() || null;

    return {
      apiName: sourceSchema.name,
      displayName:
        officialFrenchName ||
        french?.displayName ||
        sourceSchema.displayName ||
        english?.displayName ||
        sourceSchema.name,
      description:
        officialFrenchDescription ||
        french?.description ||
        sourceSchema.description ||
        english?.description ||
        exactEnglishPublic?.description ||
        null,
      achieved: player?.achieved === 1,
      unlockTime: player?.unlocktime ? player.unlocktime : null,
      hidden,
      iconUrl: french?.icon || sourceSchema.icon || english?.icon || null,
      iconGrayUrl: french?.icongray || sourceSchema.icongray || english?.icongray || null,
    } satisfies SteamAchievementDetails;
  });

  if (achievements.length === 0 && playerAchievements.length > 0) {
    return {
      gameName: playerStats?.gameName || frenchSchema.game?.gameName || englishSchema.game?.gameName || "Jeu Steam",
      achievements: playerAchievements.map((achievement) => ({
        apiName: achievement.apiname,
        displayName: achievement.apiname,
        description: null,
        achieved: achievement.achieved === 1,
        unlockTime: achievement.unlocktime || null,
        hidden: false,
        iconUrl: null,
        iconGrayUrl: null,
      })),
    };
  }

  return {
    gameName: playerStats?.gameName || frenchSchema.game?.gameName || englishSchema.game?.gameName || "Jeu Steam",
    achievements,
  };
}
