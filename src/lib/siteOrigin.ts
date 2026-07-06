import { headers } from "next/headers";

function normalizeOrigin(origin: string): string {
  const trimmed = origin.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function isLocalhostOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return origin.includes("localhost") || origin.includes("127.0.0.1");
  }
}

function originFromHost(host: string, proto: string): string | null {
  const cleanHost = host.split(",")[0]?.trim();
  if (!cleanHost) {
    return null;
  }

  const scheme = proto.split(",")[0]?.trim() || "https";
  return normalizeOrigin(`${scheme}://${cleanHost}`);
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

/**
 * Resolves the public site origin for auth email links (signup confirm, password reset).
 * Prefers the incoming request host on production so links match the domain users signed up on.
 */
export async function getSiteOrigin(): Promise<string> {
  const isProduction = isProductionRuntime();

  try {
    const headerList = await headers();
    const host =
      headerList.get("x-forwarded-host")?.trim() ||
      headerList.get("host")?.trim();

    if (host && (!isProduction || !host.startsWith("localhost"))) {
      const proto =
        headerList.get("x-forwarded-proto")?.trim() ||
        (host.includes("localhost") ? "http" : "https");
      const fromRequest = originFromHost(host, proto);
      if (fromRequest) {
        return fromRequest;
      }
    }
  } catch {
    // headers() is unavailable outside a request (scripts, tests).
  }

  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit && !(isProduction && isLocalhostOrigin(normalizeOrigin(explicit)))) {
    return normalizeOrigin(explicit);
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionUrl) {
    return normalizeOrigin(productionUrl);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return normalizeOrigin(vercelUrl);
  }

  return "http://localhost:3000";
}
