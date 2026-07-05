"use client";

import { Suspense, type ReactNode } from "react";

export default function ExpenseContentSuspense({
  children,
}: {
  children: ReactNode;
}) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
