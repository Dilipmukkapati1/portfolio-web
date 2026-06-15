import type { TaxProfile } from "@/lib/household-types";

function grossIncomeFromInputs(
  inputs: TaxProfile["inputs"] | undefined
): number {
  if (!inputs) return 0;
  return (
    Number(inputs.wages ?? 0) +
    Number(inputs.selfEmploymentIncome ?? 0) +
    Number(inputs.interestIncome ?? 0) +
    Number(inputs.dividendIncome ?? 0) +
    Number(inputs.capitalGainsShort ?? 0) +
    Number(inputs.capitalGainsLong ?? 0) +
    Number(inputs.otherIncome ?? 0)
  );
}

/** True when profile has deferrals but lastEstimate AGI was not reduced. */
export function isTaxEstimateStale(profile: TaxProfile | null): boolean {
  if (!profile?.lastEstimate) return false;

  const deferrals =
    Number(profile.inputs?.retirementContributions ?? 0) +
    Number(profile.inputs?.hsaContributions ?? 0);
  if (deferrals <= 0) return false;

  const gross = grossIncomeFromInputs(profile.inputs);
  const agi = Number(profile.lastEstimate.adjustedGrossIncome ?? 0);
  return gross > 0 && Math.abs(agi - gross) < 1;
}
