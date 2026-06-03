"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrency } from "@/lib/investment-plan/format";

export function ExpenseOutlookChart({
  labels,
  actual,
  projected,
  height = 220,
}: {
  labels: string[];
  actual: number[];
  projected: number[];
  height?: number;
}) {
  const data = labels.map((label, index) => ({
    label,
    actual: actual[index] ?? 0,
    projected: projected[index] ?? 0,
  }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => formatCompactCurrency(Number(v))}
            width={56}
          />
          <Tooltip
            formatter={(value: number) => formatCompactCurrency(value)}
            labelFormatter={(label) => String(label)}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual (to date)"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="projected"
            name="Expected / month"
            stroke="hsl(199 89% 48%)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
