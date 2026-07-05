"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ExpenseChatBlock } from "@portfolio/contracts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCompactCurrency } from "@/lib/investment-plan/format";
import { ExpensePieChart, ExpensePieLegend } from "./expense-pie-chart";

const SERIES_COLORS = [
  "hsl(var(--primary))",
  "hsl(24 95% 53%)",
  "hsl(262 83% 58%)",
  "hsl(142 71% 45%)",
];

function TextBlock({ markdown }: { markdown: string }) {
  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
      {markdown}
    </div>
  );
}

function BlockTitle({ title }: { title?: string }) {
  if (!title) return null;
  return <p className="mb-2 text-sm font-medium">{title}</p>;
}

export function ChatBlock({
  block,
  valuesUnlocked,
}: {
  block: ExpenseChatBlock;
  valuesUnlocked: boolean;
}) {
  if (block.type === "text") {
    return <TextBlock markdown={block.markdown} />;
  }

  if (block.type === "table") {
    return (
      <div className="rounded-md border border-border">
        <BlockTitle title={block.title} />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {block.columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                          ? "text-center"
                          : undefined
                    }
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {block.rows.map((row, i) => (
                <TableRow key={i}>
                  {block.columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={
                        col.align === "right"
                          ? "text-right tabular-nums"
                          : col.align === "center"
                            ? "text-center"
                            : undefined
                      }
                    >
                      {row[col.key] ?? ""}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (block.type === "pie_chart") {
    const total =
      block.total ?? block.data.reduce((sum, d) => sum + d.value, 0);
    return (
      <div>
        <BlockTitle title={block.title} />
        <ExpensePieChart
          data={block.data}
          total={total}
          valuesUnlocked={valuesUnlocked}
        />
        <ExpensePieLegend
          data={block.data}
          total={total}
          valuesUnlocked={valuesUnlocked}
        />
      </div>
    );
  }

  // bar_chart | line_chart
  const data = block.labels.map((label, index) => {
    const point: Record<string, string | number> = { label };
    for (const s of block.series) {
      point[s.name] = s.values[index] ?? 0;
    }
    return point;
  });

  return (
    <div>
      <BlockTitle title={block.title} />
      <div style={{ height: 240 }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          {block.type === "bar_chart" ? (
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              {block.series.length > 1 && <Legend />}
              {block.series.map((s, i) => (
                <Bar
                  key={s.name}
                  dataKey={s.name}
                  fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
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
              {block.series.length > 1 && <Legend />}
              {block.series.map((s, i) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
