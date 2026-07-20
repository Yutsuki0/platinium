import "server-only";
import { cookies } from "next/headers";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const COOKIE_NAME = "pt_steam_api_key";

function secretKey() {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "local-development-only-change-me";
  return createHash("sha256").update(secret).digest();
}

export function encryptSteamApiKey(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptSteamApiKey(value?: string | null) {
  if (!value) return null;
  try {
    const raw = Buffer.from(value, "base64url");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", secretKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function getRequestSteamApiKey() {
  const encrypted = cookies().get(COOKIE_NAME)?.value;
  return decryptSteamApiKey(encrypted) || process.env.STEAM_API_KEY || null;
}

export const steamApiKeyCookieName = COOKIE_NAME;
