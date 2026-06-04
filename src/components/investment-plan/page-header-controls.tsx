"use client";

import { formatCompactCurrency } from "@/lib/investment-plan/format";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";

export function PageHeaderControls({
  netWorth,
  saveStatus,
  refreshing,
}: {
  netWorth: number;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  refreshing?: boolean;
}) {
  const isMobile = useIsMobile();

  const saveStatusLabel =
    saveStatus && saveStatus !== "idle" ? (
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
    ) : null;

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
          {refreshing && (
            <p className="text-xs text-muted-foreground">Updating…</p>
          )}
          {saveStatusLabel}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Total net worth</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatCompactCurrency(netWorth)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {refreshing && (
              <p className="text-xs text-muted-foreground">Updating…</p>
            )}
            {saveStatusLabel}
          </div>
        </div>
      )}
    </div>
  );
}
