import { useState } from 'react';
import { Modal } from './Modal';
import { ACCOUNT_SIZES, ACCOUNT_STATUSES, type AccountSize, type AccountStatus } from '../types';
import { useApp } from '../store';

export function NewAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addAccount } = useApp();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [size, setSize] = useState<AccountSize>('50K');
  const [status, setStatus] = useState<AccountStatus>('Avaliacao');
  const [propFirm, setPropFirm] = useState('LucidFlex');

  const save = () => {
    if (!name.trim() || !code.trim()) return;
    addAccount({ name: name.trim(), code: code.trim(), size, status, propFirm: propFirm.trim() || '—' });
    setName(''); setCode(''); setSize('50K'); setStatus('Avaliacao'); setPropFirm('LucidFlex');
    onClose();
  };

  return <Modal open={open} onClose={onClose} title="Nova Conta">
    <div className="space-y-4">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome operacional" className="input" />
      <input value={code} onChange={e => setCode(e.target.value)} placeholder="Código oficial" className="input" />
      <input value={propFirm} onChange={e => setPropFirm(e.target.value)} placeholder="Prop Firm" className="input" />
      <div><p className="text-xs font-semibold text-gray-400 mb-2">Tamanho</p><div className="grid grid-cols-4 gap-2">{ACCOUNT_SIZES.map(s => <button key={s} onClick={() => setSize(s)} className={`py-2 rounded-xl text-xs font-bold border ${size === s ? 'bg-white text-black border-white' : 'bg-ink-800 text-gray-400 border-ink-700'}`}>{s}</button>)}</div></div>
      <div><p className="text-xs font-semibold text-gray-400 mb-2">Status</p><div className="grid grid-cols-3 gap-2">{ACCOUNT_STATUSES.map(s => <button key={s} onClick={() => setStatus(s)} className={`py-2 rounded-xl text-xs font-bold border ${status === s ? 'bg-white text-black border-white' : 'bg-ink-800 text-gray-400 border-ink-700'}`}>{s === 'Avaliacao' ? 'Avaliação' : s}</button>)}</div></div>
      <button onClick={save} disabled={!name.trim() || !code.trim()} className="w-full py-3.5 rounded-2xl bg-white text-black font-bold disabled:opacity-40">Criar Conta</button>
    </div>
  </Modal>;
}
