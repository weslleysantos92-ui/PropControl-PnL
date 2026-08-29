import { useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronRight, Crown, Flag, Lock, MapPin, Target, Briefcase, Plus, Trophy } from 'lucide-react';
import { useApp } from '@/store';

const TRADE_MILESTONES = [25, 50, 100, 250, 500, 1000];
const APP_DAY_MILESTONES = [30, 90, 180, 365];
const TEN_K_MILESTONES = [1, 2, 3, 4];
const SCALE_MILESTONES = [25, 50, 100, 200, 300, 400];
const PAYOUT_MILESTONES = [10000, 25000, 50000, 100000];
const JOURNEY_START_KEY = 'propcontrol_journey_started_at';

function FamilySilhouette() { return <div className="absolute left-1/2 top-[42%] z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none drop-shadow-[0_0_14px_rgba(255,210,75,.5)]" aria-label="Família" role="img"><svg width="78" height="58" viewBox="0 0 78 58" fill="none"><g fill="#FFE06A"><circle cx="25" cy="12" r="7"/><circle cx="52" cy="12" r="7"/><circle cx="38.5" cy="17" r="5.5"/><path d="M14 48c0-13 5-22 11-22s11 9 11 22H14Z"/><path d="M41 48c0-13 5-22 11-22s11 9 11 22H41Z"/><path d="M29 48c0-10 4-17 9.5-17S48 38 48 48H29Z"/></g></svg></div>; }

function getJourneyStart() { if (typeof window === 'undefined') return null; return window.localStorage.getItem(JOURNEY_START_KEY); }

