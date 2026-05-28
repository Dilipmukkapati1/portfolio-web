"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, Pencil, Plus, Search } from "lucide-react";
import { AddAssetDialog } from "@/components/architect/add-asset-dialog";
import { ArchitectBottomNav } from "@/components/architect/architect-bottom-nav";
import { AssetCard } from "@/components/architect/asset-card";
import { SectorHeatmap } from "@/components/architect/sector-heatmap";
import { SectorRankings } from "@/components/architect/sector-rankings";
import { StrategyDonut } from "@/components/architect/strategy-donut";
import { StrategyEditorDialog } from "@/components/architect/strategy-editor-dialog";
import { usePrivacy } from "@/components/PrivacyProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type {
  ArchitectDashboard,
  ArchitectStrategy,
} from "@/lib/architect-types";
import { formatCurrencyWhole } from "@/lib/utils";

const EMPTY_STRATEGY: ArchitectStrategy = {
  equitiesPercent: 0,
  bondsPercent: 0,
  cashPercent: 0,
};

export default function ArchitectPage() {
  const { isUnlocked, privacyVersion } = usePrivacy();
  const [dashboard, setDashboard] = useState<ArchitectDashboard | null>(null);
  const [search, setSearch] = useState("");
  const [timeframe, setTimeframe] = useState<"1d" | "1w" | "1m">("1d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [addAssetOpen, setAddAssetOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getArchitect({
        ...(search.trim() ? { search: search.trim() } : {}),
        timeframe,
      });
      setDashboard(data as ArchitectDashboard);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Portfolio architect unavailable"
      );
    } finally {
      setLoading(false);
    }
  }, [search, timeframe]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDashboard();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadDashboard, privacyVersion]);

  const filteredAssets = useMemo(() => {
    if (!dashboard) return [];
    const q = search.trim().toUpperCase();
    if (!q) return dashboard.executionAssets;
    return dashboard.executionAssets.filter(
      (asset) =>
        asset.symbol.includes(q) || asset.name.toUpperCase().includes(q)
    );
  }, [dashboard, search]);

  const existingSymbols = useMemo(
    () => dashboard?.executionAssets.map((a) => a.symbol.toUpperCase()) ?? [],
    [dashboard]
  );

  const capitalLabel =
    isUnlocked && dashboard?.totalCapital != null
      ? formatCurrencyWhole(dashboard.totalCapital)
      : "Unlock to view";

  async function saveStrategy(strategy: ArchitectStrategy) {
    setSaveError(null);
    const data = await api.updateArchitectPlan({ strategy });
    setDashboard(data as ArchitectDashboard);
  }

  async function addAsset(target: {
    symbol: string;
    name: string;
    assetClass: "equity" | "bond" | "cash" | "other";
    plannedPercent: number;
  }) {
    setSaveError(null);
    const data = await api.updateArchitectPlan({ addTarget: target });
    setDashboard(data as ArchitectDashboard);
  }

  const executedStrategy =
    dashboard?.executedStrategy ?? dashboard?.strategy ?? EMPTY_STRATEGY;

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-24 md:max-w-3xl md:pb-8">
      <header className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground" asChild>
          <Link href="/" aria-label="Search">
            <Search className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-center text-base font-semibold tracking-tight">
          Portfolio Architect
        </h1>
        <Avatar className="h-9 w-9 border border-border">
          <AvatarFallback className="bg-violet-500/20 text-xs text-violet-300">
            PA
          </AvatarFallback>
        </Avatar>
      </header>

      {saveError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {saveError}
        </p>
      )}

      {loading && !dashboard ? (
        <p className="text-center text-sm text-muted-foreground">Loading plan…</p>
      ) : error ? (
        <p className="text-center text-sm text-muted-foreground">{error}</p>
      ) : dashboard ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <section className="rounded-2xl border border-border/80 bg-card/60 p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold">Strategy Overview</h2>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Planned vs. executed
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Total capital
                  </p>
                  <p className="text-sm font-bold tabular-nums text-violet-300">
                    {capitalLabel}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 border-violet-500/40 text-xs text-violet-300"
                  onClick={() => setStrategyOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit plan
                </Button>
              </div>
            </div>
            <StrategyDonut
              planned={dashboard.strategy}
              executed={executedStrategy}
              centerLabel={dashboard.strategyCenterLabel}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Execution Status</h2>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 border-violet-500/40 text-xs text-violet-300"
                onClick={() => setAddAssetOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add asset
              </Button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ETFs or Stocks (VOO, AAPL...)"
                className="border-border/80 bg-[#12182b] pl-9"
              />
            </div>
            <div className="space-y-2">
              {filteredAssets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matching assets.</p>
              ) : (
                filteredAssets.map((asset) => (
                  <AssetCard key={asset.symbol} asset={asset} />
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border/80 bg-card/60 p-4">
            <SectorHeatmap
              sectors={dashboard.sectors}
              timeframe={timeframe}
              loading={loading}
              onTimeframeChange={setTimeframe}
            />
          </section>

          <SectorRankings sectors={dashboard.sectors} />

          <section className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
              <BadgeCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold">Efficiency Score</h2>
              <p className="text-xs text-muted-foreground">
                {dashboard.efficiencyDescription}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sharpe ratio
              </p>
              <p className="text-xl font-bold tabular-nums text-emerald-400">
                {dashboard.sharpeRatio.toFixed(2)}
              </p>
            </div>
          </section>

          <StrategyEditorDialog
            open={strategyOpen}
            onOpenChange={setStrategyOpen}
            strategy={dashboard.strategy}
            onSave={saveStrategy}
          />
          <AddAssetDialog
            open={addAssetOpen}
            onOpenChange={setAddAssetOpen}
            catalog={dashboard.catalog}
            existingSymbols={existingSymbols}
            onSave={addAsset}
          />
        </motion.div>
      ) : null}

      <ArchitectBottomNav />
    </div>
  );
}
