import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Award,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  Crown,
  DollarSign,
  Flag,
  Lock,
  MapPin,
  Pencil,
  Plus,
  Rocket,
  Save,
  Target,
  Trophy,
  CircleCheck,
} from 'lucide-react';
import { useApp } from '@/store';
import type { JourneyObjectiveType } from '@/types';

const TRADE_MILESTONES = [25, 50, 100, 250, 500, 1000] as const;
const DAY_MILESTONES = [30, 90, 180, 365] as const;
const TEN_K_MILESTONES = [1, 2, 3, 4] as const;
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

function Stat({ icon: Icon, label, value, sub, center = false }: { icon: typeof CalendarDays; label: string; value: string; sub: string; center?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-4 ${center ? 'justify-center text-center' : ''}`}>
      <Icon size={20} className="shrink-0 text-[#D4AF37]" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
        <p className="mt-0.5 truncate text-base font-semibold text-white">{value}</p>
        <p className="text-[10px] text-gray-600">{sub}</p>
      </div>
    </div>
  );
}

function FamilySilhouette() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-[43%] z-10 -translate-x-1/2 -translate-y-1/2 opacity-90 drop-shadow-[0_0_16px_rgba(255,210,75,.55)]" aria-label="Família" role="img">
      <svg width="108" height="78" viewBox="0 0 108 78" fill="none">
        <g fill="#FFE06A">
          <circle cx="30" cy="14" r="8" />
          <circle cx="76" cy="14" r="8" />
          <circle cx="53" cy="21" r="6" />
          <circle cx="42" cy="29" r="4.5" />
          <circle cx="64" cy="29" r="4.5" />
          <path d="M16 66c0-17 6-29 14-29s14 12 14 29H16Z" />
          <path d="M62 66c0-17 6-29 14-29s14 12 14 29H62Z" />
          <path d="M39 66c0-13 5-22 14-22s14 9 14 22H39Z" />
          <path d="M31 66c0-8 4-14 9-14s9 6 9 14H31Z" />
          <path d="M59 66c0-8 4-14 9-14s9 6 9 14H59Z" />
        </g>
      </svg>
    </div>
  );
}

function ProgressBar({ current, target, unlocked }: { current: number; target: number; unlocked: boolean }) {
  const progress = Math.min(100, target > 0 ? (current / target) * 100 : 0);
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#26262a]">
      <div
        className={`h-full rounded-full ${unlocked ? 'bg-gradient-to-r from-[#9c741b] to-[#FFD85A]' : 'bg-[#3b3b40]'}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function AchievementRow({ label, current, target, unlocked, icon: Icon }: { label: string; current: number; target: number; unlocked: boolean; icon: typeof Award }) {
  const progress = Math.min(100, target > 0 ? (current / target) * 100 : 0);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#242428] bg-[#101012] px-3 py-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${unlocked ? 'border-[#D4AF37] bg-[#171208] text-[#D4AF37]' : 'border-[#3b3b40] bg-[#141416] text-gray-600'}`}>
        {unlocked ? <Check size={16} /> : <Lock size={15} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Icon size={14} className={unlocked ? 'text-[#D4AF37]' : 'text-gray-600'} />
            <span className={`truncate text-sm ${unlocked ? 'text-white' : 'text-gray-400'}`}>{label}</span>
          </div>
          <span className={`shrink-0 text-[11px] ${unlocked ? 'text-[#FFD85A]' : 'text-gray-600'}`}>{Math.round(progress)}%</span>
        </div>
        <ProgressBar current={current} target={target} unlocked={unlocked} />
        <p className="mt-1 text-[10px] text-gray-600">{current.toLocaleString('pt-BR')} / {target.toLocaleString('pt-BR')}</p>
      </div>
    </div>
  );
}

function ObjectiveIcon({ icon }: { icon: string }) {
  const value = icon === 'target' ? '🎯' : icon === 'home' ? '🏠' : icon === 'car' ? '🚗' : icon === 'family' ? '👨‍👩‍👧' : icon === 'trophy' ? '🏆' : '🚀';
  return <span aria-hidden="true">{value}</span>;
}

export function Journey() {
  const { accounts, trades, movements, journeyState, startJourney, saveJourneyObjective, completeJourneyObjective, syncJourneyAchievements } = useApp();
  const [open, setOpen] = useState<ChapterId | null>(null);
  const [editingObjective, setEditingObjective] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const [form, setForm] = useState<ObjectiveForm>({ name: '', type: 'financeiro', value: '', progress: '0', deadline: '', icon: 'target', description: '' });

  const startMs = journeyState?.startedAt ?? null;
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
    return { trades: journeyTrades.length, days, funded, totalPayouts, tenK: funded.filter((account) => account.size === '10K').length, count100, scaleDone };
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
  const achievementsTotal = TRADE_MILESTONES.length + DAY_MILESTONES.length + TEN_K_MILESTONES.length + SCALE_LABELS.length + PAYOUT_MILESTONES.length + TEN_K_MILESTONES.length;
  const achievementsUnlocked = (journeyState?.unlockedAchievements ?? []).length;

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

  const toggle = (id: ChapterId) => setOpen((current) => (current === id ? null : id));

  const chapterCards = [
    { id: 'disciplina' as const, number: '01', title: 'Disciplina', description: 'A consistência nasce dos hábitos.', icon: Target, color: 'emerald', progress: `${TRADE_MILESTONES.filter((target) => unlocked.has(`discipline_trades_${target}`)).length + DAY_MILESTONES.filter((target) => unlocked.has(`discipline_days_${target}`)).length}/${TRADE_MILESTONES.length + DAY_MILESTONES.length}` },
    { id: 'conquista' as const, number: '02', title: 'Conquista', description: 'Sua evolução na carreira de mesas proprietárias.', icon: Trophy, color: 'blue', progress: `${TEN_K_MILESTONES.filter((target) => unlocked.has(`tenk_${target}`)).length + SCALE_IDS.filter((id) => unlocked.has(id)).length}/${TEN_K_MILESTONES.length + SCALE_IDS.length}` },
    { id: 'objetivo' as const, number: '03', title: 'Meu Objetivo', description: 'O sonho que dá direção para toda a jornada.', icon: Target, color: 'purple', progress: journeyState?.objective?.completed ? 'Concluído' : journeyState?.objective ? 'Em andamento' : 'Personalizado' },
    { id: 'liberdade' as const, number: '04', title: 'Liberdade', description: 'Transforme consistência em liberdade financeira.', icon: Crown, color: 'amber', progress: `${PAYOUT_MILESTONES.filter((target) => unlocked.has(`freedom_${target}`)).length}/${PAYOUT_MILESTONES.length}` },
  ];

  const cardClass = (color: string) => color === 'emerald' ? 'text-emerald-400 border-emerald-500/20' : color === 'blue' ? 'text-blue-400 border-blue-500/20' : color === 'purple' ? 'text-purple-400 border-purple-500/20' : 'text-amber-400 border-amber-500/20';

  const renderObjective = () => {
    if (!journeyState?.startedAt) return <div className="rounded-xl border border-purple-500/20 bg-[#0d0913] p-4 text-sm text-gray-400">Comece sua Jornada primeiro. O objetivo ficará ligado à sua Jornada oficial.</div>;

    if (editingObjective) {
      return (
        <div className="rounded-xl border border-purple-500/20 bg-[#0d0913] p-4">
          <div className="mb-4 flex items-center gap-3"><Target size={22} className="text-purple-400" /><div><h3 className="font-semibold">{journeyState.objective ? 'Editar objetivo' : 'Criar meu objetivo'}</h3><p className="text-[11px] text-gray-500">Defina algo concreto para acompanhar.</p></div></div>
          <div className="space-y-3">
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nome do objetivo" className="w-full rounded-xl border border-[#35353a] bg-[#08080a] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400" />
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">{OBJECTIVE_TYPES.map((type) => <button key={type.value} type="button" onClick={() => setForm((current) => ({ ...current, type: type.value }))} className={`rounded-xl border px-3 py-2.5 text-xs ${form.type === type.value ? 'border-purple-400 bg-purple-500/10 text-purple-300' : 'border-[#303035] text-gray-400'}`}>{type.label}</button>)}</div>
            <div className="grid grid-cols-2 gap-2"><input type="number" min="0" value={form.value} onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))} placeholder="Valor / meta (opcional)" className="w-full rounded-xl border border-[#35353a] bg-[#08080a] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400" /><input type="number" min="0" value={form.progress} onChange={(event) => setForm((current) => ({ ...current, progress: event.target.value }))} placeholder="Progresso atual" className="w-full rounded-xl border border-[#35353a] bg-[#08080a] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400" /></div>
            <div className="grid grid-cols-2 gap-2"><input type="date" value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} className="w-full rounded-xl border border-[#35353a] bg-[#08080a] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400" /><div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[#35353a] bg-[#08080a] px-2 py-1.5">{ICONS.map((icon) => <button key={icon} type="button" onClick={() => setForm((current) => ({ ...current, icon }))} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${form.icon === icon ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500'}`}><ObjectiveIcon icon={icon} /></button>)}</div></div>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Descrição (opcional)" rows={2} className="w-full resize-none rounded-xl border border-[#35353a] bg-[#08080a] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400" />
            <div className="flex gap-2"><button onClick={() => setEditingObjective(false)} className="flex-1 rounded-xl border border-[#35353a] px-3 py-2.5 text-xs text-gray-300">Cancelar</button><button onClick={submitObjective} disabled={!form.name.trim()} className="flex-1 rounded-xl bg-purple-500 px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-40"><Save size={14} className="mr-1.5 inline" />Salvar</button></div>
          </div>
        </div>
      );
    }

    if (journeyState.objective) {
      const objective = journeyState.objective;
      const progressPercent = objective.value != null && objective.value > 0 ? Math.min(100, (objective.progress / objective.value) * 100) : Math.min(100, objective.progress);
      return (
        <div className="rounded-xl border border-purple-500/20 bg-[#0d0913] p-4">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-wider text-purple-400">{objective.type}</p><div className="mt-1 flex items-center gap-2"><span className="text-xl"><ObjectiveIcon icon={objective.icon} /></span><h3 className="text-base font-semibold">{objective.name}</h3></div>{objective.description && <p className="mt-2 text-xs text-gray-400">{objective.description}</p>}</div><button onClick={beginEditObjective} className="rounded-lg border border-[#35353a] p-2 text-gray-400 hover:text-white"><Pencil size={14} /></button></div>
          <div className="mt-4"><div className="flex justify-between text-[11px] text-gray-400"><span>Progresso</span><span>{objective.value != null ? `${objective.progress} / ${objective.value}` : `${objective.progress}%`}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#292530]"><div className="h-full rounded-full bg-gradient-to-r from-purple-700 to-purple-400" style={{ width: `${progressPercent}%` }} /></div></div>
          {objective.deadline && <p className="mt-3 text-[11px] text-gray-500">Prazo: {new Date(`${objective.deadline}T00:00:00`).toLocaleDateString('pt-BR')}</p>}
          <div className="mt-4 flex gap-2"><button onClick={beginEditObjective} className="flex-1 rounded-xl border border-purple-500/30 px-3 py-2.5 text-xs text-purple-300">Atualizar progresso</button>{!objective.completed && <button onClick={() => void completeJourneyObjective()} className="rounded-xl bg-purple-500 px-3 py-2.5 text-xs font-semibold text-white"><CircleCheck size={14} className="mr-1 inline" />Concluir</button>}</div>
          {objective.completed && <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">Objetivo concluído.</div>}
        </div>
      );
    }

    return <div className="rounded-xl border border-purple-500/20 bg-[#0d0913] p-5 text-center"><Target className="mx-auto text-purple-400" size={30} /><h3 className="mt-2 text-base font-semibold">Qual é o seu próximo sonho?</h3><p className="mt-1 text-xs text-gray-400">Defina um objetivo que faça essa jornada valer a pena.</p><button onClick={beginEditObjective} className="mt-4 rounded-xl bg-purple-500 px-4 py-2.5 text-xs font-semibold text-white"><Plus size={15} className="mr-1.5 inline" />Criar meu objetivo</button></div>;
  };

  return (
    <div className="min-h-screen bg-[#030304] px-3 pb-28 text-white md:px-6">
      <div className="mx-auto max-w-[920px] space-y-4 pt-3 md:pt-6">
        <section className="relative min-h-[320px] overflow-hidden rounded-[25px] border border-[#4e3b18] bg-[#050504] shadow-[0_20px_60px_rgba(0,0,0,.45)] md:min-h-[350px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_57%,rgba(255,190,40,.42),transparent_15%),radial-gradient(circle_at_30%_28%,rgba(145,92,31,.24),transparent_27%),radial-gradient(circle_at_75%_25%,rgba(72,51,29,.28),transparent_25%),linear-gradient(180deg,#11100d_0%,#17120b_45%,#070605_100%)]" />
          <div className="absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(120deg,transparent_15%,rgba(255,221,155,.09)_40%,transparent_65%)]" />
          <div className="absolute left-1/2 top-[48%] h-16 w-16 -translate-x-1/2 rounded-full bg-[#FFD85A]/70 blur-[2px] shadow-[0_0_70px_35px_rgba(255,190,45,.22)]" />
          <FamilySilhouette />
          <div className="relative z-20 px-5 pt-5 text-center"><div className="flex items-center justify-center gap-2"><Crown size={20} className="text-[#D4AF37]" /><h1 className="text-[26px] font-bold tracking-tight">Jornada</h1></div><p className="mt-1 text-sm text-gray-300">Sua evolução, seu legado.</p></div>
          <div className="relative z-20 mt-[115px] px-5 md:mt-[135px]"><div className="flex items-end justify-between"><div><MapPin size={30} className="text-[#FFD85A]" /><p className="mt-1 text-xs font-semibold text-[#FFD85A]">{journeyState?.startedAt ? 'Início' : 'Ainda não iniciada'}</p></div><div className="text-right"><Flag className="ml-auto text-[#FFD85A]" size={30} /><p className="mt-1 text-xs font-semibold text-[#FFD85A]">Liberdade</p></div></div><p className="mt-3 text-center text-sm leading-5 text-gray-200">Você está construindo um futuro,<br />uma <span className="font-semibold text-[#FFD85A]">decisão disciplinada</span> de cada vez.</p></div>
        </section>

        <section className="overflow-hidden rounded-[21px] border border-[#29292d] bg-[#09090a] shadow-[0_10px_30px_rgba(0,0,0,.2)]"><div className="grid grid-cols-3 divide-x divide-[#29292d]"><Stat icon={CalendarDays} label="Dias" value={journeyState?.startedAt ? String(metrics.days) : '—'} sub="da Jornada" /><Stat icon={Trophy} label="Conquistas" value={String(achievementsUnlocked)} sub={`/ ${achievementsTotal}`} center /><Stat icon={Rocket} label="Jornada" value={journeyState?.startedAt ? new Date(journeyState.startedAt).toLocaleDateString('pt-BR') : 'Não iniciada'} sub={journeyState?.startedAt ? 'iniciada em' : 'Comece quando estiver pronto'} /></div></section>

        <section className="relative">
          <div className="mb-3 flex items-center justify-between"><div><h2 className="text-base font-semibold">Seus capítulos</h2><p className="mt-0.5 text-[11px] text-gray-500">Clique em um capítulo para abrir suas conquistas.</p></div><span className="h-0.5 w-8 rounded-full bg-[#D4AF37]" /></div>
          <div className="relative space-y-3">
            <div className="absolute left-5 top-8 bottom-8 w-px bg-gradient-to-b from-[#D4AF37] via-[#6c6c70] to-[#252529]" />
            {chapterCards.map((chapter) => {
              const Icon = chapter.icon;
              const isOpen = open === chapter.id;
              const tone = cardClass(chapter.color);
              return (
                <div key={chapter.id} className="relative pl-10">
                  <div className={`absolute left-0 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border bg-[#101012] ${tone} ${isOpen ? 'shadow-[0_0_20px_rgba(212,175,55,.10)]' : ''}`}><Icon size={18} /></div>
                  <button onClick={() => toggle(chapter.id)} aria-expanded={isOpen} className={`group w-full overflow-hidden rounded-[20px] border bg-gradient-to-r from-[#111113] to-[#0a0a0c] text-left shadow-[0_10px_30px_rgba(0,0,0,.22)] transition-all duration-200 hover:border-[#8d6b20]/70 ${isOpen ? 'border-[#8d6b20]/70' : 'border-[#29292e]'}`}>
                    <div className="flex min-h-[82px] items-center"><div className="flex w-[70px] shrink-0 flex-col items-center justify-center border-r border-[#29292e]"><span className="text-3xl font-light text-[#D4AF37]">{chapter.number}</span><span className="mt-0.5 text-[8px] uppercase tracking-widest text-gray-600">Capítulo</span></div><div className="min-w-0 flex-1 p-3.5 md:p-4"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-base font-semibold text-white md:text-lg">{chapter.title}</h3><p className="mt-0.5 truncate text-[11px] text-gray-500 md:text-xs">{chapter.description}</p></div><div className="flex shrink-0 items-center gap-2"><span className="rounded-full bg-black/40 px-2 py-1 text-[10px] font-bold text-[#D4AF37]">{chapter.progress}</span><ChevronDown size={18} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} /></div></div></div></div>
                  </button>
                  {isOpen && (
                    <div className="mt-2 rounded-[18px] border border-[#29292e] bg-[#0c0c0e] p-3 md:p-4">
                      {chapter.id === 'disciplina' && <div className="space-y-3"><div className="rounded-xl border border-emerald-500/15 bg-[#090d0a] p-3"><div className="flex items-center justify-between text-xs"><span className="text-gray-400">Trades registrados</span><span className="font-semibold text-emerald-400">{metrics.trades} / 100</span></div><ProgressBar current={metrics.trades} target={100} unlocked={metrics.trades >= 100} /></div>{TRADE_MILESTONES.map((target) => <AchievementRow key={target} label={`${target.toLocaleString('pt-BR')} trades registrados`} current={metrics.trades} target={target} unlocked={unlocked.has(`discipline_trades_${target}`)} icon={Award} />)}{DAY_MILESTONES.map((target) => <AchievementRow key={target} label={`${target} dias de jornada`} current={metrics.days} target={target} unlocked={unlocked.has(`discipline_days_${target}`)} icon={CalendarDays} />)}</div>}
                      {chapter.id === 'conquista' && <div className="space-y-3"><div className="rounded-xl border border-blue-500/15 bg-[#090d14] p-3"><p className="text-[10px] uppercase tracking-wider text-gray-500">Capital financiado atual</p><p className="mt-1 text-xl font-bold text-white">US$ {metrics.funded.reduce((sum, account) => sum + Number(account.size.replace('K', '')) * 1000, 0).toLocaleString('en-US')}</p></div><p className="px-1 text-[10px] uppercase tracking-wider text-gray-600">10K e escada de escala</p>{TEN_K_MILESTONES.map((target) => <AchievementRow key={`10k-${target}`} label={`${target} × 10K financiadas`} current={metrics.tenK} target={target} unlocked={unlocked.has(`tenk_${target}`)} icon={Trophy} />)}{SCALE_LABELS.map((label, index) => <AchievementRow key={label} label={`${label} financiada${index > 2 ? 's' : ''}`} current={metrics.scaleDone.slice(0, index + 1).filter(Boolean).length} target={index + 1} unlocked={unlocked.has(SCALE_IDS[index])} icon={Trophy} />)}<div className="rounded-xl border border-[#8b6a1b]/40 bg-[#0d0b06] p-4 text-center"><Crown className="mx-auto text-[#FFD85A]" size={24} /><p className="mt-2 text-[11px] text-[#D8B75A]">Objetivo final</p><p className="mt-0.5 text-base font-bold text-[#FFD85A]">4 × 100K FINANCIADAS</p><p className="mt-1 text-[11px] text-gray-500">US$ 400.000 em capital financiado</p></div></div>}
                      {chapter.id === 'objetivo' && renderObjective()}
                      {chapter.id === 'liberdade' && <div className="space-y-3"><div className="rounded-xl border border-amber-500/15 bg-[#110e06] p-3"><div className="flex items-center justify-between text-xs"><span className="text-gray-400">Total recebido em payouts</span><span className="font-semibold text-[#FFD85A]">US$ {metrics.totalPayouts.toLocaleString('en-US')}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#29261d]"><div className="h-full rounded-full bg-gradient-to-r from-[#9c6f12] to-[#FFD85A]" style={{ width: `${Math.min(100, metrics.totalPayouts / 100000 * 100)}%` }} /></div></div>{PAYOUT_MILESTONES.map((target) => <AchievementRow key={target} label={`US$ ${target.toLocaleString('en-US')}`} current={metrics.totalPayouts} target={target} unlocked={unlocked.has(`freedom_${target}`)} icon={DollarSign} />)}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex items-center gap-3 rounded-[20px] border border-[#29292e] bg-[#0c0c0e] px-5 py-4 md:px-6 md:py-5"><span className="text-4xl leading-none text-[#D4AF37]">“</span><p className="text-xs leading-5 text-gray-400 md:text-sm">Grandes carreiras são construídas em operações comuns executadas com excelência.</p><span className="ml-auto hidden text-[#D4AF37] italic md:block">PropControl</span></div>
        {!journeyState?.startedAt && <button onClick={() => void startJourney()} className="flex w-full items-center justify-center gap-3 rounded-[19px] border border-[#9d7417] bg-gradient-to-r from-[#9e7418] via-[#D4A72C] to-[#B98416] px-5 py-4 text-center font-bold text-black shadow-[0_10px_30px_rgba(180,130,25,.18)] transition hover:brightness-110"><Rocket size={20} /><span>Começar minha Jornada</span></button>}
      </div>
    </div>
  );
}
