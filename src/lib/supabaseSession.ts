import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const REFRESH_WINDOW_SECONDS = 120;

export async function getSessionUserFromClient(
  supabase: SupabaseClient,
): Promise<User | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  }

  const expiresAt = session.expires_at ?? 0;
  const secondsLeft = expiresAt - Math.floor(Date.now() / 1000);

  if (secondsLeft >= REFRESH_WINDOW_SECONDS) {
    return session.user;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user) {
    return user;
  }

  if (secondsLeft <= 0 || error) {
    return null;
  }

  return session.user;
}
