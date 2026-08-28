import { useState } from 'react';
import { Modal } from './Modal';
import { FUNDING_PIPS_FLEX_SIZES, SIZE_COLORS, SIZE_VALUES, PNL_RULES, type AccountSize } from '../types';
import { getFundingPipsProfitConcentrationLimit, getFundingPipsProfitableDayMinimum } from '../fundingPips2StepFlex';
import { useApp } from '../store';

export function NewAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addAccount } = useApp();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [size, setSize] = useState<AccountSize>('25K');
  const selectedColor = SIZE_COLORS[size];
  const selectedRules = PNL_RULES[size];
  const accountValue = SIZE_VALUES[size];
  const concentration = getFundingPipsProfitConcentrationLimit(accountValue);
  const profitableDayMinimum = getFundingPipsProfitableDayMinimum(accountValue);

  const save = () => {
    if (!name.trim() || !code.trim()) return;
    addAccount({ name: name.trim(), code: code.trim(), size });
    setName(''); setCode(''); setSize('25K'); onClose();
  };

  return <Modal open={open} onClose={onClose} title="Nova Conta">
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-4">
        <p className="text-xs font-black uppercase tracking-wider text-[#D4AF37]">FundingPips</p>
        <p className="mt-1 text-[11px] text-gray-500">Drawdown estático de 12% · Fase 1: 10% · Fase 2: 6%</p>
      </div>

      <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">Nome operacional</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: FundingPips 25K #01" className="input" /></div>
      <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">Código Oficial (ID da Conta)</label><input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="ID da conta" className="input" /></div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Capital da conta</p>
        <div className="grid grid-cols-2 gap-3">
          {FUNDING_PIPS_FLEX_SIZES.map(s => { const colors = SIZE_COLORS[s]; const active = size === s; return <button key={s} type="button" onClick={() => setSize(s)} className={`relative rounded-2xl border p-4 text-left transition-all duration-200 ${active ? `${colors.soft} ${colors.ring} ring-2 border-transparent shadow-lg` : 'border-white/[0.07] bg-[#111214] hover:border-white/[0.14]'}`}><span className={`block text-lg font-black ${active ? colors.text : 'text-gray-300'}`}>{s}</span><span className="mt-1 block text-[11px] text-gray-500">${SIZE_VALUES[s].toLocaleString('en-US')}</span>{active && <span className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${colors.dot}`} />}</button>; })}
        </div>
      </div>

      <div className={`rounded-2xl border ${selectedColor.ring.replace('ring-', 'border-')}/20 ${selectedColor.soft} p-4`}>
        <div className="flex items-center justify-between"><div><p className={`text-xs font-bold ${selectedColor.text}`}>FundingPips · {size}</p><p className="mt-1 text-[11px] text-gray-500">Fase 1 · Drawdown estático</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${selectedColor.soft} ${selectedColor.text}`}>{selectedColor.label}</span></div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-[10px]">
          <div><span className="text-gray-600">Meta Fase 1</span><strong className="mt-1 block text-gray-300">${selectedRules.phase1Target.toLocaleString('en-US')}</strong></div>
          <div><span className="text-gray-600">Meta Fase 2</span><strong className="mt-1 block text-gray-300">${selectedRules.phase2Target.toLocaleString('en-US')}</strong></div>
          <div><span className="text-gray-600">Drawdown Fase 1</span><strong className="mt-1 block text-red-300">-${selectedRules.maxLoss.toLocaleString('en-US')}</strong></div>
          <div><span className="text-gray-600">Drawdown Fase 2</span><strong className="mt-1 block text-red-300">-${selectedRules.maxLoss.toLocaleString('en-US')}</strong></div>
          <div><span className="text-gray-600">Profit Concentration</span><strong className="mt-1 block text-gray-300">{concentration === null ? 'Não se aplica' : `${concentration}%`}</strong></div>
          <div><span className="text-gray-600">Dias lucrativos mínimos</span><strong className="mt-1 block text-gray-300">3 dias ≥ ${profitableDayMinimum.toLocaleString('en-US')}</strong></div>
        </div>
        {concentration !== null && <p className="mt-3 text-[10px] text-amber-300/80">A concentração acima de {concentration}% é apenas um aviso visual no gerenciamento e não reprova a conta.</p>}
      </div>

      <button onClick={save} disabled={!name.trim() || !code.trim()} className="w-full rounded-2xl border border-[#D4AF37]/50 bg-[#D4AF37]/[0.06] py-3.5 font-bold text-[#D4AF37] transition-all hover:bg-[#D4AF37]/[0.12] disabled:cursor-not-allowed disabled:opacity-40">Cadastrar Conta</button>
    </div>
  </Modal>;
}
