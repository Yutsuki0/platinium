import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

type GameMode = "solo" | "online" | "mixed" | "unknown";
type CacheEntry = { mode: GameMode; expiresAt: number };
const cache = new Map<number, CacheEntry>();
const ONLINE_IDS = new Set([1, 9, 20, 27, 36, 37, 38, 39, 41, 47, 49]);
const SOLO_ID = 2;

function classify(categories: Array<{ id?: number }> | undefined): GameMode {
  if (!categories?.length) return "unknown";
  const ids = new Set(categories.map((category) => category.id).filter((id): id is number => typeof id === "number"));
  const solo = ids.has(SOLO_ID);
  const online = [...ONLINE_IDS].some((id) => ids.has(id));
  if (solo && online) return "mixed";
  if (online) return "online";
  if (solo) return "solo";
  return "unknown";
}

async function fetchMode(appId: number): Promise<GameMode> {
  const existing = cache.get(appId);
  if (existing && existing.expiresAt > Date.now()) return existing.mode;
  try {
    const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=french`, {
      next: { revalidate: 60 * 60 * 24 * 7 },
      headers: { "User-Agent": "FULLCLEAR-OS/1.0" },
    });
    if (!response.ok) throw new Error(`Steam Store ${response.status}`);
    const payload = await response.json() as Record<string, { success?: boolean; data?: { categories?: Array<{ id?: number }> } }>;
    const mode = payload[String(appId)]?.success ? classify(payload[String(appId)]?.data?.categories) : "unknown";
    cache.set(appId, { mode, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
    return mode;
  } catch {
    cache.set(appId, { mode: "unknown", expiresAt: Date.now() + 60 * 60 * 1000 });
    return "unknown";
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { appIds?: unknown };
  const appIds = Array.isArray(body.appIds)
    ? [...new Set(body.appIds.filter((value): value is number => Number.isInteger(value) && value > 0))].slice(0, 50)
    : [];
  if (!appIds.length) return NextResponse.json({ modes: {} });

  const entries = await Promise.all(appIds.map(async (appId) => [appId, await fetchMode(appId)] as const));
  return NextResponse.json({ modes: Object.fromEntries(entries) });
}
