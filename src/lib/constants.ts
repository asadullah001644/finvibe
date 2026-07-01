import type { BudgetCategory, CategoryGroup } from "@/lib/types";

export type CategoryNode = {
  name: string;
  children?: CategoryNode[];
};

export const CATEGORY_SEPARATOR = " › ";

export const CATEGORY_TREE: CategoryNode[] = [
  {
    name: "Home",
    children: [
      { name: "Kids" },
      { name: "Wife" },
      { name: "Family" },
      { name: "Groceries" },
      { name: "Bills" },
      { name: "Utilities" },
    ],
  },
  {
    name: "Flat",
    children: [
      { name: "Rent" },
      { name: "Grocery" },
      { name: "Utilities" },
    ],
  },
  { name: "Food" },
  { name: "Fuel" },
  { name: "Transport" },
  { name: "Shopping" },
  { name: "Personal" },
  { name: "Entertainment" },
  { name: "Other" },
];

export function formatCategoryPath(parent: string, child: string): string {
  return `${parent}${CATEGORY_SEPARATOR}${child}`;
}

export function flattenCategoryLeaves(): BudgetCategory[] {
  const leaves: BudgetCategory[] = [];

  for (const node of CATEGORY_TREE) {
    if (node.children?.length) {
      for (const child of node.children) {
        leaves.push({
          name: formatCategoryPath(node.name, child.name),
          allocated: 0,
        });
      }
      continue;
    }

    leaves.push({ name: node.name, allocated: 0 });
  }

  return leaves;
}

export const DEFAULT_CATEGORIES: BudgetCategory[] = flattenCategoryLeaves();

export function getCategoryGroups(): CategoryGroup[] {
  const groups: CategoryGroup[] = [];

  for (const node of CATEGORY_TREE) {
    if (node.children?.length) {
      groups.push({
        label: node.name,
        items: node.children.map((child) =>
          formatCategoryPath(node.name, child.name),
        ),
      });
      continue;
    }

    groups.push({
      label: null,
      items: [node.name],
    });
  }

  return groups;
}

export function getParentCategoryName(categoryName: string): string | null {
  const separatorIndex = categoryName.indexOf(CATEGORY_SEPARATOR);
  if (separatorIndex === -1) {
    return null;
  }

  return categoryName.slice(0, separatorIndex);
}

export function getChildCategoryName(categoryName: string): string {
  const separatorIndex = categoryName.indexOf(CATEGORY_SEPARATOR);
  if (separatorIndex === -1) {
    return categoryName;
  }

  return categoryName.slice(separatorIndex + CATEGORY_SEPARATOR.length);
}

export const CATEGORY_HINTS: Record<string, string> = {
  "Home › Kids": "Pampers, milk, formula, baby care",
  "Home › Wife": "Wife's needs, personal care, gifts",
  "Home › Family": "Family gifts, visits, shared expenses",
  "Home › Groceries": "Rashan, home kitchen stock",
  "Home › Bills": "Home rent, maintenance, furniture",
  "Home › Utilities": "Home electricity, gas, water, internet",
  "Flat › Rent": "Flat or hostel rent",
  "Flat › Grocery": "Flat rashan, kitchen stock",
  "Flat › Utilities": "Flat electricity, gas, water, internet",
  Food: "Meals, takeout, tea outside home",
  Fuel: "Petrol for car or bike",
  Transport: "Ride-hailing, bus, parking",
  Shopping: "Clothes, electronics, general buys",
  Personal: "Your haircut, gym, hobbies",
  Entertainment: "Movies, streaming, leisure",
  Other: "Anything that does not fit above",
};

export function resolveCategoryHint(name: string): string | undefined {
  return CATEGORY_HINTS[name];
}

export const CATEGORY_BUDGET_WEIGHTS: Record<string, number> = {
  "Home › Kids": 0.12,
  "Home › Wife": 0.03,
  "Home › Family": 0.03,
  "Home › Groceries": 0.13,
  "Home › Bills": 0.15,
  "Home › Utilities": 0.07,
  "Flat › Rent": 0.1,
  "Flat › Grocery": 0.05,
  "Flat › Utilities": 0.035,
  Food: 0.07,
  Fuel: 0.05,
  Transport: 0.035,
  Shopping: 0.05,
  Personal: 0.04,
  Entertainment: 0.03,
  Other: 0.035,
};

const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  Kids: "Home › Kids",
  "Wife & Family": "Home › Family",
  Groceries: "Home › Groceries",
  "Home & Bills": "Home › Bills",
  Utilities: "Home › Utilities",
};

function remapStoredCategories(
  stored: BudgetCategory[] | null | undefined,
): Map<string, number> {
  const remapped = new Map<string, number>();

  for (const category of Array.isArray(stored) ? stored : []) {
    const allocated = Number(category.allocated ?? 0);
    if (allocated <= 0) {
      continue;
    }

    if (category.name === "Wife & Family") {
      const half = allocated / 2;
      remapped.set(
        "Home › Wife",
        (remapped.get("Home › Wife") ?? 0) + half,
      );
      remapped.set(
        "Home › Family",
        (remapped.get("Home › Family") ?? 0) + half,
      );
      continue;
    }

    const mappedName =
      LEGACY_CATEGORY_ALIASES[category.name] ?? category.name;
    remapped.set(
      mappedName,
      (remapped.get(mappedName) ?? 0) + allocated,
    );
  }

  return remapped;
}

export function mergeWithDefaultCategories(
  stored: BudgetCategory[] | null | undefined,
): BudgetCategory[] {
  const storedMap = remapStoredCategories(stored);

  return DEFAULT_CATEGORIES.map((category) => ({
    name: category.name,
    allocated: storedMap.get(category.name) ?? 0,
  }));
}

export function distributeCategoryBudgets(
  categories: BudgetCategory[],
  spendable: number,
): BudgetCategory[] {
  if (spendable <= 0 || categories.length === 0) {
    return categories;
  }

  return categories.map((category) => ({
    ...category,
    allocated: Math.round(
      spendable * (CATEGORY_BUDGET_WEIGHTS[category.name] ?? 0.05),
    ),
  }));
}
