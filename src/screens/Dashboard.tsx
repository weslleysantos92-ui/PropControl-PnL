import { useState } from 'react';
import {
  ChevronRight, ChevronUp, Sparkles, ShieldCheck, Activity,
  Gauge, Flag, PlayCircle, Wallet, Plus
} from 'lucide-react';
import { useApp } from '@/store';
import { nextAccountToOperate, getQueue, getAccountStats } from '@/rotation';
import { getAccountPhaseLabel } from '@/types';
import type { Account } from '@/types';
import { EVALUATION_TARGET_PCT, SIZE_HEX } from '@/types';
import { NewAccountModal } from '@/components/NewAccountModal';
import { FUNDING_PIPS_RULES } from '@/fundingPips2StepFlex';
import type { Movement, Trade } from '@/types';

// ---------- keyframes used by the redesigned cards (self-contained, no global CSS edits needed) ----------
const PC_STYLES = `
@keyframes pcPulseDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.pc-pulse-dot { animation: pcPulseDot 1.4s ease-in-out infinite; display: inline-block; }
`;

function getPayoutCountdown(account: Account, trades: Trade[], movements: Movement[]): number | null {
  const payoutCycleDays = FUNDING_PIPS_RULES.payoutCycleDays;
  const lastPayoutAt = movements.filter(m => m.type === 'saque' && m.accountId === account.id).reduce((max, m) => Math.max(max, m.timestamp), 0);
  const cycleStart = Math.max(lastPayoutAt, account.fundedAt ?? 0);
  const masterTrades = trades.filter(t => t.accountId === account.id && (t.phase ?? 1) === 0 && t.timestamp > cycleStart).sort((a, b) => a.timestamp - b.timestamp);
  const firstTradeInCycle = masterTrades[0]?.timestamp;
  if (!firstTradeInCycle) return null;
  const nextPayoutDate = firstTradeInCycle + payoutCycleDays * 86400000;
  return Math.max(0, Math.ceil((nextPayoutDate - Date.now()) / 86400000));
}

export function Dashboard({ onOpenAccount, onRegisterTrade }: { onOpenAccount: (id: string) => void; onRegisterTrade: (id: string) => void }) {
  const { accounts, trades, movements } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [fundedOpen, setFundedOpen] = useState(true);
  const [evalOpen, setEvalOpen] = useState(true);

  const next = nextAccountToOperate(accounts);
  const funded = getQueue(accounts, 'Financiada');
  const avaliacao = getQueue(accounts, 'Avaliacao');

  return (
    <div className="px-4 pt-4 pb-52 space-y-4" style={{ fontFamily: 'Manrope, Inter, sans-serif' }}>
      <style>{PC_STYLES}</style>

      {next ? (
        <NextAccountCard account={next} trades={trades} movements={movements} onClick={() => onRegisterTrade(next.id)} />
      ) : (
        <div className="rounded-2xl p-6 text-center" style={{ background: '#17171C', border: '1px dashed #2A2A31' }}>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Cadastre uma conta para começar a operar.</p>
        </div>
      )}

      <section>
        <SectionHeader title="Carteira de Contas Financiadas" count={funded.length} color="green" icon={<ShieldCheck size={16} strokeWidth={2.2} />} open={fundedOpen} onToggle={() => setFundedOpen(v => !v)} />
        <div style={{ height: 1, background: 'rgba(46,204,113,0.15)', margin: '0 14px 10px' }} />
        {fundedOpen && <div className="space-y-2">{funded.length === 0 ? <EmptyState text="Nenhuma conta financiada ainda." /> : funded.map((a, i) => <FundedCard key={a.id} account={a} index={i + 1} trades={trades} movements={movements} onClick={() => onOpenAccount(a.id)} />)}</div>}
      </section>

      <section>
        <SectionHeader title="Carteira de Contas em Avaliação" count={avaliacao.length} color="blue" icon={<Activity size={15} strokeWidth={2} />} open={evalOpen} onToggle={() => setEvalOpen(v => !v)} />
        <div style={{ height: 1, background: 'rgba(59,130,246,0.15)', margin: '0 14px 10px' }} />
        {evalOpen && <div className="space-y-2">{avaliacao.length === 0 ? <EmptyState text="Nenhuma conta em avaliação." /> : avaliacao.map((a, i) => <EvalCard key={a.id} account={a} index={funded.length + i + 1} trades={trades} onClick={() => onOpenAccount(a.id)} />)}</div>}
      </section>

      <button onClick={() => setModalOpen(true)} className="flex items-center gap-2.5 mx-auto rounded-xl px-5 py-2.5 transition-all duration-200 active:scale-[0.97]" style={{ background: 'linear-gradient(90deg, #C8960C 0%, #D4AF37 50%, #B8860B 100%)', boxShadow: '0 2px 12px rgba(212,175,55,0.35)' }}>
        <div className="w-6 h-6 rounded-full bg-black/25 flex items-center justify-center"><Plus size={13} strokeWidth={2.8} className="text-white" /></div>
        <span className="text-[12px] font-extrabold text-black uppercase tracking-widest">Nova Conta</span>
      </button>
      <NewAccountModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

// ---------- small reusable pieces ----------

function CrownHexIcon({ size = 46 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#D4AF37" strokeWidth={2} opacity={0.7} />
      <polygon points="50,18 80,34 80,66 50,82 20,66 20,34" fill="none" stroke="#D4AF37" strokeWidth={2.5} />
      <path d="M32 46 L38 62 L50 40 L62 62 L68 46 L62 58 L38 58 Z" fill="#D4AF37" />
      <rect x="36" y="60" width="28" height="4" fill="#D4AF37" />
    </svg>
  );
}

function CandlestickIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
      <line x1="10" y1="4" x2="10" y2="36" stroke="#F5F5F5" strokeWidth={2} />
      <rect x="6" y="12" width="8" height="14" rx="1.5" fill="#F5F5F5" />
      <line x1="20" y1="8" x2="20" y2="30" stroke="#EF4444" strokeWidth={2} />
      <rect x="16" y="14" width="8" height="10" rx="1.5" fill="#EF4444" />
      <line x1="30" y1="2" x2="30" y2="34" stroke="#F5F5F5" strokeWidth={2} />
      <rect x="26" y="6" width="8" height="18" rx="1.5" fill="#F5F5F5" />
    </svg>
  );
}

