"use client";

import { Activity, BarChart3, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  InstrumentAnalysis,
  InstrumentSignal,
} from "@/lib/analyzer-types";
import { formatCurrency } from "@/lib/utils";

function signalClass(signal: InstrumentSignal): string {
  switch (signal) {
    case "bullish":
      return "text-emerald-400";
    case "bearish":
      return "text-orange-400";
    default:
      return "text-muted-foreground";
  }
}

function signalBadgeClass(signal: InstrumentSignal): string {
  switch (signal) {
    case "bullish":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "bearish":
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";
    default:
      return "border-border/80 bg-muted/30 text-muted-foreground";
  }
}

function formatIndicatorValue(value: number, unit?: string): string {
  if (unit === "%") return `${value.toFixed(1)}%`;
  return value.toFixed(1);
}

export function InstrumentAnalysisCard({
  analysis,
}: {
  analysis: InstrumentAnalysis;
}) {
  const rangeSpan =
    analysis.priceStructure.fiftyTwoWeekHigh -
    analysis.priceStructure.fiftyTwoWeekLow;
  const rangePosition =
    rangeSpan > 0
      ? ((analysis.priceStructure.currentPrice -
          analysis.priceStructure.fiftyTwoWeekLow) /
          rangeSpan) *
        100
      : 50;

  return (
    <section className="rounded-2xl border border-border/80 bg-card/60 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Instrument Analysis</h2>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Technical · {analysis.period}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Momentum
          </p>
          <p
            className={cn(
              "text-xl font-bold tabular-nums",
              signalClass(analysis.trend)
            )}
          >
            {analysis.momentumScore}
          </p>
        </div>
      </div>

      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        {analysis.summary}
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {analysis.indicators.map((indicator) => (
          <div
            key={indicator.id}
            className="rounded-xl border border-border/60 bg-[#12182b]/80 p-3"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {indicator.label}
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums">
              {formatIndicatorValue(indicator.value, indicator.unit)}
            </p>
            <p
              className={cn(
                "mt-0.5 text-[10px] font-semibold uppercase",
                signalClass(indicator.signal)
              )}
            >
              {indicator.signal}
              {indicator.changePercent != null && (
                <span className="ml-1 tabular-nums">
                  {indicator.changePercent >= 0 ? "+" : ""}
                  {indicator.changePercent.toFixed(1)}%
                </span>
              )}
            </p>
            {indicator.note ? (
              <p className="mt-1 text-[10px] text-muted-foreground">
                {indicator.note}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-[#12182b]/80 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
            <TrendingUp className="h-4 w-4 text-sky-400" />
            Moving averages
          </div>
          <ul className="space-y-2">
            {analysis.movingAverages.map((ma) => (
              <li
                key={ma.label}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground">{ma.label}</span>
                <span className="tabular-nums">
                  {formatCurrency(ma.value)}
                  <span
                    className={cn(
                      "ml-2 font-semibold",
                      ma.priceVsPercent >= 0
                        ? "text-emerald-400"
                        : "text-orange-400"
                    )}
                  >
                    {ma.priceVsPercent >= 0 ? "+" : ""}
                    {ma.priceVsPercent.toFixed(1)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border/60 bg-[#12182b]/80 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
            <BarChart3 className="h-4 w-4 text-violet-400" />
            Price structure
          </div>
          <ul className="space-y-1.5 text-xs">
            <li className="flex justify-between">
              <span className="text-muted-foreground">Support</span>
              <span className="tabular-nums">
                {formatCurrency(analysis.priceStructure.support)}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Resistance</span>
              <span className="tabular-nums">
                {formatCurrency(analysis.priceStructure.resistance)}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">52-wk range</span>
              <span className="tabular-nums text-sky-300">
                {formatCurrency(analysis.priceStructure.fiftyTwoWeekLow)} –{" "}
                {formatCurrency(analysis.priceStructure.fiftyTwoWeekHigh)}
              </span>
            </li>
          </ul>
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                style={{ width: `${Math.min(100, Math.max(0, rangePosition))}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Price position in 52-week range
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-border/60 bg-[#12182b]/80 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Activity className="h-4 w-4 text-emerald-400" />
            Volume profile
          </div>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
              signalBadgeClass(analysis.volumeProfile.signal)
            )}
          >
            {analysis.volumeProfile.signal}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">30-day avg volume</span>
          <span className="font-semibold tabular-nums">
            {analysis.volumeProfile.avgVolumeLabel}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Relative volume</span>
          <span className="font-semibold tabular-nums text-sky-300">
            {analysis.volumeProfile.relativeVolume.toFixed(2)}×
          </span>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Technical signals
        </p>
        <ul className="space-y-2">
          {analysis.technicalSignals.map((signal) => (
            <li
              key={signal.label}
              className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium">{signal.label}</p>
                <p className="text-[10px] text-muted-foreground">
                  {signal.detail}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                  signalBadgeClass(signal.signal)
                )}
              >
                {signal.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
