#!/usr/bin/env node
/**
 * Export all FinVibe financial tables to backups/<timestamp>/.
 * Run before any multi-user migration: node scripts/backup-db.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!existsSync(envPath)) {
    throw new Error("Missing .env.local — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    value = value.replace(/\\$/g, "$");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const TABLES = ["budgets", "expenses", "recurring_expenses"];

async function fetchAll(supabase, table) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + pageSize - 1);

    if (error) {
      if (
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        error.message.includes("Could not find the table")
      ) {
        return { rows: [], missing: true };
      }
      throw new Error(`${table}: ${error.message}`);
    }

    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return { rows, missing: false };
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const supabase = createClient(url, anonKey);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupDir = path.join(ROOT, "backups", timestamp);
  await mkdir(backupDir, { recursive: true });

  const counts = {};
  const missingTables = [];

  for (const table of TABLES) {
    const { rows, missing } = await fetchAll(supabase, table);
    counts[table] = rows.length;
    if (missing) {
      missingTables.push(table);
      console.log(`  ${table}: table not found (skipped)`);
    } else {
      await writeFile(
        path.join(backupDir, `${table}.json`),
        JSON.stringify(rows, null, 2),
        "utf8",
      );
      console.log(`  ${table}: ${rows.length} rows`);
    }
  }

  const projectRef = new URL(url).hostname.split(".")[0];
  const manifest = {
    createdAt: new Date().toISOString(),
    projectRef,
    supabaseUrl: url,
    platformBackupConfirmed: false,
    platformBackupNote:
      "Set platformBackupConfirmed to true after verifying Supabase Dashboard → Database → Backups",
    counts,
    missingTables,
  };

  await writeFile(
    path.join(backupDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  console.log(`\nBackup saved to backups/${timestamp}/`);
  console.log("Verify row counts in Supabase SQL editor before proceeding.");
}

main().catch((error) => {
  console.error("Backup failed:", error.message);
  process.exit(1);
});
