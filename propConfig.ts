import type { AccountSize } from './types';

export type DrawdownType = 'Estático' | 'EOD';
export interface PhaseRules {
  targetPct?: number;
  targetPctBySize?: Partial<Record<AccountSize, number>>;
  target?: number;
  drawdownType?: DrawdownType;
  maxDrawdown?: number;
  maxDrawdownBySize?: Partial<Record<AccountSize, number>>;
  dailyLoss?: number;
  consistencyEnabled?: boolean;
  consistencyPct?: number;
  profitableDaysEnabled?: boolean;
  profitableDays?: number;
  profitableDayPct?: number;
  cushionEnabled?: boolean;
  cushion?: number;
}
export interface PropPhaseConfig { phase: number; name: string; rules: PhaseRules; }
export interface PropProgramConfig { name: string; sizes: AccountSize[]; phases: PropPhaseConfig[]; }
export interface PropFirmConfig { name: string; official: boolean; programs: PropProgramConfig[]; }

const pnlPhases = (size: AccountSize): PropPhaseConfig[] => [{ phase: 1, name: 'Challenge', rules: {
  target: { '25K': 1500, '50K': 3000, '100K': 6000, '150K': 9000 }[size], targetPct: 6,
  drawdownType: 'Estático', maxDrawdown: { '25K': 1500, '50K': 3000, '100K': 6000, '150K': 9000 }[size],
  dailyLoss: { '25K': 750, '50K': 1500, '100K': 3000, '150K': 4500 }[size],
} }];

export const OFFICIAL_PROP_FIRMS: PropFirmConfig[] = [
  { name: 'PNL Global', official: true, programs: ([25, 50, 100, 150] as const).map(k => ({
    name: 'PNL Global', sizes: [`${k}K`] as AccountSize[], phases: pnlPhases(`${k}K` as AccountSize),
  })) },
  { name: 'Lucid Trading', official: true, programs: [{ name: 'LucidFlex', sizes: ['25K','50K','100K','150K'], phases: [{
    phase: 1, name: 'Evaluation', rules: {
      targetPctBySize: { '25K': 5, '50K': 6, '100K': 6, '150K': 6 }, drawdownType: 'EOD',
      maxDrawdownBySize: { '25K': 1000, '50K': 2000, '100K': 3000, '150K': 4500 },
      consistencyEnabled: true, consistencyPct: 50,
    },
  }] }] },
  { name: 'FundingPips', official: true, programs: [{ name: '2 Step Flex', sizes: ['25K','50K','100K'], phases: [
    { phase: 1, name: 'Phase 1', rules: { targetPct: 10, drawdownType: 'Estático', maxDrawdown: 3000, dailyLoss: 1000, profitableDaysEnabled: true, profitableDays: 3, profitableDayPct: 0.5 } },
    { phase: 2, name: 'Phase 2', rules: { targetPct: 6, drawdownType: 'Estático', maxDrawdown: 3000, dailyLoss: 1000, profitableDaysEnabled: true, profitableDays: 3, profitableDayPct: 0.5 } },
  ] }] },
];

export function hydrateRules(rules: PhaseRules, size: AccountSize): PhaseRules {
  const capital = { '25K': 25000, '50K': 50000, '100K': 100000, '150K': 150000 }[size];
  const targetPct = rules.targetPctBySize?.[size] ?? rules.targetPct;
  const maxDrawdown = rules.maxDrawdownBySize?.[size] ?? rules.maxDrawdown;
  return { ...rules, targetPct, target: rules.target ?? (targetPct != null ? capital * targetPct / 100 : undefined), maxDrawdown };
}
