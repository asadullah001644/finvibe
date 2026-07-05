"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";

function ExpenseSuspenseFallback() {
  const { setDeferredLoading } = useAppNavigation();

  useEffect(() => {
    setDeferredLoading(true);
    return () => setDeferredLoading(false);
  }, [setDeferredLoading]);

  return null;
}

export default function ExpenseContentSuspense({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<ExpenseSuspenseFallback />}>{children}</Suspense>
  );
}
