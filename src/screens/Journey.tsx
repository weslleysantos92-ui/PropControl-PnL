import { useApp } from '@/store';
import { getAchievements, getMasterGoal, type Achievement } from '@/achievements';
import { SIZE_COLORS } from '@/types';
import type { AccountSize } from '@/types';
import { Lock, Check, Crown, Flag, MapPin, Target, Briefcase, BarChart3, ChevronRight, Sparkles } from 'lucide-react';

export function Journey() {
  const { accounts } = useApp();
  const achievements = getAchievements(accounts);
  const master = getMasterGoal(accounts);
  const levels: Exclude<Achievement['level'], 'Master'>[] = ['25K', '50K', '100K'];
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const achievementPct = achievements.length ? (unlockedCount / achievements.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#050506] text-white px-4 pb-28 md:px-8 md:pb-10">
      <div className="max-w-6xl mx-auto pt-4 md:pt-8 space-y-5">
        <section className="relative overflow-hidden rounded-[28px] border border-[#8d6b20]/40 bg-[#080807] min-h-[330px] md:min-h-[360px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(212,175,55,.26),transparent_23%),radial-gradient(circle_at_50%_75%,rgba(212,175,55,.08),transparent_42%),linear-gradient(180deg,#030303_0%,#0a0906_55%,#050505_100%)]" />
          <div className="absolute left-[-10%] right-[-10%] bottom-[-12%] h-40 opacity-80" style={{ background: 'linear-gradient(168deg, transparent 45%, rgba(212,175,55,.08) 46%, rgba(212,175,55,.65) 49%, rgba(255,218,91,.95) 50%, rgba(212,175,55,.18) 51%, transparent 55%)' }} />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="relative z-10 flex items-center justify-between px-5 pt-5 md:px-7">
            <button className="h-11 w-11 rounded-2xl border border-[#8d6b20]/50 bg-black/40 text-[#D4AF37] flex items-center justify-center">‹</button>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2"><Crown size={20} className="text-[#D4AF37]" /><h1 className="text-2xl font-bold tracking-tight">Jornada</h1></div>
              <p className="mt-1 text-sm text-gray-400">Sua evolução, seu legado.</p>
            </div>
            <button className="h-11 w-11 rounded-2xl border border-[#8d6b20]/50 bg-black/40 text-[#D4AF37] flex items-center justify-center"><BarChart3 size={19} /></button>
          </div>
          <div className="relative z-10 mt-28 md:mt-32 px-6 text-center">
            <div className="flex items-end justify-between max-w-3xl mx-auto">
              <div className="text-left"><MapPin size={34} className="text-[#D4AF37]" /><span className="block mt-1 text-[#D4AF37] font-semibold">Hoje</span></div>
              <div className="mb-3 h-3 w-3 rounded-full bg-[#FFE06A] shadow-[0_0_22px_8px_rgba(212,175,55,.35)]" />
              <div className="text-right"><Flag size={34} className="text-[#D4AF37] ml-auto" /><span className="block mt-1 text-[#D4AF37] font-semibold">Liberdade</span></div>
            </div>
            <p className="mt-5 text-sm md:text-base text-gray-300">Você está construindo um futuro,<br />uma <span className="text-[#D4AF37] font-semibold">decisão disciplinada</span> de cada vez.</p>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#26262b] bg-gradient-to-b from-[#101012] to-[#09090a] p-5 md:p-6 shadow-[0_16px_45px_rgba(0,0,0,.25)]">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#2a2a2d]">
            <div className="flex items-center gap-4 md:pr-7">
              <div className="h-14 w-14 rounded-full border border-[#6d5318] bg-[#18150c] flex items-center justify-center"><Sparkles size={25} className="text-[#D4AF37]" /></div>
              <div className="flex-1"><p className="text-sm text-gray-400">Marcos conquistados</p><p className="text-2xl font-bold mt-0.5">{unlockedCount} <span className="text-gray-500 text-lg">/ {achievements.length}</span></p><div className="mt-2 h-1.5 rounded-full bg-[#26262a] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#9c741b] to-[#FFD85A]" style={{ width: `${achievementPct}%` }} /></div></div>
            </div>
            <div className="flex items-center gap-4 pt-5 md:pt-0 md:pl-7">
              <div className="h-14 w-14 rounded-full border border-[#6d5318] bg-[#18150c] flex items-center justify-center"><CalendarIcon /></div>
              <div><p className="text-sm text-gray-400">Progresso do objetivo Master</p><p className="text-2xl font-bold mt-0.5">{master.current} <span className="text-gray-500 text-lg">/ {master.target}</span></p><p className="text-xs text-[#D4AF37] mt-1">Continue avançando.</p></div>
            </div>
          </div>
        </section>

        <section className="relative space-y-3">
          <div className="absolute left-5 top-8 bottom-8 w-px bg-gradient-to-b from-[#D4AF37] via-[#6c6c70] to-[#252529]" />
          {levels.map((level, index) => {
            const items = achievements.filter(a => a.level === level);
            return <div key={level} className="relative pl-10"><div className={`absolute left-0 top-7 z-10 h-10 w-10 rounded-full border flex items-center justify-center ${items.some(a => a.unlocked) ? 'border-[#D4AF37] bg-[#171208] text-[#D4AF37]' : 'border-[#3c3c42] bg-[#101012] text-gray-600'}`}>{items.some(a => a.unlocked) ? <Check size={18} /> : <Lock size={16} />}</div><div className="rounded-[22px] border border-[#29292e] bg-gradient-to-r from-[#121214] to-[#0b0b0d] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,.22)]"><div className="flex items-stretch min-h-[126px]"><div className="w-[78px] shrink-0 border-r border-[#29292e] flex flex-col items-center justify-center"><span className="text-3xl font-light text-[#D4AF37]">0{index + 1}</span><span className="text-[9px] uppercase tracking-widest text-gray-500 mt-1">Capítulo</span></div><div className="flex-1 p-4 md:p-5">{items.map(a => <AchievementRow key={a.id} achievement={a} level={level} />)}</div></div></div></div>;
          })}
        </section>

        <div className="rounded-[22px] border border-[#29292e] bg-[#0c0c0e] px-6 py-5 md:px-8 md:py-6 flex items-center gap-4"><span className="text-5xl leading-none text-[#D4AF37]">“</span><p className="text-sm md:text-base text-gray-400 leading-6">Grandes carreiras são construídas em operações comuns executadas com excelência.</p><span className="ml-auto hidden md:block text-[#D4AF37] italic text-lg">PropControl</span></div>
      </div>
    </div>
  );
}

function AchievementRow({ achievement, level }: { achievement: Achievement; level: AccountSize }) {
  const { unlocked, progress } = achievement;
  const pct = progress.target > 0 ? Math.min(100, (progress.current / progress.target) * 100) : 0;
  const Icon = level === '25K' ? Target : level === '50K' ? Briefcase : BarChart3;
  return <div className="flex items-center gap-4"><div className={`h-12 w-12 md:h-14 md:w-14 rounded-full border flex items-center justify-center shrink-0 ${unlocked ? 'border-[#D4AF37] bg-[#171208] text-[#D4AF37]' : 'border-[#3b3b40] bg-[#141416] text-gray-600'}`}><Icon size={22} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h3 className={`text-lg md:text-xl font-semibold ${unlocked ? 'text-white' : 'text-gray-400'}`}>{achievement.title}</h3><p className="text-xs md:text-sm text-gray-500 mt-1">{achievement.description}</p></div><div className="text-right shrink-0"><span className={`inline-block rounded-lg px-2.5 py-1 text-sm font-bold ${unlocked ? 'bg-[#2a220d] text-[#FFD85A]' : 'bg-[#19191c] text-gray-600'}`}>{Math.round(pct)}%</span><p className="text-xs text-gray-500 mt-1">{progress.current} / {progress.target}</p></div></div><div className="mt-3 flex items-center gap-2"><div className="flex-1 h-1.5 rounded-full bg-[#26262a] overflow-hidden"><div className={`h-full rounded-full ${unlocked ? 'bg-gradient-to-r from-[#9c741b] to-[#FFD85A]' : 'bg-[#3b3b40]'}`} style={{ width: `${pct}%` }} /></div><ChevronRight size={18} className="text-gray-500" /></div></div></div>;
}

function CalendarIcon() { return <div className="relative text-[#D4AF37]"><div className="w-6 h-6 rounded-md border-2 border-current" /><div className="absolute left-1 right-1 top-1.5 border-t-2 border-current" /></div>; }
