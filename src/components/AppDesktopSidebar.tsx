"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Calendar,
  LayoutDashboard,
  Settings,
  Shield,
  Sparkles,
  Tags,
} from "lucide-react";
import AppLogo from "@/components/AppLogo";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import {
  APP_TABS,
  buildMonthUrl,
  getActiveTabFromPathname,
} from "@/lib/navigation";
import { resolveDisplayInitial } from "@/lib/profileDisplay";
import { resolveMonthKey } from "@/lib/month";

const TAB_ICONS = {
  overview: LayoutDashboard,
  categories: Tags,
  calendar: Calendar,
  insights: Sparkles,
} as const;

interface AppDesktopSidebarProps {
  userDisplayName: string;
  userEmail: string;
  isSuperAdmin: boolean;
}

export default function AppDesktopSidebar({
  userDisplayName,
  userEmail,
  isSuperAdmin,
}: AppDesktopSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { navigate } = useAppNavigation();
  const activeTab = getActiveTabFromPathname(pathname);
  const currentMonthKey = resolveMonthKey(searchParams.get("month") ?? undefined);
  const initial = resolveDisplayInitial(userDisplayName);

  return (
    <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:max-h-screen lg:w-72 lg:shrink-0 lg:self-start lg:flex-col lg:border-r lg:border-cardBorder/80 lg:bg-[#0C0C0F]/90 lg:backdrop-blur-xl">
      <div className="flex min-h-0 flex-1 flex-col px-5 py-6">
        <div className="shrink-0 px-1">
          <AppLogo showText size="md" />
        </div>

        <div className="mt-8 shrink-0 rounded-2xl border border-cardBorder/80 bg-card/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neonViolet/30 bg-neonViolet/10 text-sm font-semibold text-neonViolet">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-100">{userDisplayName}</p>
              <p className="truncate text-xs text-zinc-500">{userEmail}</p>
            </div>
          </div>
        </div>

        <nav
          aria-label="Desktop navigation"
          className="mt-8 min-h-0 flex-1 space-y-1 overflow-y-auto"
        >
          {APP_TABS.map((tab) => {
            const Icon = TAB_ICONS[tab.id];
            const href = buildMonthUrl(tab.href, currentMonthKey);
            const isActive = activeTab === tab.id;

            return (
              <Link
                key={tab.id}
                href={href}
                prefetch={false}
                data-app-nav="manual"
                onClick={(event) => {
                  event.preventDefault();
                  navigate(href);
                }}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border border-neonViolet/30 bg-neonViolet/10 text-neonViolet"
                    : "text-zinc-400 hover:bg-card/60 hover:text-zinc-100"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4" strokeWidth={isActive ? 2.25 : 2} />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 shrink-0 space-y-1 border-t border-cardBorder/60 pt-5">
          <Link
            href="/settings"
            prefetch
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-card/60 hover:text-zinc-100"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          {isSuperAdmin && (
            <Link
              href="/admin"
              prefetch
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-card/60 hover:text-neonViolet"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
