import {
  CATEGORY_SEPARATOR,
  DEFAULT_CATEGORIES,
  formatCategoryPath,
} from "@/lib/constants";

const MAX_LABEL_LENGTH = 48;

export interface CustomCategoryRecord {
  id: string;
  groupLabel: string | null;
  leafName: string;
  fullName: string;
  createdAt: string;
}

/** @deprecated Use CustomCategoryRecord */
export type UserCustomCategoryRecord = CustomCategoryRecord;

export function buildCustomCategoryFullName(
  groupLabel: string | null | undefined,
  leafName: string,
): string {
  const leaf = normalizeCategoryPart(leafName);
  const group = groupLabel?.trim() ?? "";

  if (group) {
    return formatCategoryPath(group, leaf);
  }

  return leaf;
}

export function normalizeCategoryPart(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function validateCustomCategoryInput(
  groupLabel: string | undefined,
  leafName: string,
  options?: {
    existingCustomFullNames?: string[];
    excludeFullName?: string;
  },
): { ok: true; groupLabel: string | null; leafName: string; fullName: string } | { ok: false; error: string } {
  const normalizedLeaf = normalizeCategoryPart(leafName);

  if (!normalizedLeaf) {
    return { ok: false, error: "Enter a category name." };
  }

  if (normalizedLeaf.includes(CATEGORY_SEPARATOR)) {
    return {
      ok: false,
      error: `Category name cannot include "${CATEGORY_SEPARATOR.trim()}".`,
    };
  }

  if (normalizedLeaf.length > MAX_LABEL_LENGTH) {
    return {
      ok: false,
      error: `Category name must be ${MAX_LABEL_LENGTH} characters or fewer.`,
    };
  }

  const normalizedGroup = groupLabel ? normalizeCategoryPart(groupLabel) : "";

  if (normalizedGroup.includes(CATEGORY_SEPARATOR)) {
    return {
      ok: false,
      error: `Group name cannot include "${CATEGORY_SEPARATOR.trim()}".`,
    };
  }

  if (normalizedGroup.length > MAX_LABEL_LENGTH) {
    return {
      ok: false,
      error: `Group name must be ${MAX_LABEL_LENGTH} characters or fewer.`,
    };
  }

  const fullName = buildCustomCategoryFullName(normalizedGroup || null, normalizedLeaf);
  const defaultNames = new Set(
    DEFAULT_CATEGORIES.map((category) => category.name.toLowerCase()),
  );

  if (defaultNames.has(fullName.toLowerCase())) {
    return { ok: false, error: "That category already exists in the default list." };
  }

  const exclude = options?.excludeFullName?.toLowerCase();
  const customNames = new Set(
    (options?.existingCustomFullNames ?? []).map((name) => name.toLowerCase()),
  );

  if (customNames.has(fullName.toLowerCase()) && fullName.toLowerCase() !== exclude) {
    return { ok: false, error: "That category already exists." };
  }

  return {
    ok: true,
    groupLabel: normalizedGroup || null,
    leafName: normalizedLeaf,
    fullName,
  };
}

export function mapCustomCategoryRow(row: {
  id: string;
  group_label: string | null;
  leaf_name: string;
  created_at: string;
}): CustomCategoryRecord {
  return {
    id: row.id,
    groupLabel: row.group_label,
    leafName: row.leaf_name,
    fullName: buildCustomCategoryFullName(row.group_label, row.leaf_name),
    createdAt: row.created_at,
  };
}
