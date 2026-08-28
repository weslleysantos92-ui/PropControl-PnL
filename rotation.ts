import type { Account, AccountSize, AccountStatus, Trade } from './types';
import { SIZE_VALUES } from './types';
import { getFundingPipsPhaseTarget, getFundingPipsProfitableDayMinimum } from './fundingPips2StepFlex';
import { operationalDay } from './dates';

export function getQueue(accounts: Account[], status: AccountStatus): Account[] {
  return accounts.filter(a => a.status === status).sort((a, b) => a.queueOrder - b.queueOrder);
}

export function nextAccountToOperate(accounts: Account[]): Account | null {
  const avaliacao = getQueue(accounts, 'Avaliacao');
  if (avaliacao.length > 0) return avaliacao[0];
  const financiada = getQueue(accounts, 'Financiada');
  if (financiada.length > 0) return financiada[0];
  return null;
}

export function rotateAccount(accounts: Account[], accountId: string): Account[] {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return accounts;
  const sameCategory = accounts.filter(a => a.status === acc.status).sort((a, b) => a.queueOrder - b.queueOrder);
  if (sameCategory.length <= 1) return accounts;
  const maxOrder = Math.max(...sameCategory.map(a => a.queueOrder));
  return accounts.map(a => a.id === accountId ? { ...a, queueOrder: maxOrder + 1 } : a);
}

export function countFundedBySize(accounts: Account[], size: AccountSize): number {
  return accounts.filter(a => a.size === size && a.status === 'Financiada').length;
}

export interface AccountStats {
  profitableDays: number;
  profitableDaysTarget: number;
  progressPct: number;
  totalAmount: number;
}

export function getAccountStats(account: Account, trades: Trade[]): AccountStats {
  const accountTrades = trades.filter(t => t.accountId === account.id);
  const capital = SIZE_VALUES[account.size];
  const profitableDayMinimum = getFundingPipsProfitableDayMinimum(capital);
  const dayTotals = new Map<string, number>();
  for (const t of accountTrades) {
    const key = operationalDay(t.timestamp);
    dayTotals.set(key, (dayTotals.get(key) || 0) + t.amount);
  }
  const profitableDays = Array.from(dayTotals.values()).filter(v => v >= profitableDayMinimum).length;
  const totalAmount = accountTrades.reduce((s, t) => s + t.amount, 0);
  const phase = account.status === 'Avaliacao' && account.phase === 2 ? 2 : 1;
  const targetValue = getFundingPipsPhaseTarget(capital, phase);
  const progressBase = phase === 2 ? Math.max(0, totalAmount - getFundingPipsPhaseTarget(capital, 1)) : totalAmount;
  const progressPct = targetValue > 0 ? Math.min(100, Math.max(0, Math.round((progressBase / targetValue) * 100))) : 0;
  return { profitableDays, profitableDaysTarget: 3, progressPct, totalAmount };
}
