import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Award,
  CalendarDays,
  Check,
  ChevronDown,
  Crown,
  DollarSign,
  Hexagon,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  Rocket,
  Save,
  Target,
  Trophy,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '@/store';
import type { JourneyObjectiveType } from '@/types';

const TRADE_MILESTONES = [25, 50, 100, 250, 500, 1000] as const;
const DAY_MILESTONES = [30, 90, 180, 365] as const;
const PAYOUT_MILESTONES = [10000, 25000, 50000, 100000] as const;
const SCALE_LABELS = ['25K', '50K', '100K', '2 × 100K', '3 × 100K', '4 × 100K'] as const;
const SCALE_IDS = ['scale_25k', 'scale_50k', 'scale_100k', 'scale_2x100k', 'scale_3x100k', 'scale_4x100k'] as const;
const OBJECTIVE_TYPES: { value: JourneyObjectiveType; label: string }[] = [
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'profissional', label: 'Profissional' },
  { value: 'pessoal', label: 'Pessoal' },
  { value: 'outro', label: 'Outro' },
];
const ICONS = ['target', 'home', 'car', 'family', 'trophy', 'rocket'];

type ChapterId = 'disciplina' | 'conquista' | 'objetivo' | 'liberdade';

type ObjectiveForm = {
  name: string;
  type: JourneyObjectiveType;
  value: string;
  progress: string;
  deadline: string;
  icon: string;
  description: string;
};

function fmtDate(ms?: number): string {
  return ms ? new Date(ms).toLocaleDateString('pt-BR') : '—';
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof CalendarDays; label: string; value: string; sub: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-3.5">
      <Icon size={18} className="shrink-0 text-[#D4AF37]" />
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-wider text-gray-500">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-white">{value}</p>
        <p className="text-[9px] text-gray-600">{sub}</p>
      </div>
    </div>
  );
}

function ProgressBar({ current, target, unlocked, tone = 'gold' }: { current: number; target: number; unlocked: boolean; tone?: 'gold' | 'emerald' | 'blue' | 'cyan' | 'amber' }) {
  const progress = Math.min(100, target > 0 ? (current / target) * 100 : 0);
  const fill = !unlocked ? 'bg-[#3b3b40]' : tone === 'emerald' ? 'bg-gradient-to-r from-emerald-700 to-emerald-400' : tone === 'blue' ? 'bg-gradient-to-r from-blue-700 to-blue-400' : tone === 'cyan' ? 'bg-gradient-to-r from-cyan-700 to-cyan-400' : tone === 'amber' ? 'bg-gradient-to-r from-amber-700 to-amber-400' : 'bg-gradient-to-r from-[#9c741b] to-[#FFD85A]';
  return (
    <div className="mt-2 w-full overflow-hidden rounded-full bg-[#26262a]" style={{ height: '4px' }}>
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${progress}%` }} />
    </div>
  );
}

function AchievementRow({ label, current, target, unlocked, icon: Icon, date }: { label: string; current: number; target: number; unlocked: boolean; icon: typeof Award; date?: number }) {
  const progress = Math.min(100, target > 0 ? (current / target) * 100 : 0);
  return (
    <div className="journey-achievement-row flex items-center gap-3 rounded-xl border border-[#1c3144] bg-[#070f18] px-3.5 py-3 transition hover:border-[#2a4658]">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${unlocked ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300' : 'border-[#2a3a4a] bg-[#0c1620] text-slate-600'}`}>
        {unlocked ? <Check size={16} /> : <Lock size={15} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Icon size={14} className={unlocked ? 'text-cyan-400' : 'text-slate-600'} />
            <span className={`truncate text-sm ${unlocked ? 'text-white' : 'text-slate-400'}`}>{label}</span>
          </div>
          <span className={`shrink-0 text-[11px] font-bold ${unlocked ? 'text-cyan-300' : 'text-slate-600'}`}>{unlocked ? `Conquistado` : `${Math.round(progress)}%`}</span>
        </div>
        {unlocked ? <p className="mt-1 text-[10px] text-slate-600">{fmtDate(date)}</p> : <><ProgressBar current={current} target={target} unlocked={unlocked} /><p className="mt-1 text-[10px] text-slate-600">{current.toLocaleString('pt-BR')} / {target.toLocaleString('pt-BR')}</p></>}
      </div>
    </div>
  );
}

