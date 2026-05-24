"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FILING_LABELS,
  PERSONA_LABELS,
  householdState,
  type Household,
} from "@/lib/household-types";
import { webEnv } from "@/lib/env";
import { cn } from "@/lib/utils";

type HouseholdSummaryProps = {
  household: Household;
  memberCount?: number;
  compact?: boolean;
  className?: string;
};

export function HouseholdSummary({
  household,
  memberCount,
  compact = false,
  className,
}: HouseholdSummaryProps) {
  const persona =
    PERSONA_LABELS[household.persona] ?? household.persona.replace(/_/g, " ");
  const filing =
    FILING_LABELS[household.filingStatus ?? ""] ??
    (household.filingStatus?.replace(/_/g, " ") ?? "—");
  const state = householdState(household);
  const dependents = household.dependents ?? 0;

  const memberLine =
    memberCount !== undefined
      ? `${memberCount} member${memberCount === 1 ? "" : "s"}`
      : null;

  if (compact) {
    return (
      <div className={cn("rounded-lg border border-border bg-muted/40 p-3", className)}>
        <p className="truncate text-sm font-semibold">{household.displayName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {state} · {filing}
          {memberLine ? ` · ${memberLine}` : dependents > 0 ? ` · ${dependents} dep.` : ""}
        </p>
        <p className="mt-1 truncate text-[10px] text-muted-foreground font-mono">
          {household.householdId}
        </p>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">{household.displayName}</CardTitle>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            ID: {household.householdId}
          </p>
        </div>
        <Link
          href="/household"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Edit
        </Link>
      </CardHeader>
      <CardContent className="text-sm space-y-1 text-muted-foreground">
        <p>
          <span className="text-foreground">State:</span> {state}
        </p>
        <p>
          <span className="text-foreground">Filing:</span> {filing}
        </p>
        <p>
          <span className="text-foreground">Persona:</span> {persona}
        </p>
        {memberLine && (
          <p>
            <span className="text-foreground">Members:</span> {memberLine}
          </p>
        )}
        <p>
          <span className="text-foreground">Dependents:</span> {dependents}
        </p>
        {household.updatedAt && (
          <p className="text-xs pt-1">
            Updated {new Date(household.updatedAt).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function HouseholdEmptyState({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="pt-6 space-y-3">
        <p className="text-sm text-muted-foreground">
          No household profile yet for{" "}
          <span className="font-mono text-foreground">{webEnv.defaultHouseholdId}</span>.
        </p>
        <Link
          href="/household"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Set up household
        </Link>
      </CardContent>
    </Card>
  );
}
