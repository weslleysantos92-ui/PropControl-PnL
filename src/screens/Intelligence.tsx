import { useMemo } from 'react';
import { Sparkles, Target, Clock, TrendingUp, Award, Moon, Sun, Sunrise } from 'lucide-react';
import { useApp } from '@/store';
import type { Asset, Context, Trade } from '@/types';
import { formatSignedCurrency } from '@/dates';

type Shift = 'Manhã' | 'Tarde' | 'Noite/Madrugada';

function shiftOf(ts: number): Shift {
  const h = new Date(ts).getHours();
  if (h >= 6 && h < 12) return 'Manhã';
  if (h >= 12 && h < 18) return 'Tarde';
  return 'Noite/Madrugada';
}

const SHIFT_ICON: Record<Shift, typeof Sun> = {
  'Manhã': Sunrise,
  'Tarde': Sun,
  'Noite/Madrugada': Moon,
};

export function Intelligence() {
  const { trades } = useApp();

  const stats = useMemo(() => computeStats(trades), [trades]);

  return (
    <div className="px-4 pt-4 pb-28 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} className="text-size100-text" />
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Inteligência Operacional</h2>
      </div>

      {trades.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-700 bg-ink-850/50 p-6 text-center">
          <p className="text-gray-500 text-sm">Registre trades para revelar sua inteligência operacional.</p>
        </div>
      ) : (
        <>
          {/* Ativo de Elite */}
          <InsightCard
            icon={<Target size={20} />}
            accent="size25"
            title="Ativo de Elite"
            emoji="🏆"
            line={stats.eliteAsset ? (
              <>
                Seu Ativo de Elite é o <span className="text-size25-text font-bold">{stats.eliteAsset.asset}</span>
                <span className="block text-gray-400 text-sm mt-1.5">
                  Taxa de acerto: <span className="text-white font-semibold">{stats.eliteAsset.winRate}%</span>
                  {' · '}Total: <span className={stats.eliteAsset.total >= 0 ? 'text-profit-text' : 'text-loss-text'}>{formatSignedCurrency(stats.eliteAsset.total)}</span>
                </span>
              </>
            ) : <span className="text-gray-500">Sem dados suficientes.</span>}
          />

          {/* Contexto Vencedor */}
          <InsightCard
            icon={<Award size={20} />}
            accent="size50"
            title="Contexto Vencedor"
            emoji="🎯"
            line={stats.winningContext ? (
              <>
                Seu Contexto Vencedor é <span className="text-size50-text font-bold">{stats.winningContext.context}</span>
                <span className="block text-gray-400 text-sm mt-1.5">
                  Mais lucrativo da sua carreira · <span className={stats.winningContext.total >= 0 ? 'text-profit-text' : 'text-loss-text'}>{formatSignedCurrency(stats.winningContext.total)}</span>
                </span>
              </>
            ) : <span className="text-gray-500">Sem dados suficientes.</span>}
          />

          {/* Turno de Alta Performance */}
          <InsightCard
            icon={<Clock size={20} />}
            accent="size100"
            title="Turno de Alta Performance"
            emoji="⏱️"
            line={stats.topShift ? (
              <>
                Seu Turno de Alta Performance é a <span className="text-size100-text font-bold">{stats.topShift.shift}</span>
                <span className="block text-gray-400 text-sm mt-1.5">
                  Onde você possui sua maior consistência · <span className={stats.topShift.total >= 0 ? 'text-profit-text' : 'text-loss-text'}>{formatSignedCurrency(stats.topShift.total)}</span>
                </span>
              </>
            ) : <span className="text-gray-500">Sem dados suficientes.</span>}
            extraIcon={stats.topShift ? SHIFT_ICON[stats.topShift.shift] : undefined}
          />

          {/* Resumo complementar */}
          <div className="rounded-2xl border border-ink-700 bg-ink-850 p-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-gray-500" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Visão Geral</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <MiniStat label="Trades" value={String(trades.length)} />
              <MiniStat label="Acerto Geral" value={`${stats.globalWinRate}%`} />
              <MiniStat label="Resultado" value={formatSignedCurrency(stats.globalTotal)} tone={stats.globalTotal >= 0 ? 'profit' : 'loss'} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InsightCard({ icon, accent, title, emoji, line, extraIcon }: {
  icon: React.ReactNode;
  accent: 'size25' | 'size50' | 'size100';
  title: string;
  emoji: string;
  line: React.ReactNode;
  extraIcon?: typeof Sun;
}) {
  const accentText = accent === 'size25' ? 'text-size25-text' : accent === 'size50' ? 'text-size50-text' : 'text-size100-text';
  const accentSoft = accent === 'size25' ? 'bg-size25-soft' : accent === 'size50' ? 'bg-size50-soft' : 'bg-size100-soft';
  const accentRing = accent === 'size25' ? 'border-size25-ring' : accent === 'size50' ? 'border-size50-ring' : 'border-size100-ring';
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${accentRing} bg-ink-850 p-5 animate-fade-in`}>
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${accentSoft} blur-3xl opacity-50`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl ${accentSoft} ${accentText} flex items-center justify-center`}>{icon}</div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{title}</span>
          </div>
          {extraIcon ? (() => { const Icon = extraIcon; return <Icon size={18} className="text-gray-600" />; })() : <span className="text-lg">{emoji}</span>}
        </div>
        <p className="text-[15px] leading-relaxed text-gray-200">{line}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: 'profit' | 'loss' }) {
  const color = tone === 'profit' ? 'text-profit-text' : tone === 'loss' ? 'text-loss-text' : 'text-white';
  return (
    <div>
      <p className={`text-base font-bold ${color} tabular-nums`}>{value}</p>
      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

interface EliteAsset { asset: Asset; winRate: number; total: number; }
interface WinningContext { context: Context; total: number; }
interface TopShift { shift: Shift; total: number; }

function computeStats(trades: Trade[]): {
  eliteAsset: EliteAsset | null;
  winningContext: WinningContext | null;
  topShift: TopShift | null;
  globalWinRate: number;
  globalTotal: number;
} {
  if (trades.length === 0) {
    return { eliteAsset: null, winningContext: null, topShift: null, globalWinRate: 0, globalTotal: 0 };
  }

  // Ativo de Elite: maior lucro total, com taxa de acerto
  const byAsset = new Map<Asset, { wins: number; total: number; count: number }>();
  for (const t of trades) {
    const e = byAsset.get(t.asset) || { wins: 0, total: 0, count: 0 };
    e.total += t.amount;
    e.count += 1;
    if (t.result === 'Take') e.wins += 1;
    byAsset.set(t.asset, e);
  }
  let eliteAsset: EliteAsset | null = null;
  for (const [asset, e] of byAsset) {
    const winRate = Math.round((e.wins / e.count) * 100);
    if (!eliteAsset || e.total > eliteAsset.total) {
      eliteAsset = { asset, winRate, total: e.total };
    }
  }

  // Contexto Vencedor: maior lucro total
  const byContext = new Map<Context, number>();
  for (const t of trades) {
    byContext.set(t.context, (byContext.get(t.context) || 0) + t.amount);
  }
  let winningContext: WinningContext | null = null;
  for (const [context, total] of byContext) {
    if (!winningContext || total > winningContext.total) {
      winningContext = { context, total };
    }
  }

  // Turno: maior lucro por período
  const byShift = new Map<Shift, number>();
  for (const t of trades) {
    const s = shiftOf(t.timestamp);
    byShift.set(s, (byShift.get(s) || 0) + t.amount);
  }
  let topShift: TopShift | null = null;
  for (const [shift, total] of byShift) {
    if (!topShift || total > topShift.total) {
      topShift = { shift, total };
    }
  }

  const globalWins = trades.filter((t) => t.result === 'Take').length;
  const globalWinRate = Math.round((globalWins / trades.length) * 100);
  const globalTotal = trades.reduce((s, t) => s + t.amount, 0);

  return { eliteAsset, winningContext, topShift, globalWinRate, globalTotal };
}
