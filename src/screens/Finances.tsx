import { useState } from 'react';
import { Plus, TrendingDown, TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle, Trash2, Landmark, Receipt, Sparkles } from 'lucide-react';
import { useApp } from '@/store';
import type { MovementType } from '@/types';
import { formatCurrency, formatSignedCurrency, formatDateTime } from '@/dates';
import { Modal } from '@/components/Modal';

export function Finances() {
  const { movements, addMovement, deleteMovement } = useApp();
  const [modalType, setModalType] = useState<MovementType | null>(null);

  const totalInvestido = movements.filter((m) => m.type === 'investimento').reduce((s, m) => s + m.amount, 0);
  const totalRecebido = movements.filter((m) => m.type === 'saque').reduce((s, m) => s + m.amount, 0);
  const lucroLiquido = totalRecebido - totalInvestido;
  const sorted = [...movements].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="px-4 pt-4 pb-28 space-y-6">
      <style>{`
        @keyframes pc-card-flow {
          0% { transform: translateX(-120%) rotate(12deg); opacity: 0; }
          18% { opacity: .18; }
          52% { opacity: .08; }
          82% { opacity: .16; }
          100% { transform: translateX(120%) rotate(12deg); opacity: 0; }
        }
        .pc-fin-card { position: relative; overflow: hidden; isolation: isolate; background: linear-gradient(145deg,#151519 0%,#0F0F13 65%,#131109 100%); border: 1px solid #38352A; box-shadow: inset 0 1px 0 rgba(255,255,255,.035), 0 10px 30px rgba(0,0,0,.18); }
        .pc-fin-card::after { content:''; position:absolute; z-index:-1; top:-35%; left:-15%; width:24%; height:170%; background:linear-gradient(90deg,transparent,rgba(212,175,55,.45),transparent); filter:blur(8px); animation:pc-card-flow 7s ease-in-out infinite; pointer-events:none; }
        .pc-fin-card:nth-child(2)::after { animation-delay:2.2s; }
        .pc-fin-card:nth-child(3)::after { animation-delay:4.4s; }
        .pc-fin-card-highlight { border-color:#8B7225; background:linear-gradient(145deg,#18160F,#111114 72%,#1A1508); }
        .pc-fin-action { position:relative; overflow:hidden; transition:transform .2s ease,border-color .2s ease,background .2s ease; }
        .pc-fin-action:hover { transform:translateY(-1px); border-color:#806A2B; }
      `}</style>

      {/* Finance hero */}
      <section className="rounded-3xl border border-[#39362D] bg-[#101014] overflow-hidden relative shadow-[0_16px_40px_rgba(0,0,0,.18)]">
        <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-[#D4AF37]/[0.06] blur-3xl pointer-events-none" />
        <div className="p-5 md:p-6 relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl border border-[#6D5A22] bg-[#17140B] text-[#D4AF37] grid place-items-center shadow-[0_0_24px_rgba(212,175,55,.08)]">
              <Wallet size={23} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#D4AF37]">
                <Landmark size={12} /> Financeiro
              </div>
              <h1 className="text-2xl font-black text-white mt-1">Financeiro</h1>
              <p className="text-xs text-gray-500 mt-1">Controle dos seus investimentos e saques.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section>
        <SectionTitle icon={<Receipt size={13} />} title="Resumo financeiro" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryCard label="Investido" value={formatCurrency(totalInvestido)} icon={<TrendingDown size={17} />} tone="loss" />
          <SummaryCard label="Recebido" value={formatCurrency(totalRecebido)} icon={<TrendingUp size={17} />} tone="profit" />
          <SummaryCard label="Líquido" value={formatSignedCurrency(lucroLiquido)} icon={<Wallet size={17} />} tone={lucroLiquido >= 0 ? 'profit' : 'loss'} highlight />
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <SectionTitle icon={<Sparkles size={13} />} title="Ações" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={() => setModalType('investimento')} className="pc-fin-action rounded-2xl border border-[#44363B] bg-[#171318] text-[#E0A9B7] font-bold text-sm min-h-14 px-4 flex items-center justify-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-[#26191F] grid place-items-center"><Plus size={17} /></span>
            Registrar Investimento
          </button>
          <button onClick={() => setModalType('saque')} className="pc-fin-action rounded-2xl border border-[#514A2B] bg-[#17150E] text-[#D4AF37] font-bold text-sm min-h-14 px-4 flex items-center justify-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-[#29220D] grid place-items-center"><Plus size={17} /></span>
            Registrar Saque
          </button>
        </div>
      </section>

      {/* History */}
      <section>
        <SectionTitle icon={<Receipt size={13} />} title="Histórico de movimentações" />
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#302F35] bg-[#111115] p-6 text-center">
            <p className="text-gray-600 text-xs">Nenhuma movimentação registrada.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sorted.map((m) => (
              <div key={m.id} className="rounded-2xl border border-[#29292F] bg-[#111115] p-3.5 flex items-center gap-3 shadow-[0_8px_20px_rgba(0,0,0,.12)]">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.type === 'saque' ? 'bg-[#19160D] text-[#D4AF37] border border-[#514A2B]' : 'bg-[#21161B] text-[#D99AAA] border border-[#51353D]'}`}>
                  {m.type === 'saque' ? <ArrowUpCircle size={19} /> : <ArrowDownCircle size={19} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{m.description}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{formatDateTime(m.timestamp)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold tabular-nums ${m.type === 'saque' ? 'text-[#D4AF37]' : 'text-[#D99AAA]'}`}>
                    {m.type === 'saque' ? '+' : '-'}{formatCurrency(m.amount)}
                  </p>
                  <button onClick={() => deleteMovement(m.id)} className="text-gray-600 hover:text-red-400 transition-colors mt-1" aria-label="Excluir movimentação">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <MovementModal type={modalType} onClose={() => setModalType(null)} onSave={(v, d) => { addMovement({ type: modalType!, amount: v, description: d }); setModalType(null); }} />
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#D4AF37] mb-3">
      {icon}<span>{title}</span><div className="h-px flex-1 bg-gradient-to-r from-[#5B4A1C] to-transparent" />
    </div>
  );
}

