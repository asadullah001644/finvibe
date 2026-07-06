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

export function formatHeatmapCellAmount(value: number): string {
  const abs = Math.abs(value);

  if (abs >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${millions >= 10 ? Math.round(millions) : millions.toFixed(1).replace(/\.0$/, "")}M`;
  }

  if (abs >= 10_000) {
    return `${Math.round(value / 1_000)}k`;
  }

  if (abs >= 1_000) {
    const thousands = value / 1_000;
    return `${thousands >= 10 ? Math.round(thousands) : thousands.toFixed(1).replace(/\.0$/, "")}k`;
  }

  return String(Math.round(value));
}
