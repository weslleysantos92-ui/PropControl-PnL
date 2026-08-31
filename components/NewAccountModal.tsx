import { useState } from 'react';
import { BarChart3, Check, Crown, Gem, Plus, ShieldCheck, Sparkles, Trophy, UserRound, UserRoundPlus, BadgeCheck } from 'lucide-react';
import { Modal } from './Modal';
import { FUNDING_PIPS_FLEX_SIZES, SIZE_COLORS, type AccountSize } from '../types';
import { useApp } from '../store';

const SIZE_ICONS: Record<AccountSize, typeof Gem> = {
  '5K': Gem,
  '10K': Gem,
  '25K': Sparkles,
  '50K': Crown,
  '100K': Trophy,
  '150K': Trophy,
};

export function NewAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addAccount } = useApp();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [size, setSize] = useState<AccountSize>('25K');

  const save = () => {
    if (!name.trim() || !code.trim()) return;
    addAccount({ name: name.trim(), code: code.trim(), size });
    setName('');
    setCode('');
    setSize('25K');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Nova Conta" showHeader={false}>
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-[#0B0B0D] px-4 py-4 shadow-[0_0_35px_rgba(212,175,55,0.08)]">
          <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/60 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_18px_rgba(212,175,55,0.12)]">
              <UserRoundPlus size={25} strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#D4AF37]">Nova Conta</h2>
              <p className="mt-0.5 text-xs text-gray-400">Cadastre uma nova conta FundingPips</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Fechar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-gray-500 transition hover:border-[#D4AF37]/40 hover:text-white">×</button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#111214] p-4 shadow-inner shadow-black/20">
          <div className="space-y-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]"><UserRound size={16} /> Nome operacional</label>
              <div className="relative">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: PnL 25K #01" className="input pr-12" autoComplete="off" />
                <UserRound size={19} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]"><BadgeCheck size={16} /> Código oficial (ID da conta)</label>
              <div className="relative">
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                  inputMode="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  placeholder="Ex: FP25K01A"
                  className="input pr-12 uppercase tracking-wide"
                />
                <BadgeCheck size={19} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 px-1">
            <BarChart3 size={19} className="text-[#D4AF37]" />
            <p className="text-sm font-bold uppercase tracking-wider text-[#D4AF37]">Tamanho do capital</p>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {FUNDING_PIPS_FLEX_SIZES.map(s => {
              const colors = SIZE_COLORS[s];
              const Icon = SIZE_ICONS[s];
              const active = size === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  aria-pressed={active}
                  className={`group relative flex min-h-[112px] flex-col items-center justify-center overflow-hidden rounded-2xl border px-2 py-3 text-center transition-all duration-200 ${active ? `${colors.soft} ${colors.ring} ring-2 shadow-[0_0_22px_rgba(212,175,55,0.08)]` : 'border-white/[0.08] bg-[#0E0F11] hover:border-white/[0.16]'}`}
                >
                  {active && <span className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full ${colors.dot} text-white`}><Check size={12} strokeWidth={3} /></span>}
                  <Icon size={30} strokeWidth={1.7} className={`${active ? colors.text : 'text-gray-500'} transition-colors`} />
                  <span className={`mt-2 text-xl font-black tracking-tight ${active ? colors.text : 'text-gray-300'}`}>{s}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 px-1">
            <ShieldCheck size={18} className="text-[#D4AF37]" />
            <p className="text-sm font-bold uppercase tracking-wider text-[#D4AF37]">Fase da conta</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-blue-500/40 bg-blue-500/[0.06] px-4 py-3.5 shadow-[0_0_18px_rgba(59,130,246,0.05)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-400/50 bg-blue-500/10 text-blue-400"><ShieldCheck size={21} /></div>
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-white">Challenge</p>
              <p className="text-[11px] text-gray-500">A conta começa automaticamente na avaliação.</p>
            </div>
          </div>
        </div>

        <button onClick={save} disabled={!name.trim() || !code.trim()} className="group relative w-full overflow-hidden rounded-2xl border border-[#D4AF37]/70 bg-gradient-to-r from-[#B98B20] via-[#D4AF37] to-[#B98B20] py-4 font-black uppercase tracking-[0.18em] text-[#090909] shadow-[0_0_28px_rgba(212,175,55,0.16)] transition-all hover:shadow-[0_0_34px_rgba(212,175,55,0.26)] disabled:cursor-not-allowed disabled:opacity-40">
          <span className="relative flex items-center justify-center gap-3"><Plus size={21} strokeWidth={2.8} /> Cadastrar Conta</span>
        </button>
      </div>
    </Modal>
  );
}
