import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Brain,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Flame,
  Layers,
  Moon,
  Snowflake,
  Sparkles,
  Sun,
  Sunrise,
  Target,
  TrendingDown,
  Trophy,
  Zap,
} from 'lucide-react';
import { useApp } from '@/store';
import type { Trade } from '@/types';
import { TIMEFRAMES, tradeR } from '@/types';
import { formatSignedCurrency } from '@/dates';

type Shift = 'Manhã' | 'Tarde' | 'Noite/Madrugada';
type Period = 'Todos' | '7 dias' | '30 dias';

/** Nenhum destaque de "melhor/pior" é anunciado com menos que essa quantidade de trades. */
const MIN_SAMPLE = 5;

function shiftOf(ts: number): Shift {
  const h = new Date(ts).getHours();
  if (h >= 6 && h < 12) return 'Manhã';
  if (h >= 12 && h < 18) return 'Tarde';
  return 'Noite/Madrugada';
}

const SHIFT_ICON: Record<Shift, typeof Sun> = {
  Manhã: Sunrise,
  Tarde: Sun,
  'Noite/Madrugada': Moon,
};

const SHIFT_ORDER: Shift[] = ['Manhã', 'Tarde', 'Noite/Madrugada'];

export function Intelligence() {
  const { trades } = useApp();
  const [period, setPeriod] = useState<Period>('Todos');
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [showAllContexts, setShowAllContexts] = useState(false);

  const filteredTrades = useMemo(() => {
    const now = Date.now();
    const cutoff = period === '7 dias' ? now - 7 * 86400000 : period === '30 dias' ? now - 30 * 86400000 : 0;
    return trades.filter((trade) => trade.timestamp >= cutoff);
  }, [trades, period]);

  const stats = useMemo(() => computeStats(filteredTrades), [filteredTrades]);

  return (
    <div className="min-h-full bg-[#070707] px-3 pt-4 pb-28 sm:px-4 md:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
        <header className="relative overflow-hidden rounded-3xl border border-[#4A3A18] bg-gradient-to-br from-[#17130A] via-[#0F0F0E] to-[#090909] p-4 shadow-2xl sm:p-5 md:p-6">
          <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.12),transparent_55%)]" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.08)] sm:h-12 sm:w-12">
                <Brain size={23} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">PropControl</p>
                <h2 className="truncate text-xl font-black tracking-tight text-white sm:text-2xl">INTELIGÊNCIA</h2>
                <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">Entenda onde seu operacional ganha dinheiro.</p>
              </div>
            </div>
            <FilterSelect value={period} options={['Todos', '7 dias', '30 dias']} onChange={(v) => setPeriod(v as Period)} label="Período" />
          </div>
        </header>

        {filteredTrades.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <OverviewCard stats={stats} tradeCount={filteredTrades.length} />

            <div className="grid gap-4 lg:grid-cols-3">
              <PerformanceSection title="ATIVOS" subtitle="Onde seu operacional entrega mais resultado" icon={<Target size={17} />}>
                {(showAllAssets ? stats.assets : stats.assets.slice(0, 4)).map((item, index) => (
                  <RankRow key={String(item.key)} rank={index + 1} label={String(item.key)} value={item.total} r={item.sumR} detail={`${item.count} trades · ${item.winRate}% de acerto`} max={stats.assetMax} />
                ))}
                {stats.assets.length > 4 && <ToggleMoreButton expanded={showAllAssets} onClick={() => setShowAllAssets((v) => !v)} labelMore="Ver todos os ativos" labelLess="Mostrar menos" />}
              </PerformanceSection>

              <PerformanceSection title="HORÁRIOS" subtitle="Quando sua execução é mais consistente" icon={<Clock3 size={17} />}>
                {stats.shifts.map((item) => {
                  const Icon = SHIFT_ICON[item.shift];
                  return <ShiftRow key={item.shift} icon={Icon} shift={item.shift} total={item.total} count={item.count} winRate={item.winRate} r={item.sumR} max={stats.shiftMax} />;
                })}
              </PerformanceSection>

              <PerformanceSection title="CONTEXTOS" subtitle="Quais condições favorecem sua execução" icon={<Zap size={17} />}>
                {(showAllContexts ? stats.contexts : stats.contexts.slice(0, 4)).map((item, index) => (
                  <RankRow key={String(item.key)} rank={index + 1} label={String(item.key)} value={item.total} r={item.sumR} detail={`${item.count} trades · ${item.winRate}% de acerto`} max={stats.contextMax} />
                ))}
                {stats.contexts.length > 4 && <ToggleMoreButton expanded={showAllContexts} onClick={() => setShowAllContexts((v) => !v)} labelMore="Ver todos os contextos" labelLess="Mostrar menos" />}
              </PerformanceSection>
            </div>

            <PerformanceSection title="TIMEFRAMES" subtitle="Em qual período de gráfico você executa melhor" icon={<BarChart3 size={17} />} fullWidth>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                {stats.timeframes.map((item) => <TimeframeTile key={item.timeframe} timeframe={item.timeframe} total={item.total} count={item.count} winRate={item.winRate} r={item.sumR} max={stats.timeframeMax} />)}
              </div>
            </PerformanceSection>

            <section className="rounded-3xl border border-[#3B3018] bg-gradient-to-br from-[#11100D] via-[#0D0D0D] to-[#090909] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]"><TrendingDown size={17} /></div>
                <div>
                  <h3 className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#D4AF37]">LEITURA DO OPERACIONAL</h3>
                  <p className="mt-0.5 text-[10px] text-gray-600">Os extremos do período analisado (mínimo de {MIN_SAMPLE} trades para entrar aqui).</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <HighlightCard type="best" title="Melhor Contexto" label={stats.bestContext?.key} total={stats.bestContext?.total ?? 0} count={stats.bestContext?.count ?? 0} winRate={stats.bestContext?.winRate ?? 0} r={stats.bestContext?.sumR ?? 0} />
                <HighlightCard type="worst" title="Menor Desempenho" label={stats.worstContext?.key} total={stats.worstContext?.total ?? 0} count={stats.worstContext?.count ?? 0} winRate={stats.worstContext?.winRate ?? 0} r={stats.worstContext?.sumR ?? 0} />
              </div>
            </section>

            <PerformanceSection title="COMBINAÇÕES" subtitle={`Cruzando Ativo + Contexto + Timeframe (mínimo de ${MIN_SAMPLE} trades)`} icon={<Layers size={17} />} fullWidth>
              {stats.combos.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#2C2C2C] p-5 text-center text-[11px] text-gray-600">Ainda não há combinações com trades suficientes para aparecer aqui.</p>
              ) : (
                stats.combos.map((item, index) => <ComboRow key={item.key} rank={index + 1} label={item.key} total={item.total} count={item.count} winRate={item.winRate} r={item.sumR} max={stats.comboMax} />)
              )}
            </PerformanceSection>

            <div className="rounded-2xl border border-[#3B3018] bg-gradient-to-br from-[#15120A] to-[#0D0D0D] px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]"><Sparkles size={15} /></div>
                <div className="min-w-0">
                  <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#D4AF37]">CONCLUSÃO</h3>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400 sm:text-xs">{buildConclusion(stats)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#242424] bg-[#0D0D0D] px-4 py-3">
              <div className="flex items-start gap-2 text-[10px] leading-relaxed text-gray-600 sm:text-xs">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-[#D4AF37]" />
                <span>Dados calculados sobre todos os {filteredTrades.length} trades registrados no período selecionado. A Inteligência analisa o seu operacional, não as contas individualmente.</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OverviewCard({ stats, tradeCount }: { stats: ReturnType<typeof computeStats>; tradeCount: number }) {
  const tone = stats.globalTotal > 0 ? 'text-emerald-400' : stats.globalTotal < 0 ? 'text-[#B9404A]' : 'text-gray-100';
  const pfTone = stats.profitFactor >= 1 ? 'text-emerald-400' : 'text-[#B9404A]';
  const rTone = stats.totalR > 0 ? 'text-emerald-400' : stats.totalR < 0 ? 'text-[#B9404A]' : 'text-gray-100';
  const streakTone = stats.streak.type === 'W' ? 'text-emerald-400' : stats.streak.type === 'L' ? 'text-[#B9404A]' : 'text-gray-100';
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#4A3A18] bg-[#0E0E0E] p-4 shadow-xl sm:p-5 md:p-6">
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
      <div className="relative">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]"><CircleDollarSign size={16} /></div>
          <h3 className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#D4AF37]">VISÃO GERAL</h3>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-[#262626] rounded-2xl border border-[#202020] bg-[#0A0A0A] lg:grid-cols-4 lg:divide-y-0">
          <OverviewCell label="Resultado líquido" value={formatSignedCurrency(stats.globalTotal)} valueClass={tone} sub={<span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${stats.globalTotal >= 0 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-[#B9404A]/30 bg-[#B9404A]/10 text-[#B9404A]'}`}>{stats.globalTotal >= 0 ? 'Positivo' : 'Atenção'}</span>} />
          <OverviewCell label="Win Rate" value={`${stats.globalWinRate}%`} sub={<p className="mt-2 text-[9px] text-gray-600">{stats.takes} takes · {stats.stops} stops · {stats.breakEvens} BE</p>} />
          <OverviewCell label="Trades" value={String(tradeCount)} sub={<p className="mt-2 text-[9px] text-gray-600">operações no período</p>} />
          <OverviewCell label="Profit Factor" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} valueClass={pfTone} sub={<p className="mt-2 text-[9px] text-gray-600">lucro bruto / perda bruta</p>} />
        </div>
        <div className="mt-3 grid grid-cols-2 divide-x divide-y divide-[#242424] rounded-2xl border border-[#1C1C1C] bg-[#090909] lg:grid-cols-4 lg:divide-y-0">
          <OverviewCell compact label="Resultado em R" value={`${stats.totalR >= 0 ? '+' : ''}${stats.totalR.toFixed(1)}R`} valueClass={rTone} />
          <OverviewCell compact label="Média de R" value={`${stats.avgR >= 0 ? '+' : ''}${stats.avgR.toFixed(2)}R`} valueClass={rTone} />
          <OverviewCell compact label="Sequência atual" value={stats.streak.count === 0 ? '—' : `${stats.streak.count} ${stats.streak.type === 'W' ? 'wins' : 'losses'}`} valueClass={streakTone} icon={stats.streak.type === 'W' ? <Flame size={13} /> : stats.streak.type === 'L' ? <Snowflake size={13} /> : undefined} />
          <OverviewCell compact label="Melhores sequências" value={`${stats.bestWinStreak}W / ${stats.bestLossStreak}L`} />
        </div>
        <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500 sm:text-xs">
          <span className={`h-2 w-2 rounded-full ${stats.globalTotal >= 0 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.45)]' : 'bg-[#B9404A] shadow-[0_0_10px_rgba(185,64,74,0.45)]'}`} />
          <span>{stats.globalTotal >= 0 ? 'Seu operacional está positivo no período analisado.' : 'Seu operacional está negativo no período analisado.'}</span>
        </div>
      </div>
    </section>
  );
}

function OverviewCell({ label, value, valueClass, sub, compact, icon }: { label: string; value: string; valueClass?: string; sub?: React.ReactNode; compact?: boolean; icon?: React.ReactNode }) {
  return (
    <div className={compact ? 'p-3 sm:p-3.5' : 'min-w-0 p-4 sm:p-5'}>
      <p className="truncate text-[9px] font-bold uppercase tracking-[0.14em] text-gray-600">{label}</p>
      <p className={`mt-1.5 flex items-center gap-1 truncate font-black tabular-nums ${compact ? 'text-[15px] sm:text-[16px]' : 'text-[18px] sm:text-[20px] lg:text-[22px]'} ${valueClass ?? 'text-gray-100'}`}>{icon}{value}</p>
      {sub}
    </div>
  );
}

function FilterSelect({ value, options, onChange, label }: { value: string; options: string[]; onChange: (value: string) => void; label: string }) {
  return (
    <label className="relative block w-full md:w-40">
      <span className="absolute left-3 top-1.5 z-10 text-[8px] font-bold uppercase tracking-wider text-gray-600">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full appearance-none rounded-xl border border-[#2C2C2C] bg-[#0A0A0A] pl-3 pr-8 pt-3 text-xs font-semibold text-gray-200 outline-none transition focus:border-[#D4AF37]/60 focus:ring-1 focus:ring-[#D4AF37]/10">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 bottom-3.5 text-gray-600" />
    </label>
  );
}

function PerformanceSection({ title, subtitle, icon, children, fullWidth }: { title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <section className={`rounded-3xl border border-[#3A301A] bg-gradient-to-b from-[#11110F] to-[#0B0B0B] p-4 shadow-lg sm:p-5 ${fullWidth ? 'w-full' : ''}`}>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">{icon}</div>
        <div className="min-w-0">
          <h3 className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#D4AF37]">{title}</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-gray-600">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function ToggleMoreButton({ expanded, onClick, labelMore, labelLess }: { expanded: boolean; onClick: () => void; labelMore: string; labelLess: string }) {
  return <button onClick={onClick} className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#242424] bg-[#0A0A0A] py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]">{expanded ? labelLess : labelMore}<ChevronDown size={13} className={`transition ${expanded ? 'rotate-180' : ''}`} /></button>;
}

function RelativePnlBar({ value, max }: { value: number; max: number }) {
  const magnitude = Math.min(100, Math.abs(value) / Math.max(1, max) * 100);
  const width = value === 0 ? 0 : Math.max(5, magnitude);
  return (
    <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-[#1B1B1B]">
      <div className="absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-[#777]" />
      {value < 0 && <div className="absolute inset-y-0 right-1/2 rounded-l-full bg-[#B9404A] shadow-[0_0_8px_rgba(185,64,74,0.25)]" style={{ width: `${width / 2}%` }} />}
      {value > 0 && <div className="absolute inset-y-0 left-1/2 rounded-r-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.25)]" style={{ width: `${width / 2}%` }} />}
    </div>
  );
}

function RTag({ r }: { r: number }) {
  return <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${r >= 0 ? 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-400' : 'border-[#B9404A]/25 bg-[#B9404A]/[0.08] text-[#B9404A]'}`}>{r >= 0 ? '+' : ''}{r.toFixed(1)}R</span>;
}

function RankRow({ rank, label, value, r, detail, max }: { rank: number; label: string; value: number; r: number; detail: string; max: number }) {
  const rankClass = rank === 1 ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]' : rank === 2 ? 'border-[#64748B]/40 bg-[#64748B]/10 text-[#CBD5E1]' : 'border-[#334155]/40 bg-[#334155]/10 text-[#94A3B8]';
  return (
    <div className="rounded-2xl border border-[#202020] bg-[#090909] p-3 transition hover:border-[#D4AF37]/20">
      <div className="flex items-start gap-2.5">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[10px] font-black ${rankClass}`}>{String(rank).padStart(2, '0')}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span className="break-words text-[11px] font-black leading-snug text-gray-200">{label}</span>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className={`text-[11px] font-black tabular-nums ${value >= 0 ? 'text-emerald-400' : 'text-[#B9404A]'}`}>{formatSignedCurrency(value)}</span>
              <RTag r={r} />
            </div>
          </div>
          <RelativePnlBar value={value} max={max} />
          <p className="mt-1.5 text-[9px] text-gray-600">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function ShiftRow({ icon: Icon, shift, total, count, winRate, r, max }: { icon: typeof Sun; shift: Shift; total: number; count: number; winRate: number; r: number; max: number }) {
  const label = shift === 'Noite/Madrugada' ? 'Noite / Madrugada' : shift;
  return (
    <div className="rounded-2xl border border-[#202020] bg-[#090909] p-3 transition hover:border-[#D4AF37]/20">
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]"><Icon size={15} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span className="text-[11px] font-black text-gray-200">{label}</span>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className={`text-[11px] font-black tabular-nums ${total >= 0 ? 'text-emerald-400' : 'text-[#B9404A]'}`}>{formatSignedCurrency(total)}</span>
              <RTag r={r} />
            </div>
          </div>
          <RelativePnlBar value={total} max={max} />
          <p className="mt-1.5 text-[9px] text-gray-600">{count} trades · {winRate}% de acerto</p>
        </div>
      </div>
    </div>
  );
}

function TimeframeTile({ timeframe, total, count, winRate, r, max }: { timeframe: string; total: number; count: number; winRate: number; r: number; max: number }) {
  return (
    <div className="rounded-2xl border border-[#202020] bg-[#090909] p-3 text-center transition hover:border-[#D4AF37]/20">
      <p className="text-[13px] font-black text-[#D4AF37]">{timeframe}</p>
      <p className={`mt-1.5 text-[13px] font-black tabular-nums ${total >= 0 ? 'text-emerald-400' : 'text-[#B9404A]'}`}>{count === 0 ? '—' : formatSignedCurrency(total)}</p>
      {count > 0 && <RelativePnlBar value={total} max={max} />}
      <p className="mt-1.5 text-[9px] text-gray-600">{count} trades{count > 0 ? ` · ${winRate}%` : ''}</p>
      {count > 0 && <p className={`mt-0.5 text-[9px] font-bold ${r >= 0 ? 'text-emerald-400' : 'text-[#B9404A]'}`}>{r >= 0 ? '+' : ''}{r.toFixed(1)}R</p>}
    </div>
  );
}

function ComboRow({ rank, label, total, count, winRate, r, max }: { rank: number; label: string; total: number; count: number; winRate: number; r: number; max: number }) {
  return (
    <div className="rounded-2xl border border-[#202020] bg-[#090909] p-3 transition hover:border-[#D4AF37]/20">
      <div className="flex items-start gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#334155]/40 bg-[#334155]/10 text-[10px] font-black text-[#94A3B8]">{String(rank).padStart(2, '0')}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span className="break-words text-[11px] font-black leading-snug text-gray-200">{label}</span>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className={`text-[11px] font-black tabular-nums ${total >= 0 ? 'text-emerald-400' : 'text-[#B9404A]'}`}>{formatSignedCurrency(total)}</span>
              <RTag r={r} />
            </div>
          </div>
          <RelativePnlBar value={total} max={max} />
          <p className="mt-1.5 text-[9px] text-gray-600">{count} trades · {winRate}% de acerto</p>
        </div>
      </div>
    </div>
  );
}

function HighlightCard({ type, title, label, total, count, winRate, r }: { type: 'best' | 'worst'; title: string; label?: string; total: number; count: number; winRate: number; r: number }) {
  const isBad = type === 'worst' && total < 0;
  const border = type === 'best' ? 'border-emerald-500/30' : isBad ? 'border-[#B9404A]/40' : 'border-[#30343A]';
  const iconClass = type === 'best' ? 'bg-emerald-500/10 text-emerald-400' : isBad ? 'bg-[#B9404A]/10 text-[#B9404A]' : 'bg-white/[0.04] text-gray-400';
  return (
    <div className={`rounded-2xl border ${border} bg-[#0A0A0A] p-4 sm:p-5`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          {type === 'best' ? <Trophy size={18} /> : isBad ? <AlertTriangle size={18} /> : <TrendingDown size={18} />}
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-500">{title}</p>
          <p className="mt-1 truncate text-[14px] font-black text-gray-100">{label || 'Sem dados suficientes'}</p>
        </div>
      </div>
      {label && (
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <p className={`text-[20px] font-black tabular-nums ${total >= 0 ? 'text-emerald-400' : 'text-[#B9404A]'}`}>{formatSignedCurrency(total)}</p>
          <div className="flex flex-wrap gap-2 text-[9px] text-gray-500"><span className="rounded-full border border-[#292929] px-2 py-1">{count} trades</span><span className="rounded-full border border-[#292929] px-2 py-1">{winRate}% acerto</span><span className="rounded-full border border-[#292929] px-2 py-1">{r >= 0 ? '+' : ''}{r.toFixed(1)}R</span></div>
        </div>
      )}
      {isBad && <p className="mt-2 text-[9px] font-semibold text-[#B9404A]">Este contexto está gerando prejuízo real.</p>}
      {type === 'worst' && !isBad && label && <p className="mt-2 text-[9px] text-gray-600">Resultado positivo, mas abaixo do melhor contexto.</p>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-[#3A3017] bg-[#0E0E0E] p-10 text-center sm:p-14">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]"><Brain size={25} /></div>
      <h3 className="mt-4 text-base font-black text-gray-200">Inteligência aguardando dados</h3>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-gray-600">Registre seus trades para liberar a análise de ativos, horários, contextos, timeframes e combinações de performance.</p>
    </div>
  );
}

interface GroupStat { key: string; total: number; count: number; wins: number; losses: number; winRate: number; sumR: number; avgR: number; }

function buildGroup(map: Map<string, { total: number; count: number; wins: number; losses: number; sumR: number }>): GroupStat[] {
  return Array.from(map.entries()).map(([key, x]) => {
    const decisive = x.wins + x.losses;
    return { key, total: x.total, count: x.count, wins: x.wins, losses: x.losses, winRate: decisive === 0 ? 0 : Math.round((x.wins / decisive) * 100), sumR: x.sumR, avgR: decisive === 0 ? 0 : x.sumR / decisive };
  }).sort((a, b) => b.total - a.total);
}

function pickHighlight(list: GroupStat[], mode: 'best' | 'worst'): GroupStat | null {
  const eligible = list.filter((x) => x.count >= MIN_SAMPLE);
  if (!eligible.length) return null;
  return mode === 'best' ? eligible[0] : eligible[eligible.length - 1];
}

function computeStreaks(trades: Trade[]) {
  const decisive = [...trades].filter((t) => t.result !== 'BE').sort((a, b) => a.timestamp - b.timestamp);
  let bestWin = 0, bestLoss = 0, runWin = 0, runLoss = 0;
  for (const t of decisive) {
    if (t.result === 'Take') { runWin++; runLoss = 0; bestWin = Math.max(bestWin, runWin); }
    else { runLoss++; runWin = 0; bestLoss = Math.max(bestLoss, runLoss); }
  }
  let count = 0; let type: 'W' | 'L' | null = null;
  for (let i = decisive.length - 1; i >= 0; i--) {
    const isWin = decisive[i].result === 'Take';
    if (type === null) { type = isWin ? 'W' : 'L'; count = 1; }
    else if ((isWin && type === 'W') || (!isWin && type === 'L')) count++;
    else break;
  }
  return { bestWinStreak: bestWin, bestLossStreak: bestLoss, streak: { type, count } };
}

function computeStats(trades: Trade[]) {
  const takes = trades.filter((t) => t.result === 'Take').length;
  const stops = trades.filter((t) => t.result === 'Stop').length;
  const breakEvens = trades.filter((t) => t.result === 'BE').length;
  const decisiveTrades = takes + stops;
  const globalTotal = trades.reduce((sum, t) => sum + t.amount, 0);
  const grossProfit = trades.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss;
  const globalWinRate = decisiveTrades === 0 ? 0 : Math.round((takes / decisiveTrades) * 100);
  const totalR = trades.reduce((sum, t) => sum + tradeR(t), 0);
  const avgR = decisiveTrades === 0 ? 0 : totalR / decisiveTrades;

  const byAsset = new Map<string, { total: number; count: number; wins: number; losses: number; sumR: number }>();
  const byContext = new Map<string, { total: number; count: number; wins: number; losses: number; sumR: number }>();
  const byShift = new Map<Shift, { total: number; count: number; wins: number; losses: number; sumR: number }>();
  const byTimeframe = new Map<string, { total: number; count: number; wins: number; losses: number; sumR: number }>();
  const byCombo = new Map<string, { total: number; count: number; wins: number; losses: number; sumR: number }>();

  const bump = (map: Map<string, { total: number; count: number; wins: number; losses: number; sumR: number }>, key: string, t: Trade) => {
    const cur = map.get(key) || { total: 0, count: 0, wins: 0, losses: 0, sumR: 0 };
    cur.total += t.amount; cur.count += 1; cur.sumR += tradeR(t);
    cur.wins += t.result === 'Take' ? 1 : 0; cur.losses += t.result === 'Stop' ? 1 : 0;
    map.set(key, cur);
  };

  for (const trade of trades) {
    bump(byAsset, trade.asset, trade);
    bump(byContext, trade.context, trade);
    const shift = shiftOf(trade.timestamp);
    const shiftCur = byShift.get(shift) || { total: 0, count: 0, wins: 0, losses: 0, sumR: 0 };
    shiftCur.total += trade.amount; shiftCur.count += 1; shiftCur.sumR += tradeR(trade);
    shiftCur.wins += trade.result === 'Take' ? 1 : 0; shiftCur.losses += trade.result === 'Stop' ? 1 : 0;
    byShift.set(shift, shiftCur);
    bump(byTimeframe, trade.timeframe, trade);
    bump(byCombo, `${trade.asset} · ${trade.context} · ${trade.timeframe}`, trade);
  }

  const assets = buildGroup(byAsset);
  const contexts = buildGroup(byContext);
  const timeframesRaw = buildGroup(byTimeframe);
  const combosAll = buildGroup(byCombo);
  const combos = combosAll.filter((c) => c.count >= MIN_SAMPLE).slice(0, 8);

  const shifts = SHIFT_ORDER.map((shift) => {
    const x = byShift.get(shift) || { total: 0, count: 0, wins: 0, losses: 0, sumR: 0 };
    const decisive = x.wins + x.losses;
    return { shift, total: x.total, count: x.count, wins: x.wins, losses: x.losses, winRate: decisive === 0 ? 0 : Math.round((x.wins / decisive) * 100), sumR: x.sumR, avgR: decisive === 0 ? 0 : x.sumR / decisive };
  });

  const timeframes = TIMEFRAMES.map((tf) => {
    const found = timeframesRaw.find((x) => x.key === tf);
    return found ? { timeframe: tf, total: found.total, count: found.count, winRate: found.winRate, sumR: found.sumR, avgR: found.avgR } : { timeframe: tf, total: 0, count: 0, winRate: 0, sumR: 0, avgR: 0 };
  });

  const bestContext = pickHighlight(contexts, 'best');
  const worstContext = pickHighlight(contexts, 'worst');
  const { bestWinStreak, bestLossStreak, streak } = computeStreaks(trades);

  return {
    takes, stops, breakEvens, globalTotal, grossProfit, grossLoss, profitFactor, globalWinRate, totalR, avgR,
    assets, contexts, shifts, timeframes, combos,
    bestContext, worstContext, bestWinStreak, bestLossStreak, streak,
    assetMax: Math.max(1, ...assets.map((x) => Math.abs(x.total))),
    contextMax: Math.max(1, ...contexts.map((x) => Math.abs(x.total))),
    shiftMax: Math.max(1, ...shifts.map((x) => Math.abs(x.total))),
    timeframeMax: Math.max(1, ...timeframes.map((x) => Math.abs(x.total))),
    comboMax: Math.max(1, ...combos.map((x) => Math.abs(x.total))),
  };
}

function buildConclusion(stats: ReturnType<typeof computeStats>): string {
  if (!stats.bestContext) return `Ainda faltam trades suficientes (mínimo de ${MIN_SAMPLE}) para apontar uma vantagem clara no seu operacional.`;
  const bestShift = [...stats.shifts].filter((s) => s.count > 0).sort((a, b) => b.total - a.total)[0];
  const bestAsset = stats.assets.filter((a) => a.count >= MIN_SAMPLE).sort((a, b) => b.total - a.total)[0];
  let sentence = `Sua maior vantagem atualmente está em ${stats.bestContext.key}`;
  if (bestShift) sentence += `, principalmente no período da ${bestShift.shift}`;
  if (bestAsset) sentence += `, operando ${bestAsset.key}`;
  sentence += '.';
  if (stats.worstContext && stats.worstContext.total < 0) sentence += ` Fique de olho em ${stats.worstContext.key}, que está gerando prejuízo real no período.`;
  return sentence;
}
