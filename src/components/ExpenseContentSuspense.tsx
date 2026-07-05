"use client";

import { Suspense, type ReactNode } from "react";
import NavigationContentReady from "@/components/NavigationContentReady";

export default function ExpenseContentSuspense({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <>
        {children}
        <NavigationContentReady />
      </>
    </Suspense>
  );
}
