import { useState, type ReactNode } from 'react';
import {
  Plus, ShieldCheck, Copy, ChevronRight, X, Building2, Layers,
  Target, TrendingDown, CalendarDays, Sparkles,
  CheckCircle2, DollarSign, Gauge, Lock, Trash2,
} from 'lucide-react';
import { useApp, type PropFirm } from '@/store';
import { ACCOUNT_SIZES, SIZE_VALUES, type AccountSize } from '@/types';
import type { PropFirmConfig, PropPhaseConfig } from '@/propConfig';

const emptyPhase = (phase: number): PropPhaseConfig => ({
  phase,
  name: phase === 1 ? 'Fase 1' : 'Fase 2',
  rules: {
    targetPct: phase === 1 ? 6 : 0,
    drawdownType: 'Estático',
    consistencyEnabled: false,
    profitableDaysEnabled: false,
    cushionEnabled: false,
  },
});

function formatSize(s: AccountSize) {
  return `$${SIZE_VALUES[s].toLocaleString('en-US')}`;
}

const FIRM_ACCENTS = [
  { from: '#D4AF37', to: '#9E7D19', glow: 'rgba(212,175,55,0.18)', soft: 'rgba(212,175,55,0.08)' },
  { from: '#3B82F6', to: '#1D4ED8', glow: 'rgba(59,130,246,0.18)', soft: 'rgba(59,130,246,0.08)' },
  { from: '#10B981', to: '#059669', glow: 'rgba(16,185,129,0.18)', soft: 'rgba(16,185,129,0.08)' },
  { from: '#F59E0B', to: '#D97706', glow: 'rgba(245,158,11,0.18)', soft: 'rgba(245,158,11,0.08)' },
  { from: '#06B6D4', to: '#0891B2', glow: 'rgba(6,182,212,0.18)', soft: 'rgba(6,182,212,0.08)' },
  { from: '#EF4444', to: '#DC2626', glow: 'rgba(239,68,68,0.18)', soft: 'rgba(239,68,68,0.08)' },
];

function accentFor(index: number) {
  return FIRM_ACCENTS[index % FIRM_ACCENTS.length];
}

function mergePrograms(firm: PropFirm) {
  const map = new Map<string, { id: string; name: string; sizes: AccountSize[]; phases: typeof firm.programs[0]['phases'] }>();
  for (const p of firm.programs) {
    const existing = map.get(p.name);
    if (existing) {
      for (const s of p.sizes) if (!existing.sizes.includes(s)) existing.sizes.push(s);
      if (p.phases.length > existing.phases.length) existing.phases = p.phases;
    } else {
      map.set(p.name, { id: p.id, name: p.name, sizes: [...p.sizes], phases: p.phases });
    }
  }
  return Array.from(map.values());
}

function FirmMedal({ accent, isOfficial }: { accent: typeof FIRM_ACCENTS[0]; isOfficial: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`medal-${accent.from}`} x1="24" y1="8" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor={accent.from} />
          <stop offset="0.5" stopColor={accent.from} />
          <stop offset="1" stopColor={accent.to} />
        </linearGradient>
        <radialGradient id={`shine-${accent.from}`} cx="0.35" cy="0.3" r="0.6">
          <stop stopColor="rgba(255,255,255,0.45)" />
          <stop offset="0.6" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <path d="M16 4 L16 16 M32 4 L32 16" stroke={accent.from} strokeWidth="3.5" strokeLinecap="round" opacity="0.55" />
      <path d="M16 4 Q24 14 32 4" stroke={accent.from} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />
      <circle cx="24" cy="28" r="13" fill={`url(#medal-${accent.from})`} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <circle cx="24" cy="28" r="13" fill={`url(#shine-${accent.from})`} />
      <circle cx="24" cy="28" r="8.5" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
      <circle cx="24" cy="28" r="6.5" fill="rgba(0,0,0,0.12)" />
      {isOfficial ? (
        <path d="M24 22 L25.5 26 L29.5 26 L26.5 28.5 L27.5 32.5 L24 30 L20.5 32.5 L21.5 28.5 L18.5 26 L22.5 26 Z" fill="rgba(255,255,255,0.85)" />
      ) : (
        <path d="M20.5 27 L23 29.5 L28 24.5" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}
    </svg>
  );
}

