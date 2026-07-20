import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Le callback Steam OpenID (GET /api/steam/callback) vérifie la connexion
 * côté serveur, puis redirige le navigateur vers une page qui appelle
 * `signIn("steam-ticket", { ticket })`. Ce ticket signé (HMAC, courte durée
 * de vie) prouve à NextAuth que la vérification OpenID a bien eu lieu,
 * sans jamais faire confiance à un SteamID envoyé tel quel par le client.
 */

const TICKET_TTL_MS = 60_000;

interface TicketPayload {
  userId: string;
  steamId64: string;
  iat: number;
}

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET doit être défini dans .env");
  return secret;
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function createLoginTicket(payload: Omit<TicketPayload, "iat">): string {
  const full: TicketPayload = { ...payload, iat: Date.now() };
  const data = Buffer.from(JSON.stringify(full)).toString("base64url");
  const signature = sign(data);
  return `${data}.${signature}`;
}

export function verifyLoginTicket(ticket: string): TicketPayload | null {
  const [data, signature] = ticket.split(".");
  if (!data || !signature) return null;

  const expectedSignature = sign(data);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: TicketPayload;
  try {
    payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
  } catch {
    return null;
  }

  if (Date.now() - payload.iat > TICKET_TTL_MS) return null;

  return payload;
}
