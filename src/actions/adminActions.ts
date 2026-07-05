"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireSuperAdmin } from "@/lib/auth";
import { isProfilesTableMissing, isUserIdColumnMissing } from "@/lib/schema";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import type { Profile } from "@/lib/types";

export interface AdminUserRow {
  id: string;
  email: string;
  role: Profile["role"];
  isDisabled: boolean;
  createdAt: string;
}

export interface AdminUserFilters {
  email?: string;
  role?: Profile["role"] | "all";
  status?: "all" | "active" | "disabled";
}

export interface AdminPageData {
  users: AdminUserRow[];
  schemaReady: boolean;
  schemaMessage?: string;
}

function mapAdminUser(row: {
  id: string;
  email: string;
  role: Profile["role"];
  is_disabled: boolean;
  created_at: string;
}): AdminUserRow {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    isDisabled: row.is_disabled,
    createdAt: row.created_at,
  };
}

function mapAuthUserToAdminRow(user: {
  id: string;
  email: string;
  role: Profile["role"];
  createdAt: string;
}): AdminUserRow {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isDisabled: false,
    createdAt: user.createdAt,
  };
}

export async function getAdminPageDataAction(
  filters: AdminUserFilters = {},
): Promise<AdminPageData> {
  const { user, profile } = await requireSuperAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, is_disabled, created_at")
    .order("created_at", { ascending: false });

  if (error && isProfilesTableMissing(error)) {
    return {
      schemaReady: false,
      schemaMessage:
        "Run supabase/migrations/003_multi_user_foundation.sql in the Supabase SQL editor to enable the admin user list.",
      users: [
        mapAuthUserToAdminRow({
          id: user.id,
          email: user.email ?? profile.email,
          role: profile.role,
          createdAt: profile.createdAt,
        }),
      ],
    };
  }

  if (error) {
    throw new Error(error.message);
  }

  let users = (data ?? []).map(mapAdminUser);

  if (filters.email?.trim()) {
    const needle = filters.email.trim().toLowerCase();
    users = users.filter((row) => row.email.toLowerCase().includes(needle));
  }

  if (filters.role && filters.role !== "all") {
    users = users.filter((row) => row.role === filters.role);
  }

  if (filters.status === "active") {
    users = users.filter((row) => !row.isDisabled);
  } else if (filters.status === "disabled") {
    users = users.filter((row) => row.isDisabled);
  }

  return { users, schemaReady: true };
}

export async function getAdminUsersAction(
  filters: AdminUserFilters = {},
): Promise<AdminUserRow[]> {
  const result = await getAdminPageDataAction(filters);
  return result.users;
}

export async function disableUserAction(userId: string): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireSuperAdmin();
  if (user.id === userId) {
    return { success: false, error: "You cannot disable your own account." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_disabled: true, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    if (isProfilesTableMissing(error)) {
      return {
        success: false,
        error: "Profiles table not ready. Run migration 003 first.",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function enableUserAction(userId: string): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_disabled: false, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    if (isProfilesTableMissing(error)) {
      return {
        success: false,
        error: "Profiles table not ready. Run migration 003 first.",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteUserAction(userId: string): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireSuperAdmin();
  if (user.id === userId) {
    return { success: false, error: "You cannot delete your own account." };
  }

  try {
    const admin = await createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      return { success: false, error: error.message };
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Delete requires SUPABASE_SERVICE_ROLE_KEY in .env.local",
    };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function getAdminUserDataAction(userId: string, monthKey: string) {
  await requireSuperAdmin();
  const budget = await getBudgetForUser(userId, monthKey);
  const expenses = await getExpensesForUser(userId, monthKey);
  return { budget, expenses };
}

async function getBudgetForUser(userId: string, monthKey: string) {
  const supabase = await createClient();

  const withUser = await supabase
    .from("budgets")
    .select("month_key, total_salary, savings_goal, categories")
    .eq("user_id", userId)
    .eq("month_key", monthKey)
    .maybeSingle();

  if (!withUser.error) {
    return withUser.data;
  }

  if (isUserIdColumnMissing(withUser.error)) {
    const legacy = await supabase
      .from("budgets")
      .select("month_key, total_salary, savings_goal, categories")
      .eq("month_key", monthKey)
      .maybeSingle();

    if (legacy.error) {
      throw new Error(legacy.error.message);
    }

    return legacy.data;
  }

  throw new Error(withUser.error.message);
}

async function getExpensesForUser(userId: string, monthKey: string) {
  const supabase = await createClient();
  const range = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!range) return [];

  const lastDay = new Date(
    Number.parseInt(range[1], 10),
    Number.parseInt(range[2], 10),
    0,
  ).getDate();
  const start = `${range[1]}-${range[2]}-01`;
  const end = `${range[1]}-${range[2]}-${String(lastDay).padStart(2, "0")}`;

  const withUser = await supabase
    .from("expenses")
    .select("id, amount, category, description, date, created_at")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });

  if (!withUser.error) {
    return withUser.data ?? [];
  }

  if (isUserIdColumnMissing(withUser.error)) {
    const legacy = await supabase
      .from("expenses")
      .select("id, amount, category, description, date, created_at")
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false });

    if (legacy.error) {
      throw new Error(legacy.error.message);
    }

    return legacy.data ?? [];
  }

  throw new Error(withUser.error.message);
}

export async function getAdminUserProfileAction(userId: string): Promise<AdminUserRow | null> {
  const { user, profile } = await requireSuperAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, is_disabled, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error && isProfilesTableMissing(error)) {
    if (userId === user.id) {
      return mapAuthUserToAdminRow({
        id: user.id,
        email: user.email ?? profile.email,
        role: profile.role,
        createdAt: profile.createdAt,
      });
    }
    return null;
  }

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapAdminUser(data as Parameters<typeof mapAdminUser>[0]) : null;
}
