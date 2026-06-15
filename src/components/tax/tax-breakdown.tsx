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
import { formatCurrencyWhole } from "@/lib/utils";
import type { TaxPaidBucket } from "@/lib/tax/outlook";

function fmt(value: number, unlocked: boolean): string {
  return unlocked ? formatCompactCurrency(value) : "—";
}

export function TaxPaidBreakdownMobile({
  rows,
  lifetimeForward,
  valuesUnlocked,
}: {
  rows: TaxPaidBucket[];
  lifetimeForward: number;
  valuesUnlocked: boolean;
}) {
  return (
    <div>
      {rows.map((row) => (
        <div key={row.bucket} className="border-b border-border px-3 py-2.5 last:border-b-0">
          <p className="text-sm font-medium">{row.bucket}</p>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">YTD</span>
            <span className="tabular-nums">{fmt(row.ytd, valuesUnlocked)}</span>
          </div>
          <div className="mt-0.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rest</span>
            <span className="tabular-nums text-muted-foreground">
              {fmt(row.restOfYear, valuesUnlocked)}
            </span>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-sm">Lifetime (fwd)</span>
        <span className="text-sm font-semibold tabular-nums">
          {valuesUnlocked ? formatCompactCurrency(lifetimeForward) : "—"}
        </span>
      </div>
    </div>
  );
}

export function TaxPaidBreakdownDesktop({
  rows,
  valuesUnlocked,
}: {
  rows: TaxPaidBucket[];
  valuesUnlocked: boolean;
}) {
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
              {fmt(row.ytd, valuesUnlocked)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {fmt(row.restOfYear, valuesUnlocked)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {fmt(row.lifetime, valuesUnlocked)}
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
}: {
  rows: Array<{ year: number; deferred: number; contributions: number; isYtd?: boolean }>;
  valuesUnlocked: boolean;
}) {
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
              {valuesUnlocked ? formatCompactCurrency(row.deferred) : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {valuesUnlocked ? formatCompactCurrency(row.contributions) : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function formatTaxTotal(value: number, unlocked: boolean): string {
  return unlocked ? formatCurrencyWhole(value) : "—";
}
