import type { Account, AccountSize, AccountStatus, Trade } from './types';
import { SIZE_VALUES, EVALUATION_TARGET_PCT, PROFITABLE_DAYS_TARGET, LUCIDFLEX_RULES } from './types';
import { operationalDay } from './dates';

/**
 * Fila FIFO por categoria (Avaliação / Financiada).
 * queueOrder menor = próximo a operar.
 */
export function getQueue(accounts: Account[], status: AccountStatus): Account[] {
  return accounts
    .filter((a) => a.status === status)
    .sort((a, b) => a.queueOrder - b.queueOrder);
}

export function nextAccountToOperate(accounts: Account[]): Account | null {
  const avaliacao = getQueue(accounts, 'Avaliacao');
  if (avaliacao.length > 0) return avaliacao[0];
  const financiada = getQueue(accounts, 'Financiada');
  if (financiada.length > 0) return financiada[0];
  return null;
}

/**
 * Move a conta para o fim da fila de sua categoria e reordena os índices.
 */
export function rotateAccount(accounts: Account[], accountId: string): Account[] {
  const acc = accounts.find((a) => a.id === accountId);
  if (!acc) return accounts;

  const sameCategory = accounts
    .filter((a) => a.status === acc.status)
    .sort((a, b) => a.queueOrder - b.queueOrder);

  if (sameCategory.length <= 1) return accounts;

  const maxOrder = Math.max(...sameCategory.map((a) => a.queueOrder));
  const newOrder = maxOrder + 1;

  return accounts.map((a) => (a.id === accountId ? { ...a, queueOrder: newOrder } : a));
}

export function countFundedBySize(accounts: Account[], size: AccountSize): number {
  return accounts.filter((a) => a.size === size && a.status === 'Financiada').length;
}

export interface AccountStats {
  profitableDays: number;
  profitableDaysTarget: number;
  progressPct: number;
  totalAmount: number;
}

export function getAccountStats(account: Account, trades: Trade[]): AccountStats {
  const accountTrades = trades.filter((t) => t.accountId === account.id);
  const isFunded = account.status === 'Financiada';
  const minDailyProfit = LUCIDFLEX_RULES[account.size].minDailyProfit;
  const fundedTrades = isFunded && account.fundedAt
    ? accountTrades.filter((t) => t.timestamp >= account.fundedAt!)
    : isFunded ? accountTrades : [];
  const dayTotals = new Map<string, number>();
  for (const t of fundedTrades) {
    const key = operationalDay(t.timestamp);
    dayTotals.set(key, (dayTotals.get(key) || 0) + t.amount);
  }
  const profitableDays = isFunded
    ? Array.from(dayTotals.values()).filter((v) => v >= minDailyProfit).length
    : 0;
  const totalAmount = accountTrades.reduce((s, t) => s + t.amount, 0);
  const targetValue = (SIZE_VALUES[account.size] * EVALUATION_TARGET_PCT[account.size]) / 100;
  const progressPct = targetValue > 0 ? Math.min(100, Math.round((totalAmount / targetValue) * 100)) : 0;
  return { profitableDays, profitableDaysTarget: PROFITABLE_DAYS_TARGET, progressPct, totalAmount };
}
