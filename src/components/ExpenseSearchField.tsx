"use client";

import { Search, X } from "lucide-react";

interface ExpenseSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function ExpenseSearchField({
  value,
  onChange,
  className = "",
}: ExpenseSearchFieldProps) {
  return (
    <div className={`relative ${className}`}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
        aria-hidden="true"
      />
      <input
        type="text"
        inputMode="search"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search description or category"
        aria-label="Search expenses by description or category"
        className="h-11 w-full rounded-xl border border-cardBorder/80 bg-background/60 py-2.5 pl-10 pr-10 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-neonViolet/50 focus:ring-1 focus:ring-neonViolet/20"
      />
      {value.trim().length > 0 && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-background/80 hover:text-zinc-300"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
