"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import NavigationLoadingOverlay from "@/components/NavigationLoadingOverlay";

interface NavigationContextValue {
  navigate: (href: string) => void;
  isNavigating: boolean;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function useAppNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useAppNavigation must be used within NavigationLoadingProvider");
  }
  return context;
}

function buildLocationKey(pathname: string, searchParams: URLSearchParams): string {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export default function NavigationLoadingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const targetHrefRef = useRef<string | null>(null);

  const locationKey = buildLocationKey(pathname, searchParams);

  useEffect(() => {
    if (!isNavigating || !targetHrefRef.current) {
      return;
    }

    const targetPath = targetHrefRef.current.split("?")[0] ?? targetHrefRef.current;
    const targetQuery = targetHrefRef.current.includes("?")
      ? targetHrefRef.current.slice(targetHrefRef.current.indexOf("?") + 1)
      : "";
    const targetParams = new URLSearchParams(targetQuery);
    const targetKey = buildLocationKey(targetPath, targetParams);

    if (locationKey === targetKey && !isPending) {
      setIsNavigating(false);
      targetHrefRef.current = null;
    }
  }, [isNavigating, isPending, locationKey]);

  const navigate = useCallback(
    (href: string) => {
      if (href === locationKey || href === targetHrefRef.current) {
        return;
      }

      targetHrefRef.current = href;
      setIsNavigating(true);

      startTransition(() => {
        router.push(href);
      });
    },
    [locationKey, router],
  );

  const showOverlay = isNavigating || isPending;

  return (
    <NavigationContext.Provider value={{ navigate, isNavigating: showOverlay }}>
      {children}
      {showOverlay && <NavigationLoadingOverlay />}
    </NavigationContext.Provider>
  );
}
