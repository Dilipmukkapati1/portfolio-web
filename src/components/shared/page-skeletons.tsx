import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>
      {action && <Skeleton className="h-[72px] w-full max-w-xs shrink-0 sm:w-72" />}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-sm" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-3 w-40" />
      </CardContent>
    </Card>
  );
}

export function StatCardsSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        count === 2 && "sm:grid-cols-2",
        count >= 3 && "sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

function SkeletonTabsList({ count = 3 }: { count?: number }) {
  return (
    <div className="inline-flex h-10 items-center gap-1 rounded-md bg-muted p-1">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-[88px] rounded-sm" />
      ))}
    </div>
  );
}

function AllocationPieSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
      <Skeleton className="h-56 w-56 shrink-0 rounded-full" />
      <ul className="grid w-full max-w-md gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex items-start gap-2">
            <Skeleton className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DonutWithLegendSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
      <Skeleton className="h-[232px] w-[232px] shrink-0 rounded-full" />
      <div className="grid w-full max-w-sm gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 rounded-md px-2 py-1.5">
            <Skeleton className="h-2.5 w-2.5 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
  showHeader = true,
}: {
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
}) {
  return (
    <div className={cn("rounded-lg border border-border", className)}>
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-full max-w-[100px]" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, row) => (
            <TableRow key={row}>
              {Array.from({ length: columns }).map((_, col) => (
                <TableCell key={col}>
                  <Skeleton
                    className={cn(
                      "h-4",
                      col === 0 ? "w-32" : col === columns - 1 ? "ml-auto w-16" : "w-20"
                    )}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ChartCardSkeleton({
  title = "Holdings by category",
}: {
  title?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-44" aria-hidden />
        <span className="sr-only">{title}</span>
      </CardHeader>
      <CardContent className="flex flex-col justify-center">
        <AllocationPieSkeleton />
      </CardContent>
    </Card>
  );
}

export function SummaryCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

export function AccountTileSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex min-w-0 items-start gap-3 sm:flex-1 sm:items-center">
          <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-20 self-end sm:self-auto" />
      </CardContent>
    </Card>
  );
}

export function ConnectionCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-sm" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-5 w-24 rounded-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[92%]" />
        </div>
        <div className="space-y-2 pl-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
        <Skeleton className="h-4 w-56" />
        <div className="flex flex-wrap gap-2 pt-1">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetBarSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

function ProjectionChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-[180px] w-full rounded-md" />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-md" />
        ))}
      </div>
    </div>
  );
}

function InvestmentPlanHeaderSkeleton() {
  return (
    <div className="space-y-2.5">
      <Skeleton className="h-8 w-44" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-28" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-11 rounded-full" />
          <Skeleton className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function ExpensePlannerHeaderSkeleton() {
  return (
    <div className="border-b border-border pb-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="ml-auto h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-4 w-56" />
    </div>
  );
}

function ListRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-md border border-border px-3 py-2.5"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

function DefinitionListSkeleton({ pairs = 3 }: { pairs?: number }) {
  return (
    <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
      {Array.from({ length: pairs }).map((_, i) => (
        <div key={i} className="contents">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20 justify-self-end sm:justify-self-start" />
        </div>
      ))}
    </dl>
  );
}

export function FormPanelSkeleton() {
  return (
    <div className="space-y-6 py-2">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-md border border-border p-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-2 border-t border-border pt-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={3} />
      <ChartCardSkeleton title="Holdings by category" />
    </div>
  );
}

export function AccountsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <AccountTileSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HoldingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-5 w-full max-w-lg" />
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <SkeletonTabsList count={3} />
          <div className="flex flex-wrap items-center gap-2">
            <SkeletonTabsList count={2} />
            <Skeleton className="h-9 w-12 rounded-md" />
            <Skeleton className="h-9 w-14 rounded-md" />
          </div>
        </div>
      </div>
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-7 w-28" />
        </CardContent>
      </Card>
      <div className="rounded-lg border bg-card p-4">
        <AllocationPieSkeleton />
      </div>
    </div>
  );
}

export function TransactionsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={3} />
      <TableSkeleton rows={8} columns={4} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-4 w-52" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}

function TaxPanelSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {children}
    </div>
  );
}

export function TaxPageSkeleton() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3 sm:gap-6">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-2 sm:mb-0 sm:px-0">
        <Skeleton className="h-7 w-10 sm:h-9 sm:w-16" />
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-9 w-[88px]" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      <div className="hidden gap-2 sm:flex">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-24" />
      </div>

      <TaxPanelSkeleton>
        <div className="px-2 py-2.5">
          <Skeleton className="h-10 w-full min-w-0" />
        </div>
      </TaxPanelSkeleton>

      <TaxPanelSkeleton>
        <div className="space-y-3 px-2 py-3">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-full min-w-0" />
          </div>
          <Skeleton className="h-9 w-full min-w-0" />
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Skeleton className="h-14 w-full min-w-0" />
            <Skeleton className="h-14 w-full min-w-0" />
          </div>
          <div className="divide-y divide-border border-t border-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-2 py-2.5">
                <Skeleton className="h-4 w-24 min-w-0 flex-1" />
                <Skeleton className="h-4 w-16 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </TaxPanelSkeleton>
    </div>
  );
}

export function ConnectionsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <ConnectionCardSkeleton />
      <ConnectionCardSkeleton />
    </div>
  );
}

export function HouseholdPageSkeleton() {
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeaderSkeleton />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-11 w-36" />
        <Skeleton className="h-11 w-44" />
        <Skeleton className="h-11 w-20" />
      </div>
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="p-0">
          <TableSkeleton rows={4} columns={5} className="border-0" />
        </CardContent>
      </Card>
    </div>
  );
}

export function InvestmentPlanPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-4 p-3 sm:space-y-6 sm:p-6">
      <InvestmentPlanHeaderSkeleton />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <DonutWithLegendSkeleton />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent>
              <ProjectionChartSkeleton />
            </CardContent>
          </Card>
        </div>
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-24 w-full rounded-md" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
            <ListRowsSkeleton rows={5} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ExpensePlannerPageSkeleton() {
  return (
    <div className="mx-auto max-w-[1080px] space-y-6 p-3 sm:p-6">
      <ExpensePlannerHeaderSkeleton />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <div className="flex flex-wrap items-center gap-2">
            <SkeletonTabsList count={4} />
            <Skeleton className="h-9 w-28" />
          </div>
          <StatCardSkeleton />
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent>
              <BudgetBarSkeleton />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <AllocationPieSkeleton />
            </CardContent>
          </Card>
        </section>
        <section className="space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-6 w-16" />
            <ListRowsSkeleton rows={3} />
          </div>
          {["Outlook", "Mappings"].map((section) => (
            <div key={section} className="space-y-4 border-t border-border pt-6">
              <Skeleton className="h-6 w-20" />
              <ListRowsSkeleton rows={3} />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export function AdminOverviewPageSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={3} />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="p-0 pt-0">
          <TableSkeleton rows={5} columns={4} className="border-0" />
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminUsersPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} columns={5} />
    </div>
  );
}
