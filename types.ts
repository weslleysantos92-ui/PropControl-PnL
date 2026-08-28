import { FUNDING_PIPS_2_STEP_FLEX, type FundingPipsRewardSplit, getFlexDailyLossLimit, getFlexMaxLossLimit, getFlexPhaseTarget } from './fundingPips2StepFlex';

export type AccountSize = '5K' | '10K' | '25K' | '50K' | '100K' | '150K';
export type AccountStatus = 'Avaliacao' | 'Financiada' | 'Reprovada';
export type AccountPhase = 0 | 1 | 2;
export type AccountModel = '2 Step Flex';
export type Asset = string;
export type Context = 'Captura de Liquidez' | 'Inversão de Fluxo' | 'Estrutura Wyckoff' | 'Região Macro/Micro' | 'Rompimento';
export type Timeframe = 'M1' | 'M2' | 'M3' | 'M5' | 'M15';
export type TradeResult = 'Take' | 'Stop' | 'BE';
export type MovementType = 'investimento' | 'saque';

export interface Account {
  id: string; name: string; code: string; size: AccountSize; status: AccountStatus;
  propFirm?: string; model?: AccountModel; phase?: AccountPhase; rewardSplit?: FundingPipsRewardSplit;
  createdAt: number; queueOrder: number; fundedAt?: number;
}
export interface Trade { id: string; accountId: string; asset: Asset; context: Context; timeframe: Timeframe; result: TradeResult; amount: number; note?: string; timestamp: number; }
export interface Movement { id: string; type: MovementType; amount: number; description: string; timestamp: number; }
export interface AppData { accounts: Account[]; trades: Trade[]; movements: Movement[]; seeded: boolean; }

export const ASSETS: string[] = ['MNQ', 'NQ', 'MGC', 'GC'];
export const CONTEXTS: Context[] = ['Captura de Liquidez', 'Inversão de Fluxo', 'Estrutura Wyckoff', 'Região Macro/Micro', 'Rompimento'];
export const TIMEFRAMES: Timeframe[] = ['M1', 'M2', 'M3', 'M5', 'M15'];
export const TRADE_RESULTS: TradeResult[] = ['Take', 'Stop', 'BE'];
export const ACCOUNT_SIZES: AccountSize[] = ['5K', '10K', '25K', '50K', '100K', '150K'];
export const FUNDING_PIPS_FLEX_SIZES: AccountSize[] = ['5K', '10K', '25K', '50K', '100K'];
export const ACCOUNT_STATUSES: AccountStatus[] = ['Avaliacao', 'Financiada', 'Reprovada'];
export const SIZE_VALUES: Record<AccountSize, number> = { '5K': 5000, '10K': 10000, '25K': 25000, '50K': 50000, '100K': 100000, '150K': 150000 };
export const EVALUATION_TARGET_PCT = { phase1: FUNDING_PIPS_2_STEP_FLEX.phases.phase1.profitTargetPct, phase2: FUNDING_PIPS_2_STEP_FLEX.phases.phase2.profitTargetPct } as const;
export const PROFITABLE_DAYS_TARGET = 3;

export interface PnLRule { capital: number; phase1Target: number; phase2Target: number; maxLoss: number; dailyLoss: number; floor: number; target: number; drawdown: number; daily: number; }
export const PNL_RULES: Record<AccountSize, PnLRule> = Object.fromEntries(ACCOUNT_SIZES.map(size => {
  const capital = SIZE_VALUES[size];
  const phase1Target = getFlexPhaseTarget(capital, 1); const phase2Target = getFlexPhaseTarget(capital, 2); const maxLoss = getFlexMaxLossLimit(capital); const dailyLoss = getFlexDailyLossLimit(capital);
  return [size, { capital, phase1Target, phase2Target, maxLoss, dailyLoss, floor: capital - maxLoss, target: phase1Target, drawdown: maxLoss, daily: dailyLoss }];
})) as Record<AccountSize, PnLRule>;

export interface AccountColor { soft: string; text: string; ring: string; dot: string; label: string; }
export const SIZE_COLORS: Record<AccountSize, AccountColor> = {
  '5K': { soft: 'bg-size25-soft', text: 'text-size25-text', ring: 'ring-size25-ring', dot: 'bg-size25', label: 'Azul Safira' },
  '10K': { soft: 'bg-size25-soft', text: 'text-size25-text', ring: 'ring-size25-ring', dot: 'bg-size25', label: 'Azul Safira' },
  '25K': { soft: 'bg-size25-soft', text: 'text-size25-text', ring: 'ring-size25-ring', dot: 'bg-size25', label: 'Azul Safira' },
  '50K': { soft: 'bg-size50-soft', text: 'text-size50-text', ring: 'ring-size50-ring', dot: 'bg-size50', label: 'Roxo Neon' },
  '100K': { soft: 'bg-size100-soft', text: 'text-size100-text', ring: 'ring-size100-ring', dot: 'bg-size100', label: 'Laranja/Dourado' },
  '150K': { soft: 'bg-size150-soft', text: 'text-size150-text', ring: 'ring-size150-ring', dot: 'bg-size150', label: 'Verde Esmeralda' },
};
export function getAccountColor(size: AccountSize): AccountColor { return SIZE_COLORS[size]; }
export function getAccountPhaseLabel(status: AccountStatus, phase?: AccountPhase): string { if (status === 'Reprovada') return 'Reprovada'; if (status === 'Financiada') return 'Master Account'; return phase === 2 ? 'Fase 2' : 'Fase 1'; }
