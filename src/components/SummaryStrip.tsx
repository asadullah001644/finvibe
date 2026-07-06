"use client";

import { computeBudgetMetrics, type BudgetMetrics } from "@/lib/budgetMetrics";
import { formatCompactCurrency, formatCurrency } from "@/lib/currency";

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

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-cardBorder bg-card/60 px-2.5 py-2.5 text-center">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 text-sm font-semibold leading-tight ${tone}`}>{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-cardBorder/60 bg-card/30 px-3 py-2.5">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xs font-medium text-zinc-400">{value}</span>
    </div>
  );
}

function MobileSummary({
  metrics,
  spendableTone,
}: {
  metrics: BudgetMetrics;
  spendableTone: string;
}) {
  const isOver = metrics.spendableRemaining < 0;
  const spentPercent =
    metrics.spendLimit > 0
      ? Math.min((metrics.totalSpent / metrics.spendLimit) * 100, 100)
      : 0;

  return (
    <div className="space-y-3 sm:hidden">
      <div
        className={`rounded-2xl border px-4 py-4 ${
          isOver
            ? "border-neonCrimson/30 bg-neonCrimson/5"
            : "border-neonEmerald/30 bg-neonEmerald/5"
        }`}
      >
        <p
          className={`text-xs font-medium uppercase tracking-[0.2em] ${
            isOver ? "text-neonCrimson/80" : "text-neonEmerald/80"
          }`}
        >
          Left to spend
        </p>
        <p className={`mt-1 text-3xl font-bold tracking-tight ${spendableTone}`}>
          {formatCurrency(metrics.spendableRemaining)}
        </p>

        {metrics.spendLimit > 0 && (
          <>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-background">
              <div
                className={`h-full rounded-full transition-all ${
                  isOver ? "bg-neonCrimson" : "bg-neonViolet"
                }`}
                style={{ width: `${spentPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {formatCurrency(metrics.totalSpent)} spent of{" "}
              {formatCurrency(metrics.spendLimit)} limit
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniStat
          label="Spent"
          value={formatCompactCurrency(metrics.totalSpent)}
          tone="text-neonCrimson"
        />
        <MiniStat
          label="Limit"
          value={formatCompactCurrency(metrics.spendLimit)}
          tone="text-neonViolet"
        />
        <MiniStat
          label="Salary"
          value={formatCompactCurrency(metrics.salary)}
          tone="text-zinc-200"
        />
      </div>

      <div className="space-y-2">
        <DetailRow
          label="Savings goal"
          value={formatCurrency(metrics.savingsGoal)}
        />
        <DetailRow
          label="Account balance"
          value={formatCurrency(metrics.accountBalance)}
        />
      </div>
    </div>
  );
}

function DesktopSummary({ cards }: { cards: SummaryCard[] }) {
  return (
    <div className="hidden grid-cols-3 gap-3 sm:grid xl:grid-cols-6 xl:gap-4">
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
                  ? "text-xs text-neonEmerald/80 lg:text-[11px]"
                  : isMuted
                    ? "text-xs tracking-[0.16em] text-zinc-600 lg:text-[10px]"
                    : "text-xs text-zinc-500 lg:text-[11px]"
              }`}
            >
              {item.label}
            </p>
            {item.subtitle && (
              <p className="mt-0.5 text-[10px] text-zinc-600">{item.subtitle}</p>
            )}
            <p
              className={`mt-1 font-semibold ${item.tone} ${
                isHighlight
                  ? "text-2xl font-bold"
                  : isMuted
                    ? "text-base font-medium"
                    : "text-lg"
              }`}
            >
              {item.value}
            </p>
          </div>
        );
      })}
    </div>
  );
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
      <MobileSummary metrics={metrics} spendableTone={spendableTone} />
      <DesktopSummary cards={cards} />
    </section>
  );
}
