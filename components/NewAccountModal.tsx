import { useEffect, useMemo, useState } from 'react';
import { Modal } from './Modal';
import { SIZE_COLORS, SIZE_VALUES, type AccountSize } from '../types';
import { useApp } from '../store';
import { hydrateRules } from '../propConfig';

export function NewAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addAccount, propFirms } = useApp();
  const [firmId, setFirmId] = useState('');
  const [programId, setProgramId] = useState('');
  const [size, setSize] = useState<AccountSize>('25K');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const firms = useMemo(() => [...propFirms].sort((a, b) => a.name.localeCompare(b.name)), [propFirms]);
  const firm = firms.find(f => f.id === firmId);
  const programs = firm?.programs ?? [];
  const program = programs.find(p => p.id === programId);
  const availableSizes = (program?.sizes ?? []).filter(Boolean);
  const selectedSize = availableSizes.includes(size) ? size : (availableSizes[0] ?? '25K');
  const snapshot = useMemo(
    () => program?.phases.map(p => hydrateRules(p.rules, selectedSize)) ?? [],
    [program, selectedSize]
  );
  const colors = SIZE_COLORS[selectedSize];

  useEffect(() => {
    if (!open) return;
    setName('');
    setCode('');
    setFirmId('');
    setProgramId('');
    setSize('25K');
    setError('');
    setSaving(false);
  }, [open]);

  useEffect(() => {
    if (program && !program.sizes.includes(size)) setSize(program.sizes[0] ?? '25K');
  }, [program, size]);

  const selectFirm = (id: string) => {
    setFirmId(id);
    setProgramId('');
    setSize('25K');
    setError('');
  };

  const save = async () => {
    if (!name.trim() || !code.trim() || !firm || !program) return;
    setSaving(true);
    setError('');
    const result = await addAccount({
      name: name.trim(),
      code: code.trim(),
      size: selectedSize,
      propProgramId: program.id,
      propFirmName: firm.name,
      propProgramName: program.name,
      rulesSnapshot: snapshot,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error || 'Não foi possível cadastrar a conta.');
      return;
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Nova Conta">
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">1. Escolha a mesa</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {firms.map(f => {
              const active = f.id === firmId;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => selectFirm(f.id)}
                  className={`rounded-2xl border p-3 text-left transition ${active ? 'border-[#D4AF37]/60 bg-[#D4AF37]/[0.08] ring-1 ring-[#D4AF37]/30' : 'border-white/[0.07] bg-[#111214] hover:border-white/[0.15]'}`}
                >
                  <span className={`block text-sm font-black ${active ? 'text-[#D4AF37]' : 'text-gray-200'}`}>{f.name}</span>
                  <span className="mt-1 block text-[10px] text-gray-500">{f.isOfficial ? 'Pré-cadastrada' : 'Personalizada'} · {f.programs.length} programa{f.programs.length === 1 ? '' : 's'}</span>
                </button>
              );
            })}
          </div>
          {!firms.length && <p className="mt-2 text-xs text-amber-300">Nenhuma mesa carregada. Verifique a conexão com o catálogo de mesas.</p>}
        </div>

        {firm && (
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">2. Escolha o programa</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {programs.map(p => {
                const active = p.id === programId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setProgramId(p.id); setSize(p.sizes[0] ?? '25K'); }}
                    className={`rounded-2xl border p-3 text-left transition ${active ? 'border-[#D4AF37]/60 bg-[#D4AF37]/[0.08] ring-1 ring-[#D4AF37]/30' : 'border-white/[0.07] bg-[#111214] hover:border-white/[0.15]'}`}
                  >
                    <span className={`block text-sm font-black ${active ? 'text-[#D4AF37]' : 'text-gray-200'}`}>{p.name}</span>
                    <span className="mt-1 block text-[10px] text-gray-500">{p.phases.length} {p.phases.length === 1 ? 'fase' : 'fases'} · {p.sizes.join(' · ')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {program && (
          <>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">3. Tamanho da conta</label>
              <div className="grid grid-cols-2 gap-3">
                {availableSizes.map(s => {
                  const c = SIZE_COLORS[s];
                  const active = selectedSize === s;
                  return (
                    <button key={s} type="button" onClick={() => setSize(s)} className={`relative rounded-2xl border p-4 text-left transition ${active ? `${c.soft} ${c.ring} ring-2 border-transparent` : 'border-white/[0.07] bg-[#111214]'}`}>
                      <span className={`block text-lg font-black ${active ? c.text : 'text-gray-300'}`}>{s}</span>
                      <span className="mt-1 block text-[11px] text-gray-500">${SIZE_VALUES[s].toLocaleString('en-US')}</span>
                      {active && <span className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${c.dot}`} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">4. Nome operacional</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder={`Ex: ${firm.name} ${selectedSize} #01`} className="input" />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">5. Código Oficial (ID da Conta)</label>
              <input value={code} onChange={e => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))} inputMode="text" placeholder="Ex: FP10K-A749302" className="input" />
            </div>

            <div className={`rounded-2xl border ${colors.ring.replace('ring-', 'border-')}/20 ${colors.soft} p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-bold ${colors.text}`}>{firm.name} · {program.name}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{program.phases.length} {program.phases.length === 1 ? 'fase' : 'fases'} · regras vinculadas automaticamente</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${colors.soft} ${colors.text}`}>{colors.label}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
                {snapshot[0] && <>
                  <div><span className="text-gray-600">Meta</span><strong className="mt-1 block text-gray-300">{snapshot[0].targetPct != null ? `${snapshot[0].targetPct}%` : '—'}</strong></div>
                  <div><span className="text-gray-600">Drawdown</span><strong className="mt-1 block text-gray-300">{snapshot[0].maxDrawdown != null ? `$${snapshot[0].maxDrawdown.toLocaleString('en-US')}` : snapshot[0].drawdownType || '—'}</strong></div>
                  <div><span className="text-gray-600">Fase</span><strong className="mt-1 block text-gray-300">1 / {program.phases.length}</strong></div>
                </>}
              </div>
            </div>
          </>
        )}

        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-xs text-red-300">{error}</div>}
        <button onClick={save} disabled={saving || !name.trim() || !code.trim() || !firm || !program} className="w-full rounded-2xl border border-[#D4AF37]/50 bg-[#D4AF37]/[0.06] py-3.5 font-bold text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-40">
          {saving ? 'Salvando...' : 'Cadastrar Conta'}
        </button>
      </div>
    </Modal>
  );
}
