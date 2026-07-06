"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { getChildCategoryName } from "@/lib/constants";
import type { CategoryGroup } from "@/lib/types";

export function categoryChipClass(isSelected: boolean): string {
  return [
    "min-h-11 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-150",
    isSelected
      ? "border-neonViolet/70 bg-neonViolet/15 text-neonViolet shadow-[inset_0_0_0_1px_rgba(139,92,246,0.25),0_0_16px_rgba(139,92,246,0.1)]"
      : "border-cardBorder/80 bg-background/50 text-zinc-300 hover:border-neonViolet/35 hover:bg-card/80",
  ].join(" ");
}

export function groupFilterChipClass(isActive: boolean): string {
  return [
    "min-h-11 rounded-xl border px-3 py-2.5 text-center text-sm font-medium transition-all duration-150",
    isActive
      ? "border-neonViolet/70 bg-neonViolet/15 text-neonViolet"
      : "border-cardBorder/80 bg-background/50 text-zinc-400 hover:border-neonViolet/35 hover:text-zinc-200",
  ].join(" ");
}

export const categorySectionLabelClass =
  "mb-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-600";

interface CategoryGroupAccordionProps {
  label: string;
  items: string[];
  mode: "single" | "multiple";
  selectedCategory?: string;
  selectedCategories?: string[];
  onSelect: (category: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function CategoryGroupAccordion({
  label,
  items,
  mode,
  selectedCategory = "",
  selectedCategories = [],
  onSelect,
  isOpen,
  onToggle,
  disabled = false,
}: CategoryGroupAccordionProps) {
  const selectedItemsInGroup =
    mode === "single"
      ? items.includes(selectedCategory)
        ? [selectedCategory]
        : []
      : items.filter((item) => selectedCategories.includes(item));

  const hasSelection = selectedItemsInGroup.length > 0;

  const selectionLabel =
    selectedItemsInGroup.length === 1
      ? getChildCategoryName(selectedItemsInGroup[0]!)
      : selectedItemsInGroup.length > 1
        ? `${selectedItemsInGroup.length} selected`
        : null;

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-colors ${
        hasSelection
          ? "border-neonViolet/40 bg-neonViolet/[0.06]"
          : "border-cardBorder/80 bg-background/40"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors hover:bg-white/[0.02] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
              isOpen ? "rotate-0" : "-rotate-90"
            }`}
          />
          <span
            className={`text-sm font-semibold ${
              hasSelection ? "text-neonViolet" : "text-zinc-200"
            }`}
          >
            {label}
          </span>
        </span>
        {selectionLabel && (
          <span className="truncate rounded-full border border-neonViolet/25 bg-neonViolet/10 px-2.5 py-0.5 text-xs font-medium text-neonViolet">
            {selectionLabel}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-cardBorder/60 px-3 pb-3 pt-2.5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {items.map((item) => {
                  const isSelected =
                    mode === "single"
                      ? selectedCategory === item
                      : selectedCategories.includes(item);

                  return (
                    <button
                      key={item}
                      type="button"
                      disabled={disabled}
                      onClick={() => onSelect(item)}
                      className={`${categoryChipClass(isSelected)} text-center text-xs sm:text-sm disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {getChildCategoryName(item)}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export interface CategoryPickerPanelProps {
  groups: CategoryGroup[];
  mode: "single" | "multiple";
  selectedCategory?: string;
  selectedCategories?: string[];
  onSelect: (category: string) => void;
  disabled?: boolean;
}

export function CategoryPickerPanel({
  groups,
  mode,
  selectedCategory = "",
  selectedCategories = [],
  onSelect,
  disabled = false,
}: CategoryPickerPanelProps) {
  const parentGroups = groups.filter((group) => group.label);
  const standaloneItems = groups
    .filter((group) => !group.label)
    .flatMap((group) => group.items);

  const selectedParent =
    mode === "single"
      ? (parentGroups.find((group) => group.items.includes(selectedCategory))
          ?.label ?? null)
      : (parentGroups.find((group) =>
          group.items.some((item) => selectedCategories.includes(item)),
        )?.label ?? null);

  const [openParent, setOpenParent] = useState<string | null>(selectedParent);

  useEffect(() => {
    if (selectedParent) {
      setOpenParent(selectedParent);
    }
  }, [selectedParent]);

  const handleToggleParent = (label: string) => {
    setOpenParent((current) => (current === label ? null : label));
  };

  return (
    <div className="space-y-4">
      {parentGroups.length > 0 && (
        <div className="space-y-2">
          {parentGroups.map((group) => (
            <CategoryGroupAccordion
              key={group.label}
              label={group.label!}
              items={group.items}
              mode={mode}
              selectedCategory={selectedCategory}
              selectedCategories={selectedCategories}
              onSelect={onSelect}
              isOpen={openParent === group.label}
              onToggle={() => handleToggleParent(group.label!)}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {standaloneItems.length > 0 && (
        <div>
          {parentGroups.length > 0 && (
            <p className={categorySectionLabelClass}>General</p>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {standaloneItems.map((item) => {
              const isSelected =
                mode === "single"
                  ? selectedCategory === item
                  : selectedCategories.includes(item);

              return (
                <button
                  key={item}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(item)}
                  className={`${categoryChipClass(isSelected)} text-center text-xs sm:text-sm disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
