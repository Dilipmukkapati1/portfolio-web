export type DurationPreset =
  | "current-month"
  | "last-month"
  | "last-3-months"
  | "last-6-months"
  | "last-year"
  | "custom";

export type OutlookPreset =
  | "next-3-months"
  | "next-6-months"
  | "next-12-months"
  | "custom";

export const DURATION_OPTIONS: { value: DurationPreset; label: string }[] = [
  { value: "current-month", label: "Current month" },
  { value: "last-month", label: "Last month" },
  { value: "last-3-months", label: "Last 3 months" },
  { value: "last-6-months", label: "Last 6 months" },
  { value: "last-year", label: "Last year" },
  { value: "custom", label: "Custom range…" },
];

export const OUTLOOK_OPTIONS: { value: OutlookPreset; label: string }[] = [
  { value: "next-3-months", label: "Next 3 months" },
  { value: "next-6-months", label: "Next 6 months" },
  { value: "next-12-months", label: "Next 12 months" },
  { value: "custom", label: "Custom range…" },
];

export const MAX_SUMMARY_DAYS = 366;

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}

function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, d.getDate());
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function durationRange(
  preset: DurationPreset,
  customStart: string,
  customEnd: string,
  referenceDate: Date = new Date()
): { start: Date; end: Date; label: string; startDate: string; endDate: string } {
  const end = new Date(referenceDate);
  end.setHours(23, 59, 59, 999);

  switch (preset) {
    case "current-month": {
      const start = startOfMonth(referenceDate);
      return {
        start,
        end,
        label: referenceDate.toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        }),
        startDate: toIsoDate(start),
        endDate: toIsoDate(end),
      };
    }
    case "last-month": {
      const ref = addMonths(referenceDate, -1);
      const start = startOfMonth(ref);
      const monthEnd = endOfMonth(ref);
      return {
        start,
        end: monthEnd,
        label: ref.toLocaleString("en-US", { month: "long", year: "numeric" }),
        startDate: toIsoDate(start),
        endDate: toIsoDate(monthEnd),
      };
    }
    case "last-3-months": {
      const start = addMonths(startOfMonth(referenceDate), -2);
      return {
        start,
        end,
        label: "Last 3 months",
        startDate: toIsoDate(start),
        endDate: toIsoDate(end),
      };
    }
    case "last-6-months": {
      const start = addMonths(startOfMonth(referenceDate), -5);
      return {
        start,
        end,
        label: "Last 6 months",
        startDate: toIsoDate(start),
        endDate: toIsoDate(end),
      };
    }
    case "last-year": {
      const start = addMonths(referenceDate, -12);
      start.setHours(0, 0, 0, 0);
      return {
        start,
        end,
        label: "Last 12 months",
        startDate: toIsoDate(start),
        endDate: toIsoDate(end),
      };
    }
    case "custom": {
      const start = customStart ? parseIsoDate(customStart) : addMonths(referenceDate, -1);
      const customEndDate = customEnd ? parseIsoDate(customEnd) : referenceDate;
      customEndDate.setHours(23, 59, 59, 999);
      return {
        start,
        end: customEndDate,
        label: `${toIsoDate(start)} – ${toIsoDate(customEndDate)}`,
        startDate: toIsoDate(start),
        endDate: toIsoDate(customEndDate),
      };
    }
  }
}

export function outlookRange(
  preset: OutlookPreset,
  customStart: string,
  customEnd: string,
  referenceDate: Date = new Date()
): {
  start: Date;
  end: Date;
  label: string;
  monthCount: number;
} {
  const start = startOfMonth(referenceDate);
  start.setHours(0, 0, 0, 0);

  const monthsInRange = (s: Date, e: Date): number => {
    let count = 0;
    let cur = startOfMonth(s);
    const last = startOfMonth(e);
    while (cur <= last) {
      count += 1;
      cur = addMonths(cur, 1);
    }
    return Math.max(1, count);
  };

  switch (preset) {
    case "next-3-months": {
      const end = endOfMonth(addMonths(referenceDate, 2));
      return { start, end, label: "Next 3 months", monthCount: 3 };
    }
    case "next-6-months": {
      const end = endOfMonth(addMonths(referenceDate, 5));
      return { start, end, label: "Next 6 months", monthCount: 6 };
    }
    case "next-12-months": {
      const end = endOfMonth(addMonths(referenceDate, 11));
      return { start, end, label: "Next 12 months", monthCount: 12 };
    }
    case "custom": {
      const customStartDate = customStart ? parseIsoDate(customStart) : referenceDate;
      const customEndDate = customEnd
        ? parseIsoDate(customEnd)
        : addMonths(referenceDate, 3);
      customEndDate.setHours(23, 59, 59, 999);
      return {
        start: customStartDate,
        end: customEndDate,
        label: `${toIsoDate(customStartDate)} – ${toIsoDate(customEndDate)}`,
        monthCount: monthsInRange(customStartDate, customEndDate),
      };
    }
  }
}

export function daysInRange(startDate: string, endDate: string): number {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  return (
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1
  );
}

export function isRangeWithinLimit(startDate: string, endDate: string): boolean {
  return daysInRange(startDate, endDate) <= MAX_SUMMARY_DAYS;
}

/** Keep transaction summary requests within the API's 366-day inclusive limit. */
export function clampSummaryDateRange(
  startDate: string,
  endDate: string,
  maxDays: number = MAX_SUMMARY_DAYS
): { startDate: string; endDate: string } {
  if (daysInRange(startDate, endDate) <= maxDays) {
    return { startDate, endDate };
  }
  const end = parseIsoDate(endDate);
  const start = new Date(end);
  start.setDate(start.getDate() - (maxDays - 1));
  start.setHours(0, 0, 0, 0);
  return { startDate: toIsoDate(start), endDate };
}

export function monthsInRange(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  let cur = startOfMonth(start);
  const last = startOfMonth(end);
  while (cur <= last) {
    months.push(new Date(cur));
    cur = addMonths(cur, 1);
  }
  return months;
}
