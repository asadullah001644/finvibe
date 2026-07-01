import { format, parse, subMonths } from "date-fns";

export function resolveMonthKey(monthParam?: string): string {
  const fallback = format(new Date(), "yyyy-MM");

  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
    return fallback;
  }

  const parsed = parse(monthParam, "yyyy-MM", new Date());

  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return monthParam;
}

export function monthKeyToDate(monthKey: string): Date {
  return parse(monthKey, "yyyy-MM", new Date());
}

export function formatMonthLabel(monthKey: string): string {
  return format(monthKeyToDate(monthKey), "MMMM yyyy");
}

export function getPreviousMonthKey(monthKey: string): string {
  return format(subMonths(monthKeyToDate(monthKey), 1), "yyyy-MM");
}

export function getMonthContextFromKey(monthKey: string, referenceDate?: Date) {
  const parsed = parseMonthKey(monthKey);
  const { year, monthIndex } = parsed;
  const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const now = referenceDate ?? new Date();
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() === monthIndex;

  const currentDay = isCurrentMonth ? now.getDate() : totalDaysInMonth;

  return { year, monthIndex, totalDaysInMonth, currentDay, isCurrentMonth };
}

function parseMonthKey(monthKey: string): { year: number; monthIndex: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);

  if (!match) {
    const now = new Date();
    return { year: now.getFullYear(), monthIndex: now.getMonth() };
  }

  return {
    year: Number.parseInt(match[1], 10),
    monthIndex: Number.parseInt(match[2], 10) - 1,
  };
}
