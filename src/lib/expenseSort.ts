interface SortableExpense {
  date: Date | string;
  createdAt?: Date;
}

function normalizeExpenseDate(date: Date | string): Date {
  return date instanceof Date ? date : new Date(date);
}

export function compareExpensesByRecency(
  left: SortableExpense,
  right: SortableExpense,
): number {
  const dateDiff =
    normalizeExpenseDate(right.date).getTime() -
    normalizeExpenseDate(left.date).getTime();

  if (dateDiff !== 0) {
    return dateDiff;
  }

  return (
    (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0)
  );
}
