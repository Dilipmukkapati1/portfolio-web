import type { Member, TaxProfile } from "@/lib/household-types";

export type TaxEarnerScope = "household" | string;

export type TaxPaidBucketKey = "Federal" | "Social Security" | "Medicare" | "NIIT";

export interface TaxPaidBucket {
  bucket: TaxPaidBucketKey;
  ytd: number;
  restOfYear: number;
  lifetime: number;
}

export interface DeferredYearPoint {
  year: number;
  deferred: number;
  contributions: number;
  isYtd?: boolean;
}

export interface TaxOutlook {
  yearProgress: number;
  paidYtd: number;
  paidRestOfYear: number;
  paidAnnual: number;
  paidLifetimeForward: number;
  deferredYtd: number;
  deferredCumulative: number;
  deferredByYear: DeferredYearPoint[];
  paidBreakdown: TaxPaidBucket[];
  effectiveRate: number;
  marginalRate: number;
  totalTaxAnnual: number;
  onTrackPercent: number;
  openActions: number;
  optimizedTaxAnnual: number;
  optimizedSavings: number;
}

const SS_RATE = 0.062;
const SS_WAGE_BASE_2026 = 184_500;
const MEDICARE_RATE = 0.0145;
const ADDITIONAL_MEDICARE_RATE = 0.009;
const NIIT_RATE = 0.038;

function isJointFiling(filingStatus: string | undefined): boolean {
  return (
    filingStatus === "married_filing_jointly" ||
    filingStatus === "qualifying_surviving_spouse"
  );
}

export function taxYearProgress(taxYear: number, now = new Date()): number {
  if (taxYear < now.getFullYear()) return 1;
  if (taxYear > now.getFullYear()) return 0;
  const start = new Date(taxYear, 0, 1);
  const end = new Date(taxYear + 1, 0, 1);
  const elapsed = now.getTime() - start.getTime();
  const total = end.getTime() - start.getTime();
  return Math.min(1, Math.max(0, elapsed / total));
}

export function activeEarners(members: Member[]): Member[] {
  return members.filter((m) => m.isActive && m.relationship !== "dependent");
}

export function earnerOptions(members: Member[]): Array<{ id: TaxEarnerScope; label: string }> {
  return [
    { id: "household", label: "Household" },
    ...activeEarners(members).map((m) => ({
      id: m.id,
      label: m.name.split(/\s+/)[0] || m.name,
    })),
  ];
}

function membersForScope(members: Member[], scope: TaxEarnerScope): Member[] {
  const earners = activeEarners(members);
  if (scope === "household") return earners;
  const match = earners.filter((m) => m.id === scope);
  return match.length > 0 ? match : earners;
}

function sumWages(members: Member[]): number {
  return members.reduce(
    (total, member) =>
      total +
      member.incomeSources
        .filter((line) => line.type === "wages")
        .reduce((s, line) => s + line.amount, 0),
    0
  );
}

function sumInvestmentIncome(members: Member[]): number {
  const types = new Set(["interest", "dividends", "capital_gains_short", "capital_gains_long"]);
  return members.reduce(
    (total, member) =>
      total +
      member.incomeSources
        .filter((line) => types.has(line.type))
        .reduce((s, line) => s + line.amount, 0),
    0
  );
}

function sumPreTaxContributions(members: Member[]): number {
  const preTax = new Set([
    "401k",
    "403b",
    "traditional_ira",
    "sep_ira",
    "solo_401k",
    "simple_ira",
    "hsa",
  ]);
  return members.reduce(
    (total, member) =>
      total +
      member.contributions
        .filter((line) => preTax.has(line.type))
        .reduce((s, line) => s + line.amount, 0),
    0
  );
}

function wageShare(members: Member[], scope: TaxEarnerScope): number {
  const earners = activeEarners(members);
  const scoped = membersForScope(members, scope);
  const total = sumWages(earners);
  if (total <= 0) {
    return scope === "household" ? 1 : 1 / Math.max(1, earners.length);
  }
  return sumWages(scoped) / total;
}

function socialSecurityTax(wages: number, taxYear: number): number {
  const base = taxYear >= 2026 ? SS_WAGE_BASE_2026 : 176_100;
  return Math.min(wages, base) * SS_RATE;
}

function medicareTax(
  wages: number,
  filingStatus: string | undefined
): number {
  const base = wages * MEDICARE_RATE;
  const threshold = isJointFiling(filingStatus) ? 250_000 : 200_000;
  const additional =
    wages > threshold ? (wages - threshold) * ADDITIONAL_MEDICARE_RATE : 0;
  return base + additional;
}

function niitTax(
  investmentIncome: number,
  agi: number,
  filingStatus: string | undefined
): number {
  const threshold = isJointFiling(filingStatus) ? 250_000 : 200_000;
  const base = Math.max(0, agi - threshold);
  const subject = Math.min(investmentIncome, base);
  return subject * NIIT_RATE;
}

function splitByYearProgress(annual: number, progress: number): {
  ytd: number;
  restOfYear: number;
} {
  const ytd = annual * progress;
  return { ytd, restOfYear: Math.max(0, annual - ytd) };
}

