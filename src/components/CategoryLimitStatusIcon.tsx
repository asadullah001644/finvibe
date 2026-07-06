import { CheckCircle2, CircleAlert, CircleCheck } from "lucide-react";
import type { CategoryLimitStatus } from "@/lib/categorySpend";

export const limitStatusLabels: Record<
  Exclude<CategoryLimitStatus, "none">,
  string
> = {
  remaining: "Budget remaining",
  atLimit: "Limit reached",
  over: "Over limit",
};

const limitStatusConfig: Record<
  Exclude<CategoryLimitStatus, "none">,
  {
    Icon: typeof CheckCircle2;
    className: string;
  }
> = {
  remaining: {
    Icon: CircleCheck,
    className: "text-neonEmerald/80",
  },
  atLimit: {
    Icon: CheckCircle2,
    className: "text-amber-400",
  },
  over: {
    Icon: CircleAlert,
    className: "text-neonCrimson",
  },
};

export default function CategoryLimitStatusIcon({
  status,
  className = "h-3.5 w-3.5",
}: {
  status: Exclude<CategoryLimitStatus, "none">;
  className?: string;
}) {
  const { Icon, className: toneClass } = limitStatusConfig[status];

  return (
    <Icon
      className={`shrink-0 ${toneClass} ${className}`}
      aria-hidden="true"
    />
  );
}
