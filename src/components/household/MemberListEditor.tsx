"use client";

import { Button } from "@/components/ui/button";
import { MemberCardEditor } from "@/components/household/MemberCardEditor";
import type { MemberDraft } from "@/lib/household-types";
import { newLocalId } from "@/lib/id";

type MemberListEditorProps = {
  members: MemberDraft[];
  onChange: (members: MemberDraft[]) => void;
};

export function MemberListEditor({ members, onChange }: MemberListEditorProps) {
  function addMember() {
    onChange([
      ...members,
      {
        id: newLocalId(),
        name: "",
        relationship: members.length === 0 ? "self" : "other",
        isActive: true,
        incomeSources: [],
        contributions: [],
      },
    ]);
  }

  function updateMember(index: number, member: MemberDraft) {
    onChange(members.map((m, i) => (i === index ? member : m)));
  }

  function removeMember(index: number) {
    const m = members[index];
    const hasData =
      m.name.trim() ||
      m.incomeSources.length > 0 ||
      m.contributions.length > 0;
    if (
      hasData &&
      !window.confirm(`Remove ${m.name.trim() || "this member"}?`)
    ) {
      return;
    }
    onChange(members.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Family members</h3>
          <p className="text-xs text-muted-foreground">
            Dependents are counted automatically from members with role
            &quot;Dependent&quot;.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full sm:w-auto"
          onClick={addMember}
        >
          Add member
        </Button>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground rounded-md border border-dashed border-border px-4 py-6 text-center">
          No members yet. Add at least one primary earner.
        </p>
      ) : (
        <div className="space-y-3">
          {members.map((member, index) => (
            <MemberCardEditor
              key={member.id ?? `idx-${index}`}
              member={member}
              index={index}
              onChange={(m) => updateMember(index, m)}
              onRemove={() => removeMember(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
