import "server-only";

import { promises as fs } from "fs";
import path from "path";
import postgres, { type Sql } from "postgres";

export interface StoredUser { id:string; steamId64:string; name:string; image:string|null; profileUrl:string; countryCode:string|null; profileIsPublic:boolean; createdAt:string; updatedAt:string; lastSyncedAt:string|null; }
export interface StoredGame { userId:string; appId:number; name:string; iconUrl:string|null; playtimeForeverMinutes:number; playtime2WeeksMinutes:number; hasCommunityStats:boolean; lastSyncedAt:string; }
export interface StoredAchievement { userId:string; appId:number; apiName:string; displayName:string; description:string|null; achieved:boolean; unlockTime:number|null; hidden:boolean; iconUrl:string|null; iconGrayUrl:string|null; lastSyncedAt:string; }
export interface StoredAchievementSummary { userId:string; appId:number; total:number; unlocked:number; percentage:number; lastSyncedAt:string; }
export interface StoredSyncLog { id:string; userId:string; status:"RUNNING"|"SUCCESS"|"PARTIAL"|"FAILED"; startedAt:string; finishedAt:string|null; gamesSynced:number; newGamesAdded:number; errors:string[]; }
export interface StoredDlcGroup { name:string; paid:boolean; achievementApiNames:string[]; }
export interface StoredFavoriteGame { userId:string; appId:number; createdAt:string; }
export interface StoredGameObjective { userId:string; appId:number; status:"ACTIVE"|"PAUSED"|"COMPLETED"; priority:"LOW"|"MEDIUM"|"HIGH"; targetDate:string|null; note:string; createdAt:string; updatedAt:string; }
export interface StoredGameResearch { userId:string; appId:number; status:"VERIFIED"|"NO_DLC_FOUND"|"UNVERIFIED"|"FAILED"; requiresPaidDlc:boolean; hiddenDescriptionsFound:number; groups:StoredDlcGroup[]; sources:{name:string;url:string}[]; checkedAt:string; error:string|null; }
export interface JsonStore { users:StoredUser[]; games:StoredGame[]; achievements:StoredAchievement[]; achievementSummaries:StoredAchievementSummary[]; syncLogs:StoredSyncLog[]; gameResearch:StoredGameResearch[]; favoriteGames:StoredFavoriteGame[]; gameObjectives:StoredGameObjective[]; }

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const EMPTY_STORE: JsonStore = { users:[], games:[], achievements:[], achievementSummaries:[], syncLogs:[], gameResearch:[], favoriteGames:[], gameObjectives:[] };
let writeQueue: Promise<void> = Promise.resolve();
let sqlClient: Sql | null = null;
let databaseReady: Promise<void> | null = null;

function normalizeStore(value: Partial<JsonStore> | null | undefined): JsonStore {
  return {
    users: Array.isArray(value?.users) ? value.users : [],
    games: Array.isArray(value?.games) ? value.games : [],
    achievements: Array.isArray(value?.achievements) ? value.achievements : [],
    achievementSummaries: Array.isArray(value?.achievementSummaries) ? value.achievementSummaries : [],
    syncLogs: Array.isArray(value?.syncLogs) ? value.syncLogs : [],
    gameResearch: Array.isArray(value?.gameResearch) ? value.gameResearch : [],
    favoriteGames: Array.isArray(value?.favoriteGames) ? value.favoriteGames : [],
    gameObjectives: Array.isArray(value?.gameObjectives) ? value.gameObjectives : [],
  };
}

function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function getSql(): Sql {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL manquante");
  if (!sqlClient) {
    sqlClient = postgres(process.env.DATABASE_URL, {
      max: Number(process.env.DATABASE_POOL_SIZE ?? 5),
      idle_timeout: 20,
      connect_timeout: 15,
      ssl: process.env.DATABASE_SSL === "false" ? false : "require",
      prepare: false,
    });
  }
  return sqlClient;
}

async function ensureFileStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { await fs.access(STORE_PATH); }
  catch { await fs.writeFile(STORE_PATH, JSON.stringify(EMPTY_STORE, null, 2), "utf8"); }
}

async function readFileStore(): Promise<JsonStore> {
  await ensureFileStore();
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return normalizeStore(JSON.parse(raw) as Partial<JsonStore>);
  } catch (error) {
    console.error("Impossible de lire data/store.json", error);
    return structuredClone(EMPTY_STORE);
  }
}

