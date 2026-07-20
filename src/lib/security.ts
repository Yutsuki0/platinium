import "server-only";

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const configured = process.env.NEXTAUTH_URL
    ? normalizeOrigin(process.env.NEXTAUTH_URL)
    : null;

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  const requestOrigin = forwardedProto && host
    ? `${forwardedProto}://${host}`
    : normalizeOrigin(request.url);

  return origin === configured || origin === requestOrigin;
}

export function noStoreHeaders(): Record<string, string> {
  return {
    "Cache-Control": "no-store, max-age=0",
    Pragma: "no-cache",
  };
}
