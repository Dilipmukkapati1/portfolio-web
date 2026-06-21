"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrencyWhole } from "@/lib/utils";
import { formatTaxRate } from "@/lib/tax/display";
import type { TaxOutlook } from "@/lib/tax/outlook";

export function TaxHeader({
  taxYear,
  outlook,
  valuesUnlocked,
  estimating,
  isMobile,
  onRecalculate,
}: {
  taxYear: number;
  outlook: TaxOutlook | null;
  valuesUnlocked: boolean;
  estimating: boolean;
  isMobile: boolean;
  onRecalculate: () => void;
}) {
  if (isMobile) {
    return (
      <div className="mb-2 flex items-center justify-between gap-2 px-2">
        <h1 className="text-lg font-semibold">Tax</h1>
        <div className="flex items-center gap-2">
          <Select value={String(taxYear)} disabled>
            <SelectTrigger className="h-9 w-[88px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(taxYear)}>{taxYear}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={onRecalculate}
            disabled={estimating}
            aria-label="Recalculate tax"
          >
            {estimating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-4 border-b border-border pb-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Tax</h1>
          <p className="text-sm text-muted-foreground">
            {taxYear} total tax (est.)
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {outlook
              ? valuesUnlocked
                ? formatCurrencyWhole(outlook.totalTaxAnnual)
                : formatTaxRate(outlook.actualTaxRate, 1)
              : "—"}
          </p>
          {outlook && !valuesUnlocked && (
            <p className="text-xs text-muted-foreground">of income · percent view</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(taxYear)} disabled>
            <SelectTrigger className="h-10 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(taxYear)}>{taxYear}</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" onClick={onRecalculate} disabled={estimating}>
            {estimating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating…
              </>
            ) : (
              "Recalculate"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
