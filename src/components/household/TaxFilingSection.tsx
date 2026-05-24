"use client";

import { HOUSEHOLD_FILING_STATUSES } from "@/components/HouseholdForm";
import { countDependentsFromMembers, type MemberDraft } from "@/lib/household-types";

type TaxFilingSectionProps = {
  taxYear: number;
  filingStatus: string;
  members: MemberDraft[];
  onTaxYearChange: (year: number) => void;
  onFilingStatusChange: (status: string) => void;
};

export function TaxFilingSection({
  taxYear,
  filingStatus,
  members,
  onTaxYearChange,
  onFilingStatusChange,
}: TaxFilingSectionProps) {
  const dependentCount = countDependentsFromMembers(members);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/10 p-4">
      <h3 className="text-sm font-semibold">Tax filing ({taxYear})</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Tax year
          <input
            type="number"
            min={2020}
            max={2100}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 min-h-11"
            value={taxYear}
            onChange={(e) =>
              onTaxYearChange(parseInt(e.target.value, 10) || taxYear)
            }
          />
        </label>
        <label className="block text-sm">
          Filing status
          <select
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 min-h-11"
            value={filingStatus}
            onChange={(e) => onFilingStatusChange(e.target.value)}
          >
            {HOUSEHOLD_FILING_STATUSES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Dependents on return:{" "}
        <span className="text-foreground font-medium">{dependentCount}</span>{" "}
        (from member roles)
      </p>
    </div>
  );
}
