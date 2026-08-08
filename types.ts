export type AccountSize = '25K' | '50K' | '100K' | '150K';
export type AccountStatus = 'Avaliacao' | 'Financiada' | 'Reprovada';
export type Asset = 'MNQ' | 'NQ' | 'MGC' | 'GC';
export type Context =
  | 'Captura de Liquidez'
  | 'Inversão de Fluxo'
  | 'Estrutura Wyckoff'
  | 'Região Macro/Micro'
  | 'Rompimento';
export type Timeframe = 'M1' | 'M5' | 'M15';
export type TradeResult = 'Take' | 'Stop' | 'BE';
export type MovementType = 'investimento' | 'saque';

export interface Account {
  id: string;
  name: string;
  code: string;
  size: AccountSize;
  status: AccountStatus;
  propFirm: string;
  createdAt: number;
  queueOrder: number;
  fundedAt?: number;
}

export interface Trade {
  id: string;
  accountId: string;
  asset: Asset;
  context: Context;
  timeframe: Timeframe;
  result: TradeResult;
  amount: number;
  note?: string;
  timestamp: number;
}

export interface Movement {
  id: string;
  type: MovementType;
  amount: number;
  description: string;
  timestamp: number;
}

export interface AppData {
  accounts: Account[];
  trades: Trade[];
  movements: Movement[];
  seeded: boolean;
}

export const ASSETS: Asset[] = ['MNQ', 'NQ', 'MGC', 'GC'];
export const CONTEXTS: Context[] = [
  'Captura de Liquidez',
  'Inversão de Fluxo',
  'Estrutura Wyckoff',
  'Região Macro/Micro',
  'Rompimento',
];
export const TIMEFRAMES: Timeframe[] = ['M1', 'M5', 'M15'];
export const TRADE_RESULTS: TradeResult[] = ['Take', 'Stop', 'BE'];
export const ACCOUNT_SIZES: AccountSize[] = ['25K', '50K', '100K', '150K'];
export const ACCOUNT_STATUSES: AccountStatus[] = ['Avaliacao', 'Financiada', 'Reprovada'];

export const SIZE_VALUES: Record<AccountSize, number> = { '25K': 25000, '50K': 50000, '100K': 100000, '150K': 150000 };
export const EVALUATION_TARGET_PCT: Record<AccountSize, number> = { '25K': 5, '50K': 6, '100K': 6, '150K': 6 };
export const PROFITABLE_DAYS_TARGET = 5;

export interface LucidFlexRules {
  evaluationTarget: number;
  evaluationTargetPct: number;
  maxDrawdown: number;
  minProfitableDays: number;
  minDailyProfit: number;
  maxWithdraw: number;
  profitSplit: number;
}

export const LUCIDFLEX_RULES: Record<AccountSize, LucidFlexRules> = {
  '25K': { evaluationTarget: 1250, evaluationTargetPct: 5, maxDrawdown: 1000, minProfitableDays: 5, minDailyProfit: 100, maxWithdraw: 1000, profitSplit: 90 },
  '50K': { evaluationTarget: 3000, evaluationTargetPct: 6, maxDrawdown: 2000, minProfitableDays: 5, minDailyProfit: 150, maxWithdraw: 2000, profitSplit: 90 },
  '100K': { evaluationTarget: 6000, evaluationTargetPct: 6, maxDrawdown: 3000, minProfitableDays: 5, minDailyProfit: 200, maxWithdraw: 2500, profitSplit: 90 },
  '150K': { evaluationTarget: 9000, evaluationTargetPct: 6, maxDrawdown: 4500, minProfitableDays: 5, minDailyProfit: 250, maxWithdraw: 3000, profitSplit: 90 },
};

export const SIZE_COLORS: Record<AccountSize, { soft: string; text: string; ring: string; dot: string; label: string }> = {
  '25K': { soft: 'bg-size25-soft', text: 'text-size25-text', ring: 'ring-size25-ring', dot: 'bg-size25', label: 'Azul' },
  '50K': { soft: 'bg-size50-soft', text: 'text-size50-text', ring: 'ring-size50-ring', dot: 'bg-size50', label: 'Roxo' },
  '100K': { soft: 'bg-size100-soft', text: 'text-size100-text', ring: 'ring-size100-ring', dot: 'bg-size100', label: 'Dourado' },
  '150K': { soft: 'bg-size150-soft', text: 'text-size150-text', ring: 'ring-size150-ring', dot: 'bg-size150', label: 'Esmeralda' },
};
