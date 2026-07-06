"use client";

import { Suspense, type ReactNode } from "react";

export default function ExpenseContentSuspense({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
