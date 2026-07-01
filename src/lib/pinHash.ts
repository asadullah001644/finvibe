const BCRYPT_PREFIX = /^\$2[aby]\$/;

export function normalizeBcryptHash(raw: string): string {
  return raw.trim().replace(/^['"]|['"]$/g, "").replace(/\\\$/g, "$");
}

function isValidBcryptHash(hash: string): boolean {
  return BCRYPT_PREFIX.test(hash);
}

export type PinHashConfigError = "missing" | "invalid";

export function resolvePinHash(): {
  hash: string | null;
  error?: PinHashConfigError;
} {
  const b64 = process.env.APP_SECRET_PIN_HASH_B64?.trim();

  if (b64) {
    try {
      const decoded = Buffer.from(b64, "base64").toString("utf8");

      if (isValidBcryptHash(decoded)) {
        return { hash: decoded };
      }

      console.error("APP_SECRET_PIN_HASH_B64 decoded to an invalid bcrypt hash.");
      return { hash: null, error: "invalid" };
    } catch {
      console.error("APP_SECRET_PIN_HASH_B64 is not valid base64.");
      return { hash: null, error: "invalid" };
    }
  }

  const raw = process.env.APP_SECRET_PIN_HASH?.trim();

  if (!raw) {
    return { hash: null, error: "missing" };
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
