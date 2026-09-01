import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Account, AccountPhase, AccountSize, AccountStatus, AppData, JourneyObjective, JourneyObjectiveType, JourneyState, Movement, MovementType, Trade } from './types';
import { seedData } from './seed';
import { deriveEvaluationState, rotateAccount } from './rotation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface NewAccountInput { name: string; code: string; size: AccountSize; }
interface NewTradeInput { accountId: string; asset: Trade['asset']; context: Trade['context']; timeframe: Trade['timeframe']; result: Trade['result']; amount: number; note?: string; }
interface NewMovementInput { type: MovementType; amount: number; description: string; }
interface JourneyObjectiveInput { name: string; type: JourneyObjectiveType; value?: number; progress: number; deadline?: string; icon: string; description?: string; }
interface AppContextValue {
  data: AppData; accounts: Account[]; trades: Trade[]; movements: Movement[]; loading: boolean;
  journeyState: JourneyState | null;
  addAccount: (input: NewAccountInput) => void;
  addTrade: (input: NewTradeInput) => Promise<{ ok: boolean; error?: string }>;
  setAccountStatus: (id: string, status: AccountStatus) => Promise<{ ok: boolean; error?: string }>;
  addMovement: (input: NewMovementInput) => Promise<{ ok: boolean; error?: string }>;
  deleteMovement: (id: string) => void;
  deleteTrade: (id: string) => void;
  deleteAccount: (id: string) => void;
  startJourney: () => Promise<{ ok: boolean; error?: string }>;
  saveJourneyObjective: (input: JourneyObjectiveInput) => Promise<{ ok: boolean; error?: string }>;
  completeJourneyObjective: () => Promise<{ ok: boolean; error?: string }>;
  syncJourneyAchievements: () => Promise<void>;
}
const AppContext = createContext<AppContextValue | null>(null);
const EMPTY_DATA: AppData = { accounts: [], trades: [], movements: [], seeded: true };

const TRADE_MILESTONES = [25, 50, 100, 250, 500, 1000] as const;
const DAY_MILESTONES = [30, 90, 180, 365] as const;
const TEN_K_MILESTONES = [1, 2, 3, 4] as const;
const PAYOUT_MILESTONES = [10000, 25000, 50000, 100000] as const;
const SCALE_IDS = ['scale_25k', 'scale_50k', 'scale_100k', 'scale_2x100k', 'scale_3x100k', 'scale_4x100k'] as const;

function calculateJourneyAchievements(state: JourneyState | null, data: AppData): string[] {
  if (!state?.startedAt) return state?.unlockedAchievements ?? [];
  const startMs = state.startedAt;
  const unlocked = new Set(state.unlockedAchievements ?? []);
  const journeyTrades = data.trades.filter(t => t.timestamp >= startMs);
  const journeyMovements = data.movements.filter(m => m.timestamp >= startMs);
  const funded = data.accounts.filter(a => a.status === 'Financiada' && a.fundedAt != null && a.fundedAt >= startMs);
  const tenKCount = funded.filter(a => a.size === '10K').length;
  const count25 = funded.filter(a => a.size === '25K').length;
  const count50 = funded.filter(a => a.size === '50K').length;
  const count100 = funded.filter(a => a.size === '100K').length;
  const payouts = journeyMovements.filter(m => String(m.type).toLowerCase() === 'saque').reduce((sum, m) => sum + Number(m.amount || 0), 0);
  const days = Math.max(1, Math.floor((Date.now() - startMs) / 86400000) + 1);

  TRADE_MILESTONES.forEach(n => { if (journeyTrades.length >= n) unlocked.add(`discipline_trades_${n}`); });
  DAY_MILESTONES.forEach(n => { if (days >= n) unlocked.add(`discipline_days_${n}`); });
  TEN_K_MILESTONES.forEach(n => { if (tenKCount >= n) unlocked.add(`tenk_${n}`); });
  if (count25 >= 1) unlocked.add(SCALE_IDS[0]);
  if (count50 >= 1) unlocked.add(SCALE_IDS[1]);
  if (count100 >= 1) unlocked.add(SCALE_IDS[2]);
  if (count100 >= 2) unlocked.add(SCALE_IDS[3]);
  if (count100 >= 3) unlocked.add(SCALE_IDS[4]);
  if (count100 >= 4) unlocked.add(SCALE_IDS[5]);
  PAYOUT_MILESTONES.forEach(n => { if (payouts >= n) unlocked.add(`freedom_${n}`); });
  return Array.from(unlocked);
}

