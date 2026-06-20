"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicAmountRow } from "@/components/household/DynamicAmountRow";
import {
  CONTRIBUTION_TYPE_OPTIONS,
  INCOME_SOURCE_OPTIONS,
  RELATIONSHIP_LABELS,
  type ContributionLineItem,
  type IncomeLineItem,
  type IncomeSourceType,
  type MemberDraft,
  type MemberRelationship,
  type ContributionType,
} from "@/lib/household-types";
import { newLocalId } from "@/lib/id";
import { cn } from "@/lib/utils";

type MemberCardEditorProps = {
  member: MemberDraft;
  index: number;
  onChange: (member: MemberDraft) => void;
  onRemove: () => void;
};

function wagesAmount(member: MemberDraft): number {
  return (
    member.incomeSources.find((i) => i.type === "wages")?.amount ?? 0
  );
}

function bonusAmount(member: MemberDraft): number {
  const line = member.incomeSources.find((i) => i.type === "bonus");
  if (!line) return 0;
  if (line.amountMode === "percent_of_wages" && line.percent != null) {
    return Math.round((wagesAmount(member) * line.percent) / 100);
  }
  return line.amount;
}

function previewEmployerMatch(member: MemberDraft, line: ContributionLineItem): number {
  const mode = line.amountMode ?? "fixed";
  if (mode === "fixed") return line.amount;
  const base =
    mode === "percent_of_wages_and_bonus"
      ? wagesAmount(member) + bonusAmount(member)
      : wagesAmount(member);
  return Math.round((base * (line.percent ?? 0)) / 100);
}

