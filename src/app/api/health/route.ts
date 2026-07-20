import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    ok: true,
    app: "PLATINUM.EXE",
    origin: process.env.NEXTAUTH_URL || request.nextUrl.origin,
    hasAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
    hasGlobalSteamApiKey: Boolean(process.env.STEAM_API_KEY),
    hasPersistentDatabase: Boolean(process.env.DATABASE_URL),
    nodeEnv: process.env.NODE_ENV,
  });
}
