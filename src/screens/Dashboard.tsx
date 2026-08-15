import { useState } from 'react';
import {
  ChevronRight, ChevronUp, Crown, BarChart2,
  Target, Wallet, Settings2, Plus, CheckCircle2, Calendar
} from 'lucide-react';
import { useApp } from '@/store';
import { nextAccountToOperate, getQueue, getAccountStats } from '@/rotation';
import type { Account } from '@/types';
import { EVALUATION_TARGET_PCT } from '@/types';
import { NewAccountModal } from '@/components/NewAccountModal';

export function Dashboard({ onOpenAccount, onRegisterTrade }: { onOpenAccount: (id: string) => void; onRegisterTrade: (id: string) => void }) {
  const { accounts, trades } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [fundedOpen, setFundedOpen] = useState(true);
  const [evalOpen, setEvalOpen] = useState(true);

  const next = nextAccountToOperate(accounts);
  const funded = getQueue(accounts, 'Financiada');
  const avaliacao = getQueue(accounts, 'Avaliacao');

  return (
    <div className="px-4 pt-4 pb-52 space-y-4" style={{ fontFamily: 'Manrope, Inter, sans-serif' }}>
      {next ? (
        <NextAccountCard account={next} trades={trades} onClick={() => onRegisterTrade(next.id)} />
      ) : (
        <div className="rounded-2xl p-6 text-center" style={{ background: '#17171C', border: '1px dashed #2A2A31' }}>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Cadastre uma conta para começar a operar.</p>
        </div>
      )}

      <section>
        <SectionHeader title="Carteira de Contas Financiadas" count={funded.length} color="green" icon={<Wallet size={15} strokeWidth={2} />} open={fundedOpen} onToggle={() => setFundedOpen(v => !v)} />
        {fundedOpen && <div className="mt-2 space-y-2">{funded.length === 0 ? <EmptyState text="Nenhuma conta financiada ainda." /> : funded.map((a, i) => <FundedCard key={a.id} account={a} index={i + 1} trades={trades} onClick={() => onOpenAccount(a.id)} />)}</div>}
      </section>

      <section>
        <SectionHeader title="Carteira de Contas em Avaliação" count={avaliacao.length} color="blue" icon={<Settings2 size={15} strokeWidth={2} />} open={evalOpen} onToggle={() => setEvalOpen(v => !v)} />
        {evalOpen && <div className="mt-2 space-y-2">{avaliacao.length === 0 ? <EmptyState text="Nenhuma conta em avaliação." /> : avaliacao.map((a, i) => <EvalCard key={a.id} account={a} index={funded.length + i + 1} trades={trades} onClick={() => onOpenAccount(a.id)} />)}</div>}
      </section>

      <button onClick={() => setModalOpen(true)} className="flex items-center gap-2.5 mx-auto rounded-xl px-5 py-2.5 transition-all duration-200 active:scale-[0.97]" style={{ background: 'linear-gradient(90deg, #C8960C 0%, #D4AF37 50%, #B8860B 100%)', boxShadow: '0 2px 12px rgba(212,175,55,0.35)' }}>
        <div className="w-6 h-6 rounded-full bg-black/25 flex items-center justify-center"><Plus size={13} strokeWidth={2.8} className="text-white" /></div>
        <span className="text-[12px] font-extrabold text-black uppercase tracking-widest">Nova Conta</span>
      </button>
      <NewAccountModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function NextAccountCard({ account, trades, onClick }: { account: Account; trades: any[]; onClick: () => void }) {
  const stats = getAccountStats(account, trades);
  const isFunded = account.status === 'Financiada';
  const accentColor = isFunded ? '#2ECC71' : '#3B82F6';
  const daysLeft = Math.max(0, stats.profitableDaysTarget - stats.profitableDays);

  return (
    <button onClick={onClick} className="w-full text-left relative overflow-hidden rounded-2xl p-5 transition-all duration-200 active:scale-[0.99] animate-dash-card-in" style={{ background: 'linear-gradient(145deg, #191400 0%, #0D0D10 60%, #0A0A0C 100%)', border: '1px solid rgba(212,175,55,0.5)', boxShadow: '0 0 30px rgba(212,175,55,0.1), 0 8px 32px rgba(0,0,0,0.5)' }}>
      <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full pointer-events-none animate-dash-glow" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.05) 50%, transparent 70%)' }} />
      <div className="absolute top-4 right-14 opacity-20 pointer-events-none" style={{ width: 80, height: 80, backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)', backgroundSize: '8px 8px', maskImage: 'radial-gradient(circle, black 30%, transparent 80%)' }} />
      <div className="relative flex items-center gap-2 mb-4"><Target size={14} style={{ color: '#D4AF37' }} strokeWidth={2.5} /><span className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: '#D4AF37' }}>Próxima Conta a Operar</span></div>
      <div className="relative flex items-center gap-4">
        <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'radial-gradient(circle, #2A2000 0%, #1A1400 100%)', border: '2px solid rgba(212,175,55,0.6)', boxShadow: '0 0 16px rgba(212,175,55,0.2)' }}><Crown size={24} style={{ color: '#D4AF37' }} strokeWidth={1.8} /></div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[26px] font-extrabold text-white leading-tight tracking-tight truncate">{account.name}</h2>
          <div className="text-[12px] font-bold mt-0.5 uppercase tracking-wider" style={{ color: '#D4AF37' }}>{account.size}&nbsp;•&nbsp;<span style={{ color: accentColor }}>{isFunded ? 'Financiada' : 'Avaliação'}</span></div>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full" style={{ background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.25)' }}><CheckCircle2 size={11} style={{ color: '#2ECC71' }} strokeWidth={2.5} /><span className="text-[10px] font-bold" style={{ color: '#2ECC71' }}>Próximo trade nesta conta</span></div>
        </div>
        <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center" style={{ border: '1.5px solid rgba(212,175,55,0.5)', background: 'rgba(212,175,55,0.06)' }}><ChevronRight size={20} style={{ color: '#D4AF37' }} strokeWidth={2.5} /></div>
      </div>
      <div className="relative grid grid-cols-2 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(212,175,55,0.15)' }}>
        {isFunded ? <><div><div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Dias Lucrativos</div><div className="flex items-center gap-1.5">{Array.from({ length: stats.profitableDaysTarget }).map((_, i) => <span key={i} className="w-3 h-3 rounded-full" style={{ background: i < stats.profitableDays ? '#2ECC71' : 'rgba(42,42,49,0.9)', boxShadow: i < stats.profitableDays ? '0 0 6px rgba(46,204,113,0.5)' : 'none' }} />)}<span className="text-[13px] font-extrabold ml-1" style={{ color: '#2ECC71' }}>{stats.profitableDays} / {stats.profitableDaysTarget}</span></div></div><div><div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Próximo Saque Possível Em</div><div className="flex items-center gap-2"><Calendar size={16} style={{ color: '#D4AF37' }} strokeWidth={2} /><span className="text-[18px] font-extrabold" style={{ color: '#F5F5F5' }}>{daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}</span></div></div></> : <><div><div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Progresso da Meta</div><div className="flex items-center gap-2"><Target size={15} style={{ color: '#3B82F6' }} strokeWidth={2} /><span className="text-[18px] font-extrabold" style={{ color: '#3B82F6' }}>{stats.progressPct}%</span></div></div><div><div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Meta de Avaliação</div><div className="flex items-center gap-2"><Target size={15} style={{ color: '#3B82F6' }} strokeWidth={2} /><span className="text-[18px] font-extrabold" style={{ color: '#3B82F6' }}>{EVALUATION_TARGET_PCT[account.size]}%</span></div></div></>}
      </div>
    </button>
  );
}

