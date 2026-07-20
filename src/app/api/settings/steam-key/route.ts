import { NextResponse } from "next/server";
import { encryptSteamApiKey, steamApiKeyCookieName } from "@/lib/steam/api-key";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { apiKey?: string } | null;
  const apiKey = body?.apiKey?.trim();
  if (!apiKey || !/^[A-Fa-f0-9]{32}$/.test(apiKey)) {
    return NextResponse.json({ error: "La clé Steam doit contenir 32 caractères hexadécimaux." }, { status: 400 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(steamApiKeyCookieName, encryptSteamApiKey(apiKey), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(steamApiKeyCookieName, "", { path: "/", maxAge: 0 });
  return response;
}
