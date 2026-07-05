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
  markContentReady: () => void;
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
  const [isRoutePending, startRouteTransition] = useTransition();
  const [isRefreshPending, startRefreshTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const targetHrefRef = useRef<string | null>(null);
  const refreshResolveRef = useRef<(() => void) | null>(null);
  const contentPendingRef = useRef(false);

  const locationKey = buildLocationKey(pathname, searchParams);

  const tryFinishNavigation = useCallback(() => {
    if (!isNavigating || !targetHrefRef.current || contentPendingRef.current) {
      return;
    }

    const targetPath = targetHrefRef.current.split("?")[0] ?? targetHrefRef.current;
    const targetQuery = targetHrefRef.current.includes("?")
      ? targetHrefRef.current.slice(targetHrefRef.current.indexOf("?") + 1)
      : "";
    const targetParams = new URLSearchParams(targetQuery);
    const targetKey = buildLocationKey(targetPath, targetParams);

    if (locationKey === targetKey && !isRoutePending) {
      setIsNavigating(false);
      targetHrefRef.current = null;
    }
  }, [isNavigating, isRoutePending, locationKey]);

  const markContentReady = useCallback(() => {
    if (!contentPendingRef.current) {
      return;
    }

    contentPendingRef.current = false;
    tryFinishNavigation();
  }, [tryFinishNavigation]);

  useEffect(() => {
    tryFinishNavigation();
  }, [tryFinishNavigation]);

  useEffect(() => {
    if (isRefreshPending || !refreshResolveRef.current) {
      return;
    }

    refreshResolveRef.current();
    refreshResolveRef.current = null;
  }, [isRefreshPending]);

  const refresh = useCallback(() => {
    return new Promise<void>((resolve) => {
      refreshResolveRef.current = resolve;

      startRefreshTransition(() => {
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
      contentPendingRef.current = true;
      setIsNavigating(true);

      startRouteTransition(() => {
        router.push(href);
      });
    },
    [locationKey, router],
  );

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (anchor.dataset.appNav === "manual") {
        return;
      }

      if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) {
        return;
      }

      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) {
        return;
      }

      const nextHref = buildLocationKey(url.pathname, url.searchParams);
      if (nextHref === locationKey) {
        return;
      }

      event.preventDefault();
      navigate(nextHref);
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [locationKey, navigate]);

  const showRouteOverlay = isNavigating || isRoutePending;

  return (
    <NavigationContext.Provider
      value={{
        navigate,
        refresh,
        isNavigating: showRouteOverlay,
        isRefreshing: isRefreshPending,
        markContentReady,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}
