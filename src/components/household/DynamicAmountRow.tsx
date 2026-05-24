"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DynamicAmountRowProps = {
  typeLabel: string;
  amount: number;
  onAmountChange: (amount: number) => void;
  onRemove: () => void;
  readOnlyType?: boolean;
};

export function DynamicAmountRow({
  typeLabel,
  amount,
  onAmountChange,
  onRemove,
  readOnlyType = true,
}: DynamicAmountRowProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="flex-1 block text-sm min-w-0">
        {readOnlyType ? (
          <span className="text-muted-foreground">{typeLabel}</span>
        ) : (
          typeLabel
        )}
        {!readOnlyType && (
          <input className="mt-1 w-full rounded-md border border-border bg-muted px-3 py-2 min-h-11" />
        )}
      </label>
      <label className="block text-sm sm:w-36 shrink-0">
        <span className="sr-only">Amount for {typeLabel}</span>
        <Input
          type="number"
          min={0}
          step={100}
          inputMode="decimal"
          className="min-h-11"
          value={amount || ""}
          onChange={(e) =>
            onAmountChange(parseFloat(e.target.value) || 0)
          }
          placeholder="0"
        />
      </label>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="min-h-11 min-w-11 shrink-0 self-end"
        aria-label={`Remove ${typeLabel}`}
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
