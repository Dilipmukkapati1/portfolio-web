"use client";

import { Switch } from "@/components/ui/switch";
import { formatCompactCurrency } from "@/lib/investment-plan/format";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";
import type { DisplayUnit } from "@portfolio/contracts";

export function PageHeaderControls({
  netWorth,
  displayUnit,
  onDisplayUnitChange,
  saveStatus,
  refreshing,
}: {
  netWorth: number;
  displayUnit: DisplayUnit;
  onDisplayUnitChange: (unit: DisplayUnit) => void;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  refreshing?: boolean;
}) {
  const isMobile = useIsMobile();

  const displayUnitToggle = (
    <div
      className={cn(
        "flex items-center gap-2",
        isMobile && "w-full justify-between rounded-lg bg-muted/50 px-3 py-2.5"
      )}
    >
      <span className="text-sm text-muted-foreground">Show values as</span>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-sm",
            displayUnit === "dollar" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          $
        </span>
        <Switch
          checked={displayUnit === "percent"}
          onCheckedChange={(on) => onDisplayUnitChange(on ? "percent" : "dollar")}
        />
        <span
          className={cn(
            "text-sm",
            displayUnit === "percent" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          %
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-2.5">
      <h1 className="text-2xl font-semibold tracking-tight">Investment plan</h1>

      {isMobile ? (
        <div className="space-y-2.5">
          <div>
            <p className="text-xs text-muted-foreground">Total net worth</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatCompactCurrency(netWorth)}
            </p>
          </div>
          {displayUnitToggle}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Total net worth</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatCompactCurrency(netWorth)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {displayUnitToggle}
            {refreshing && (
              <p className="text-xs text-muted-foreground">Updating…</p>
            )}
            {saveStatus && saveStatus !== "idle" && (
              <p
                className={cn(
                  "text-xs",
                  saveStatus === "error"
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {saveStatus === "saving" && "Saving…"}
                {saveStatus === "saved" && "Saved"}
                {saveStatus === "error" && "Save failed"}
              </p>
            )}
          </div>
        </div>
      )}

      {isMobile && saveStatus && saveStatus !== "idle" && (
        <p
          className={cn(
            "text-xs",
            saveStatus === "error" ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {saveStatus === "saving" && "Saving…"}
          {saveStatus === "saved" && "Saved"}
          {saveStatus === "error" && "Save failed"}
        </p>
      )}
    </div>
  );
}
