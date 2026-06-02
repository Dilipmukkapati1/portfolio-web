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
      className="flex flex-wrap items-center gap-1.5"
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
          className="min-h-11 min-w-11"
          onClick={() => onProjectionRateChange(p.id)}
        >
          {p.label}
        </Button>
      ))}
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
      <Button
        type="button"
        size="sm"
        variant={reinvestDividends ? "secondary" : "ghost"}
        title="Reinvest dividends (DRIP)"
        className="min-h-11"
        onClick={() => onReinvestDividendsChange(true)}
      >
        DRIP
      </Button>
      <Button
        type="button"
        size="sm"
        variant={!reinvestDividends ? "secondary" : "ghost"}
        title="Price return only"
        className="min-h-11"
        onClick={() => onReinvestDividendsChange(false)}
      >
        No DRIP
      </Button>
    </div>
  );
}
