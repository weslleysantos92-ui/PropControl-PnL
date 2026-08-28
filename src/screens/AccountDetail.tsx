import { ArrowLeft, Trash2, AlertTriangle, TrendingUp, Shield, Target, CalendarDays, Wallet, Gauge, CircleDollarSign, Crown, Check } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/store';
import type { Account, Trade, AccountStatus } from '@/types';
import { ACCOUNT_STATUSES, PNL_RULES } from '@/types';
import { FUNDING_PIPS_RULES, getFundingPipsProfitConcentrationLimit, getFundingPipsProfitableDayMinimum } from '@/fundingPips2StepFlex';
import { formatCurrency, formatSignedCurrency, formatDateTime } from '@/dates';

export function AccountDetail({ accountId, onBack, onRegisterTrade }: { accountId: string; onBack: () => void; onRegisterTrade: (id: string) => void }) {
  const { accounts, trades, setAccountStatus, deleteAccount } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const account = accounts.find(a => a.id === accountId);
  if (!account) return <div className="p-6 text-white"><button onClick={onBack}>Voltar</button><p className="mt-4 text-gray-500">Conta não encontrada.</p></div>;
  const accountTrades = trades.filter(t => t.accountId === accountId);
  const currentPhase = account.status === 'Avaliacao' ? (account.phase === 2 ? 2 : 1) : 0;
  const currentPhaseTrades = accountTrades.filter(t => (t.phase ?? 1) === currentPhase);
  return <div className="min-h-screen bg-[#0B0B0D] text-white pb-24">
    <main className="max-w-6xl mx-auto px-5 py-6 space-y-5">
      <button onClick={onBack} className="mb-1 w-10 h-10 rounded-xl bg-[#15151B] border border-[#2B2B34] grid place-items-center hover:border-[#D4AF37]"><ArrowLeft size={18}/></button>
      <PremiumCard account={account}/>
      <RiskPanel account={account} trades={currentPhaseTrades}/>
      <Performance trades={currentPhaseTrades}/>
      <StatusPanel account={account} onChange={s => setAccountStatus(accountId, s)}/>
      <TradeHistory trades={accountTrades}/>
      <button onClick={() => onRegisterTrade(accountId)} className="mx-auto flex items-center justify-center gap-3 rounded-2xl border border-[#D4AF37]/50 bg-gradient-to-r from-[#8E6B12] via-[#D4AF37] to-[#9A7617] px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-black shadow-[0_8px_25px_rgba(212,175,55,.18)] transition hover:brightness-110 active:scale-[0.99]"><CircleDollarSign size={18}/>Registrar Trade</button>
      <button aria-label="Excluir conta" onClick={() => setConfirmDelete(true)} className="mx-auto block p-3 rounded-full text-gray-600 hover:text-red-400 hover:bg-red-500/5"><Trash2 size={19}/></button>
    </main>
    {confirmDelete && <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4"><div className="w-full max-w-md rounded-3xl bg-[#15151B] border border-[#2B2B34] p-6"><AlertTriangle className="text-red-400 mb-3"/><h3 className="text-lg font-bold">Excluir conta?</h3><p className="text-sm text-gray-500 mt-1 mb-5">A conta e seus trades serão removidos.</p><button onClick={() => { deleteAccount(accountId); onBack(); }} className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-bold mb-2">Sim, excluir conta</button><button onClick={() => setConfirmDelete(false)} className="w-full py-3.5 rounded-2xl bg-[#22222A] text-white">Cancelar</button></div></div>}
  </div>;
}

function PremiumCard({ account }: { account: Account }) {
  const funded = account.status === 'Financiada';
  return <section className="pc-primary-card relative overflow-hidden rounded-3xl border border-[#5A4816] bg-gradient-to-br from-[#17140B] via-[#0F0F12] to-[#09090A] p-6 shadow-[0_0_35px_rgba(212,175,55,.08)]"><div className="absolute -inset-x-1/2 top-0 h-px bg-gradient-to-r from-transparent via-[#FFE58A] to-transparent animate-pulse"/><div className="relative flex items-center gap-4"><div className="h-14 w-14 rounded-full border border-[#D4AF37]/50 bg-black/30 grid place-items-center text-[#D4AF37]"><Crown size={26}/></div><div className="min-w-0 flex-1"><p className="text-2xl md:text-3xl font-black truncate">{account.name}</p><p className="text-sm text-gray-500 mt-1">FundingPips • {account.size}</p></div><span className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-bold ${funded ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400' : 'border-blue-500/30 bg-blue-500/10 text-blue-400'}`}>• {funded ? 'MASTER' : account.phase === 2 ? 'FASE 2' : 'FASE 1'}</span></div></section>;
}

function RiskPanel({ account, trades }: { account: Account; trades: Trade[] }) {
  const r = PNL_RULES[account.size];
  const capital = r?.capital ?? 0;
  const phase = account.status === 'Avaliacao' && account.phase === 2 ? 2 : account.status === 'Avaliacao' ? 1 : 0;
  const target = phase === 2 ? r.phase2Target : phase === 1 ? r.phase1Target : 0;
  const drawdown = r?.maxLoss ?? 0;
  const pnl = trades.reduce((s, t) => s + t.amount, 0);
  const balance = capital + pnl;
  const floor = capital - drawdown;
  const lossUsed = Math.max(0, -pnl);
  const riskPct = drawdown > 0 ? Math.min(100, lossUsed / drawdown * 100) : 0;
  const progressPct = target > 0 ? Math.min(100, Math.max(0, pnl / target * 100)) : 0;
  const profitableDayMinimum = getFundingPipsProfitableDayMinimum(capital);
  const dayTotals = trades.reduce<Record<string, number>>((m, t) => { const d = new Date(t.timestamp).toDateString(); m[d] = (m[d] || 0) + t.amount; return m; }, {});
  const profitableDays = Object.values(dayTotals).filter(v => v >= profitableDayMinimum).length;
  const maxDay = Math.max(0, ...Object.values(dayTotals));
  const concentrationLimit = getFundingPipsProfitConcentrationLimit(capital);
  const concentrationPct = concentrationLimit === null || target <= 0 ? null : (maxDay / target) * 100;
  const concentrationExceeded = concentrationPct !== null && concentrationPct > concentrationLimit;
  const marginRemaining = Math.max(0, balance - floor);
  const targetRemaining = Math.max(0, target - pnl);
  const withinDrawdown = pnl > -drawdown;

  return <section className="pc-primary-card rounded-3xl border border-[#27272F] bg-[#111116] p-5 md:p-6">
    <div className="flex items-center justify-between gap-3 mb-5"><div><h3 className="font-bold text-lg">Margem de Risco e Metas</h3><p className="text-xs text-gray-500 mt-1">Drawdown estático · {FUNDING_PIPS_RULES.maxOverallLossPct}%</p></div></div>
    <div className="mb-2 flex items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Saldo atual da fase</span><span className="text-base font-black text-white">{formatCurrency(balance)}</span></div>
    <div className="relative h-14 rounded-2xl bg-[#17171D] border border-[#303039] overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,.5)]"><div className="absolute inset-y-0 left-1/2 w-px bg-[#777]/60 z-20"/><div className="absolute inset-y-2 left-1/2 rounded-l-xl bg-gradient-to-l from-red-500/80 to-red-600/40 transition-all duration-500" style={{ width: `${riskPct / 2}%`, transform: 'translateX(-100%)' }}/><div className="absolute inset-y-2 left-1/2 rounded-r-xl bg-gradient-to-r from-blue-500/70 to-blue-400/40 transition-all duration-500" style={{ width: `${progressPct / 2}%` }}/></div>
    <div className="grid grid-cols-2 gap-4 mt-3 text-xs"><div><span className="text-gray-500">Margem até o limite</span><p className="font-bold text-red-300">{formatCurrency(marginRemaining)}</p></div><div className="text-right"><span className="text-gray-500">Distância até a meta</span><p className="font-bold text-[#D4AF37]">{formatCurrency(targetRemaining)}</p></div></div>
    <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3"><Info label={phase === 0 ? 'Meta' : `Meta Fase ${phase}`} value={phase === 0 ? '—' : formatCurrency(target)} icon={Target}/><Info label="Drawdown Estático" value={`-${formatCurrency(drawdown)}`} icon={Shield}/><Info label="Dias Lucrativos" value={`${profitableDays} / ${FUNDING_PIPS_RULES.minimumProfitableDays}`} icon={CalendarDays}/><Info label="Dia Mínimo" value={formatCurrency(profitableDayMinimum)} icon={CircleDollarSign}/></div>
    {concentrationLimit !== null && phase !== 0 && <div className={`mt-4 rounded-2xl border p-4 ${concentrationExceeded ? 'border-amber-400/25 bg-amber-400/[0.05]' : 'border-emerald-400/20 bg-emerald-400/[0.04]'}`}><div className="flex items-center justify-between gap-3"><span className="text-xs text-gray-400">Profit Concentration · {concentrationLimit}%</span><span className={`text-xs font-bold ${concentrationExceeded ? 'text-amber-300' : 'text-emerald-400'}`}>{concentrationExceeded ? <>⚠ Concentração acima do limite</> : <><Check size={14} className="inline mr-1"/>Dentro do limite</>}</span></div><p className="text-[11px] text-gray-600 mt-2">Maior dia: {formatCurrency(maxDay)} · {concentrationPct === null ? '' : `${concentrationPct.toFixed(1)}% da meta da fase`}</p>{concentrationExceeded && <p className="text-[11px] text-amber-200/70 mt-2">Aviso de acompanhamento. Ultrapassar {concentrationLimit}% não reprova nem viola a conta; o indicador serve apenas para você acompanhar a concentração dos lucros.</p>}</div>}
    {!withinDrawdown && <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/[0.06] p-4 text-xs text-red-300">A perda acumulada ultrapassou o drawdown estático configurado para esta conta.</div>}
  </section>;
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon: any }) { return <div className="pc-stat-card rounded-2xl border border-[#27272F] bg-[#0E0E12] p-3"><div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-gray-600"><Icon size={14}/>{label}</div><p className="mt-2 text-sm font-bold text-white">{value}</p></div>; }
function Performance({ trades }: { trades: Trade[] }) { const pnl = trades.reduce((s, t) => s + t.amount, 0); const takes = trades.filter(t => t.result === 'Take').length; const stops = trades.filter(t => t.result === 'Stop').length; const bes = trades.filter(t => t.result === 'BE').length; return <section><h3 className="text-lg font-bold mb-3">Resultados e Performance</h3><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Stat label="Resultado Líquido" value={formatSignedCurrency(pnl)} cls={pnl >= 0 ? 'text-emerald-400' : 'text-red-400'} icon={Wallet}/><Stat label="Takes" value={String(takes)} cls="text-emerald-400" icon={TrendingUp}/><Stat label="Stops" value={String(stops)} cls="text-red-400" icon={Shield}/><Stat label="Break Evens" value={String(bes)} cls="text-gray-300" icon={CircleDollarSign}/></div></section>; }
function Stat({ label, value, cls, icon: Icon }: { label: string; value: string; cls: string; icon: any }) { return <div className="pc-stat-card min-h-[104px] rounded-2xl border border-[#27272F] bg-[#121217] p-5"><div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{label}</span><Icon size={16} className="text-gray-600"/></div><p className={`mt-4 text-xl font-black ${cls}`}>{value}</p></div>; }
function StatusPanel({ account, onChange }: { account: Account; onChange: (s: AccountStatus) => void }) { return <section className="rounded-3xl border border-[#27272F] bg-[#111116] p-5"><div className="flex items-center gap-2 mb-4"><Gauge size={17} className="text-[#D4AF37]"/><h3 className="font-bold">Status da conta</h3></div><div className="grid grid-cols-3 gap-2">{ACCOUNT_STATUSES.map(s => <button key={s} onClick={() => onChange(s)} className={`py-3 rounded-xl border text-xs font-bold ${account.status === s ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-[#15151B] text-gray-500 border-[#27272F]'}`}>{s === 'Avaliacao' ? 'Challenge' : s === 'Financiada' ? 'Master' : s}</button>)}</div></section>; }
function TradeHistory({ trades }: { trades: Trade[] }) { const { deleteTrade } = useApp(); const sorted = [...trades].sort((a, b) => b.timestamp - a.timestamp); const confirmDelete = (id: string) => { if (window.confirm('Excluir este trade? Os indicadores da conta serão recalculados.')) deleteTrade(id); }; return <section><div className="mb-3"><h3 className="text-lg font-bold">Histórico de Trades</h3><p className="text-xs text-gray-500">{trades.length} registros desta conta</p></div>{sorted.length === 0 ? <div className="rounded-2xl border border-dashed border-[#303039] p-8 text-center text-gray-600">Nenhum trade registrado.</div> : <div className="space-y-2">{sorted.map(t => <div key={t.id} className="rounded-2xl border border-[#27272F] bg-[#121217] p-4 flex items-start gap-3"><div className={`h-10 w-10 rounded-full grid place-items-center shrink-0 ${t.result === 'Take' ? 'bg-emerald-400/10 text-emerald-400' : t.result === 'Stop' ? 'bg-red-400/10 text-red-400' : 'bg-gray-500/10 text-gray-400'}`}>{t.result === 'Take' ? <TrendingUp size={17}/> : t.result === 'Stop' ? <Shield size={17}/> : <CircleDollarSign size={17}/>}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-sm font-bold truncate">{t.asset}</span><span className="text-[10px] text-gray-500">{t.result}</span><span className="text-[9px] text-gray-600">F{t.phase ?? 1}</span></div><p className="text-xs text-gray-600 mt-1">{formatDateTime(t.timestamp)} · {t.context} · {t.timeframe}</p>{t.note && <p className="mt-2 rounded-xl border border-[#25252D] bg-[#0D0D11] px-3 py-2 text-xs leading-5 text-[#A7A7AE] break-words"><span className="font-bold text-[#D4AF37]">Obs.:</span> {t.note}</p>}</div><div className="flex shrink-0 items-center gap-2"><div className={`text-sm font-black ${t.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatSignedCurrency(t.amount)}</div><button type="button" aria-label={`Excluir trade ${t.asset}`} onClick={() => confirmDelete(t.id)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-gray-600 transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"><Trash2 size={16}/></button></div></div>)}</div>}</section>; }
