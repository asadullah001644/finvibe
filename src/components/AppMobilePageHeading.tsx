"use client";

import { usePathname } from "next/navigation";
import { APP_TABS, getActiveTabFromPathname } from "@/lib/navigation";

interface AppMobilePageHeadingProps {
  carriedFromMonthLabel?: string;
}

export default function AppMobilePageHeading({
  carriedFromMonthLabel,
}: AppMobilePageHeadingProps) {
  const pathname = usePathname();
  const activeTab = APP_TABS.find(
    (tab) => getActiveTabFromPathname(pathname) === tab.id,
  );
  const pageTitle = activeTab?.label ?? "Overview";

  return (
    <div className="px-4 pt-4 lg:hidden">
      <h1 className="text-xl font-semibold text-zinc-100">{pageTitle}</h1>
      {carriedFromMonthLabel && (
        <p className="mt-1 text-xs text-zinc-500">
          Includes carry-forward from {carriedFromMonthLabel}
        </p>
      )}
    </div>
  );
}
