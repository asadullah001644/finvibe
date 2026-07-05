"use client";

import { useLayoutEffect } from "react";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";

export default function NavigationContentReady() {
  const { markContentReady } = useAppNavigation();

  useLayoutEffect(() => {
    markContentReady();
  }, [markContentReady]);

  return null;
}
