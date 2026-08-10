import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/store';
import { operationalDay, dateKey, parseDateKey, formatTime, formatSignedCurrency, WEEKDAYS, MONTHS } from '@/dates';
import type { Trade } from '@/types';
import { BottomSheet } from '@/components/Modal';

export function Calendar() {
  const { trades, accounts } = useApp();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Map: dateKey -> { total, count, trades }
  const dayMap = useMemo(() => {
    const map = new Map<string, { total: number; count: number; trades: Trade[] }>();
    for (const t of trades) {
      const key = operationalDay(t.timestamp);
      const entry = map.get(key) || { total: 0, count: 0, trades: [] };
      entry.total += t.amount;
      entry.count += 1;
      entry.trades.push(t);
      map.set(key, entry);
    }
    return map;
  }, [trades]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayKey = dateKey(new Date());

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name || '—';

  const selectedEntry = selectedDay ? dayMap.get(selectedDay) : null;

  return (
    <div className="px-4 pt-4 pb-28">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="w-9 h-9 rounded-full bg-ink-800 flex items-center justify-center text-gray-300 hover:bg-ink-700 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-base font-bold text-white">{MONTHS[month]} {year}</h2>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="w-9 h-9 rounded-full bg-ink-800 flex items-center justify-center text-gray-300 hover:bg-ink-700 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[11px] font-bold text-gray-600 uppercase">{w}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const key = dateKey(new Date(year, month, day));
          const entry = dayMap.get(key);
          const isToday = key === todayKey;
          let bg = 'bg-ink-850 border-ink-700';
          if (entry) {
            bg = entry.total >= 0
              ? 'bg-funded-soft border-funded-ring'
              : 'bg-loss-soft border-loss-text/30';
          }
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(key)}
              className={`aspect-square rounded-xl border ${bg} flex flex-col items-center justify-center transition-all hover:scale-105 ${isToday ? 'ring-1 ring-white/30' : ''}`}
            >
              <span className={`text-sm font-bold ${entry ? (entry.total >= 0 ? 'text-funded-text' : 'text-loss-text') : 'text-gray-400'}`}>
                {day}
              </span>
              {entry && (
                <span className={`text-[9px] font-semibold ${entry.total >= 0 ? 'text-funded-text/70' : 'text-loss-text/70'}`}>
                  {entry.count}t
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-5 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-funded-soft border border-funded-ring" /> Lucro</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-loss-soft border border-loss-text/30" /> Prejuízo</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-ink-850 border border-ink-700" /> Sem trades</span>
      </div>

      {/* Bottom sheet */}
      <BottomSheet open={!!selectedDay} onClose={() => setSelectedDay(null)}>
        {selectedDay && (
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              {parseDateKey(selectedDay).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </h3>
            {selectedEntry ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`px-3 py-1.5 rounded-xl text-sm font-bold ${selectedEntry.total >= 0 ? 'bg-funded-soft text-funded-text' : 'bg-loss-soft text-loss-text'}`}>
                    {formatSignedCurrency(selectedEntry.total)}
                  </div>
                  <span className="text-sm text-gray-400">{selectedEntry.count} trade{selectedEntry.count > 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2">
                  {selectedEntry.trades.sort((a, b) => a.timestamp - b.timestamp).map((t) => (
                    <div key={t.id} className="rounded-xl border border-ink-700 bg-ink-800 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                            t.result === 'Take' ? 'bg-funded-soft text-funded-text'
                            : t.result === 'Stop' ? 'bg-loss-soft text-loss-text'
                            : 'bg-ink-700 text-gray-300'
                          }`}>{t.result}</span>
                          <span className="text-xs text-gray-300 font-semibold">{t.asset}</span>
                          <span className="text-xs text-gray-600">{formatTime(t.timestamp)}</span>
                        </div>
                        <span className={`text-sm font-bold ${t.amount >= 0 ? 'text-profit-text' : 'text-loss-text'}`}>
                          {formatSignedCurrency(t.amount)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{accountName(t.accountId)} · {t.context} · {t.timeframe}</p>
                      {t.note && <p className="text-xs text-gray-500 mt-1 italic">"{t.note}"</p>}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">Nenhum trade registrado neste dia.</p>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
