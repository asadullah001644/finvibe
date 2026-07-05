#!/usr/bin/env node
/**
 * Restore FinVibe tables from a local backup folder.
 * Usage: node scripts/restore-db.mjs backups/2026-07-05T22-55-00
 *
 * WARNING: Clears and re-inserts budgets, expenses, recurring_expenses.
 * Only use for emergency rollback before multi-user lockdown, or on empty tables.
 */
import { createClient } from "@supabase/supabase-js";
import { readFile, readdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const TABLES = ["recurring_expenses", "expenses", "budgets"];

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!existsSync(envPath)) {
    throw new Error("Missing .env.local");
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
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  const backupArg = process.argv[2];
  if (!backupArg) {
    console.error("Usage: node scripts/restore-db.mjs backups/<timestamp>");
    process.exit(1);
  }

  const backupDir = path.resolve(ROOT, backupArg);
  if (!existsSync(path.join(backupDir, "manifest.json"))) {
    throw new Error(`Invalid backup directory: ${backupArg}`);
  }

  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    throw new Error("Missing Supabase credentials in .env.local");
  }

  const supabase = createClient(url, key);
  const manifest = JSON.parse(
    await readFile(path.join(backupDir, "manifest.json"), "utf8"),
  );

  console.log("Restore from:", backupDir);
  console.log("Manifest counts:", manifest.counts);
  console.log("\nDry-run parse:");

  for (const table of TABLES) {
    const filePath = path.join(backupDir, `${table}.json`);
    if (!existsSync(filePath)) {
      console.log(`  ${table}: missing file — skip`);
      continue;
    }
    const rows = JSON.parse(await readFile(filePath, "utf8"));
    console.log(`  ${table}: ${rows.length} rows parsed`);
  }

  const confirm = process.argv.includes("--confirm");
  if (!confirm) {
    console.log("\nAdd --confirm to execute restore (destructive).");
    return;
  }

  for (const table of TABLES) {
    const filePath = path.join(backupDir, `${table}.json`);
    if (!existsSync(filePath)) continue;

    const rows = JSON.parse(await readFile(filePath, "utf8"));

    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) {
      throw new Error(`Clear ${table}: ${deleteError.message}`);
    }

    if (rows.length === 0) continue;

    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase.from(table).insert(batch);
      if (error) {
        throw new Error(`Insert ${table}: ${error.message}`);
      }
    }

    console.log(`Restored ${table}: ${rows.length} rows`);
  }

  console.log("\nRestore complete.");
}

main().catch((error) => {
  console.error("Restore failed:", error.message);
  process.exit(1);
});
