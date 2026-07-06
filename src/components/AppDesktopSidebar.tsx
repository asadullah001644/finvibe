"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Calendar,
  Loader2,
  Settings,
  Shield,
} from "lucide-react";
import AppLogo from "@/components/AppLogo";
import { APP_TAB_ICONS } from "@/components/AppNavIcons";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import {
  APP_TABS,
  buildMonthUrl,
  getActiveTabFromPathname,
} from "@/lib/navigation";
import { resolveDisplayInitial } from "@/lib/profileDisplay";
import { resolveMonthKey } from "@/lib/month";

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
  const { navigate, pendingHref } = useAppNavigation();
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
            const Icon = APP_TAB_ICONS[tab.id];
            const href = buildMonthUrl(tab.href, currentMonthKey);
            const isActive = activeTab === tab.id;
            const isPending = pendingHref === href;

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
                aria-busy={isPending}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border border-neonViolet/30 bg-neonViolet/10 text-neonViolet"
                    : isPending
                      ? "border border-neonViolet/20 bg-neonViolet/5 text-neonViolet/80"
                      : "text-zinc-400 hover:bg-card/60 hover:text-zinc-100"
                } ${isPending ? "pointer-events-none" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Icon className="h-4 w-4" strokeWidth={isActive ? 2.25 : 2} />
                )}
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 shrink-0 space-y-1 border-t border-cardBorder/60 pt-5">
          {(() => {
            const settingsPending = pendingHref === "/settings";

            return (
              <Link
                href="/settings"
                prefetch={false}
                data-app-nav="manual"
                onClick={(event) => {
                  event.preventDefault();
                  navigate("/settings");
                }}
                aria-busy={settingsPending}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  settingsPending
                    ? "bg-neonViolet/10 text-neonViolet/80"
                    : "text-zinc-400 hover:bg-card/60 hover:text-zinc-100"
                } ${settingsPending ? "pointer-events-none" : ""}`}
              >
                {settingsPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
                Settings
              </Link>
            );
          })()}
          {isSuperAdmin &&
            (() => {
              const adminPending = pendingHref === "/admin";

              return (
                <Link
                  href="/admin"
                  prefetch={false}
                  data-app-nav="manual"
                  onClick={(event) => {
                    event.preventDefault();
                    navigate("/admin");
                  }}
                  aria-busy={adminPending}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    adminPending
                      ? "bg-neonViolet/10 text-neonViolet/80"
                      : "text-zinc-400 hover:bg-card/60 hover:text-neonViolet"
                  } ${adminPending ? "pointer-events-none" : ""}`}
                >
                  {adminPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  Admin
                </Link>
              );
            })()}
        </div>
      </div>
    </aside>
  );
}
