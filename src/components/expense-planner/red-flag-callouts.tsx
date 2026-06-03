"use client";

import type { ExpenseRedFlag } from "@portfolio/contracts";
import { cn } from "@/lib/utils";
import { AlertTriangle, XCircle } from "lucide-react";

export function RedFlagCallouts({ flags }: { flags: ExpenseRedFlag[] }) {
  if (flags.length === 0) return null;

  return (
    <div className="space-y-2">
      {flags.map((flag) => (
        <div
          key={flag.title}
          className={cn(
            "flex gap-3 rounded-lg border p-3 text-sm",
            flag.tone === "danger"
              ? "border-destructive/50 bg-destructive/10 text-destructive"
              : "border-yellow-500/40 bg-yellow-500/10 text-yellow-900 dark:text-yellow-200"
          )}
        >
          {flag.tone === "danger" ? (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div>
            <p className="font-medium">{flag.title}</p>
            <p className="mt-0.5 opacity-90">{flag.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
