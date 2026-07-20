import { NextRequest, NextResponse } from "next/server";
import { verifySteamOpenIdCallback } from "@/lib/steam/openid";
import { provisionUserFromSteamProfile } from "@/lib/steam/sync";
import { createLoginTicket } from "@/lib/steam/ticket";
import { SteamServiceError } from "@/lib/steam/errors";

export const dynamic = "force-dynamic";

function getPublicOrigin(request: NextRequest): string {
  const configured = process.env.NEXTAUTH_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    "https";

  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    request.headers.get("host");

  if (host) {
    return `${proto}://${host}`;
  }

  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const origin = getPublicOrigin(request);

  try {
    const steamId64 = await verifySteamOpenIdCallback(
      request.nextUrl.searchParams
    );

    const user = await provisionUserFromSteamProfile(steamId64);

    const ticket = createLoginTicket({
      userId: user.id,
      steamId64: user.steamId64,
    });

    const redirectUrl = new URL("/auth/steam-complete", origin);
    redirectUrl.searchParams.set("ticket", ticket);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[STEAM_CALLBACK_ERROR]", error);

    const message =
      error instanceof SteamServiceError
        ? error.message
        : error instanceof Error
          ? error.message
          : "La connexion avec Steam a échoué. Merci de réessayer.";

    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("error", message);

    return NextResponse.redirect(redirectUrl);
  }
}