"use client";

import { useMemo, useState } from "react";
import type {
  ArchitectAssetClass,
  ArchitectDashboard,
} from "@/lib/architect-types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CatalogItem = ArchitectDashboard["catalog"][number];

type AddAssetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: CatalogItem[];
  existingSymbols: string[];
  onSave: (target: {
    symbol: string;
    name: string;
    assetClass: ArchitectAssetClass;
    plannedPercent: number;
  }) => Promise<void>;
};

export function AddAssetDialog({
  open,
  onOpenChange,
  catalog,
  existingSymbols,
  onSave,
}: AddAssetDialogProps) {
  const [query, setQuery] = useState("");
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [assetClass, setAssetClass] = useState<ArchitectAssetClass>("equity");
  const [plannedPercent, setPlannedPercent] = useState("5");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return catalog;
    return catalog.filter(
      (item) =>
        item.symbol.includes(q) || item.name.toUpperCase().includes(q)
    );
  }, [catalog, query]);

  function pickItem(item: CatalogItem) {
    setSymbol(item.symbol);
    setName(item.name);
    setAssetClass(item.assetClass);
    setQuery(item.symbol);
    setError(null);
  }

  function resetForm() {
    setQuery("");
    setSymbol("");
    setName("");
    setAssetClass("equity");
    setPlannedPercent("5");
    setError(null);
  }

  async function handleSave() {
    const sym = symbol.trim().toUpperCase();
    const displayName = name.trim() || sym;
    const planned = Number(plannedPercent);
    if (!sym) {
      setError("Select or enter a symbol.");
      return;
    }
    if (!Number.isFinite(planned) || planned <= 0 || planned > 100) {
      setError("Planned % must be between 0 and 100.");
      return;
    }
    if (existingSymbols.includes(sym)) {
      setError(`${sym} is already in your plan. Edit its planned % instead.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        symbol: sym,
        name: displayName,
        assetClass,
        plannedPercent: planned,
      });
      resetForm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add asset");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        onOpenChange(next);
      }}
    >
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add asset to plan</DialogTitle>
          <DialogDescription>
            Choose an ETF or stock and set its target weight in your portfolio.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] gap-4 overflow-y-auto py-2">
          <div className="grid gap-2">
            <Label htmlFor="asset-search">Search</Label>
            <Input
              id="asset-search"
              placeholder="VOO, AAPL, BND…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ul className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-border/80 p-1">
            {filtered.length === 0 ? (
              <li className="px-2 py-3 text-center text-xs text-muted-foreground">
                No matches in catalog — enter symbol below.
              </li>
            ) : (
              filtered.map((item) => (
                <li key={item.symbol}>
                  <button
                    type="button"
                    onClick={() => pickItem(item)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-muted/60",
                      symbol === item.symbol && "bg-violet-500/15"
                    )}
                  >
                    <span>
                      <span className="font-semibold">{item.symbol}</span>
                      <span className="ml-2 text-muted-foreground">
                        {item.name}
                      </span>
                    </span>
                    <span className="text-xs uppercase text-muted-foreground">
                      {item.assetClass}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="VOO"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="planned">Planned %</Label>
              <Input
                id="planned"
                type="number"
                min={0.1}
                max={100}
                step={0.5}
                value={plannedPercent}
                onChange={(e) => setPlannedPercent(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="S&P 500 Index ETF"
            />
          </div>
          <div className="grid gap-2">
            <Label>Asset class</Label>
            <Select
              value={assetClass}
              onValueChange={(v) => setAssetClass(v as ArchitectAssetClass)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="bond">Bond</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Adding…" : "Add asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
