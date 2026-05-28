"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { AnalyzerBottomNav } from "@/components/analyzer/analyzer-bottom-nav";
import { InstrumentAnalysisCard } from "@/components/analyzer/instrument-analysis-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type {
  AnalyzerPeriod,
  InstrumentAnalysis,
} from "@/lib/analyzer-types";
import { cn, formatCurrency } from "@/lib/utils";

export default function AnalyzerSymbolPage() {
  const params = useParams();
  const symbol = String(params.symbol ?? "NVDA").toUpperCase();
  const [period, setPeriod] = useState<AnalyzerPeriod>("quarterly");
  const [analysis, setAnalysis] = useState<InstrumentAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getInstrumentAnalysis(symbol, period);
        if (!cancelled) setAnalysis(data as InstrumentAnalysis);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Instrument analysis unavailable"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol, period]);

  const priceUp = (analysis?.priceChangePercent ?? 0) >= 0;

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-24 md:max-w-3xl md:pb-8">
      <header className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground" asChild>
          <Link href="/" aria-label="Search">
            <Search className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-center text-base font-semibold tracking-tight">
          Market Insights
        </h1>
        <Avatar className="h-9 w-9 border border-border">
          <AvatarFallback className="bg-sky-500/20 text-xs text-sky-300">
            MI
          </AvatarFallback>
        </Avatar>
      </header>

      {loading && !analysis ? (
        <p className="text-center text-sm text-muted-foreground">
          Loading {symbol}…
        </p>
      ) : error ? (
        <p className="text-center text-sm text-muted-foreground">{error}</p>
      ) : analysis ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <section className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {analysis.symbol}
              </span>
            </div>
            <h2 className="text-2xl font-bold leading-tight">
              {analysis.companyName}
            </h2>
            <div className="flex flex-wrap items-end gap-3">
              <p className="text-3xl font-bold tabular-nums">
                {formatCurrency(analysis.currentPrice)}
              </p>
              <p
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  priceUp ? "text-emerald-400" : "text-orange-400"
                )}
              >
                {priceUp ? "+" : ""}
                {analysis.priceChangePercent.toFixed(2)}%
              </p>
            </div>
          </section>

          <div className="flex rounded-lg border border-border/80 bg-[#12182b] p-0.5">
            {(["quarterly", "yearly"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors",
                  period === value
                    ? "bg-sky-500/20 text-sky-300"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {value}
              </button>
            ))}
          </div>

          <InstrumentAnalysisCard analysis={analysis} />
        </motion.div>
      ) : null}

      <AnalyzerBottomNav />
    </div>
  );
}
