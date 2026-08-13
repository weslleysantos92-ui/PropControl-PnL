import React, { useState, useMemo } from 'react';
import { Footprints, Award, Shield, DollarSign, Target, Calendar, HelpCircle } from 'lucide-react';
import { useStore } from '../store';

export function Journey() {
  const { trades, accounts } = useStore();
  const [customTarget, setCustomTarget] = useState<string>('50000');

  const metrics = useMemo(() => {
    const totalTrades = trades?.length || 0;
    const firstTrade = trades?.reduce((min, t) => t.timestamp < min ? t.timestamp : min, Date.now()) || Date.now();
    const daysActive = Math.max(1, Math.ceil((Date.now() - firstTrade) / (1000 * 60 * 60 * 24)));
    const approvedAccounts = accounts?.filter(acc => acc.status === 'approved' || acc.status === 'funded').length || 0;
    const fundedAccounts = accounts?.filter(acc => acc.status === 'funded').length || 0;
    const totalPayouts = accounts?.reduce((sum, acc) => sum + (acc.totalWithdrawn || 0), 0) || 0;

    return { totalTrades, daysActive, approvedAccounts, fundedAccounts, totalPayouts };
  }, [trades, accounts]);

  const disciplinaMarcos =;
  const disciplinaDias =;
  
  const disciplinaConcluidos = 
    disciplinaMarcos.filter(m => metrics.totalTrades >= m).length +
    disciplinaDias.filter(d => metrics.daysActive >= d).length;
  const progressoCap1 = Math.round((disciplinaConcluidos / 10) * 100);

  const propTraderMarcos = [
    { label: "1ª Aprovada", check: metrics.approvedAccounts >= 1 },
    { label: "1ª Financiada", check: metrics.fundedAccounts >= 1 },
    { label: "2ª Financiada", check: metrics.fundedAccounts >= 2 },
    { label: "4ª Financiada", check: metrics.fundedAccounts >= 4 },
  ];
  const progressoCap2 = Math.round((propTraderMarcos.filter(m => m.check).length / 4) * 100);

  const liberdadeMarcos =;
  const progressoCap4 = Math.round((liberdadeMarcos.filter(m => metrics.totalPayouts >= m).length / 4) * 100);

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white font-sans antialiased pb-24">
      
      {/* 1. TOPO DA TELA - ESTRADA DOURADA */}
      <div className="flex flex-col items-center text-center pt-6 pb-8 border-b border-[#D4AF37]/10 px-4">
        <div className="flex items-center space-x-4 mb-3 text-[#D4AF37]">
          <span className="text-xs font-bold tracking-widest uppercase">Hoje</span>
          <div className="h-[2px] w-24 bg-gradient-to-r from-[#D4AF37] to-amber-500 relative">
            <div className="absolute -top-1 left-1/2 w-3 h-3 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
          </div>
          <span className="text-xs font-bold tracking-widest uppercase">Liberdade</span>
        </div>
        
        <h1 className="text-lg font-medium text-white max-w-xs leading-snug">
          Você está construindo um future, <span className="text-[#D4AF37] font-semibold">uma decisão disciplinada</span> de cada vez.
        </h1>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-6">
          <div className="bg-[#12121A] border border-[#D4AF37]/20 rounded-xl p-3 shadow-[0_0_15px_rgba(212,175,55,0.03)]">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Marcos</p>
            <p className="text-xl font-bold text-[#D4AF37] mt-0.5">{disciplinaConcluidos + (propTraderMarcos.filter(m => m.check).length)}</p>
            <div className="w-full bg-black/40 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-[#D4AF37] h-full" style={{ width: `${Math.min(100, (disciplinaConcluidos / 10) * 100)}%` }} />
            </div>
          </div>

          <div className="bg-[#12121A] border border-[#D4AF37]/20 rounded-xl p-3 shadow-[0_0_15px_rgba(212,175,55,0.03)]">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Dias no App</p>
            <p className="text-xl font-bold text-[#D4AF37] mt-0.5">{metrics.daysActive}d</p>
            <div className="w-full bg-black/40 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTEÚDO DOS CAPÍTULOS */}
      <div className="max-w-md mx-auto px-4 mt-8 space-y-10 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-[#D4AF37]/30 before:to-[#D4AF37]/5">
        
        {/* CAPÍTULO 1 */}
        <div className="relative pl-12">
          <div className="absolute left-3 top-0 w-10 h-10 rounded-full bg-[#12121A] border-2 border-[#D4AF37] flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.2)]">
            <Shield className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-bold tracking-widest text-[#D4AF37] uppercase">01 Capítulo</span>
              <h2 className="text-base font-bold text-white mt-0.5">Disciplina</h2>
              <p className="text-xs text-gray-400 mt-0.5">A consistência nasce dos hábitos.</p>
            </div>
            <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full">{progressoCap1}%</span>
          </div>

          <div className="grid grid-cols-5 gap-3 mt-4">
            {disciplinaMarcos.map((marco) => (
              <div key={`m-${marco}`} className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all aspect-square ${metrics.totalTrades >= marco ? 'bg-[#1A1510] border-[#D4AF37] text-[#D4AF37]' : 'bg-[#12121A] border-gray-800 text-gray-600'}`}>
                <Award className="w-4 h-4" />
                <span className="text-[9px] font-bold mt-1">{marco >= 1000 ? `${marco/1000}k` : marco}</span>
              </div>
            ))}
            {disciplinaDias.map((dias) => (
              <div key={`d-${dias}`} className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all aspect-square ${metrics.daysActive >= dias ? 'bg-[#1A1510] border-[#D4AF37] text-[#D4AF37]' : 'bg-[#12121A] border-gray-800 text-gray-600'}`}>
                <Calendar className="w-4 h-4" />
                <span className="text-[9px] font-bold mt-1">{dias}d</span>
              </div>
            ))}
          </div>
        </div>

        {/* CAPÍTULO 2 */}
        <div className="relative pl-12">
          <div className="absolute left-3 top-0 w-10 h-10 rounded-full bg-[#12121A] border-2 border-gray-800 flex items-center justify-center">
            <Target className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-bold tracking-widest text-[#D4AF37] uppercase">02 Capítulo</span>
              <h2 className="text-base font-bold text-white mt-0.5">Prop Trader</h2>
              <p className="text-xs text-gray-400 mt-0.5">Agora você está construindo uma carreira comercial.</p>
            </div>
            <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full">{progressoCap2}%</span>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-4">
            {propTraderMarcos.map((marco, i) => (
              <div key={`p-${i}`} className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all aspect-square ${marco.check ? 'bg-[#1A1510] border-[#D4AF37] text-[#D4AF37]' : 'bg-[#12121A] border-gray-800 text-gray-500'}`}>
                <Award className="w-4 h-4" />
                <span className="text-[8px] font-medium mt-1 leading-tight">{marco.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CAPÍTULO 3 */}
        <div className="relative pl-12">
          <div className="absolute left-3 top-0 w-10 h-10 rounded-full bg-[#12121A] border-2 border-gray-800 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-bold tracking-widest text-[#D4AF37] uppercase">03 Capítulo</span>
              <h2 className="text-base font-bold text-white mt-0.5">Consistência</h2>
              <p className="text-xs text-gray-400 mt-0.5">O sucesso deixa de ser um evento e vira um processo estável.</p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">0%</span>
          </div>
        </div>

        {/* CAPÍTULO 4 */}
        <div className="relative pl-12">
          <div className="absolute left-3 top-0 w-10 h-10 rounded-full bg-[#12121A] border-2 border-gray-800 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-bold tracking-widest text-[#D4AF37] uppercase">04 Capítulo</span>
              <h2 className="text-base font-bold text-white mt-0.5">Liberdade</h2>
              <p className="text-xs text-gray-400 mt-0.5">A disciplina construiu aquilo que a pressa destruiria.</p>
            </div>
            <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full">{progressoCap4}%</span>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-4">
            {liberdadeMarcos.map((valor) => (
              <div key={`l-${valor}`} className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all aspect-square ${metrics.totalPayouts >= valor ? 'bg-[#1A1510] border-[#D4AF37] text-[#D4AF37]' : 'bg-[#12121A] border-gray-800 text-gray-600'}`}>
                <DollarSign className="w-4 h-4" />

