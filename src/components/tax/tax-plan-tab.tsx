"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCompactCurrency } from "@/lib/investment-plan/format";
import { formatContributionRoom } from "@/lib/tax/display";
import {
  CONTRIBUTION_TYPE_LABELS,
  type ContributionType,
  type Member,
  type TaxProfile,
} from "@/lib/household-types";
import type { TaxOutlook } from "@/lib/tax/outlook";
import { cn } from "@/lib/utils";
import { formatTaxTotal } from "./tax-breakdown";
import { TaxKeyValueRows, TaxPanel, TaxPanelHeader, TaxStat, TAX_INSET_X } from "./tax-primitives";

function buildChecklist(
  taxProfile: TaxProfile,
  members: Member[],
  strategies: Array<Record<string, unknown>>,
  valuesUnlocked: boolean
): Array<{ id: string; label: string; done: boolean }> {
  const items: Array<{ id: string; label: string; done: boolean }> = [];
  const memberName = (id?: string) =>
    members.find((m) => m.id === id)?.name.split(/\s+/)[0] ?? "Member";

  for (const lim of taxProfile.contributionLimits ?? []) {
    const isOpen =
      lim.remaining != null
        ? lim.remaining > 0
        : lim.contributionUsedPercent != null
          ? lim.contributionUsedPercent < 100
          : lim.limit != null && lim.contributed != null
            ? lim.contributed < lim.limit
            : false;
    if (!isOpen) continue;
    const typeLabel =
      CONTRIBUTION_TYPE_LABELS[lim.type as ContributionType] ?? lim.type;
    items.push({
      id: `limit-${lim.type}-${lim.memberId ?? "hh"}`,
      label: `${typeLabel}${lim.memberId ? ` ${memberName(lim.memberId)}` : ""} — ${formatContributionRoom(lim, valuesUnlocked)}`,
      done: false,
    });
  }

  for (const strat of strategies) {
    const missing = strat.missingData;
    if (!Array.isArray(missing) || missing.length === 0) continue;
    items.push({
      id: String(strat.id),
      label: `${String(strat.title)} — needs ${missing.join(", ")}`,
      done: false,
    });
  }

  return items;
}

export function TaxPlanSection({
  outlook,
  taxProfile,
  members,
  strategies,
  valuesUnlocked,
  isMobile,
}: {
  outlook: TaxOutlook;
  taxProfile: TaxProfile;
  members: Member[];
  strategies: Array<Record<string, unknown>>;
  valuesUnlocked: boolean;
  isMobile: boolean;
}) {
  const checklist = buildChecklist(taxProfile, members, strategies, valuesUnlocked);
  const openCount = checklist.length;
  const recRows = strategies.map((s) => ({
    label: String(s.title),
    value:
      valuesUnlocked && s.estimatedSavings != null
        ? `−${formatCompactCurrency(Number(s.estimatedSavings))}/yr`
        : "Review",
  }));

  const scenarios = (
    <>
      <div className="grid grid-cols-2 gap-3">
        <TaxStat
          label="Current"
          value={formatTaxTotal(outlook.totalTaxAnnual, valuesUnlocked)}
        />
        <TaxStat
          label="Optimized"
          value={formatTaxTotal(outlook.optimizedTaxAnnual, valuesUnlocked)}
          tone="success"
        />
      </div>
      <Button type="button" variant="default" className="w-full sm:w-auto" disabled>
        Compare scenarios
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <TaxPanel>
          <TaxPanelHeader title="Action checklist" trailing={`${openCount} open`} />
          {checklist.length === 0 ? (
            <p className={cn(TAX_INSET_X, "py-4 text-sm text-muted-foreground")}>
              No open actions — contribution room looks good.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {checklist.map((item) => (
                <li key={item.id} className={cn(TAX_INSET_X, "py-2.5 text-sm")}>
                  {item.label}
                </li>
              ))}
            </ul>
          )}
        </TaxPanel>

        <TaxPanel>
          <TaxPanelHeader
            title="Recommendations"
            trailing={
              valuesUnlocked && outlook.optimizedSavings > 0
                ? `−${formatCompactCurrency(outlook.optimizedSavings)}/yr`
                : undefined
            }
          />
          {recRows.length === 0 ? (
            <p className={cn(TAX_INSET_X, "py-4 text-sm text-muted-foreground")}>
              No recommendations yet. Recalculate after updating household income.
            </p>
          ) : (
            <TaxKeyValueRows rows={recRows} />
          )}
        </TaxPanel>

        <TaxPanel>
          <TaxPanelHeader
            title="Scenarios"
            trailing={
              valuesUnlocked && outlook.optimizedSavings > 0
                ? `−${formatCompactCurrency(outlook.optimizedSavings)}`
                : undefined
            }
          />
          <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
            <div className="space-y-1 p-2">
              <p className="text-xs text-muted-foreground">Current</p>
              <p className="font-semibold tabular-nums">
                {formatTaxTotal(outlook.totalTaxAnnual, valuesUnlocked)}
              </p>
            </div>
            <div className="space-y-1 p-2">
              <p className="text-xs text-muted-foreground">Optimized</p>
              <p className="font-semibold tabular-nums text-emerald-400">
                {formatTaxTotal(outlook.optimizedTaxAnnual, valuesUnlocked)}
              </p>
            </div>
          </div>
          <div className="p-2">
            <Button type="button" className="w-full" disabled>
              Compare scenarios
            </Button>
          </div>
        </TaxPanel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">Action checklist</h3>
          <span className="text-xs text-muted-foreground">{openCount} open</span>
        </div>
        {checklist.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No open actions — contribution room looks good.
          </p>
        ) : (
          <ul className="space-y-2 rounded-lg border border-border">
            {checklist.map((item) => (
              <li key={item.id} className="border-b border-border px-3 py-2.5 text-sm last:border-b-0">
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Recommendations</h3>
        {strategies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recommendations yet.</p>
        ) : (
          <div className="space-y-2">
            {strategies.map((s, i) => (
              <Card key={String(s.id)} className="border-none bg-muted/20 shadow-none">
                <CardContent className="p-3">
                  <p className="text-sm font-medium">
                    {i + 1}. {String(s.title)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {String(s.description)}
                  </p>
                  {s.estimatedSavings != null && valuesUnlocked && (
                    <p className="mt-1 text-xs text-emerald-400">
                      Est. savings: {formatCompactCurrency(Number(s.estimatedSavings))}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Scenarios</h3>
        {scenarios}
      </div>
    </div>
  );
}
