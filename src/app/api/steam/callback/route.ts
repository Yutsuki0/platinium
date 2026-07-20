import { NextRequest, NextResponse } from "next/server";
import { verifySteamOpenIdCallback } from "@/lib/steam/openid";
import { createLoginTicket } from "@/lib/steam/ticket";

export const dynamic = "force-dynamic";

function getPublicOrigin(request: NextRequest): string {
  const configuredUrl = process.env.NEXTAUTH_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const protocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    "https";

  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    request.headers.get("host");

  if (host) {
    return `${protocol}://${host}`;
  }

  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const origin = getPublicOrigin(request);

  try {
    const steamId64 = await verifySteamOpenIdCallback(
      request.nextUrl.searchParams
    );

    if (!steamId64) {
      throw new Error("Steam n’a retourné aucun identifiant.");
    }

    /*
     * On utilise temporairement le Steam ID comme identifiant utilisateur.
     * Cela évite d’écrire dans data/store.json, qui n’est pas persistant
     * sur Vercel.
     */
    const ticket = createLoginTicket({
      userId: steamId64,
      steamId64,
    });

    const redirectUrl = new URL("/auth/steam-complete", origin);
    redirectUrl.searchParams.set("ticket", ticket);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[STEAM_CALLBACK_ERROR]", error);

    const message =
      error instanceof Error
        ? error.message
        : "La connexion avec Steam a échoué.";

    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("error", message);

    return NextResponse.redirect(redirectUrl);
  }
}