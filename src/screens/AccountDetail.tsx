/**
 * AccountDetail — tela de detalhes da conta
 * Visual novo (Lovable) MESCLADO com a lógica real do app:
 * - dados vêm de useApp() (Supabase), nada é inventado/fixo
 * - cálculos de risco, meta, drawdown, consistência e concentração
 *   são os mesmos do arquivo original (FundingPips 2 Step Flex +
 *   mesas personalizadas via hydrateRules)
 * - excluir conta / reprovar / excluir trade chamam de fato o store
 * - navegação (onBack / onRegisterTrade) volta a funcionar
 *
 * Lembre de importar 'account-detail.css' (mesma pasta) uma vez.
 */
import { useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowUp, AlertTriangle, CalendarDays, Check, ChevronRight,
  Equal, Plus, ShieldX, Trash2, X, TrendingUp, Shield, Percent,
} from 'lucide-react';
import { useApp } from '@/store';
import type { Trade } from '@/types';
import { DEFAULT_FIRM_ID, SIZE_VALUES, SIZE_HEX } from '@/types';
import {
  FUNDING_PIPS_RULES, getFundingPipsPhaseTarget, getFundingPipsMaxLossLimit,
  getFundingPipsProfitConcentrationLimit, getFundingPipsProfitableDayMinimum,
} from '@/fundingPips2StepFlex';
import { hydrateRules } from '@/propConfig';
import { formatCurrency, formatSignedCurrency, formatDateTime, operationalDay } from '@/dates';
import './account-detail.css';

type Confirm = 'account' | 'reprove' | 'trade' | null;
type ResultKind = 'take' | 'stop' | 'even';

