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
  ExpensePieChart,
  ExpensePieLegend,
} from "@/components/expense-planner/expense-pie-chart";
import { formatCompactCurrency } from "@/lib/investment-plan/format";
import { cn, formatCurrency } from "@/lib/utils";

const BAR_COLORS = [
  "hsl(var(--primary))",
  "hsl(199 89% 48%)",
  "hsl(24 95% 53%)",
  "hsl(142 71% 45%)",
];

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function ExpenseChatTextBlock({ markdown }: { markdown: string }) {
  const paragraphs = markdown.split(/\n{2,}/);
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="whitespace-pre-wrap">
          {renderInlineMarkdown(paragraph)}
        </p>
      ))}
    </div>
  );
}

function ExpenseChatTableBlock({
  block,
  valuesUnlocked,
}: {
  block: Extract<ExpenseChatBlock, { type: "table" }>;
  valuesUnlocked: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      {block.title && (
        <p className="border-b border-border px-3 py-2 text-sm font-medium">
          {block.title}
        </p>
      )}
      <table className="w-full min-w-[280px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {block.columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-3 py-2 font-medium",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  (!col.align || col.align === "left") && "text-left"
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border/60 last:border-0">
              {block.columns.map((col) => {
                const raw = row[col.key];
                const display =
                  typeof raw === "number" && valuesUnlocked
                    ? formatCurrency(raw, { decimals: 0 })
                    : String(raw ?? "—");
                return (
                  <td
                    key={col.key}
                    className={cn(
                      "px-3 py-2 tabular-nums",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center"
                    )}
                  >
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExpenseChatBarChartBlock({
  block,
  valuesUnlocked,
}: {
  block: Extract<ExpenseChatBlock, { type: "bar_chart" }>;
  valuesUnlocked: boolean;
}) {
  const data = block.labels.map((label, index) => {
    const point: Record<string, string | number> = { label };
    for (const series of block.series) {
      point[series.name] = series.values[index] ?? 0;
    }
    return point;
  });

  return (
    <div className="w-full" style={{ height: 240 }}>
      {block.title && (
        <p className="mb-2 text-sm font-medium">{block.title}</p>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) =>
              valuesUnlocked ? formatCompactCurrency(Number(v)) : `${v}`
            }
            width={56}
          />
          <Tooltip
            formatter={(value: number) =>
              valuesUnlocked ? formatCurrency(value, { decimals: 0 }) : value
            }
          />
          {block.series.length > 1 && <Legend />}
          {block.series.map((series, index) => (
            <Bar
              key={series.name}
              dataKey={series.name}
              fill={BAR_COLORS[index % BAR_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ExpenseChatLineChartBlock({
  block,
  valuesUnlocked,
}: {
  block: Extract<ExpenseChatBlock, { type: "line_chart" }>;
  valuesUnlocked: boolean;
}) {
  const data = block.labels.map((label, index) => {
    const point: Record<string, string | number> = { label };
    for (const series of block.series) {
      point[series.name] = series.values[index] ?? 0;
    }
    return point;
  });

  return (
    <div className="w-full" style={{ height: 240 }}>
      {block.title && (
        <p className="mb-2 text-sm font-medium">{block.title}</p>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) =>
              valuesUnlocked ? formatCompactCurrency(Number(v)) : `${v}`
            }
            width={56}
          />
          <Tooltip
            formatter={(value: number) =>
              valuesUnlocked ? formatCurrency(value, { decimals: 0 }) : value
            }
          />
          {block.series.length > 1 && <Legend />}
          {block.series.map((series, index) => (
            <Line
              key={series.name}
              type="monotone"
              dataKey={series.name}
              name={series.name}
              stroke={BAR_COLORS[index % BAR_COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ExpenseChatPieChartBlock({
  block,
  valuesUnlocked,
}: {
  block: Extract<ExpenseChatBlock, { type: "pie_chart" }>;
  valuesUnlocked: boolean;
}) {
  const total =
    block.total ??
    block.data.reduce((sum, point) => sum + point.value, 0);

  return (
    <div>
      {block.title && (
        <p className="mb-2 text-sm font-medium">{block.title}</p>
      )}
      <ExpensePieChart
        data={block.data.map((point) => ({
          label: point.label,
          value: point.value,
        }))}
        total={total}
        valuesUnlocked={valuesUnlocked}
        size={200}
      />
      <ExpensePieLegend
        data={block.data.map((point) => ({
          label: point.label,
          value: point.value,
        }))}
        total={total}
        valuesUnlocked={valuesUnlocked}
      />
    </div>
  );
}

export function ExpenseChatBlocks({
  blocks,
  valuesUnlocked,
}: {
  blocks: ExpenseChatBlock[];
  valuesUnlocked: boolean;
}) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "text":
            return <ExpenseChatTextBlock key={index} markdown={block.markdown} />;
          case "table":
            return (
              <ExpenseChatTableBlock
                key={index}
                block={block}
                valuesUnlocked={valuesUnlocked}
              />
            );
          case "pie_chart":
            return (
              <ExpenseChatPieChartBlock
                key={index}
                block={block}
                valuesUnlocked={valuesUnlocked}
              />
            );
          case "bar_chart":
            return (
              <ExpenseChatBarChartBlock
                key={index}
                block={block}
                valuesUnlocked={valuesUnlocked}
              />
            );
          case "line_chart":
            return (
              <ExpenseChatLineChartBlock
                key={index}
                block={block}
                valuesUnlocked={valuesUnlocked}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
