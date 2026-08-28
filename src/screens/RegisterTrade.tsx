import { useMemo, useState } from 'react';
import {
  ArrowLeft, FileText, SlidersHorizontal, Globe2, Crosshair, Clock3,
  Trophy, DollarSign, NotebookPen, Save, ChevronRight, Check, X, Minus,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '@/store';
import { CONTEXTS, TIMEFRAMES, type Account, type Context, type Timeframe, type TradeResult } from '@/types';

interface RegisterTradeProps { accountId: string; onBack: () => void; }
const gold = '#D4AF37';

export function RegisterTrade({ accountId, onBack }: RegisterTradeProps) {
  const { accounts, addTrade } = useApp();
  const account = accounts.find((a) => a.id === accountId);
  const [asset, setAsset] = useState('');
  const [context, setContext] = useState<Context>('Captura de Liquidez');
  const [timeframe, setTimeframe] = useState<Timeframe>('M5');
  const [result, setResult] = useState<TradeResult>('Take');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const displayName = useMemo(() => account?.name ?? 'Conta', [account]);

  if (!account) return <div className="min-h-[60vh] flex items-center justify-center text-white"><button onClick={onBack} className="text-sm text-[#D4AF37]">Conta não encontrada. Voltar</button></div>;

  const saveTrade = async () => {
    const value = Number(amount.replace(',', '.'));
    const normalizedAsset = asset.trim().toUpperCase();
    if (!normalizedAsset || !Number.isFinite(value) || value <= 0 || saving) return;
    setSaving(true); setSaveError('');
    const signedAmount = result === 'Stop' ? -value : result === 'BE' ? 0 : value;
    const response = await addTrade({ accountId: account.id, asset: normalizedAsset, context, timeframe, result, amount: signedAmount, note: note.trim() || undefined });
    if (!response.ok) { setSaveError(`Não foi possível salvar o trade. ${response.error || 'Verifique a conexão com o banco de dados.'}`); setSaving(false); return; }
    onBack();
  };

  return (
    <div className="register-trade mx-auto w-full max-w-[920px] px-4 pb-8" style={{ fontFamily: 'Manrope, Inter, sans-serif' }}>
      <div className="flex items-start justify-between pt-2 md:pt-4"><button onClick={onBack} aria-label="Voltar" className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#6D5410] bg-[#0D0D10] text-[#D4AF37] hover:bg-[#18140A]"><ArrowLeft size={24} /></button><div className="text-center pt-0.5"><h1 className="text-[28px] font-extrabold tracking-tight text-white md:text-[34px]">Registrar Trade</h1><p className="mt-1 text-sm text-[#A7A7AE] md:text-base">Registre sua execução e continue sua jornada.</p></div><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-transparent text-[#D4AF37]"><FileText size={27} /></div></div>
      <section className="mt-6 rounded-[22px] border border-[#806615] bg-[radial-gradient(circle_at_20%_10%,rgba(212,175,55,.08),transparent_35%),#0D0D10] p-5 shadow-[0_15px_40px_rgba(0,0,0,.35)] md:p-7"><div className="flex flex-col gap-5 md:flex-row md:items-center"><div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-[#6D5410] bg-[#09090B] text-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,.08)]"><span className="text-4xl font-black">P</span></div><div className="min-w-0 flex-1"><h2 className="truncate text-[26px] font-extrabold text-white">{displayName}</h2><span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${account.status === 'Financiada' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>{account.status === 'Financiada' ? 'FINANCIADA' : 'AVALIAÇÃO'}</span><div className="mt-4 flex gap-8 text-sm text-[#A7A7AE]"><div><span className="block text-xs text-[#777780]">Mesa</span><strong className="text-lg text-white">{account.propFirm ?? 'FundingPips'}</strong></div><div className="border-l border-[#292930] pl-8"><span className="block text-xs text-[#777780]">Conta</span><strong className="text-lg text-white">{account.size}</strong></div></div></div></div></section>
      <section className="mt-5 rounded-[22px] border border-[#38331F] bg-[#101014] p-5 shadow-[0_15px_40px_rgba(0,0,0,.3)] md:p-7"><SectionTitle icon={<SlidersHorizontal size={23} />} title="Dados do Trade" /><div className="mt-6 grid gap-5 md:grid-cols-3"><FieldText icon={<Globe2 size={22} />} label="Ativo" value={asset} onChange={setAsset} placeholder="Ex.: XAUUSD, BTCUSD, EURUSD" /><FieldSelect icon={<Crosshair size={22} />} label="Contexto" value={context} onChange={(v) => setContext(v as Context)} options={CONTEXTS} /><FieldSelect icon={<Clock3 size={22} />} label="Timeframe" value={timeframe} onChange={(v) => setTimeframe(v as Timeframe)} options={TIMEFRAMES} /></div><div className="my-6 border-t border-[#24242A]" /><SectionTitle icon={<Trophy size={23} />} title="Resultado" /><div className="mt-4 grid gap-3 md:grid-cols-3"><ResultButton active={result === 'Take'} color="#2ECC71" icon={<Check size={19} />} label="TAKE" onClick={() => setResult('Take')} /><ResultButton active={result === 'Stop'} color="#E04B4B" icon={<X size={19} />} label="STOP" onClick={() => setResult('Stop')} /><ResultButton active={result === 'BE'} color="#A5A5AC" icon={<Minus size={19} />} label="BE" onClick={() => setResult('BE')} /></div><div className="my-6 border-t border-[#24242A]" /><label className="block"><span className="mb-3 flex items-center gap-3 text-base text-[#C6C6CB]"><DollarSign size={22} className="text-[#D4AF37]" />Resultado Financeiro (USD)</span><div className="flex h-16 items-center rounded-2xl border border-[#303036] bg-[#17171C] px-5 focus-within:border-[#806615]"><span className="mr-2 text-xl font-bold text-[#777780]">US$</span><input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0,00" className="min-w-0 flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder:text-[#55555E]" /><span className="rounded-xl border border-[#292930] bg-[#101014] px-4 py-2 text-sm font-bold text-[#D7D7DC]">USD</span></div></label><div className="my-6 border-t border-[#24242A]" /><label className="block"><span className="mb-3 flex items-center gap-3 text-base text-[#C6C6CB]"><NotebookPen size={22} className="text-[#D4AF37]" />Observação <span className="text-sm text-[#777780]">(opcional)</span></span><div className="relative"><textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} maxLength={300} placeholder="Digite sua observação..." className="min-h-36 w-full resize-none rounded-2xl border border-[#303036] bg-[#17171C] p-5 pb-10 text-base text-white outline-none placeholder:text-[#66666F] focus:border-[#806615]" /><span className="absolute bottom-4 right-4 text-xs text-[#777780]">{note.length}/300</span></div></label></section>
      {saveError && <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">{saveError}</div>}
      <button onClick={saveTrade} disabled={saving || !asset.trim() || !amount || Number(amount.replace(',', '.')) <= 0} className="mt-5 flex h-20 w-full items-center justify-center gap-4 rounded-full bg-gradient-to-r from-[#D49A13] via-[#F0C348] to-[#D49A13] text-xl font-black tracking-wide text-[#080808] shadow-[0_8px_30px_rgba(212,175,55,.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"><Save size={27} /> {saving ? 'SALVANDO...' : 'SALVAR TRADE'}</button>
      <div className="mt-5 flex items-center gap-4 rounded-[22px] border border-[#303036] bg-[#121216] p-5 text-[#B7B7BE]"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]"><ShieldCheck size={24} /></div><p className="text-sm leading-6 md:text-base">Disciplina é executar seu plano,<br />não importa o resultado.</p></div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) { return <div className="flex items-center gap-3 text-[21px] font-extrabold text-[#D4AF37]"><span>{icon}</span><span>{title}</span><span className="ml-2 h-px flex-1 bg-[#4A3D17]" /></div>; }
function FieldText({ icon, label, value, onChange, placeholder }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; placeholder: string }) { return <label className="block"><span className="mb-3 flex items-center gap-3 text-base text-[#C6C6CB]">{icon}<span>{label}</span></span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-16 w-full rounded-2xl border border-[#303036] bg-[#17171C] px-5 text-lg font-semibold uppercase text-white outline-none placeholder:normal-case placeholder:font-normal placeholder:text-[#55555E] focus:border-[#806615]" /></label>; }
function FieldSelect({ icon, label, value, onChange, options }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; options: readonly string[] }) { return <label className="block"><span className="mb-3 flex items-center gap-3 text-base text-[#C6C6CB]">{icon}<span>{label}</span></span><div className="relative"><select value={value} onChange={(e) => onChange(e.target.value)} className="h-16 w-full appearance-none rounded-2xl border border-[#303036] bg-[#17171C] px-5 pr-12 text-lg text-white outline-none focus:border-[#806615]">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><ChevronRight className="pointer-events-none absolute right-4 top-5 rotate-90 text-[#BDBDC4]" size={20} /></div></label>; }
function ResultButton({ active, color, icon, label, onClick }: { active: boolean; color: string; icon: React.ReactNode; label: string; onClick: () => void }) { return <button onClick={onClick} className="flex h-20 items-center justify-center gap-3 rounded-2xl border text-lg font-extrabold transition" style={{ borderColor: active ? color : '#303036', background: active ? `${color}12` : '#141419`, color: active ? color : '#A5A5AC', boxShadow: active ? `0 0 18px ${color}12` : 'none' }}><span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: active ? color : '#777780', color: '#fff' }}>{icon}</span>{label}</button>; }
