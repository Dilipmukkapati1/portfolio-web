"use client";

import type { ProjectionResponse, ReturnPeriod } from "@portfolio/contracts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProjectionToolbar } from "./projection-toolbar";
import { ProjectionLineChart } from "./projection-line-chart";
import { MetricChips, type MetricChip } from "./metric-chips";
import { HorizonTiles } from "./horizon-tiles";
import { formatCompactCurrency } from "@/lib/investment-plan/format";
import { useIsMobile } from "@/hooks/use-is-mobile";

const PROJECTION_MAX_YEARS = 50;

export function PortfolioOutlook({
  portfolioProjection,
  plannedTotalDollars,
  plannedTotalPercent,
  instrumentCount,
  unallocatedDollars,
  unallocatedPercent,
  projectionRate,
  onProjectionRateChange,
  reinvestDividends,
  onReinvestDividendsChange,
  embedded = false,
}: {
  portfolioProjection: ProjectionResponse | null;
  plannedTotalDollars: number;
  plannedTotalPercent: number;
  instrumentCount: number;
  unallocatedDollars: number;
  unallocatedPercent: number;
  projectionRate: ReturnPeriod;
  onProjectionRateChange: (p: ReturnPeriod) => void;
  reinvestDividends: boolean;
  onReinvestDividendsChange: (v: boolean) => void;
  /** Renders without Card chrome inside a mobile section panel. */
  embedded?: boolean;
}) {
  const isMobile = useIsMobile();

  const headerChips: MetricChip[] = [
    { key: "planned", label: "Planned", value: formatCompactCurrency(plannedTotalDollars) },
    {
      key: "nw",
      label: "% net worth",
      value: `${plannedTotalPercent.toFixed(1)}%`,
      tone: "info",
    },
    { key: "count", label: "Instruments", value: String(instrumentCount) },
  ];
  if (unallocatedDollars > 0) {
    headerChips.push({
      key: "unalloc",
      label: "Unallocated",
      value: `${formatCompactCurrency(unallocatedDollars)} (${unallocatedPercent.toFixed(1)}%)`,
      tone: "warning",
    });
  }

  const header = (
    <>
      <p className="font-semibold leading-none">Portfolio outlook</p>
      <MetricChips chips={headerChips} />
    </>
  );

  const main = (
    <>
      <ProjectionToolbar
        projectionRate={projectionRate}
        onProjectionRateChange={onProjectionRateChange}
        reinvestDividends={reinvestDividends}
        onReinvestDividendsChange={onReinvestDividendsChange}
      />

      {!portfolioProjection ? (
        <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm font-medium">No planned allocations</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add instruments to your plan to see combined future value across all holdings.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          <MetricChips
            chips={[
              {
                key: "today",
                label: "Combined today",
                value: formatCompactCurrency(portfolioProjection.totalPrincipal ?? 0),
              },
              ...portfolioProjection.milestones.map((m) => ({
                key: `y${m.years}`,
                label: `At ${m.years} yr`,
                value: formatCompactCurrency(m.future),
                tone: "info" as const,
              })),
            ]}
          />

          <div className="min-h-[220px] w-full min-w-0 sm:min-h-[220px]">
            <ProjectionLineChart
              categories={portfolioProjection.categories}
              values={portfolioProjection.values}
              variant="success"
              height={isMobile ? 240 : 220}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Sum of per-holding projections · 0–{PROJECTION_MAX_YEARS} yr
            </p>
          </div>

          <HorizonTiles milestones={portfolioProjection.milestones} variant="portfolio" />
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <div>
        <div className="space-y-3 pb-2">{header}</div>
        <div className="space-y-3">{main}</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3 pb-2">{header}</CardHeader>
      <CardContent className="space-y-3">{main}</CardContent>
    </Card>
  );
}
