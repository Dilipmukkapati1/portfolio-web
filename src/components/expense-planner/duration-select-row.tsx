"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DURATION_OPTIONS, type DurationPreset } from "@/lib/expense-planner/date-ranges";

export type OverviewPieView = "category" | "account";

const PIE_VIEW_OPTIONS: { value: OverviewPieView; label: string }[] = [
  { value: "category", label: "By category" },
  { value: "account", label: "By account" },
];

export function DurationSelectRow({
  duration,
  onDurationChange,
  pieView,
  onPieViewChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  rangeLabel,
  rangeError,
}: {
  duration: DurationPreset;
  onDurationChange: (v: DurationPreset) => void;
  pieView: OverviewPieView;
  onPieViewChange: (v: OverviewPieView) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (v: string) => void;
  onCustomEndChange: (v: string) => void;
  rangeLabel: string;
  rangeError: string | null;
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select value={duration} onValueChange={(v) => onDurationChange(v as DurationPreset)}>
          <SelectTrigger className="min-w-0 flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={pieView} onValueChange={(v) => onPieViewChange(v as OverviewPieView)}>
          <SelectTrigger className="min-w-0 flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PIE_VIEW_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {duration === "custom" && (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => onCustomStartChange(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onCustomEndChange(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
      )}
      {rangeError ? (
        <p className="text-sm text-destructive">{rangeError}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Showing {rangeLabel}</p>
      )}
    </div>
  );
}
