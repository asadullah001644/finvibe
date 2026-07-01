const pkrFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const pkrFormatterPrecise = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return pkrFormatter.format(value);
}

export function formatCurrencyPrecise(value: number): string {
  return pkrFormatterPrecise.format(value);
}

export function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `Rs ${Math.round(value / 1000)}k`;
  }

  return pkrFormatter.format(value);
}
