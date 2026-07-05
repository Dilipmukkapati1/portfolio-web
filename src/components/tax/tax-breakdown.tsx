"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCompactCurrency } from "@/lib/investment-plan/format";
import { formatTaxShare, formatTaxTotal } from "@/lib/tax/display";
import type { TaxPaidBucket } from "@/lib/tax/outlook";
import { TAX_INSET_X } from "./tax-primitives";
import { cn } from "@/lib/utils";

export { formatTaxTotal };

export function TaxPaidBreakdownMobile({
  rows,
  lifetimeForward,
  valuesUnlocked,
  paidAnnual,
}: {
  rows: TaxPaidBucket[];
  lifetimeForward: number;
  valuesUnlocked: boolean;
  paidAnnual: number;
}) {
  return (
    <div>
      {rows.map((row) => (
        <div key={row.bucket} className={cn("border-b border-border py-2.5 last:border-b-0", TAX_INSET_X)}>
          <p className="text-sm font-medium">{row.bucket}</p>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">YTD</span>
            <span className="tabular-nums">
              {formatTaxShare(row.ytd, paidAnnual, valuesUnlocked)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rest</span>
            <span className="tabular-nums text-muted-foreground">
              {formatTaxShare(row.restOfYear, paidAnnual, valuesUnlocked)}
            </span>
          </div>
        </div>
      ))}
      <div className={cn("flex items-center justify-between py-2.5", TAX_INSET_X)}>
        <span className="text-sm">Lifetime (fwd)</span>
        <span className="text-sm font-semibold tabular-nums">
          {valuesUnlocked
            ? formatCompactCurrency(lifetimeForward)
            : formatTaxShare(lifetimeForward, paidAnnual * 25, false)}
        </span>
      </div>
    </div>
  );
}

export function TaxPaidBreakdownDesktop({
  rows,
  valuesUnlocked,
  paidAnnual,
}: {
  rows: TaxPaidBucket[];
  valuesUnlocked: boolean;
  paidAnnual: number;
}) {
  const lifetimeTotal = paidAnnual * 25;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bucket</TableHead>
          <TableHead className="text-right">YTD</TableHead>
          <TableHead className="text-right">Rest of yr</TableHead>
          <TableHead className="text-right">Lifetime</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.bucket}>
            <TableCell>{row.bucket}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatTaxShare(row.ytd, paidAnnual, valuesUnlocked)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatTaxShare(row.restOfYear, paidAnnual, valuesUnlocked)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatTaxShare(row.lifetime, lifetimeTotal, valuesUnlocked)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function TaxDeferredTable({
  rows,
  valuesUnlocked,
  paidAnnual,
}: {
  rows: Array<{ year: number; deferred: number; contributions: number; isYtd?: boolean }>;
  valuesUnlocked: boolean;
  paidAnnual: number;
}) {
  const deferredTotal = rows.reduce((sum, row) => sum + row.deferred, 0);
  const contributionTotal = rows.reduce((sum, row) => sum + row.contributions, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Year</TableHead>
          <TableHead className="text-right">Deferred</TableHead>
          <TableHead className="text-right">Contributions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.year}>
            <TableCell>
              {row.year}
              {row.isYtd ? " · YTD" : ""}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatTaxShare(
                row.deferred,
                valuesUnlocked ? deferredTotal : paidAnnual,
                valuesUnlocked
              )}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatTaxShare(
                row.contributions,
                valuesUnlocked ? contributionTotal : paidAnnual,
                valuesUnlocked
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
