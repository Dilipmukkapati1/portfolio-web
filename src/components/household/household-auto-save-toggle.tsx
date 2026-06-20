"use client";

import { useState } from "react";
import { useHousehold } from "@/components/HouseholdProvider";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function HouseholdAutoSaveToggle({ className }: { className?: string }) {
  const { household, refresh } = useHousehold();
  const [saving, setSaving] = useState(false);
  const enabled = household?.settings?.advisorAutoSave !== false;

  async function onToggle(next: boolean) {
    if (saving) return;
    setSaving(true);
    try {
      await api.updateHousehold({
        settings: {
          ...household?.settings,
          advisorAutoSave: next,
        },
      });
      await refresh();
    } catch {
      // HouseholdProvider refresh on next load will reconcile state.
    } finally {
      setSaving(false);
    }
  }

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 text-xs text-muted-foreground sm:text-sm",
        saving && "opacity-60",
        className
      )}
    >
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-border"
        checked={enabled}
        disabled={saving || !household}
        onChange={(e) => void onToggle(e.target.checked)}
      />
      <span>Auto-save updates</span>
    </label>
  );
}

/** @deprecated Use HouseholdAutoSaveToggle */
export const AdvisorAutoSaveToggle = HouseholdAutoSaveToggle;
