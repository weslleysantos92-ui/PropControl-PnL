import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Account, AccountPhase, AccountSize, AccountStatus, AppData, JourneyObjective, JourneyObjectiveType, JourneyState, Movement, MovementType, Trade } from './types';
import { DEFAULT_FIRM_ID } from './types';
import { OFFICIAL_PROP_FIRMS, type PropFirmConfig } from './propConfig';
import { seedData } from './seed';
import { deriveEvaluationState, rotateAccount } from './rotation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface PropProgram { id: string; firmId: string; name: string; sizes: AccountSize[]; phases: { phase: number; name: string; rules: PropFirmConfig['programs'][number]['phases'][number]['rules'] }[] }
export interface PropFirm { id: string; name: string; isOfficial: boolean; programs: PropProgram[] }

interface NewAccountInput { name: string; code: string; size: AccountSize; firmId?: string; }
interface NewTradeInput { accountId: string; asset: Trade['asset']; context: Trade['context']; timeframe: Trade['timeframe']; result: Trade['result']; amount: number; riskAmount: number; note?: string; }
interface NewMovementInput { type: MovementType; amount: number; description: string; accountId?: string; requestedAmount?: number; splitPct?: number; }
interface JourneyObjectiveInput { name: string; type: JourneyObjectiveType; value?: number; progress: number; deadline?: string; icon: string; description?: string; }
interface AppContextValue {
  data: AppData; accounts: Account[]; trades: Trade[]; movements: Movement[]; loading: boolean;
  journeyState: JourneyState | null;
  propFirms: PropFirm[];
  addAccount: (input: NewAccountInput) => Promise<{ ok: boolean; error?: string }>;
  addTrade: (input: NewTradeInput) => Promise<{ ok: boolean; error?: string }>;
  setAccountStatus: (id: string, status: AccountStatus) => Promise<{ ok: boolean; error?: string }>;
  addMovement: (input: NewMovementInput) => Promise<{ ok: boolean; error?: string }>;
  deleteMovement: (id: string) => void;
  deleteTrade: (id: string) => void;
  deleteAccount: (id: string) => void;
  startJourney: () => Promise<{ ok: boolean; error?: string }>;
  resetJourney: () => Promise<{ ok: boolean; error?: string }>;
  saveJourneyObjective: (input: JourneyObjectiveInput) => Promise<{ ok: boolean; error?: string }>;
  completeJourneyObjective: () => Promise<{ ok: boolean; error?: string }>;
  resetObjective: () => Promise<{ ok: boolean; error?: string }>;
  syncJourneyAchievements: () => Promise<void>;
  createPropFirm: (input: PropFirmConfig) => Promise<{ ok: boolean; error?: string }>;
}
const AppContext = createContext<AppContextValue | null>(null);
const EMPTY_DATA: AppData = { accounts: [], trades: [], movements: [], seeded: true };
// TEMPORÁRIO (apenas para visualizar o Preview sem login). Reverter para `false` antes de publicar.
const PREVIEW_BYPASS_AUTH = true;

const TRADE_MILESTONES = [25, 50, 100, 250, 500, 1000] as const;
const DAY_MILESTONES = [30, 90, 180, 365] as const;
const TEN_K_MILESTONES = [1, 2, 3, 4] as const;
const PAYOUT_MILESTONES = [10000, 25000, 50000, 100000] as const;
const SCALE_IDS = ['scale_25k', 'scale_50k', 'scale_100k', 'scale_2x100k', 'scale_3x100k', 'scale_4x100k'] as const;

