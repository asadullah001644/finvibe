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
  extraParams?: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams({ month: monthKey });

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) {
        params.set(key, value);
      }
    }
  }

  return `${pathname}?${params.toString()}`;
}

export function buildCategoriesUrl(
  monthKey: string,
  options?: { group?: string; category?: string },
): string {
  return buildMonthUrl("/categories", monthKey, {
    group: options?.group,
    category: options?.category,
  });
}
