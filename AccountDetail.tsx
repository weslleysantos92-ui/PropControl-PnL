import { useState } from 'react';
import { ArrowLeft, Lock, Check, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '@/store';
import type { Account, Asset, Context, Timeframe, TradeResult, AccountStatus, Trade } from '@/types';
import { ASSETS, CONTEXTS, TIMEFRAMES, TRADE_RESULTS, ACCOUNT_STATUSES, SIZE_COLORS, LUCIDFLEX_RULES } from '@/types';
import { SizeTag, StatusTag } from '@/components/Tags';
import { formatCurrency, formatSignedCurrency, formatDateTime } from '@/dates';

export function AccountDetail({ accountId, onBack }: { accountId: string; onBack: () => void }) {
  const { accounts, trades, addTrade, setAccountStatus, deleteAccount } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const account = accounts.find((a) => a.id === accountId);
  const [tab, setTab] = useState<'registrar' | 'detalhes'>('registrar');

  if (!account) {
    return (
      <div className="px-4 pt-4">
        <button onClick={onBack} className="text-gray-400">Voltar</button>
        <p className="text-gray-500 mt-4">Conta não encontrada.</p>
      </div>
    );
  }

  const accountTrades = trades.filter((t) => t.accountId === accountId);

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-ink-950/90 backdrop-blur-md border-b border-ink-800 px-4 pt-3 pb-3 safe-top">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-ink-800 flex items-center justify-center text-gray-300 hover:bg-ink-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${SIZE_COLORS[account.size].dot}`} />
            <h1 className="text-base font-bold text-white truncate">{account.name}</h1>
          </div>
        </div>
        {/* Sub tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-ink-850 rounded-xl">
          <button
            onClick={() => setTab('registrar')}
            className={`py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'registrar' ? 'bg-ink-700 text-white' : 'text-gray-500'
            }`}
          >
            📝 Registrar Trade
          </button>
          <button
            onClick={() => setTab('detalhes')}
            className={`py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'detalhes' ? 'bg-ink-700 text-white' : 'text-gray-500'
            }`}
          >
            📊 Detalhes da Conta
          </button>
        </div>
      </div>

      {tab === 'registrar' ? (
        <RegisterTrade account={account} onSave={(t) => { addTrade({ accountId, ...t }); onBack(); }} />
      ) : (
        <Details
          account={account}
          trades={accountTrades}
          onStatusChange={(s) => setAccountStatus(accountId, s)}
          onDelete={() => setConfirmDelete(true)}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmDelete(false)}>
          <div className="w-full max-w-md bg-ink-850 rounded-t-3xl p-6 animate-sheet-up safe-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-loss-soft text-loss-text flex items-center justify-center mb-3">
                <AlertTriangle size={22} />
              </div>
              <h3 className="text-base font-bold text-white">Excluir conta?</h3>
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                A conta <span className="text-white font-semibold">{account.name}</span> e todos os seus {accountTrades.length} trade(s) registrados serão removidos permanentemente.
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => { deleteAccount(accountId); onBack(); }}
                className="w-full py-3.5 rounded-2xl bg-loss-text text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Trash2 size={18} /> Sim, excluir conta
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="w-full py-3.5 rounded-2xl bg-ink-700 text-white font-semibold hover:bg-ink-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function RegisterTrade({ account, onSave }: {
  account: Account;
  onSave: (t: { asset: Asset; context: Context; timeframe: Timeframe; result: TradeResult; amount: number; note?: string }) => void;
}) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [context, setContext] = useState<Context | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe | null>(null);
  const [result, setResult] = useState<TradeResult | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const valid = asset && context && timeframe && result && amount !== '';

  const submit = () => {
    if (!valid) return;
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val)) return;
    onSave({ asset: asset!, context: context!, timeframe: timeframe!, result: result!, amount: val, note: note.trim() || undefined });
  };

  return (
    <div className="px-4 pt-4 space-y-5">
      {/* Conta travada */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Conta</label>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-ink-800 border border-ink-700 text-gray-300">
          <Lock size={14} className="text-gray-500" />
          <span className="text-sm">{account.name}</span>
          <SizeTag size={account.size} className="ml-auto" />
        </div>
      </div>

      <ChipField label="Ativo" options={ASSETS} value={asset} onChange={setAsset} />
      <ChipField label="Contexto" options={CONTEXTS} value={context} onChange={setContext} />
      <ChipField label="Timeframe" options={TIMEFRAMES} value={timeframe} onChange={setTimeframe} />
      <ChipField label="Resultado" options={TRADE_RESULTS} value={result} onChange={setResult} />

      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Resultado Financeiro (USD)</label>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,-]/g, ''))}
          placeholder="Ex: 45.00 ou -60.00"
          className="input"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Observação (opcional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anotações do trade..."
          rows={2}
          className="input resize-none"
        />
      </div>

      <button
        onClick={submit}
        disabled={!valid}
        className="w-full py-3.5 rounded-2xl bg-white text-ink-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
      >
        <Check size={18} /> Salvar Trade
      </button>
    </div>
  );
}