function SectionHeader({ title, count, color, icon, open, onToggle }: { title: string; count: number; color: 'green' | 'blue'; icon: React.ReactNode; open: boolean; onToggle: () => void }) {
  const c = color === 'green' ? { text: '#2ECC71', bg: 'rgba(46,204,113,0.08)', border: 'rgba(46,204,113,0.25)' } : { text: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)' };
  return <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200" style={{ background: '#17171C', border: `1px solid ${c.border}` }}><div className="flex items-center gap-2" style={{ color: c.text }}>{icon}<span className="text-[11px] font-extrabold uppercase tracking-[0.1em]">{title}</span></div><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-extrabold" style={{ background: c.bg, color: c.text }}>{count}</div><ChevronUp size={16} strokeWidth={2.5} style={{ color: c.text, transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.25s' }} /></div></button>;
}

function FundedCard({ account, index, trades, onClick }: { account: Account; index: number; trades: any[]; onClick: () => void }) {
  const stats = getAccountStats(account, trades);
  return <button onClick={onClick} className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] animate-dash-card-in" style={{ background: '#17171C', border: '1px solid rgba(46,204,113,0.2)', borderLeft: '3px solid #2ECC71', boxShadow: '0 4px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03)' }}><div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[13px] font-extrabold" style={{ background: 'rgba(46,204,113,0.1)', color: '#2ECC71' }}>{index}</div><BarChart2 size={26} style={{ color: '#2ECC71', flexShrink: 0 }} strokeWidth={1.8} /><div className="flex-1 min-w-0"><div className="text-[14px] font-extrabold text-white truncate">{account.name}</div><div className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: '#2ECC71' }}>{account.size}&nbsp;•&nbsp;Financiada</div></div><div className="flex flex-col items-end gap-1.5 flex-shrink-0"><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Dias Lucrativos</div><div className="flex items-center gap-1">{Array.from({ length: stats.profitableDaysTarget }).map((_, i) => <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: i < stats.profitableDays ? '#2ECC71' : 'rgba(42,42,49,0.9)', boxShadow: i < stats.profitableDays ? '0 0 5px rgba(46,204,113,0.4)' : 'none' }} />)}<span className="text-[12px] font-extrabold ml-1" style={{ color: '#2ECC71' }}>{stats.profitableDays}/{stats.profitableDaysTarget}</span></div></div><ChevronRight size={16} style={{ color: '#4B5563' }} strokeWidth={2} /></button>;
}