function SummaryCard({ label, value, icon, tone, highlight }: { label: string; value: string; icon: React.ReactNode; tone: 'profit' | 'loss'; highlight?: boolean }) {
  const color = tone === 'profit' ? 'text-[#4ADE80]' : 'text-[#E08C9F]';
  return (
    <div className={`pc-fin-card rounded-2xl p-4 min-h-28 ${highlight ? 'pc-fin-card-highlight' : ''}`}>
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-[.13em]">{label}</p>
          <p className={`text-xl font-black mt-2 ${color} tabular-nums`}>{value}</p>
        </div>
        <div className={`w-9 h-9 rounded-xl border border-white/5 bg-black/20 grid place-items-center ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function MovementModal({ type, onClose, onSave }: { type: MovementType | null; onClose: () => void; onSave: (amount: number, description: string) => void }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  if (!type) return null;
  const isSaque = type === 'saque';
  const submit = () => {
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || !description.trim()) return;
    onSave(val, description.trim());
    setAmount(''); setDescription('');
  };
  return (
    <Modal open={!!type} onClose={onClose} title={isSaque ? 'Registrar Saque' : 'Registrar Investimento'}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Valor (USD)</label>
          <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="Ex: 150.00" className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Descrição</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={isSaque ? 'Ex: Payout PnL Global' : 'Ex: Inscrição Teste'} className="input" />
        </div>
        <button onClick={submit} disabled={!amount || !description.trim()} className={`w-full py-3.5 rounded-2xl font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${isSaque ? 'bg-[#D4AF37] text-[#0B0B0D] hover:bg-[#E4C35A]' : 'bg-[#D99AAA] text-[#0B0B0D] hover:bg-[#E5ADBC]'}`}>Salvar</button>
      </div>
    </Modal>
  );
}
