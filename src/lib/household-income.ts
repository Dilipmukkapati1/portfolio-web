import type {
  ContributionLineItem,
  IncomeLineItem,
  MemberDraft,
} from "@/lib/household-types";

type MemberIncomeLike = {
  incomeSources?: IncomeLineItem[];
};

type MemberContributionsLike = MemberIncomeLike & {
  contributions?: ContributionLineItem[];
};

function resolveBonusAmount(line: IncomeLineItem, wagesAmount: number): number {
  if (line.type !== "bonus") return line.amount;
  if (line.amountMode === "percent_of_wages" && line.percent != null) {
    return Math.round((wagesAmount * line.percent) / 100);
  }
  return Math.max(0, line.amount);
}

function resolveMemberIncomeAmounts(member: MemberIncomeLike): {
  wages: number;
  bonus: number;
  cashIncome: number;
} {
  const lines = member.incomeSources ?? [];
  const rawWages = lines
    .filter((l) => l.type === "wages")
    .reduce((sum, l) => sum + l.amount, 0);

  let bonus = 0;
  for (const line of lines.filter((l) => l.type === "bonus")) {
    bonus += resolveBonusAmount(line, rawWages);
  }

  const cashIncome = lines
    .filter((l) => l.type === "cash_income")
    .reduce((sum, l) => sum + l.amount, 0);

  return { wages: rawWages, bonus, cashIncome };
}

function resolveMemberContributionAmount(
  member: MemberContributionsLike,
  line: ContributionLineItem
): number {
  if (line.type !== "employer_match") return line.amount;

  const mode = line.amountMode ?? "fixed";
  if (mode === "fixed") return Math.max(0, line.amount);

  const { wages, bonus } = resolveMemberIncomeAmounts(member);
  const percent = line.percent ?? 0;
  const base =
    mode === "percent_of_wages_and_bonus" ? wages + bonus : wages;
  return Math.round((base * percent) / 100);
}

/** Annual income including resolved % bonus and other line items. */
export function resolvedMemberIncomeTotal(member: MemberIncomeLike): number {
  const resolved = resolveMemberIncomeAmounts(member);
  let total = resolved.wages + resolved.bonus + resolved.cashIncome;
  for (const line of member.incomeSources ?? []) {
    if (
      line.type === "wages" ||
      line.type === "bonus" ||
      line.type === "cash_income"
    ) {
      continue;
    }
    total += line.amount;
  }
  return total;
}

/** Sum of resolved annual income across active members. */
export function resolvedHouseholdIncomeTotal(
  members: Array<MemberIncomeLike & { isActive?: boolean }>
): number {
  return members
    .filter((m) => m.isActive !== false)
    .reduce((sum, member) => sum + resolvedMemberIncomeTotal(member), 0);
}

export type HouseholdIncomeBreakdown = {
  total: number;
  wages: number;
  bonus: number;
  cashIncome: number;
  other: number;
  earnerCount: number;
};

/** Aggregate income by category across active members. */
export function resolveHouseholdIncomeBreakdown(
  members: Array<MemberIncomeLike & { isActive?: boolean }>
): HouseholdIncomeBreakdown {
  const active = members.filter((m) => m.isActive !== false);
  let wages = 0;
  let bonus = 0;
  let cashIncome = 0;
  let other = 0;
  let earnerCount = 0;

  for (const member of active) {
    const resolved = resolveMemberIncomeAmounts(member);
    const memberTotal = resolvedMemberIncomeTotal(member);
    wages += resolved.wages;
    bonus += resolved.bonus;
    cashIncome += resolved.cashIncome;
    other += memberTotal - resolved.wages - resolved.bonus - resolved.cashIncome;
    if (memberTotal > 0) earnerCount += 1;
  }

  return {
    total: wages + bonus + cashIncome + other,
    wages,
    bonus,
    cashIncome,
    other,
    earnerCount,
  };
}

/** Annual contributions including resolved % employer match. */
export function resolvedMemberContributionTotal(
  member: MemberContributionsLike
): number {
  return (member.contributions ?? []).reduce(
    (sum, line) => sum + resolveMemberContributionAmount(member, line),
    0
  );
}

export function resolvedBonusAmount(member: MemberIncomeLike): number {
  return resolveMemberIncomeAmounts(member).bonus;
}

export function resolvedWagesAmount(member: MemberIncomeLike): number {
  return resolveMemberIncomeAmounts(member).wages;
}

export function resolvedEmployerMatchAmount(
  member: MemberContributionsLike,
  line: ContributionLineItem
): number {
  return resolveMemberContributionAmount(member, line);
}

export type { MemberDraft };