// pill badge with dark translucent bg + colored border + pulsing dot (used for FASE / MASTER everywhere)
function PulseBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full text-[10px] font-extrabold"
      style={{ padding: '3px 9px', background: 'rgba(11,11,13,0.55)', border: `1px solid ${color}`, color }}
    >
      <span className="pc-pulse-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {label}
    </span>
  );
}

// pill badge for the account code (dark translucent bg + gold border)
function CodeBadge({ code, size = 'sm' }: { code: string; size?: 'sm' | 'md' }) {
  const big = size === 'md';
  return (
    <div
      className="inline-flex items-center rounded-full"
      style={{ gap: 5, padding: big ? '4px 10px' : '3px 9px', background: 'rgba(11,11,13,0.55)', border: '1px solid #D4AF37' }}
    >
      <span className="font-bold uppercase tracking-widest" style={{ fontSize: big ? 8 : 7, color: '#9CA3AF' }}>Código</span>
      <span className="font-extrabold tracking-wide" style={{ fontSize: big ? 11 : 10, color: '#D4AF37' }}>{code}</span>
    </div>
  );
}

function NextAccountCard({ account, trades, movements, onClick }: { account: Account; trades: Trade[]; movements: Movement[]; onClick: () => void }) {
  const stats = getAccountStats(account, trades);
  const isFunded = account.status === 'Financiada';
  const accentColor = isFunded ? '#2ECC71' : '#3B82F6';
  const phaseLabel = getAccountPhaseLabel(account.status, account.phase);
  const daysLeft = getPayoutCountdown(account, trades, movements);

  return (
    <button onClick={onClick} className="w-full text-left relative overflow-hidden rounded-2xl p-5 transition-all duration-200 active:scale-[0.99] animate-dash-card-in" style={{ background: 'linear-gradient(145deg, #191400 0%, #0D0D10 55%, #0A0A0C 100%)', border: '1px solid rgba(212,175,55,0.5)' }}>
      <svg className="absolute top-0 right-0 h-full pointer-events-none" style={{ width: '60%', opacity: 0.35 }} viewBox="0 0 300 200" preserveAspectRatio="none">
        <polygon points="120,0 220,0 60,200 -40,200" fill="url(#pcRayGrad)" />
        <polygon points="220,0 260,0 140,200 100,200" fill="url(#pcRayGrad)" />
        <defs>
          <linearGradient id="pcRayGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
      <svg className="absolute pointer-events-none" style={{ right: 10, top: '50%', transform: 'translateY(-50%)', width: 130, height: 130, opacity: 0.14 }} viewBox="0 0 100 100">
        <path d="M20 40 L30 65 L50 30 L70 65 L80 40 L70 58 L30 58 Z" fill="#D4AF37" />
        <rect x="28" y="60" width="44" height="6" fill="#D4AF37" />
      </svg>
      <div className="absolute pointer-events-none animate-dash-glow" style={{ top: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.55) 0%, rgba(212,175,55,0.18) 45%, transparent 72%)' }} />

      <div className="relative flex items-center gap-2 mb-4">
        <Sparkles size={14} style={{ color: '#D4AF37' }} strokeWidth={2.5} />
        <span className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: '#D4AF37' }}>Próxima Conta a Operar</span>
      </div>

      <div className="relative flex items-center gap-4">
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <CrownHexIcon size={56} />
          <PulseBadge label={phaseLabel} color={accentColor} />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-[20px] font-extrabold text-white leading-tight tracking-tight break-words">{account.name}</h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <CodeBadge code={account.code} size="md" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.25)' }}>
              <PlayCircle size={11} style={{ color: '#2ECC71' }} strokeWidth={2.5} />
              <span className="text-[10px] font-bold" style={{ color: '#2ECC71' }}>Próximo trade nesta conta</span>
            </div>
          </div>
        </div>

        <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center" style={{ border: '1.5px solid rgba(212,175,55,0.5)', background: 'rgba(212,175,55,0.06)' }}>
          <ChevronRight size={20} style={{ color: '#D4AF37' }} strokeWidth={2.5} />
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(212,175,55,0.15)' }}>
        {isFunded ? (
          <>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Dias Lucrativos</div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: stats.profitableDaysTarget }).map((_, i) => (
                  <span key={i} className="w-3 h-3 rounded-full" style={{ background: i < stats.profitableDays ? '#2ECC71' : 'rgba(42,42,49,0.9)', boxShadow: i < stats.profitableDays ? '0 0 6px rgba(46,204,113,0.5)' : 'none' }} />
                ))}
                <span className="text-[13px] font-extrabold ml-1" style={{ color: '#2ECC71' }}>{stats.profitableDays} / {stats.profitableDaysTarget}</span>
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Próximo Saque Possível Em</div>
              <div className="flex items-center gap-2">
                <Wallet size={16} style={{ color: '#D4AF37' }} strokeWidth={2} />
                {daysLeft === null ? (
                  <span className="text-[13px] font-bold" style={{ color: '#9CA3AF' }}>Aguardando 1º trade</span>
                ) : daysLeft === 0 ? (
                  <span className="text-[18px] font-extrabold" style={{ color: '#2ECC71' }}>Disponível</span>
                ) : (
                  <span className="text-[18px] font-extrabold" style={{ color: '#F5F5F5' }}>{daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}</span>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Progresso da Meta</div>
              <div className="flex items-center gap-2">
                <Gauge size={15} style={{ color: stats.progressPct < 0 ? '#EF4444' : '#3B82F6' }} strokeWidth={2} />
                <span className="text-[18px] font-extrabold" style={{ color: stats.progressPct < 0 ? '#EF4444' : '#3B82F6' }}>{stats.progressPct}%</span>
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Meta de Avaliação</div>
              <div className="flex items-center gap-2">
                <Flag size={15} style={{ color: '#3B82F6' }} strokeWidth={2} />
                <span className="text-[18px] font-extrabold" style={{ color: '#3B82F6' }}>{account.phase === 2 ? EVALUATION_TARGET_PCT.phase2 : EVALUATION_TARGET_PCT[account.size]}%</span>
              </div>
            </div>
          </>
        )}
      </div>
    </button>
  );
}

