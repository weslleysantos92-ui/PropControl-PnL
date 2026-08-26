import type { Trade } from '@/types';

/**
 * Returns the number of calendar days whose combined P&L is positive.
 * A day counts once, based on the net result of all trades from that day.
 */
export function countProfitableDays(trades: Trade[], accountId?: string): number {
  const dailyTotals = new Map<string, number>();

  for (const trade of trades) {
    if (accountId && trade.accountId !== accountId) continue;

    const date = new Date(trade.timestamp);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    dailyTotals.set(key, (dailyTotals.get(key) ?? 0) + trade.amount);
  }

  return Array.from(dailyTotals.values()).filter((total) => total > 0).length;
}