const SIZE_COLORS: Record<AccountSize, { bg: string; text: string; border: string }> = {
  '10K': { bg: 'rgba(37,99,235,0.12)', text: '#60a5fa', border: 'rgba(37,99,235,0.3)' },
  '25K': { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  '50K': { bg: 'rgba(168,85,247,0.12)', text: '#c084fc', border: 'rgba(168,85,247,0.3)' },
  '100K': { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  '150K': { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
  '200K': { bg: 'rgba(6,182,212,0.12)', text: '#22d3ee', border: 'rgba(6,182,212,0.3)' },
};

export function ProprietaryFirms() {
  const { propFirms, createPropFirm, deleteFirm, accounts } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [program, setProgram] = useState('');
  const [sizes, setSizes] = useState<AccountSize[]>(['25K']);
  const [phaseCount, setPhaseCount] = useState(1);
  const [phases, setPhases] = useState<PropPhaseConfig[]>([emptyPhase(1)]);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [confirmDeleteFirm, setConfirmDeleteFirm] = useState<PropFirm | null>(null);
  const [deletingFirm, setDeletingFirm] = useState(false);
  const [deleteFirmError, setDeleteFirmError] = useState('');

  const reset = () => {
    setName(''); setProgram(''); setSizes(['25K']); setPhaseCount(1);
    setPhases([emptyPhase(1)]); setSaveError(''); setOpen(false);
  };

  const updatePhase = (index: number, patch: Partial<PropPhaseConfig['rules']>) =>
    setPhases(prev => prev.map((p, i) => i === index ? { ...p, rules: { ...p.rules, ...patch } } : p));

  const phasesValid = phases.every(p => Number(p.rules.targetPct) > 0 && Number(p.rules.maxDrawdown) > 0);

  const save = async () => {
    if (!name.trim() || !program.trim() || !sizes.length || !phasesValid) return;
    setBusy(true); setSaveError('');
    try {
      const result = await createPropFirm({
        name: name.trim(), official: false,
        programs: [{ name: program.trim(), sizes, phases }],
      });
      if (!result.ok) {
        setSaveError(`Não foi possível salvar a mesa. ${result.error || 'Verifique a conexão.'}`);
        return;
      }
      reset();
    } finally { setBusy(false); }
  };

  const duplicate = (firm: PropFirm) => {
    const p = firm.programs[0];
    if (!p) return;
    setName(`${firm.name} Personalizada`);
    setProgram(`${p.name} Personalizado`);
    setSizes(p.sizes);
    setPhaseCount(p.phases.length);
    setPhases(p.phases.map(x => ({ ...x, rules: { ...x.rules } })));
    setOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteFirm) return;
    setDeletingFirm(true);
    setDeleteFirmError('');
    const result = await deleteFirm(confirmDeleteFirm.id);
    setDeletingFirm(false);
    if (!result.ok) {
      setDeleteFirmError(`Não foi possível excluir a mesa. ${result.error || 'Verifique a conexão.'}`);
      return;
    }
    setConfirmDeleteFirm(null);
  };

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: 'linear-gradient(135deg,#D4AF37,#9E7D19)' }}>
              <Building2 size={16} className="text-black" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em]" style={{ color: '#D4AF37' }}>Configuração</p>
          </div>
          <h1 className="mt-2 text-2xl font-black text-white">Mesas Proprietárias</h1>
          <p className="mt-1 text-sm text-gray-500">Configure as regras que alimentam o controle das suas contas.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))',
            border: '1px solid rgba(212,175,55,0.35)',
            color: '#D4AF37',
            boxShadow: '0 0 20px rgba(212,175,55,0.08)',
          }}
        >
          <Plus size={17} className="transition-transform group-hover:rotate-90" />
          Nova mesa
        </button>
      </div>

      {/* Firm cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {propFirms.map((firm, idx) => {
          const accent = accentFor(idx);
          return (
            <div
              key={firm.id}
              className="group relative overflow-hidden rounded-3xl border p-5 transition-all duration-300 hover:scale-[1.01]"
              style={{
                borderColor: 'rgba(255,255,255,0.07)',
                background: `linear-gradient(160deg, ${accent.soft} 0%, #111214 40%, #111214 100%)`,
              }}
            >
              {/* Glow on hover */}
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: accent.glow }}
              />

              {/* Card header */}
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                      boxShadow: `0 4px 20px ${accent.glow}`,
                    }}
                  >
                    {firm.isOfficial ? <FirmMedal accent={accent} isOfficial /> : <ShieldCheck size={22} className="text-white" />}
                  </div>
                  <div>
                    <h2 className="font-black text-white">{firm.name}</h2>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          background: firm.isOfficial ? accent.soft : 'rgba(255,255,255,0.04)',
                          color: firm.isOfficial ? accent.from : '#9CA3AF',
                        }}
                      >
                        {firm.isOfficial ? <Sparkles size={10} /> : <Lock size={10} />}
                        {firm.isOfficial ? 'Pré-cadastrada' : 'Personalizada'}
                      </span>
                    </div>
                  </div>
                </div>
                {!firm.isOfficial && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => duplicate(firm)}
                      title="Duplicar"
                      className="rounded-xl p-2 text-gray-500 transition-all hover:bg-white/[0.06] hover:text-[#D4AF37] active:scale-90"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => { setConfirmDeleteFirm(firm); setDeleteFirmError(''); }}
                      title="Excluir"
                      className="rounded-xl p-2 text-gray-500 transition-all hover:bg-red-500/[0.08] hover:text-red-400 active:scale-90"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Programs */}
              <div className="relative mt-4 space-y-2">
                {mergePrograms(firm).map(p => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-white/[0.05] bg-black/20 p-3.5 transition-colors hover:border-white/[0.1]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers size={13} style={{ color: accent.from }} />
                        <span className="text-sm font-bold text-gray-200">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: accent.soft, color: accent.from }}
                        >
                          {p.phases.length} {p.phases.length === 1 ? 'fase' : 'fases'}
                        </span>
                      </div>
                    </div>
                    {/* Size badges */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {p.sizes.map(s => {
                        const sc = SIZE_COLORS[s] ?? { bg: 'rgba(255,255,255,0.04)', text: '#9CA3AF', border: 'rgba(255,255,255,0.08)' };
                        return (
                          <span
                            key={s}
                            className="rounded-lg px-2.5 py-1 text-[10px] font-bold"
                            style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                          >
                            {s}
                          </span>
                        );
                      })}
                    </div>
                    {/* Phase quick info */}
                    {p.phases.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                        {p.phases.map(ph => (
                          <div key={ph.phase} className="flex items-center gap-1.5">
                            <div
                              className="grid h-5 w-5 place-items-center rounded-md text-[9px] font-black"
                              style={{ background: accent.soft, color: accent.from }}
                            >
                              {ph.phase}
                            </div>
                            <span className="text-[10px] text-gray-500">
                              {ph.rules.targetPct ? `Meta ${ph.rules.targetPct}%` : 'Sem meta'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: nova mesa */}
      {open && (
        <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#3A321B] bg-[#0D0D10] p-5 shadow-2xl animate-scale-in">
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-10 w-10 place-items-center rounded-xl"
                  style={{ background: 'linear-gradient(135deg,#D4AF37,#9E7D19)' }}
                >
                  <Plus size={18} className="text-black" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em]" style={{ color: '#D4AF37' }}>Nova mesa</p>
                  <h2 className="mt-0.5 text-xl font-black text-white">Cadastrar mesa</h2>
                </div>
              </div>
              <button onClick={reset} className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Name + Program */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome da mesa" icon={<Building2 size={11} />}>
                  <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: FTMO" />
                </Field>
                <Field label="Nome do programa" icon={<Layers size={11} />}>
                  <input className="input" value={program} onChange={e => setProgram(e.target.value)} placeholder="Ex: Challenge" />
                </Field>
              </div>

              {/* Sizes */}
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <DollarSign size={11} className="text-gray-500" />
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Tamanhos disponíveis</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ACCOUNT_SIZES.map(s => {
                    const sc = SIZE_COLORS[s] ?? { bg: 'rgba(255,255,255,0.02)', text: '#9CA3AF', border: 'rgba(255,255,255,0.07)' };
                    const selected = sizes.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => setSizes(v => v.includes(s) ? v.filter(x => x !== s) : [...v, s])}
                        className="rounded-xl border p-3 text-left transition-all active:scale-95"
                        style={{
                          borderColor: selected ? sc.border : 'rgba(255,255,255,0.07)',
                          background: selected ? sc.bg : 'rgba(255,255,255,0.02)',
                          color: selected ? sc.text : '#9CA3AF',
                        }}
                      >
                        <b className="text-sm">{s}</b>
                        <span className="mt-1 block text-[10px] opacity-60">{formatSize(s)}</span>
                      </button>
                    );
                  })}
                </div>
                {sizes.length > 1 && (
                  <p className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-500/80">
                    <Gauge size={11} /> Atenção: o drawdown e a perda diária definidos abaixo valem igual para todos os tamanhos marcados.
                  </p>
                )}
              </div>

              {/* Phase count */}
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <Layers size={11} className="text-gray-500" />
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Quantidade de fases</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map(n => (
                    <button
                      key={n}
                      onClick={() => {
                        setPhaseCount(n);
                        setPhases(prev => Array.from({ length: n }, (_, i) => prev[i] || emptyPhase(i + 1)));
                      }}
                      className="rounded-xl border p-3 text-sm font-bold transition-all active:scale-95"
                      style={{
                        borderColor: phaseCount === n ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.07)',
                        background: phaseCount === n ? 'rgba(212,175,55,0.07)' : 'transparent',
                        color: phaseCount === n ? '#D4AF37' : '#9CA3AF',
                      }}
                    >
                      {n} {n === 1 ? 'fase' : 'fases'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phase configs */}
              {phases.map((phase, i) => {
                const accent = accentFor(i);
                return (
                  <div key={phase.phase} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="grid h-8 w-8 place-items-center rounded-lg text-xs font-black"
                          style={{ background: accent.soft, color: accent.from }}
                        >
                          {phase.phase}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent.from }}>Fase {phase.phase}</span>
                          <input
                            className="mt-0.5 block bg-transparent text-sm font-black text-white outline-none"
                            value={phase.name}
                            onChange={e => setPhases(v => v.map((p, j) => j === i ? { ...p, name: e.target.value } : p))}
                          />
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-700" />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Meta (%) *" icon={<Target size={11} />}>
                        <input type="number" className="input" value={phase.rules.targetPct ?? ''} onChange={e => updatePhase(i, { targetPct: Number(e.target.value) })} />
                      </Field>
                      <Field label="Drawdown" icon={<TrendingDown size={11} />}>
                        <select className="input" value={phase.rules.drawdownType ?? 'Estático'} onChange={e => updatePhase(i, { drawdownType: e.target.value as 'Estático' | 'EOD' })}>
                          <option>Estático</option>
                          <option>EOD</option>
                        </select>
                      </Field>
                      <Field label="Drawdown máximo ($) *">
                        <input type="number" className="input" value={phase.rules.maxDrawdown ?? ''} onChange={e => updatePhase(i, { maxDrawdown: Number(e.target.value) })} />
                      </Field>
                      <Field label="Perda diária ($)" icon={<CalendarDays size={11} />}>
                        <input type="number" className="input" value={phase.rules.dailyLoss ?? ''} onChange={e => updatePhase(i, { dailyLoss: Number(e.target.value) })} />
                      </Field>
                    </div>

                    {!(Number(phase.rules.targetPct) > 0 && Number(phase.rules.maxDrawdown) > 0) && (
                      <p className="mt-2 text-[10px] text-red-400">Meta (%) e Drawdown máximo ($) são obrigatórios e devem ser maiores que zero.</p>
                    )}

                    <Toggle label="Regra de consistência" icon={<CheckCircle2 size={12} />} value={!!phase.rules.consistencyEnabled} onChange={v => updatePhase(i, { consistencyEnabled: v })} />
                    {phase.rules.consistencyEnabled && (
                      <Field label="Limite de consistência (%)">
                        <input type="number" className="input" value={phase.rules.consistencyPct ?? ''} onChange={e => updatePhase(i, { consistencyPct: Number(e.target.value) })} />
                      </Field>
                    )}

                    <Toggle label="Dias mínimos lucrativos" icon={<CalendarDays size={12} />} value={!!phase.rules.profitableDaysEnabled} onChange={v => updatePhase(i, { profitableDaysEnabled: v })} />
                    {phase.rules.profitableDaysEnabled && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Quantidade de dias">
                          <input type="number" className="input" value={phase.rules.profitableDays ?? ''} onChange={e => updatePhase(i, { profitableDays: Number(e.target.value) })} />
                        </Field>
                        <Field label="Lucro mínimo por dia (%)">
                          <input type="number" step="0.1" className="input" value={phase.rules.profitableDayPct ?? ''} onChange={e => updatePhase(i, { profitableDayPct: Number(e.target.value) })} />
                        </Field>
                      </div>
                    )}

                    <Toggle label="Exige colchão" icon={<ShieldCheck size={12} />} value={!!phase.rules.cushionEnabled} onChange={v => updatePhase(i, { cushionEnabled: v })} />
                    {phase.rules.cushionEnabled && (
                      <Field label="Valor do colchão ($)">
                        <input type="number" className="input" value={phase.rules.cushion ?? ''} onChange={e => updatePhase(i, { cushion: Number(e.target.value) })} />
                      </Field>
                    )}
                  </div>
                );
              })}

              {saveError && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">{saveError}</p>
              )}

              <button
                disabled={busy || !name.trim() || !program.trim() || !sizes.length || !phasesValid}
                onClick={save}
                className="group w-full rounded-2xl py-3.5 font-black text-[#0B0B0D] transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
                style={{ background: 'linear-gradient(90deg, #C8960C 0%, #D4AF37 50%, #B8860B 100%)' }}
              >
                <span className="flex items-center justify-center gap-2">
                  {busy ? 'Salvando...' : 'Salvar mesa'}
                  {!busy && <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar exclusão de mesa */}
      {confirmDeleteFirm && (
        <div className="fixed inset-0 z-[10001] grid place-items-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-[#111113] p-6">
            {(() => {
              const inUse = accounts.filter(a => a.firmId === confirmDeleteFirm.id).length;
              return (
                <>
                  <Trash2 size={22} className="mb-3 text-red-400" />
                  <h3 className="text-lg font-bold text-white">Excluir "{confirmDeleteFirm.name}"?</h3>
                  <p className="mt-1 mb-1 text-sm text-gray-500">Essa mesa e seus programas serão apagados permanentemente.</p>
                  {inUse > 0 && (
                    <p className="mt-2 mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300">
                      {inUse} conta{inUse > 1 ? 's' : ''} ainda {inUse > 1 ? 'estão vinculadas' : 'está vinculada'} a essa mesa. Elas não serão apagadas, mas vão ficar sem uma mesa configurada.
                    </p>
                  )}
                  {deleteFirmError && <p className="mt-2 mb-2 text-xs text-red-400">{deleteFirmError}</p>}
                  <button disabled={deletingFirm} onClick={confirmDelete} className="mt-3 w-full rounded-2xl bg-red-500 py-3.5 font-bold text-white disabled:opacity-50">
                    {deletingFirm ? 'Excluindo...' : 'Sim, excluir mesa'}
                  </button>
                  <button onClick={() => setConfirmDeleteFirm(null)} className="mt-2 w-full rounded-2xl bg-[#222225] py-3.5 text-white">Cancelar</button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, children, icon }: { label: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({ label, value, onChange, icon }: { label: string; value: boolean; onChange: (v: boolean) => void; icon?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/[0.05] px-3 py-2.5 text-left transition-colors hover:border-white/[0.1]"
    >
      <span className="flex items-center gap-2 text-xs font-semibold text-gray-400">
        {icon}
        {label}
      </span>
      <span
        className="relative h-5 w-9 rounded-full p-0.5 transition-colors duration-300"
        style={{ background: value ? '#D4AF37' : '#374151' }}
      >
        <span
          className="block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300"
          style={{ transform: value ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </span>
    </button>
  );
}
