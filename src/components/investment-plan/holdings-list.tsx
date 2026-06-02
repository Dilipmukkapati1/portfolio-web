"use client";

import { Pencil, Trash2 } from "lucide-react";
import type {
  AllocationClassRollup,
  DisplayUnit,
  FundProfile,
  PlannedInstrument,
} from "@portfolio/contracts";
import { ASSET_CLASS_ORDER, formatReturnPct } from "@portfolio/contracts";
import { ASSET_CLASS_COLORS } from "@/lib/investment-plan/colors";
import {
  formatAllocationAmount,
  formatCompactCurrency,
  instrumentShortName,
} from "@/lib/investment-plan/format";
import { instrumentDollars, instrumentPercent } from "@/hooks/use-investment-plan";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn, formatPercent } from "@/lib/utils";

function formatValue(
  displayUnit: DisplayUnit,
  dollars: number,
  percent: number,
  hidden = false
): string {
  return displayUnit === "dollar"
    ? formatCompactCurrency(dollars, { hidden })
    : formatPercent(percent);
}

export function HoldingsList({
  instruments,
  allocation,
  netWorth,
  displayUnit,
  valuesUnlocked,
  selectedInstrumentId,
  onSelect,
  onRemove,
  saving,
  profileForInstrument,
}: {
  instruments: PlannedInstrument[];
  allocation: AllocationClassRollup[];
  netWorth: number;
  displayUnit: DisplayUnit;
  valuesUnlocked: boolean;
  selectedInstrumentId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  saving?: boolean;
  profileForInstrument: (item: PlannedInstrument) => FundProfile;
}) {
  const isMobile = useIsMobile();

  const rowGrid = isMobile
    ? "grid-cols-[28px_minmax(0,1fr)_44px_48px_28px]"
    : "grid-cols-[32px_minmax(0,1fr)_72px_80px_32px]";

  const byClass = ASSET_CLASS_ORDER.map((assetClass) => ({
    assetClass,
    label:
      allocation.find((c) => c.assetClass === assetClass)?.label ?? assetClass,
    items: instruments.filter((i) => i.assetClass === assetClass),
    rollup: allocation.find((c) => c.assetClass === assetClass),
  })).filter((section) => section.items.length > 0);

  if (instruments.length === 0) {
    return (
      <div className="rounded-md border border-dashed px-4 py-6 text-center">
        <p className="text-sm font-medium">No instruments yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a ticker above with the + control.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      <div
        className={cn(
          "grid items-center gap-2 border-b px-2.5 pb-1.5 text-xs text-muted-foreground sm:px-3.5",
          rowGrid
        )}
      >
        <span aria-hidden />
        <span>Holding</span>
        <span className="text-right">Target</span>
        <span className="text-right">% NW</span>
        <span aria-hidden />
      </div>

      {byClass.map((section) => {
        const subtotal = section.rollup;
        const classAccent = ASSET_CLASS_COLORS[section.assetClass];
        return (
          <div
            key={section.assetClass}
            className="overflow-hidden rounded-lg border"
          >
            <div
              className={cn(
                "grid items-center gap-2 border-b bg-muted/40 px-2.5 py-2 sm:px-3.5",
                rowGrid
              )}
              style={{ borderLeftWidth: 3, borderLeftColor: classAccent }}
            >
              <span aria-hidden />
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: classAccent }}
                />
                <span className="text-sm font-semibold">{section.label}</span>
              </div>
              <span aria-hidden />
              <span className="text-right text-sm tabular-nums text-muted-foreground">
                {section.items.length}
                {subtotal &&
                  ` · ${formatValue(
                    displayUnit,
                    subtotal.planDollars,
                    subtotal.planPercent,
                    displayUnit === "dollar" && !valuesUnlocked
                  )}`}
              </span>
              <span aria-hidden />
            </div>

            <div>
              {section.items.map((item, itemIndex) => {
                const profile = profileForInstrument(item);
                const pct = instrumentPercent(item, netWorth);
                const selected = selectedInstrumentId === item.id;
                const target =
                  item.unit === "percent"
                    ? `${item.value}%`
                    : formatCompactCurrency(item.value);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "grid items-center gap-2 px-2.5 py-2 sm:px-3.5",
                      rowGrid,
                      itemIndex < section.items.length - 1 && "border-b",
                      selected && "border-l-2 border-l-primary bg-primary/5"
                    )}
                  >
                    <Button
                      type="button"
                      variant={selected ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "min-h-11 min-w-11 justify-self-center",
                        selected && "rounded-full"
                      )}
                      title={selected ? "Editing in explorer" : "Edit in explorer"}
                      onClick={() => onSelect(item.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <div className="min-w-0 overflow-hidden">
                      <p className="truncate text-sm font-semibold">
                        {profile.ticker} · {instrumentShortName(item.name)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        1Y {formatReturnPct(profile.return1y)}
                      </p>
                    </div>
                    <p className="text-right text-sm tabular-nums">{target}</p>
                    <p className="text-right text-sm tabular-nums text-muted-foreground">
                      {formatPercent(pct)}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="min-h-11 min-w-11 justify-self-center text-muted-foreground hover:text-destructive"
                      disabled={saving}
                      title="Remove from plan"
                      onClick={() => onRemove(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
