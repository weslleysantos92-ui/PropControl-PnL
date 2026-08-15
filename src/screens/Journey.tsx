import { useMemo, useState } from 'react';
import { Award, CalendarDays, Check, ChevronDown, Crown, Flag, Lock, MapPin, Target, Briefcase, BarChart3, DollarSign } from 'lucide-react';
import { useApp } from '@/store';

const TRADE_MILESTONES = [25, 50, 100, 250, 500, 1000];
const APP_DAY_MILESTONES = [30, 90, 180, 365];
const PROP_MILESTONES = [
  '1ª conta aprovada',
  '1ª conta financiada',
  '2ª conta financiada',
  '4ª conta financiada',
];
const PAYOUT_MILESTONES = [10000, 25000, 50000, 100000];

export function Journey() {
  const { accounts, trades, movements } = useApp();
  const [open, setOpen] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const totalTrades = trades.length;
    const firstActivity = [...trades].sort((a, b) => a.timestamp - b.timestamp)[0]?.timestamp;
    const daysUsingApp = firstActivity
      ? Math.max(1, Math.floor((Date.now() - firstActivity) / 86400000) + 1)
      : 0;
    const approvedAccounts = accounts.filter((a: any) => {
      const status = String(a.status ?? '').toLowerCase();
      return status.includes('aprov') || status.includes('financ') || status.includes('fund');
    }).length;
    const fundedAccounts = accounts.filter((a: any) => {
      const status = String(a.status ?? '').toLowerCase();
      return status.includes('financ') || status.includes('fund');
    }).length;
    const totalPayouts = movements
      .filter((m: any) => ['saque', 'payout', 'withdrawal'].includes(String(m.type ?? '').toLowerCase()))
      .reduce((sum: number, m: any) => sum + Number(m.amount || 0), 0);

    return { totalTrades, daysUsingApp, approvedAccounts, fundedAccounts, totalPayouts };
  }, [accounts, trades, movements]);

  const disciplineItems = [
    ...TRADE_MILESTONES.map((target) => ({ label: `${target.toLocaleString('pt-BR')} trades`, current: metrics.totalTrades, target, icon: Award })),
    ...APP_DAY_MILESTONES.map((target) => ({ label: `${target === 365 ? '1 ano' : `${target} dias`} utilizando o PropControl`, current: metrics.daysUsingApp, target, icon: CalendarDays })),
  ];

  const propItems = PROP_MILESTONES.map((label, index) => ({
    label,
    current: index === 0 ? Math.min(metrics.approvedAccounts, 1) : index === 1 ? Math.min(metrics.fundedAccounts, 1) : index === 2 ? Math.min(metrics.fundedAccounts, 2) : Math.min(metrics.fundedAccounts, 4),
    target: index === 0 || index === 1 ? 1 : index === 2 ? 2 : 4,
    icon: index === 0 ? Target : Briefcase,
  }));

  const payoutItems = PAYOUT_MILESTONES.map((target) => ({
    label: `US$ ${target.toLocaleString('en-US')}`,
    current: metrics.totalPayouts,
    target,
    icon: DollarSign,
  }));

  const chapters = [
    { id: 'disciplina', number: '01', title: 'Disciplina', description: 'Consistência nasce dos hábitos.', items: disciplineItems, icon: Target },
    { id: 'prop', number: '02', title: 'Prop Trader', description: 'Evolução operacional e crescimento das contas.', items: propItems, icon: Briefcase },
    { id: 'consistencia', number: '03', title: 'Consistência', description: 'O sucesso deixa de ser um evento e vira um processo estável.', items: [], icon: BarChart3 },
    { id: 'liberdade', number: '04', title: 'Liberdade', description: 'A disciplina construiu aquilo que a pressa destruiria.', items: payoutItems, icon: Crown },
  ];

  const toggle = (id: string) => setOpen((current) => current === id ? null : id);

  return (
    <div className="min-h-screen bg-[#050506] text-white px-4 pb-28 md:px-8 md:pb-10">
      <div className="max-w-6xl mx-auto pt-4 md:pt-8 space-y-5">
        <section className="relative overflow-hidden rounded-[28px] border border-[#8d6b20]/40 bg-[#080807] min-h-[330px] md:min-h-[360px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(212,175,55,.26),transparent_23%),radial-gradient(circle_at_50%_75%,rgba(212,175,55,.08),transparent_42%),linear-gradient(180deg,#030303_0%,#0a0906_55%,#050505_100%)]" />
          <div className="absolute left-[-10%] right-[-10%] bottom-[-12%] h-40 opacity-80" style={{ background: 'linear-gradient(168deg, transparent 45%, rgba(212,175,55,.08) 46%, rgba(212,175,55,.65) 49%, rgba(255,218,91,.95) 50%, rgba(212,175,55,.18) 51%, transparent 55%)' }} />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="relative z-10 flex items-center justify-between px-5 pt-5 md:px-7">
            <div className="h-11 w-11 rounded-2xl border border-[#8d6b20]/50 bg-black/40 text-[#D4AF37] flex items-center justify-center"><MapPin size={19} /></div>
            <div className="text-center"><div className="flex items-center justify-center gap-2"><Crown size={20} className="text-[#D4AF37]" /><h1 className="text-2xl font-bold tracking-tight">Jornada</h1></div><p className="mt-1 text-sm text-gray-400">Sua evolução, seu legado.</p></div>
            <div className="h-11 w-11 rounded-2xl border border-[#8d6b20]/50 bg-black/40 text-[#D4AF37] flex items-center justify-center"><Flag size={19} /></div>
          </div>
          <div className="relative z-10 mt-28 md:mt-32 px-6 text-center">
            <div className="flex items-end justify-between max-w-3xl mx-auto"><div className="text-left"><MapPin size={34} className="text-[#D4AF37]" /><span className="block mt-1 text-[#D4AF37] font-semibold">Hoje</span></div><div className="mb-3 h-3 w-3 rounded-full bg-[#FFE06A] shadow-[0_0_22px_8px_rgba(212,175,55,.35)]" /><div className="text-right"><Flag size={34} className="text-[#D4AF37] ml-auto" /><span className="block mt-1 text-[#D4AF37] font-semibold">Liberdade</span></div></div>
            <p className="mt-5 text-sm md:text-base text-gray-300">Você está construindo um futuro,<br />uma <span className="text-[#D4AF37] font-semibold">decisão disciplinada</span> de cada vez.</p>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#26262b] bg-gradient-to-b from-[#101012] to-[#09090a] p-5 md:p-6 shadow-[0_16px_45px_rgba(0,0,0,.25)]">
          <div className="flex items-center gap-4"><div className="h-14 w-14 rounded-full border border-[#6d5318] bg-[#18150c] flex items-center justify-center"><Crown size={25} className="text-[#D4AF37]" /></div><div><p className="text-sm text-gray-400">Evolução da Jornada</p><p className="text-lg font-semibold mt-0.5">Disciplina, evolução, consistência e liberdade.</p></div></div>
        </section>

        <section className="relative space-y-3">
          <div className="absolute left-5 top-8 bottom-8 w-px bg-gradient-to-b from-[#D4AF37] via-[#6c6c70] to-[#252529]" />
          {chapters.map((chapter) => {
            const Icon = chapter.icon;
            const completed = chapter.items.filter((item) => item.current >= item.target).length;
            const pct = chapter.items.length ? Math.round((completed / chapter.items.length) * 100) : 0;
            const isOpen = open === chapter.id;
            return (
              <div key={chapter.id} className="relative pl-10">
                <div className={`absolute left-0 top-5 z-10 h-10 w-10 rounded-full border flex items-center justify-center ${completed > 0 ? 'border-[#D4AF37] bg-[#171208] text-[#D4AF37]' : 'border-[#3c3c42] bg-[#101012] text-gray-600'}`}><Icon size={18} /></div>
                <button onClick={() => toggle(chapter.id)} className="w-full text-left rounded-[22px] border border-[#29292e] bg-gradient-to-r from-[#121214] to-[#0b0b0d] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,.22)] hover:border-[#8d6b20]/70 transition-colors">
                  <div className="flex items-center min-h-[108px]">
                    <div className="w-[78px] shrink-0 border-r border-[#29292e] flex flex-col items-center justify-center"><span className="text-3xl font-light text-[#D4AF37]">{chapter.number}</span><span className="text-[9px] uppercase tracking-widest text-gray-500 mt-1">Capítulo</span></div>
                    <div className="flex-1 p-4 md:p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg md:text-xl font-semibold text-white">{chapter.title}</h2><p className="text-xs md:text-sm text-gray-500 mt-1">{chapter.description}</p></div><div className="flex items-center gap-3 shrink-0"><span className="text-xs font-bold text-[#D4AF37]">{pct}%</span><ChevronDown size={19} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></div></div>{chapter.items.length > 0 && <div className="mt-3 h-1.5 rounded-full bg-[#26262a] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#9c741b] to-[#FFD85A]" style={{ width: `${pct}%` }} /></div>}</div>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-2 rounded-[20px] border border-[#29292e] bg-[#0c0c0e] p-4 md:p-5 space-y-3">
                    {chapter.items.length === 0 ? <p className="text-sm text-gray-500 py-3">Este capítulo será construído a partir dos indicadores de consistência do trader.</p> : chapter.items.map((item) => {
                      const unlocked = item.current >= item.target;
                      const progress = Math.min(100, item.target > 0 ? (item.current / item.target) * 100 : 0);
                      const ItemIcon = item.icon;
                      return <div key={item.label} className="flex items-center gap-3"><div className={`h-10 w-10 rounded-full border flex items-center justify-center shrink-0 ${unlocked ? 'border-[#D4AF37] bg-[#171208] text-[#D4AF37]' : 'border-[#3b3b40] bg-[#141416] text-gray-600'}`}>{unlocked ? <Check size={17} /> : <Lock size={16} />}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><div className="flex items-center gap-2 min-w-0"><ItemIcon size={15} className={unlocked ? 'text-[#D4AF37]' : 'text-gray-600'} /><span className={`text-sm ${unlocked ? 'text-white' : 'text-gray-400'}`}>{item.label}</span></div><span className={`text-xs shrink-0 ${unlocked ? 'text-[#FFD85A]' : 'text-gray-600'}`}>{Math.round(progress)}%</span></div><div className="mt-2 h-1.5 rounded-full bg-[#26262a] overflow-hidden"><div className={`h-full rounded-full ${unlocked ? 'bg-gradient-to-r from-[#9c741b] to-[#FFD85A]' : 'bg-[#3b3b40]'}`} style={{ width: `${progress}%` }} /></div><p className="text-[10px] text-gray-600 mt-1">{item.current.toLocaleString('pt-BR')} / {item.target.toLocaleString('pt-BR')}</p></div></div>;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <div className="rounded-[22px] border border-[#29292e] bg-[#0c0c0e] px-6 py-5 md:px-8 md:py-6 flex items-center gap-4"><span className="text-5xl leading-none text-[#D4AF37]">“</span><p className="text-sm md:text-base text-gray-400 leading-6">Grandes carreiras são construídas em operações comuns executadas com excelência.</p><span className="ml-auto hidden md:block text-[#D4AF37] italic text-lg">PropControl</span></div>
      </div>
    </div>
  );
}
