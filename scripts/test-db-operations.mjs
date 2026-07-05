#!/usr/bin/env node
/**
 * Comprehensive DB operation test suite for FinVibe.
 * Uses a isolated test month (2099-01) and cleans up after itself.
 *
 * Usage: node scripts/test-db-operations.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TEST_MONTH = "2099-01";
const TEST_MONTH_2 = "2099-02";

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

const results = [];
const warnings = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

function warn(name, detail = "") {
  warnings.push({ name, detail });
  console.log(`  ⚠ ${name}${detail ? ` — ${detail}` : ""}`);
}

async function probeSchema(supabase) {
  const probes = {};

  for (const table of ["budgets", "expenses", "recurring_expenses", "profiles"]) {
    const { error } = await supabase.from(table).select("*").limit(1);
    probes[table] = error
      ? { exists: false, error: error.message, code: error.code }
      : { exists: true };
  }

  const { data: budgetCols } = await supabase.from("budgets").select("user_id").limit(1);
  probes.budgetsHasUserId = budgetCols !== null;

  const { count: budgetCount } = await supabase
    .from("budgets")
    .select("*", { count: "exact", head: true });
  probes.liveBudgetCount = budgetCount ?? 0;

  const { count: expenseCount } = await supabase
    .from("expenses")
    .select("*", { count: "exact", head: true });
  probes.liveExpenseCount = expenseCount ?? 0;

  return probes;
}

async function cleanupTestData(supabase) {
  await supabase.from("expenses").delete().gte("date", "2099-01-01").lte("date", "2099-12-31");
  await supabase.from("budgets").delete().in("month_key", [TEST_MONTH, TEST_MONTH_2]);
  await supabase
    .from("recurring_expenses")
    .delete()
    .ilike("description", "[TEST]%");
}

async function runBudgetTests(supabase, hasUserId) {
  const insertPayload = {
    month_key: TEST_MONTH,
    total_salary: 100000,
    savings_goal: 20000,
    categories: [{ name: "Food", allocated: 5000 }],
  };
  if (hasUserId) {
    // With RLS lockdown, anon insert may fail — service role required
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("budgets")
    .insert(insertPayload)
    .select("month_key, total_salary, savings_goal, categories")
    .single();

  if (insertErr) throw new Error(`budget insert: ${insertErr.message}`);
  pass("budgets INSERT", `month=${inserted.month_key}`);

  const { data: fetched, error: fetchErr } = await supabase
    .from("budgets")
    .select("month_key, total_salary, savings_goal, categories")
    .eq("month_key", TEST_MONTH)
    .maybeSingle();

  if (fetchErr) throw new Error(`budget select: ${fetchErr.message}`);
  if (!fetched || Number(fetched.total_salary) !== 100000) {
    throw new Error("budget select returned wrong data");
  }
  pass("budgets SELECT by month_key");

  const { error: updateErr } = await supabase
    .from("budgets")
    .update({ total_salary: 120000, savings_goal: 25000 })
    .eq("month_key", TEST_MONTH);

  if (updateErr) throw new Error(`budget update: ${updateErr.message}`);
  pass("budgets UPDATE income");

  const { data: updated } = await supabase
    .from("budgets")
    .select("total_salary, savings_goal")
    .eq("month_key", TEST_MONTH)
    .single();

  if (Number(updated?.total_salary) !== 120000) {
    throw new Error("budget update not persisted");
  }
  pass("budgets UPDATE verified");

  const { error: catErr } = await supabase
    .from("budgets")
    .update({
      categories: [
        { name: "Food", allocated: 8000 },
        { name: "Transport", allocated: 3000 },
      ],
    })
    .eq("month_key", TEST_MONTH);

  if (catErr) throw new Error(`budget category update: ${catErr.message}`);
  pass("budgets UPDATE categories JSONB");

  const { data: priorInsert, error: priorErr } = await supabase
    .from("budgets")
    .insert({
      month_key: TEST_MONTH_2,
      total_salary: 0,
      savings_goal: 0,
      categories: [],
    })
    .select("month_key")
    .single();

  if (priorErr && priorErr.code !== "23505") {
    throw new Error(`budget insert month2: ${priorErr.message}`);
  }
  pass("budgets INSERT second month (carry-forward setup)");

  const { data: priorBudget } = await supabase
    .from("budgets")
    .select("month_key, total_salary")
    .lt("month_key", TEST_MONTH_2)
    .order("month_key", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!priorBudget || priorBudget.month_key !== TEST_MONTH) {
    throw new Error("getMostRecentPriorBudget logic: wrong prior month");
  }
  pass("budgets SELECT prior month (carry-forward query)");
}

async function runExpenseTests(supabase) {
  let expenseId;

  const { data: inserted, error: insertErr } = await supabase
    .from("expenses")
    .insert({
      amount: 1500,
      category: "Food",
      description: "[TEST] lunch",
      date: "2099-01-15",
    })
    .select("id, amount, category, description, date")
    .single();

  if (insertErr) throw new Error(`expense insert: ${insertErr.message}`);
  expenseId = inserted.id;
  pass("expenses INSERT", `id=${expenseId}`);

  const { data: fetched, error: fetchErr } = await supabase
    .from("expenses")
    .select("id, amount, category, description, date")
    .eq("id", expenseId)
    .single();

  if (fetchErr || Number(fetched.amount) !== 1500) {
    throw new Error("expense select failed");
  }
  pass("expenses SELECT by id");

  const { error: updateErr } = await supabase
    .from("expenses")
    .update({ amount: 1800, description: "[TEST] lunch updated" })
    .eq("id", expenseId);

  if (updateErr) throw new Error(`expense update: ${updateErr.message}`);
  pass("expenses UPDATE");

  const { data: monthExpenses, error: monthErr } = await supabase
    .from("expenses")
    .select("id, amount")
    .gte("date", "2099-01-01")
    .lte("date", "2099-01-31");

  if (monthErr) throw new Error(`expense month query: ${monthErr.message}`);
  if (!monthExpenses?.some((row) => row.id === expenseId)) {
    throw new Error("getExpensesForMonth range query missed test row");
  }
  pass("expenses SELECT by month range");

  const { data: allExpenses, error: allErr } = await supabase
    .from("expenses")
    .select("id")
    .order("date", { ascending: false })
    .limit(100);

  if (allErr) throw new Error(`expense list: ${allErr.message}`);
  if (!allExpenses?.length) throw new Error("getExpenses returned empty");
  pass("expenses SELECT all (ordered)");

  const { data: deleted, error: deleteErr } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .select("id");

  if (deleteErr) throw new Error(`expense delete: ${deleteErr.message}`);
  if (!deleted?.length) throw new Error("expense delete returned no rows");
  pass("expenses DELETE");

  const { data: gone } = await supabase
    .from("expenses")
    .select("id")
    .eq("id", expenseId)
    .maybeSingle();

  if (gone) throw new Error("expense still exists after delete");
  pass("expenses DELETE verified");
}

async function runRecurringTests(supabase, schema) {
  if (!schema.recurring_expenses?.exists) {
    pass("recurring_expenses SKIPPED", "table not deployed");
    return;
  }

  let recurringId;

  const { data: created, error: createErr } = await supabase
    .from("recurring_expenses")
    .insert({
      amount: 5000,
      category: "Flat › Rent",
      description: "[TEST] monthly rent",
      is_active: true,
    })
    .select("id, amount, category, is_active")
    .single();

  if (createErr) throw new Error(`recurring insert: ${createErr.message}`);
  recurringId = created.id;
  pass("recurring_expenses INSERT");

  const { error: updateErr } = await supabase
    .from("recurring_expenses")
    .update({ amount: 5500, is_active: false })
    .eq("id", recurringId);

  if (updateErr) throw new Error(`recurring update: ${updateErr.message}`);
  pass("recurring_expenses UPDATE");

  const { data: list, error: listErr } = await supabase
    .from("recurring_expenses")
    .select("id, amount, is_active")
    .eq("id", recurringId)
    .single();

  if (listErr || Number(list.amount) !== 5500) {
    throw new Error("recurring select failed");
  }
  pass("recurring_expenses SELECT");

  const { error: deleteErr } = await supabase
    .from("recurring_expenses")
    .delete()
    .eq("id", recurringId);

  if (deleteErr) throw new Error(`recurring delete: ${deleteErr.message}`);
  pass("recurring_expenses DELETE");
}

async function runLiveDataIntegrity(supabase, schema) {
  const backupManifest = (() => {
    try {
      const backupsDir = path.join(ROOT, "backups");
      if (!existsSync(backupsDir)) return null;
      const entries = readdirSync(backupsDir).filter((e) => e !== ".gitkeep").sort();
      const latest = entries.at(-1);
      if (!latest) return null;
      return JSON.parse(
        readFileSync(path.join(backupsDir, latest, "manifest.json"), "utf8"),
      );
    } catch {
      return null;
    }
  })();

  if (backupManifest?.counts) {
    if (schema.liveBudgetCount < backupManifest.counts.budgets) {
      fail(
        "live data integrity",
        `budget count ${schema.liveBudgetCount} < backup ${backupManifest.counts.budgets}`,
      );
    } else {
      pass(
        "live data integrity budgets",
        `${schema.liveBudgetCount} rows (backup: ${backupManifest.counts.budgets})`,
      );
    }

    if (schema.liveExpenseCount < backupManifest.counts.expenses) {
      fail(
        "live data integrity",
        `expense count ${schema.liveExpenseCount} < backup ${backupManifest.counts.expenses}`,
      );
    } else {
      pass(
        "live data integrity expenses",
        `${schema.liveExpenseCount} rows (backup: ${backupManifest.counts.expenses})`,
      );
    }
  } else {
    pass("live data integrity SKIPPED", "no backup manifest");
  }
}

async function runProfilesTest(supabase, schema) {
  if (!schema.profiles?.exists) {
    warn("profiles table", "missing — run migration 003_multi_user_foundation.sql");
    return;
  }
  pass("profiles table exists");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, is_disabled")
    .limit(5);

  if (error) {
    fail("profiles SELECT", error.message);
    return;
  }
  pass("profiles SELECT", `${data?.length ?? 0} row(s) visible`);
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error("Missing Supabase URL or anon key");
  }

  console.log("\n=== FinVibe DB Operation Test Suite ===\n");

  console.log("1) Schema probe");
  const anonClient = createClient(url, anonKey);
  const schema = await probeSchema(anonClient);

  for (const [table, info] of Object.entries(schema)) {
    if (typeof info === "object" && info?.exists === false) {
      console.log(`  · ${table}: MISSING (${info.error})`);
    } else if (typeof info === "object" && info?.exists) {
      console.log(`  · ${table}: OK`);
    }
  }
  if (schema.liveBudgetCount !== undefined) {
    console.log(`  · live budgets: ${schema.liveBudgetCount}`);
    console.log(`  · live expenses: ${schema.liveExpenseCount}`);
  }

  const client = serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false } })
    : anonClient;

  console.log(`\n  Using: ${serviceKey ? "service_role (bypasses RLS)" : "anon key"}\n`);

  if (!schema.profiles?.exists) {
    console.log("⚠ Migration 003 not applied — auth/multi-user not active yet.");
    console.log("  CRUD tests use anon key against open RLS (pre-migration mode).\n");
  }

  console.log("2) Live data integrity (vs backup)");
  await runLiveDataIntegrity(client, schema);

  console.log("\n3) Profiles");
  await runProfilesTest(client, schema);

  console.log("\n4) Budget CRUD (test month 2099-01)");
  try {
    await cleanupTestData(client);
    await runBudgetTests(client, schema.budgetsHasUserId);
  } catch (error) {
    fail("budget CRUD suite", error.message);
  }

  console.log("\n5) Expense CRUD");
  try {
    await runExpenseTests(client);
  } catch (error) {
    fail("expense CRUD suite", error.message);
  }

  console.log("\n6) Recurring expense CRUD");
  try {
    await runRecurringTests(client, schema);
  } catch (error) {
    fail("recurring CRUD suite", error.message);
  }

  console.log("\n7) Constraint & edge cases");
  try {
    const { error: dupErr } = await client.from("budgets").insert({
      month_key: TEST_MONTH,
      total_salary: 1,
      savings_goal: 0,
      categories: [],
    });
    if (!dupErr || dupErr.code !== "23505") {
      throw new Error(`expected duplicate month_key error 23505, got: ${dupErr?.message ?? "none"}`);
    }
    pass("budgets UNIQUE month_key constraint");

    const { data: badRows, error: badAmountErr } = await client
      .from("expenses")
      .insert({
        amount: -100,
        category: "Food",
        description: "[TEST] bad amount",
        date: "2099-01-01",
      })
      .select("id");

    if (badRows?.length) {
      await client.from("expenses").delete().eq("id", badRows[0].id);
      warn(
        "expenses CHECK amount > 0",
        "constraint missing on live DB — add: alter table expenses add constraint expenses_amount_check check (amount > 0)",
      );
    } else if (!badAmountErr) {
      throw new Error("expected error on negative amount insert");
    } else {
      pass("expenses CHECK amount > 0", badAmountErr.message.slice(0, 60));
    }

    const { data: delMissing, error: delMissingErr } = await client
      .from("expenses")
      .delete()
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .select("id");

    if (delMissingErr) throw new Error(delMissingErr.message);
    if (delMissing?.length) throw new Error("delete on missing id should return 0 rows");
    pass("expenses DELETE missing id (no-op)");

    const fakeUuid = "00000000-0000-0000-0000-000000000001";
    const { data: updMissing, error: updMissingErr } = await client
      .from("expenses")
      .update({ amount: 999 })
      .eq("id", fakeUuid)
      .select("id");

    if (updMissingErr) throw new Error(updMissingErr.message);
    if (updMissing?.length) throw new Error("update on missing id should return 0 rows");
    pass("expenses UPDATE missing id (no-op)");
  } catch (error) {
    fail("constraint/edge cases", error.message);
  }

  console.log("\n8) Cleanup test data");
  try {
    await cleanupTestData(client);
    pass("test data cleanup");
  } catch (error) {
    fail("test data cleanup", error.message);
  }

  const failed = results.filter((r) => !r.ok);

  console.log("\n=== Summary ===");
  console.log(`Passed: ${results.filter((r) => r.ok).length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (warnings.length) {
    console.log("\nWarnings (migration/setup):");
    for (const w of warnings) {
      console.log(`  - ${w.name}: ${w.detail}`);
    }
  }

  if (failed.length) {
    console.log("\nFailures:");
    for (const f of failed) {
      console.log(`  - ${f.name}: ${f.detail}`);
    }
    process.exit(1);
  }

  console.log("\nAll DB operation tests passed.\n");
}

main().catch((error) => {
  console.error("\nTest suite crashed:", error.message);
  process.exit(1);
});