function SectionHeader({ title, count, color, icon, open, onToggle }: { title: string; count: number; color: 'green' | 'blue'; icon: React.ReactNode; open: boolean; onToggle: () => void }) {
  const c = color === 'green' ? '#2ECC71' : '#3B82F6';
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between px-3.5 py-3">
      <div className="flex items-center gap-2" style={{ color: c }}>
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.1em]">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-[22px] h-[22px] rounded-md flex items-center justify-center text-[10px] font-extrabold" style={{ background: `${c}26`, color: c }}>{count}</div>
        <ChevronUp size={15} strokeWidth={2.5} style={{ color: c, transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.25s' }} />
      </div>
    </button>
  );
}

function FundedCard({ account, index, trades, movements, onClick }: { account: Account; index: number; trades: Trade[]; movements: Movement[]; onClick: () => void }) {
  const stats = getAccountStats(account, trades);
  const c = SIZE_HEX[account.size];
  const daysLeft = getPayoutCountdown(account, trades, movements);
  return (
    <button onClick={onClick} className="w-full text-left relative overflow-hidden rounded-xl px-3 py-3 transition-all duration-200 active:scale-[0.98] animate-dash-card-in" style={{ background: `linear-gradient(135deg, ${c.solid}1A, #17171C 55%)`, border: `1px solid ${c.solid}40`, borderLeft: `3px solid ${c.solid}` }}>
      <div className="absolute inset-0 pointer-events-none" style={{ left: '-20%', width: '60%', background: `linear-gradient(115deg, transparent 30%, ${c.solid}30 48%, rgba(255,255,255,0.06) 52%, transparent 70%)` }} />

      <div className="relative flex items-center gap-2.5">
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[17px] font-extrabold" style={{ background: c.soft, color: c.solid }}>{index}</div>
          <span className="text-[10px] font-extrabold" style={{ color: c.solid }}>{account.size}</span>
        </div>
        <CandlestickIcon size={18} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[14px] font-extrabold text-white truncate">{account.name}</span>
            <PulseBadge label="MASTER" color={c.solid} />
          </div>
          <div className="mt-1.5"><CodeBadge code={account.code} /></div>
        </div>
        <ChevronRight size={14} style={{ color: '#4B5563' }} strokeWidth={2} />
      </div>

      <div className="relative flex items-center justify-between gap-3 mt-2.5">
        <div>
          <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Dias Lucrativos</div>
          <div className="flex items-center gap-1 mt-0.5">
            {Array.from({ length: stats.profitableDaysTarget }).map((_, i) => (
              <span key={i} className="w-2 h-2 rounded-full" style={{ background: i < stats.profitableDays ? c.solid : 'rgba(42,42,49,0.9)' }} />
            ))}
            <span className="text-[10px] font-extrabold ml-1" style={{ color: c.solid }}>{stats.profitableDays}/{stats.profitableDaysTarget}</span>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <Wallet size={9} style={{ color: '#D4AF37' }} strokeWidth={2.2} />
            <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Próx. Saque</span>
          </div>
          {daysLeft === null ? (
            <span className="text-[10px] font-bold mt-0.5" style={{ color: '#6B7280' }}>1º trade</span>
          ) : daysLeft === 0 ? (
            <span className="text-[11px] font-extrabold mt-0.5" style={{ color: c.solid }}>Disponível</span>
          ) : (
            <span className="text-[11px] font-extrabold text-white mt-0.5">{daysLeft}d</span>
          )}
        </div>
      </div>
    </button>
  );
}

