"use client";

import { cn } from "@/lib/utils";

/** Dark panel for a Financial Plan bottom-nav tab (~2.6px horizontal inset; 80% less than 13px). */
export function InvestmentPlanMobileSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "-mx-[10.4px] w-[calc(100%+20.8px)] bg-muted px-3 py-4",
        className
      )}
    >
      {children}
    </section>
  );
}