function ChipField<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              value === opt
                ? 'bg-white text-ink-950 border-white'
                : 'bg-ink-800 text-gray-400 border-ink-700 hover:border-ink-600 hover:text-gray-200'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Details({ account, trades, onStatusChange, onDelete }: {
  account: Account;
  trades: Trade[];
  onStatusChange: (s: AccountStatus) => void;
  onDelete: () => void;
}) {
  const { deleteTrade } = useApp();
  const sortedTrades = [...trades].sort((a, b) => b.timestamp - a.timestamp);
  const totalProfit = trades.reduce((s, t) => s + t.amount, 0);
  const takes = trades.filter((t) => t.result === 'Take').length;
  const stops = trades.filter((t) => t.result === 'Stop').length;
  const bes = trades.filter((t) => t.result === 'BE').length;
  return (
    <div className="px-4 pt-4 space-y-5">
      {/* Info card */}
      <div className="rounded-2xl border border-ink-700 bg-ink-850 p-5 space-y-3">
        <InfoRow label="Nome Operacional" value={account.name} />
        <InfoRow label="Código Oficial" value={account.code} mono />
        <InfoRow label="Prop Firm" value={account.propFirm} />
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</span>
          <StatusTag status={account.status} size={account.size} />
        </div>
      </div>

      {/* Regras LucidFlex da conta */}
      <AccountRulesCard account={account} trades={trades} />

      {/* Status change */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Alterar Status</label>
        <div className="grid grid-cols-3 gap-2">
          {ACCOUNT_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                account.status === s
                  ? s === 'Financiada' ? 'bg-funded-soft text-funded-text border-funded-ring'
                  : s === 'Reprovada' ? 'bg-loss-soft text-loss-text border-loss-text'
                  : 'bg-ink-700 text-white border-ink-600'
                  : 'bg-ink-800 text-gray-400 border-ink-700'
              }`}
            >
              {s === 'Avaliacao' ? 'Avaliação' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Histórico */}
      <div>
        <h3 className="text-sm font-bold text-gray-300 mb-2">Histórico de Trades ({trades.length})</h3>
        {trades.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-700 bg-ink-850/50 p-4 text-center">
            <p className="text-gray-600 text-xs">Nenhum trade registrado nesta conta.</p>
          </div>
        ) : (
          <>
            {/* Resumo financeiro */}
            <div className="rounded-2xl border border-ink-700 bg-ink-850 p-4 mb-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Resultado Financeiro</span>
                <span className={`text-lg font-extrabold tabular-nums ${totalProfit >= 0 ? 'text-profit-text' : 'text-loss-text'}`}>
                  {formatSignedCurrency(totalProfit)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-funded-soft/50 border border-funded-ring/30 py-2">
                  <p className="text-sm font-bold text-funded-text tabular-nums">{takes}</p>
                  <p className="text-[9px] font-semibold text-gray-500 uppercase mt-0.5">Takes</p>
                </div>
                <div className="rounded-xl bg-loss-soft/50 border border-loss-text/20 py-2">
                  <p className="text-sm font-bold text-loss-text tabular-nums">{stops}</p>
                  <p className="text-[9px] font-semibold text-gray-500 uppercase mt-0.5">Stops</p>
                </div>
                <div className="rounded-xl bg-ink-800 border border-ink-700 py-2">
                  <p className="text-sm font-bold text-gray-300 tabular-nums">{bes}</p>
                  <p className="text-[9px] font-semibold text-gray-500 uppercase mt-0.5">BE</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {sortedTrades.map((t, i) => {
                const runningTotal = sortedTrades.slice(0, i + 1).reduce((s, tr) => s + tr.amount, 0);
                return (
                  <div key={t.id} className="rounded-xl border border-ink-700 bg-ink-850 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                          t.result === 'Take' ? 'bg-funded-soft text-funded-text'
                          : t.result === 'Stop' ? 'bg-loss-soft text-loss-text'
                          : 'bg-ink-700 text-gray-300'
                        }`}>{t.result}</span>
                        <span className="text-xs text-gray-400 font-semibold">{t.asset}</span>
                        <span className="text-xs text-gray-600">· {t.timeframe}</span>
                      </div>
                      <span className={`text-sm font-bold ${t.amount >= 0 ? 'text-profit-text' : 'text-loss-text'}`}>
                        {formatSignedCurrency(t.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{t.context}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[11px] text-gray-600">{formatDateTime(t.timestamp)}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-semibold text-gray-500">
                          Acum: <span className={runningTotal >= 0 ? 'text-profit-text' : 'text-loss-text'}>{formatSignedCurrency(runningTotal)}</span>
                        </span>
                        <button
                          onClick={() => deleteTrade(t.id)}
                          className="text-[11px] text-gray-600 hover:text-loss-text transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                    {t.note && <p className="text-xs text-gray-400 mt-1.5 italic">"{t.note}"</p>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Excluir conta */}
      <button
        onClick={onDelete}
        className="w-full py-3.5 rounded-2xl border border-loss-text/30 bg-loss-soft text-loss-text font-bold hover:bg-loss-text/20 transition-all flex items-center justify-center gap-2"
      >
        <Trash2 size={18} /> Excluir Conta
      </button>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
      <span className={`text-sm text-white font-semibold ${mono ? 'font-mono tracking-wide' : ''}`}>{value}</span>
    </div>
  );
}

function AccountRulesCard({ account, trades }: { account: Account; trades: Trade[] }) {
  const rules = LUCIDFLEX_RULES[account.size];
  const isFunded = account.status === 'Financiada';
  const totalProfit = trades.reduce((sum, t) => sum + t.amount, 0);

  const dailyProfits = new Map<string, number>();
  const fundedTrades = isFunded && account.fundedAt
    ? trades.filter((t) => t.timestamp >= account.fundedAt!)
    : isFunded ? trades : [];
  fundedTrades.forEach((t) => {
    const day = new Date(t.timestamp).toDateString();
    dailyProfits.set(day, (dailyProfits.get(day) || 0) + t.amount);
  });
  const profitableDays = isFunded
    ? Array.from(dailyProfits.values()).filter((p) => p >= rules.minDailyProfit).length
    : 0;
  const daysRemaining = Math.max(0, rules.minProfitableDays - profitableDays);

  const targetValue = isFunded ? 0 : rules.evaluationTarget;
  const targetPct = isFunded ? 0 : rules.evaluationTargetPct;
  const progress = isFunded ? 100 : Math.min(100, (totalProfit / targetValue) * 100);

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-850 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full ${SIZE_COLORS[account.size].dot}`} />
        <h3 className="text-sm font-bold text-white">Regras LucidFlex {account.size}</h3>
        <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isFunded ? 'bg-funded-soft text-funded-text' : 'bg-aqua-soft text-aqua-text'}`}>
          {isFunded ? 'Financiada' : 'Avaliação'}
        </span>
      </div>

      {!isFunded && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400">Meta de Avaliação</span>
            <span className="text-xs font-bold text-white">{formatCurrency(totalProfit)} / {formatCurrency(targetValue)}</span>
          </div>
          <div className="h-2 rounded-full bg-ink-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-aqua-text to-funded-text transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-gray-600">{targetPct}% do capital</span>
            <span className="text-[10px] font-semibold text-gray-400">{progress.toFixed(1)}%</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <RuleMetric
          label="Drawdown Máx."
          value={formatCurrency(rules.maxDrawdown)}
          tone="loss"
        />
        <RuleMetric
          label="Lucro Mín./Dia"
          value={formatCurrency(rules.minDailyProfit)}
          tone="neutral"
        />
        {isFunded ? (
          <RuleMetric
            label="Dias Lucrativos"
            value={`${profitableDays} / ${rules.minProfitableDays}`}
            tone={profitableDays >= rules.minProfitableDays ? 'success' : 'neutral'}
          />
        ) : (
          <RuleMetric
            label="Dias Lucrativos"
            value="—"
            tone="neutral"
          />
        )}
        <RuleMetric
          label="Máx. por Saque"
          value={formatCurrency(rules.maxWithdraw)}
          tone="neutral"
        />
      </div>

      {isFunded && (
        <div className="mt-3 rounded-xl bg-funded-soft border border-funded-ring p-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-400">Dias para 1º Saque</span>
          <span className="text-sm font-bold text-funded-text">
            {daysRemaining > 0 ? `${daysRemaining} ${daysRemaining === 1 ? 'dia restante' : 'dias restantes'}` : 'Liberado para saque'}
          </span>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-ink-700 flex items-center justify-between">
        <span className="text-[11px] text-gray-500">Profit Split</span>
        <span className="text-xs font-bold text-funded-text">{rules.profitSplit}% para você</span>
      </div>
    </div>
  );
}

function RuleMetric({ label, value, tone }: { label: string; value: string; tone: 'success' | 'loss' | 'neutral' }) {
  const valueColor = tone === 'success' ? 'text-funded-text' : tone === 'loss' ? 'text-loss-text' : 'text-white';
  return (
    <div className="rounded-xl bg-ink-900 border border-ink-700 p-3">
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-sm font-bold ${valueColor}`}>{value}</div>
    </div>
  );
}
