import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { useApp } from '@/store';
import { operationalDay, dateKey, parseDateKey, formatTime, formatSignedCurrency, WEEKDAYS, MONTHS } from '@/dates';
import type { Trade } from '@/types';
import { BottomSheet } from '@/components/Modal';

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
    <div className="pc-calendar min-h-full bg-[#0A0A0A] px-4 pt-5 pb-28 text-white md:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[#D4AF37]"><CalendarDays size={18} /><span className="text-[10px] font-semibold uppercase tracking-[0.22em]">Performance</span></div>
            <h1 className="text-2xl font-bold tracking-tight">Calendário</h1>
            <p className="mt-1 text-sm text-gray-500">Seu histórico diário de performance.</p>
          </div>
          <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="w-full appearance-none rounded-xl border border-white/[0.08] bg-[#111214] px-4 py-3 text-sm text-gray-200 outline-none focus:border-[#D4AF37]/50 md:w-56">
            <option value="all">Todas as contas</option>
            {accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </div>

        <section className="rounded-2xl border border-white/[0.07] bg-[#101112] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] md:p-6">
          <div className="mb-6 flex items-center justify-between">
            <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-[#151617] text-gray-400 transition-colors hover:border-[#D4AF37]/30 hover:text-white"><ChevronLeft size={18} /></button>
            <div className="text-center"><h2 className="text-lg font-semibold capitalize">{MONTHS[month]} {year}</h2><span className="text-[11px] text-gray-600">{filteredTrades.length} trades registrados</span></div>
            <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-[#151617] text-gray-400 transition-colors hover:border-[#D4AF37]/30 hover:text-white"><ChevronRight size={18} /></button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1"><>{WEEKDAYS.map(w => <div key={w} className="py-2 text-center text-[10px] font-medium uppercase tracking-wider text-gray-600">{w}</div>)}</></div>
          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} className="aspect-square" />;
              const key = dateKey(new Date(year, month, day));
              const entry = dayMap.get(key);
              const isToday = key === todayKey;
              const positive = !!entry && entry.total > 0;
              const negative = !!entry && entry.total < 0;
              return <button key={i} onClick={() => setSelectedDay(key)} className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border transition-all hover:scale-[1.02] ${isToday ? 'today-shimmer border-[#D4AF37]/70 bg-[#17140A]' : positive ? 'border-emerald-500/20 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.10]' : negative ? 'border-red-500/20 bg-red-500/[0.06] hover:bg-red-500/[0.10]' : 'border-white/[0.035] bg-[#0D0E0F] hover:border-white/[0.09]'}`}>
                <span className={`text-sm font-medium ${isToday ? 'text-[#D4AF37]' : positive ? 'text-emerald-400' : negative ? 'text-red-400' : 'text-gray-400'}`}>{day}</span>
                {entry && <span className={`mt-1 text-[8px] font-semibold md:text-[9px] ${positive ? 'text-emerald-400/80' : negative ? 'text-red-400/80' : 'text-gray-500'}`}>{entry.count}t</span>}
              </button>;
            })}
          </div>

          <div className="mt-5 flex items-center justify-center gap-4 border-t border-white/[0.05] pt-4 text-[10px] text-gray-500 md:gap-5">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500/70" /> Gain</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-red-500/70" /> Loss</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full border border-[#D4AF37]" /> Hoje</span>
          </div>
        </section>

        <section className="pc-calendar-summary grid grid-cols-3 gap-2 md:gap-3">
          <div className="flex min-h-[92px] flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-[#101112] p-3 text-center md:p-4"><span className="text-[10px] uppercase tracking-wider text-gray-600">Resultado do mês</span><span className={`mt-2 text-base font-bold md:text-xl ${monthStats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatSignedCurrency(monthStats.pnl)}</span></div>
          <div className="flex min-h-[92px] flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-[#101112] p-3 text-center md:p-4"><span className="text-[10px] uppercase tracking-wider text-gray-600">Dias no Gain</span><span className="mt-2 text-base font-bold text-emerald-400 md:text-xl">{monthStats.gains}</span></div>
          <div className="flex min-h-[92px] flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-[#101112] p-3 text-center md:p-4"><span className="text-[10px] uppercase tracking-wider text-gray-600">Dias no Loss</span><span className="mt-2 text-base font-bold text-red-400 md:text-xl">{monthStats.losses}</span></div>
        </section>
      </div>

      <BottomSheet open={!!selectedDay} onClose={() => setSelectedDay(null)}>
        {selectedDay && <div>
          <h3 className="mb-1 text-lg font-bold text-white">{parseDateKey(selectedDay).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</h3>
          {selectedEntry ? <>
            <div className="mb-4 flex items-center gap-3"><div className={`rounded-xl px-3 py-1.5 text-sm font-bold ${selectedEntry.total >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{formatSignedCurrency(selectedEntry.total)}</div><span className="text-sm text-gray-400">{selectedEntry.count} trade{selectedEntry.count > 1 ? 's' : ''}</span></div>
            <div className="space-y-2">{selectedEntry.trades.sort((a, b) => a.timestamp - b.timestamp).map(t => <div key={t.id} className="rounded-xl border border-white/[0.06] bg-[#0D0E0F] p-3">
              <div className="mb-1 flex items-center justify-between"><div className="flex items-center gap-2"><span className={`rounded-md px-2 py-0.5 text-xs font-bold ${t.result === 'Take' ? 'bg-emerald-500/10 text-emerald-400' : t.result === 'Stop' ? 'bg-red-500/10 text-red-400' : 'bg-white/[0.05] text-gray-300'}`}>{t.result}</span><span className="text-xs font-semibold text-gray-300">{t.asset}</span><span className="text-xs text-gray-600">{formatTime(t.timestamp)}</span></div><span className={`text-sm font-bold ${t.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatSignedCurrency(t.amount)}</span></div>
              <p className="text-xs text-gray-400">{accountName(t.accountId)} · {t.context} · {t.timeframe}</p>{t.note && <p className="mt-1 text-xs italic text-gray-500">"{t.note}"</p>}
            </div>)}</div>
            {selectedEntry.total > 0 && <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-3 text-xs text-[#D4AF37]"><Trophy size={15} /> Dia encerrado no lucro.</div>}
          </> : <p className="text-sm text-gray-500">Nenhum trade registrado neste dia.</p>}
        </div>}
      </BottomSheet>

      <style>{`@keyframes shimmerToday { 0%,100% { box-shadow: inset -80px 0 70px -80px rgba(212,175,55,0); } 50% { box-shadow: inset 80px 0 70px -80px rgba(212,175,55,.35); } } .today-shimmer { animation: shimmerToday 3s ease-in-out infinite; }`}</style>
    </div>
  );
}
