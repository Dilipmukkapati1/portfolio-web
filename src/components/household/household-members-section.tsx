"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FILING_LABELS,
  RELATIONSHIP_LABELS,
  type Member,
} from "@/lib/household-types";
import { api } from "@/lib/api";
import { useHousehold } from "@/components/HouseholdProvider";
import { usePrivacy } from "@/components/PrivacyProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HouseholdForm,
  householdToFormValues,
  type HouseholdFormValues,
} from "@/components/HouseholdForm";
import { FormPanelSkeleton } from "@/components/shared/page-skeletons";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function memberSummary(member: Member, isUnlocked: boolean): string | null {
  const incomeTotal = (member.incomeSources ?? []).reduce(
    (sum, line) => sum + line.amount,
    0
  );
  const contribTotal = (member.contributions ?? []).reduce(
    (sum, line) => sum + line.amount,
    0
  );
  const parts: string[] = [];
  if ((member.incomeSources ?? []).length > 0) {
    parts.push(isUnlocked ? `${formatCurrency(incomeTotal)} income` : "Income set");
  }
  if ((member.contributions ?? []).length > 0) {
    parts.push(
      isUnlocked ? `${formatCurrency(contribTotal)} saved` : "Contributions set"
    );
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function HouseholdMembersSection({
  refreshToken,
  embedded = false,
}: {
  refreshToken?: number;
  embedded?: boolean;
}) {
  const { household, householdId, refresh } = useHousehold();
  const { isUnlocked, privacyVersion, showUnlockDialog } = usePrivacy();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState<HouseholdFormValues | null>(null);

  const loadMembers = useCallback(async () => {
    if (!household) return;
    setLoading(true);
    setError(null);
    try {
      const year = household.settings?.defaultTaxYear ?? new Date().getFullYear();
      const [membersRes, taxProfile] = await Promise.all([
        api.listMembers(householdId),
        api.getTaxProfile(year, householdId).catch(() => null),
      ]);
      if (
        "valuesUnlocked" in membersRes &&
        membersRes.valuesUnlocked === false
      ) {
        setMembers(
          membersRes.members.map((m) => ({
            ...m,
            incomeSources: [],
            contributions: [],
          }))
        );
      } else {
        setMembers(membersRes.members);
      }
      if (household) {
        setFormValues(
          householdToFormValues(household, membersRes.members, taxProfile)
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [household, householdId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers, privacyVersion, refreshToken]);

  async function openManageMembers() {
    if (!isUnlocked) {
      showUnlockDialog();
      return;
    }
    if (!household) return;
    setModalOpen(true);
    setModalLoading(true);
    try {
      await loadMembers();
    } finally {
      setModalLoading(false);
    }
  }

  async function saveMembers(values: HouseholdFormValues) {
    if (!household) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateHouseholdById(householdId, {
        displayName: values.displayName,
        primaryState: values.primaryState,
        state: values.primaryState,
        persona: values.persona,
        settings: { defaultTaxYear: values.defaultTaxYear },
      });
      await api.saveMembers(
        values.members.map((m) => ({
          id: m.id,
          name: m.name.trim(),
          relationship: m.relationship,
          isActive: m.isActive,
          incomeSources: m.incomeSources,
          contributions: m.contributions,
        })),
        householdId
      );
      await api.recomputeTaxProfile(
        values.defaultTaxYear,
        { filingStatus: values.filingStatus },
        householdId
      );
      setModalOpen(false);
      await loadMembers();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save members");
      throw e;
    } finally {
      setSaving(false);
    }
  }

  const filingLabel =
    FILING_LABELS[household?.filingStatus ?? ""] ?? household?.filingStatus ?? "—";

  const memberList = (
    <>
      {error && (
        <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : members.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center">
          <Button type="button" onClick={() => void openManageMembers()}>
            Add member
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {members
            .filter((m) => m.isActive)
            .map((member) => {
              const summary = memberSummary(member, isUnlocked);
              return (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {RELATIONSHIP_LABELS[member.relationship]}
                    </p>
                  </div>
                  {summary && (
                    <p className="shrink-0 text-xs text-muted-foreground text-right">
                      {summary}
                    </p>
                  )}
                </li>
              );
            })}
        </ul>
      )}
      {!isUnlocked && members.length > 0 && (
        <button
          type="button"
          className="text-xs text-primary underline"
          onClick={showUnlockDialog}
        >
          Unlock to see amounts
        </button>
      )}
    </>
  );

  const manageButton = (
    <Button
      type="button"
      className={cn(!embedded && "min-h-11")}
      size={embedded ? "sm" : "default"}
      onClick={() => void openManageMembers()}
    >
      {embedded ? "Edit" : "Add or edit members"}
    </Button>
  );

  const content = embedded ? (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground truncate">
          {household?.displayName ?? "Household"} ·{" "}
          {household?.primaryState ?? household?.state ?? "—"} · {filingLabel}
        </p>
        {manageButton}
      </div>
      {memberList}
    </div>
  ) : (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Members</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {household?.displayName ?? "Household"} ·{" "}
            {household?.primaryState ?? household?.state ?? "—"} · {filingLabel}
          </p>
        </div>
        {manageButton}
      </CardHeader>
      <CardContent className="space-y-3">{memberList}</CardContent>
    </Card>
  );

  return (
    <>
      {content}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) setModalOpen(false);
          }}
        >
          <Card
            className={cn(
              "flex h-[min(92dvh,100%)] max-h-[min(92dvh,100%)] w-full min-h-0 flex-col overflow-hidden",
              "rounded-t-xl sm:h-auto sm:max-h-[min(90vh,100%)] sm:max-w-2xl sm:rounded-xl"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="shrink-0 border-b border-border">
              <CardTitle className="text-lg">Members</CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
              {modalLoading || !formValues ? (
                <FormPanelSkeleton />
              ) : (
                <HouseholdForm
                  resetKey={`members-${household?.updatedAt}-${members.length}`}
                  initialValues={formValues}
                  showHouseholdId={false}
                  submitLabel="Save"
                  saving={saving}
                  onSubmit={saveMembers}
                  onCancel={() => !saving && setModalOpen(false)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