export function AccountDetail({
  accountId, onBack, onRegisterTrade,
}: { accountId: string; onBack: () => void; onRegisterTrade: (id: string) => void }) {
  const { accounts, trades, movements, propFirms, setAccountStatus, deleteAccount, deleteTrade } = useApp();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [reproving, setReproving] = useState(false);
  const [reproveError, setReproveError] = useState('');

  const account = accounts.find(a => a.id === accountId);

  if (!account) {
    return (
      <div className="account-shell">
        <main className="account-container account-content">
          <button className="icon-btn" aria-label="Voltar" onClick={onBack}>
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <p style={{ marginTop: 16, color: 'var(--muted-foreground)' }}>Conta não encontrada.</p>
        </main>
      </div>
    );
  }

  const firm = propFirms.find(f => f.id === (account.firmId ?? DEFAULT_FIRM_ID));
  const firmName = firm?.name ?? 'FundingPips';
  const isDefaultFirm = (account.firmId ?? DEFAULT_FIRM_ID) === DEFAULT_FIRM_ID;
  const program = firm?.programs.find(p => p.sizes.includes(account.size));

  const accountTrades = trades.filter(t => t.accountId === accountId);
  const currentPhase = account.status === 'Avaliacao' ? (account.phase === 2 ? 2 : 1) : 0;
  const lastPayoutAt = movements
    .filter(m => m.type === 'saque' && m.accountId === accountId)
    .reduce((max, m) => Math.max(max, m.timestamp), 0);
  const cycleStart = Math.max(lastPayoutAt, account.fundedAt ?? 0);
  const currentPhaseTrades = accountTrades.filter(
    t => (t.phase ?? 1) === currentPhase && (currentPhase !== 0 || t.timestamp > cycleStart)
  );
  const phaseRules = program?.phases.find(p => p.phase === currentPhase)?.rules;

  // ----- Margem de risco (idêntico ao original) -----
  const capital = SIZE_VALUES[account.size] || 0;
  const hydrated = !isDefaultFirm && phaseRules ? hydrateRules(phaseRules, account.size) : null;
  const target = hydrated
    ? (hydrated.target ?? 0)
    : currentPhase === 2 ? getFundingPipsPhaseTarget(capital, 2)
    : currentPhase === 1 ? getFundingPipsPhaseTarget(capital, 1)
    : 0;
  const drawdown = hydrated ? (hydrated.maxDrawdown ?? 0) : getFundingPipsMaxLossLimit(capital);
  const scaleRight = currentPhase === 0 ? drawdown : target;
  const pnl = currentPhaseTrades.reduce((s, t) => s + t.amount, 0);
  const lossUsed = Math.max(0, -pnl);
  const riskPct = drawdown > 0 ? Math.min(100, (lossUsed / drawdown) * 100) : 0;
  const progressPct = scaleRight > 0 ? Math.min(100, Math.max(0, (pnl / scaleRight) * 100)) : 0;
  const markerPct = Math.min(100, Math.max(0, 50 + (progressPct - riskPct) / 2));

  const profitableDaysRequired = hydrated
    ? (phaseRules?.profitableDaysEnabled ? (phaseRules.profitableDays ?? 0) : 0)
    : FUNDING_PIPS_RULES.minimumProfitableDays;
  const profitableDayMinimum = hydrated
    ? (phaseRules?.profitableDayPct ? (capital * phaseRules.profitableDayPct) / 100 : 0)
    : getFundingPipsProfitableDayMinimum(capital);
  const dayTotals = currentPhaseTrades.reduce<Record<string, number>>((m, t) => {
    const d = operationalDay(t.timestamp);
    m[d] = (m[d] || 0) + t.amount;
    return m;
  }, {});
  const profitableDays = Object.values(dayTotals).filter(v => v >= profitableDayMinimum).length;
  const maxDay = Math.max(0, ...Object.values(dayTotals));
  const concentrationLimit = isDefaultFirm ? getFundingPipsProfitConcentrationLimit(capital) : null;
  const concentrationPct = concentrationLimit === null || target <= 0 ? null : (maxDay / target) * 100;
  const concentrationExceeded = concentrationPct !== null && concentrationPct > concentrationLimit;
  const withinDrawdown = pnl > -drawdown;
  const remainingToTarget = currentPhase !== 0 ? Math.max(0, target - pnl) : null;
  const targetHit = remainingToTarget !== null && remainingToTarget <= 0;
  const remainingToDrawdown = Math.max(0, drawdown + pnl);

  // ----- Performance -----
  const takes = currentPhaseTrades.filter(t => t.result === 'Take').length;
  const stops = currentPhaseTrades.filter(t => t.result === 'Stop').length;
  const bes = currentPhaseTrades.filter(t => t.result === 'BE').length;
  const sortedTrades = [...accountTrades].sort((a, b) => b.timestamp - a.timestamp);

  const funded = account.status === 'Financiada';
  const statusLabel = funded ? 'MASTER' : account.phase === 2 ? 'FASE 2' : 'FASE 1';
  const sizeColor = SIZE_HEX[account.size];
  const resultKind = (t: Trade): ResultKind => (t.result === 'Take' ? 'take' : t.result === 'Stop' ? 'stop' : 'even');
  const tradePhaseLabel = (t: Trade) => ((t.phase ?? 1) === 0 ? 'MASTER' : (t.phase ?? 1) === 2 ? 'F2' : 'F1');

  // ----- Ações (chamam o store de verdade) -----
  const handleReprove = async () => {
    setReproving(true);
    setReproveError('');
    const res = await setAccountStatus(accountId, 'Reprovada');
    setReproving(false);
    if (!res.ok) {
      setReproveError(`Não foi possível reprovar a conta. ${res.error || 'Tente novamente.'}`);
      return;
    }
    setConfirm(null);
    onBack();
  };
  const handleDeleteAccount = () => { deleteAccount(accountId); onBack(); };
  const handleDeleteTrade = () => {
    if (selectedTrade) deleteTrade(selectedTrade.id);
    setConfirm(null);
    setSelectedTrade(null);
  };

  return (
    <div className="account-shell">
      <header className="account-topbar">
        <div className="account-container topbar-inner">
          <button className="icon-btn" aria-label="Voltar" onClick={onBack}>
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <main className="account-container account-content">
        {/* Card 1 — identidade da conta */}
        <section className="account-panel account-identity" aria-label={`Conta ${account.name}`}>
          <div className="identity-mark">
            <Shield size={36} strokeWidth={1.2} />
            <TrendingUp size={17} strokeWidth={1.7} className="identity-mark-icon" />
          </div>
          <div className="identity-text">
            <div className="identity-title-row">
              <h1 className="identity-name">{account.name}</h1>
              <span className="phase-pill" style={{ color: sizeColor.solid, borderColor: sizeColor.ring, background: sizeColor.soft }}>{statusLabel}</span>
            </div>
            <p className="identity-sub">{firmName} · {account.size}</p>
            <p className="account-code numeric">Código: <span style={{ color: sizeColor.solid }}>{account.code}</span></p>
          </div>
        </section>

        {/* Card 2 — margem de risco */}
        <section className="account-panel risk-panel" aria-labelledby="risk-title">
          <h2 id="risk-title" className="section-heading">Margem de risco</h2>
          <div className="risk-axis">
            <div className="risk-bubble" style={{ left: `${markerPct}%` }} aria-label={`Resultado: ${formatSignedCurrency(pnl)}`}>
              <span className="risk-bubble-label">Resultado Atual</span>
              <span className={`risk-bubble-value numeric ${pnl >= 0 ? 'amount-take' : 'amount-stop'}`}>
                {formatSignedCurrency(pnl)}<span className="risk-bubble-pointer" />
              </span>
            </div>
            <div className="risk-track">
              <span className="risk-glow glow-red" aria-hidden="true" />
              <span className="risk-glow glow-blue" aria-hidden="true" />
              <div className="risk-line"><span className="risk-sheen" /></div>
              <span className="risk-cursor" style={{ left: `${markerPct}%` }} />
            </div>
            <span className="risk-reflection" aria-hidden="true" />
            <div className="numeric risk-labels">
              <span>-{formatCurrency(drawdown)}</span><span>0</span><span>+{formatCurrency(scaleRight)}</span>
            </div>
          </div>

          <div className="risk-remaining">
            <div className="risk-remaining-item">
              <span className="risk-remaining-label">Margem até o limite</span>
              <span className="risk-remaining-value numeric to-drawdown">{formatCurrency(remainingToDrawdown)}</span>
            </div>
            {remainingToTarget !== null && (
              <div className="risk-remaining-item">
                <span className="risk-remaining-label">Falta p/ meta</span>
                <span className={`risk-remaining-value numeric ${targetHit ? 'hit' : 'to-target'}`}>
                  {targetHit ? 'Meta atingida!' : formatCurrency(remainingToTarget)}
                </span>
              </div>
            )}
          </div>

          {profitableDaysRequired > 0 && (
            <div className="risk-details">
              <div className="risk-detail">
                <span className="detail-icon icon-blue"><CalendarDays size={17} strokeWidth={1.5} /></span>
                <p className="detail-text">
                  Consistência: <strong className="detail-strong">{profitableDays} / {profitableDaysRequired} Dias Concluídos</strong>
                </p>
                <div className="progress-dots" aria-label={`${profitableDays} de ${profitableDaysRequired} dias concluídos`}>
                  {Array.from({ length: profitableDaysRequired }).map((_, i) => (
                    <i key={i} style={i >= profitableDays ? { background: 'transparent' } : undefined} />
                  ))}
                </div>
              </div>

              {concentrationLimit !== null && currentPhase !== 0 && (
                <div className="risk-detail">
                  <span className="detail-icon icon-gold"><Percent size={18} strokeWidth={1.8} /></span>
                  <div className="detail-text">
                    <p>Concentração do Melhor Dia: <strong className="detail-strong">{concentrationPct === null ? '—' : `${concentrationPct.toFixed(0)}% da meta`}</strong></p>
                    <p className="detail-hint">
                      {concentrationExceeded ? `Acima da referência de ${concentrationLimit}%.` : `Dentro da regra dos ${concentrationLimit}%. Continue operando.`}
                    </p>
                  </div>
                  <span className={`detail-icon detail-check ${concentrationExceeded ? 'icon-red' : 'icon-green'}`}>
                    {concentrationExceeded ? '!' : <Check size={17} />}
                  </span>
                </div>
              )}
            </div>
          )}

          {!withinDrawdown && (
            <p style={{
              marginTop: 16, padding: '12px 14px', borderRadius: 12,
              border: '1px solid color-mix(in oklch, var(--negative) 30%, transparent)',
              background: 'color-mix(in oklch, var(--negative) 6%, transparent)',
              color: 'var(--negative)', fontSize: 12,
            }}>
              A perda acumulada ultrapassou o drawdown estático configurado para esta conta.
            </p>
          )}
        </section>

        {/* Card 3 — resultado e performance */}
        <section className="account-panel performance-panel" aria-labelledby="performance-title">
          <h2 id="performance-title" className="section-heading performance-heading">Resultado e performance</h2>
          <div className="metric-grid">
            <Metric label="Resultado" value={formatSignedCurrency(pnl)} kind={pnl >= 0 ? 'gold' : 'red'} icon={<span className="metric-dollar">$</span>} />
            <Metric label="Takes" value={String(takes)} kind="green" icon={<ArrowUp size={19} strokeWidth={1.5} />} />
            <Metric label="Stops" value={String(stops)} kind="red" icon={<ArrowDown size={19} strokeWidth={1.5} />} />
            <Metric label="Break Evens" value={String(bes)} kind="neutral" icon={<Equal size={19} strokeWidth={1.5} />} />
          </div>
        </section>

        {/* Card 4 — histórico de trades */}
        <section className="account-panel history-panel" aria-labelledby="history-title">
          <div className="history-header">
            <h2 id="history-title" className="section-heading">Histórico de trades</h2>
            <span className="history-count">{accountTrades.length} registros</span>
          </div>
          {sortedTrades.length === 0 ? (
            <p style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted-foreground)' }}>Nenhum trade registrado.</p>
          ) : (
            <div className="trade-list">
              {sortedTrades.map((t) => {
                const kind = resultKind(t);
                return (
                  <button key={t.id} className="trade-row" onClick={() => setSelectedTrade(t)} aria-label={`Ver trade ${t.asset}`}>
                    <span className={`trade-icon icon-${kind}`}>
                      {kind === 'take' ? <ArrowUp size={16} /> : kind === 'stop' ? <ArrowDown size={16} /> : <Equal size={16} />}
                    </span>
                    <span className="trade-main">
                      <span className="trade-asset-row">
                        <span className="trade-asset">{t.asset}</span>
                        <span className="trade-phase-badge" style={{ color: sizeColor.solid, borderColor: sizeColor.ring, background: sizeColor.soft }}>{tradePhaseLabel(t)}</span>
                      </span>
                      <span className={`trade-side side-${kind}`}>{t.result}</span>
                      <span className="trade-tags">{t.context} · {t.timeframe}{t.note ? ` · ${t.note}` : ''}</span>
                    </span>
                    <span className="trade-date numeric">
                      <CalendarDays size={13} strokeWidth={1.4} />{formatDateTime(t.timestamp)}
                    </span>
                    <span className={`trade-amount numeric amount-${kind}`}>{formatSignedCurrency(t.amount)}</span>
                    <ChevronRight size={15} className="trade-chevron" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Card 5 — status da conta */}
        <section className="account-panel status-panel" aria-labelledby="status-title">
          <h2 id="status-title" className="section-heading">Status da conta</h2>
          {account.status === 'Reprovada' ? (
            <div className="status-content">
              <span className="status-dot" style={{ background: 'var(--negative)', boxShadow: 'none' }} />
              <div className="status-info">
                <p className="status-title" style={{ color: 'var(--negative)' }}>Conta Reprovada</p>
                <p className="detail-hint status-sub">Esta conta foi marcada como reprovada.</p>
              </div>
            </div>
          ) : (
            <div className="status-content">
              <span className="status-dot" />
              <div className="status-info">
                <p className="status-title">Conta em Operação</p>
                <p className="detail-hint status-sub">Sua conta está ativa e dentro das regras.</p>
              </div>
              <button className="reprove-button" onClick={() => setConfirm('reprove')}>
                <ShieldX size={15} />Marcar como Reprovada
              </button>
            </div>
          )}
        </section>

        {/* Ações */}
        <div className="register-area">
          <button className="register-button" onClick={() => onRegisterTrade(accountId)}>
            <span className="register-icon-badge"><Plus size={13} strokeWidth={2.8} /></span>
            REGISTRAR TRADE
          </button>
        </div>
        <div className="delete-account-area">
          <button className="delete-account-button" aria-label="Excluir conta" onClick={() => setConfirm('account')}>
            <Trash2 size={16} strokeWidth={1.5} />Excluir conta
          </button>
        </div>
      </main>

      {/* Diálogos */}
      {(selectedTrade || confirm) && (
        <div
          className="account-dialog-backdrop"
          onMouseDown={(e) => { if (e.target === e.currentTarget) { setSelectedTrade(null); setConfirm(null); } }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="dialog-box">
            {selectedTrade && !confirm ? (
              <>
                <div className="dialog-head">
                  <div>
                    <h2 id="dialog-title" className="dialog-title">{selectedTrade.asset}</h2>
                    <p className="dialog-sub">{formatDateTime(selectedTrade.timestamp)}</p>
                  </div>
                  <button className="icon-btn" aria-label="Fechar" onClick={() => setSelectedTrade(null)}><X size={17} /></button>
                </div>
                <div className="dialog-body-row">
                  <span className="dialog-meta">{selectedTrade.result} · {selectedTrade.context} · {selectedTrade.timeframe}</span>
                  <strong className={`dialog-amount numeric amount-${resultKind(selectedTrade)}`}>{formatSignedCurrency(selectedTrade.amount)}</strong>
                </div>
                <button className="reprove-button dialog-delete" onClick={() => setConfirm('trade')}>
                  <Trash2 size={15} />Excluir trade
                </button>
              </>
            ) : (
              <>
                <div className="dialog-warn"><AlertTriangle size={24} /></div>
                <h2 id="dialog-title" className="dialog-title">
                  {confirm === 'account' ? 'Excluir conta?' : confirm === 'reprove' ? 'Marcar esta conta como Reprovada?' : 'Excluir este trade?'}
                </h2>
                <p className="dialog-text">
                  {confirm === 'account'
                    ? 'A conta e seus trades serão removidos.'
                    : confirm === 'reprove'
                      ? 'Ela vai sair da Dashboard e não será mais sugerida para operar. O histórico de trades continua contando nas outras abas.'
                      : 'Os indicadores da conta serão recalculados.'}
                </p>
                {confirm === 'reprove' && reproveError && (
                  <p style={{ color: 'var(--negative)', fontSize: 12, marginTop: 8 }}>{reproveError}</p>
                )}
                <div className="dialog-actions">
                  <button className="dialog-btn" onClick={() => { setConfirm(null); setReproveError(''); }}>Cancelar</button>
                  <button
                    className="dialog-btn-danger"
                    disabled={confirm === 'reprove' && reproving}
                    onClick={() => {
                      if (confirm === 'account') handleDeleteAccount();
                      else if (confirm === 'reprove') handleReprove();
                      else if (confirm === 'trade') handleDeleteTrade();
                    }}
                  >
                    {confirm === 'reprove' ? (reproving ? 'Salvando...' : 'Sim, reprovar') : 'Sim, excluir'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, kind, icon }: { label: string; value: string; kind: 'gold' | 'green' | 'red' | 'neutral'; icon: React.ReactNode }) {
  return (
    <div className="metric">
      <span className={`metric-icon icon-${kind}`}>{icon}</span>
      <div className="metric-body">
        <p className="metric-label">{label}</p>
        <p className={`metric-value numeric ${kind === 'green' || kind === 'gold' ? 'amount-take' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