function EvalCard({ account, index, trades, onClick }: { account: Account; index: number; trades: any[]; onClick: () => void }) {
  const stats = getAccountStats(account, trades);
  return <button onClick={onClick} className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] animate-dash-card-in" style={{ background: '#17171C', border: '1px solid rgba(59,130,246,0.2)', borderLeft: '3px solid #3B82F6', boxShadow: '0 4px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03)' }}><div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[13px] font-extrabold" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>{index}</div><BarChart2 size={26} style={{ color: '#3B82F6', flexShrink: 0 }} strokeWidth={1.8} /><div className="flex-1 min-w-0"><div className="text-[14px] font-extrabold text-white truncate">{account.name}</div><div className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: '#3B82F6' }}>{account.size}&nbsp;•&nbsp;Avaliação</div></div><div className="flex flex-col gap-1 w-[100px] flex-shrink-0"><div className="flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-widest leading-none" style={{ color: '#9CA3AF' }}>Meta</span><span className="text-[12px] font-extrabold leading-none" style={{ color: '#3B82F6' }}>{stats.progressPct}%</span></div><div className="w-full h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(42,42,49,1)' }}><div className="h-full rounded-full animate-dash-bar-fill" style={{ width: `${stats.progressPct}%`, background: 'linear-gradient(90deg, #1d4ed8, #3B82F6)', boxShadow: '0 0 5px rgba(59,130,246,0.6)' }} /></div><span className="text-[9px] leading-none" style={{ color: '#4B5563' }}>Alvo: {EVALUATION_TARGET_PCT[account.size]}%</span></div><ChevronRight size={16} style={{ color: '#4B5563' }} strokeWidth={2} /></button>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl p-5 text-center" style={{ background: '#17171C', border: '1px dashed #2A2A31' }}><p className="text-xs" style={{ color: '#9CA3AF' }}>{text}</p></div>;
}
