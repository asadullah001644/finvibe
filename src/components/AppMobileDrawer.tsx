"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Loader2, Settings, Shield } from "lucide-react";
import { APP_TAB_ICONS } from "@/components/AppNavIcons";
import BudgetToolButtons from "@/components/BudgetToolButtons";
import InstallAppButton from "@/components/InstallAppButton";
import LockButton from "@/components/LockButton";
import SignOutButton from "@/components/SignOutButton";
import AppLogo from "@/components/AppLogo";
import { ModalBackdrop, ModalCloseButton } from "@/components/ui/modal";
import type { ModalAction } from "@/lib/modalActions";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import {
  APP_TABS,
  buildMonthUrl,
  getActiveTabFromPathname,
} from "@/lib/navigation";
import { resolveDisplayInitial } from "@/lib/profileDisplay";
import { resolveMonthKey } from "@/lib/month";

interface AppMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonthKey: string;
  monthLabel: string;
  carriedFromMonthLabel?: string;
  userDisplayName: string;
  userEmail: string;
  isSuperAdmin: boolean;
  hasLimitsSet: boolean;
  pinLockEnabled: boolean;
  onOpenIncome: () => void;
  onOpenCategories: () => void;
  onOpenRecurring: () => void;
  pendingModalAction?: ModalAction | null;
  onMonthChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AppMobileDrawer({
  isOpen,
  onClose,
  currentMonthKey,
  monthLabel,
  carriedFromMonthLabel,
  userDisplayName,
  userEmail,
  isSuperAdmin,
  hasLimitsSet,
  pinLockEnabled,
  onOpenIncome,
  onOpenCategories,
  onOpenRecurring,
  pendingModalAction = null,
  onMonthChange,
}: AppMobileDrawerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { navigate, pendingHref } = useAppNavigation();
  const activeTab = getActiveTabFromPathname(pathname);
  const currentMonthKeyFromUrl = resolveMonthKey(searchParams.get("month") ?? undefined);
  const [mounted, setMounted] = useState(false);
  const monthInputRef = useRef<HTMLInputElement>(null);
  const initial = resolveDisplayInitial(userDisplayName);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleMonthFieldClick = (event: React.MouseEvent<HTMLLabelElement>) => {
    const input = monthInputRef.current;
    if (input && typeof input.showPicker === "function") {
      event.preventDefault();
      input.showPicker();
    }
  };

  const openIncome = () => {
    onClose();
    onOpenIncome();
  };

  const openCategories = () => {
    onClose();
    onOpenCategories();
  };

  const openRecurring = () => {
    onClose();
    onOpenRecurring();
  };

  const drawer = (
    <AnimatePresence>
      {isOpen && (
        <>
          <ModalBackdrop onClose={onClose} label="Close menu" />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="App menu"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
            className="fixed inset-y-0 left-0 z-[201] flex w-[min(100vw-3rem,20rem)] flex-col border-r border-cardBorder bg-[#0C0C0F] shadow-[16px_0_48px_rgba(0,0,0,0.45)]"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-cardBorder/80 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <AppLogo showText size="sm" />
              <ModalCloseButton onClick={onClose} />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="rounded-2xl border border-cardBorder/80 bg-card/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neonViolet/30 bg-neonViolet/10 text-sm font-semibold text-neonViolet">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {userDisplayName}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{userEmail}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="app-drawer-month"
                  onClick={handleMonthFieldClick}
                  className="relative flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-cardBorder bg-card px-4 py-3.5 text-sm text-zinc-200 transition-colors hover:border-neonViolet has-[:focus-visible]:border-neonViolet"
                >
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                    Month
                  </span>
                  <span className="flex items-center gap-2 font-medium">
                    {monthLabel}
                    <Calendar className="h-4 w-4 shrink-0 text-zinc-400" />
                  </span>
                  <input
                    ref={monthInputRef}
                    id="app-drawer-month"
                    name="month"
                    type="month"
                    value={currentMonthKey}
                    onChange={onMonthChange}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 [color-scheme:dark]"
                    aria-label={`Select month, currently ${monthLabel}`}
                  />
                </label>
              </div>

              {carriedFromMonthLabel && (
                <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                  Includes carry-forward from{" "}
                  <span className="text-neonViolet">{carriedFromMonthLabel}</span>
                </p>
              )}

              <nav aria-label="Main navigation" className="mt-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                  Navigation
                </p>
                <div className="space-y-1">
                  {APP_TABS.map((tab) => {
                    const Icon = APP_TAB_ICONS[tab.id];
                    const href = buildMonthUrl(tab.href, currentMonthKeyFromUrl);
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
                          onClose();
                          navigate(href);
                        }}
                        aria-busy={isPending}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                          isActive
                            ? "border border-neonViolet/30 bg-neonViolet/10 text-neonViolet"
                            : isPending
                              ? "border border-neonViolet/20 bg-neonViolet/5 text-neonViolet/80"
                              : "text-zinc-300 hover:bg-card/60 hover:text-zinc-100"
                        } ${isPending ? "pointer-events-none" : ""}`}
                      >
                        {isPending ? (
                          <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
                        ) : (
                          <Icon
                            className={`h-5 w-5 shrink-0 ${isActive ? "text-neonViolet" : "text-zinc-400"}`}
                            strokeWidth={isActive ? 2.25 : 2}
                          />
                        )}
                        {tab.label}
                      </Link>
                    );
                  })}
                </div>
              </nav>

              <div className="mt-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                  Budget tools
                </p>
                <div className="flex flex-col gap-2">
                  <BudgetToolButtons
                    layout="drawer"
                    hasLimitsSet={hasLimitsSet}
                    loadingAction={pendingModalAction}
                    onOpenIncome={openIncome}
                    onOpenCategories={openCategories}
                    onOpenRecurring={openRecurring}
                  />
                </div>
              </div>

              <div className="mt-6 border-t border-cardBorder/60 pt-5">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                  Account
                </p>
                <div className="space-y-1">
                  <InstallAppButton onActivate={onClose} />
                  {(() => {
                    const settingsPending = pendingHref === "/settings";

                    return (
                      <Link
                        href="/settings"
                        prefetch={false}
                        data-app-nav="manual"
                        onClick={(event) => {
                          event.preventDefault();
                          onClose();
                          navigate("/settings");
                        }}
                        aria-busy={settingsPending}
                        className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                          settingsPending
                            ? "bg-neonViolet/10 text-neonViolet/80"
                            : "text-zinc-300 hover:bg-card/60 hover:text-zinc-100"
                        } ${settingsPending ? "pointer-events-none" : ""}`}
                      >
                        {settingsPending ? (
                          <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
                        ) : (
                          <Settings className="h-5 w-5 shrink-0 text-zinc-400" />
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
                            onClose();
                            navigate("/admin");
                          }}
                          aria-busy={adminPending}
                          className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                            adminPending
                              ? "bg-neonViolet/10 text-neonViolet/80"
                              : "text-zinc-300 hover:bg-card/60 hover:text-neonViolet"
                          } ${adminPending ? "pointer-events-none" : ""}`}
                        >
                          {adminPending ? (
                            <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
                          ) : (
                            <Shield className="h-5 w-5 shrink-0 text-zinc-400" />
                          )}
                          Admin
                        </Link>
                      );
                    })()}
                  {pinLockEnabled && (
                    <div className="px-1 [&_button]:w-full [&_button]:min-h-12 [&_button]:justify-start [&_button]:gap-3 [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-3 [&_button]:hover:bg-card/60">
                      <LockButton />
                    </div>
                  )}
                  <div className="px-1 [&_button]:w-full [&_button]:min-h-12 [&_button]:justify-start [&_button]:gap-3 [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-3 [&_button]:hover:bg-card/60">
                    <SignOutButton />
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) {
    return null;
  }

  return createPortal(drawer, document.body);
}
