import {
  resolveMemberContributionAmount,
  resolveMemberIncomeAmounts,
} from "@portfolio/contracts";
import type { Member as ContractsMember } from "@portfolio/contracts";
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

function asContractsMember(member: MemberIncomeLike): ContractsMember {
  return { incomeSources: member.incomeSources ?? [] } as ContractsMember;
}

/** Annual income including resolved % bonus and other line items. */
export function resolvedMemberIncomeTotal(member: MemberIncomeLike): number {
  const resolved = resolveMemberIncomeAmounts(asContractsMember(member));
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

/** Annual contributions including resolved % employer match. */
export function resolvedMemberContributionTotal(
  member: MemberContributionsLike
): number {
  return (member.contributions ?? []).reduce(
    (sum, line) =>
      sum + resolveMemberContributionAmount(asContractsMember(member), line),
    0
  );
}

export function resolvedBonusAmount(member: MemberIncomeLike): number {
  return resolveMemberIncomeAmounts(asContractsMember(member)).bonus;
}

export function resolvedWagesAmount(member: MemberIncomeLike): number {
  return resolveMemberIncomeAmounts(asContractsMember(member)).wages;
}

export function resolvedEmployerMatchAmount(
  member: MemberContributionsLike,
  line: ContributionLineItem
): number {
  return resolveMemberContributionAmount(asContractsMember(member), line);
}

export type { MemberDraft };