export function Journey() {
  const { accounts, trades, movements } = useApp();
  const [chapter, setChapter] = useState<string | null>(null);
  const [journeyStartedAt, setJourneyStartedAt] = useState<string | null>(() => getJourneyStart());

  const startJourney = () => {
    if (journeyStartedAt) return;
    const now = new Date().toISOString();
    window.localStorage.setItem(JOURNEY_START_KEY, now);
    setJourneyStartedAt(now);
  };

  const metrics = useMemo(() => {
    const startMs = journeyStartedAt ? Date.parse(journeyStartedAt) : null;
    const journeyTrades = startMs ? trades.filter(t => t.timestamp >= startMs) : [];
    const journeyMovements = startMs ? movements.filter(m => m.timestamp >= startMs) : [];
    const totalTrades = journeyTrades.length;
    const daysUsingJourney = startMs ? Math.max(1, Math.floor((Date.now() - startMs) / 86400000) + 1) : 0;
    const funded = accounts.filter(a => a.status === 'Financiada');
    const totalPayouts = journeyMovements.filter(m => ['saque', 'payout', 'withdrawal'].includes(String(m.type ?? '').toLowerCase())).reduce((s, m) => s + Number(m.amount || 0), 0);
    return { totalTrades, daysUsingJourney, funded, totalPayouts };
  }, [accounts, trades, movements, journeyStartedAt]);

  const scaleCurrent = Math.min(metrics.funded.reduce((s, a) => s + (a.size === '100K' ? 100 : Number(a.size.replace('K', ''))), 0), 400);
  const tenKCount = metrics.funded.filter(a => a.size === '10K').length;
  const scaleLabels = ['25K', '50K', '100K', '2 × 100K', '3 × 100K', '4 × 100K'];

  if (chapter) {
    const title = chapter === 'disciplina' ? 'DISCIPLINA' : chapter === 'conquista' ? 'CONQUISTA' : chapter === 'objetivo' ? 'MEU OBJETIVO' : 'LIBERDADE';
    const subtitle = chapter === 'disciplina' ? 'Construa o hábito. Permaneça no caminho.' : chapter === 'conquista' ? 'Construa sua estrutura. Escale com propósito.' : chapter === 'objetivo' ? 'Transforme um sonho em um objetivo.' : 'Transforme sua jornada em liberdade financeira.';
    return <div className="min-h-screen bg-black text-white px-4 pb-28 md:px-6"><div className="max-w-[720px] mx-auto pt-5"><button onClick={() => setChapter(null)} className="mb-5 flex items-center gap-2 text-gray-400 hover:text-white"><ChevronRight className="rotate-180" size={18}/> Jornada</button><h1 className="text-3xl font-bold">{title}</h1><p className="mt-1 text-gray-400">{subtitle}</p>
      {chapter === 'disciplina' && <div className="mt-8 space-y-8"><Progress title="Trades" current={metrics.totalTrades} target={100}/><Section title="Suas conquistas">{TRADE_MILESTONES.map(t => <Achievement key={t} label={`${t} trades`} done={metrics.totalTrades >= t} detail={metrics.totalTrades >= t ? 'Conquistado' : `Faltam ${Math.max(0, t - metrics.totalTrades)} trades`}/>)}</Section><Section title="Tempo de jornada">{APP_DAY_MILESTONES.map(t => <Achievement key={t} label={`${t} dias`} done={metrics.daysUsingJourney >= t} detail={metrics.daysUsingJourney >= t ? 'Conquistado' : `Faltam ${Math.max(0, t - metrics.daysUsingJourney)} dias`}/>)}</Section></div>}
      {chapter === 'conquista' && <div className="mt-8 space-y-8"><Section title="Contas de 10K">{TEN_K_MILESTONES.map(t => <Achievement key={t} label={`${t} × 10K`} done={tenKCount >= t} detail={tenKCount >= t ? 'Conquistada' : `Faltam ${t - tenKCount} conta${t - tenKCount === 1 ? '' : 's'}`}/>)}</Section><Section title="Escada de escala">{SCALE_MILESTONES.map((t, i) => <Achievement key={t} label={scaleLabels[i]} done={scaleCurrent >= t} detail={scaleCurrent >= t ? 'Conquistada' : 'Bloqueada'}/>)}</Section><div className="rounded-2xl border border-[#29292d] bg-[#080809] p-5"><p className="text-sm text-gray-400">Capital financiado atual</p><p className="text-3xl font-bold mt-1">US$ {scaleCurrent.toLocaleString('en-US')}K</p><p className="text-sm text-gray-400 mt-4">Objetivo</p><p className="text-xl font-semibold">US$ 400.000</p></div></div>}
      {chapter === 'objetivo' && <div className="mt-8 rounded-2xl border border-[#29292d] bg-[#080809] p-6 text-center"><Target className="mx-auto text-[#FFD85A]" size={38}/><h2 className="text-xl font-semibold mt-3">Qual é o seu próximo sonho?</h2><p className="text-sm text-gray-400 mt-2">Defina um objetivo que faça essa jornada valer a pena.</p><button className="mt-5 rounded-xl bg-[#D4AF37] px-5 py-3 font-semibold text-black"><Plus size={17} className="inline mr-2"/>Criar meu objetivo</button></div>}
      {chapter === 'liberdade' && <div className="mt-8 space-y-6"><div className="rounded-2xl border border-[#29292d] bg-[#080809] p-6"><p className="text-sm text-gray-400">Total recebido em payouts</p><p className="text-3xl font-bold mt-1">US$ {metrics.totalPayouts.toLocaleString('en-US')}</p><div className="mt-5 h-2 rounded-full bg-[#242427]"><div className="h-full rounded-full bg-gradient-to-r from-[#A77B18] to-[#FFD85A]" style={{width:`${Math.min(100,(metrics.totalPayouts/100000)*100)}%`}}/></div><p className="text-xs text-gray-500 mt-2">Próxima conquista: US$ {PAYOUT_MILESTONES.find(t => metrics.totalPayouts < t)?.toLocaleString('en-US') ?? '100.000'}</p></div><Section title="Suas conquistas">{PAYOUT_MILESTONES.map(t => <Achievement key={t} label={`US$ ${t.toLocaleString('en-US')}`} done={metrics.totalPayouts >= t} detail={metrics.totalPayouts >= t ? 'Conquistada' : `Faltam US$ ${Math.max(0,t-metrics.totalPayouts).toLocaleString('en-US')}`}/>)}</Section></div>}
    </div></div>;
  }

  const achievements = TRADE_MILESTONES.length + APP_DAY_MILESTONES.length + TEN_K_MILESTONES.length + SCALE_MILESTONES.length + PAYOUT_MILESTONES.length;
  const unlocked = TRADE_MILESTONES.filter(t=>metrics.totalTrades>=t).length + APP_DAY_MILESTONES.filter(t=>metrics.daysUsingJourney>=t).length + TEN_K_MILESTONES.filter(t=>tenKCount>=t).length + SCALE_MILESTONES.filter(t=>scaleCurrent>=t).length + PAYOUT_MILESTONES.filter(t=>metrics.totalPayouts>=t).length;
  const cards = [{id:'disciplina',n:'01',title:'DISCIPLINA',desc:'Construa o hábito. Permaneça no caminho.',icon:Target,progress:`${metrics.totalTrades}/100`},{id:'conquista',n:'02',title:'CONQUISTA',desc:'Construa sua estrutura. Escale com propósito.',icon:Briefcase,progress:`${Math.min(6, SCALE_MILESTONES.filter(t=>scaleCurrent>=t).length)}/6`},{id:'objetivo',n:'03',title:'MEU OBJETIVO',desc:'Seu próximo sonho começa aqui.',icon:Target,progress:'Personalizado'},{id:'liberdade',n:'04',title:'LIBERDADE',desc:'Transforme sua jornada em liberdade financeira.',icon:Crown,progress:`US$ ${metrics.totalPayouts.toLocaleString('en-US')}`}];
  return <div className="min-h-screen bg-black text-white px-3 pb-28 md:px-6"><div className="max-w-[720px] mx-auto pt-3 md:pt-6 space-y-4"><section className="relative overflow-hidden rounded-[26px] border border-[#6d5015]/55 min-h-[390px] bg-[#050504]"><div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_43%,rgba(255,196,47,.34),transparent_20%),radial-gradient(circle_at_48%_72%,rgba(212,175,55,.11),transparent_38%),linear-gradient(180deg,#010101_0%,#0a0906_58%,#020202_100%)]"/><div className="absolute top-[37%] left-[69%] h-7 w-7 rounded-full bg-[#FFD85A] shadow-[0_0_30px_12px_rgba(255,206,69,.28)]"/><FamilySilhouette/><div className="relative z-30 text-center px-4 pt-5"><div className="flex items-center justify-center gap-2"><Crown size={20} className="text-[#D4AF37]"/><h1 className="text-[25px] font-bold">Jornada</h1></div><p className="mt-1 text-sm text-gray-400">Sua evolução, seu legado.</p></div><div className="relative z-30 mt-[145px] px-5"><div className="flex items-end justify-between"><div><MapPin size={42} className="text-[#FFD85A]"/><span className="block mt-1 font-semibold text-[#FFD85A]">Hoje</span></div><div className="text-right"><Flag size={39} className="ml-auto text-[#FFD85A]"/><span className="block mt-1 font-semibold text-[#FFD85A]">Liberdade</span></div></div><p className="mt-3 text-center text-sm text-gray-300 leading-5">Você está construindo um futuro,<br/>uma <span className="text-[#FFD85A] font-semibold">decisão disciplinada</span> de cada vez.</p></div></section><section className="rounded-[22px] border border-[#242428] bg-[#080809] px-4 py-4"><div className="grid grid-cols-2 divide-x divide-[#2b2b2e]"><div className="flex items-center gap-3 pr-4"><Trophy className="text-[#D4AF37]"/><div><p className="text-xs text-gray-400">Conquistas</p><p className="text-[22px] font-semibold">{unlocked} <span className="text-gray-500 text-base">/ {achievements}</span></p></div></div><div className="flex items-center gap-3 pl-4"><CalendarDays className="text-[#D4AF37]"/><div><p className="text-xs text-gray-400">Dias da Jornada</p><p className="text-[22px] font-semibold">{metrics.daysUsingJourney}</p></div></div></div></section><section className="grid grid-cols-1 sm:grid-cols-2 gap-3">{cards.map(c=>{const Icon=c.icon;return <button key={c.id} onClick={()=>setChapter(c.id)} className="text-left rounded-[22px] border border-[#29292d] bg-[#080809] p-5 hover:border-[#D4AF37]/70 transition"><div className="flex items-start justify-between"><span className="text-3xl text-[#E3B82E]">{c.n}</span><Icon className="text-[#FFD85A]"/></div><h2 className="mt-4 text-lg font-semibold">{c.title}</h2><p className="mt-1 text-xs text-gray-400 min-h-8">{c.desc}</p><div className="mt-4 flex items-center justify-between text-xs"><span className="text-[#FFD85A]">{c.progress}</span><ChevronRight size={17} className="text-gray-500"/></div></button>})}</section>{!journeyStartedAt && <button onClick={startJourney} className="w-full rounded-[22px] border border-[#D4AF37]/50 bg-[#0b0b0b] px-5 py-4 font-semibold text-[#FFD85A]">Começar minha Jornada</button>}</div></div>;
}

