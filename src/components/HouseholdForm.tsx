"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MemberListEditor } from "@/components/household/MemberListEditor";
import { TaxFilingSection } from "@/components/household/TaxFilingSection";
import type { Household, Member, MemberDraft, TaxProfile } from "@/lib/household-types";
import { householdState } from "@/lib/household-types";
import { newLocalId } from "@/lib/id";

export const HOUSEHOLD_PERSONAS = [
  { value: "w2_employee", label: "W-2 employee" },
  { value: "low_income", label: "Lower income / benefits focus" },
  { value: "business_owner", label: "Business owner" },
  { value: "family_with_kids", label: "Family with kids" },
] as const;

export const HOUSEHOLD_FILING_STATUSES = [
  { value: "single", label: "Single" },
  { value: "married_filing_jointly", label: "Married filing jointly" },
  { value: "head_of_household", label: "Head of household" },
] as const;

export type HouseholdFormValues = {
  householdId: string;
  displayName: string;
  primaryState: string;
  persona: string;
  filingStatus: string;
  defaultTaxYear: number;
  members: MemberDraft[];
};

export const defaultHouseholdFormValues: HouseholdFormValues = {
  householdId: "",
  displayName: "My Household",
  primaryState: "CA",
  persona: "w2_employee",
  filingStatus: "single",
  defaultTaxYear: new Date().getFullYear(),
  members: [
    {
      id: newLocalId(),
      name: "Primary earner",
      relationship: "self",
      isActive: true,
      incomeSources: [],
      contributions: [],
    },
  ],
};

export function suggestHouseholdId(): string {
  return `household-${Date.now().toString(36)}`;
}

export function memberToDraft(m: Member): MemberDraft {
  return {
    id: m.id,
    name: m.name,
    relationship: m.relationship,
    isActive: m.isActive,
    incomeSources: m.incomeSources,
    contributions: m.contributions,
  };
}

export function householdToFormValues(
  household: Household,
  members: Member[] = [],
  taxProfile?: TaxProfile | null
): HouseholdFormValues {
  const year =
    taxProfile?.taxYear ??
    household.settings?.defaultTaxYear ??
    new Date().getFullYear();
  return {
    householdId: household.householdId,
    displayName: household.displayName,
    primaryState: householdState(household),
    persona: household.persona,
    filingStatus:
      taxProfile?.filingStatus ?? household.filingStatus ?? "single",
    defaultTaxYear: year,
    members:
      members.length > 0
        ? members.map(memberToDraft)
        : defaultHouseholdFormValues.members,
  };
}

type HouseholdFormProps = {
  resetKey: string;
  initialValues?: HouseholdFormValues;
  submitLabel: string;
  saving?: boolean;
  showHouseholdId?: boolean;
  householdIdReadOnly?: boolean;
  onSubmit: (values: HouseholdFormValues) => Promise<void>;
  onCancel?: () => void;
  footer?: React.ReactNode;
};

export function HouseholdForm({
  resetKey,
  initialValues = defaultHouseholdFormValues,
  submitLabel,
  saving = false,
  showHouseholdId = false,
  householdIdReadOnly = false,
  onSubmit,
  onCancel,
  footer,
}: HouseholdFormProps) {
  const [values, setValues] = useState<HouseholdFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues(initialValues);
    setError(null);
    // Only reset when parent opens create/edit — not on unrelated re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (showHouseholdId && !values.householdId.trim()) {
      setError("Household ID is required.");
      return;
    }
    if (
      showHouseholdId &&
      !/^[a-zA-Z0-9_-]+$/.test(values.householdId.trim())
    ) {
      setError("Household ID: letters, numbers, hyphens, underscores only.");
      return;
    }
    if (!values.displayName.trim()) {
      setError("Display name is required.");
      return;
    }
    if (values.primaryState.length !== 2) {
      setError("State must be a 2-letter code (e.g. CA).");
      return;
    }
    const activeMembers = values.members.filter((m) => m.isActive);
    if (activeMembers.length === 0) {
      setError("Add at least one active member.");
      return;
    }
    for (const m of activeMembers) {
      if (!m.name.trim()) {
        setError("Each member needs a name.");
        return;
      }
    }

    try {
      await onSubmit({
        ...values,
        householdId: values.householdId.trim(),
        displayName: values.displayName.trim(),
        primaryState: values.primaryState.toUpperCase(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-y-contain pr-1 pb-2 [-webkit-overflow-scrolling:touch]">
        {showHouseholdId && (
          <label className="block text-sm">
            Household ID
            <input
              className="mt-1 w-full rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm min-h-11"
              value={values.householdId}
              readOnly={householdIdReadOnly}
              placeholder="e.g. local-household"
              onChange={(e) =>
                setValues((v) => ({ ...v, householdId: e.target.value }))
              }
            />
            {householdIdReadOnly && (
              <span className="mt-1 block text-xs text-muted-foreground">
                Cannot be changed after creation.
              </span>
            )}
          </label>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Household profile</h3>
          <label className="block text-sm">
            Display name
            <input
              className="mt-1 w-full rounded-md border border-border bg-muted px-3 py-2 min-h-11"
              value={values.displayName}
              onChange={(e) =>
                setValues((v) => ({ ...v, displayName: e.target.value }))
              }
            />
          </label>
          <label className="block text-sm">
            State (2-letter)
            <input
              className="mt-1 w-full rounded-md border border-border bg-muted px-3 py-2 uppercase min-h-11"
              value={values.primaryState}
              maxLength={2}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  primaryState: e.target.value.toUpperCase(),
                }))
              }
            />
          </label>
          <label className="block text-sm">
            Persona
            <select
              className="mt-1 w-full rounded-md border border-border bg-muted px-3 py-2 min-h-11"
              value={values.persona}
              onChange={(e) =>
                setValues((v) => ({ ...v, persona: e.target.value }))
              }
            >
              {HOUSEHOLD_PERSONAS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <TaxFilingSection
          taxYear={values.defaultTaxYear}
          filingStatus={values.filingStatus}
          members={values.members}
          onTaxYearChange={(defaultTaxYear) =>
            setValues((v) => ({ ...v, defaultTaxYear }))
          }
          onFilingStatusChange={(filingStatus) =>
            setValues((v) => ({ ...v, filingStatus }))
          }
        />

        <MemberListEditor
          members={values.members}
          onChange={(members) => setValues((v) => ({ ...v, members }))}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <div className="mt-4 flex shrink-0 flex-wrap gap-2 border-t border-border bg-card pt-4">
        <Button type="submit" disabled={saving} className="min-h-11 flex-1 sm:flex-none">
          {saving ? "Saving…" : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            className="min-h-11 flex-1 sm:flex-none"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          disabled={saving}
          className="min-h-11"
          onClick={() => {
            setValues(initialValues);
            setError(null);
          }}
        >
          Reset
        </Button>
        {footer}
      </div>
    </form>
  );
}