export function MemberCardEditor({
  member,
  index,
  onChange,
  onRemove,
}: MemberCardEditorProps) {
  const [open, setOpen] = useState(index === 0);
  const isDependent = member.relationship === "dependent";

  const usedIncomeTypes = new Set(member.incomeSources.map((i) => i.type));
  const usedContributionTypes = new Set(
    member.contributions.map((c) => c.type)
  );

  const availableIncome = INCOME_SOURCE_OPTIONS.filter(
    (o) => !usedIncomeTypes.has(o.value)
  );
  const availableContributions = CONTRIBUTION_TYPE_OPTIONS.filter(
    (o) => !usedContributionTypes.has(o.value)
  );

  function updateIncome(next: IncomeLineItem[]) {
    onChange({ ...member, incomeSources: next });
  }

  function updateContributions(next: ContributionLineItem[]) {
    onChange({ ...member, contributions: next });
  }

  function addIncome(type: IncomeSourceType) {
    const base: IncomeLineItem = { id: newLocalId(), type, amount: 0 };
    if (type === "bonus") {
      base.amountMode = "fixed";
    }
    updateIncome([...member.incomeSources, base]);
  }

  function addContribution(type: ContributionType) {
    const base: ContributionLineItem = { id: newLocalId(), type, amount: 0 };
    if (type === "employer_match") {
      base.amountMode = "fixed";
    }
    updateContributions([...member.contributions, base]);
  }

  const summary =
    member.incomeSources.length === 0 && member.contributions.length === 0
      ? "No income or contributions"
      : [
          member.incomeSources.length > 0
            ? `${member.incomeSources.length} income`
            : null,
          member.contributions.length > 0
            ? `${member.contributions.length} contribution`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 min-h-11 text-left hover:bg-muted/40"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">
            {member.name.trim() || `Member ${index + 1}`}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {RELATIONSHIP_LABELS[member.relationship]} · {summary}
          </p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" />
        )}
      </button>

      <div
        className={cn(
          "border-t border-border px-4 pb-4 space-y-4",
          !open && "hidden"
        )}
      >
        <div className="grid gap-3 sm:grid-cols-2 pt-3">
          <label className="block text-sm">
            Name
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 min-h-11"
              value={member.name}
              onChange={(e) => onChange({ ...member, name: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Relationship
            <select
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 min-h-11"
              value={member.relationship}
              onChange={(e) =>
                onChange({
                  ...member,
                  relationship: e.target.value as MemberRelationship,
                })
              }
            >
              {(
                Object.entries(RELATIONSHIP_LABELS) as [
                  MemberRelationship,
                  string,
                ][]
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Income sources</p>
          {member.incomeSources.length === 0 ? (
            <p className="text-xs text-muted-foreground mb-2">
              Add income types as needed to keep the form short.
            </p>
          ) : (
            <div className="space-y-2 mb-2">
              {member.incomeSources.map((line) => {
                const label =
                  INCOME_SOURCE_OPTIONS.find((o) => o.value === line.type)
                    ?.label ?? line.type;

                if (line.type === "bonus") {
                  const mode = line.amountMode ?? "fixed";
                  const preview =
                    mode === "percent_of_wages"
                      ? bonusAmount(member)
                      : line.amount;
                  return (
                    <div
                      key={line.id}
                      className="rounded-md border border-border/60 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                          {label}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateIncome(
                              member.incomeSources.filter(
                                (i) => i.id !== line.id
                              )
                            )
                          }
                        >
                          Remove
                        </Button>
                      </div>
                      <select
                        className="w-full rounded-md border border-border bg-background px-3 py-2 min-h-11 text-sm"
                        value={mode}
                        onChange={(e) =>
                          updateIncome(
                            member.incomeSources.map((i) =>
                              i.id === line.id
                                ? {
                                    ...i,
                                    amountMode: e.target
                                      .value as IncomeLineItem["amountMode"],
                                  }
                                : i
                            )
                          )
                        }
                      >
                        <option value="fixed">Fixed $ amount</option>
                        <option value="percent_of_wages">
                          % of base salary
                        </option>
                      </select>
                      {mode === "percent_of_wages" ? (
                        <label className="block text-sm">
                          Percent
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 min-h-11"
                            value={line.percent ?? ""}
                            onChange={(e) =>
                              updateIncome(
                                member.incomeSources.map((i) =>
                                  i.id === line.id
                                    ? {
                                        ...i,
                                        percent:
                                          parseFloat(e.target.value) || 0,
                                      }
                                    : i
                                )
                              )
                            }
                          />
                          <span className="text-xs text-muted-foreground">
                            Preview: ${preview.toLocaleString()}/yr
                          </span>
                        </label>
                      ) : (
                        <DynamicAmountRow
                          typeLabel="Annual bonus"
                          amount={line.amount}
                          onAmountChange={(amount) =>
                            updateIncome(
                              member.incomeSources.map((i) =>
                                i.id === line.id ? { ...i, amount } : i
                              )
                            )
                          }
                          onRemove={() =>
                            updateIncome(
                              member.incomeSources.filter(
                                (i) => i.id !== line.id
                              )
                            )
                          }
                        />
                      )}
                    </div>
                  );
                }

                return (
                  <DynamicAmountRow
                    key={line.id}
                    typeLabel={label}
                    amount={line.amount}
                    onAmountChange={(amount) =>
                      updateIncome(
                        member.incomeSources.map((i) =>
                          i.id === line.id ? { ...i, amount } : i
                        )
                      )
                    }
                    onRemove={() =>
                      updateIncome(
                        member.incomeSources.filter((i) => i.id !== line.id)
                      )
                    }
                  />
                );
              })}
            </div>
          )}
          {availableIncome.length > 0 && (
            <label className="block text-sm">
              <span className="sr-only">Add income source</span>
              <select
                className="w-full rounded-md border border-dashed border-border bg-background px-3 py-2 min-h-11 text-muted-foreground"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    addIncome(e.target.value as IncomeSourceType);
                  }
                }}
              >
                <option value="">+ Add income source</option>
                {availableIncome.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {!isDependent && (
          <div>
            <p className="text-sm font-medium mb-2">Contributions</p>
            {member.contributions.length === 0 ? (
              <p className="text-xs text-muted-foreground mb-2">
                No contributions yet. Add 401(k), HSA, IRA, and more.
              </p>
            ) : (
              <div className="space-y-2 mb-2">
                {member.contributions.map((line) => {
                  const label =
                    CONTRIBUTION_TYPE_OPTIONS.find((o) => o.value === line.type)
                      ?.label ?? line.type;

                  if (line.type === "employer_match") {
                    const mode = line.amountMode ?? "fixed";
                    const preview = previewEmployerMatch(member, line);
                    return (
                      <div
                        key={line.id}
                        className="rounded-md border border-border/60 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-muted-foreground">
                            {label}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateContributions(
                                member.contributions.filter(
                                  (c) => c.id !== line.id
                                )
                              )
                            }
                          >
                            Remove
                          </Button>
                        </div>
                        <select
                          className="w-full rounded-md border border-border bg-background px-3 py-2 min-h-11 text-sm"
                          value={mode}
                          onChange={(e) =>
                            updateContributions(
                              member.contributions.map((c) =>
                                c.id === line.id
                                  ? {
                                      ...c,
                                      amountMode: e.target
                                        .value as ContributionLineItem["amountMode"],
                                    }
                                  : c
                              )
                            )
                          }
                        >
                          <option value="fixed">Fixed $ amount</option>
                          <option value="percent_of_wages">
                            % of base salary
                          </option>
                          <option value="percent_of_wages_and_bonus">
                            % of base + bonus
                          </option>
                        </select>
                        {mode === "fixed" ? (
                          <DynamicAmountRow
                            typeLabel="Annual match"
                            amount={line.amount}
                            onAmountChange={(amount) =>
                              updateContributions(
                                member.contributions.map((c) =>
                                  c.id === line.id ? { ...c, amount } : c
                                )
                              )
                            }
                            onRemove={() =>
                              updateContributions(
                                member.contributions.filter(
                                  (c) => c.id !== line.id
                                )
                              )
                            }
                          />
                        ) : (
                          <label className="block text-sm">
                            Percent
                            <input
                              type="number"
                              min={0}
                              max={100}
                              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 min-h-11"
                              value={line.percent ?? ""}
                              onChange={(e) =>
                                updateContributions(
                                  member.contributions.map((c) =>
                                    c.id === line.id
                                      ? {
                                          ...c,
                                          percent:
                                            parseFloat(e.target.value) || 0,
                                          amount: previewEmployerMatch(member, {
                                            ...c,
                                            percent:
                                              parseFloat(e.target.value) || 0,
                                          }),
                                        }
                                      : c
                                  )
                                )
                              }
                            />
                            <span className="text-xs text-muted-foreground">
                              Preview: ${preview.toLocaleString()}/yr
                            </span>
                          </label>
                        )}
                      </div>
                    );
                  }

                  return (
                    <DynamicAmountRow
                      key={line.id}
                      typeLabel={label}
                      amount={line.amount}
                      onAmountChange={(amount) =>
                        updateContributions(
                          member.contributions.map((c) =>
                            c.id === line.id ? { ...c, amount } : c
                          )
                        )
                      }
                      onRemove={() =>
                        updateContributions(
                          member.contributions.filter((c) => c.id !== line.id)
                        )
                      }
                    />
                  );
                })}
              </div>
            )}
            {availableContributions.length > 0 && (
              <label className="block text-sm">
                <span className="sr-only">Add contribution</span>
                <select
                  className="w-full rounded-md border border-dashed border-border bg-background px-3 py-2 min-h-11 text-muted-foreground"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      addContribution(e.target.value as ContributionType);
                    }
                  }}
                >
                  <option value="">+ Add contribution</option>
                  {availableContributions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={onRemove}
        >
          Remove member
        </Button>
      </div>
    </div>
  );
}
