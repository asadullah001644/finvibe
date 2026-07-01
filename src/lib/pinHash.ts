function isValidBcryptHash(hash: string): boolean {
  return (
    (hash.startsWith("$2a$") ||
      hash.startsWith("$2b$") ||
      hash.startsWith("$2y$")) &&
    hash.length >= 59
  );
}

export function normalizeBcryptHash(raw: string): string {
  return raw.trim().replace(/^['"]|['"]$/g, "").replace(/\\\$/g, "$");
}

function normalizeB64Input(raw: string): string {
  return raw
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/^B64:\s*/i, "")
    .replace(/\s+/g, "");
}

function decodePinHashB64(raw: string): string | null {
  const normalized = normalizeB64Input(raw);

  if (!normalized) {
    return null;
  }

  try {
    const decoded = Buffer.from(normalized, "base64").toString("utf8");

    if (isValidBcryptHash(decoded)) {
      return decoded;
    }
  } catch {
    // Fall through to raw hash env var.
  }

  return null;
}

export type PinHashConfigError = "missing" | "invalid";

export function resolvePinHash(): {
  hash: string | null;
  error?: PinHashConfigError;
} {
  const b64 = process.env.APP_SECRET_PIN_HASH_B64?.trim();

  if (b64) {
    const decoded = decodePinHashB64(b64);

    if (decoded) {
      return { hash: decoded };
    }

    console.error(
      "APP_SECRET_PIN_HASH_B64 is set but invalid. " +
        "Use only the base64 string (no 'B64:' prefix). Falling back to APP_SECRET_PIN_HASH.",
    );
  }

  const raw = process.env.APP_SECRET_PIN_HASH?.trim();

  if (!raw) {
    return { hash: null, error: b64 ? "invalid" : "missing" };
  }

  const hash = normalizeBcryptHash(raw);

  if (!isValidBcryptHash(hash)) {
    console.error(
      "APP_SECRET_PIN_HASH is set but not a valid bcrypt hash. " +
        "Local .env.local uses \\$ escapes; on Vercel paste the raw $2b$10$... hash " +
        "or set APP_SECRET_PIN_HASH_B64 instead.",
    );
    return { hash: null, error: "invalid" };
  }

  return { hash };
}
