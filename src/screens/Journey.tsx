import { useMemo, useState } from 'react';
import { Award, CalendarDays, Check, ChevronRight, Crown, Flag, Lock, MapPin, Target, Briefcase, BarChart3, DollarSign } from 'lucide-react';
import { useApp } from '@/store';

const TRADE_MILESTONES = [25, 50, 100, 250, 500, 1000];
const APP_DAY_MILESTONES = [30, 90, 180, 365];
const PROP_MILESTONES = ['1ª conta aprovada', '1ª conta financiada', '2ª conta financiada', '4ª conta financiada'];
const CONSISTENCY_MILESTONES = [5, 10, 20, 30];
const PAYOUT_MILESTONES = [10000, 25000, 50000, 100000];

function FamilySilhouette() {
  return (
    <div className="absolute left-1/2 top-[42%] z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none drop-shadow-[0_0_14px_rgba(255,210,75,.5)]" aria-label="Família" role="img">
      <svg width="78" height="58" viewBox="0 0 78 58" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g fill="#FFE06A"><circle cx="25" cy="12" r="7"/><circle cx="52" cy="12" r="7"/><circle cx="38.5" cy="17" r="5.5"/><path d="M14 48c0-13 5-22 11-22s11 9 11 22H14Z"/><path d="M41 48c0-13 5-22 11-22s11 9 11 22H41Z"/><path d="M29 48c0-10 4-17 9.5-17S48 38 48 48H29Z"/></g>
      </svg>
    </div>
  );
}

