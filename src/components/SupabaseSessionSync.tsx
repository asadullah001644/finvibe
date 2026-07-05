"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export default function SupabaseSessionSync() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function refreshSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return;
      }

      const expiresAt = session.expires_at ?? 0;
      const secondsLeft = expiresAt - Math.floor(Date.now() / 1000);

      if (secondsLeft < 300) {
        await supabase.auth.getUser();
      }
    }

    void refreshSession();

    const intervalId = window.setInterval(() => {
      void refreshSession();
    }, REFRESH_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshSession();
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
