"use client";

import { Button } from "@/components/ui/button";
import type { ReturnPeriod } from "@portfolio/contracts";

const PERIODS: { id: ReturnPeriod; label: string; title: string }[] = [
  { id: "1y", label: "1Y", title: "1 year return" },
  { id: "3y", label: "3Y", title: "3 year return" },
  { id: "5y", label: "5Y", title: "5 year return" },
  { id: "life", label: "Life", title: "Life of fund return" },
];

export function ProjectionToolbar({
  projectionRate,
  onProjectionRateChange,
  reinvestDividends,
  onReinvestDividendsChange,
}: {
  projectionRate: ReturnPeriod;
  onProjectionRateChange: (period: ReturnPeriod) => void;
  reinvestDividends: boolean;
  onReinvestDividendsChange: (value: boolean) => void;
}) {
  return (
    <div
      className="flex w-full min-w-0 flex-nowrap items-center gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="toolbar"
      aria-label="Projection rate and dividend reinvestment"
    >
      {PERIODS.map((p) => (
        <Button
          key={p.id}
          type="button"
          size="sm"
          variant={projectionRate === p.id ? "secondary" : "ghost"}
          title={p.title}
          className="h-9 shrink-0 px-2.5 text-xs sm:min-h-11 sm:min-w-11 sm:px-3 sm:text-sm"
          onClick={() => onProjectionRateChange(p.id)}
        >
          {p.label}
        </Button>
      ))}
      <span className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden />
      <Button
        type="button"
        size="sm"
        variant={reinvestDividends ? "secondary" : "ghost"}
        title="Reinvest dividends (DRIP)"
        className="h-9 shrink-0 whitespace-nowrap px-2.5 text-xs sm:min-h-11 sm:px-3 sm:text-sm"
        onClick={() => onReinvestDividendsChange(true)}
      >
        DRIP
      </Button>
      <Button
        type="button"
        size="sm"
        variant={!reinvestDividends ? "secondary" : "ghost"}
        title="Price return only"
        className="h-9 shrink-0 whitespace-nowrap px-2.5 text-xs sm:min-h-11 sm:px-3 sm:text-sm"
        onClick={() => onReinvestDividendsChange(false)}
      >
        No DRIP
      </Button>
    </div>
  );
}
