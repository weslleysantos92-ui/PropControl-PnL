import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Account, AccountPhase, AccountSize, AccountStatus, AppData, Movement, MovementType, Trade } from './types';
import { seedData } from './seed';
import { deriveEvaluationState, rotateAccount } from './rotation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface NewAccountInput { name: string; code: string; size: AccountSize; }
interface NewTradeInput { accountId: string; asset: Trade['asset']; context: Trade['context']; timeframe: Trade['timeframe']; result: Trade['result']; amount: number; note?: string; }
interface NewMovementInput { type: MovementType; amount: number; description: string; }
interface AppContextValue {
  data: AppData; accounts: Account[]; trades: Trade[]; movements: Movement[]; loading: boolean;
  addAccount: (input: NewAccountInput) => void;
  addTrade: (input: NewTradeInput) => Promise<{ ok: boolean; error?: string }>;
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

  useEffect(() => {
    if (!user) { setData(EMPTY_DATA); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [accRes, tradeRes, movRes] = await Promise.all([
        supabase.from('accounts').select('*'),
        supabase.from('trades').select('*'),
        supabase.from('movements').select('*')
      ]);
      if (cancelled) return;
      const accounts = (accRes.data || []).map(rowToAccount);
      const trades = (tradeRes.data || []).map(rowToTrade);
      const movements = (movRes.data || []).map(rowToMovement);
      if (accounts.length === 0 && trades.length === 0 && movements.length === 0) {
        const seeded = seedData();
        await seedToSupabase(seeded);
        if (!cancelled) setData(seeded);
      } else setData({ accounts, trades, movements, seeded: true });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('propcontrol_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, payload => setData(prev => applyChange(prev, 'accounts', payload)))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, payload => setData(prev => applyChange(prev, 'trades', payload)))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movements' }, payload => setData(prev => applyChange(prev, 'movements', payload)))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const value = useMemo<AppContextValue>(() => {
    const addAccount: AppContextValue['addAccount'] = input => {
      const status: AccountStatus = 'Avaliacao';
      const maxOrder = data.accounts.length ? Math.max(...data.accounts.map(a => a.queueOrder)) : -1;
      const acc: Account = {
        id: crypto.randomUUID(), name: input.name, code: input.code, size: input.size,
        status, propFirm: 'FundingPips', phase: 1, createdAt: Date.now(), queueOrder: maxOrder + 1
      };
      setData(prev => ({ ...prev, accounts: [...prev.accounts, acc] }));
      supabase.from('accounts').insert(accountToRow(acc)).then(({ error }) => { if (error) console.error('Erro ao salvar conta:', error); });
    };

    const addTrade: AppContextValue['addTrade'] = async input => {
      const account = data.accounts.find(a => a.id === input.accountId);
      if (!account) return { ok: false, error: 'Conta não encontrada.' };

      // The trade belongs to the state that was active when it was recorded.
      // This is what makes Phase 1, Phase 2 and Master independent cycles.
      const tradePhase: AccountPhase = account.status === 'Financiada' ? 0 : account.phase === 2 ? 2 : 1;
      const trade: Trade = {
        id: crypto.randomUUID(), accountId: input.accountId, asset: input.asset,
        context: input.context, timeframe: input.timeframe, result: input.result,
        amount: input.amount, note: input.note, timestamp: Date.now(), phase: tradePhase
      };

      const allTrades = [...data.trades, trade];
      const lifecycle = account.status === 'Avaliacao' || account.status === 'Financiada'
        ? deriveEvaluationState(account, allTrades)
        : { status: account.status, phase: account.phase ?? 1 };

      const updatedAccount = {
        ...account,
        status: lifecycle.status,
        phase: lifecycle.phase,
        fundedAt: lifecycle.status === 'Financiada' ? (account.fundedAt ?? trade.timestamp + 1) : undefined,
      };

      // One trade is one rotation event, regardless of phase or status.
      const accountsWithState = data.accounts.map(a => a.id === account.id ? updatedAccount : a);
      const accounts = rotateAccount(accountsWithState, account.id);

      const { error: tradeError } = await supabase.from('trades').insert(tradeToRow(trade));
      if (tradeError) return { ok: false, error: tradeError.message };

      const persisted = accounts.find(a => a.id === input.accountId);
      if (persisted) {
        const { error } = await supabase.from('accounts').update({
          queue_order: persisted.queueOrder,
          status: persisted.status,
          funded_at: persisted.fundedAt ?? null,
          phase: persisted.phase ?? null,
          prop_firm: persisted.propFirm ?? 'FundingPips'
        }).eq('id', input.accountId);
        if (error) console.error('Erro ao atualizar conta após trade:', error);
      }

      setData(prev => ({
        ...prev,
        trades: prev.trades.some(t => t.id === trade.id) ? prev.trades : [trade, ...prev.trades],
        accounts
      }));
      return { ok: true };
    };

    const setAccountStatus: AppContextValue['setAccountStatus'] = (id, status) => {
      setData(prev => {
        const queue = prev.accounts.slice().sort((a, b) => a.queueOrder - b.queueOrder);
        const maxOrder = queue.length ? Math.max(...queue.map(a => a.queueOrder)) : -1;
        const accounts = prev.accounts.map(a => a.id === id ? {
          ...a,
          status,
          phase: status === 'Avaliacao' ? (a.phase === 0 ? 1 : a.phase) : 0 as AccountPhase,
          queueOrder: maxOrder + 1,
          fundedAt: status === 'Financiada' ? (a.fundedAt ?? Date.now() + 1) : undefined
        } : a);
        const updated = accounts.find(a => a.id === id);
        if (updated) supabase.from('accounts').update({ status: updated.status, phase: updated.phase ?? null, queue_order: updated.queueOrder, funded_at: updated.fundedAt ?? null }).eq('id', id).then(({ error }) => { if (error) console.error('Erro ao atualizar conta:', error); });
        return { ...prev, accounts };
      });
    };

    const addMovement: AppContextValue['addMovement'] = input => {
      const movement: Movement = { id: crypto.randomUUID(), type: input.type, amount: input.amount, description: input.description, timestamp: Date.now() };
      setData(prev => ({ ...prev, movements: [movement, ...prev.movements] }));
      supabase.from('movements').insert(movementToRow(movement)).then(({ error }) => { if (error) console.error(error); });
    };
    const deleteMovement: AppContextValue['deleteMovement'] = id => {
      setData(prev => ({ ...prev, movements: prev.movements.filter(m => m.id !== id) }));
      supabase.from('movements').delete().eq('id', id).then(({ error }) => { if (error) console.error(error); });
    };

    const deleteTrade: AppContextValue['deleteTrade'] = id => {
      const target = data.trades.find(t => t.id === id);
      if (!target) return;
      const remainingTrades = data.trades.filter(t => t.id !== id);
      const account = data.accounts.find(a => a.id === target.accountId);
      let accounts = data.accounts;

      // Rebuild the account lifecycle from the remaining phase-tagged trades.
      // Master trades (phase 0) never count toward evaluation progress.
      if (account && account.status !== 'Reprovada') {
        const lifecycle = deriveEvaluationState(account, remainingTrades);
        const rebuilt = {
          ...account,
          status: lifecycle.status,
          phase: lifecycle.phase,
          fundedAt: lifecycle.status === 'Financiada' ? (account.fundedAt ?? Date.now() + 1) : undefined,
        };
        accounts = data.accounts.map(a => a.id === account.id ? rebuilt : a);
        const { error } = await supabase.from('accounts').update({
          status: rebuilt.status,
          phase: rebuilt.phase,
          funded_at: rebuilt.fundedAt ?? null,
          queue_order: rebuilt.queueOrder,
          prop_firm: rebuilt.propFirm ?? 'FundingPips'
        }).eq('id', rebuilt.id);
        if (error) console.error('Erro ao recalcular conta após excluir trade:', error);
      }

      setData(prev => ({ ...prev, trades: remainingTrades, accounts }));
      supabase.from('trades').delete().eq('id', id).then(({ error }) => { if (error) console.error('Erro ao excluir trade:', error); });
    };

    const deleteAccount: AppContextValue['deleteAccount'] = id => {
      setData(prev => ({ ...prev, accounts: prev.accounts.filter(a => a.id !== id), trades: prev.trades.filter(t => t.accountId !== id) }));
      supabase.from('accounts').delete().eq('id', id).then(({ error }) => { if (error) console.error(error); });
    };
    return { data, accounts: data.accounts, trades: data.trades, movements: data.movements, loading, addAccount, addTrade, setAccountStatus, addMovement, deleteMovement, deleteTrade, deleteAccount };
  }, [data, loading, user]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp(): AppContextValue { const ctx = useContext(AppContext); if (!ctx) throw new Error('useApp must be used within AppProvider'); return ctx; }

interface AccountRow { id: string; name: string; code: string; size: string; status: string; prop_firm?: string; phase?: number; queue_order: number; created_at: number; funded_at: number | null; }
function rowToAccount(r: AccountRow): Account { return { id: r.id, name: r.name, code: r.code, size: r.size as AccountSize, status: r.status as AccountStatus, propFirm: r.prop_firm ?? 'FundingPips', phase: (r.phase as AccountPhase) ?? (r.status === 'Financiada' ? 0 : 1), queueOrder: r.queue_order, createdAt: r.created_at, fundedAt: r.funded_at ?? undefined }; }
function accountToRow(a: Account): AccountRow { return { id: a.id, name: a.name, code: a.code, size: a.size, status: a.status, prop_firm: a.propFirm ?? 'FundingPips', phase: a.phase ?? (a.status === 'Financiada' ? 0 : 1), queue_order: a.queueOrder, created_at: a.createdAt, funded_at: a.fundedAt ?? null }; }
interface TradeRow { id: string; account_id: string; asset: string; context: string; timeframe: string; result: string; amount: number; note: string | null; timestamp: number; phase?: number; }
function rowToTrade(r: TradeRow): Trade { return { id: r.id, accountId: r.account_id, asset: r.asset, context: r.context as Trade['context'], timeframe: r.timeframe as Trade['timeframe'], result: r.result as Trade['result'], amount: Number(r.amount), note: r.note ?? undefined, timestamp: r.timestamp, phase: r.phase as AccountPhase | undefined }; }
function tradeToRow(t: Trade): TradeRow { return { id: t.id, account_id: t.accountId, asset: t.asset, context: t.context, timeframe: t.timeframe, result: t.result, amount: t.amount, note: t.note ?? null, timestamp: t.timestamp, phase: t.phase ?? 1 }; }
interface MovementRow { id: string; type: string; amount: number; description: string; timestamp: number; }
function rowToMovement(r: MovementRow): Movement { return { id: r.id, type: r.type as MovementType, amount: Number(r.amount), description: r.description, timestamp: r.timestamp }; }
function movementToRow(m: Movement): MovementRow { return { id: m.id, type: m.type, amount: m.amount, description: m.description, timestamp: m.timestamp }; }

type Payload = { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; old: Record<string, unknown> | null; new: Record<string, unknown> | null };
function applyChange(prev: AppData, table: 'accounts' | 'trades' | 'movements', payload: Payload): AppData {
  const { eventType, old, new: newRec } = payload;
  if (table === 'accounts') { if (eventType === 'DELETE') { const id = (old as AccountRow | null)?.id; return id ? { ...prev, accounts: prev.accounts.filter(a => a.id !== id) } : prev; } const acc = rowToAccount(newRec as unknown as AccountRow); if (eventType === 'INSERT') return prev.accounts.some(a => a.id === acc.id) ? prev : { ...prev, accounts: [...prev.accounts, acc] }; return { ...prev, accounts: prev.accounts.map(a => a.id === acc.id ? acc : a) }; }
  if (table === 'trades') { if (eventType === 'DELETE') { const id = (old as TradeRow | null)?.id; return id ? { ...prev, trades: prev.trades.filter(t => t.id !== id) } : prev; } const trade = rowToTrade(newRec as unknown as TradeRow); if (eventType === 'INSERT') return prev.trades.some(t => t.id === trade.id) ? prev : { ...prev, trades: [trade, ...prev.trades] }; return { ...prev, trades: prev.trades.map(t => t.id === trade.id ? trade : t) }; }
  if (eventType === 'DELETE') { const id = (old as MovementRow | null)?.id; return id ? { ...prev, movements: prev.movements.filter(m => m.id !== id) } : prev; }
  const movement = rowToMovement(newRec as unknown as MovementRow); if (eventType === 'INSERT') return prev.movements.some(m => m.id === movement.id) ? prev : { ...prev, movements: [movement, ...prev.movements] }; return { ...prev, movements: prev.movements.map(m => m.id === movement.id ? movement : m) };
}
async function seedToSupabase(seeded: AppData): Promise<void> { await supabase.from('accounts').insert(seeded.accounts.map(accountToRow)); await supabase.from('trades').insert(seeded.trades.map(tradeToRow)); await supabase.from('movements').insert(seeded.movements.map(movementToRow)); }
