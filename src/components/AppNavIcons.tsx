import { Calendar, LayoutDashboard, Sparkles, Tags } from "lucide-react";
import type { AppTab } from "@/lib/navigation";

export const APP_TAB_ICONS = {
  overview: LayoutDashboard,
  categories: Tags,
  calendar: Calendar,
  insights: Sparkles,
} as const satisfies Record<AppTab, typeof LayoutDashboard>;
