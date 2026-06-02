"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrency } from "@/lib/investment-plan/format";

export function ProjectionLineChart({
  categories,
  values,
  variant = "info",
  height = 220,
}: {
  categories: string[];
  values: number[];
  variant?: "info" | "success";
  height?: number;
}) {
  const data = categories.map((label, index) => ({
    label,
    value: values[index] ?? 0,
  }));

  const stroke =
    variant === "success" ? "hsl(142 71% 45%)" : "hsl(var(--primary))";
  const fillId = variant === "success" ? "projectionFillSuccess" : "projectionFillInfo";

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="95%" stopColor={stroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
            className="text-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => formatCompactCurrency(Number(v))}
            width={56}
          />
          <Tooltip
            formatter={(value: number) => [formatCompactCurrency(value), "Value"]}
            labelFormatter={(label) => String(label)}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            fill={`url(#${fillId})`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
