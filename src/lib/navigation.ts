export type AppTab = "overview" | "categories" | "calendar" | "insights";

export const APP_TABS: Array<{
  id: AppTab;
  label: string;
  href: string;
}> = [
  { id: "overview", label: "Overview", href: "/" },
  { id: "categories", label: "Categories", href: "/categories" },
  { id: "calendar", label: "Calendar", href: "/calendar" },
  { id: "insights", label: "Insights", href: "/insights" },
];

export function buildMonthUrl(
  pathname: string,
  monthKey: string,
  extraParams?: Record<string, string | string[] | undefined>,
): string {
  const params = new URLSearchParams({ month: monthKey });

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (!value) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          if (item) {
            params.append(key, item);
          }
        }
        continue;
      }

      params.set(key, value);
    }
  }

  return `${pathname}?${params.toString()}`;
}

export function buildCategoriesUrl(
  monthKey: string,
  options?: { group?: string; category?: string; categories?: string[] },
): string {
  const categories =
    options?.categories ??
    (options?.category ? [options.category] : undefined);

  return buildMonthUrl("/categories", monthKey, {
    group: options?.group,
    category: categories,
  });
}

export function getActiveTabFromPathname(pathname: string): AppTab {
  if (pathname.startsWith("/categories")) {
    return "categories";
  }

  if (pathname.startsWith("/calendar")) {
    return "calendar";
  }

  if (pathname.startsWith("/insights")) {
    return "insights";
  }

  return "overview";
}
