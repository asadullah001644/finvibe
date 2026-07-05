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

interface NavigationContextValue {
  navigate: (href: string) => void;
  refresh: () => Promise<void>;
  isNavigating: boolean;
  isRefreshing: boolean;
  setDeferredLoading: (loading: boolean) => void;
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
  const [deferredLoadingCount, setDeferredLoadingCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const targetHrefRef = useRef<string | null>(null);
  const refreshResolveRef = useRef<(() => void) | null>(null);

  const setDeferredLoading = useCallback((loading: boolean) => {
    setDeferredLoadingCount((count) =>
      loading ? count + 1 : Math.max(0, count - 1),
    );
  }, []);

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

  useEffect(() => {
    if (isPending || !refreshResolveRef.current) {
      return;
    }

    refreshResolveRef.current();
    refreshResolveRef.current = null;
  }, [isPending]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);

    return new Promise<void>((resolve) => {
      refreshResolveRef.current = () => {
        setIsRefreshing(false);
        resolve();
      };

      startTransition(() => {
        router.refresh();
      });
    });
  }, [router]);

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

  const showOverlay =
    isNavigating || isPending || deferredLoadingCount > 0;

  return (
    <NavigationContext.Provider
      value={{
        navigate,
        refresh,
        isNavigating: showOverlay,
        isRefreshing,
        setDeferredLoading,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}
