import { useApp } from '@/store';
import { getAchievements, getMasterGoal, type Achievement } from '@/achievements';
import { SIZE_COLORS } from '@/types';
import type { AccountSize } from '@/types';
import { Trophy, Lock, Check } from 'lucide-react';

export function Journey() {
  const { accounts } = useApp();
  const achievements = getAchievements(accounts);
  const master = getMasterGoal(accounts);

  const levels: Exclude<Achievement['level'], 'Master'>[] = ['25K', '50K', '100K'];

  return (
    <div className="px-4 pt-4 pb-28 space-y-5">
      {/* Master goal */}
      <div className="relative overflow-hidden rounded-3xl border border-size100-ring bg-gradient-to-br from-size100-soft to-ink-850 p-5">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-size100/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={20} className="text-size100-text" />
            <span className="text-[11px] font-bold text-size100-text uppercase tracking-wider">Grande Objetivo Master</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Mestre dos 100K</h2>
          <p className="text-sm text-gray-400 mb-4">Tenha 4 contas de 100K financiadas.</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 rounded-full bg-ink-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-size100 to-size100-text transition-all duration-500"
                style={{ width: `${(master.current / master.target) * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold text-white tabular-nums">{master.current}/{master.target}</span>
          </div>
          {master.complete && (
            <div className="mt-3 flex items-center gap-1.5 text-funded-text text-sm font-semibold">
              <Check size={16} /> Objetivo concluído!
            </div>
          )}
        </div>
      </div>

      {/* Level sections */}
      {levels.map((level) => {
        const items = achievements.filter((a) => a.level === level);
        const c = SIZE_COLORS[level];
        return (
          <div key={level}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
              <h3 className="text-sm font-bold text-gray-300">Nível {level}</h3>
            </div>
            <div className="space-y-2">
              {items.map((a) => (
                <AchievementCard key={a.id} achievement={a} level={level} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AchievementCard({ achievement, level }: { achievement: Achievement; level: AccountSize }) {
  const c = SIZE_COLORS[level];
  const { unlocked, progress } = achievement;
  const pct = (progress.current / progress.target) * 100;

  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      unlocked
        ? 'border-funded-ring bg-funded-soft/50'
        : 'border-ink-700 bg-ink-850'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          unlocked ? 'bg-funded-soft text-funded-text animate-pop' : 'bg-ink-800 text-gray-600'
        }`}>
          {unlocked ? <Trophy size={20} /> : <Lock size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`text-sm font-bold ${unlocked ? 'text-white' : 'text-gray-400'}`}>{achievement.title}</h4>
            {unlocked && <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${c.soft} ${c.text}`}>{level}</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{achievement.description}</p>
          <div className="flex items-center gap-2 mt-2.5">
            <div className="flex-1 h-1.5 rounded-full bg-ink-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${unlocked ? 'bg-funded-text' : c.dot}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-xs font-bold tabular-nums ${unlocked ? 'text-funded-text' : 'text-gray-500'}`}>
              {progress.current}/{progress.target}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
