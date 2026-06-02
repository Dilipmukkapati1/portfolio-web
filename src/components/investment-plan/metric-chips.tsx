"use client";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-is-mobile";

export type MetricChip = {
  key: string;
  label: string;
  value: string;
  tone?: "default" | "warning" | "info";
};

export function MetricChips({ chips }: { chips: MetricChip[] }) {
  const isMobile = useIsMobile();

  const chipEl = (chip: MetricChip) => (
    <div
      key={chip.key}
      className={cn(
        "rounded-md border bg-muted/30 px-3 py-2",
        isMobile ? "min-w-[96px] shrink-0" : "w-full"
      )}
    >
      <p className="text-xs text-muted-foreground">{chip.label}</p>
      <p
        className={cn(
          "text-sm font-semibold tabular-nums",
          chip.tone === "warning" && "text-amber-600 dark:text-amber-400",
          chip.tone === "info" && "text-primary"
        )}
      >
        {chip.value}
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex w-full gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]">
        {chips.map(chipEl)}
      </div>
    );
  }

  const cols = Math.min(4, Math.max(2, chips.length));
  return (
    <div
      className="grid gap-2.5"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {chips.map(chipEl)}
    </div>
  );
}
