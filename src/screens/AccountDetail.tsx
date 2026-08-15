import { useState } from 'react';
import { ArrowLeft, Trash2, AlertTriangle, TrendingUp, Shield, Target, CalendarDays, Wallet, Gauge, CircleDollarSign, Crown, Check } from 'lucide-react';
import { useApp } from '@/store';
import type { Account, Trade, AccountStatus } from '@/types';
import { ACCOUNT_STATUSES } from '@/types';
import { formatCurrency, formatSignedCurrency, formatDateTime } from '@/dates';

const PNL_RULES: Record<string, { capital:number; target:number; drawdown:number; floor:number; daily:number }> = {
  '25K': { capital:25000, target:1500, drawdown:1500, floor:23500, daily:750 },
  '50K': { capital:50000, target:3000, drawdown:3000, floor:47000, daily:1500 },
  '100K': { capital:100000, target:6000, drawdown:6000, floor:94000, daily:3000 },
  '150K': { capital:150000, target:9000, drawdown:9000, floor:141000, daily:4500 },
};

export function AccountDetail({ accountId, onBack }: { accountId:string; onBack:()=>void }) {
  const { accounts, trades, setAccountStatus, deleteAccount } = useApp();
  const [confirmDelete,setConfirmDelete]=useState(false);
  const account=accounts.find(a=>a.id===accountId);
  if(!account) return <div className="p-6 text-white"><button onClick={onBack}>Voltar</button><p className="mt-4 text-gray-500">Conta não encontrada.</p></div>;
  const accountTrades=trades.filter(t=>t.accountId===accountId);
  return <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
    <main className="max-w-6xl mx-auto px-5 py-6 space-y-5">
      <button onClick={onBack} className="mb-1 w-10 h-10 rounded-xl bg-[#15151B] border border-[#2B2B34] grid place-items-center hover:border-[#D4AF37]"><ArrowLeft size={18}/></button>
      <PremiumCard account={account}/>
      <RiskPanel account={account} trades={accountTrades}/>
      <Performance trades={accountTrades}/>
      <StatusPanel account={account} onChange={s=>setAccountStatus(accountId,s)}/>
      <TradeHistory trades={accountTrades}/>
      <button aria-label="Excluir conta" onClick={()=>setConfirmDelete(true)} className="mx-auto block p-3 rounded-full text-gray-600 hover:text-red-400 hover:bg-red-500/5"><Trash2 size={19}/></button>
    </main>
    {confirmDelete&&<div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4"><div className="w-full max-w-md rounded-3xl bg-[#15151B] border border-[#2B2B34] p-6"><AlertTriangle className="text-red-400 mb-3"/><h3 className="text-lg font-bold">Excluir conta?</h3><p className="text-sm text-gray-500 mt-1 mb-5">A conta e seus trades serão removidos.</p><button onClick={()=>{deleteAccount(accountId);onBack()}} className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-bold mb-2">Sim, excluir conta</button><button onClick={()=>setConfirmDelete(false)} className="w-full py-3.5 rounded-2xl bg-[#22222A] text-white">Cancelar</button></div></div>}
  </div>;
}

function PremiumCard({account}:{account:Account}){const funded=account.status==='Financiada';return <section className="pc-primary-card relative overflow-hidden rounded-3xl border border-[#5A4816] bg-gradient-to-br from-[#17140B] via-[#0F0F12] to-[#09090A] p-6 shadow-[0_0_35px_rgba(212,175,55,.08)]"><div className="absolute -inset-x-1/2 top-0 h-px bg-gradient-to-r from-transparent via-[#FFE58A] to-transparent animate-pulse"/><div className="relative flex items-center gap-4"><div className="h-14 w-14 rounded-full border border-[#D4AF37]/50 bg-black/30 grid place-items-center text-[#D4AF37]"><Crown size={26}/></div><div className="min-w-0 flex-1"><p className="text-2xl md:text-3xl font-black truncate">{account.name}</p><p className="text-sm text-gray-500 mt-1">PnL Global • {account.size}</p></div><span className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-bold ${funded?'border-emerald-400/30 bg-emerald-400/10 text-emerald-400':'border-blue-500/30 bg-blue-500/10 text-blue-400'}`}>• {funded?'FUNDED PRO':'CHALLENGE'}</span></div></section>}

function RiskPanel({account,trades}:{account:Account;trades:Trade[]}){
  const r=PNL_RULES[account.size]||PNL_RULES['25K'];
  const pnl=trades.reduce((s,t)=>s+t.amount,0);
  const balance=r.capital+pnl;
  const marginRemaining=Math.max(0,balance-r.floor);
  const lossUsed=Math.max(0,-pnl);
  const funded=account.status==='Financiada';
  const positiveDays=new Set(trades.filter(t=>t.amount>0).map(t=>new Date(t.timestamp).toDateString())).size;
  const dayTotals=trades.reduce<Record<string,number>>((m,t)=>{const d=new Date(t.timestamp).toDateString();m[d]=(m[d]||0)+t.amount;return m},{});
  const maxDay=Math.max(0,...Object.values(dayTotals));
  const challengeConsistency=r.target>0?maxDay/r.target*100:0;
  const availableForPayout=Math.max(0,pnl-r.drawdown);
  const proConsistency=availableForPayout>0?maxDay/availableForPayout*100:0;
  const riskPct=Math.min(100,lossUsed/r.drawdown*100);
  const progressPct=funded?Math.min(100,Math.max(0,pnl/r.drawdown*100)):Math.min(100,Math.max(0,pnl/r.target*100));
  const cushionPct=funded?Math.min(100,Math.max(0,pnl)/r.drawdown*100):0;
  const excessPct=funded&&pnl>r.drawdown?Math.min(100,(pnl-r.drawdown)/r.drawdown*100):0;
  const consistencyOk=(funded?proConsistency:challengeConsistency)<=(funded?50:50)&&(funded?availableForPayout:1)>0;
  return <section className="pc-primary-card rounded-3xl border border-[#27272F] bg-[#111116] p-5 md:p-6">
    <div className="flex items-center justify-between gap-3 mb-5"><div><h3 className="font-bold text-lg">Margem de Risco e Metas</h3><p className="text-xs text-gray-500 mt-1">Drawdown máximo estático</p></div></div>

    <div className="mb-2 flex items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Saldo atual</span><span className="text-base font-black text-white">{formatCurrency(balance)}</span></div>
    <div className="relative h-14 rounded-2xl bg-[#17171D] border border-[#303039] overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,.5)]">
      <div className="absolute inset-y-0 left-1/2 w-px bg-[#777]/60 z-20"/>
      <div className="absolute inset-y-2 left-1/2 rounded-l-xl bg-gradient-to-l from-red-500/80 to-red-600/40 transition-all duration-500" style={{width:`${riskPct/2}%`,transform:'translateX(-100%)'}}/>
      {!funded?<div className="absolute inset-y-2 left-1/2 rounded-r-xl bg-gradient-to-r from-blue-500/70 to-blue-400/40 transition-all duration-500" style={{width:`${progressPct/2}%`}}/>:<><div className="absolute inset-y-2 left-1/2 rounded-r-xl bg-gradient-to-r from-emerald-500/80 to-emerald-400/45 transition-all duration-500" style={{width:`${cushionPct/2}%`}}/>{excessPct>0&&<div className="absolute inset-y-2 bg-gradient-to-r from-[#A98719] via-[#D4AF37] to-[#FFE58A] transition-all duration-700 animate-[pulse_2.8s_ease-in-out_infinite]" style={{left:`${50+cushionPct/2}%`,width:`${excessPct/2}%`,boxShadow:'0 0 18px rgba(212,175,55,.55)'}}/>}</>}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/10 via-transparent to-black/10"/>
    </div>
    <div className="grid grid-cols-2 gap-4 mt-3 text-xs"><div><span className="text-gray-500">Margem disponível</span><p className="font-bold text-red-300">{formatCurrency(marginRemaining)}</p></div><div className="text-right"><span className="text-gray-500">{funded?'Lucro real sacável':'Distância até o Alvo'}</span><p className="font-bold text-[#D4AF37]">{funded?formatCurrency(Math.max(0,pnl-r.drawdown)):formatCurrency(Math.max(0,r.target-pnl))}</p></div></div>
    {funded&&<div className="grid grid-cols-3 gap-2 mt-3 text-[10px] uppercase tracking-wider"><span className="text-red-300">Drawdown</span><span className="text-center text-emerald-300">Colchão</span><span className="text-right text-[#D4AF37]">Lucro sacável</span></div>}
    <div className="mt-5 grid sm:grid-cols-2 gap-3"><Info label="Meta / Colchão" value={formatCurrency(r.target)} icon={Target}/><Info label="Drawdown Total" value={formatCurrency(r.drawdown)} icon={Shield}/>{funded&&<Info label="Limite de Perda Diária" value={`-${formatCurrency(r.daily)}`} icon={AlertTriangle}/>}<Info label="Dias Positivos" value={`${positiveDays} / 5`} icon={CalendarDays}/></div>
    <div className="mt-4 rounded-2xl border border-[#27272F] bg-[#0D0D11] p-4"><div className="flex items-center justify-between gap-3"><span className="text-xs text-gray-400">Consistência · 50%</span><span className={`text-xs font-bold ${consistencyOk?'text-emerald-400':'text-amber-400'}`}>{consistencyOk?<><Check size={14} className="inline mr-1"/>Dentro da regra</>:<>● Concentração Alta. Opere mais dias para diluir.</>}</span></div><p className="text-[11px] text-gray-600 mt-2">Maior dia: {formatCurrency(maxDay)} · {funded?'Base disponível para saque: '+formatCurrency(availableForPayout):'Meta: '+formatCurrency(r.target)}</p></div>
  </section>
}
function Info({label,value,icon:Icon}:{label:string;value:string;icon:any}){return <div className="pc-stat-card rounded-2xl border border-[#27272F] bg-[#0E0E12] p-3"><div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-gray-600"><Icon size={14}/>{label}</div><p className="mt-2 text-sm font-bold text-white">{value}</p></div>}
function Performance({trades}:{trades:Trade[]}){const pnl=trades.reduce((s,t)=>s+t.amount,0);const takes=trades.filter(t=>t.result==='Take').length;const stops=trades.filter(t=>t.result==='Stop').length;const bes=trades.filter(t=>t.result==='BE').length;return <section><h3 className="text-lg font-bold mb-3">Resultados e Performance</h3><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Stat label="Resultado Líquido" value={formatSignedCurrency(pnl)} cls={pnl>=0?'text-emerald-400':'text-red-400'} icon={Wallet}/><Stat label="Takes" value={String(takes)} cls="text-emerald-400" icon={TrendingUp}/><Stat label="Stops" value={String(stops)} cls="text-red-400" icon={Shield}/><Stat label="Break Evens" value={String(bes)} cls="text-gray-300" icon={CircleDollarSign}/></div></section>}
function Stat({label,value,cls,icon:Icon}:{label:string;value:string;cls:string;icon:any}){return <div className="pc-stat-card min-h-[104px] rounded-2xl border border-[#27272F] bg-[#121217] p-5"><div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{label}</span><Icon size={16} className="text-gray-600"/></div><p className={`mt-4 text-xl font-black ${cls}`}>{value}</p></div>}
function StatusPanel({account,onChange}:{account:Account;onChange:(s:AccountStatus)=>void}){return <section className="rounded-3xl border border-[#27272F] bg-[#111116] p-5"><div className="flex items-center gap-2 mb-4"><Gauge size={17} className="text-[#D4AF37]"/><h3 className="font-bold">Status da conta</h3></div><div className="grid grid-cols-3 gap-2">{ACCOUNT_STATUSES.map(s=><button key={s} onClick={()=>onChange(s)} className={`py-3 rounded-xl border text-xs font-bold ${account.status===s?'bg-[#D4AF37] text-black border-[#D4AF37]':'bg-[#15151B] text-gray-500 border-[#27272F]'}`}>{s==='Avaliacao'?'Challenge':s==='Financiada'?'Funded Pro':s}</button>)}</div></section>}
function TradeHistory({trades}:{trades:Trade[]}){const {deleteTrade}=useApp();const sorted=[...trades].sort((a,b)=>b.timestamp-a.timestamp);return <section><div className="mb-3"><h3 className="text-lg font-bold">Histórico de Trades</h3><p className="text-xs text-gray-500">{trades.length} registros desta conta</p></div>{sorted.length===0?<div className="rounded-2xl border border-dashed border-[#303039] p-8 text-center text-gray-600">Nenhum trade registrado.</div>:<div className="space-y-2">{sorted.map(t=><div key={t.id} className="rounded-2xl border border-[#27272F] bg-[#121217] p-4 flex items-center gap-3"><div className={`h-10 w-10 rounded-full grid place-items-center shrink-0 ${t.result==='Take'?'bg-emerald-400/10 text-emerald-400':t.result==='Stop'?'bg-red-400/10 text-red-400':'bg-gray-500/10 text-gray-400'}`}>{t.result==='Take'?<TrendingUp size={17}/>:t.result==='Stop'?<Shield size={17}/>:<CircleDollarSign size={17}/>}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-sm font-bold truncate">{t.asset}</span><span className="text-[10px] text-gray-500">{t.result}</span></div><p className="text-xs text-gray-600 mt-1">{formatDateTime(t.timestamp)} · {t.context} · {t.timeframe}</p></div><div className={`text-sm font-black ${t.amount>=0?'text-emerald-400':'text-red-400'}`}>{formatSignedCurrency(t.amount)}</div></div>)}</div>}</section>}
