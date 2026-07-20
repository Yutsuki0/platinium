import "server-only";
import { openIdVerificationFailedError, apiError } from "./errors";

const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";
const CLAIMED_ID_PREFIX = "https://steamcommunity.com/openid/id/";

function normalizeOrigin(value: string): string {
  return value.replace(/\/$/, "");
}

/**
 * Construit l'URL Steam OpenID à partir de l'origine réelle de la requête.
 * Cela évite d'exiger STEAM_OPENID_REALM et STEAM_OPENID_RETURN_URL dans .env
 * et fonctionne aussi bien en local qu'après déploiement.
 */
export function buildSteamLoginUrl(origin: string): string {
  const baseUrl = normalizeOrigin(origin);
  const returnTo = `${baseUrl}/api/steam/callback`;

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": `${baseUrl}/`,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`;
}

export async function verifySteamOpenIdCallback(
  searchParams: URLSearchParams
): Promise<string> {
  const claimedId = searchParams.get("openid.claimed_id");
  if (!claimedId || !claimedId.startsWith(CLAIMED_ID_PREFIX)) {
    throw openIdVerificationFailedError();
  }

  const steamId64 = claimedId.slice(CLAIMED_ID_PREFIX.length);
  if (!/^\d{17}$/.test(steamId64)) {
    throw openIdVerificationFailedError();
  }

  const verificationParams = new URLSearchParams(searchParams);
  verificationParams.set("openid.mode", "check_authentication");

  let response: Response;
  try {
    response = await fetch(STEAM_OPENID_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verificationParams.toString(),
      cache: "no-store",
    });
  } catch (err) {
    throw apiError(
      err instanceof Error ? err.message : "vérification OpenID échouée"
    );
  }

  if (!response.ok) throw openIdVerificationFailedError();

  const body = await response.text();
  if (!/is_valid\s*:\s*true/.test(body)) {
    throw openIdVerificationFailedError();
  }

  return steamId64;
}
