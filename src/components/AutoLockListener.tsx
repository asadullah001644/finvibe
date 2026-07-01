"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { lockSession } from "@/app/actions/aiAndAuthActions";

const AUTO_LOCK_MS = 5 * 60 * 1000;

export default function AutoLockListener() {
  const router = useRouter();
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }

      if (document.visibilityState !== "visible") {
        return;
      }

      const hiddenAt = hiddenAtRef.current;

      if (hiddenAt === null) {
        return;
      }

      hiddenAtRef.current = null;

      if (Date.now() - hiddenAt >= AUTO_LOCK_MS) {
        await lockSession();
        router.refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}
