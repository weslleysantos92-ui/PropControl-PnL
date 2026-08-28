import type { Account, AccountPhase, AccountSize, AccountStatus, Trade } from './types';
import { SIZE_VALUES } from './types';
import { getFundingPipsPhaseTarget, getFundingPipsProfitableDayMinimum } from './fundingPips2StepFlex';
import { operationalDay } from './dates';

/** The rotation is global: evaluation and Master accounts share one queue. */
export function getQueue(accounts: Account[], status?: AccountStatus): Account[] {
  return accounts.filter(a => !status || a.status === status).sort((a, b) => a.queueOrder - b.queueOrder);
}

export function nextAccountToOperate(accounts: Account[]): Account | null {
  return getQueue(accounts)[0] ?? null;
}

export function rotateAccount(accounts: Account[], accountId: string): Account[] {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return accounts;
  const queue = getQueue(accounts);
  if (queue.length <= 1) return accounts;
  const maxOrder = Math.max(...queue.map(a => a.queueOrder));
  return accounts.map(a => a.id === accountId ? { ...a, queueOrder: maxOrder + 1 } : a);
}

export function countFundedBySize(accounts: Account[], size: AccountSize): number {
  return accounts.filter(a => a.size === size && a.status === 'Financiada').length;
}

export interface AccountStats { profitableDays: number; profitableDaysTarget: number; progressPct: number; totalAmount: number; }

export function getAccountStats(account: Account, trades: Trade[]): AccountStats {
  const phase = account.status === 'Avaliacao' && account.phase === 2 ? 2 : account.status === 'Avaliacao' ? 1 : 0;
  const accountTrades = trades.filter(t => t.accountId === account.id && (t.phase ?? 1) === phase);
  const capital = SIZE_VALUES[account.size];
  const profitableDayMinimum = getFundingPipsProfitableDayMinimum(capital);
  const dayTotals = new Map<string, number>();
  for (const t of accountTrades) {
    const key = operationalDay(t.timestamp);
    dayTotals.set(key, (dayTotals.get(key) || 0) + t.amount);
  }
  const profitableDays = Array.from(dayTotals.values()).filter(v => v >= profitableDayMinimum).length;
  const totalAmount = accountTrades.reduce((s, t) => s + t.amount, 0);
  const targetValue = phase === 2 ? getFundingPipsPhaseTarget(capital, 2) : phase === 1 ? getFundingPipsPhaseTarget(capital, 1) : 0;
  const progressPct = targetValue > 0 ? Math.min(100, Math.max(0, Math.round((totalAmount / targetValue) * 100))) : 0;
  return { profitableDays, profitableDaysTarget: 3, progressPct, totalAmount };
}

function phaseProfitableDays(accountSize: AccountSize, trades: Trade[], phase: 1 | 2): number {
  const minimum = getFundingPipsProfitableDayMinimum(SIZE_VALUES[accountSize]);
  const totals = new Map<string, number>();
  for (const t of trades) {
    if ((t.phase ?? 1) !== phase) continue;
    const key = operationalDay(t.timestamp);
    totals.set(key, (totals.get(key) || 0) + t.amount);
  }
  return Array.from(totals.values()).filter(v => v >= minimum).length;
}

/**
 * Rebuild evaluation status from phase-tagged trades.
 * Each phase has its own target and 3 profitable-day requirement.
 * Master trades (phase 0) never affect evaluation progress.
 */
export function deriveEvaluationState(account: Account, trades: Trade[]): { status: AccountStatus; phase: AccountPhase } {
  if (account.status === 'Reprovada') return { status: 'Reprovada', phase: account.phase ?? 1 };
  const capital = SIZE_VALUES[account.size];
  const accountTrades = trades.filter(t => t.accountId === account.id);

  const phase1Profit = accountTrades.filter(t => (t.phase ?? 1) === 1).reduce((s, t) => s + t.amount, 0);
  const phase1Days = phaseProfitableDays(account.size, accountTrades, 1);
  const phase1Complete = phase1Profit >= getFundingPipsPhaseTarget(capital, 1) && phase1Days >= 3;
  if (!phase1Complete) return { status: 'Avaliacao', phase: 1 };

  const phase2Profit = accountTrades.filter(t => (t.phase ?? 1) === 2).reduce((s, t) => s + t.amount, 0);
  const phase2Days = phaseProfitableDays(account.size, accountTrades, 2);
  const phase2Complete = phase2Profit >= getFundingPipsPhaseTarget(capital, 2) && phase2Days >= 3;
  if (!phase2Complete) return { status: 'Avaliacao', phase: 2 };

  return { status: 'Financiada', phase: 0 };
}
