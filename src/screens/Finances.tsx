import { useState } from 'react';
import { Plus, TrendingDown, TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle, Trash2 } from 'lucide-react';
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
    <div className="px-4 pt-4 pb-28 space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <SummaryCard
          label="Investido"
          value={formatCurrency(totalInvestido)}
          icon={<TrendingDown size={16} />}
          tone="loss"
        />
        <SummaryCard
          label="Recebido"
          value={formatCurrency(totalRecebido)}
          icon={<TrendingUp size={16} />}
          tone="profit"
        />
        <SummaryCard
          label="Líquido"
          value={formatSignedCurrency(lucroLiquido)}
          icon={<Wallet size={16} />}
          tone={lucroLiquido >= 0 ? 'profit' : 'loss'}
          highlight
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setModalType('investimento')}
          className="py-3 rounded-2xl border border-loss-text/30 bg-loss-soft text-loss-text font-semibold text-sm hover:bg-loss-soft/70 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Registrar Investimento
        </button>
        <button
          onClick={() => setModalType('saque')}
          className="py-3 rounded-2xl border border-funded-ring bg-funded-soft text-funded-text font-semibold text-sm hover:bg-funded-soft/70 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Registrar Saque
        </button>
      </div>

      {/* History */}
      <div>
        <h3 className="text-sm font-bold text-gray-300 mb-3">Histórico de Movimentações</h3>
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-700 bg-ink-850/50 p-4 text-center">
            <p className="text-gray-600 text-xs">Nenhuma movimentação registrada.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((m) => (
              <div key={m.id} className="rounded-xl border border-ink-700 bg-ink-850 p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  m.type === 'saque' ? 'bg-funded-soft text-funded-text' : 'bg-loss-soft text-loss-text'
                }`}>
                  {m.type === 'saque' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{m.description}</p>
                  <p className="text-[11px] text-gray-500">{formatDateTime(m.timestamp)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${m.type === 'saque' ? 'text-profit-text' : 'text-loss-text'}`}>
                    {m.type === 'saque' ? '+' : '-'}{formatCurrency(m.amount)}
                  </p>
                  <button
                    onClick={() => deleteMovement(m.id)}
                    className="text-gray-600 hover:text-loss-text transition-colors mt-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MovementModal type={modalType} onClose={() => setModalType(null)} onSave={(v, d) => { addMovement({ type: modalType!, amount: v, description: d }); setModalType(null); }} />
    </div>
  );
}

function SummaryCard({ label, value, icon, tone, highlight }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: 'profit' | 'loss';
  highlight?: boolean;
}) {
  const color = tone === 'profit' ? 'text-profit-text' : 'text-loss-text';
  return (
    <div className={`rounded-2xl border p-3 ${highlight ? 'border-ink-600 bg-ink-800' : 'border-ink-700 bg-ink-850'}`}>
      <div className={`flex items-center gap-1 mb-1 ${color}`}>{icon}</div>
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-base font-bold ${color} tabular-nums`}>{value}</p>
    </div>
  );
}

function MovementModal({ type, onClose, onSave }: {
  type: MovementType | null;
  onClose: () => void;
  onSave: (amount: number, description: string) => void;
}) {
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
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
            placeholder="Ex: 150.00"
            className="input"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Descrição</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isSaque ? 'Ex: Payout Lucid' : 'Ex: Inscrição Teste'}
            className="input"
          />
        </div>
        <button
          onClick={submit}
          disabled={!amount || !description.trim()}
          className={`w-full py-3.5 rounded-2xl font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
            isSaque ? 'bg-funded-text text-ink-950 hover:bg-funded-text/90' : 'bg-loss-text text-ink-950 hover:bg-loss-text/90'
          }`}
        >
          Salvar
        </button>
      </div>
    </Modal>
  );
}
