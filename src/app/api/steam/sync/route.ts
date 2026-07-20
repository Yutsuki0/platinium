import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { performInitialSync } from "@/lib/steam/sync";
import { SteamServiceError } from "@/lib/steam/errors";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Non authentifié." },
      { status: 401 }
    );
  }

  const force = request.nextUrl.searchParams.get("force") === "true";

  try {
    const summary = await performInitialSync(session.user.id, { force });

    return NextResponse.json(summary);
  } catch (err) {
    console.error("[STEAM_SYNC_ERROR]", err);

    if (err instanceof SteamServiceError) {
      const status = err.code === "RATE_LIMITED" ? 429 : 502;

      return NextResponse.json(
        {
          error: err.message,
          code: err.code,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Une erreur inattendue est survenue pendant la synchronisation.",
      },
      { status: 500 }
    );
  }
}