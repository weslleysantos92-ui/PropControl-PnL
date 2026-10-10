import { useState } from 'react';
import { Plus, TrendingDown, TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle, Trash2, Landmark, Receipt, Sparkles, X, CalendarDays } from 'lucide-react';
import { useApp } from '@/store';
import type { Account, MovementType } from '@/types';
import { formatCurrency, formatSignedCurrency, formatDateTime } from '@/dates';
import { Modal } from '@/components/Modal';

export function Finances() {
  const { movements, accounts, addMovement, deleteMovement } = useApp();
  const [modalType, setModalType] = useState<MovementType | null>(null);
  const fundedAccounts = accounts.filter((a) => a.status === 'Financiada');

  const totalInvestido = movements.filter((m) => m.type === 'investimento').reduce((s, m) => s + m.amount, 0);
  const totalRecebido = movements.filter((m) => m.type === 'saque').reduce((s, m) => s + m.amount, 0);
  const lucroLiquido = totalRecebido - totalInvestido;
  const sorted = [...movements].sort((a, b) => b.timestamp - a.timestamp);
  const investCount = movements.filter((m) => m.type === 'investimento').length;
  const saqueCount = movements.filter((m) => m.type === 'saque').length;

  return (
    <div className="pc-finances finances-page min-h-full px-3 pt-4 pb-28 text-white md:px-6 md:pt-6">
      <div className="mx-auto max-w-[1040px] space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300">PROP CONTROL / FINANCEIRO</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="finances-title-icon"><Wallet size={22} /></div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">Financeiro</h1>
                <p className="mt-1 text-xs text-slate-400">Controle dos seus investimentos e saques.</p>
              </div>
            </div>
          </div>
          <div className="finances-count-badge shrink-0">
            <CalendarDays size={14} />
            <span>{movements.length} movimentações</span>
          </div>
        </div>

        <section className="finances-hero relative overflow-hidden rounded-[24px] border border-emerald-500/20 bg-[#06120E] p-5 shadow-[0_18px_60px_rgba(0,0,0,.28)] md:p-7">
          <div className="finances-hero-glow" />
          <div className="relative flex items-center justify-between gap-6">
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-400/70">Lucro Líquido</p>
              <p className={`mt-1.5 text-3xl font-black tabular-nums md:text-4xl ${lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatSignedCurrency(lucroLiquido)}</p>
              <p className="mt-1.5 text-xs text-slate-500">{saqueCount} saques · {investCount} investimentos</p>
            </div>
            <div className="finances-hero-ring">
              <div>
                <strong>{movements.length}</strong>
                <span>Total</span>
              </div>
            </div>
          </div>
        </section>

        <section className="finances-stats grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="finances-stat-card">
            <div className="finances-stat-icon" style={{ borderColor: 'rgba(248,113,113,.35)', color: '#f87171' }}><TrendingDown size={16} /></div>
            <div><p className="finances-stat-label">Investido</p><p className="finances-stat-value text-red-400">{formatCurrency(totalInvestido)}</p></div>
          </div>
          <div className="finances-stat-card">
            <div className="finances-stat-icon" style={{ borderColor: 'rgba(52,211,153,.35)', color: '#34d399' }}><TrendingUp size={16} /></div>
            <div><p className="finances-stat-label">Recebido</p><p className="finances-stat-value text-emerald-400">{formatCurrency(totalRecebido)}</p></div>
          </div>
          <div className="finances-stat-card">
            <div className="finances-stat-icon" style={{ borderColor: 'rgba(212,175,55,.45)', color: '#D4AF37' }}><Wallet size={16} /></div>
            <div><p className="finances-stat-label">Líquido</p><p className={`finances-stat-value ${lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatSignedCurrency(lucroLiquido)}</p></div>
          </div>
        </section>

        <section className="finances-actions grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button onClick={() => setModalType('investimento')} className="finances-action-btn finances-action-invest">
            <span className="finances-action-icon"><ArrowDownCircle size={18} /></span>
            <div><p className="finances-action-title">Registrar Investimento</p><p className="finances-action-sub">Capital aportado</p></div>
          </button>
          <button onClick={() => setModalType('saque')} className="finances-action-btn finances-action-withdraw">
            <span className="finances-action-icon"><ArrowUpCircle size={18} /></span>
            <div><p className="finances-action-title">Registrar Saque</p><p className="finances-action-sub">Payout recebido</p></div>
          </button>
        </section>

        <section>
          <div className="finances-section-title"><Receipt size={13} /><span>Histórico de movimentações</span><div className="finances-section-line" /></div>
          {sorted.length === 0 ? (
            <div className="finances-empty">
              <CalendarDays size={28} className="text-slate-700" />
              <p className="mt-3 text-sm text-slate-500">Nenhuma movimentação registrada.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sorted.map((m) => (
                <div key={m.id} className="finances-movement-row">
                  <div className={`finances-movement-icon ${m.type === 'saque' ? 'icon-saque' : 'icon-invest'}`}>
                    {m.type === 'saque' ? <ArrowUpCircle size={19} /> : <ArrowDownCircle size={19} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{m.description}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{formatDateTime(m.timestamp)}{m.type === 'saque' && m.accountId && (() => { const acc = accounts.find((a) => a.id === m.accountId); return acc ? ` · ${acc.name}${m.splitPct ? ` · ${m.splitPct}% de ${formatCurrency(m.requestedAmount ?? m.amount)}` : ''}` : ''; })()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-extrabold tabular-nums ${m.type === 'saque' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.type === 'saque' ? '+' : '-'}{formatCurrency(m.amount)}
                    </p>
                    <button onClick={() => deleteMovement(m.id)} className="text-slate-600 hover:text-red-400 transition-colors mt-1" aria-label="Excluir movimentação">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <MovementModal type={modalType} fundedAccounts={fundedAccounts} onClose={() => setModalType(null)} onSave={(payload) => { addMovement({ type: modalType!, ...payload }); setModalType(null); }} />
    </div>
  );
}

function MovementModal({ type, fundedAccounts, onClose, onSave }: { type: MovementType | null; fundedAccounts: Account[]; onClose: () => void; onSave: (payload: { amount: number; description: string; accountId?: string; requestedAmount?: number; splitPct?: number }) => void }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [splitPct, setSplitPct] = useState('85');
  if (!type) return null;
  const isSaque = type === 'saque';
  const requested = parseFloat(amount.replace(',', '.'));
  const pct = parseFloat(splitPct.replace(',', '.'));
  const received = isSaque && Number.isFinite(requested) && Number.isFinite(pct) ? requested * (pct / 100) : requested;
  const canSubmit = isSaque
    ? Number.isFinite(requested) && requested > 0 && Number.isFinite(pct) && pct > 0 && pct <= 100 && !!accountId
    : Number.isFinite(requested) && requested > 0 && !!description.trim();
  const submit = () => {
    if (!canSubmit) return;
    if (isSaque) {
      const account = fundedAccounts.find((a) => a.id === accountId);
      const desc = description.trim() || `Saque - ${account?.name ?? 'Conta'}`;
      onSave({ amount: received, description: desc, accountId, requestedAmount: requested, splitPct: pct });
    } else {
      onSave({ amount: requested, description: description.trim() });
    }
    setAmount(''); setDescription(''); setAccountId(''); setSplitPct('85');
  };
  return (
    <Modal open={!!type} onClose={onClose} title={isSaque ? 'Registrar Saque' : 'Registrar Investimento'}>
      <div className="space-y-4">
        {isSaque && (
          <div>
            <label className="finances-modal-label">Conta (carteira financiada)</label>
            {fundedAccounts.length === 0 ? (
              <p className="finances-modal-empty">Você ainda não tem nenhuma conta financiada disponível para saque.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {fundedAccounts.map((a) => (
                  <button key={a.id} type="button" onClick={() => setAccountId(a.id)} className={`finances-account-pill ${accountId === a.id ? 'pill-active' : ''}`}>{a.name}</button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className={isSaque ? 'grid grid-cols-2 gap-3' : ''}>
          <div>
            <label className="finances-modal-label">{isSaque ? 'Valor Solicitado (USD)' : 'Valor (USD)'}</label>
            <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="Ex: 150.00" className="finances-modal-input" />
          </div>
          {isSaque && (
            <div>
              <label className="finances-modal-label">% de Repasse</label>
              <input type="text" inputMode="decimal" value={splitPct} onChange={(e) => setSplitPct(e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="Ex: 85" className="finances-modal-input" />
            </div>
          )}
        </div>
        {isSaque && Number.isFinite(requested) && requested > 0 && Number.isFinite(pct) && pct > 0 && (
          <div className="finances-modal-calc">Você vai receber de verdade <span className="font-bold text-emerald-400">{formatCurrency(received)}</span> ({pct}% de {formatCurrency(requested)}). O valor cheio é descontado do resultado da conta.</div>
        )}
        <div>
          <label className="finances-modal-label">Descrição {isSaque && <span className="normal-case font-normal text-slate-600">(opcional)</span>}</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={isSaque ? 'Ex: Payout PnL Global' : 'Ex: Inscrição Teste'} className="finances-modal-input" />
        </div>
        <button onClick={submit} disabled={!canSubmit} className={`finances-modal-submit ${isSaque ? 'submit-saque' : 'submit-invest'} disabled:opacity-40 disabled:cursor-not-allowed`}>Salvar</button>
      </div>
    </Modal>
  );
}
