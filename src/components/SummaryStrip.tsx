"use client";

import { computeBudgetMetrics } from "@/lib/budgetMetrics";
import { formatCurrency } from "@/lib/currency";

interface SummaryStripProps {
  salary: number;
  savingsGoal: number;
  totalSpent: number;
}

export default function SummaryStrip({
  salary,
  savingsGoal,
  totalSpent,
}: SummaryStripProps) {
  const metrics = computeBudgetMetrics(salary, savingsGoal, totalSpent);

  const standardCards = [
    { label: "Salary", value: metrics.salary, tone: "text-zinc-100" },
    {
      label: "Savings Goal",
      value: metrics.savingsGoal,
      tone: "text-zinc-300",
    },
    {
      label: "Spend Limit",
      value: metrics.spendLimit,
      tone: "text-neonViolet",
    },
    { label: "Spent", value: metrics.totalSpent, tone: "text-neonCrimson" },
  ];

  const spendableTone =
    metrics.spendableRemaining < 0 ? "text-neonCrimson" : "text-neonEmerald";

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {standardCards.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-cardBorder bg-card/60 px-4 py-3"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
            {item.label}
          </p>
          <p className={`mt-1 text-lg font-semibold ${item.tone}`}>
            {formatCurrency(item.value)}
          </p>
        </div>
      ))}

      <div className="rounded-xl border border-neonEmerald/30 bg-neonEmerald/5 px-4 py-3 sm:col-span-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neonEmerald/80">
          Spendable Remaining
        </p>
        <p className={`mt-1 text-2xl font-bold ${spendableTone}`}>
          {formatCurrency(metrics.spendableRemaining)}
        </p>
      </div>

      <div className="rounded-xl border border-cardBorder/60 bg-card/30 px-4 py-3 sm:col-span-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">
          Total Account Balance
        </p>
        <p className="mt-0.5 text-[10px] text-zinc-600">(incl. savings)</p>
        <p className="mt-1 text-base font-medium text-zinc-500">
          {formatCurrency(metrics.accountBalance)}
        </p>
      </div>
    </section>
  );
}
