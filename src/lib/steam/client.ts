import "server-only";
import { withRateLimit } from "./rate-limit";
import { missingApiKeyError, apiError, timeoutError } from "./errors";
import { getRequestSteamApiKey } from "./api-key";

const STEAM_API_BASE = "https://api.steampowered.com";
const REQUEST_TIMEOUT_MS = 10_000;

function getApiKey(): string {
  const key = getRequestSteamApiKey();
  if (!key) throw missingApiKeyError();
  return key;
}

/**
 * Appelle un endpoint de l'API Web Steam. `interfaceName` et `method`
 * suivent la convention Steam, ex: ("IPlayerService", "GetOwnedGames", "v1").
 * La clé API n'est jamais renvoyée au client : ce module ne doit être
 * importé que depuis du code serveur (routes API, server actions).
 */
export async function steamApiFetch<TRaw = unknown>(
  interfaceName: string,
  method: string,
  version: string,
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<TRaw> {
  const url = new URL(`${STEAM_API_BASE}/${interfaceName}/${method}/${version}/`);
  url.searchParams.set("key", getApiKey());
  url.searchParams.set("format", "json");

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await withRateLimit(() =>
      fetch(url.toString(), { signal: controller.signal, cache: "no-store" })
    );
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw timeoutError();
    }
    throw apiError(err instanceof Error ? err.message : "requête échouée");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw apiError(`${interfaceName}/${method} a répondu ${response.status}`);
  }

  try {
    return (await response.json()) as TRaw;
  } catch {
    throw apiError(`réponse JSON invalide de ${interfaceName}/${method}`);
  }
}

/** Ne journalise jamais la clé API — utilitaire pour les logs d'erreurs (section 31). */
export function redactApiKey(message: string): string {
  const key = getRequestSteamApiKey();
  if (!key) return message;
  return message.split(key).join("[REDACTED]");
}
