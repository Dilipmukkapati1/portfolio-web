"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrency } from "@/lib/investment-plan/format";
import type { DeferredYearPoint, TaxPaidBucket } from "@/lib/tax/outlook";

function tooltipCurrency(value: number) {
  return formatCompactCurrency(value);
}

export function TaxDeferredHistogram({
  data,
  valuesUnlocked,
  compact,
}: {
  data: DeferredYearPoint[];
  valuesUnlocked: boolean;
  compact?: boolean;
}) {
  const chartData = data.map((row) => ({
    label: `${row.year}${row.isYtd ? " (YTD)" : ""}`,
    deferred: row.deferred,
  }));

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <p className="text-sm font-medium">Tax deferred by year</p>
      <div className={compact ? "h-[120px]" : "h-[140px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/50" />
            <XAxis
              type="number"
              tickFormatter={(v) => (valuesUnlocked ? formatCompactCurrency(Number(v)) : "—")}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={72}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip formatter={(value: number) => tooltipCurrency(value)} />
            <Bar dataKey="deferred" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TaxPaidStackedChart({
  breakdown,
  valuesUnlocked,
}: {
  breakdown: TaxPaidBucket[];
  valuesUnlocked: boolean;
}) {
  const chartData = [
    {
      label: "YTD",
      Federal: breakdown[0]?.ytd ?? 0,
      "Social Security": breakdown[1]?.ytd ?? 0,
      Medicare: breakdown[2]?.ytd ?? 0,
      NIIT: breakdown[3]?.ytd ?? 0,
    },
    {
      label: "Rest of yr",
      Federal: breakdown[0]?.restOfYear ?? 0,
      "Social Security": breakdown[1]?.restOfYear ?? 0,
      Medicare: breakdown[2]?.restOfYear ?? 0,
      NIIT: breakdown[3]?.restOfYear ?? 0,
    },
    {
      label: "Lifetime",
      Federal: breakdown[0]?.lifetime ?? 0,
      "Social Security": breakdown[1]?.lifetime ?? 0,
      Medicare: breakdown[2]?.lifetime ?? 0,
      NIIT: breakdown[3]?.lifetime ?? 0,
    },
  ];

  const colors = ["hsl(var(--primary))", "#38bdf8", "#94a3b8", "#fbbf24"];

  return (
    <div className="h-[140px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(v) => (valuesUnlocked ? formatCompactCurrency(Number(v)) : "—")}
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip formatter={(value: number) => tooltipCurrency(value)} />
          {["Federal", "Social Security", "Medicare", "NIIT"].map((key, i) => (
            <Bar key={key} dataKey={key} stackId="tax" fill={colors[i]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TaxLifetimeLineChart({
  annualTotal,
  valuesUnlocked,
}: {
  annualTotal: number;
  valuesUnlocked: boolean;
}) {
  const data = [
    { label: "Now", value: annualTotal },
    { label: "+10", value: annualTotal * 10 },
    { label: "+20", value: annualTotal * 20 },
    { label: "Life", value: annualTotal * 25 },
  ];

  return (
    <div className="h-[120px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(v) => (valuesUnlocked ? formatCompactCurrency(Number(v)) : "—")}
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip formatter={(value: number) => tooltipCurrency(value)} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
