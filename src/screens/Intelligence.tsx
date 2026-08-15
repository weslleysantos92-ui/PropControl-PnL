import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Brain,
  CalendarDays,
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
  TrendingUp,
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
  const [account, setAccount] = useState('Todas');

  const accountOptions = useMemo(() => {
    const values = new Set<string>();
    for (const trade of trades) {
      const t = trade as Trade & { accountName?: string; accountId?: string; account?: string };
      const value = t.accountName || t.accountId || t.account;
      if (value) values.add(String(value));
    }
    return ['Todas', ...Array.from(values)];
  }, [trades]);

  const filteredTrades = useMemo(() => {
    const now = Date.now();
    const cutoff = period === '7 dias' ? now - 7 * 86400000 : period === '30 dias' ? now - 30 * 86400000 : 0;
    return trades.filter((trade) => {
      const t = trade as Trade & { accountName?: string; accountId?: string; account?: string };
      const value = t.accountName || t.accountId || t.account;
      const accountMatch = account === 'Todas' || String(value || '') === account;
      return accountMatch && trade.timestamp >= cutoff;
    });
  }, [trades, account, period]);

  const stats = useMemo(() => computeStats(filteredTrades), [filteredTrades]);

  return (
    <div className="min-h-full bg-[#0A0A0A] px-4 pt-5 pb-28 md:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="relative overflow-hidden rounded-3xl border border-[#3A3017] bg-gradient-to-br from-[#17140B] via-[#11110F] to-[#0C0C0C] p-5 shadow-2xl">
          <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
                <Brain size={23} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">PropControl</p>
                <h2 className="text-xl font-extrabold tracking-tight text-white">Inteligência Operacional</h2>
                <p className="mt-0.5 text-xs text-gray-500">Leia seus padrões antes de tomar a próxima decisão.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <FilterSelect value={account} options={accountOptions} onChange={setAccount} label="Conta" />
              <FilterSelect value={period} options={['Todos', '7 dias', '30 dias']} onChange={(v) => setPeriod(v as Period)} label="Período" />
            </div>
          </div>
        </header>

        {filteredTrades.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <MetricCard title="Resultado Financeiro" value={formatSignedCurrency(stats.globalTotal)} icon={CircleDollarSign} tone={stats.globalTotal > 0 ? 'profit' : stats.globalTotal < 0 ? 'loss' : 'neutral'} />
              <MetricCard title="Win Rate" value={`${stats.globalWinRate}%`} icon={Target} tone={stats.globalWinRate >= 50 ? 'profit' : 'neutral'} />
              <MetricCard title="Profit Factor" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} icon={BarChart3} tone={stats.profitFactor >= 1 ? 'profit' : 'loss'} />
              <MetricCard title="Takes" value={String(stats.takes)} icon={Check} tone="profit" />
              <MetricCard title="Stops" value={String(stats.stops)} icon={X} tone={stats.stops > 0 ? 'loss' : 'neutral'} />
              <MetricCard title="Break Evens" value={String(stats.breakEvens)} icon={ShieldCheck} tone="neutral" />
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <PerformanceSection title="Performance por Ativo" subtitle="Onde seu operacional entrega mais resultado" icon={<Target size={17} />}>
                {stats.assets.map((item, index) => (
                  <RankRow key={String(item.asset)} rank={index + 1} label={String(item.asset)} value={item.total} detail={`${item.winRate}% de acerto · ${item.count} trades`} max={stats.assetMax} />
                ))}
              </PerformanceSection>

              <PerformanceSection title="Performance por Turno" subtitle="Horários em que sua execução é mais consistente" icon={<Clock3 size={17} />}>
                {stats.shifts.map((item) => {
                  const Icon = SHIFT_ICON[item.shift];
                  return <ShiftRow key={item.shift} icon={Icon} shift={item.shift} total={item.total} count={item.count} max={stats.shiftMax} />;
                })}
              </PerformanceSection>
            </div>

            <PerformanceSection title="Performance por Contexto" subtitle="Quais condições favorecem ou prejudicam sua execução" icon={<Zap size={17} />}>
              <div className="grid gap-3 md:grid-cols-2">
                {stats.contexts.map((item) => (
                  <ContextRow key={String(item.context)} context={String(item.context)} total={item.total} count={item.count} winRate={item.winRate} max={stats.contextMax} />
                ))}
              </div>
            </PerformanceSection>

            <section className="grid gap-4 md:grid-cols-2">
              <HighlightCard type="best" title="Melhor Contexto" context={stats.bestContext?.context} total={stats.bestContext?.total ?? 0} />
              <HighlightCard type="worst" title="Contexto de Menor Desempenho" context={stats.worstContext?.context} total={stats.worstContext?.total ?? 0} />
            </section>

            <div className="rounded-2xl border border-[#272727] bg-[#111111] p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Sparkles size={14} className="text-[#D4AF37]" />
                <span>Leitura automática baseada nos {filteredTrades.length} trades do filtro atual.</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FilterSelect({ value, options, onChange, label }: { value: string; options: string[]; onChange: (value: string) => void; label: string }) {
  return (
    <label className="relative block min-w-0">
      <span className="absolute left-3 top-1.5 text-[8px] font-bold uppercase tracking-wider text-gray-600">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full appearance-none rounded-xl border border-[#292929] bg-[#0C0C0C] pl-3 pr-8 pt-3 text-xs font-semibold text-gray-200 outline-none transition focus:border-[#D4AF37]/50">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 bottom-3.5 text-gray-600" />
    </label>
  );
}

function MetricCard({ title, value, icon: Icon, tone }: { title: string; value: string; icon: typeof Target; tone: 'profit' | 'loss' | 'neutral' }) {
  const toneClass = tone === 'profit' ? 'text-emerald-400' : tone === 'loss' ? 'text-[#B9404A]' : 'text-gray-200';
  const iconClass = tone === 'profit' ? 'bg-emerald-400/10 text-emerald-400' : tone === 'loss' ? 'bg-[#B9404A]/10 text-[#B9404A]' : 'bg-white/[0.04] text-[#D4AF37]';
  return (
    <div className="relative min-h-[132px] overflow-hidden rounded-2xl border border-[#252525] bg-[#111111] p-4 transition hover:border-[#D4AF37]/20">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#D4AF37]/[0.025] blur-2xl" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">{title}</span>
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconClass}`}><Icon size={15} /></span>
        </div>
        <p className={`mt-5 text-xl font-extrabold tabular-nums ${toneClass}`}>{value}</p>
      </div>
    </div>
  );
}

function PerformanceSection({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#252525] bg-[#111111] p-4 md:p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">{icon}</div>
        <div>
          <h3 className="text-sm font-bold text-gray-100">{title}</h3>
          <p className="mt-1 text-[11px] text-gray-600">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function RankRow({ rank, label, value, detail, max }: { rank: number; label: string; value: number; detail: string; max: number }) {
  const medal = rank === 1 ? 'text-[#D4AF37]' : rank === 2 ? 'text-gray-300' : 'text-[#8C6B45]';
  return (
    <div className="rounded-xl border border-[#202020] bg-[#0C0C0C] p-3">
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] text-xs font-black ${medal}`}>{rank}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-xs font-bold text-gray-200">{label}</span>
            <span className={`text-xs font-bold tabular-nums ${value >= 0 ? 'text-emerald-400' : 'text-[#B9404A]'}`}>{formatSignedCurrency(value)}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1D1D1D]"><div className={`h-full rounded-full ${value >= 0 ? 'bg-emerald-500/70' : 'bg-[#B9404A]/70'}`} style={{ width: `${Math.min(100, Math.max(3, Math.abs(value) / Math.max(1, max) * 100))}%` }} /></div>
          <p className="mt-1.5 text-[10px] text-gray-600">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function ShiftRow({ icon: Icon, shift, total, count, max }: { icon: typeof Sun; shift: Shift; total: number; count: number; max: number }) {
  return (
    <div className="rounded-xl border border-[#202020] bg-[#0C0C0C] p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]"><Icon size={17} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-gray-200">{shift}</span><span className={`text-xs font-bold ${total >= 0 ? 'text-emerald-400' : 'text-[#B9404A]'}`}>{formatSignedCurrency(total)}</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1D1D1D]"><div className={`h-full rounded-full ${total >= 0 ? 'bg-[#D4AF37]/60' : 'bg-[#B9404A]/60'}`} style={{ width: `${Math.min(100, Math.max(3, Math.abs(total) / Math.max(1, max) * 100))}%` }} /></div>
          <p className="mt-1.5 text-[10px] text-gray-600">{count} trades registrados</p>
        </div>
      </div>
    </div>
  );
}

function ContextRow({ context, total, count, winRate, max }: { context: string; total: number; count: number; winRate: number; max: number }) {
  return (
    <div className="rounded-xl border border-[#202020] bg-[#0C0C0C] p-3">
      <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-gray-200">{context}</span><span className={`text-xs font-bold ${total >= 0 ? 'text-emerald-400' : 'text-[#B9404A]'}`}>{formatSignedCurrency(total)}</span></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1D1D1D]"><div className={`h-full rounded-full ${total >= 0 ? 'bg-emerald-500/60' : 'bg-[#B9404A]/60'}`} style={{ width: `${Math.min(100, Math.max(3, Math.abs(total) / Math.max(1, max) * 100))}%` }} /></div>
      <div className="mt-1.5 flex justify-between text-[10px] text-gray-600"><span>{count} trades</span><span>{winRate}% acerto</span></div>
    </div>
  );
}

function HighlightCard({ type, title, context, total }: { type: 'best' | 'worst'; title: string; context?: string; total: number }) {
  const isBad = type === 'worst' && total < 0;
  const border = type === 'best' ? 'border-emerald-500/30' : isBad ? 'border-[#B9404A]/40' : 'border-[#30343A]';
  const iconBg = type === 'best' ? 'bg-emerald-500/10 text-emerald-400' : isBad ? 'bg-[#B9404A]/10 text-[#B9404A]' : 'bg-white/[0.04] text-gray-400';
  return (
    <section className={`rounded-2xl border ${border} bg-[#111111] p-5`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          {type === 'best' ? <Trophy size={18} /> : isBad ? <AlertTriangle size={18} /> : <TrendingDown size={18} />}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">{title}</p>
          <p className="mt-1 text-sm font-bold text-gray-100">{context || 'Sem dados suficientes'}</p>
        </div>
      </div>
      {context && <p className={`mt-4 text-2xl font-extrabold tabular-nums ${total >= 0 ? 'text-emerald-400' : 'text-[#B9404A]'}`}>{formatSignedCurrency(total)}</p>}
      {isBad && <p className="mt-1 text-[10px] font-semibold text-[#B9404A]">Este contexto está gerando prejuízo real.</p>}
      {type === 'worst' && !isBad && context && <p className="mt-1 text-[10px] text-gray-600">Resultado positivo; apenas abaixo do melhor contexto.</p>}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-[#292929] bg-[#111111] p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]"><Brain size={25} /></div>
      <h3 className="mt-4 text-base font-bold text-gray-200">Inteligência aguardando dados</h3>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-gray-600">Registre seus trades para liberar análise de ativos, horários, contextos e métricas de performance.</p>
    </div>
  );
}

interface AssetStat { asset: Asset; total: number; count: number; winRate: number; }
interface ContextStat { context: Context; total: number; count: number; winRate: number; }
interface ShiftStat { shift: Shift; total: number; count: number; }

function computeStats(trades: Trade[]) {
  const takes = trades.filter((t) => t.result === 'Take').length;
  const stops = trades.filter((t) => t.result === 'Stop').length;
  const breakEvens = trades.filter((t) => t.result === 'Break Even' || t.result === 'BE').length;
  const globalTotal = trades.reduce((sum, t) => sum + t.amount, 0);
  const grossProfit = trades.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss;
  const globalWinRate = Math.round((takes / trades.length) * 100);

  const byAsset = new Map<Asset, { total: number; count: number; wins: number }>();
  const byContext = new Map<Context, { total: number; count: number; wins: number }>();
  const byShift = new Map<Shift, { total: number; count: number }>();

  for (const trade of trades) {
    const asset = byAsset.get(trade.asset) || { total: 0, count: 0, wins: 0 };
    asset.total += trade.amount; asset.count += 1; asset.wins += trade.result === 'Take' ? 1 : 0; byAsset.set(trade.asset, asset);
    const context = byContext.get(trade.context) || { total: 0, count: 0, wins: 0 };
    context.total += trade.amount; context.count += 1; context.wins += trade.result === 'Take' ? 1 : 0; byContext.set(trade.context, context);
    const shift = shiftOf(trade.timestamp);
    const shiftData = byShift.get(shift) || { total: 0, count: 0 };
    shiftData.total += trade.amount; shiftData.count += 1; byShift.set(shift, shiftData);
  }

  const assets: AssetStat[] = Array.from(byAsset.entries()).map(([asset, x]) => ({ asset, ...x, winRate: Math.round(x.wins / x.count * 100) })).sort((a, b) => b.total - a.total);
  const contexts: ContextStat[] = Array.from(byContext.entries()).map(([context, x]) => ({ context, ...x, winRate: Math.round(x.wins / x.count * 100) })).sort((a, b) => b.total - a.total);
  const shifts: ShiftStat[] = SHIFT_ORDER.map((shift) => ({ shift, ...(byShift.get(shift) || { total: 0, count: 0 }) }));
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
