"use client";

import { Fragment, useMemo } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type {
  AllocationClassRollup,
  DisplayUnit,
  FundProfile,
  PlannedInstrument,
  ReturnPeriod,
} from "@portfolio/contracts";
import {
  ASSET_CLASS_ORDER,
  PROJECTION_HORIZONS,
  computeInstrumentProjection,
} from "@portfolio/contracts";
import { ASSET_CLASS_COLORS } from "@/lib/investment-plan/colors";
import { formatCompactCurrency } from "@/lib/investment-plan/format";
import { instrumentDollars, instrumentPercent } from "@/hooks/use-investment-plan";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

function milestoneFuture(
  projection: ReturnType<typeof computeInstrumentProjection>,
  years: number
): string {
  if (!projection) return "—";
  const m = projection.milestones.find((x) => x.years === years);
  return m ? formatCompactCurrency(m.future) : "—";
}

const thClass =
  "px-2 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap";
const tdClass = "px-2 py-2 align-middle whitespace-nowrap tabular-nums text-sm";
const tdMuted = cn(tdClass, "text-muted-foreground");
const symbolColClass = "w-[5.67rem] min-w-[5.67rem] max-w-[5.67rem]";

function HoldingActionsMenu({
  itemId,
  selected,
  saving,
  onSelect,
  onRemove,
}: {
  itemId: string;
  selected: boolean;
  saving?: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 shrink-0 text-muted-foreground",
            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
            "data-[state=open]:opacity-100",
            selected && "sm:opacity-100"
          )}
          aria-label="Holding actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onSelect(itemId)}>
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Edit in explorer
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          disabled={saving}
          onClick={() => onRemove(itemId)}
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Remove from plan
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
  projectionRate,
  reinvestDividends,
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
  projectionRate: ReturnPeriod;
  reinvestDividends: boolean;
}) {
  const projectionsById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeInstrumentProjection>>();
    for (const item of instruments) {
      const principal = instrumentDollars(item, netWorth);
      map.set(
        item.id,
        computeInstrumentProjection(
          profileForInstrument(item),
          principal,
          projectionRate,
          reinvestDividends
        )
      );
    }
    return map;
  }, [instruments, netWorth, profileForInstrument, projectionRate, reinvestDividends]);

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
    <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
      <table className="w-full min-w-[34rem] border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className={cn(thClass, symbolColClass, "sticky left-0 z-10 bg-background")}>
              Symbol
            </th>
            <th className={cn(thClass, "text-right")}>% NW</th>
            <th className={cn(thClass, "text-right")}>Today</th>
            {PROJECTION_HORIZONS.map((years) => (
              <th key={years} className={cn(thClass, "text-right")}>
                {years} yr
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {byClass.map((section) => {
            const subtotal = section.rollup;
            const classAccent = ASSET_CLASS_COLORS[section.assetClass];

            return (
              <Fragment key={section.assetClass}>
                <tr className="border-b bg-muted/40">
                  <td
                    className={cn(
                      "sticky left-0 z-[1] bg-muted/40 py-2 pl-1.5 pr-0.5",
                      symbolColClass
                    )}
                    style={{ borderLeftWidth: 3, borderLeftColor: classAccent }}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: classAccent }}
                      />
                      <span className="font-semibold">{section.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {section.items.length}
                      </span>
                    </div>
                  </td>
                  <td className={cn(tdClass, "text-right text-muted-foreground")}>
                    {subtotal
                      ? formatValue(
                          displayUnit,
                          subtotal.planDollars,
                          subtotal.planPercent,
                          displayUnit === "dollar" && !valuesUnlocked
                        )
                      : "—"}
                  </td>
                  <td colSpan={PROJECTION_HORIZONS.length + 1} className={tdMuted} />
                </tr>
                {section.items.map((item) => {
                  const profile = profileForInstrument(item);
                  const pct = instrumentPercent(item, netWorth);
                  const principal = instrumentDollars(item, netWorth);
                  const projection = projectionsById.get(item.id) ?? null;
                  const selected = selectedInstrumentId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "group border-b last:border-b-0",
                        selected && "bg-primary/5"
                      )}
                    >
                      <td
                        className={cn(
                          "sticky left-0 z-[1] cursor-pointer bg-background py-1.5 pl-1.5 pr-0.5",
                          symbolColClass,
                          selected && "border-l-2 border-l-primary bg-primary/5"
                        )}
                        onClick={() => onSelect(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSelect(item.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Edit ${profile.ticker} in explorer`}
                      >
                        <div className="flex min-w-0 items-center gap-1">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold tabular-nums">
                              {profile.ticker}
                              {selected ? (
                                <span className="ml-1 text-xs font-normal text-muted-foreground">
                                  · edit
                                </span>
                              ) : null}
                            </p>
                          </div>
                          <HoldingActionsMenu
                            itemId={item.id}
                            selected={selected}
                            saving={saving}
                            onSelect={onSelect}
                            onRemove={onRemove}
                          />
                        </div>
                      </td>
                      <td className={cn(tdClass, "text-right")}>{formatPercent(pct)}</td>
                      <td className={cn(tdClass, "text-right")}>
                        {formatCompactCurrency(
                          projection?.totalPrincipal ?? principal,
                          { hidden: displayUnit === "dollar" && !valuesUnlocked }
                        )}
                      </td>
                      {PROJECTION_HORIZONS.map((years) => (
                        <td key={years} className={cn(tdClass, "text-right text-primary/90")}>
                          {milestoneFuture(projection, years)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
