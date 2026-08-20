import type { AccountSize } from './types';

export type DrawdownType = 'Estático' | 'EOD';

export interface PhaseRules {
  targetPct?: number;
  target?: number;
  drawdownType?: DrawdownType;
  maxDrawdown?: number;
  dailyLoss?: number;
  consistencyEnabled?: boolean;
  consistencyPct?: number;
  profitableDaysEnabled?: boolean;
  profitableDays?: number;
  profitableDayPct?: number;
  cushionEnabled?: boolean;
  cushion?: number;
}

export interface PropPhaseConfig {
  phase: number;
  name: string;
  rules: PhaseRules;
}

export interface PropProgramConfig {
  name: string;
  sizes: AccountSize[];
  phases: PropPhaseConfig[];
}

export interface PropFirmConfig {
  name: string;
  official: boolean;
  programs: PropProgramConfig[];
}

const pnlPhases = (size: AccountSize): PropPhaseConfig[] => [{
  phase: 1,
  name: 'Challenge',
  rules: {
    target: { '25K': 1500, '50K': 3000, '100K': 6000, '150K': 9000 }[size],
    targetPct: 6,
    drawdownType: 'Estático',
    maxDrawdown: { '25K': 1500, '50K': 3000, '100K': 6000, '150K': 9000 }[size],
    dailyLoss: { '25K': 750, '50K': 1500, '100K': 3000, '150K': 4500 }[size],
  },
}];

export const OFFICIAL_PROP_FIRMS: PropFirmConfig[] = [
  {
    name: 'PNL Global', official: true,
    programs: [
      ...(['25K', '50K', '100K', '150K'] as AccountSize[]).map(size => ({ name: 'PNL Global', sizes: [size], phases: pnlPhases(size) })),
    ],
  },
  {
    name: 'Lucid Trading', official: true,
    programs: [{
      name: 'LucidFlex', sizes: ['25K', '50K', '100K', '150K'],
      phases: [{
        phase: 1, name: 'Evaluation', rules: {
          targetPct: 5, target: undefined, drawdownType: 'EOD',
          maxDrawdown: undefined, consistencyEnabled: true, consistencyPct: 50,
        },
      }],
    }],
  },
  {
    name: 'FundingPips', official: true,
    programs: [{
      name: '2 Step Flex', sizes: ['25K', '50K', '100K'],
      phases: [
        { phase: 1, name: 'Phase 1', rules: { targetPct: 10, drawdownType: 'Estático', maxDrawdown: undefined, dailyLoss: undefined, profitableDaysEnabled: true, profitableDays: 3, profitableDayPct: 0.5 } },
        { phase: 2, name: 'Phase 2', rules: { targetPct: 6, drawdownType: 'Estático', maxDrawdown: undefined, dailyLoss: undefined, profitableDaysEnabled: true, profitableDays: 3, profitableDayPct: 0.5 } },
      ],
    }],
  },
];

export function hydrateRules(rules: PhaseRules, size: AccountSize): PhaseRules {
  const capital = { '25K': 25000, '50K': 50000, '100K': 100000, '150K': 150000 }[size];
  return {
    ...rules,
    target: rules.target ?? (rules.targetPct != null ? capital * rules.targetPct / 100 : undefined),
    maxDrawdown: rules.maxDrawdown ?? undefined,
    dailyLoss: rules.dailyLoss ?? undefined,
  };
}