export function Journey() {
  const { accounts, trades, movements } = useApp();
  const [open, setOpen] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const totalTrades = trades.length;
    const firstActivity = [...trades].sort((a, b) => a.timestamp - b.timestamp)[0]?.timestamp;
    const daysUsingApp = firstActivity ? Math.max(1, Math.floor((Date.now() - firstActivity) / 86400000) + 1) : 0;
    const fundedAccounts = accounts.filter((a) => a.status === 'Financiada').length;
    const profitableDays = new Set(trades.filter((t) => t.amount > 0).map((t) => new Date(t.timestamp).toDateString())).size;
    const totalPayouts = movements.filter((m) => ['saque', 'payout', 'withdrawal'].includes(String(m.type ?? '').toLowerCase())).reduce((sum, m) => sum + Number(m.amount || 0), 0);
    return { totalTrades, daysUsingApp, fundedAccounts, profitableDays, totalPayouts };
  }, [accounts, trades, movements]);

  const disciplineItems = [
    ...TRADE_MILESTONES.map((target) => ({ label: `${target.toLocaleString('pt-BR')} trades`, current: metrics.totalTrades, target, icon: Award })),
    ...APP_DAY_MILESTONES.map((target) => ({ label: `${target === 365 ? '1 ano' : `${target} dias`} utilizando o PropControl`, current: metrics.daysUsingApp, target, icon: CalendarDays })),
  ];
  const propItems = PROP_MILESTONES.map((label, index) => ({
    label,
    current: Math.min(metrics.fundedAccounts, index === 0 || index === 1 ? 1 : index === 2 ? 2 : 4),
    target: index === 0 || index === 1 ? 1 : index === 2 ? 2 : 4,
    icon: index === 0 ? Target : Briefcase,
  }));
  const consistencyItems = CONSISTENCY_MILESTONES.map((target) => ({ label: `${target} dias positivos`, current: metrics.profitableDays, target, icon: BarChart3 }));
  const payoutItems = PAYOUT_MILESTONES.map((target) => ({ label: `US$ ${target.toLocaleString('en-US')}`, current: metrics.totalPayouts, target, icon: DollarSign }));
  const chapters = [
    { id: 'disciplina', number: '01', title: 'Disciplina', description: 'A consistência nasce dos hábitos.', items: disciplineItems, icon: Target },
    { id: 'prop', number: '02', title: 'Prop Trader', description: 'Agora você está construindo uma carreira.', items: propItems, icon: Briefcase },
    { id: 'consistencia', number: '03', title: 'Consistência', description: 'O sucesso deixa de ser um evento e passa a ser um processo.', items: consistencyItems, icon: BarChart3 },
    { id: 'liberdade', number: '04', title: 'Liberdade', description: 'A disciplina construiu aquilo que a pressa nunca conseguiria.', items: payoutItems, icon: Crown },
  ];
  const totalAchievements = chapters.reduce((sum, chapter) => sum + chapter.items.length, 0);
  const unlockedAchievements = chapters.reduce((sum, chapter) => sum + chapter.items.filter((item) => item.current >= item.target).length, 0);

  return (
    <div className="min-h-screen bg-black text-white px-3 pb-28 md:px-6 md:pb-8">
      <div className="max-w-[720px] mx-auto pt-3 md:pt-6 space-y-4">
        <section className="relative overflow-hidden rounded-[26px] border border-[#6d5015]/55 min-h-[390px] bg-[#050504] shadow-[0_18px_60px_rgba(0,0,0,.5)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_43%,rgba(255,196,47,.34),transparent_20%),radial-gradient(circle_at_48%_72%,rgba(212,175,55,.11),transparent_38%),linear-gradient(180deg,#010101_0%,#0a0906_58%,#020202_100%)]" />
          <div className="absolute inset-x-[-12%] bottom-[22%] h-[130px] opacity-80" style={{ background: 'linear-gradient(169deg, transparent 42%, rgba(212,175,55,.12) 44%, rgba(212,175,55,.65) 48%, #FFE06A 50%, rgba(212,175,55,.28) 52%, transparent 56%)' }} />
          <div className="absolute inset-x-[-10%] bottom-[-10%] h-44 opacity-35 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,.13),transparent_65%)]" />
          <div className="absolute top-[37%] left-[69%] h-7 w-7 rounded-full bg-[#FFD85A] shadow-[0_0_30px_12px_rgba(255,206,69,.28)]" />
          <FamilySilhouette />
          <div className="relative z-30 flex items-center justify-between px-4 pt-4 md:px-6"><button className="h-12 w-12 rounded-2xl border border-[#6d5015]/60 bg-black/45 flex items-center justify-center text-[#D4AF37]"><ChevronRight size={22} className="rotate-180" /></button><div className="text-center"><div className="flex items-center justify-center gap-2"><Crown size={20} className="text-[#D4AF37]" /><h1 className="text-[25px] font-bold">Jornada</h1></div><p className="mt-1 text-sm text-gray-400">Sua evolução, seu legado.</p></div><button className="h-12 w-12 rounded-2xl border border-[#6d5015]/60 bg-black/45 flex items-center justify-center text-[#D4AF37]"><BarChart3 size={20} /></button></div>
          <div className="relative z-30 mt-[112px] px-5"><div className="flex items-end justify-between"><div><MapPin size={42} strokeWidth={1.7} className="text-[#FFD85A]" /><span className="block mt-1 text-[17px] font-semibold text-[#FFD85A]">Hoje</span></div><div className="text-right"><Flag size={39} strokeWidth={1.7} className="ml-auto text-[#FFD85A]" /><span className="block mt-1 text-[17px] font-semibold text-[#FFD85A]">Liberdade</span></div></div><p className="mt-3 text-center text-sm md:text-base text-gray-300 leading-5">Você está construindo um futuro,<br />uma <span className="text-[#FFD85A] font-semibold">decisão disciplinada</span> de cada vez.</p></div>
        </section>
        <section className="rounded-[22px] border border-[#242428] bg-[#080809] px-4 py-4 md:px-6"><div className="grid grid-cols-2 divide-x divide-[#2b2b2e]"><div className="flex items-center gap-3 pr-4"><div className="h-12 w-12 shrink-0 rounded-full border border-[#333] bg-[#151516] flex items-center justify-center text-[#D4AF37]"><Award size={22} /></div><div><p className="text-xs text-gray-400">Marcos conquistados</p><p className="text-[22px] font-semibold leading-7">{unlockedAchievements} <span className="text-gray-500 text-base">/ {totalAchievements}</span></p><div className="mt-1 h-1.5 w-28 rounded-full bg-[#242427] overflow-hidden"><div className="h-full bg-gradient-to-r from-[#A77B18] to-[#FFD85A]" style={{ width: `${totalAchievements ? (unlockedAchievements / totalAchievements) * 100 : 0}%` }} /></div></div></div><div className="flex items-center gap-3 pl-4"><div className="h-12 w-12 shrink-0 rounded-full border border-[#333] bg-[#151516] flex items-center justify-center text-[#D4AF37]"><CalendarDays size={21} /></div><div><p className="text-xs text-gray-400">Dias utilizando o PropControl</p><p className="text-[22px] font-semibold leading-7">{metrics.daysUsingApp}</p><p className="text-[11px] text-[#D4AF37]">Mantenha o foco. Continue.</p></div></div></div></section>
        <section className="relative space-y-3 pl-2"><div className="absolute left-[13px] top-5 bottom-5 w-px bg-gradient-to-b from-[#D4AF37] via-[#69696d] to-[#26262a]" />{chapters.map((chapter) => { const Icon = chapter.icon; const completed = chapter.items.filter((item) => item.current >= item.target).length; const pct = chapter.items.length ? Math.round((completed / chapter.items.length) * 100) : 0; const isOpen = open === chapter.id; return <div key={chapter.id} className="relative pl-5"><div className="absolute left-[-1px] top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full border-2 border-[#D4AF37] bg-[#11100b] text-[#FFD85A] shadow-[0_0_16px_rgba(212,175,55,.2)] flex items-center justify-center"><Check size={15} /></div><button onClick={() => setOpen(isOpen ? null : chapter.id)} className={`w-full text-left min-h-[132px] rounded-[22px] border overflow-hidden transition-all ${isOpen ? 'border-[#D4AF37]/80 bg-[#0e0e0f]' : 'border-[#29292d] bg-[#080809] hover:border-[#6d5318]'}`}><div className="flex min-h-[132px]"><div className="w-[92px] shrink-0 border-r border-[#29292d] flex flex-col items-center justify-center"><span className="text-[31px] leading-none text-[#E3B82E]">{chapter.number}</span><span className="text-[9px] uppercase tracking-widest text-gray-500 mt-2">CAPÍTULO</span></div><div className="flex-1 px-4 py-4"><div className="flex items-start gap-3"><div className="h-12 w-12 shrink-0 rounded-full border border-[#D4AF37] text-[#FFD85A] flex items-center justify-center"><Icon size={22} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h2 className="text-[19px] font-semibold leading-6">{chapter.title}</h2><p className="text-xs text-[#C28F20] mt-1 leading-4">{chapter.description}</p></div><div className="flex items-center gap-2"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${pct > 0 ? 'text-[#FFD85A] bg-[#2a210e]' : 'text-gray-500 bg-[#151516]'}`}>{pct}%</span><ChevronRight size={19} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} /></div></div>{chapter.items.length > 0 && <div className="mt-3 flex items-center gap-[7px]">{chapter.items.map((item) => <span key={item.label} className={`h-5 w-5 rounded-full border flex items-center justify-center ${item.current >= item.target ? 'border-[#D4AF37] bg-[#D4AF37] text-black' : 'border-[#55565b] bg-transparent text-transparent'}`}><Check size={11} strokeWidth={3} /></span>)}</div>}</div></div>{chapter.items.length > 0 && <div className="mt-2 text-right text-xs text-gray-400">{completed} / {chapter.items.length}</div>}</div></div></button>{isOpen && chapter.items.length > 0 && <div className="ml-[92px] mt-2 rounded-[18px] border border-[#29292d] bg-[#0b0b0d] p-4 space-y-3">{chapter.items.map((item) => { const unlocked = item.current >= item.target; const progress = Math.min(100, item.target ? (item.current / item.target) * 100 : 0); const ItemIcon = item.icon; return <div key={item.label} className="flex items-center gap-3"><div className={`h-9 w-9 rounded-full border flex items-center justify-center shrink-0 ${unlocked ? 'border-[#D4AF37] text-[#FFD85A] bg-[#171208]' : 'border-[#3b3b40] text-gray-600'}`}>{unlocked ? <Check size={15} /> : <Lock size={14} />}</div><div className="flex-1"><div className="flex justify-between gap-2"><span className="text-sm flex items-center gap-2"><ItemIcon size={14} className={unlocked ? 'text-[#D4AF37]' : 'text-gray-600'} />{item.label}</span><span className="text-xs text-gray-500">{Math.round(progress)}%</span></div><div className="mt-1.5 h-1.5 rounded-full bg-[#26262a] overflow-hidden"><div className="h-full bg-gradient-to-r from-[#A77B18] to-[#FFD85A]" style={{ width: `${progress}%` }} /></div></div></div>; })}</div>}</div>; })}</section>
        <div className="rounded-[22px] border border-[#29292d] bg-[#080809] px-5 py-5 flex items-center gap-4"><span className="text-5xl leading-none text-[#D4AF37]">“</span><p className="text-sm text-gray-400 leading-6">Grandes carreiras são construídas em operações comuns executadas com excelência.</p><span className="ml-auto hidden sm:block text-[#D4AF37] italic">PropControl</span></div>
      </div>
    </div>
  );
}
