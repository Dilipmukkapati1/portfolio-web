"use client";

import { cn } from "@/lib/utils";

export function TaxPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}>
      {children}
    </div>
  );
}

export function TaxPanelHeader({
  title,
  trailing,
}: {
  title: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
      <p className="text-sm font-medium">{title}</p>
      {trailing && (
        <span className="text-xs text-muted-foreground">{trailing}</span>
      )}
    </div>
  );
}

export function TaxStat({
  label,
  value,
  className,
  tone = "default",
}: {
  label: string;
  value: string;
  className?: string;
  tone?: "default" | "info" | "success";
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-base font-semibold tabular-nums",
          tone === "info" && "text-sky-400",
          tone === "success" && "text-emerald-400"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function TaxKeyValueRows({
  rows,
}: {
  rows: Array<{ label: string; value: string; highlight?: boolean }>;
}) {
  return (
    <div>
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={cn(
            "flex items-center justify-between gap-3 px-3 py-2.5 text-sm",
            i < rows.length - 1 && "border-b border-border"
          )}
        >
          <span className="text-muted-foreground">{row.label}</span>
          <span className={cn("tabular-nums", row.highlight && "font-semibold")}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