function calculateJourneyProgress(state: JourneyState | null, data: AppData): { unlocked: string[]; dates: Record<string, number> } {
  if (!state?.startedAt) return { unlocked: state?.unlockedAchievements ?? [], dates: state?.achievementDates ?? {} };
  const startMs = state.startedAt;
  const unlocked = new Set(state.unlockedAchievements ?? []);
  const dates: Record<string, number> = { ...(state.achievementDates ?? {}) };
  const mark = (id: string, at: number) => { unlocked.add(id); if (dates[id] == null) dates[id] = at; };

  const journeyTrades = data.trades.filter(t => t.timestamp >= startMs).sort((a, b) => a.timestamp - b.timestamp);
  const journeyMovements = data.movements.filter(m => m.timestamp >= startMs);
  const funded = data.accounts.filter(a => a.status === 'Financiada' && a.fundedAt != null && a.fundedAt >= startMs);
  const bySize = (size: AccountSize) => funded.filter(a => a.size === size).sort((a, b) => (a.fundedAt ?? 0) - (b.fundedAt ?? 0));
  const tenK = bySize('10K');
  const c25 = bySize('25K');
  const c50 = bySize('50K');
  const c100 = bySize('100K');
  const saques = journeyMovements.filter(m => String(m.type).toLowerCase() === 'saque').sort((a, b) => a.timestamp - b.timestamp);
  const days = Math.max(1, Math.floor((Date.now() - startMs) / 86400000) + 1);

  TRADE_MILESTONES.forEach(n => { if (journeyTrades.length >= n) mark(`discipline_trades_${n}`, journeyTrades[n - 1].timestamp); });
  DAY_MILESTONES.forEach(n => { if (days >= n) mark(`discipline_days_${n}`, startMs + (n - 1) * 86400000); });
  TEN_K_MILESTONES.forEach(n => { if (tenK.length >= n) mark(`tenk_${n}`, tenK[n - 1].fundedAt ?? Date.now()); });
  if (c25.length >= 1) mark(SCALE_IDS[0], c25[0].fundedAt ?? Date.now());
  if (c50.length >= 1) mark(SCALE_IDS[1], c50[0].fundedAt ?? Date.now());
  if (c100.length >= 1) mark(SCALE_IDS[2], c100[0].fundedAt ?? Date.now());
  if (c100.length >= 2) mark(SCALE_IDS[3], c100[1].fundedAt ?? Date.now());
  if (c100.length >= 3) mark(SCALE_IDS[4], c100[2].fundedAt ?? Date.now());
  if (c100.length >= 4) mark(SCALE_IDS[5], c100[3].fundedAt ?? Date.now());
  let running = 0; let mi = 0;
  for (const m of saques) {
    running += Number(m.amount || 0);
    while (mi < PAYOUT_MILESTONES.length && running >= PAYOUT_MILESTONES[mi]) { mark(`freedom_${PAYOUT_MILESTONES[mi]}`, m.timestamp); mi++; }
  }
  return { unlocked: Array.from(unlocked), dates };
}