async function persistJourneyState(userId: string, state: JourneyState): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('journey_state').upsert({
    user_id: userId,
    started_at: state.startedAt ?? null,
    unlocked_achievements: state.unlockedAchievements ?? [],
    objective: state.objective ?? null,
    updated_at: Date.now(),
  }, { onConflict: 'user_id' });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [journeyState, setJourneyState] = useState<JourneyState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setData(EMPTY_DATA); setJourneyState(null); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [accRes, tradeRes, movRes, journeyRes] = await Promise.all([
        supabase.from('accounts').select('*'),
        supabase.from('trades').select('*'),
        supabase.from('movements').select('*'),
        supabase.from('journey_state').select('*').maybeSingle(),
      ]);
      if (cancelled) return;
      const accounts = (accRes.data || []).map(rowToAccount);
      const trades = (tradeRes.data || []).map(rowToTrade);
      const movements = (movRes.data || []).map(rowToMovement);
      const loadedJourney = journeyRes.data ? rowToJourneyState(journeyRes.data as JourneyStateRow) : null;
      if (accounts.length === 0 && trades.length === 0 && movements.length === 0) {
        const seeded = seedData();
        await seedToSupabase(seeded);
        if (!cancelled) setData(seeded);
      } else setData({ accounts, trades, movements, seeded: true });
      if (!cancelled) setJourneyState(loadedJourney);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journey_state' }, payload => setJourneyState(rowToJourneyState(payload.new as unknown as JourneyStateRow)))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const value = useMemo<AppContextValue>(() => {
    const addAccount: AppContextValue['addAccount'] = input => {
      const status: AccountStatus = 'Avaliacao';
      const maxOrder = data.accounts.length ? Math.max(...data.accounts.map(a => a.queueOrder)) : -1;
      const acc: Account = { id: crypto.randomUUID(), name: input.name, code: input.code, size: input.size, status, propFirm: 'FundingPips', phase: 1, createdAt: Date.now(), queueOrder: maxOrder + 1 };
      setData(prev => ({ ...prev, accounts: [...prev.accounts, acc] }));
      supabase.from('accounts').insert(accountToRow(acc)).then(({ error }) => { if (error) console.error('Erro ao salvar conta:', error); });
    };

    const addTrade: AppContextValue['addTrade'] = async input => {
      const account = data.accounts.find(a => a.id === input.accountId);
      if (!account) return { ok: false, error: 'Conta não encontrada.' };
      const tradePhase: AccountPhase = account.status === 'Financiada' ? 0 : account.phase === 2 ? 2 : 1;
      const trade: Trade = { id: crypto.randomUUID(), accountId: input.accountId, asset: input.asset, context: input.context, timeframe: input.timeframe, result: input.result, amount: input.amount, note: input.note, timestamp: Date.now(), phase: tradePhase };
      const allTrades = [...data.trades, trade];
      const lifecycle = account.status === 'Avaliacao' ? deriveEvaluationState(account, allTrades) : { status: account.status, phase: account.phase ?? 0 };
      const updatedAccount = { ...account, status: lifecycle.status, phase: lifecycle.phase, fundedAt: lifecycle.status === 'Financiada' ? (account.fundedAt ?? trade.timestamp + 1) : undefined };
      const accountsWithState = data.accounts.map(a => a.id === account.id ? updatedAccount : a);
      const accounts = rotateAccount(accountsWithState, account.id);
      const { error: tradeError } = await supabase.from('trades').insert(tradeToRow(trade));
      if (tradeError) return { ok: false, error: tradeError.message };
      const persisted = accounts.find(a => a.id === input.accountId);
      if (persisted) {
        const { error } = await supabase.from('accounts').update({ queue_order: persisted.queueOrder, status: persisted.status, funded_at: persisted.fundedAt ?? null, phase: persisted.phase ?? null, prop_firm: persisted.propFirm ?? 'FundingPips' }).eq('id', input.accountId);
        if (error) return { ok: false, error: error.message };
      }
      const nextData = { ...data, trades: data.trades.some(t => t.id === trade.id) ? data.trades : [trade, ...data.trades], accounts };
      setData(prev => ({ ...prev, trades: prev.trades.some(t => t.id === trade.id) ? prev.trades : [trade, ...prev.trades], accounts }));
      await syncJourneyAchievementsFor(nextData, journeyState, user?.id);
      return { ok: true };
    };

    const setAccountStatus: AppContextValue['setAccountStatus'] = async (id, status) => {
      if (!user?.id) return { ok: false, error: 'Usuário não autenticado.' };
      const queue = data.accounts.slice().sort((a, b) => a.queueOrder - b.queueOrder);
      const maxOrder = queue.length ? Math.max(...queue.map(a => a.queueOrder)) : -1;
      const accounts = data.accounts.map(a => a.id === id ? { ...a, status, phase: status === 'Avaliacao' ? (a.phase === 0 ? 1 : a.phase) : 0 as AccountPhase, queueOrder: maxOrder + 1, fundedAt: status === 'Financiada' ? (a.fundedAt ?? Date.now() + 1) : undefined } : a);
      const updated = accounts.find(a => a.id === id);
      if (!updated) return { ok: false, error: 'Conta não encontrada.' };
      const { error } = await supabase.from('accounts').update({ status: updated.status, phase: updated.phase ?? null, queue_order: updated.queueOrder, funded_at: updated.fundedAt ?? null }).eq('id', id);
      if (error) return { ok: false, error: error.message };
      setData(prev => ({ ...prev, accounts }));
      await syncJourneyAchievementsFor({ ...data, accounts }, journeyState, user?.id);
      return { ok: true };
    };

    const addMovement: AppContextValue['addMovement'] = async input => {
      if (!user?.id) return { ok: false, error: 'Usuário não autenticado.' };
      const movement: Movement = { id: crypto.randomUUID(), type: input.type, amount: input.amount, description: input.description, timestamp: Date.now() };
      const { error } = await supabase.from('movements').insert(movementToRow(movement));
      if (error) return { ok: false, error: error.message };
      const nextData = { ...data, movements: [movement, ...data.movements] };
      setData(prev => ({ ...prev, movements: [movement, ...prev.movements] }));
      await syncJourneyAchievementsFor(nextData, journeyState, user?.id);
      return { ok: true };
    };
    const deleteMovement: AppContextValue['deleteMovement'] = id => { setData(prev => ({ ...prev, movements: prev.movements.filter(m => m.id !== id) })); supabase.from('movements').delete().eq('id', id).then(({ error }) => { if (error) console.error(error); }); };

    const deleteTrade: AppContextValue['deleteTrade'] = id => {
      const target = data.trades.find(t => t.id === id);
      if (!target) return;
      const remainingTrades = data.trades.filter(t => t.id !== id);
      const account = data.accounts.find(a => a.id === target.accountId);
      let accounts = data.accounts;
      if (account && account.status !== 'Reprovada' && (target.phase ?? 1) !== 0) {
        const lifecycle = deriveEvaluationState(account, remainingTrades);
        const rebuilt = { ...account, status: lifecycle.status, phase: lifecycle.phase, fundedAt: lifecycle.status === 'Financiada' ? (account.fundedAt ?? Date.now() + 1) : undefined };
        accounts = data.accounts.map(a => a.id === account.id ? rebuilt : a);
        supabase.from('accounts').update({ status: rebuilt.status, phase: rebuilt.phase, funded_at: rebuilt.fundedAt ?? null, queue_order: rebuilt.queueOrder, prop_firm: rebuilt.propFirm ?? 'FundingPips' }).then(({ error }) => { if (error) console.error('Erro ao recalcular conta após excluir trade:', error); });
      }
      setData(prev => ({ ...prev, trades: remainingTrades, accounts }));
      supabase.from('trades').delete().eq('id', id).then(({ error }) => { if (error) console.error('Erro ao excluir trade:', error); });
    };

    const deleteAccount: AppContextValue['deleteAccount'] = id => { setData(prev => ({ ...prev, accounts: prev.accounts.filter(a => a.id !== id), trades: prev.trades.filter(t => t.accountId !== id) })); supabase.from('accounts').delete().eq('id', id).then(({ error }) => { if (error) console.error(error); }); };

    const startJourney: AppContextValue['startJourney'] = async () => {
      if (journeyState?.startedAt) return { ok: true };
      if (!user?.id) return { ok: false, error: 'Usuário não autenticado.' };
      const state: JourneyState = { startedAt: Date.now(), unlockedAchievements: [], objective: journeyState?.objective ?? null };
      const result = await persistJourneyState(user.id, state);
      if (result.ok) setJourneyState(state);
      return result;
    };

    const saveJourneyObjective: AppContextValue['saveJourneyObjective'] = async input => {
      if (!user?.id) return { ok: false, error: 'Usuário não autenticado.' };
      if (!journeyState?.startedAt) return { ok: false, error: 'Inicie a Jornada antes de criar um objetivo.' };
      const current = journeyState.objective;
      const objective: JourneyObjective = {
        id: current?.id ?? crypto.randomUUID(), name: input.name.trim(), type: input.type, value: input.value, progress: Math.max(0, Number(input.progress) || 0), deadline: input.deadline || undefined,
        icon: input.icon, description: input.description?.trim() || undefined, completed: current?.completed ?? false, completedAt: current?.completedAt,
      };
      const nextState = { ...journeyState, objective };
      const result = await persistJourneyState(user.id, nextState);
      if (result.ok) setJourneyState(nextState);
      return result;
    };

    const completeJourneyObjective: AppContextValue['completeJourneyObjective'] = async () => {
      if (!user?.id || !journeyState?.objective) return { ok: false, error: 'Objetivo não encontrado.' };
      const objective = { ...journeyState.objective, completed: true, completedAt: Date.now(), progress: journeyState.objective.value ?? journeyState.objective.progress };
      const nextState = { ...journeyState, objective };
      const result = await persistJourneyState(user.id, nextState);
      if (result.ok) setJourneyState(nextState);
      return result;
    };

    const syncJourneyAchievements: AppContextValue['syncJourneyAchievements'] = async () => {
      await syncJourneyAchievementsFor(data, journeyState, user?.id, setJourneyState);
    };

    return { data, accounts: data.accounts, trades: data.trades, movements: data.movements, loading, journeyState, addAccount, addTrade, setAccountStatus, addMovement, deleteMovement, deleteTrade, deleteAccount, startJourney, saveJourneyObjective, completeJourneyObjective, syncJourneyAchievements };
  }, [data, loading, journeyState, user]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

