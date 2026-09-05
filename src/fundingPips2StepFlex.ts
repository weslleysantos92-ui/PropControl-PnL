export const FUNDING_PIPS_RULES = {
  firm: 'FundingPips',
  accountSizes: [10000, 25000, 50000, 100000],
  drawdownType: 'static',
  maxOverallLossPct: 12,
  phases: {
    phase1: { profitTargetPct: 10 },
    phase2: { profitTargetPct: 6 },
  },
  profitConcentration: {
    appliesFromAccountSize: 25000,
    limitPct: 60,
    isApprovalRule: false,
  },
  minimumProfitableDays: 3,
  profitableDayPct: 0.5,
} as const;

export const FUNDING_PIPS_FLEX_SIZES = FUNDING_PIPS_RULES.accountSizes.map(size => ({
  value: size,
  label: `$${size.toLocaleString('en-US')}`,
}));

export function getFundingPipsPhaseTarget(accountSize: number, phase: 1 | 2): number {
  const pct = phase === 1
    ? FUNDING_PIPS_RULES.phases.phase1.profitTargetPct
    : FUNDING_PIPS_RULES.phases.phase2.profitTargetPct;
  return accountSize * (pct / 100);
}

export function getFundingPipsMaxLossLimit(accountSize: number): number {
  return accountSize * (FUNDING_PIPS_RULES.maxOverallLossPct / 100);
}

export function getFundingPipsProfitConcentrationLimit(accountSize: number): number | null {
  return accountSize >= FUNDING_PIPS_RULES.profitConcentration.appliesFromAccountSize
    ? FUNDING_PIPS_RULES.profitConcentration.limitPct
    : null;
}

export function getFundingPipsProfitableDayMinimum(accountSize: number): number {
  return accountSize * (FUNDING_PIPS_RULES.profitableDayPct / 100);
}
