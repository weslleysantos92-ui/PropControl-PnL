import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Sunrise,
  Target,
  TrendingDown,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '@/store';
import type { Asset, Context, Trade } from '@/types';
import { formatSignedCurrency } from '@/dates';

type Shift = 'Manhã' | 'Tarde' | 'Noite/Madrugada';
type Period = 'Todos' | '7 dias' | '30 dias';

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
                {stats.assets.map((item, index) => (
                  <RankRow key={String(item.asset)} rank={index + 1} label={String(item.asset)} value={item.total} detail={`${item.count} trades · ${item.winRate}% de acerto`} max={stats.assetMax} />
                ))}
              </PerformanceSection>

              <PerformanceSection title="HORÁRIOS" subtitle="Quando sua execução é mais consistente" icon={<Clock3 size={17} />}>
                {stats.shifts.map((item) => {
                  const Icon = SHIFT_ICON[item.shift];
                  return <ShiftRow key={item.shift} icon={Icon} shift={item.shift} total={item.total} count={item.count} winRate={item.winRate} max={stats.shiftMax} />;
                })}
              </PerformanceSection>

              <PerformanceSection title="CONTEXTOS" subtitle="Quais condições favorecem sua execução" icon={<Zap size={17} />}>
                {stats.contexts.map((item, index) => (
                  <ContextRow key={String(item.context)} rank={index + 1} context={String(item.context)} total={item.total} count={item.count} winRate={item.winRate} max={stats.contextMax} />
                ))}
              </PerformanceSection>
            </div>

            <section className="rounded-3xl border border-[#3B3018] bg-gradient-to-br from-[#11100D] via-[#0D0D0D] to-[#090909] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]"><TrendingDown size={17} /></div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#D4AF37]">LEITURA DO OPERACIONAL</h3>
                  <p className="mt-0.5 text-[10px] text-gray-600">Os extremos do período analisado.</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <HighlightCard type="best" title="Melhor Contexto" context={stats.bestContext?.context} total={stats.bestContext?.total ?? 0} count={stats.bestContext?.count ?? 0} winRate={stats.bestContext?.winRate ?? 0} />
                <HighlightCard type="worst" title="Menor Desempenho" context={stats.worstContext?.context} total={stats.worstContext?.total ?? 0} count={stats.worstContext?.count ?? 0} winRate={stats.worstContext?.winRate ?? 0} />
              </div>
            </section>

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
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#4A3A18] bg-[#0E0E0E] p-4 shadow-xl sm:p-5 md:p-6">
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
      <div className="relative">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]"><CircleDollarSign size={16} /></div>
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#D4AF37]">VISÃO GERAL</h3>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-[#262626] rounded-2xl border border-[#202020] bg-[#0A0A0A] md:grid-cols-4 md:divide-y-0">
          <div className="p-4 sm:p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-600">Resultado líquido</p>
            <p className={`mt-2 text-xl font-black tabular-nums sm:text-2xl md:text-3xl ${tone}`}>{formatSignedCurrency(stats.globalTotal)}</p>
            <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${stats.globalTotal >= 0 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-[#B9404A]/30 bg-[#B9404A]/10 text-[#B9404A]'}`}>{stats.globalTotal >= 0 ? 'Positivo' : 'Atenção'}</span>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-600">Win Rate</p>
            <p className="mt-2 text-xl font-black tabular-nums text-gray-100 sm:text-2xl md:text-3xl">{stats.globalWinRate}%</p>
            <p className="mt-2 text-[9px] text-gray-600">{stats.takes} takes · {stats.stops} stops · {stats.breakEvens} BE</p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-600">Trades</p>
            <p className="mt-2 text-xl font-black tabular-nums text-gray-100 sm:text-2xl md:text-3xl">{tradeCount}</p>
            <p className="mt-2 text-[9px] text-gray-600">operações no período</p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-600">Profit Factor</p>
            <p className={`mt-2 text-xl font-black tabular-nums sm:text-2xl md:text-3xl ${pfTone}`}>{stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}</p>
            <p className="mt-2 text-[9px] text-gray-600">lucro bruto / perda bruta</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500 sm:text-xs">
          <span className={`h-2 w-2 rounded-full ${stats.globalTotal >= 0 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.45)]' : 'bg-[#B9404A] shadow-[0_0_10px_rgba(185,64,74,0.45)]'}`} />
          <span>{stats.globalTotal >= 0 ? 'Seu operacional está positivo no período analisado.' : 'Seu operacional está negativo no período analisado.'}</span>
        </div>
      </div>
    </section>
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

function PerformanceSection({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-[#3A301A] bg-gradient-to-b from-[#11110F] to-[#0B0B0B] p-4 shadow-lg sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">{icon}</div>
        <div className="min-w-0">
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#D4AF37]">{title}</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-gray-600">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
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

function RankRow({ rank, label, value, detail, max }: { rank: number; label: string; value: number; detail: string; max: number }) {
  const rankClass = rank === 1 ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]' : rank === 2 ? 'border-[#64748B]/40 bg-[#64748B]/10 text-[#CBD5E1]' : 'border-[#334155]/40 bg-[#334155]/10 text-[#94A3B8]';
  return (
    <div className="rounded-2xl border border-[#202020] bg-[#090909] p-3 transition hover:border-[#D4AF37]/20">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[10px] font-black ${rankClass}`}>{String(rank).padStart(2, '0')}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-black text-gray-200">{label}</span>
            <span className={`shrink-0 text-xs font-black tabular-nums ${value >= 0 ? 'text-emerald-400' : 'text-[#B9404A]'}`}>{formatSignedCurrency(value)}</span>
          </div>
          <RelativePnlBar value={value} max={max} />
          <p className="mt-1.5 text-[9px] text-gray-600">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function ShiftRow({ icon: Icon, shift, total, count, winRate, max }: { icon: typeof Sun; shift: Shift; total: number; count: number; winRate: number; max: number }) {
  const label = shift === 'Noite/Madrugada' ? 'Noite / Madrugada' : shift;
  return (
    <div className="rounded-2xl border border-[#202020] bg-[#090909] p-3 transition hover:border-[#D4AF37]/20">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]"><Icon size={15} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2"><span className="text-xs font-black text-gray-200">{label}</span><span className={`shrink-0 text-xs font-black tabular-nums ${total >= 0 ? 'text-emerald-400' : 'text-[#B9404A]'}`}>{formatSignedCurrency(total)}</span></div>
          <RelativePnlBar value={total} max={max} />
          <p className="mt-1.5 text-[9px] text-gray-600">{count} trades · {winRate}% de acerto</p>
        </div>
      </div>
    </div>
  );
}

function ContextRow({ rank, context, total, count, winRate, max }: { rank: number; context: string; total: number; count: number; winRate: number; max: number }) {
  return (
    <div className="rounded-2xl border border-[#202020] bg-[#090909] p-3 transition hover:border-[#D4AF37]/20">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#2B2B2B] bg-[#121212] text-[10px] font-black text-[#D4AF37]">{String(rank).padStart(2, '0')}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-black text-gray-200">{context}</span><span className={`shrink-0 text-xs font-black tabular-nums ${total >= 0 ? 'text-emerald-400' : 'text-[#B9404A]'}`}>{formatSignedCurrency(total)}</span></div>
          <RelativePnlBar value={total} max={max} />
          <div className="mt-1.5 flex justify-between gap-2 text-[9px] text-gray-600"><span>{count} trades</span><span>{winRate}% de acerto</span></div>
        </div>
      </div>
    </div>
  );
}

function HighlightCard({ type, title, context, total, count, winRate }: { type: 'best' | 'worst'; title: string; context?: string; total: number; count: number; winRate: number }) {
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
          <p className="mt-1 truncate text-sm font-black text-gray-100">{context || 'Sem dados suficientes'}</p>
        </div>
      </div>
      {context && (
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <p className={`text-2xl font-black tabular-nums ${total >= 0 ? 'text-emerald-400' : 'text-[#B9404A]'}`}>{formatSignedCurrency(total)}</p>
          <div className="flex gap-2 text-[9px] text-gray-500"><span className="rounded-full border border-[#292929] px-2 py-1">{count} trades</span><span className="rounded-full border border-[#292929] px-2 py-1">{winRate}% acerto</span></div>
        </div>
      )}
      {isBad && <p className="mt-2 text-[9px] font-semibold text-[#B9404A]">Este contexto está gerando prejuízo real.</p>}
      {type === 'worst' && !isBad && context && <p className="mt-2 text-[9px] text-gray-600">Resultado positivo, mas abaixo do melhor contexto.</p>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-[#3A3017] bg-[#0E0E0E] p-10 text-center sm:p-14">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]"><Brain size={25} /></div>
      <h3 className="mt-4 text-base font-black text-gray-200">Inteligência aguardando dados</h3>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-gray-600">Registre seus trades para liberar a análise de ativos, horários, contextos e métricas de performance.</p>
    </div>
  );
}

interface AssetStat { asset: Asset; total: number; count: number; wins: number; losses: number; winRate: number; }
interface ContextStat { context: Context; total: number; count: number; wins: number; losses: number; winRate: number; }
interface ShiftStat { shift: Shift; total: number; count: number; wins: number; losses: number; winRate: number; }

function computeStats(trades: Trade[]) {
  const takes = trades.filter((t) => t.result === 'Take').length;
  const stops = trades.filter((t) => t.result === 'Stop').length;
  const breakEvens = trades.filter((t) => t.result === 'Break Even' || t.result === 'BE').length;
  const decisiveTrades = takes + stops;
  const globalTotal = trades.reduce((sum, t) => sum + t.amount, 0);
  const grossProfit = trades.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss;
  const globalWinRate = decisiveTrades === 0 ? 0 : Math.round((takes / decisiveTrades) * 100);

  const byAsset = new Map<Asset, { total: number; count: number; wins: number; losses: number }>();
  const byContext = new Map<Context, { total: number; count: number; wins: number; losses: number }>();
  const byShift = new Map<Shift, { total: number; count: number; wins: number; losses: number }>();

  for (const trade of trades) {
    const asset = byAsset.get(trade.asset) || { total: 0, count: 0, wins: 0, losses: 0 };
    asset.total += trade.amount;
    asset.count += 1;
    asset.wins += trade.result === 'Take' ? 1 : 0;
    asset.losses += trade.result === 'Stop' ? 1 : 0;
    byAsset.set(trade.asset, asset);

    const context = byContext.get(trade.context) || { total: 0, count: 0, wins: 0, losses: 0 };
    context.total += trade.amount;
    context.count += 1;
    context.wins += trade.result === 'Take' ? 1 : 0;
    context.losses += trade.result === 'Stop' ? 1 : 0;
    byContext.set(trade.context, context);

    const shift = shiftOf(trade.timestamp);
    const shiftData = byShift.get(shift) || { total: 0, count: 0, wins: 0, losses: 0 };
    shiftData.total += trade.amount;
    shiftData.count += 1;
    shiftData.wins += trade.result === 'Take' ? 1 : 0;
    shiftData.losses += trade.result === 'Stop' ? 1 : 0;
    byShift.set(shift, shiftData);
  }

  const winRateOf = (wins: number, losses: number) => wins + losses === 0 ? 0 : Math.round(wins / (wins + losses) * 100);
  const assets: AssetStat[] = Array.from(byAsset.entries()).map(([asset, x]) => ({ asset, ...x, winRate: winRateOf(x.wins, x.losses) })).sort((a, b) => b.total - a.total);
  const contexts: ContextStat[] = Array.from(byContext.entries()).map(([context, x]) => ({ context, ...x, winRate: winRateOf(x.wins, x.losses) })).sort((a, b) => b.total - a.total);
  const shifts: ShiftStat[] = SHIFT_ORDER.map((shift) => {
    const x = byShift.get(shift) || { total: 0, count: 0, wins: 0, losses: 0 };
    return { shift, ...x, winRate: winRateOf(x.wins, x.losses) };
  });
  const bestContext = contexts[0] || null;
  const worstContext = contexts.length ? contexts[contexts.length - 1] : null;

  return {
    takes,
    stops,
    breakEvens,
    globalTotal,
    grossProfit,
    grossLoss,
    profitFactor,
    globalWinRate,
    assets,
    contexts,
    shifts,
    bestContext,
    worstContext,
    assetMax: Math.max(1, ...assets.map((x) => Math.abs(x.total))),
    contextMax: Math.max(1, ...contexts.map((x) => Math.abs(x.total))),
    shiftMax: Math.max(1, ...shifts.map((x) => Math.abs(x.total))),
  };
}