/** Degrau da escadinha de escala (25K → 50K → 100K → 2x100K → 3x100K → 4x100K). */
function ScaleStep({ index, label, unlocked, isNext, date }: { index: number; label: string; unlocked: boolean; isNext: boolean; date?: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#1c3144] bg-[#070f18] px-3.5 py-3 transition hover:border-[#2a4658]">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${unlocked ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : isNext ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-[#2a3a4a] bg-[#0c1620] text-slate-600'}`}>
        {unlocked ? <Check size={16} /> : isNext ? String(index + 1) : <Lock size={14} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${unlocked ? 'text-white' : isNext ? 'text-blue-300' : 'text-slate-500'}`}>{label} financiada{label.startsWith('2') || label.startsWith('3') || label.startsWith('4') ? 's' : ''}</p>
        <p className="text-[10px] text-slate-600">{unlocked ? fmtDate(date) : isNext ? 'Em progresso' : 'Bloqueado'}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${unlocked ? 'bg-emerald-500/10 text-emerald-400' : isNext ? 'bg-blue-500/10 text-blue-400' : 'bg-white/[0.03] text-slate-600'}`}>{unlocked ? 'Conquistado' : isNext ? 'Em progresso' : 'Bloqueado'}</span>
    </div>
  );
}

function ObjectiveIcon({ icon }: { icon: string }) {
  const value = icon === 'target' ? '🎯' : icon === 'home' ? '🏠' : icon === 'car' ? '🚗' : icon === 'family' ? '👨‍👩‍👧' : icon === 'trophy' ? '🏆' : '🚀';
  return <span aria-hidden="true">{value}</span>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-[#1c3144] py-2.5 text-xs last:border-0"><span className="text-slate-500">{label}</span><span className="font-semibold text-slate-200">{value}</span></div>;
}

export function Journey() {
  const { accounts, trades, movements, journeyState, startJourney, resetJourney, saveJourneyObjective, completeJourneyObjective, resetObjective, syncJourneyAchievements } = useApp();
  const [open, setOpen] = useState<ChapterId | null>(null);
  const [editingObjective, setEditingObjective] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmResetObjective, setConfirmResetObjective] = useState(false);
  const [resettingObjective, setResettingObjective] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const [form, setForm] = useState<ObjectiveForm>({ name: '', type: 'financeiro', value: '', progress: '0', deadline: '', icon: 'target', description: '' });

  const startMs = journeyState?.startedAt ?? null;
  const dates = journeyState?.achievementDates ?? {};
  const metrics = useMemo(() => {
    const journeyTrades = startMs ? trades.filter((trade) => trade.timestamp >= startMs) : [];
    const journeyMovements = startMs ? movements.filter((movement) => movement.timestamp >= startMs) : [];
    const funded = startMs ? accounts.filter((account) => account.status === 'Financiada' && account.fundedAt != null && account.fundedAt >= startMs) : [];
    const totalPayouts = journeyMovements.filter((movement) => String(movement.type).toLowerCase() === 'saque').reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
    const days = startMs ? Math.max(1, Math.floor((Date.now() - startMs) / 86400000) + 1) : 0;
    const count100 = funded.filter((account) => account.size === '100K').length;
    const scaleDone = [
      funded.some((account) => account.size === '25K'),
      funded.some((account) => account.size === '50K'),
      count100 >= 1,
      count100 >= 2,
      count100 >= 3,
      count100 >= 4,
    ];
    return { trades: journeyTrades.length, days, funded, totalPayouts, count100, scaleDone };
  }, [accounts, trades, movements, startMs, clockTick]);

  useEffect(() => {
    if (!journeyState?.startedAt) return;
    const elapsed = Date.now() - journeyState.startedAt;
    const nextBoundary = Math.max(1000, 86400000 - (elapsed % 86400000));
    const timer = window.setTimeout(() => setClockTick((tick) => tick + 1), nextBoundary);
    return () => window.clearTimeout(timer);
  }, [journeyState?.startedAt, clockTick]);

  useEffect(() => {
    if (journeyState?.startedAt) void syncJourneyAchievements();
  }, [journeyState?.startedAt, accounts, trades, movements, clockTick]);

  const unlocked = new Set(journeyState?.unlockedAchievements ?? []);
  const achievementsTotal = TRADE_MILESTONES.length + DAY_MILESTONES.length + SCALE_LABELS.length + PAYOUT_MILESTONES.length;
  const achievementsUnlocked = (journeyState?.unlockedAchievements ?? []).filter((id) =>
    id.startsWith('discipline_') || id.startsWith('scale_') || id.startsWith('freedom_')
  ).length;
  const scaleUnlockedCount = SCALE_IDS.filter((id) => unlocked.has(id)).length;
  const disciplineDone = TRADE_MILESTONES.filter((n) => unlocked.has(`discipline_trades_${n}`)).length + DAY_MILESTONES.filter((n) => unlocked.has(`discipline_days_${n}`)).length;
  const nextPayoutGoal = PAYOUT_MILESTONES.find((n) => metrics.totalPayouts < n);
  const journeyProgress = achievementsTotal > 0 ? Math.round((achievementsUnlocked / achievementsTotal) * 100) : 0;

  useEffect(() => {
    const objective = journeyState?.objective;
    if (objective && !editingObjective) {
      setForm({ name: objective.name, type: objective.type, value: objective.value == null ? '' : String(objective.value), progress: String(objective.progress), deadline: objective.deadline ?? '', icon: objective.icon, description: objective.description ?? '' });
    }
  }, [journeyState?.objective?.id, editingObjective]);

  const beginEditObjective = () => {
    const objective = journeyState?.objective;
    setForm(objective ? { name: objective.name, type: objective.type, value: objective.value == null ? '' : String(objective.value), progress: String(objective.progress), deadline: objective.deadline ?? '', icon: objective.icon, description: objective.description ?? '' } : { name: '', type: 'financeiro', value: '', progress: '0', deadline: '', icon: 'target', description: '' });
    setEditingObjective(true);
  };

  const normalizeObjective = (rawProgress: string, rawValue: string) => {
    const parsedProgress = Number(rawProgress);
    const parsedValue = rawValue === '' ? undefined : Number(rawValue);
    const value = parsedValue != null && Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : undefined;
    const max = value == null ? 100 : value;
    const progress = Math.min(max, Math.max(0, Number.isFinite(parsedProgress) ? parsedProgress : 0));
    return { value, progress };
  };

  const submitObjective = async () => {
    if (!form.name.trim()) return;
    const normalized = normalizeObjective(form.progress, form.value);
    const result = await saveJourneyObjective({ name: form.name, type: form.type, value: normalized.value, progress: normalized.progress, deadline: form.deadline || undefined, icon: form.icon, description: form.description });
    if (result.ok) setEditingObjective(false);
  };

  const confirmResetJourney = async () => {
    setResetting(true);
    await resetJourney();
    setResetting(false);
    setConfirmReset(false);
    setOpen(null);
  };

  const confirmResetObjectiveAction = async () => {
    setResettingObjective(true);
    await resetObjective();
    setResettingObjective(false);
    setConfirmResetObjective(false);
    setEditingObjective(false);
  };

  const toggle = (id: ChapterId) => setOpen((current) => (current === id ? null : id));

  const objectivePct = (() => {
    const objective = journeyState?.objective;
    if (!objective) return 0;
    return objective.value != null && objective.value > 0 ? Math.min(100, (objective.progress / objective.value) * 100) : Math.min(100, objective.progress);
  })();

  const chapterCards = [
    {
      id: 'disciplina' as const, number: '01', title: 'Disciplina', description: 'Construa o hábito, permaneça no caminho.', icon: Target, color: 'emerald' as const, span: false,
      summary: <><p className="mt-2 text-base font-bold text-white">{metrics.trades} <span className="text-xs font-normal text-gray-500">/ 100 trades</span></p><ProgressBar current={metrics.trades} target={100} unlocked tone="emerald" /><p className="mt-1 text-[10px] text-gray-600">{disciplineDone} / {TRADE_MILESTONES.length + DAY_MILESTONES.length} conquistas</p></>,
    },
    {
      id: 'conquista' as const, number: '02', title: 'Conquista', description: 'Escale seu capital nas mesas.', icon: Trophy, color: 'blue' as const, span: false,
      summary: <><p className="mt-2 text-base font-bold text-white">{scaleUnlockedCount} <span className="text-xs font-normal text-gray-500">/ {SCALE_IDS.length} etapas concluídas</span></p><div className="mt-2 flex gap-1.5">{SCALE_IDS.map((id) => <Hexagon key={id} size={16} className={unlocked.has(id) ? 'fill-blue-500 text-blue-400' : 'fill-transparent text-[#3b3b40]'} />)}</div></>,
    },
    {
      id: 'objetivo' as const, number: '03', title: 'Meu Objetivo', description: 'Defina seu sonho e acompanhe seu progresso.', icon: Target, color: 'cyan' as const, span: false,
      summary: journeyState?.objective
        ? <><p className="mt-2 text-base font-bold text-white">{journeyState.objective.value != null ? `${journeyState.objective.progress.toLocaleString('pt-BR')} / ${journeyState.objective.value.toLocaleString('pt-BR')}` : `${journeyState.objective.progress}%`} <span className="text-xs font-normal text-gray-500">({Math.round(objectivePct)}%)</span></p><ProgressBar current={objectivePct} target={100} unlocked tone="cyan" /></>
        : <p className="mt-2 text-sm text-gray-500">Personalizado — defina o seu.</p>,
    },
    {
      id: 'liberdade' as const, number: '04', title: 'Liberdade', description: 'Transforme consistência em liberdade financeira.', icon: Crown, color: 'amber' as const, span: false,
      summary: <><p className="mt-2 text-base font-bold text-white">US$ {metrics.totalPayouts.toLocaleString('en-US')}</p><ProgressBar current={metrics.totalPayouts} target={nextPayoutGoal ?? PAYOUT_MILESTONES[PAYOUT_MILESTONES.length - 1]} unlocked tone="amber" /><p className="mt-1 text-[10px] text-gray-600">{nextPayoutGoal ? `Próxima meta: US$ ${nextPayoutGoal.toLocaleString('en-US')}` : 'Todas as metas conquistadas'}</p></>,
    },
  ];

  const toneStyle = (color: string) => {
    switch (color) {
      case 'emerald': return { badge: 'bg-gradient-to-br from-emerald-400/25 to-emerald-500/5 border-emerald-400/40 text-emerald-300', glow: 'shadow-[0_0_28px_rgba(52,211,153,0.15)]', border: 'border-emerald-400/60', bg: 'from-[#0a1410] to-[#06100c]' };
      case 'blue': return { badge: 'bg-gradient-to-br from-sky-400/25 to-blue-500/5 border-sky-400/40 text-sky-300', glow: 'shadow-[0_0_28px_rgba(56,189,248,0.15)]', border: 'border-sky-400/60', bg: 'from-[#0a1018] to-[#060c14]' };
      case 'cyan': return { badge: 'bg-gradient-to-br from-cyan-400/25 to-cyan-500/5 border-cyan-400/40 text-cyan-300', glow: 'shadow-[0_0_28px_rgba(34,211,238,0.15)]', border: 'border-cyan-400/60', bg: 'from-[#081218] to-[#040c12]' };
      default: return { badge: 'bg-gradient-to-br from-amber-300/25 to-amber-500/5 border-amber-300/40 text-amber-300', glow: 'shadow-[0_0_28px_rgba(252,211,77,0.15)]', border: 'border-amber-300/60', bg: 'from-[#12100a] to-[#0c0a06]' };
    }
  };

  const renderObjective = () => {
    if (editingObjective) {
      return (
        <div className="journey-objective-form rounded-2xl border border-cyan-500/25 bg-[#081218] p-4 md:p-6">
          <div className="mb-5 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10"><Target size={20} className="text-cyan-400" /></div><div><h3 className="text-base font-extrabold text-white">{journeyState?.objective ? 'Editar objetivo' : 'Criar meu objetivo'}</h3><p className="text-[11px] text-slate-500">Defina algo concreto que essa jornada vai te ajudar a conquistar.</p></div></div>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Qual é o seu objetivo?</label>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ex: Comprar meu carro" className="w-full rounded-xl border border-[#1c3144] bg-[#040c12] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400" />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Tipo de objetivo</label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">{OBJECTIVE_TYPES.map((type) => <button key={type.value} type="button" onClick={() => setForm((current) => ({ ...current, type: type.value }))} className={`rounded-xl border px-3 py-3 text-xs font-semibold transition ${form.type === type.value ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300' : 'border-[#1c3144] text-slate-400 hover:border-[#2a4658]'}`}>{type.label}</button>)}</div>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Ícone</label>
              <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-[#1c3144] bg-[#040c12] px-2.5 py-2">{ICONS.map((icon) => <button key={icon} type="button" onClick={() => setForm((current) => ({ ...current, icon }))} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg transition ${form.icon === icon ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40' : 'text-slate-500 hover:text-slate-300'}`}><ObjectiveIcon icon={icon} /></button>)}</div>
            </div>
            <div className="rounded-xl border border-[#1c3144] bg-[#040c12] p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Como você quer acompanhar o progresso?</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-[10px] text-slate-500">Meta total (opcional)</label><input type="number" min="0" value={form.value} onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))} placeholder="Ex: 50000" className="w-full rounded-xl border border-[#1c3144] bg-[#070f16] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400" /></div>
                <div><label className="mb-1.5 block text-[10px] text-slate-500">Valor atual</label><input type="number" min="0" value={form.progress} onChange={(event) => setForm((current) => ({ ...current, progress: event.target.value }))} placeholder="Ex: 12000" className="w-full rounded-xl border border-[#1c3144] bg-[#070f16] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400" /></div>
              </div>
              <p className="mt-2.5 text-[10px] leading-relaxed text-slate-600">Se não quiser colocar um valor em dinheiro, deixe a "Meta total" em branco e use o "Valor atual" como uma porcentagem (0 a 100).</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Prazo (opcional)</label><input type="date" value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} className="w-full rounded-xl border border-[#1c3144] bg-[#040c12] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 [color-scheme:dark]" /></div>
              <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Descrição (opcional)</label><input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Por que é importante?" className="w-full rounded-xl border border-[#1c3144] bg-[#040c12] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400" /></div>
            </div>
            <div className="flex gap-3 pt-1"><button onClick={() => setEditingObjective(false)} className="flex-1 rounded-xl border border-[#1c3144] px-4 py-3 text-xs font-semibold text-slate-300 transition hover:bg-white/5">Cancelar</button><button onClick={submitObjective} disabled={!form.name.trim()} className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-3 text-xs font-bold text-slate-950 transition hover:brightness-110 disabled:opacity-40"><Save size={14} className="mr-1.5 inline" />Salvar objetivo</button></div>
          </div>
        </div>
      );
    }

    if (journeyState?.objective) {
      const objective = journeyState.objective;
      const progressPercent = objective.value != null && objective.value > 0 ? Math.min(100, (objective.progress / objective.value) * 100) : Math.min(100, objective.progress);
      const faltam = objective.value != null ? Math.max(0, objective.value - objective.progress) : null;
      return (
        <div className="rounded-2xl border border-cyan-500/25 bg-[#081218] p-4 md:p-5">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="text-[10px] uppercase tracking-wider text-cyan-400">{OBJECTIVE_TYPES.find((t) => t.value === objective.type)?.label ?? objective.type}</p><div className="mt-1.5 flex items-center gap-2"><span className="text-2xl"><ObjectiveIcon icon={objective.icon} /></span><h3 className="text-lg font-extrabold text-white">{objective.name}</h3></div>{objective.description && <p className="mt-2 text-xs text-slate-400">{objective.description}</p>}</div><button onClick={beginEditObjective} className="shrink-0 rounded-lg border border-[#1c3144] p-2 text-slate-400 transition hover:text-white"><Pencil size={14} /></button></div>
          <div className="mt-4"><div className="flex justify-between text-[11px] text-slate-400"><span>Progresso</span><span>{objective.value != null ? `${objective.progress.toLocaleString('pt-BR')} / ${objective.value.toLocaleString('pt-BR')}` : `${objective.progress}%`}</span></div><div className="mt-2 w-full overflow-hidden rounded-full bg-[#0d1e2a]" style={{ height: '6px' }}><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all" style={{ width: `${progressPercent}%` }} /></div><p className="mt-1.5 text-right text-[10px] text-slate-600">{Math.round(progressPercent)}% concluído</p></div>
          <div className="mt-4 rounded-lg border border-[#1c3144] bg-[#040c12] px-4">
            <DetailRow label="Tipo de objetivo" value={OBJECTIVE_TYPES.find((t) => t.value === objective.type)?.label ?? objective.type} />
            {objective.value != null && <DetailRow label="Meta total" value={objective.value.toLocaleString('pt-BR')} />}
            <DetailRow label="Valor atual" value={objective.progress.toLocaleString('pt-BR')} />
            {faltam != null && <DetailRow label="Faltam" value={faltam.toLocaleString('pt-BR')} />}
            <DetailRow label="Criado em" value={fmtDate(objective.createdAt)} />
          </div>
          {objective.deadline && <p className="mt-3 text-[11px] text-slate-500">Prazo: {new Date(`${objective.deadline}T00:00:00`).toLocaleDateString('pt-BR')}</p>}
          <div className="mt-4 flex flex-wrap gap-2"><button onClick={beginEditObjective} className="flex-1 rounded-xl border border-cyan-500/30 px-4 py-2.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/10">Atualizar progresso</button>{!objective.completed && <button onClick={() => void completeJourneyObjective()} className="rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:brightness-110"><CheckCircle size={14} className="mr-1 inline" />Concluir</button>}<button onClick={() => setConfirmResetObjective(true)} className="rounded-xl border border-red-500/25 px-4 py-2.5 text-xs font-semibold text-red-400/80 transition hover:border-red-500/40 hover:text-red-300"><RotateCcw size={13} className="mr-1 inline" />Redefinir</button></div>
          {objective.completed && <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">Objetivo concluído.</div>}
        </div>
      );
    }

    return <div className="rounded-2xl border border-cyan-500/25 bg-[#081218] p-6 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10"><Target className="text-cyan-400" size={28} /></div><h3 className="mt-3 text-base font-extrabold text-white">Qual é o seu próximo sonho?</h3><p className="mt-1 text-xs text-slate-400">Defina um objetivo que faça essa jornada valer a pena.</p><button onClick={beginEditObjective} className="mt-5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-5 py-3 text-xs font-bold text-slate-950 transition hover:brightness-110"><Plus size={15} className="mr-1.5 inline" />Criar meu objetivo</button></div>;
  };

  return (
    <div className="journey-page min-h-screen px-3 pb-28 pt-4 text-white md:px-6 md:pt-6">
      <div className="mx-auto max-w-[1040px] space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div><div className="flex items-center gap-3"><div className="journey-title-icon"><Crown size={22} /></div><div><h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">Minha Jornada</h1><p className="mt-1 text-xs text-slate-400">Consistência transformada em liberdade.</p></div></div></div>
          {journeyState?.startedAt && <button onClick={() => setConfirmReset(true)} className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-[10px] font-semibold text-slate-400 transition hover:border-red-400/50 hover:text-red-300"><RotateCcw size={13} />Reiniciar</button>}
        </div>

        <section className="journey-hero relative overflow-hidden rounded-[24px] border p-5 shadow-[0_18px_60px_rgba(0,0,0,.28)] md:p-7">
          <div className="journey-hero-glow" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]"><Rocket size={15} />Painel de evolução</div><h2 className="mt-3 text-xl font-extrabold text-white md:text-2xl">{journeyState?.startedAt ? 'Você está construindo algo grande.' : 'Sua próxima grande conquista começa aqui.'}</h2><p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">{journeyState?.startedAt ? 'Cada trade, cada dia e cada saque registrado alimenta o seu legado.' : 'Ative sua jornada para acompanhar disciplina, escala, objetivos e liberdade financeira em um só lugar.'}</p>{!journeyState?.startedAt && <button onClick={() => void startJourney()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 px-4 py-3 text-xs font-extrabold text-slate-950 shadow-[0_8px_26px_rgba(245,158,11,.2)] transition hover:brightness-110"><Rocket size={16} />Começar minha jornada</button>}</div>
            <div className="journey-progress-ring" style={{ background: `conic-gradient(#D4AF37 ${journeyProgress * 3.6}deg, #2a2412 0deg)` }}><div><strong>{journeyProgress}%</strong><span>concluído</span></div></div>
          </div>
        </section>

        <section className="journey-stats grid grid-cols-1 gap-3 sm:grid-cols-3"><Stat icon={CalendarDays} label="Dias ativos" value={journeyState?.startedAt ? String(metrics.days) : '—'} sub="da jornada" /><Stat icon={Trophy} label="Conquistas" value={String(achievementsUnlocked)} sub={`/ ${achievementsTotal} desbloqueadas`} /><Stat icon={Rocket} label="Início" value={journeyState?.startedAt ? new Date(journeyState.startedAt).toLocaleDateString('pt-BR') : 'Não iniciada'} sub={journeyState?.startedAt ? 'data de início' : 'comece quando quiser'} /></section>

        <section className="relative">
          <div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">O caminho</p><h2 className="mt-1 text-lg font-extrabold text-white">Seus capítulos</h2><p className="mt-1 text-[11px] text-slate-500">Abra cada etapa para acompanhar suas conquistas.</p></div><span className="h-1 w-12 rounded-full bg-gradient-to-r from-[#9c741b] to-[#FFD85A]" /></div>
          <div className="grid grid-cols-2 gap-3">
            {[chapterCards.slice(0, 2), chapterCards.slice(2, 4)].map((row, rowIndex) => {
              const openChapter = row.find((item) => item.id === open);
              return (
                <Fragment key={rowIndex}>
                  {row.map((chapter) => {
                    const Icon = chapter.icon;
                    const isOpen = open === chapter.id;
                    const tone = toneStyle(chapter.color);
                    return (
                      <button key={chapter.id} onClick={() => toggle(chapter.id)} aria-expanded={isOpen} className={`journey-chapter-card w-full overflow-hidden rounded-2xl border bg-gradient-to-b ${tone.bg} p-4 text-left transition-all duration-300 ${isOpen ? `${tone.border} ${tone.glow}` : 'border-[#1c3144] hover:border-[#2a4658]'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="journey-chapter-number" style={{ borderColor: chapter.color === 'emerald' ? 'rgba(52,211,153,.4)' : chapter.color === 'blue' ? 'rgba(56,189,248,.4)' : chapter.color === 'cyan' ? 'rgba(34,211,238,.4)' : 'rgba(252,211,77,.4)' }}><span>{chapter.number}</span></div>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tone.badge}`}><Icon size={18} /></div>
                      </div>
                      <ChevronDown size={18} className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                    <h3 className="mt-3 text-[15px] font-extrabold text-white">{chapter.title}</h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{chapter.description}</p>
                    {chapter.summary}
                  </button>
                    );
                  })}
                  {/* Painel de detalhes: sempre na largura total, logo abaixo da linha do card aberto */}
                  {openChapter && (
                    <div className="journey-chapter-detail col-span-2 rounded-[18px] border border-[#1c3144] bg-[#070f18] p-3 md:p-5">
                      {openChapter.id === 'disciplina' && <div className="space-y-3"><div className="rounded-xl border border-emerald-500/15 bg-[#090d0a] p-3"><div className="flex items-center justify-between text-xs"><span className="text-gray-400">Trades registrados</span><span className="font-semibold text-emerald-400">{metrics.trades} / 100</span></div><ProgressBar current={metrics.trades} target={100} unlocked tone="emerald" /></div>{TRADE_MILESTONES.map((target) => <AchievementRow key={target} label={`${target.toLocaleString('pt-BR')} trades registrados`} current={metrics.trades} target={target} unlocked={unlocked.has(`discipline_trades_${target}`)} icon={Award} date={dates[`discipline_trades_${target}`]} />)}{DAY_MILESTONES.map((target) => <AchievementRow key={target} label={`${target} dias de jornada`} current={metrics.days} target={target} unlocked={unlocked.has(`discipline_days_${target}`)} icon={CalendarDays} date={dates[`discipline_days_${target}`]} />)}</div>}
                      {openChapter.id === 'conquista' && <div className="space-y-3"><div className="rounded-xl border border-blue-500/15 bg-[#090d14] p-3"><p className="text-[10px] uppercase tracking-wider text-gray-500">Capital financiado atual</p><p className="mt-1 text-xl font-bold text-white">US$ {metrics.funded.reduce((sum, account) => sum + Number(account.size.replace('K', '')) * 1000, 0).toLocaleString('en-US')}</p><p className="mt-0.5 text-[10px] text-gray-600">Objetivo: US$ 400.000</p></div>{SCALE_LABELS.map((label, index) => { const isNext = !unlocked.has(SCALE_IDS[index]) && (index === 0 || unlocked.has(SCALE_IDS[index - 1])); return <ScaleStep key={label} index={index} label={label} unlocked={unlocked.has(SCALE_IDS[index])} isNext={isNext} date={dates[SCALE_IDS[index]]} />; })}<div className="rounded-xl border border-[#8b6a1b]/40 bg-[#0d0b06] p-4 text-center"><Crown className="mx-auto text-[#FFD85A]" size={24} /><p className="mt-2 text-[11px] text-[#D8B75A]">Objetivo final</p><p className="mt-0.5 text-base font-bold text-[#FFD85A]">4 × 100K FINANCIADAS</p><p className="mt-1 text-[11px] text-gray-500">US$ 400.000 em capital financiado</p></div></div>}
                      {openChapter.id === 'objetivo' && renderObjective()}
                      {openChapter.id === 'liberdade' && <div className="space-y-3"><div className="rounded-xl border border-amber-500/15 bg-[#110e06] p-3"><div className="flex items-center justify-between text-xs"><span className="text-gray-400">Total recebido em payouts</span><span className="font-semibold text-[#FFD85A]">US$ {metrics.totalPayouts.toLocaleString('en-US')}</span></div><ProgressBar current={metrics.totalPayouts} target={nextPayoutGoal ?? PAYOUT_MILESTONES[PAYOUT_MILESTONES.length - 1]} unlocked tone="amber" />{nextPayoutGoal && <p className="mt-1.5 text-[10px] text-gray-600">Próxima conquista: US$ {nextPayoutGoal.toLocaleString('en-US')}</p>}</div>{PAYOUT_MILESTONES.map((target) => <AchievementRow key={target} label={`US$ ${target.toLocaleString('en-US')}`} current={metrics.totalPayouts} target={target} unlocked={unlocked.has(`freedom_${target}`)} icon={DollarSign} date={dates[`freedom_${target}`]} />)}</div>}
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        </section>

        <div className="flex items-center gap-3 rounded-[20px] border border-[#29292e] bg-[#0c0c0e] px-5 py-4 md:px-6 md:py-5"><span className="text-4xl leading-none text-[#D4AF37]">"</span><p className="text-xs leading-5 text-gray-400 md:text-sm">Grandes carreiras são construídas em operações comuns executadas com excelência.</p><span className="ml-auto hidden text-[#D4AF37] italic md:block">PropControl</span></div>
        {!journeyState?.startedAt && <button onClick={() => void startJourney()} className="flex w-full items-center justify-center gap-3 rounded-[19px] border border-[#9d7417] bg-gradient-to-r from-[#9e7418] via-[#D4A72C] to-[#B98416] px-5 py-4 text-center font-bold text-black shadow-[0_10px_30px_rgba(180,130,25,.18)] transition hover:brightness-110"><Rocket size={20} /><span>Começar minha Jornada</span></button>}
      </div>

      {confirmReset && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#3A3118] bg-[#111113] p-6">
            <RotateCcw className="mb-3 text-amber-400" />
            <h3 className="text-lg font-bold">Reiniciar Jornada?</h3>
            <p className="mt-1 mb-5 text-sm text-gray-500">A data de início e todas as conquistas desbloqueadas serão apagadas. Suas contas, trades e lançamentos financeiros não são afetados.</p>
            <button disabled={resetting} onClick={() => void confirmResetJourney()} className="mb-2 w-full rounded-2xl bg-amber-500 py-3.5 font-bold text-black disabled:opacity-50">{resetting ? 'Reiniciando...' : 'Sim, reiniciar jornada'}</button>
            <button onClick={() => setConfirmReset(false)} className="w-full rounded-2xl bg-[#222225] py-3.5 text-white">Cancelar</button>
          </div>
        </div>
      )}

      {confirmResetObjective && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-3xl border border-cyan-500/20 bg-[#111113] p-6">
            <RotateCcw className="mb-3 text-red-400" />
            <h3 className="text-lg font-bold">Redefinir objetivo?</h3>
            <p className="mt-1 mb-5 text-sm text-gray-500">O objetivo atual será apagado, e você poderá criar um novo do zero. Isso não afeta suas contas, trades ou a data da sua Jornada.</p>
            <button disabled={resettingObjective} onClick={() => void confirmResetObjectiveAction()} className="mb-2 w-full rounded-2xl bg-red-500 py-3.5 font-bold text-white disabled:opacity-50">{resettingObjective ? 'Redefinindo...' : 'Sim, redefinir objetivo'}</button>
            <button onClick={() => setConfirmResetObjective(false)} className="w-full rounded-2xl bg-[#222225] py-3.5 text-white">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
