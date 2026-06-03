import type { ExpenseCategoryPreference, TransactionCategory } from "@portfolio/contracts";
import { DEFAULT_CATEGORY_LABELS } from "@portfolio/contracts";

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  income: "bg-blue-500",
  transfer: "bg-slate-400",
  housing: "bg-blue-600",
  utilities: "bg-gray-500",
  food: "bg-orange-500",
  transport: "bg-purple-500",
  healthcare: "bg-green-500",
  insurance: "bg-teal-500",
  entertainment: "bg-yellow-500",
  shopping: "bg-pink-500",
  education: "bg-indigo-500",
  taxes: "bg-red-400",
  fees: "bg-stone-500",
  investment: "bg-cyan-500",
  other: "bg-gray-400",
  uncategorized: "bg-neutral-400",
};

export function mergeCategoryLabel(
  category: TransactionCategory,
  preferences: ExpenseCategoryPreference[]
): string {
  const pref = preferences.find((c) => c.category === category);
  return pref?.label ?? DEFAULT_CATEGORY_LABELS[category];
}

export function visibleCategoryPreferences(
  preferences: ExpenseCategoryPreference[]
): ExpenseCategoryPreference[] {
  return preferences.filter((c) => !c.hidden);
}

export function hiddenCategoryPreferences(
  preferences: ExpenseCategoryPreference[]
): ExpenseCategoryPreference[] {
  return preferences.filter((c) => c.hidden);
}
