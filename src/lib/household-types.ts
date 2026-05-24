export interface Household {
  id: string;
  householdId: string;
  displayName: string;
  primaryState?: string;
  state: string;
  filingStatus?: string;
  dependents?: number;
  persona: string;
  settings?: {
    currency?: string;
    timezone?: string;
    defaultTaxYear?: number;
  };
  createdAt?: string;
  updatedAt?: string;
  netWorthSummary?: {
    netWorth?: number;
    totalAssets?: number;
    cashBalance?: number;
    investmentValue?: number;
  };
}

export type IncomeSourceType =
  | "wages"
  | "self_employment"
  | "interest"
  | "dividends"
  | "capital_gains_short"
  | "capital_gains_long"
  | "other";

export type ContributionType =
  | "401k"
  | "403b"
  | "traditional_ira"
  | "roth_ira"
  | "sep_ira"
  | "solo_401k"
  | "simple_ira"
  | "hsa"
  | "fsa_health"
  | "fsa_dependent_care"
  | "529"
  | "employer_match";

export type MemberRelationship = "self" | "spouse" | "dependent" | "other";

export interface IncomeLineItem {
  id: string;
  type: IncomeSourceType;
  amount: number;
  label?: string;
}

export interface ContributionLineItem {
  id: string;
  type: ContributionType;
  amount: number;
  label?: string;
}

export interface Member {
  id: string;
  householdId: string;
  name: string;
  relationship: MemberRelationship;
  dateOfBirth?: string;
  isActive: boolean;
  incomeSources: IncomeLineItem[];
  contributions: ContributionLineItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MemberDraft {
  id?: string;
  name: string;
  relationship: MemberRelationship;
  isActive: boolean;
  incomeSources: IncomeLineItem[];
  contributions: ContributionLineItem[];
}

export interface TaxProfile {
  id: string;
  householdId: string;
  taxYear: number;
  filingStatus: string;
  dependentCount: number;
  memberIds: string[];
  inputs: Record<string, number | string | undefined>;
  contributionLimits?: Array<{
    type: ContributionType;
    memberId?: string;
    limit: number;
    contributed: number;
    remaining: number;
  }>;
  lastEstimate?: {
    adjustedGrossIncome?: number;
    taxableIncome?: number;
    federalTax?: number;
    effectiveRate?: number;
    marginalRate?: number;
  };
}

export const PERSONA_LABELS: Record<string, string> = {
  w2_employee: "W-2 employee",
  low_income: "Lower income / benefits focus",
  business_owner: "Business owner",
  family_with_kids: "Family with kids",
};

export const FILING_LABELS: Record<string, string> = {
  single: "Single",
  married_filing_jointly: "Married filing jointly",
  married_filing_separately: "Married filing separately",
  head_of_household: "Head of household",
  qualifying_surviving_spouse: "Qualifying surviving spouse",
};

export const RELATIONSHIP_LABELS: Record<MemberRelationship, string> = {
  self: "Primary",
  spouse: "Spouse",
  dependent: "Dependent",
  other: "Other",
};

export const INCOME_TYPE_LABELS: Record<IncomeSourceType, string> = {
  wages: "W-2 wages",
  self_employment: "Self-employment",
  interest: "Interest",
  dividends: "Dividends",
  capital_gains_short: "Short-term capital gains",
  capital_gains_long: "Long-term capital gains",
  other: "Other income",
};

export const CONTRIBUTION_TYPE_LABELS: Record<ContributionType, string> = {
  "401k": "401(k)",
  "403b": "403(b)",
  traditional_ira: "Traditional IRA",
  roth_ira: "Roth IRA",
  sep_ira: "SEP IRA",
  solo_401k: "Solo 401(k)",
  simple_ira: "SIMPLE IRA",
  hsa: "HSA",
  fsa_health: "Health FSA",
  fsa_dependent_care: "Dependent care FSA",
  "529": "529 plan",
  employer_match: "Employer match (info)",
};

export const INCOME_SOURCE_OPTIONS = Object.entries(INCOME_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as IncomeSourceType, label })
);

export const CONTRIBUTION_TYPE_OPTIONS = Object.entries(
  CONTRIBUTION_TYPE_LABELS
).map(([value, label]) => ({ value: value as ContributionType, label }));

export function householdState(h: Household): string {
  return h.primaryState ?? h.state;
}

export function countDependentsFromMembers(members: MemberDraft[]): number {
  return members.filter((m) => m.isActive && m.relationship === "dependent")
    .length;
}
