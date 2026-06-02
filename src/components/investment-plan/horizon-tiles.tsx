"use client";

import { useIsMobile } from "@/hooks/use-is-mobile";
import { formatCompactCurrency } from "@/lib/investment-plan/format";
import { cn } from "@/lib/utils";
import type { ProjectionResponse } from "@portfolio/contracts";

export function HorizonTiles({
  milestones,
  variant,
}: {
  milestones: ProjectionResponse["milestones"];
  variant: "portfolio" | "explorer";
}) {
  const isMobile = useIsMobile();

  const tile = (m: (typeof milestones)[number]) => (
    <div
      key={m.years}
      className={cn(
        "rounded-md border p-2.5",
        isMobile && "min-w-[132px] shrink-0"
      )}
    >
      <p className="text-xs text-muted-foreground">
        {variant === "portfolio" ? `At ${m.years} yr` : `${m.years}-year`}
      </p>
      <p
        className={cn(
          "text-sm font-semibold tabular-nums",
          variant === "portfolio"
            ? "text-green-600 dark:text-green-400"
            : "text-primary"
        )}
      >
        {formatCompactCurrency(m.future)}
      </p>
      <p className="text-xs text-muted-foreground">
        +{formatCompactCurrency(m.gain)} · {m.multiple.toFixed(2)}×
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex w-full gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]">
        {milestones.map(tile)}
      </div>
    );
  }

  return <div className="grid grid-cols-4 gap-2.5">{milestones.map(tile)}</div>;
}
