import { ArrowLeft, Trash2, AlertTriangle, TrendingUp, Shield, Target, CalendarDays, Wallet, Gauge, CircleDollarSign, Crown, Check, Info as InfoIcon } from 'lucide-react';
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
  return <div className="min-h-screen bg-[#050506] text-white pb-24">
    <main className="max-w-6xl mx-auto px-4 md:px-5 py-5 md:py-6 space-y-4 md:space-y-5">
      <button onClick={onBack} className="mb-1 w-10 h-10 rounded-xl bg-[#101012] border border-[#3A3118] grid place-items-center text-[#D4AF37] hover:border-[#D4AF37] transition"><ArrowLeft size={18}/></button>
      <PremiumCard account={account}/>
      <RiskPanel account={account} trades={currentPhaseTrades}/>
      <Performance trades={currentPhaseTrades}/>
      <TradeHistory trades={accountTrades}/>
      <StatusPanel account={account} onChange={s => setAccountStatus(accountId, s)}/>
      <button onClick={() => onRegisterTrade(accountId)} className="mx-auto flex items-center justify-center gap-3 rounded-2xl border border-[#D4AF37]/60 bg-gradient-to-r from-[#7C5D0D] via-[#D4AF37] to-[#8A6811] px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-black shadow-[0_8px_25px_rgba(212,175,55,.14)] transition hover:brightness-110 active:scale-[0.99]"><CircleDollarSign size={18}/>Registrar Trade</button>
      <button aria-label="Excluir conta" onClick={() => setConfirmDelete(true)} className="mx-auto block p-3 rounded-full border border-[#D4AF37]/40 bg-[#0D0D0F] text-[#D4AF37] hover:text-red-400 hover:border-red-400/50 transition"><Trash2 size={19}/></button>
    </main>
    {confirmDelete && <div className="fixed inset-0 z-50 bg-black/75 grid place-items-center p-4"><div className="w-full max-w-md rounded-3xl bg-[#111113] border border-[#3A3118] p-6"><AlertTriangle className="text-red-400 mb-3"/><h3 className="text-lg font-bold">Excluir conta?</h3><p className="text-sm text-gray-500 mt-1 mb-5">A conta e seus trades serão removidos.</p><button onClick={() => { deleteAccount(accountId); onBack(); }} className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-bold mb-2">Sim, excluir conta</button><button onClick={() => setConfirmDelete(false)} className="w-full py-3.5 rounded-2xl bg-[#222225] text-white">Cancelar</button></div></div>}
  </div>;
}

function PremiumCard({ account }: { account: Account }) {
  const funded = account.status === 'Financiada';
  return <section className="relative overflow-hidden rounded-[26px] border border-[#D4AF37]/70 bg-[radial-gradient(circle_at_78%_35%,rgba(212,175,55,.14),transparent_27%),linear-gradient(115deg,#15120A,#0D0D0F_55%,#070708)] p-5 md:p-6 shadow-[0_0_30px_rgba(212,175,55,.07)]">
    <div className="absolute right-[-10%] top-[-80%] h-[240%] w-[55%] rotate-[24deg] bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent blur-2xl pointer-events-none"/>
    <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#FFE58A] to-transparent"/>
    <div className="relative flex items-center gap-4 md:gap-5">
      <div className="h-16 w-16 md:h-20 md:w-20 shrink-0 rounded-full border border-[#D4AF37] bg-[#080808]/70 grid place-items-center text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,.12)]"><Crown size={30} strokeWidth={1.5}/></div>
      <div className="min-w-0 flex-1"><p className="text-2xl md:text-4xl font-black tracking-tight truncate">{account.name}</p><p className="text-sm md:text-base text-[#A8A8AD] mt-1">FundingPips • {account.size}</p><span className={`inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 rounded-full border text-xs md:text-sm font-bold ${funded ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-400' : 'border-blue-500/45 bg-blue-500/15 text-blue-300'}`}><span className="text-[10px]">●</span>{funded ? 'MASTER' : account.phase === 2 ? 'FASE 2' : 'FASE 1'}</span></div>
    </div>
  </section>;
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

  return <section className="overflow-hidden rounded-[26px] border border-[#3A3118] bg-[linear-gradient(135deg,#101012,#09090A)] shadow-[0_8px_30px_rgba(0,0,0,.25)]">
    <div className="px-5 md:px-6 pt-5 md:pt-6"><h3 className="text-lg md:text-xl font-bold uppercase tracking-[0.06em] text-[#E5BF4A]">Margem de Risco</h3></div>
    <div className="px-5 md:px-8 pt-5 pb-4">
      <div className="grid grid-cols-3 items-end gap-2 md:gap-8 text-center">
        <div><span className="text-xs md:text-sm font-medium text-red-400">Margem Restante</span><p className="text-xl md:text-3xl font-black text-red-500 mt-1">-{formatCurrency(marginRemaining)}</p><span className="text-[11px] md:text-sm text-[#A1A1A6]">até o piso de ruína</span></div>
        <div><span className="text-xs md:text-sm text-[#D0D0D3]">Resultado Atual</span><div className={`mx-auto mt-1 w-fit rounded-xl border border-[#5A5A60] bg-[#0D0D0F] px-4 md:px-6 py-2 text-xl md:text-2xl font-black shadow-[0_0_18px_rgba(255,255,255,.04)] ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatSignedCurrency(pnl)}</div></div>
        <div><span className="text-xs md:text-sm font-medium text-blue-400">Alvo da Meta</span><p className="text-xl md:text-3xl font-black text-blue-500 mt-1">{formatCurrency(target)}</p><span className="text-[11px] md:text-sm text-[#A1A1A6]">{phase === 0 ? 'Master' : 'para conclusão'}</span></div>
      </div>

      <div className="mt-6">
        <div className="relative h-9 md:h-10 rounded-full border border-[#36363B] bg-[#17171A] overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,.7)]">
          <div className="absolute inset-y-0 left-1/2 w-1/2 overflow-hidden"><div className="absolute inset-y-0 right-0 w-full bg-gradient-to-l from-red-950/40 via-red-500/80 to-red-300/80" style={{ width: `${Math.max(0, riskPct)}%` }}/></div>
          <div className="absolute inset-y-0 left-1/2 w-1/2 overflow-hidden"><div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500/90 via-blue-600/80 to-blue-950/30" style={{ width: `${Math.max(0, progressPct)}%` }}/></div>
          <div className="absolute inset-y-0 left-1/2 w-px bg-white/60 z-20"/>
          <div className={`absolute top-1/2 z-30 h-7 w-7 md:h-8 md:w-8 rounded-full border border-[#FFE58A] bg-[#F4C93D] shadow-[0_0_16px_rgba(244,201,61,.7)] -translate-y-1/2 -translate-x-1/2`} style={{ left: `${50 + (progressPct - riskPct) / 2}%` }}/>
        </div>
        <div className="grid grid-cols-3 mt-2 text-[11px] md:text-sm text-[#B9B9BD]"><span className="text-left">-{formatCurrency(drawdown)}</span><span className="text-center font-bold text-white">0</span><span className="text-right">+{formatCurrency(target)}</span></div>
      </div>

      <div className="flex justify-center gap-6 md:gap-12 mt-4 text-xs md:text-sm"><span className="inline-flex items-center gap-2 text-[#B8B8BD]"><span className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,.5)]"/>Risco (Drawdown)</span><span className="inline-flex items-center gap-2 text-[#B8B8BD]"><span className="h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,.5)]"/>Progresso da Meta {phase !== 0 ? '(Challenge)' : ''}</span></div>
    </div>

    <div className="border-t border-[#2C2C30]">
      <div className="flex items-center gap-3 px-5 md:px-7 py-4 border-b border-[#2C2C30]">
        <div className="h-9 w-9 rounded-full border border-blue-500/60 bg-blue-500/10 grid place-items-center text-blue-400"><CalendarDays size={18}/></div>
        <div className="flex-1 text-sm md:text-base"><span className="font-medium">Consistência:</span> <strong className="text-blue-400">{profitableDays} / {FUNDING_PIPS_RULES.minimumProfitableDays}</strong> <span className="text-[#C7C7CB]">Dias Concluídos</span></div>
        <div className="hidden sm:flex gap-2">{Array.from({ length: FUNDING_PIPS_RULES.minimumProfitableDays }).map((_, i) => <span key={i} className={`h-4 w-4 rounded-full border ${i < profitableDays ? 'border-blue-400 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,.35)]' : 'border-[#57575D] bg-transparent'}`}/>)}</div>
      </div>

      {concentrationLimit !== null && phase !== 0 && <div className={`flex items-center gap-3 px-5 md:px-7 py-4 border-b border-[#2C2C30] ${concentrationExceeded ? 'bg-amber-400/[0.025]' : ''}`}>
        <div className="h-9 w-9 shrink-0 rounded-full border border-[#D4AF37] bg-[#D4AF37]/10 grid place-items-center text-[#D4AF37] text-lg font-bold">%</div>
        <div className="flex-1 min-w-0"><p className="text-sm md:text-base font-medium">Concentração do Melhor Dia: <strong>{concentrationPct === null ? '—' : `${concentrationPct.toFixed(0)}% da meta`}</strong></p><p className={`text-xs md:text-sm mt-0.5 ${concentrationExceeded ? 'text-amber-300' : 'text-[#A9A9AE]'}`}>{concentrationExceeded ? `Acima da referência de ${concentrationLimit}%.` : `Dentro da regra dos ${concentrationLimit}%. Continue operando.`}</p></div>
        <div className={`h-9 w-9 shrink-0 rounded-full border grid place-items-center ${concentrationExceeded ? 'border-amber-400 text-amber-400' : 'border-emerald-400 text-emerald-400'}`}>{concentrationExceeded ? '!' : <Check size={19}/>}</div>
      </div>}

      <div className="flex items-start gap-3 px-5 md:px-7 py-3 text-xs md:text-sm text-[#A0A0A5]"><InfoIcon size={17} className="shrink-0 mt-0.5"/><span>{phase === 0 ? 'A conta está em Master. Os indicadores acima continuam sendo calculados com os trades registrados.' : 'A linha de perda diária será ativada após a aprovação (FUNDED PRO).'}</span></div>
    </div>
    {!withinDrawdown && <div className="mx-5 mb-5 rounded-2xl border border-red-400/30 bg-red-400/[0.06] p-4 text-xs text-red-300">A perda acumulada ultrapassou o drawdown estático configurado para esta conta.</div>}
  </section>;
}

function Performance({ trades }: { trades: Trade[] }) { const pnl = trades.reduce((s, t) => s + t.amount, 0); const takes = trades.filter(t => t.result === 'Take').length; const stops = trades.filter(t => t.result === 'Stop').length; const bes = trades.filter(t => t.result === 'BE').length; return <section className="rounded-[26px] border border-[#3A3118] bg-[linear-gradient(135deg,#101012,#09090A)] p-5 md:p-6"><h3 className="text-lg md:text-xl font-bold uppercase tracking-[0.06em] text-[#E5BF4A] mb-4">Resultado e Performance</h3><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Stat label="Resultado Líquido" value={formatSignedCurrency(pnl)} cls={pnl >= 0 ? 'text-emerald-400' : 'text-red-400'} icon={Wallet}/><Stat label="Takes" value={String(takes)} cls="text-white" icon={TrendingUp}/><Stat label="Stops" value={String(stops)} cls="text-white" icon={Shield}/><Stat label="Break Evens" value={String(bes)} cls="text-white" icon={CircleDollarSign}/></div></section>; }
function Stat({ label, value, cls, icon: Icon }: { label: string; value: string; cls: string; icon: any }) { return <div className="min-h-[104px] rounded-2xl border border-[#2D2D32] bg-[#111113] p-4 md:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.02)]"><div className="flex items-center gap-3"><div className={`h-10 w-10 rounded-full border grid place-items-center ${label === 'Resultado Líquido' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' : label === 'Takes' ? 'border-emerald-400 text-emerald-400 bg-emerald-400/5' : label === 'Stops' ? 'border-red-400 text-red-400 bg-red-400/5' : 'border-white/60 text-white bg-white/5'}`}><Icon size={19}/></div><span className="text-xs md:text-sm text-[#D1D1D5] font-medium">{label}</span></div><p className={`mt-3 text-xl md:text-2xl font-black ${cls}`}>{value}</p></div>; }
function StatusPanel({ account, onChange }: { account: Account; onChange: (s: AccountStatus) => void }) { return <section className="rounded-3xl border border-[#27272F] bg-[#111113] p-5"><div className="flex items-center gap-2 mb-4"><Gauge size={17} className="text-[#D4AF37]"/><h3 className="font-bold">Status da conta</h3></div><div className="grid grid-cols-3 gap-2">{ACCOUNT_STATUSES.map(s => <button key={s} onClick={() => onChange(s)} className={`py-3 rounded-xl border text-xs font-bold ${account.status === s ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-[#15151B] text-gray-500 border-[#27272F]'}`}>{s === 'Avaliacao' ? 'Challenge' : s === 'Financiada' ? 'Master' : s}</button>)}</div></section>; }
function TradeHistory({ trades }: { trades: Trade[] }) { const { deleteTrade } = useApp(); const sorted = [...trades].sort((a, b) => b.timestamp - a.timestamp); const confirmDelete = (id: string) => { if (window.confirm('Excluir este trade? Os indicadores da conta serão recalculados.')) deleteTrade(id); }; return <section className="rounded-[26px] border border-[#3A3118] bg-[linear-gradient(135deg,#101012,#09090A)] p-4 md:p-5"><div className="mb-3 flex items-center justify-between gap-3 px-1"><div><h3 className="text-lg md:text-xl font-bold uppercase tracking-[0.06em] text-[#E5BF4A]">Histórico de Trades</h3></div><p className="text-xs md:text-sm text-[#A0A0A5]">{trades.length} registros</p></div>{sorted.length === 0 ? <div className="rounded-2xl border border-dashed border-[#3A3A40] p-8 text-center text-gray-600">Nenhum trade registrado.</div> : <div className="space-y-1">{sorted.map(t => <div key={t.id} className="rounded-2xl border border-[#28282D] bg-[#101012] p-3 md:p-3.5 flex items-center gap-3 hover:border-[#4A3B19] transition"><div className={`h-10 w-10 rounded-full grid place-items-center shrink-0 border ${t.result === 'Take' ? 'border-emerald-400 text-emerald-400 bg-emerald-400/5' : t.result === 'Stop' ? 'border-red-400 text-red-400 bg-red-400/5' : 'border-white/60 text-white bg-white/5'}`}>{t.result === 'Take' ? <TrendingUp size={17}/> : t.result === 'Stop' ? <Shield size={17}/> : <CircleDollarSign size={17}/>}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-sm md:text-base font-bold truncate">{t.asset}</span><span className={`text-[10px] md:text-xs ${t.result === 'Take' ? 'text-emerald-400' : t.result === 'Stop' ? 'text-red-400' : 'text-[#A0A0A5]'}`}>{t.result}</span><span className="text-[9px] text-gray-600">F{t.phase ?? 1}</span></div><p className="text-[11px] md:text-xs text-[#88888E] mt-1">{formatDateTime(t.timestamp)} · {t.context} · {t.timeframe}</p>{t.note && <p className="mt-2 rounded-xl border border-[#25252D] bg-[#0D0D11] px-3 py-2 text-xs leading-5 text-[#A7A7AE] break-words"><span className="font-bold text-[#D4AF37]">Obs.:</span> {t.note}</p>}</div><div className="flex shrink-0 items-center gap-2"><div className={`text-sm md:text-base font-black ${t.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatSignedCurrency(t.amount)}</div><button type="button" aria-label={`Excluir trade ${t.asset}`} onClick={() => confirmDelete(t.id)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-gray-600 transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"><Trash2 size={15}/></button></div></div>)}</div>}</section>; }
