"use client";

import { useEffect, useState } from "react";
import type { ArchitectStrategy } from "@/lib/architect-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StrategyEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategy: ArchitectStrategy;
  onSave: (strategy: ArchitectStrategy) => Promise<void>;
};

export function StrategyEditorDialog({
  open,
  onOpenChange,
  strategy,
  onSave,
}: StrategyEditorDialogProps) {
  const [equities, setEquities] = useState(String(strategy.equitiesPercent));
  const [bonds, setBonds] = useState(String(strategy.bondsPercent));
  const [cash, setCash] = useState(String(strategy.cashPercent));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEquities(String(strategy.equitiesPercent));
    setBonds(String(strategy.bondsPercent));
    setCash(String(strategy.cashPercent));
    setError(null);
  }, [open, strategy]);

  const sum =
    Number(equities) + Number(bonds) + Number(cash);

  async function handleSave() {
    const next: ArchitectStrategy = {
      equitiesPercent: Number(equities),
      bondsPercent: Number(bonds),
      cashPercent: Number(cash),
    };
    if (
      [next.equitiesPercent, next.bondsPercent, next.cashPercent].some(
        (n) => !Number.isFinite(n) || n < 0 || n > 100
      )
    ) {
      setError("Each allocation must be between 0 and 100.");
      return;
    }
    if (Math.abs(sum - 100) > 0.05) {
      setError(`Allocations must total 100% (currently ${sum.toFixed(1)}%).`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(next);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save strategy");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit strategy overview</DialogTitle>
          <DialogDescription>
            Set your target mix across equities, bonds, and cash. Percentages must
            add up to 100%.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="equities">Equities %</Label>
            <Input
              id="equities"
              type="number"
              min={0}
              max={100}
              step={1}
              value={equities}
              onChange={(e) => setEquities(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bonds">Bonds %</Label>
            <Input
              id="bonds"
              type="number"
              min={0}
              max={100}
              step={1}
              value={bonds}
              onChange={(e) => setBonds(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cash">Cash %</Label>
            <Input
              id="cash"
              type="number"
              min={0}
              max={100}
              step={1}
              value={cash}
              onChange={(e) => setCash(e.target.value)}
            />
          </div>
          <p className="text-xs tabular-nums text-muted-foreground">
            Total: {Number.isFinite(sum) ? sum.toFixed(1) : "—"}%
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save strategy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
