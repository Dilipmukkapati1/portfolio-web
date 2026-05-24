"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHousehold } from "@/components/HouseholdProvider";
import {
  HouseholdForm,
  defaultHouseholdFormValues,
  householdToFormValues,
  suggestHouseholdId,
  type HouseholdFormValues,
} from "@/components/HouseholdForm";
import { PageHeader } from "@/components/shared/page-header";
import type { Household, Member, TaxProfile } from "@/lib/household-types";
import { FILING_LABELS, householdState } from "@/lib/household-types";
import {
  registerHouseholdId,
  removeHouseholdsFromRegistry,
  syncHouseholdRegistry,
} from "@/lib/household-session";
import { cn } from "@/lib/utils";
import { newLocalId } from "@/lib/id";

type PanelMode = "create" | "edit" | null;

export default function HouseholdManagePage() {
  const { householdId: activeId, setHouseholdId, refresh } = useHousehold();

  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [panel, setPanel] = useState<PanelMode>(null);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(
    null
  );
  const [editMembers, setEditMembers] = useState<Member[]>([]);
  const [editTaxProfile, setEditTaxProfile] = useState<TaxProfile | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [createFormKey, setCreateFormKey] = useState(() => suggestHouseholdId());

  const loadHouseholds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { households: list } = await api.listHouseholds();
      setHouseholds(list);
      syncHouseholdRegistry(list.map((h) => h.householdId));
      setSelected((prev) => {
        const next = new Set<string>();
        for (const id of prev) {
          if (list.some((h) => h.householdId === id)) next.add(id);
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load households");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHouseholds();
  }, [loadHouseholds]);

  useEffect(() => {
    if (!panel) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) closePanel();
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [panel, saving]);

  const allSelected =
    households.length > 0 && selected.size === households.length;
  const someSelected = selected.size > 0;

  const sortedHouseholds = useMemo(
    () =>
      [...households].sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
      ),
    [households]
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(households.map((h) => h.householdId)));
  }

  async function openCreate() {
    setEditingHousehold(null);
    setEditMembers([]);
    setEditTaxProfile(null);
    setCreateFormKey(suggestHouseholdId());
    setPanel("create");
    setMessage(null);
    setError(null);
  }

  async function openEdit(household: Household) {
    setEditingHousehold(household);
    setPanel("edit");
    setMessage(null);
    setPanelLoading(true);
    try {
      const year =
        household.settings?.defaultTaxYear ?? new Date().getFullYear();
      const [membersRes, taxProfile] = await Promise.all([
        api.listMembers(household.householdId).catch(() => ({ members: [] })),
        api.getTaxProfile(year, household.householdId).catch(() => null),
      ]);
      setEditMembers(membersRes.members);
      setEditTaxProfile(taxProfile);
    } finally {
      setPanelLoading(false);
    }
  }

  function closePanel() {
    if (saving) return;
    setPanel(null);
    setEditingHousehold(null);
    setEditMembers([]);
    setEditTaxProfile(null);
  }

  async function saveHouseholdBundle(
    householdId: string,
    values: HouseholdFormValues,
    isCreate: boolean
  ) {
    const { householdId: _hid, members, filingStatus, defaultTaxYear, ...profile } =
      values;

    if (isCreate) {
      await api.createHouseholdWithId({
        householdId,
        displayName: profile.displayName,
        primaryState: profile.primaryState,
        state: profile.primaryState,
        persona: profile.persona,
        settings: { defaultTaxYear },
      });
    } else {
      await api.updateHouseholdById(householdId, {
        displayName: profile.displayName,
        primaryState: profile.primaryState,
        state: profile.primaryState,
        persona: profile.persona,
        settings: { defaultTaxYear },
      });
    }

    await api.saveMembers(
      members.map((m) => ({
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
      defaultTaxYear,
      { filingStatus },
      householdId
    );
  }

  async function handleCreate(values: HouseholdFormValues) {
    setSaving(true);
    setError(null);
    try {
      const { householdId } = values;
      await saveHouseholdBundle(householdId, values, true);
      registerHouseholdId(householdId);
      setHouseholdId(householdId);
      setMessage(`Created "${values.displayName}".`);
      closePanel();
      await loadHouseholds();
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create household";
      setError(msg);
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(values: HouseholdFormValues) {
    if (!editingHousehold) return;
    setSaving(true);
    setError(null);
    try {
      await saveHouseholdBundle(editingHousehold.householdId, values, false);
      setMessage(`Updated "${values.displayName}".`);
      closePanel();
      await loadHouseholds();
      if (editingHousehold.householdId === activeId) await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update household";
      setError(msg);
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelected() {
    const ids = [...selected];
    if (ids.length === 0) return;

    const labels = ids
      .map((id) => households.find((h) => h.householdId === id)?.displayName ?? id)
      .join(", ");
    if (
      !window.confirm(
        `Delete ${ids.length} household(s)?\n\n${labels}\n\nThis removes profiles, members, and tax data.`
      )
    ) {
      return;
    }

    setDeleting(true);
    setMessage(null);
    setError(null);
    try {
      const result = await api.deleteHouseholds(ids);
      removeHouseholdsFromRegistry(result.deleted);
      setSelected(new Set());

      if (result.deleted.includes(activeId)) {
        const remaining = households.filter(
          (h) => !result.deleted.includes(h.householdId)
        );
        if (remaining[0]) setHouseholdId(remaining[0].householdId);
      }

      if (result.failed.length > 0) {
        setError(
          `Some deletes failed: ${result.failed.map((f) => `${f.householdId}: ${f.reason}`).join("; ")}`
        );
      } else {
        setMessage(`Deleted ${result.deleted.length} household(s).`);
      }

      await loadHouseholds();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const createInitial = useMemo(
    (): HouseholdFormValues => ({
      ...defaultHouseholdFormValues,
      householdId: createFormKey,
      members: defaultHouseholdFormValues.members.map((m) => ({
        ...m,
        id: newLocalId(),
      })),
    }),
    [createFormKey]
  );

  const editInitial = useMemo((): HouseholdFormValues | null => {
    if (panel !== "edit" || !editingHousehold || panelLoading) return null;
    return householdToFormValues(editingHousehold, editMembers, editTaxProfile);
  }, [panel, editingHousehold, editMembers, editTaxProfile, panelLoading]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl space-y-6"
    >
      <PageHeader
        title="Households"
        description={`Manage profile, members, and tax filing. Active: ${activeId}`}
      />

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        <Button type="button" onClick={openCreate} className="min-h-11">
          Create household
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!someSelected || deleting}
          className="min-h-11"
          onClick={() => void deleteSelected()}
        >
          {deleting ? "Deleting…" : `Delete selected (${selected.size})`}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11"
          onClick={() => void loadHouseholds()}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-400 rounded-md bg-red-500/10 px-3 py-2">
          {error}
        </p>
      )}
      {message && (
        <p className="text-sm text-green-400 rounded-md bg-green-500/10 px-3 py-2">
          {message}
        </p>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All households</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>
          ) : sortedHouseholds.length === 0 ? (
            <div className="px-4 py-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                No households yet. Create one to get started.
              </p>
              <Button type="button" onClick={openCreate} className="min-h-11">
                Create household
              </Button>
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-border">
                {sortedHouseholds.map((h) => {
                  const isActive = h.householdId === activeId;
                  const isSelected = selected.has(h.householdId);
                  const filing =
                    FILING_LABELS[h.filingStatus ?? ""] ??
                    h.filingStatus ??
                    "—";
                  return (
                    <div
                      key={h.householdId}
                      className={cn(
                        "p-4 space-y-3",
                        isActive && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 min-h-4 min-w-4"
                          checked={isSelected}
                          aria-label={`Select ${h.displayName}`}
                          onChange={() => toggleSelect(h.householdId)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{h.displayName}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {h.householdId}
                            {isActive && (
                              <span className="ml-2 text-primary">active</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {householdState(h)} · {filing}
                            {h.dependents !== undefined && (
                              <> · {h.dependents} dependent{h.dependents === 1 ? "" : "s"}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pl-7">
                        {!isActive && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-h-11 flex-1"
                            onClick={() => setHouseholdId(h.householdId)}
                          >
                            Use
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="min-h-11 flex-1"
                          onClick={() => void openEdit(h)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          aria-label="Select all households"
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">State</th>
                      <th className="px-4 py-3 font-medium">Filing</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHouseholds.map((h) => {
                      const isActive = h.householdId === activeId;
                      const isSelected = selected.has(h.householdId);
                      return (
                        <tr
                          key={h.householdId}
                          className={cn(
                            "border-b border-border/60 last:border-0",
                            isActive && "bg-primary/5"
                          )}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              aria-label={`Select ${h.displayName}`}
                              onChange={() => toggleSelect(h.householdId)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{h.displayName}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              {h.householdId}
                              {isActive && (
                                <span className="ml-2 text-primary">active</span>
                              )}
                            </p>
                          </td>
                          <td className="px-4 py-3">{householdState(h)}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {FILING_LABELS[h.filingStatus ?? ""] ??
                              h.filingStatus ??
                              "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end flex-wrap gap-2">
                              {!isActive && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setHouseholdId(h.householdId)}
                                >
                                  Use
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => void openEdit(h)}
                              >
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {panel && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 overscroll-contain"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) closePanel();
          }}
        >
          <Card
            className="flex h-[min(92dvh,100%)] max-h-[min(92dvh,100%)] w-full min-h-0 flex-col overflow-hidden rounded-t-xl sm:h-auto sm:max-h-[min(90vh,100%)] sm:max-w-2xl sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="shrink-0 border-b border-border py-4">
              <CardTitle className="text-lg sm:text-xl">
                {panel === "create" ? "Create household" : "Edit household"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 pt-4 sm:p-6 sm:pt-4">
              {panelLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Loading members…
                </p>
              ) : panel === "edit" && !editInitial ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Loading…
                </p>
              ) : (
                <HouseholdForm
                  resetKey={
                    panel === "create"
                      ? `create-${createFormKey}`
                      : `edit-${editingHousehold?.householdId}-${editingHousehold?.updatedAt}-${editMembers.length}`
                  }
                  initialValues={
                    panel === "create"
                      ? createInitial
                      : (editInitial ?? createInitial)
                  }
                  showHouseholdId
                  householdIdReadOnly={panel === "edit"}
                  submitLabel={
                    panel === "create" ? "Create household" : "Save changes"
                  }
                  saving={saving}
                  onSubmit={panel === "create" ? handleCreate : handleEdit}
                  onCancel={closePanel}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
