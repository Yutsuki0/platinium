import { NextRequest, NextResponse } from "next/server";
import { buildSteamLoginUrl } from "@/lib/steam/openid";

export const dynamic = "force-dynamic";

function getPublicOrigin(request: NextRequest): string {
  const configured = process.env.NEXTAUTH_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (proto && host) return `${proto}://${host}`;

  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const origin = getPublicOrigin(request);

  try {
    return NextResponse.redirect(buildSteamLoginUrl(origin));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("error", message);
    return NextResponse.redirect(redirectUrl);
  }
}