function Section({title,children}:{title:string;children:React.ReactNode}){return <section><h2 className="text-lg font-semibold mb-3">{title}</h2><div className="rounded-2xl border border-[#29292d] bg-[#080809] p-4 space-y-2">{children}</div></section>}
function Achievement({label,done,detail}:{label:string;done:boolean;detail:string}){return <div className="flex items-center gap-3 py-3"><div className={`h-9 w-9 rounded-full border flex items-center justify-center ${done?'border-[#D4AF37] bg-[#171208] text-[#FFD85A]':'border-[#3b3b40] text-gray-600'}`}>{done?<Check size={15}/>:<Lock size={14}/>}</div><div className="flex-1"><p className="text-sm font-medium">{label}</p><p className="text-xs text-gray-500">{detail}</p></div></div>}
function Progress({title,current,target}:{title:string;current:number;target:number}){const p=Math.min(100,(current/target)*100);return <div className="rounded-2xl border border-[#29292d] bg-[#080809] p-5"><div className="flex justify-between"><span>{title}</span><span className="text-[#FFD85A]">{current} / {target}</span></div><div className="mt-3 h-2 rounded-full bg-[#242427]"><div className="h-full rounded-full bg-gradient-to-r from-[#A77B18] to-[#FFD85A]" style={{width:`${p}%`}}/></div></div>}
