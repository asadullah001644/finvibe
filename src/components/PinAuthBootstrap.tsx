"use client";

import { useLayoutEffect } from "react";
import {
  clearPinTabBootstrapCookie,
  markPinTabUnlocked,
  readPinTabBootstrapUserId,
} from "@/lib/pinTabSession";

/** After password login, unlock PIN for this tab only (sessionStorage). */
export default function PinAuthBootstrap() {
  useLayoutEffect(() => {
    const userId = readPinTabBootstrapUserId();
    if (!userId) {
      return;
    }

    markPinTabUnlocked(userId);
    clearPinTabBootstrapCookie();
  }, []);

  return null;
}