export function computeOnTrackPercent(
  limits: TaxProfile["contributionLimits"] | undefined
): number {
  if (!limits?.length) return 100;
  const tracked = limits.filter((l) => l.limit > 0);
  if (!tracked.length) return 100;
  const avg =
    tracked.reduce((s, l) => s + Math.min(1, l.contributed / l.limit), 0) /
    tracked.length;
  return Math.round(avg * 100);
}

export function countOpenActions(
  limits: TaxProfile["contributionLimits"] | undefined,
  strategies: Array<Record<string, unknown>>
): number {
  let open = limits?.filter((l) => l.remaining > 0).length ?? 0;
  open += strategies.filter(
    (s) => Array.isArray(s.missingData) && (s.missingData as unknown[]).length > 0
  ).length;
  return open;
}

export function buildDeferredByYear(
  taxYear: number,
  contributions: number,
  marginalRate: number,
  progress: number
): DeferredYearPoint[] {
  const years = [taxYear - 3, taxYear - 2, taxYear - 1, taxYear];
  return years.map((year) => {
    const isCurrent = year === taxYear;
    const yearContributions = isCurrent ? contributions : 0;
    const deferred = yearContributions * marginalRate;
    return {
      year,
      contributions: yearContributions,
      deferred: isCurrent ? deferred * progress : deferred,
      isYtd: isCurrent ? true : undefined,
    };
  });
}

export function computeTaxOutlook(params: {
  taxProfile: TaxProfile | null;
  members: Member[];
  earnerScope: TaxEarnerScope;
  taxYear: number;
  strategies?: Array<Record<string, unknown>>;
  now?: Date;
}): TaxOutlook | null {
  const { taxProfile, members, earnerScope, taxYear, strategies = [], now = new Date() } =
    params;
  if (!taxProfile?.lastEstimate) return null;

  const scopedMembers = membersForScope(members, earnerScope);
  const share = wageShare(members, earnerScope);
  const progress = taxYearProgress(taxYear, now);
  const filingStatus = taxProfile.filingStatus;

  const federalAnnual = Number(taxProfile.lastEstimate.federalTax ?? 0) * share;
  const wages = sumWages(scopedMembers);
  const investmentIncome = sumInvestmentIncome(scopedMembers);
  const agi = Number(taxProfile.lastEstimate.adjustedGrossIncome ?? 0) * share;

  const ssAnnual = socialSecurityTax(wages, taxYear);
  const medicareAnnual = medicareTax(wages, filingStatus);
  const niitAnnual = niitTax(investmentIncome, agi, filingStatus);

  const federalSplit = splitByYearProgress(federalAnnual, progress);
  const ssSplit = splitByYearProgress(ssAnnual, progress);
  const medicareSplit = splitByYearProgress(medicareAnnual, progress);
  const niitSplit = splitByYearProgress(niitAnnual, progress);

  const paidBreakdown: TaxPaidBucket[] = [
    {
      bucket: "Federal",
      ytd: federalSplit.ytd,
      restOfYear: federalSplit.restOfYear,
      lifetime: federalAnnual * 25,
    },
    {
      bucket: "Social Security",
      ytd: ssSplit.ytd,
      restOfYear: ssSplit.restOfYear,
      lifetime: ssAnnual * 25,
    },
    {
      bucket: "Medicare",
      ytd: medicareSplit.ytd,
      restOfYear: medicareSplit.restOfYear,
      lifetime: medicareAnnual * 25,
    },
    {
      bucket: "NIIT",
      ytd: niitSplit.ytd,
      restOfYear: niitSplit.restOfYear,
      lifetime: niitAnnual * 25,
    },
  ];

  const paidYtd = paidBreakdown.reduce((s, b) => s + b.ytd, 0);
  const paidRestOfYear = paidBreakdown.reduce((s, b) => s + b.restOfYear, 0);
  const paidAnnual = paidYtd + paidRestOfYear;

  const marginalRate = Number(taxProfile.lastEstimate.marginalRate ?? 0.24);
  const contributions = sumPreTaxContributions(scopedMembers);
  const deferredAnnual = contributions * marginalRate;
  const deferredYtd = deferredAnnual * progress;

  const deferredByYear = buildDeferredByYear(
    taxYear,
    contributions,
    marginalRate,
    progress
  );
  const deferredCumulative = deferredByYear.reduce((s, y) => s + y.deferred, 0);

  const optimizedSavings = strategies.reduce(
    (s, strat) => s + Number(strat.estimatedSavings ?? 0),
    0
  );

  return {
    yearProgress: progress,
    paidYtd,
    paidRestOfYear,
    paidAnnual,
    paidLifetimeForward: paidAnnual * 25,
    deferredYtd,
    deferredCumulative,
    deferredByYear,
    paidBreakdown,
    effectiveRate: Number(taxProfile.lastEstimate.effectiveRate ?? 0),
    marginalRate,
    totalTaxAnnual: paidAnnual,
    onTrackPercent: computeOnTrackPercent(taxProfile.contributionLimits),
    openActions: countOpenActions(taxProfile.contributionLimits, strategies),
    optimizedTaxAnnual: Math.max(0, paidAnnual - optimizedSavings),
    optimizedSavings,
  };
}

export function membersMissingDateOfBirth(members: Member[]): Member[] {
  return activeEarners(members).filter((m) => !m.dateOfBirth?.trim());
}
