"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Calendar, LayoutDashboard, Loader2, Sparkles, Tags } from "lucide-react";
import { QuickLogNavButton } from "@/components/QuickLogFAB";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import {
  APP_TABS,
  buildMonthUrl,
  getActiveTabFromPathname,
} from "@/lib/navigation";
import { resolveMonthKey } from "@/lib/month";

const TAB_ICONS = {
  overview: LayoutDashboard,
  categories: Tags,
  calendar: Calendar,
  insights: Sparkles,
} as const;

interface NavTabLinkProps {
  href: string;
  isActive: boolean;
  label: string;
  icon: typeof LayoutDashboard;
}

function NavTabLink({ href, isActive, label, icon: Icon }: NavTabLinkProps) {
  const { navigate, pendingHref } = useAppNavigation();
  const isPending = pendingHref === href;

  return (
    <Link
      href={href}
      prefetch={false}
      data-app-nav="manual"
      onClick={(event) => {
        event.preventDefault();
        navigate(href);
      }}
      aria-busy={isPending}
      className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-xs font-medium transition-colors sm:px-2 sm:text-xs lg:gap-1 lg:px-1 lg:py-2 lg:text-[10px] ${
        isActive
          ? "bg-neonViolet/15 text-neonViolet"
          : isPending
            ? "bg-neonViolet/10 text-neonViolet/80"
            : "text-zinc-500 hover:bg-card hover:text-zinc-300"
      } ${isPending ? "pointer-events-none" : ""}`}
      aria-current={isActive ? "page" : undefined}
    >
      {isPending ? (
        <Loader2 className="h-6 w-6 animate-spin lg:h-5 lg:w-5" aria-hidden="true" />
      ) : (
        <Icon className="h-6 w-6 lg:h-5 lg:w-5" strokeWidth={isActive ? 2.25 : 2} />
      )}
      {label}
    </Link>
  );
}

export default function AppBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = getActiveTabFromPathname(pathname);
  const currentMonthKey = resolveMonthKey(searchParams.get("month") ?? undefined);
  const leadingTabs = APP_TABS.slice(0, 2);
  const trailingTabs = APP_TABS.slice(2);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-cardBorder/80 bg-background/95 backdrop-blur-xl"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-5 items-end gap-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:gap-1 sm:px-2 lg:gap-0 lg:px-1">
        {leadingTabs.map((tab) => (
          <NavTabLink
            key={tab.id}
            href={buildMonthUrl(tab.href, currentMonthKey)}
            isActive={activeTab === tab.id}
            label={tab.label}
            icon={TAB_ICONS[tab.id]}
          />
        ))}

        <div className="flex items-end justify-center pb-1">
          <QuickLogNavButton />
        </div>

        {trailingTabs.map((tab) => (
          <NavTabLink
            key={tab.id}
            href={buildMonthUrl(tab.href, currentMonthKey)}
            isActive={activeTab === tab.id}
            label={tab.label}
            icon={TAB_ICONS[tab.id]}
          />
        ))}
      </div>
    </nav>
  );
}
