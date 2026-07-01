"use client";

import React, { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { computeBudgetMetrics } from "@/lib/budgetMetrics";
import { formatCompactCurrency, formatCurrency } from "@/lib/currency";
import { getMonthContextFromKey } from "@/lib/month";

interface BurnRateGraphProps {
  monthKey: string;
  salary: number;
  savingsGoal: number;
  expenses: Array<{ amount: number; date: Date }>;
}

interface ChartPoint {
  day: number;
  label: string;
  actual: number;
  ideal: number;
  overage: number;
}

function normalizeExpenseDate(date: Date | string): Date {
  return date instanceof Date ? date : new Date(date);
}

function getMonthContext(monthKey: string) {
  return getMonthContextFromKey(monthKey);
}

function buildChartData(
  monthKey: string,
  salary: number,
  savingsGoal: number,
  expenses: BurnRateGraphProps["expenses"],
): {
  chartData: ChartPoint[];
  totalSpent: number;
  spendLimit: number;
  allowedDailyPace: number;
  averageDailyBurn: number;
  spendableRemaining: number;
  isRunwayCritical: boolean;
  yAxisMax: number;
} {
  const { year, monthIndex, totalDaysInMonth, currentDay } =
    getMonthContext(monthKey);
  const month = monthIndex;
  const { spendLimit } = computeBudgetMetrics(salary, savingsGoal, 0);
  const allowedDailyPace = spendLimit / totalDaysInMonth;

  const dailyTotals = Array.from({ length: totalDaysInMonth }, () => 0);

  for (const expense of expenses) {
    const expenseDate = normalizeExpenseDate(expense.date);

    if (
      expenseDate.getFullYear() !== year ||
      expenseDate.getMonth() !== month ||
      Number.isNaN(expenseDate.getTime())
    ) {
      continue;
    }

    const dayIndex = expenseDate.getDate() - 1;
    dailyTotals[dayIndex] += expense.amount;
  }

  let runningActual = 0;
  const chartData: ChartPoint[] = [];

  for (let day = 1; day <= totalDaysInMonth; day += 1) {
    runningActual += dailyTotals[day - 1];
    const ideal = allowedDailyPace * day;
    const actual = runningActual;
    const overage = Math.max(actual - ideal, 0);

    chartData.push({
      day,
      label: `Day ${day}`,
      actual,
      ideal,
      overage,
    });
  }

  const totalSpent = dailyTotals.reduce((sum, amount) => sum + amount, 0);
  const averageDailyBurn =
    currentDay > 0 ? totalSpent / currentDay : totalSpent;
  const { spendableRemaining } = computeBudgetMetrics(
    salary,
    savingsGoal,
    totalSpent,
  );
  const isRunwayCritical = spendableRemaining <= 0;
  const yAxisMax = Math.max(spendLimit, totalSpent);

  return {
    chartData,
    totalSpent,
    spendLimit,
    allowedDailyPace,
    averageDailyBurn,
    spendableRemaining,
    isRunwayCritical,
    yAxisMax,
  };
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; dataKey?: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const actual = payload.find((entry) => entry.dataKey === "actual")?.value ?? 0;
  const ideal = payload.find((entry) => entry.dataKey === "ideal")?.value ?? 0;
  const isOverPace = actual > ideal;

  return (
    <div className="rounded-xl border border-cardBorder bg-card/95 px-4 py-3 shadow-[0_0_24px_rgba(139,92,246,0.12)] backdrop-blur-md">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
      <p className="text-sm text-neonViolet">
        Actual: <span className="font-semibold">{formatCurrency(actual)}</span>
      </p>
      <p className="text-sm text-zinc-400">
        Ideal pace:{" "}
        <span className="font-semibold">{formatCurrency(ideal)}</span>
      </p>
      {isOverPace && (
        <p className="mt-2 text-xs font-medium text-neonCrimson">
          +{formatCurrency(actual - ideal)} above target velocity
        </p>
      )}
    </div>
  );
}

export default function BurnRateGraph({
  monthKey,
  salary,
  savingsGoal,
  expenses,
}: BurnRateGraphProps) {
  const analytics = useMemo(
    () => buildChartData(monthKey, salary, savingsGoal, expenses),
    [monthKey, salary, savingsGoal, expenses],
  );

  const {
    chartData,
    spendLimit,
    allowedDailyPace,
    averageDailyBurn,
    spendableRemaining,
    isRunwayCritical,
    yAxisMax,
  } = analytics;

  const velocityDelta = averageDailyBurn - allowedDailyPace;
  const isVelocityCritical = velocityDelta > 0;

  return (
    <section className="w-full">
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-cardBorder bg-card px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-zinc-500">
            Velocity Indicator
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p
                className={`text-xl font-semibold ${
                  isVelocityCritical ? "text-neonCrimson" : "text-neonEmerald"
                }`}
              >
                {formatCurrency(averageDailyBurn)}
                <span className="text-sm font-normal text-zinc-500"> / day</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">Current burn rate</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-zinc-300">
                {formatCurrency(allowedDailyPace)}
                <span className="text-xs text-zinc-500"> / day</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">Allowed target pace</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-cardBorder bg-card px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-zinc-500">
            Current Runway
          </p>
          <motion.p
            animate={
              isRunwayCritical
                ? { opacity: [1, 0.45, 1] }
                : { opacity: 1 }
            }
            transition={
              isRunwayCritical
                ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                : undefined
            }
            className={`mt-3 text-2xl font-semibold ${
              isRunwayCritical ? "text-neonCrimson" : "text-neonEmerald"
            }`}
          >
            {formatCurrency(spendableRemaining)}
          </motion.p>
          <p className="mt-1 text-xs text-zinc-500">
            Spendable remaining of {formatCurrency(spendLimit)} limit
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-cardBorder bg-card/60 p-3 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-4 px-1">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-neonViolet/80">
              Burn Rate Telemetry
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Cumulative spend vs. ideal linear pace
            </p>
          </div>
          <div className="hidden items-center gap-4 text-xs text-zinc-500 sm:flex">
            <span className="flex items-center gap-2">
              <span className="h-0.5 w-5 rounded-full bg-neonViolet shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
              Actual
            </span>
            <span className="flex items-center gap-2">
              <span className="h-0.5 w-5 rounded-full border border-dashed border-[#27272A]" />
              Ideal pace
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-neonCrimson/25" />
              Over-pace zone
            </span>
          </div>
        </div>

        <div className="h-72 w-full sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="overageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0.05} />
                </linearGradient>
                <filter id="violetGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow
                    dx="0"
                    dy="0"
                    stdDeviation="3"
                    floodColor="#8B5CF6"
                    floodOpacity="0.65"
                  />
                </filter>
              </defs>

              <CartesianGrid
                stroke="#27272A"
                strokeDasharray="4 6"
                vertical={false}
              />

              <XAxis
                dataKey="day"
                tick={{ fill: "#71717A", fontSize: 11 }}
                axisLine={{ stroke: "#27272A" }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
              />

              <YAxis
                domain={[0, yAxisMax]}
                tick={{ fill: "#71717A", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => formatCompactCurrency(value)}
                width={48}
              />

              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#3F3F46" }} />

              <Area
                type="monotone"
                dataKey="ideal"
                stackId="alert"
                stroke="none"
                fill="transparent"
                isAnimationActive={false}
              />

              <Area
                type="monotone"
                dataKey="overage"
                stackId="alert"
                stroke="none"
                fill="url(#overageGradient)"
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="ideal"
                stroke="#27272A"
                strokeWidth={2}
                strokeDasharray="6 6"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="actual"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "#8B5CF6",
                  stroke: "#09090B",
                  strokeWidth: 2,
                }}
                style={{ filter: "url(#violetGlow)" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
