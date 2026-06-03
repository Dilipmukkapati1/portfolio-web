"use client";

import { useEffect, useState } from "react";
import type { ExpenseMappingRule, TransactionCategory } from "@portfolio/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mergeCategoryLabel } from "@/lib/expense-planner/categories";
import type { ExpenseCategoryPreference } from "@portfolio/contracts";

const MATCH_TYPES = [
  { value: "merchant_contains", label: "Merchant contains" },
  { value: "merchant_equals", label: "Merchant equals" },
  { value: "type_equals", label: "Transaction type equals" },
] as const;

export function MappingRuleForm({
  categories,
  initialRule,
  onSave,
  onCancel,
}: {
  categories: ExpenseCategoryPreference[];
  initialRule?: ExpenseMappingRule | null;
  onSave: (rule: ExpenseMappingRule) => void;
  onCancel?: () => void;
}) {
  const [matchType, setMatchType] = useState<ExpenseMappingRule["matchType"]>(
    initialRule?.matchType ?? "merchant_contains"
  );
  const [pattern, setPattern] = useState(initialRule?.pattern ?? "");
  const [category, setCategory] = useState<TransactionCategory>(
    initialRule?.category ?? "food"
  );
  const [applyToPast, setApplyToPast] = useState(initialRule?.applyToPast ?? true);

  useEffect(() => {
    if (initialRule) {
      setMatchType(initialRule.matchType);
      setPattern(initialRule.pattern);
      setCategory(initialRule.category);
      setApplyToPast(initialRule.applyToPast);
    }
  }, [initialRule]);

  const visible = categories.filter((c) => !c.hidden);

  const handleSave = () => {
    if (!pattern.trim()) return;
    const id = initialRule?.id ?? crypto.randomUUID();
    onSave({
      id,
      matchType,
      pattern: pattern.trim(),
      category,
      applyToPast,
      sortOrder: initialRule?.sortOrder ?? 0,
    });
    if (!initialRule) {
      setPattern("");
    }
  };

  return (
    <div className="space-y-3">
      <Select
        value={matchType}
        onValueChange={(v) => setMatchType(v as ExpenseMappingRule["matchType"])}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MATCH_TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={pattern}
        onChange={(e) => setPattern(e.target.value)}
        placeholder="e.g. Amazon, ACH Debit"
      />
      <Select value={category} onValueChange={(v) => setCategory(v as TransactionCategory)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {visible.map((c) => (
            <SelectItem key={c.category} value={c.category}>
              {mergeCategoryLabel(c.category, categories)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={applyToPast}
          onChange={(e) => setApplyToPast(e.target.checked)}
          className="rounded border-input"
        />
        Apply to past transactions
      </label>
      <div className="flex gap-2">
        <Button type="button" onClick={handleSave}>
          {initialRule ? "Save changes" : "Save mapping rule"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
