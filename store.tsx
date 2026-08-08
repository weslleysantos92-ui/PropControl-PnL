import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Account, AccountSize, AccountStatus, AppData, Movement, MovementType, Trade } from './types';
import { seedData } from './seed';
import { rotateAccount } from './rotation';
import { LUCIDFLEX_RULES } from './types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface NewAccountInput {
  name: string;
  code: string;
  size: AccountSize;
  status: AccountStatus;
  propFirm?: string;
}

interface NewTradeInput {
  accountId: string;
  asset: Trade['asset'];
  context: Trade['context'];
  timeframe: Trade['timeframe'];
  result: Trade['result'];
  amount: number;
  note?: string;
}

interface NewMovementInput {
  type: MovementType;
  amount: number;
  description: string;
}

interface AppContextValue {
  data: AppData;
  accounts: Account[];
  trades: Trade[];
  movements: Movement[];
  loading: boolean;
  addAccount: (input: NewAccountInput) => void;
  addTrade: (input: NewTradeInput) => void;
  setAccountStatus: (id: string, status: AccountStatus) => void;
  addMovement: (input: NewMovementInput) => void;
  deleteMovement: (id: string) => void;
  deleteTrade: (id: string) => void;
  deleteAccount: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const EMPTY_DATA: AppData = { accounts: [], trades: [], movements: [], seeded: true };

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  // Load from Supabase when user changes
  useEffect(() => {
    if (!user) {
      setData(EMPTY_DATA);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const [accRes, tradeRes, movRes] = await Promise.all([
        supabase.from('accounts').select('*'),
        supabase.from('trades').select('*'),
        supabase.from('movements').select('*'),
      ]);

      if (cancelled) return;

      const accounts = (accRes.data || []).map(rowToAccount);
      const trades = (tradeRes.data || []).map(rowToTrade);
      const movements = (movRes.data || []).map(rowToMovement);

      // First login with no data → seed demo accounts
      if (accounts.length === 0 && trades.length === 0 && movements.length === 0) {
        const seeded = seedData();
        await seedToSupabase(seeded);
        if (cancelled) return;
        setData(seeded);
      } else {
        setData({ accounts, trades, movements, seeded: true });
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('propcontrol_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, (payload) => {
        setData((prev) => applyChange(prev, 'accounts', payload));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, (payload) => {
        setData((prev) => applyChange(prev, 'trades', payload));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movements' }, (payload) => {
        setData((prev) => applyChange(prev, 'movements', payload));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const value = useMemo<AppContextValue>(() => {
    const addAccount: AppContextValue['addAccount'] = (input) => {
      const sameCat = data.accounts.filter((a) => a.status === input.status);
      const maxOrder = sameCat.length > 0 ? Math.max(...sameCat.map((a) => a.queueOrder)) : -1;
      const acc: Account = {
        id: crypto.randomUUID(),
        name: input.name,
        code: input.code,
        size: input.size,
        status: input.status,
        propFirm: input.propFirm || '—',
        createdAt: Date.now(),
        queueOrder: maxOrder + 1,
      };
      setData((prev) => ({ ...prev, accounts: [...prev.accounts, acc] }));
      supabase.from('accounts').insert(accountToRow(acc)).then();
    };

    const addTrade: AppContextValue['addTrade'] = (input) => {
      const trade: Trade = {
        id: crypto.randomUUID(),
        accountId: input.accountId,
        asset: input.asset,
        context: input.context,
        timeframe: input.timeframe,
        result: input.result,
        amount: input.amount,
        note: input.note,
        timestamp: Date.now(),
      };

      setData((prev) => {
        const account = prev.accounts.find((a) => a.id === input.accountId);
        let accounts = rotateAccount(prev.accounts, input.accountId);
        let fundedAt: number | undefined;

        if (account && account.status === 'Avaliacao') {
          const accountTrades = [...prev.trades, trade].filter((t) => t.accountId === input.accountId);
          const totalProfit = accountTrades.reduce((s, t) => s + t.amount, 0);
          const target = LUCIDFLEX_RULES[account.size].evaluationTarget;
          if (totalProfit >= target) {
            const fundedPeers = accounts.filter((a) => a.status === 'Financiada' && a.id !== input.accountId);
            const maxOrder = fundedPeers.length > 0 ? Math.max(...fundedPeers.map((a) => a.queueOrder)) : -1;
            fundedAt = trade.timestamp + 1;
            accounts = accounts.map((a) =>
              a.id === input.accountId ? { ...a, status: 'Financiada' as AccountStatus, queueOrder: maxOrder + 1, fundedAt } : a
            );
          }
        }

        // Update account queue_order (and fundedAt) in DB
        const updatedAcc = accounts.find((a) => a.id === input.accountId);
        if (updatedAcc) {
          supabase.from('accounts').update({
            queue_order: updatedAcc.queueOrder,
            status: updatedAcc.status,
            funded_at: updatedAcc.fundedAt ?? null,
          }).eq('id', input.accountId).then();
        }

        return { ...prev, trades: [trade, ...prev.trades], accounts };
      });

      supabase.from('trades').insert(tradeToRow(trade)).then();
    };

    const setAccountStatus: AppContextValue['setAccountStatus'] = (id, status) => {
      setData((prev) => {
        const sameCat = prev.accounts.filter((a) => a.status === status && a.id !== id);
        const maxOrder = sameCat.length > 0 ? Math.max(...sameCat.map((a) => a.queueOrder)) : -1;
        const accounts = prev.accounts.map((a) =>
          a.id === id ? { ...a, status, queueOrder: maxOrder + 1, fundedAt: status === 'Financiada' ? (a.fundedAt ?? (Date.now() + 1)) : undefined } : a
        );
        const updated = accounts.find((a) => a.id === id);
        if (updated) {
          supabase.from('accounts').update({
            status: updated.status,
            queue_order: updated.queueOrder,
            funded_at: updated.fundedAt ?? null,
          }).eq('id', id).then();
        }
        return { ...prev, accounts };
      });
    };

    const addMovement: AppContextValue['addMovement'] = (input) => {
      const m: Movement = {
        id: crypto.randomUUID(),
        type: input.type,
        amount: input.amount,
        description: input.description,
        timestamp: Date.now(),
      };
      setData((prev) => ({ ...prev, movements: [m, ...prev.movements] }));
      supabase.from('movements').insert(movementToRow(m)).then();
    };

    const deleteMovement: AppContextValue['deleteMovement'] = (id) => {
      setData((prev) => ({ ...prev, movements: prev.movements.filter((m) => m.id !== id) }));
      supabase.from('movements').delete().eq('id', id).then();
    };

    const deleteTrade: AppContextValue['deleteTrade'] = (id) => {
      setData((prev) => ({ ...prev, trades: prev.trades.filter((t) => t.id !== id) }));
      supabase.from('trades').delete().eq('id', id).then();
    };

    const deleteAccount: AppContextValue['deleteAccount'] = (id) => {
      setData((prev) => ({
        ...prev,
        accounts: prev.accounts.filter((a) => a.id !== id),
        trades: prev.trades.filter((t) => t.accountId !== id),
      }));
      supabase.from('accounts').delete().eq('id', id).then();
    };

    return {
      data,
      accounts: data.accounts,
      trades: data.trades,
      movements: data.movements,
      loading,
      addAccount,
      addTrade,
      setAccountStatus,
      addMovement,
      deleteMovement,
      deleteTrade,
      deleteAccount,
    };
  }, [data, loading, user]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

/* ─── Row mappers ─── */

interface AccountRow {
  id: string;
  name: string;
  code: string;
  size: string;
  status: string;
  prop_firm: string;
  queue_order: number;
  created_at: number;
  funded_at: number | null;
}

function rowToAccount(r: AccountRow): Account {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    size: r.size as AccountSize,
    status: r.status as AccountStatus,
    propFirm: r.prop_firm,
    queueOrder: r.queue_order,
    createdAt: r.created_at,
    fundedAt: r.funded_at ?? undefined,
  };
}

function accountToRow(a: Account): AccountRow {
  return {
    id: a.id,
    name: a.name,
    code: a.code,
    size: a.size,
    status: a.status,
    prop_firm: a.propFirm,
    queue_order: a.queueOrder,
    created_at: a.createdAt,
    funded_at: a.fundedAt ?? null,
  };
}

interface TradeRow {
  id: string;
  account_id: string;
  asset: string;
  context: string;
  timeframe: string;
  result: string;
  amount: number;
  note: string | null;
  timestamp: number;
}

function rowToTrade(r: TradeRow): Trade {
  return {
    id: r.id,
    accountId: r.account_id,
    asset: r.asset as Trade['asset'],
    context: r.context as Trade['context'],
    timeframe: r.timeframe as Trade['timeframe'],
    result: r.result as Trade['result'],
    amount: Number(r.amount),
    note: r.note ?? undefined,
    timestamp: r.timestamp,
  };
}

function tradeToRow(t: Trade): TradeRow {
  return {
    id: t.id,
    account_id: t.accountId,
    asset: t.asset,
    context: t.context,
    timeframe: t.timeframe,
    result: t.result,
    amount: t.amount,
    note: t.note ?? null,
    timestamp: t.timestamp,
  };
}

interface MovementRow {
  id: string;
  type: string;
  amount: number;
  description: string;
  timestamp: number;
}

function rowToMovement(r: MovementRow): Movement {
  return {
    id: r.id,
    type: r.type as MovementType,
    amount: Number(r.amount),
    description: r.description,
    timestamp: r.timestamp,
  };
}

function movementToRow(m: Movement): MovementRow {
  return {
    id: m.id,
    type: m.type,
    amount: m.amount,
    description: m.description,
    timestamp: m.timestamp,
  };
}

/* ─── Realtime change applier ─── */

type Payload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  old: Record<string, unknown> | null;
  new: Record<string, unknown> | null;
};

function applyChange(prev: AppData, table: 'accounts' | 'trades' | 'movements', payload: Payload): AppData {
  const { eventType, old, new: newRec } = payload;

  if (table === 'accounts') {
    if (eventType === 'DELETE') {
      const id = (old as AccountRow | null)?.id;
      return id ? { ...prev, accounts: prev.accounts.filter((a) => a.id !== id) } : prev;
    }
    const row = newRec as unknown as AccountRow;
    const acc = rowToAccount(row);
    if (eventType === 'INSERT') return { ...prev, accounts: [...prev.accounts, acc] };
    return { ...prev, accounts: prev.accounts.map((a) => (a.id === acc.id ? acc : a)) };
  }

  if (table === 'trades') {
    if (eventType === 'DELETE') {
      const id = (old as TradeRow | null)?.id;
      return id ? { ...prev, trades: prev.trades.filter((t) => t.id !== id) } : prev;
    }
    const row = newRec as unknown as TradeRow;
    const trade = rowToTrade(row);
    if (eventType === 'INSERT') return { ...prev, trades: [trade, ...prev.trades] };
    return { ...prev, trades: prev.trades.map((t) => (t.id === trade.id ? trade : t)) };
  }

  // movements
  if (eventType === 'DELETE') {
    const id = (old as MovementRow | null)?.id;
    return id ? { ...prev, movements: prev.movements.filter((m) => m.id !== id) } : prev;
  }
  const row = newRec as unknown as MovementRow;
  const mov = rowToMovement(row);
  if (eventType === 'INSERT') return { ...prev, movements: [mov, ...prev.movements] };
  return { ...prev, movements: prev.movements.map((m) => (m.id === mov.id ? mov : m)) };
}

/* ─── Seeding ─── */

async function seedToSupabase(seeded: AppData): Promise<void> {
  await supabase.from('accounts').insert(seeded.accounts.map(accountToRow));
  await supabase.from('trades').insert(seeded.trades.map(tradeToRow));
  await supabase.from('movements').insert(seeded.movements.map(movementToRow));
}