async function ensureDatabase() {
  if (!databaseReady) {
    databaseReady = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS platinum_app_store (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      const rows = await sql<{ data: JsonStore }[]>`SELECT data FROM platinum_app_store WHERE id = 'global' LIMIT 1`;
      if (!rows.length) {
        const local = await readFileStore();
        await sql`INSERT INTO platinum_app_store (id, data) VALUES ('global', ${sql.json(local as any)}) ON CONFLICT (id) DO NOTHING`;
      }
    })().catch((error) => {
      databaseReady = null;
      throw error;
    });
  }
  await databaseReady;
}

async function readDatabaseStore(): Promise<JsonStore> {
  await ensureDatabase();
  const sql = getSql();
  const rows = await sql<{ data: JsonStore }[]>`SELECT data FROM platinum_app_store WHERE id = 'global' LIMIT 1`;
  return normalizeStore(rows[0]?.data);
}

export async function readStore(): Promise<JsonStore> {
  if (!hasDatabase()) return readFileStore();
  try { return await readDatabaseStore(); }
  catch (error) {
    console.error("Base PostgreSQL indisponible, aucun fallback d'écriture réseau n'est utilisé.", error);
    throw new Error("Le stockage permanent est temporairement indisponible.");
  }
}

export async function updateStore(updater:(store:JsonStore)=>void|Promise<void>):Promise<JsonStore> {
  if (hasDatabase()) {
    await ensureDatabase();
    const sql = getSql();
    return sql.begin(async (transaction) => {
      await transaction`SELECT pg_advisory_xact_lock(73001001)`;
      const rows = await transaction<{ data: JsonStore }[]>`SELECT data FROM platinum_app_store WHERE id = 'global' FOR UPDATE`;
      const store = normalizeStore(rows[0]?.data);
      await updater(store);
      await transaction`UPDATE platinum_app_store SET data = ${transaction.json(store as any)}, updated_at = NOW() WHERE id = 'global'`;
      return store;
    }) as Promise<JsonStore>;
  }

  let result = structuredClone(EMPTY_STORE);
  writeQueue = writeQueue.then(async () => {
    const store = await readFileStore();
    await updater(store);
    const tmp = `${STORE_PATH}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
    await fs.rename(tmp, STORE_PATH);
    result = store;
  });
  await writeQueue;
  return result;
}

export async function findUserById(userId:string){const s=await readStore();return s.users.find(u=>u.id===userId)??null;}
export async function findUserBySteamId(steamId64:string){const s=await readStore();return s.users.find(u=>u.steamId64===steamId64)??null;}
export async function getGamesForUser(userId:string){const s=await readStore();return s.games.filter(g=>g.userId===userId);}
export async function getGameForUser(userId:string,appId:number){const s=await readStore();return s.games.find(g=>g.userId===userId&&g.appId===appId)??null;}
export async function getAchievementsForGame(userId:string,appId:number){const s=await readStore();return s.achievements.filter(a=>a.userId===userId&&a.appId===appId);}
export async function getAchievementSummariesForUser(userId:string){const s=await readStore();return s.achievementSummaries.filter(x=>x.userId===userId);}
export async function getAchievementSummaryForGame(userId:string,appId:number){const s=await readStore();return s.achievementSummaries.find(x=>x.userId===userId&&x.appId===appId)??null;}
export async function getLatestSyncLog(userId:string){const s=await readStore();return s.syncLogs.filter(x=>x.userId===userId).sort((a,b)=>b.startedAt.localeCompare(a.startedAt))[0]??null;}
export async function getResearchForUser(userId:string){const s=await readStore();return s.gameResearch.filter(x=>x.userId===userId);}
export async function getResearchForGame(userId:string,appId:number){const s=await readStore();return s.gameResearch.find(x=>x.userId===userId&&x.appId===appId)??null;}
export async function getFavoriteGameIds(userId:string){const s=await readStore();return s.favoriteGames.filter(x=>x.userId===userId).map(x=>x.appId);}
export async function getGameObjectivesForUser(userId:string){const s=await readStore();return s.gameObjectives.filter(x=>x.userId===userId);}
export async function getGameObjective(userId:string,appId:number){const s=await readStore();return s.gameObjectives.find(x=>x.userId===userId&&x.appId===appId)??null;}
