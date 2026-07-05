#!/usr/bin/env node
/**
 * Create super admin auth user if missing.
 * Usage: node scripts/create-super-admin.mjs [password]
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EMAIL = process.env.SUPER_ADMIN_EMAIL?.trim() || "muhammadasadullah833@gmail.com";

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!existsSync(envPath)) throw new Error("Missing .env.local");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    value = value.replace(/\\$/g, "$");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();
  const password = process.argv[2];
  if (!password || password.length < 8) {
    console.error("Usage: node scripts/create-super-admin.mjs <password-min-8-chars>");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");

  if (serviceKey) {
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());

    if (existing) {
      console.log(`Super admin already exists: ${EMAIL} (${existing.id})`);
      return;
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password,
      email_confirm: true,
    });

    if (error) throw new Error(error.message);
    console.log(`Created super admin: ${EMAIL} (${data.user?.id})`);
    return;
  }

  if (!anonKey) throw new Error("Missing anon key");

  const client = createClient(url, anonKey);
  const { data, error } = await client.auth.signUp({ email: EMAIL, password });

  if (error) {
    throw new Error(`${error.message} — add SUPABASE_SERVICE_ROLE_KEY for admin create, or sign up at /signup`);
  }

  if (data.user) {
    console.log(`Sign-up initiated for ${EMAIL}. Check email if confirmation required.`);
    console.log(`User id: ${data.user.id}`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
