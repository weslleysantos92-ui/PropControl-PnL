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

export const SIZE_VALUES: Record<AccountSize, number> = {
  '25K': 25000,
  '50K': 50000,
  '100K': 100000,
  '150K': 150000,
};

export const EVALUATION_TARGET_PCT: Record<AccountSize, number> = {
  '25K': 6,
  '50K': 6,
  '100K': 6,
  '150K': 6,
};

export const PROFITABLE_DAYS_TARGET = 5;

export interface PnLRule {
  capital: number;
  target: number;
  drawdown: number;
  floor: number;
  daily: number;
}

export const PNL_RULES: Record<AccountSize, PnLRule> = {
  '25K': { capital: 25000, target: 1500, drawdown: 1500, floor: 23500, daily: 750 },
  '50K': { capital: 50000, target: 3000, drawdown: 3000, floor: 47000, daily: 1500 },
  '100K': { capital: 100000, target: 6000, drawdown: 6000, floor: 94000, daily: 3000 },
  '150K': { capital: 150000, target: 9000, drawdown: 9000, floor: 141000, daily: 4500 },
};

export interface AccountColor {
  soft: string;
  text: string;
  ring: string;
  dot: string;
  label: string;
}

export const SIZE_COLORS: Record<AccountSize, AccountColor> = {
  '25K': { soft: 'bg-size25-soft', text: 'text-size25-text', ring: 'ring-size25-ring', dot: 'bg-size25', label: 'Azul Safira' },
  '50K': { soft: 'bg-size50-soft', text: 'text-size50-text', ring: 'ring-size50-ring', dot: 'bg-size50', label: 'Roxo Neon' },
  '100K': { soft: 'bg-size100-soft', text: 'text-size100-text', ring: 'ring-size100-ring', dot: 'bg-size100', label: 'Laranja/Dourado' },
  '150K': { soft: 'bg-size150-soft', text: 'text-size150-text', ring: 'ring-size150-ring', dot: 'bg-size150', label: 'Verde Esmeralda' },
};

export function getAccountColor(size: AccountSize): AccountColor {
  return SIZE_COLORS[size];
}

export function getAccountPhaseLabel(status: AccountStatus): string {
  if (status === 'Avaliacao') return 'Challenge';
  if (status === 'Financiada') return 'Funded Pro';
  return 'Reprovada';
}
