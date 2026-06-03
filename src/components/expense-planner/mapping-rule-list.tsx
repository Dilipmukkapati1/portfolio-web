"use client";

import type { ExpenseMappingRule } from "@portfolio/contracts";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { mergeCategoryLabel } from "@/lib/expense-planner/categories";
import type { ExpenseCategoryPreference } from "@portfolio/contracts";

export function MappingRuleList({
  rules,
  categories,
  editingId,
  onEdit,
  onDelete,
}: {
  rules: ExpenseMappingRule[];
  categories: ExpenseCategoryPreference[];
  editingId: string | null;
  onEdit: (rule: ExpenseMappingRule) => void;
  onDelete: (id: string) => void;
}) {
  if (rules.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No mapping rules yet.</p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {rules.map((rule) => (
        <li key={rule.id} className="flex items-start gap-2 py-3 first:pt-0">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {rule.pattern} → {mergeCategoryLabel(rule.category, categories)}
            </p>
            <p className="text-xs text-muted-foreground">
              {rule.matchType.replace(/_/g, " ")}
              {rule.applyToPast ? " · retroactive" : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Edit rule"
            onClick={() => onEdit(rule)}
            disabled={editingId === rule.id}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Delete rule"
            onClick={() => onDelete(rule.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