function EvalCard({ account, index, trades, onClick }: { account: Account; index: number; trades: any[]; onClick: () => void }) {
  const stats = getAccountStats(account, trades);
  const phaseLabel = getAccountPhaseLabel(account.status, account.phase);
  const targetPct = account.phase === 2 ? EVALUATION_TARGET_PCT.phase2 : EVALUATION_TARGET_PCT[account.size];
  const c = SIZE_HEX[account.size];
  return (
    <button onClick={onClick} className="w-full text-left relative overflow-hidden rounded-xl px-3 py-3 transition-all duration-200 active:scale-[0.98] animate-dash-card-in" style={{ background: `linear-gradient(135deg, ${c.solid}1A, #17171C 55%)`, border: `1px solid ${c.ring}`, borderLeft: `3px solid ${c.solid}` }}>
      <div className="absolute inset-0 pointer-events-none" style={{ left: '-20%', width: '60%', background: `linear-gradient(115deg, transparent 30%, ${c.solid}30 48%, rgba(255,255,255,0.06) 52%, transparent 70%)` }} />

      <div className="relative flex items-center gap-2.5">
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[17px] font-extrabold" style={{ background: c.soft, color: c.solid }}>{index}</div>
          <span className="text-[10px] font-extrabold" style={{ color: c.solid }}>{account.size}</span>
        </div>
        <CandlestickIcon size={18} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[14px] font-extrabold text-white truncate">{account.name}</span>
            <PulseBadge label={phaseLabel} color={c.solid} />
          </div>
          <div className="mt-1.5"><CodeBadge code={account.code} /></div>
        </div>
        <div className="flex flex-col gap-1 w-[76px] flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest leading-none" style={{ color: '#9CA3AF' }}>Meta</span>
            <span className="text-[12px] font-extrabold leading-none" style={{ color: stats.progressPct < 0 ? '#EF4444' : c.solid }}>{stats.progressPct}%</span>
          </div>
          <div className="w-full h-[4px] rounded-full overflow-hidden" style={{ background: 'rgba(42,42,49,1)' }}>
            <div className="h-full rounded-full animate-dash-bar-fill" style={{ width: `${Math.max(0, stats.progressPct)}%`, background: stats.progressPct < 0 ? '#EF4444' : c.solid }} />
          </div>
          <span className="text-[7px] leading-none" style={{ color: '#4B5563' }}>Alvo: {targetPct}%</span>
        </div>
        <ChevronRight size={14} style={{ color: '#4B5563' }} strokeWidth={2} />
      </div>
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl p-5 text-center" style={{ background: '#17171C', border: '1px dashed #2A2A31' }}><p className="text-xs" style={{ color: '#9CA3AF' }}>{text}</p></div>;
}