async function syncJourneyAchievementsFor(nextData: AppData, state: JourneyState | null, userId?: string, setState?: (state: JourneyState) => void) {
  if (!state?.startedAt || !userId) return;
  const nextUnlocked = calculateJourneyAchievements(state, nextData);
  if (nextUnlocked.length === state.unlockedAchievements.length && nextUnlocked.every(id => state.unlockedAchievements.includes(id))) return;
  const nextState = { ...state, unlockedAchievements: nextUnlocked };
  const result = await persistJourneyState(userId, nextState);
  if (result.ok) setState?.(nextState);
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
interface JourneyStateRow { id: string; user_id: string; started_at: number | null; unlocked_achievements: unknown; objective: JourneyObjective | null; updated_at: number; }
function rowToJourneyState(r: JourneyStateRow): JourneyState { return { startedAt: r.started_at ?? undefined, unlockedAchievements: Array.isArray(r.unlocked_achievements) ? r.unlocked_achievements.filter(v => typeof v === 'string') as string[] : [], objective: r.objective ?? null }; }

type Payload = { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; old: Record<string, unknown> | null; new: Record<string, unknown> | null };
function applyChange(prev: AppData, table: 'accounts' | 'trades' | 'movements', payload: Payload): AppData {
  const { eventType, old, new: newRec } = payload;
  if (table === 'accounts') { if (eventType === 'DELETE') { const id = (old as AccountRow | null)?.id; return id ? { ...prev, accounts: prev.accounts.filter(a => a.id !== id) } : prev; } const acc = rowToAccount(newRec as unknown as AccountRow); if (eventType === 'INSERT') return prev.accounts.some(a => a.id === acc.id) ? prev : { ...prev, accounts: [...prev.accounts, acc] }; return { ...prev, accounts: prev.accounts.map(a => a.id === acc.id ? acc : a) }; }
  if (table === 'trades') { if (eventType === 'DELETE') { const id = (old as TradeRow | null)?.id; return id ? { ...prev, trades: prev.trades.filter(t => t.id !== id) } : prev; } const trade = rowToTrade(newRec as unknown as TradeRow); if (eventType === 'INSERT') return prev.trades.some(t => t.id === trade.id) ? prev : { ...prev, trades: [trade, ...prev.trades] }; return { ...prev, trades: prev.trades.map(t => t.id === trade.id ? trade : t) }; }
  if (eventType === 'DELETE') { const id = (old as MovementRow | null)?.id; return id ? { ...prev, movements: prev.movements.filter(m => m.id !== id) } : prev; }
  const movement = rowToMovement(newRec as unknown as MovementRow); if (eventType === 'INSERT') return prev.movements.some(m => m.id === movement.id) ? prev : { ...prev, movements: [movement, ...prev.movements] }; return { ...prev, movements: prev.movements.map(m => m.id === movement.id ? movement : m) };
}

async function seedToSupabase(seed: AppData) {
  try {
    await supabase.from('accounts').upsert(seed.accounts.map(accountToRow), { onConflict: 'id' });
    await supabase.from('trades').upsert(seed.trades.map(tradeToRow), { onConflict: 'id' });
    await supabase.from('movements').upsert(seed.movements.map(movementToRow), { onConflict: 'id' });
  } catch (e) { console.error('Erro ao semear dados:', e); }
}
