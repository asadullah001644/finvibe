"use server";

import { requireAuth } from "@/lib/auth";
import { validateDisplayName } from "@/lib/profileDisplay";
import { isProfilesTableMissing } from "@/lib/schema";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateDisplayNameAction(
  displayName: string,
): Promise<{ success: boolean; error?: string }> {
  const { user, profile } = await requireAuth();
  const trimmed = displayName.trim();

  if (trimmed) {
    const validationError = validateDisplayName(trimmed);
    if (validationError) {
      return { success: false, error: validationError };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? profile.email,
        role: profile.role,
        display_name: trimmed || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (error) {
    if (isProfilesTableMissing(error)) {
      return {
        success: false,
        error:
          "Profiles table not ready. Run supabase/migrations/003_multi_user_foundation.sql first.",
      };
    }

    if (error.message.toLowerCase().includes("display_name")) {
      return {
        success: false,
        error:
          "Display name is not available yet. Run supabase/migrations/006_add_display_name.sql in Supabase.",
      };
    }

    console.error("updateDisplayNameAction:", error.message);
    return { success: false, error: "Could not save your display name. Please try again." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  revalidatePath("/admin");

  return { success: true };
}
