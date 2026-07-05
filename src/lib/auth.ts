import { createClient } from "@/utils/supabase/server";
import type { Profile, UserRole } from "@/lib/types";
import { isProfilesTableMissing } from "@/lib/schema";
import { getSessionUserFromClient } from "@/lib/supabaseSession";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface ProfileRow {
  id: string;
  email: string;
  role: UserRole;
  is_disabled: boolean;
  app_pin_hash: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    isDisabled: row.is_disabled,
    appPinHash: row.app_pin_hash,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isProfilesTableMissingError(error: { code?: string; message?: string }): boolean {
  return isProfilesTableMissing(error);
}

export function getSuperAdminEmail(): string | null {
  return process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() ?? null;
}

export function isSuperAdminEmail(email: string): boolean {
  const adminEmail = getSuperAdminEmail();
  return adminEmail !== null && email.trim().toLowerCase() === adminEmail;
}

export function isSuperAdmin(profile: Profile | null | undefined): boolean {
  return profile?.role === "super_admin";
}

function buildSyntheticProfile(user: User): Profile {
  const now = new Date().toISOString();
  return {
    id: user.id,
    email: user.email ?? "",
    role: isSuperAdminEmail(user.email ?? "") ? "super_admin" : "user",
    isDisabled: false,
    appPinHash: null,
    currency: "PKR",
    createdAt: now,
    updatedAt: now,
  };
}

const getSessionUserImpl = cache(async () => {
  const supabase = await createClient();
  return getSessionUserFromClient(supabase);
});

export const getSessionUser = getSessionUserImpl;

const getProfileImpl = cache(async (userId: string): Promise<Profile | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, role, is_disabled, app_pin_hash, currency, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isProfilesTableMissingError(error)) {
      return null;
    }
    throw new Error(error.message);
  }

  return data ? mapProfile(data as ProfileRow) : null;
});

export async function getProfile(userId?: string): Promise<Profile | null> {
  const id = userId ?? (await getSessionUser())?.id;

  if (!id) {
    return null;
  }

  return getProfileImpl(id);
}

/** Profile from DB, or a safe in-memory default when migrations are not applied yet. Never has a PIN unless stored in DB. */
export const getProfileOrDefault = cache(async (user: User): Promise<Profile> => {
  const existing = await getProfileImpl(user.id);
  if (existing) {
    return existing;
  }

  const supabase = await createClient();
  const role: UserRole = isSuperAdminEmail(user.email ?? "") ? "super_admin" : "user";

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        role,
      },
      { onConflict: "id" },
    )
    .select(
      "id, email, role, is_disabled, app_pin_hash, currency, created_at, updated_at",
    )
    .single();

  if (error) {
    if (isProfilesTableMissingError(error)) {
      return buildSyntheticProfile(user);
    }
    throw new Error(error.message);
  }

  return mapProfile(data as ProfileRow);
});

const getProfilesTableReadyCached = unstable_cache(
  async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    return !isProfilesTableMissing(error);
  },
  ["profiles-table-ready"],
  { revalidate: 3600 },
);

export async function isProfilesTableReady(): Promise<boolean> {
  return getProfilesTableReadyCached();
}

export function isSuperAdminUser(
  user: Pick<User, "email">,
  profile: Profile | null | undefined,
): boolean {
  if (profile?.role === "super_admin") {
    return true;
  }
  return isSuperAdminEmail(user.email ?? "");
}

export const requireAuth = cache(async (): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;
  profile: Profile;
}> => {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfileOrDefault(user);

  if (profile.isDisabled) {
    redirect("/login?disabled=1");
  }

  return { user, profile };
});

export const requireSuperAdmin = cache(async (): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;
  profile: Profile;
}> => {
  const auth = await requireAuth();

  if (!isSuperAdmin(auth.profile) && !isSuperAdminEmail(auth.user.email ?? "")) {
    redirect("/");
  }

  return auth;
});

export async function ensureSuperAdminRole(userId: string, email: string): Promise<void> {
  if (!isSuperAdminEmail(email)) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .upsert(
      { id: userId, email, role: "super_admin" },
      { onConflict: "id" },
    );

  if (error && !isProfilesTableMissingError(error)) {
    console.error("ensureSuperAdminRole:", error.message);
  }
}

export async function isPinLockEnabledForCurrentUser(): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) {
    return false;
  }

  const profile = await getProfileOrDefault(user);
  return Boolean(profile.appPinHash);
}
