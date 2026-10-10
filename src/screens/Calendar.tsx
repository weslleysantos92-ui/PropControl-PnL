import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Trophy, TrendingUp, TrendingDown, DollarSign, X } from 'lucide-react';
import { useApp } from '@/store';
import { operationalDay, dateKey, parseDateKey, formatTime, formatSignedCurrency, WEEKDAYS, MONTHS } from '@/dates';
import type { Trade } from '@/types';
import { tradeR } from '@/types';
import { BottomSheet } from '@/components/Modal';

/** Ícone próprio da tela: calendário com seta de alta dentro (não existe no lucide). */
function CalendarTrendIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 18l3.2-3.2 2 2L17 13" />
      <path d="M14.5 13H17v2.5" />
    </svg>
  );
}

export function Calendar() {
  const { trades, accounts } = useApp();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState('all');

  const filteredTrades = useMemo(() => accountFilter === 'all' ? trades : trades.filter(t => t.accountId === accountFilter), [trades, accountFilter]);

  const dayMap = useMemo(() => {
    const map = new Map<string, { total: number; count: number; trades: Trade[] }>();
    for (const t of filteredTrades) {
      const key = operationalDay(t.timestamp);
      const entry = map.get(key) || { total: 0, count: 0, trades: [] };
      entry.total += t.amount;
      entry.count += 1;
      entry.trades.push(t);
      map.set(key, entry);
    }
    return map;
  }, [filteredTrades]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = dateKey(new Date());
  const selectedEntry = selectedDay ? dayMap.get(selectedDay) : null;
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name || '—';

  const monthStats = useMemo(() => {
    const entries = [...dayMap.entries()].filter(([key]) => {
      const d = parseDateKey(key);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return {
      pnl: entries.reduce((sum, [, entry]) => sum + entry.total, 0),
      gains: entries.filter(([, entry]) => entry.total > 0).length,
      losses: entries.filter(([, entry]) => entry.total < 0).length,
    };
  }, [dayMap, year, month]);

  return (
    <div className="pc-calendar calendar-page min-h-full px-3 pt-4 pb-28 text-white md:px-6 md:pt-6">
      <div className="mx-auto max-w-[1040px] space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="calendar-title-icon"><CalendarTrendIcon size={22} /></div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">Calendário</h1>
                <p className="mt-1 text-xs text-slate-400">Seu histórico diário de performance.</p>
              </div>
            </div>
          </div>
          <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="calendar-filter shrink-0 appearance-none rounded-xl border border-[#232329] bg-[#111113] px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-[#D4AF37] md:w-56">
            <option value="all">Todas as contas</option>
            {accounts.map(account => <option key={account.id} value={account.id}>{account.name}{account.status === 'Reprovada' ? ' (Reprovada)' : ''}</option>)}
          </select>
        </div>

        <section className="calendar-hero relative overflow-hidden rounded-[24px] border p-5 shadow-[0_18px_60px_rgba(0,0,0,.28)] md:p-7">
          <div className="calendar-hero-glow" />
          <div className="relative flex items-center justify-between gap-4">
            <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#232329] bg-[#111113] text-slate-400 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"><ChevronLeft size={20} /></button>
            <div className="text-center">
              <h2 className="text-xl font-extrabold capitalize text-white md:text-2xl">{MONTHS[month]} <span className="text-[#D4AF37]">{year}</span></h2>
              <span className="mt-1 inline-block text-[11px] text-slate-500">{filteredTrades.length} trades registrados</span>
            </div>
            <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#232329] bg-[#111113] text-slate-400 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"><ChevronRight size={20} /></button>
          </div>
        </section>

        <section className="calendar-stats grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="calendar-stat-card">
            <div className="calendar-stat-icon stat-icon-round" style={{ borderColor: 'rgba(212,175,55,.45)', color: '#D4AF37' }}><DollarSign size={16} /></div>
            <div><p className="calendar-stat-label">Resultado do mês</p><p className={`calendar-stat-value ${monthStats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatSignedCurrency(monthStats.pnl)}</p></div>
          </div>
          <div className="calendar-stat-card">
            <div className="calendar-stat-icon" style={{ borderColor: 'rgba(52,211,153,.35)', color: '#34d399' }}><TrendingUp size={16} /></div>
            <div><p className="calendar-stat-label">Dias no gain</p><p className="calendar-stat-value text-emerald-400">{monthStats.gains}</p></div>
          </div>
          <div className="calendar-stat-card">
            <div className="calendar-stat-icon" style={{ borderColor: 'rgba(248,113,113,.35)', color: '#f87171' }}><TrendingDown size={16} /></div>
            <div><p className="calendar-stat-label">Dias no loss</p><p className="calendar-stat-value text-red-400">{monthStats.losses}</p></div>
          </div>
        </section>

        <section className="calendar-grid-section relative overflow-hidden rounded-[24px] border border-[#232329] bg-[#0D0D10] p-4 shadow-[0_18px_60px_rgba(0,0,0,.28)] md:p-6">
          <div className="mb-2 grid grid-cols-7 gap-1">{WEEKDAYS.map(w => <div key={w} className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600">{w}</div>)}</div>
          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} className="calendar-day-empty-cell" />;
              const key = dateKey(new Date(year, month, day));
              const entry = dayMap.get(key);
              const isToday = key === todayKey;
              const positive = !!entry && entry.total > 0;
              const negative = !!entry && entry.total < 0;
              return (
                <button key={i} onClick={() => setSelectedDay(key)} className={`calendar-day-cell relative flex flex-col items-center justify-center rounded-[14px] border transition-all duration-200 hover:scale-[1.03] ${isToday ? 'calendar-today border-[#D4AF37]/70 bg-[#D4AF37]/[0.08]' : positive ? 'calendar-day-win border-[#34D399] bg-[#34D399]/[0.30] hover:bg-[#34D399]/[0.38]' : negative ? 'calendar-day-loss border-[#F87171] bg-[#F87171]/[0.30] hover:bg-[#F87171]/[0.38]' : 'border-[#232329] bg-[#111113] hover:border-[#34343c]'}`}>
                  <span className={`text-[13px] font-semibold md:text-[15px] ${isToday ? 'text-[#D4AF37]' : positive ? 'text-[#6EF2C0]' : negative ? 'text-[#FF9A9A]' : 'text-slate-400'}`}>{day}</span>
                  {entry && <span className={`mt-0.5 text-[9px] font-bold md:mt-1 md:text-[10px] ${positive ? 'text-[#6EF2C0]/90' : negative ? 'text-[#FF9A9A]/90' : 'text-slate-600'}`}>{entry.count}t</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-center gap-4 border-t border-[#232329] pt-4 text-[10px] text-slate-500 md:gap-5">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#34D399]" /> Gain</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#F87171]" /> Loss</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full border border-[#D4AF37]" /> Hoje</span>
          </div>
        </section>
      </div>

      <BottomSheet open={!!selectedDay} onClose={() => setSelectedDay(null)}>
        {selectedDay && (
          <div className="calendar-day-sheet">
            <div className="calendar-day-sheet-header">
              <div className="calendar-day-sheet-date">
                <span className="calendar-day-sheet-day">{parseDateKey(selectedDay).toLocaleDateString('pt-BR', { day: '2-digit' })}</span>
                <span className="calendar-day-sheet-month">{parseDateKey(selectedDay).toLocaleDateString('pt-BR', { month: 'long' })}</span>
              </div>
              <button onClick={() => setSelectedDay(null)} className="calendar-day-sheet-close"><X size={20} /></button>
            </div>
            {selectedEntry ? <>
              <div className="calendar-day-sheet-summary">
                <div className="calendar-day-sheet-stat">
                  <span className="calendar-day-sheet-stat-label">Resultado do dia</span>
                  <span className={`calendar-day-sheet-stat-value ${selectedEntry.total >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatSignedCurrency(selectedEntry.total)}</span>
                </div>
                <div className="calendar-day-sheet-divider" />
                <div className="calendar-day-sheet-stat">
                  <span className="calendar-day-sheet-stat-label">Trades</span>
                  <span className="calendar-day-sheet-stat-value text-white">{selectedEntry.count}</span>
                </div>
                <div className="calendar-day-sheet-divider" />
                <div className="calendar-day-sheet-stat">
                  <span className="calendar-day-sheet-stat-label">Média/trade</span>
                  <span className={`calendar-day-sheet-stat-value ${(selectedEntry.total / selectedEntry.count) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatSignedCurrency(selectedEntry.total / selectedEntry.count)}</span>
                </div>
              </div>
              <div className="space-y-2.5">
                {selectedEntry.trades.sort((a, b) => a.timestamp - b.timestamp).map(t => (
                  <div key={t.id} className="calendar-trade-row rounded-xl border border-[#232329] bg-[#111113] p-3.5 transition hover:border-[#34343c]">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`calendar-trade-badge ${t.result === 'Take' ? 'badge-gain' : t.result === 'Stop' ? 'badge-loss' : 'badge-neutral'}`}>{t.result}</span>
                        <span className="text-sm font-semibold text-slate-200">{t.asset}</span>
                      </div>
                      <span className="text-[11px] text-slate-600">{formatTime(t.timestamp)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-slate-500">{accountName(t.accountId)} · {t.context} · {t.timeframe}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-extrabold ${t.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatSignedCurrency(t.amount)}</span>
                        <span className={`calendar-trade-r ${tradeR(t) >= 0 ? 'r-positive' : 'r-negative'}`}>{tradeR(t) >= 0 ? '+' : ''}{tradeR(t).toFixed(1)}R</span>
                      </div>
                    </div>
                    {t.note && <p className="mt-2 border-t border-[#232329] pt-2 text-xs italic text-slate-500">"{t.note}"</p>}
                  </div>
                ))}
              </div>
              {selectedEntry.total > 0 && <div className="calendar-day-badge-win"><Trophy size={15} /> Dia encerrado no lucro.</div>}
            </> : (
              <div className="calendar-day-empty">
                <CalendarDays size={28} className="text-slate-700" />
                <p className="mt-3 text-sm text-slate-500">Nenhum trade registrado neste dia.</p>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
