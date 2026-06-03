"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency, formatPercent } from "@/lib/utils";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(24 95% 53%)",
  "hsl(262 83% 58%)",
  "hsl(330 81% 60%)",
  "hsl(142 71% 45%)",
  "hsl(45 93% 47%)",
  "hsl(215 16% 47%)",
  "hsl(199 89% 48%)",
];

export function ExpensePieChart({
  data,
  total,
  valuesUnlocked,
  size = 200,
}: {
  data: { label: string; value: number; color?: string }[];
  total: number;
  valuesUnlocked: boolean;
  size?: number;
}) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No spending data for this period
      </p>
    );
  }

  return (
    <div className="mx-auto w-full" style={{ maxWidth: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={size * 0.32}
            outerRadius={size * 0.45}
            paddingAngle={1}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.label}
                fill={entry.color ?? CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, _name, props) => {
              const pct = total > 0 ? (value / total) * 100 : 0;
              const amount = valuesUnlocked
                ? formatCurrency(value, { decimals: 0 })
                : formatPercent(pct, 0);
              return [amount, props.payload?.label ?? ""];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExpensePieLegend({
  data,
  total,
  valuesUnlocked,
}: {
  data: { label: string; value: number; color?: string }[];
  total: number;
  valuesUnlocked: boolean;
}) {
  return (
    <ul className="mt-4 space-y-2">
      {data.map((slice, index) => {
        const pct = total > 0 ? (slice.value / total) * 100 : 0;
        return (
          <li key={slice.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  slice.color ?? CHART_COLORS[index % CHART_COLORS.length],
              }}
            />
            <span className="min-w-0 flex-1 truncate">{slice.label}</span>
            <span className="shrink-0 font-medium tabular-nums">
              {valuesUnlocked
                ? `${formatCurrency(slice.value, { decimals: 0 })} · ${formatPercent(pct, 0)}`
                : formatPercent(pct, 0)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
