"use client";

import { computeBudgetMetrics } from "@/lib/budgetMetrics";
import { formatCurrency } from "@/lib/currency";

interface SummaryStripProps {
  salary: number;
  savingsGoal: number;
  totalSpent: number;
}

type CardVariant = "default" | "highlight" | "muted";

interface SummaryCard {
  label: string;
  value: string;
  tone: string;
  variant: CardVariant;
  subtitle?: string;
}

export default function SummaryStrip({
  salary,
  savingsGoal,
  totalSpent,
}: SummaryStripProps) {
  const metrics = computeBudgetMetrics(salary, savingsGoal, totalSpent);

  const spendableTone =
    metrics.spendableRemaining < 0 ? "text-neonCrimson" : "text-neonEmerald";

  const cards: SummaryCard[] = [
    {
      label: "Spend Limit",
      value: formatCurrency(metrics.spendLimit),
      tone: "text-neonViolet",
      variant: "default",
    },
    {
      label: "Spent",
      value: formatCurrency(metrics.totalSpent),
      tone: "text-neonCrimson",
      variant: "default",
    },
    {
      label: "Spendable Remaining",
      value: formatCurrency(metrics.spendableRemaining),
      tone: spendableTone,
      variant: "highlight",
    },
    {
      label: "Savings Goal",
      value: formatCurrency(metrics.savingsGoal),
      tone: "text-zinc-300",
      variant: "default",
    },
    {
      label: "Salary",
      value: formatCurrency(metrics.salary),
      tone: "text-zinc-100",
      variant: "default",
    },
    {
      label: "Total Account Balance",
      value: formatCurrency(metrics.accountBalance),
      tone: "text-zinc-500",
      variant: "muted",
      subtitle: "(incl. savings)",
    },
  ];

  return (
    <section className="w-full">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6 xl:gap-4">
        {cards.map((item) => {
          const isHighlight = item.variant === "highlight";
          const isMuted = item.variant === "muted";

          return (
            <div
              key={item.label}
              className={`min-h-[5.75rem] rounded-xl px-4 py-3 ${
                isHighlight
                  ? "border border-neonEmerald/30 bg-neonEmerald/5"
                  : isMuted
                    ? "border border-cardBorder/60 bg-card/30"
                    : "border border-cardBorder bg-card/60"
              }`}
            >
              <p
                className={`font-medium uppercase tracking-[0.18em] ${
                  isHighlight
                    ? "text-[11px] text-neonEmerald/80"
                    : isMuted
                      ? "text-[10px] tracking-[0.16em] text-zinc-600"
                      : "text-[11px] text-zinc-500"
                }`}
              >
                {item.label}
              </p>
              {item.subtitle && (
                <p className="mt-0.5 text-[10px] text-zinc-600">{item.subtitle}</p>
              )}
              <p
                className={`mt-1 font-semibold ${item.tone} ${
                  isHighlight ? "text-2xl font-bold" : isMuted ? "text-base font-medium" : "text-lg"
                }`}
              >
                {item.value}
              </p>
            </div>
        );
      })}
      </div>
    </section>
  );
}
