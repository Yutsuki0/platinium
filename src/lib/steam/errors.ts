/**
 * Erreurs typées du service Steam. Chaque erreur porte un code stable
 * utilisable côté UI pour afficher un message compréhensible (voir
 * section 27 du cahier des charges — gestion des erreurs).
 */

export type SteamErrorCode =
  | "MISSING_API_KEY"
  | "PROFILE_PRIVATE"
  | "GAMES_LIST_PRIVATE"
  | "PROFILE_NOT_FOUND"
  | "OPENID_VERIFICATION_FAILED"
  | "OPENID_TIMEOUT"
  | "API_ERROR"
  | "TIMEOUT"
  | "RATE_LIMITED";

export class SteamServiceError extends Error {
  readonly code: SteamErrorCode;

  constructor(code: SteamErrorCode, message: string) {
    super(message);
    this.name = "SteamServiceError";
    this.code = code;
  }
}

export function missingApiKeyError() {
  return new SteamServiceError(
    "MISSING_API_KEY",
    "La clé API Steam n'est pas configurée côté serveur (STEAM_API_KEY)."
  );
}

export function profilePrivateError() {
  return new SteamServiceError(
    "PROFILE_PRIVATE",
    "Steam ne permet pas actuellement d'accéder aux détails de tes jeux. Vérifie que ton profil et les détails de tes jeux sont publics."
  );
}

export function gamesListPrivateError() {
  return new SteamServiceError(
    "GAMES_LIST_PRIVATE",
    "Ta liste de jeux est privée sur Steam. Rends-la publique pour permettre la synchronisation."
  );
}

export function profileNotFoundError() {
  return new SteamServiceError(
    "PROFILE_NOT_FOUND",
    "Ce profil Steam est introuvable."
  );
}

export function openIdVerificationFailedError() {
  return new SteamServiceError(
    "OPENID_VERIFICATION_FAILED",
    "La vérification de la connexion Steam a échoué. Merci de réessayer."
  );
}

export function apiError(detail: string) {
  return new SteamServiceError("API_ERROR", `Erreur de l'API Steam : ${detail}`);
}

export function timeoutError() {
  return new SteamServiceError(
    "TIMEOUT",
    "Steam n'a pas répondu à temps. Merci de réessayer."
  );
}

export function rateLimitedError() {
  return new SteamServiceError(
    "RATE_LIMITED",
    "Trop de requêtes envoyées à l'API Steam. Merci de patienter avant de resynchroniser."
  );
}
