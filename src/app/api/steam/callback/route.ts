import { NextRequest, NextResponse } from "next/server";
import { verifySteamOpenIdCallback } from "@/lib/steam/openid";
import { provisionUserFromSteamProfile } from "@/lib/steam/sync";
import { createLoginTicket } from "@/lib/steam/ticket";
import { SteamServiceError } from "@/lib/steam/errors";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;

  try {
    const steamId64 = await verifySteamOpenIdCallback(request.nextUrl.searchParams);
    const user = await provisionUserFromSteamProfile(steamId64);

    const ticket = createLoginTicket({ userId: user.id, steamId64 });

    const redirectUrl = new URL("/auth/steam-complete", baseUrl);
    redirectUrl.searchParams.set("ticket", ticket);
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    const message =
      err instanceof SteamServiceError
        ? err.message
        : "La connexion avec Steam a échoué. Merci de réessayer.";

    const redirectUrl = new URL("/login", baseUrl);
    redirectUrl.searchParams.set("error", message);
    return NextResponse.redirect(redirectUrl);
  }
}