async function persistJourneyState(userId: string, state: JourneyState): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('journey_state').upsert({
    user_id: userId,
    started_at: state.startedAt ?? null,
    unlocked_achievements: state.unlockedAchievements ?? [],
    achievement_dates: state.achievementDates ?? {},
    objective: state.objective ?? null,
    updated_at: Date.now(),
  }, { onConflict: 'user_id' });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [journeyState, setJourneyState] = useState<JourneyState | null>(null);
  const [propFirms, setPropFirms] = useState<PropFirm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // TEMPORÁRIO (apenas para visualizar o Preview sem login): usa dados mockados locais.
      // Reverter esta condição antes de publicar em produção.
      if (PREVIEW_BYPASS_AUTH) { setData(seedData()); setPropFirms(officialFirmsFallback()); setLoading(false); return; }
      setData(EMPTY_DATA); setJourneyState(null); setPropFirms([]); setLoading(false); return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [accRes, tradeRes, movRes, journeyRes, firmsRes, programsRes] = await Promise.all([
        supabase.from('accounts').select('*'),
        supabase.from('trades').select('*'),
        supabase.from('movements').select('*'),
        supabase.from('journey_state').select('*').maybeSingle(),
        supabase.from('prop_firms').select('*'),
        supabase.from('prop_programs').select('*'),
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
      if (!cancelled) {
        setJourneyState(loadedJourney);
        const mapped = (!firmsRes.error && firmsRes.data?.length)
          ? mapPropFirms(firmsRes.data, programsRes.data || [])
          : [];
        setPropFirms([...officialFirmsFallback(), ...mapped]);
      }
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
    const addAccount: AppContextValue['addAccount'] = async input => {
      const status: AccountStatus = 'Avaliacao';
      const maxOrder = data.accounts.length ? Math.max(...data.accounts.map(a => a.queueOrder)) : -1;
      const firmId = input.firmId ?? DEFAULT_FIRM_ID;
      const acc: Account = { id: crypto.randomUUID(), name: input.name, code: input.code, size: input.size, status, firmId, phase: 1, createdAt: Date.now(), queueOrder: maxOrder + 1 };
      const { error } = await supabase.from('accounts').insert(accountToRow(acc));
      if (error) { console.error('Erro ao salvar conta:', error); return { ok: false, error: error.message }; }
      setData(prev => ({ ...prev, accounts: [...prev.accounts, acc] }));
      return { ok: true };
    };

    const addTrade: AppContextValue['addTrade'] = async input => {
      const account = data.accounts.find(a => a.id === input.accountId);
      if (!account) return { ok: false, error: 'Conta não encontrada.' };
      const tradePhase: AccountPhase = account.status === 'Financiada' ? 0 : account.phase === 2 ? 2 : 1;
      const trade: Trade = { id: crypto.randomUUID(), accountId: input.accountId, asset: input.asset, context: input.context, timeframe: input.timeframe, result: input.result, amount: input.amount, riskAmount: input.riskAmount, note: input.note, timestamp: Date.now(), phase: tradePhase };
      const allTrades = [...data.trades, trade];
      const lifecycle = account.status === 'Avaliacao' ? deriveEvaluationState(account, allTrades, propFirms) : { status: account.status, phase: account.phase ?? 0 };
      const updatedAccount = { ...account, status: lifecycle.status, phase: lifecycle.phase, fundedAt: lifecycle.status === 'Financiada' ? (account.fundedAt ?? trade.timestamp + 1) : undefined };
      const accountsWithState = data.accounts.map(a => a.id === account.id ? updatedAccount : a);
      const accounts = rotateAccount(accountsWithState, account.id);
      const { error: tradeError } = await supabase.from('trades').insert(tradeToRow(trade));
      if (tradeError) return { ok: false, error: tradeError.message };
      const persisted = accounts.find(a => a.id === input.accountId);
      if (persisted) {
        const { error } = await supabase.from('accounts').update({ queue_order: persisted.queueOrder, status: persisted.status, funded_at: persisted.fundedAt ?? null, phase: persisted.phase ?? null }).eq('id', input.accountId);
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
      const movement: Movement = { id: crypto.randomUUID(), type: input.type, amount: input.amount, description: input.description, timestamp: Date.now(), accountId: input.accountId, requestedAmount: input.requestedAmount, splitPct: input.splitPct };
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
        const lifecycle = deriveEvaluationState(account, remainingTrades, propFirms);
        const rebuilt = { ...account, status: lifecycle.status, phase: lifecycle.phase, fundedAt: lifecycle.status === 'Financiada' ? (account.fundedAt ?? Date.now() + 1) : undefined };
        accounts = data.accounts.map(a => a.id === account.id ? rebuilt : a);
        supabase.from('accounts').update({ status: rebuilt.status, phase: rebuilt.phase, funded_at: rebuilt.fundedAt ?? null, queue_order: rebuilt.queueOrder }).eq('id', account.id).then(({ error }) => { if (error) console.error('Erro ao recalcular conta após excluir trade:', error); });
      }
      setData(prev => ({ ...prev, trades: remainingTrades, accounts }));
      supabase.from('trades').delete().eq('id', id).then(({ error }) => { if (error) console.error('Erro ao excluir trade:', error); });
    };

    const deleteAccount: AppContextValue['deleteAccount'] = id => { setData(prev => ({ ...prev, accounts: prev.accounts.filter(a => a.id !== id), trades: prev.trades.filter(t => t.accountId !== id) })); supabase.from('accounts').delete().eq('id', id).then(({ error }) => { if (error) console.error(error); }); };

    const startJourney: AppContextValue['startJourney'] = async () => {
      if (journeyState?.startedAt) return { ok: true };
      if (!user?.id) return { ok: false, error: 'Usuário não autenticado.' };
      const state: JourneyState = { startedAt: Date.now(), unlockedAchievements: [], achievementDates: {}, objective: journeyState?.objective ?? null };
      const result = await persistJourneyState(user.id, state);
      if (result.ok) setJourneyState(state);
      return result;
    };

    const resetJourney: AppContextValue['resetJourney'] = async () => {
      if (!user?.id) return { ok: false, error: 'Usuário não autenticado.' };
      const state: JourneyState = { startedAt: undefined, unlockedAchievements: [], achievementDates: {}, objective: journeyState?.objective ?? null };
      const result = await persistJourneyState(user.id, state);
      if (result.ok) setJourneyState(state);
      return result;
    };

    const saveJourneyObjective: AppContextValue['saveJourneyObjective'] = async input => {
      if (!user?.id) return { ok: false, error: 'Usuário não autenticado.' };
      const base: JourneyState = journeyState ?? { startedAt: undefined, unlockedAchievements: [], achievementDates: {}, objective: null };
      const current = base.objective;
      const objective: JourneyObjective = {
        id: current?.id ?? crypto.randomUUID(), name: input.name.trim(), type: input.type, value: input.value, progress: Math.max(0, Number(input.progress) || 0), deadline: input.deadline || undefined,
        icon: input.icon, description: input.description?.trim() || undefined, completed: current?.completed ?? false, completedAt: current?.completedAt, createdAt: current?.createdAt ?? Date.now(),
      };
      const nextState = { ...base, objective };
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

    const resetObjective: AppContextValue['resetObjective'] = async () => {
      if (!user?.id) return { ok: false, error: 'Usuário não autenticado.' };
      const base: JourneyState = journeyState ?? { startedAt: undefined, unlockedAchievements: [], achievementDates: {}, objective: null };
      const nextState = { ...base, objective: null };
      const result = await persistJourneyState(user.id, nextState);
      if (result.ok) setJourneyState(nextState);
      return result;
    };

    const syncJourneyAchievements: AppContextValue['syncJourneyAchievements'] = async () => {
      await syncJourneyAchievementsFor(data, journeyState, user?.id, setJourneyState);
    };

    const createPropFirm: AppContextValue['createPropFirm'] = async input => {
      const firmId = crypto.randomUUID();
      const firmResult = await supabase.from('prop_firms').insert({ id: firmId, name: input.name, is_official: false });
      if (firmResult.error) return { ok: false, error: firmResult.error.message };
      const programs: PropProgram[] = [];
      for (const p of input.programs) {
        const id = crypto.randomUUID();
        const result = await supabase.from('prop_programs').insert({ id, firm_id: firmId, name: p.name, sizes: p.sizes, phases: p.phases });
        if (result.error) {
          await supabase.from('prop_firms').delete().eq('id', firmId);
          return { ok: false, error: result.error.message };
        }
        programs.push({ id, firmId, name: p.name, sizes: p.sizes, phases: p.phases });
      }
      setPropFirms(prev => [...prev, { id: firmId, name: input.name, isOfficial: false, programs }]);
      return { ok: true };
    };

    return { data, accounts: data.accounts, trades: data.trades, movements: data.movements, loading, journeyState, propFirms, addAccount, addTrade, setAccountStatus, addMovement, deleteMovement, deleteTrade, deleteAccount, startJourney, resetJourney, saveJourneyObjective, completeJourneyObjective, resetObjective, syncJourneyAchievements, createPropFirm };
  }, [data, loading, journeyState, user, propFirms]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

async function syncJourneyAchievementsFor(nextData: AppData, state: JourneyState | null, userId?: string, setState?: (state: JourneyState) => void) {
  if (!state?.startedAt || !userId) return;
  const { unlocked: nextUnlocked, dates: nextDates } = calculateJourneyProgress(state, nextData);
  if (nextUnlocked.length === state.unlockedAchievements.length && nextUnlocked.every(id => state.unlockedAchievements.includes(id))) return;
  const nextState = { ...state, unlockedAchievements: nextUnlocked, achievementDates: nextDates };
  const result = await persistJourneyState(userId, nextState);
  if (result.ok) setState?.(nextState);
}

export function useApp(): AppContextValue { const ctx = useContext(AppContext); if (!ctx) throw new Error('useApp must be used within AppProvider'); return ctx; }

function officialFirmsFallback(): PropFirm[] {
  return OFFICIAL_PROP_FIRMS.map(firm => {
    const firmId = `official-${firm.name.toLowerCase().replace(/\s+/g, '-')}`;
    return {
      id: firmId,
      name: firm.name,
      isOfficial: true,
      programs: firm.programs.map((program, index) => ({
        id: `${firmId}-program-${index}`,
        firmId,
        name: program.name,
        sizes: program.sizes,
        phases: program.phases,
      })),
    };
  });
}

function mapPropFirms(firms: { id: string; name: string; is_official?: boolean }[], programs: { id: string; firm_id: string; name: string; sizes: AccountSize[]; phases: PropProgram['phases'] }[]): PropFirm[] {
  return firms.map(firm => ({
    id: firm.id,
    name: firm.name,
    isOfficial: Boolean(firm.is_official),
    programs: programs.filter(program => program.firm_id === firm.id).map(program => ({
      id: program.id,
      firmId: program.firm_id,
      name: program.name,
      sizes: program.sizes,
      phases: program.phases || [],
    })),
  }));
}

interface AccountRow { id: string; name: string; code: string; size: string; status: string; phase?: number; firm_id?: string | null; queue_order: number; created_at: number; funded_at: number | null; }
function rowToAccount(r: AccountRow): Account { return { id: r.id, name: r.name, code: r.code, size: r.size as AccountSize, status: r.status as AccountStatus, firmId: r.firm_id ?? DEFAULT_FIRM_ID, phase: (r.phase as AccountPhase) ?? (r.status === 'Financiada' ? 0 : 1), queueOrder: r.queue_order, createdAt: r.created_at, fundedAt: r.funded_at ?? undefined }; }
function accountToRow(a: Account): AccountRow { return { id: a.id, name: a.name, code: a.code, size: a.size, status: a.status, phase: a.phase ?? (a.status === 'Financiada' ? 0 : 1), firm_id: a.firmId ?? DEFAULT_FIRM_ID, queue_order: a.queueOrder, created_at: a.createdAt, funded_at: a.fundedAt ?? null }; }
interface TradeRow { id: string; account_id: string; asset: string; context: string; timeframe: string; result: string; amount: number; risk_amount: number | null; note: string | null; timestamp: number; phase?: number; }
function rowToTrade(r: TradeRow): Trade { return { id: r.id, accountId: r.account_id, asset: r.asset, context: r.context as Trade['context'], timeframe: r.timeframe as Trade['timeframe'], result: r.result as Trade['result'], amount: Number(r.amount), riskAmount: Number(r.risk_amount ?? 0), note: r.note ?? undefined, timestamp: r.timestamp, phase: r.phase as AccountPhase | undefined }; }
function tradeToRow(t: Trade): TradeRow { return { id: t.id, account_id: t.accountId, asset: t.asset, context: t.context, timeframe: t.timeframe, result: t.result, amount: t.amount, risk_amount: t.riskAmount ?? 0, note: t.note ?? null, timestamp: t.timestamp, phase: t.phase ?? 1 }; }
interface MovementRow { id: string; type: string; amount: number; description: string; timestamp: number; account_id?: string | null; requested_amount?: number | null; split_pct?: number | null; }
function rowToMovement(r: MovementRow): Movement { return { id: r.id, type: r.type as MovementType, amount: Number(r.amount), description: r.description, timestamp: r.timestamp, accountId: r.account_id ?? undefined, requestedAmount: r.requested_amount != null ? Number(r.requested_amount) : undefined, splitPct: r.split_pct != null ? Number(r.split_pct) : undefined }; }
function movementToRow(m: Movement): MovementRow { return { id: m.id, type: m.type, amount: m.amount, description: m.description, timestamp: m.timestamp, account_id: m.accountId ?? null, requested_amount: m.requestedAmount ?? null, split_pct: m.splitPct ?? null }; }
interface JourneyStateRow { id: string; user_id: string; started_at: number | null; unlocked_achievements: unknown; achievement_dates?: unknown; objective: JourneyObjective | null; updated_at: number; }
function rowToJourneyState(r: JourneyStateRow): JourneyState { return { startedAt: r.started_at ?? undefined, unlockedAchievements: Array.isArray(r.unlocked_achievements) ? r.unlocked_achievements.filter(v => typeof v === 'string') as string[] : [], achievementDates: r.achievement_dates && typeof r.achievement_dates === 'object' ? r.achievement_dates as Record<string, number> : {}, objective: r.objective ?? null }; }

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
