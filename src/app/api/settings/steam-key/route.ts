import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSameOriginRequest, noStoreHeaders } from "@/lib/security";
import { encryptSteamApiKey, steamApiKeyCookieName } from "@/lib/steam/api-key";

const MAX_BODY_BYTES = 2_048;

async function requireAuthorizedRequest(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401, headers: noStoreHeaders() });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origine de requête refusée." }, { status: 403, headers: noStoreHeaders() });
  }
  return null;
}

export async function POST(request: Request) {
  const rejected = await requireAuthorizedRequest(request);
  if (rejected) return rejected;

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Requête trop volumineuse." }, { status: 413, headers: noStoreHeaders() });
  }

  const body = await request.json().catch(() => null) as { apiKey?: string } | null;
  const apiKey = body?.apiKey?.trim();
  if (!apiKey || !/^[A-Fa-f0-9]{32}$/.test(apiKey)) {
    return NextResponse.json(
      { error: "La clé Steam doit contenir 32 caractères hexadécimaux." },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  const response = NextResponse.json({ ok: true }, { headers: noStoreHeaders() });
  response.cookies.set(steamApiKeyCookieName, encryptSteamApiKey(apiKey), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    priority: "high",
  });
  return response;
}

export async function DELETE(request: Request) {
  const rejected = await requireAuthorizedRequest(request);
  if (rejected) return rejected;

  const response = NextResponse.json({ ok: true }, { headers: noStoreHeaders() });
  response.cookies.set(steamApiKeyCookieName, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
