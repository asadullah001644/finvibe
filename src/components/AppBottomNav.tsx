"use client";

import Link from "next/link";
import { Calendar, LayoutDashboard, Sparkles, Tags } from "lucide-react";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import { APP_TABS, buildMonthUrl, type AppTab } from "@/lib/navigation";

const TAB_ICONS = {
  overview: LayoutDashboard,
  categories: Tags,
  calendar: Calendar,
  insights: Sparkles,
} as const;

interface AppBottomNavProps {
  activeTab: AppTab;
  currentMonthKey: string;
}

interface NavTabLinkProps {
  href: string;
  isActive: boolean;
  label: string;
  icon: typeof LayoutDashboard;
}

function NavTabLink({ href, isActive, label, icon: Icon }: NavTabLinkProps) {
  const { navigate } = useAppNavigation();

  return (
    <Link
      href={href}
      onClick={(event) => {
        event.preventDefault();
        navigate(href);
      }}
      className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors sm:text-xs ${
        isActive
          ? "bg-neonViolet/15 text-neonViolet"
          : "text-zinc-500 hover:bg-card hover:text-zinc-300"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 2} />
      {label}
    </Link>
  );
}

export default function AppBottomNav({
  activeTab,
  currentMonthKey,
}: AppBottomNavProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-cardBorder/80 bg-background/95 backdrop-blur-xl"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-4 gap-1 px-2 py-2">
        {APP_TABS.map((tab) => (
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
