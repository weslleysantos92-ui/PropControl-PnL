export const FUNDING_PIPS_2_STEP_FLEX = {
  firm: 'FundingPips',
  model: '2 Step Flex',
  phases: {
    phase1: { profitTargetPct: 10, minimumTradingDays85Pct: 1, minimumProfitableDays95Pct: 3 },
    phase2: { profitTargetPct: 6, minimumTradingDays85Pct: 1, minimumProfitableDays95Pct: 3 },
  },
  accounts: [5000, 10000, 25000, 50000, 100000],
  lossLimits: {
    maxOverallLossPct: 12,
    maxDailyLossPct: 4,
    dailyReset: '00:00 UTC+3',
  },
  reward: {
    biWeekly85Pct: { splitPct: 85, cycleDays: 14, profitableDays: 0 },
    biWeekly95Pct: { splitPct: 95, cycleDays: 14, profitableDays: 3, profitableDayPct: 0.5 },
    minimumRequestPct: 1,
    selectionLockedForAccount: true,
  },
  profitConcentration: {
    evaluationMinAccountSize: 25000,
    triggerPctOfPhaseTarget: 60,
    masterProfitableDays: 4,
    masterProfitableDayPct: 0.5,
    lifetime: true,
    tradeIdeaWindowMinutesAfterLosingTrade: 10,
  },
  master: {
    riskPerTradeIdea: {
      below25K: null,
      at25K: 3,
      above25K: 2,
    },
    inactivityDays: 30,
    weekendHoldsAllowed: false,
    newsRestrictedWindowMinutesBefore: 5,
    newsRestrictedWindowMinutesAfter: 5,
    swingTraderNewsExceptionHours: 5,
  },
  execution: {
    lotLimitPerClick: 20,
    cryptoLotLimitPerClick: 1,
    leverage: {
      forex: '1:100',
      metals: '1:30',
      energies: '1:10',
      indices: '1:20',
      cryptoEvaluation: '1:2',
      cryptoMasterTemporary: '1:1',
    },
    dynamicMasterLeverage: [
      { maxLots: 0.05, leverage: '1:50' },
      { maxLots: 0.10, leverage: '1:30' },
      { maxLots: 0.15, leverage: '1:25' },
      { maxLots: 0.25, leverage: '1:20' },
      { maxLots: 0.50, leverage: '1:10' },
      { maxLots: Infinity, leverage: '1:5' },
    ],
    commission: {
      forexStandardPerLot: 5,
      forexSwapFreePerLot: 10,
      metalsStandardPerLot: 5,
      metalsSwapFreePerLot: 10,
      cryptoRate: 0.0004,
    },
  },
  reset: {
    phase1DiscountPct: 15,
    phase2DiscountPct: 10,
    masterDiscountPct: 7,
    validityDays: 7,
    phase2OrMasterRestartAtPhase1: true,
  },
} as const;

export type FundingPipsRewardSplit = 85 | 95;

export const FUNDING_PIPS_FLEX_SIZES = FUNDING_PIPS_2_STEP_FLEX.accounts.map(size => ({
  value: size,
  label: `$${size.toLocaleString('en-US')}`,
}));

export function getFlexPhaseTarget(accountSize: number, phase: 1 | 2): number {
  const pct = phase === 1
    ? FUNDING_PIPS_2_STEP_FLEX.phases.phase1.profitTargetPct
    : FUNDING_PIPS_2_STEP_FLEX.phases.phase2.profitTargetPct;
  return accountSize * (pct / 100);
}

export function getFlexDailyLossLimit(accountSize: number): number {
  return accountSize * (FUNDING_PIPS_2_STEP_FLEX.lossLimits.maxDailyLossPct / 100);
}

export function getFlexMaxLossLimit(accountSize: number): number {
  return accountSize * (FUNDING_PIPS_2_STEP_FLEX.lossLimits.maxOverallLossPct / 100);
}

export function getFlexRiskPerTradeIdeaLimit(accountSize: number): number | null {
  if (accountSize < 25000) return null;
  const pct = accountSize === 25000
    ? FUNDING_PIPS_2_STEP_FLEX.master.riskPerTradeIdea.at25K
    : FUNDING_PIPS_2_STEP_FLEX.master.riskPerTradeIdea.above25K;
  return accountSize * ((pct ?? 0) / 100);
}

export function getProfitConcentrationThreshold(accountSize: number, phase: 1 | 2): number | null {
  if (accountSize < FUNDING_PIPS_2_STEP_FLEX.profitConcentration.evaluationMinAccountSize) return null;
  return getFlexPhaseTarget(accountSize, phase) * (FUNDING_PIPS_2_STEP_FLEX.profitConcentration.triggerPctOfPhaseTarget / 100);
}

export function isProfitableDay(profit: number, accountSize: number): boolean {
  return profit >= accountSize * 0.005;
}
