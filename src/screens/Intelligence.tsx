import { useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Crosshair,
  Eye,
  Flame,
  Layers,
  LineChart,
  Moon,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Trophy,
  TrendingDown,
} from 'lucide-react';
import { useApp } from '@/store';
import type { Trade } from '@/types';
import { TIMEFRAMES, tradeR } from '@/types';
import { formatSignedCurrency } from '@/dates';
import './intelligence.css';

type Shift = 'Manhã' | 'Tarde' | 'Noite/Madrugada';
type Period = 'Todos' | '7 dias' | '30 dias';
type GroupStat = { key: string; total: number; count: number; wins: number; losses: number; winRate: number; sumR: number; avgR: number };

const MIN_SAMPLE = 5;
const SHIFT_ORDER: Shift[] = ['Manhã', 'Tarde', 'Noite/Madrugada'];
const SHIFT_ICON: Record<Shift, typeof Sun> = { Manhã: Sunrise, Tarde: Sun, 'Noite/Madrugada': Moon };
const SHIFT_TONE: Record<Shift, IconTone> = { Manhã: 'primary', Tarde: 'positive', 'Noite/Madrugada': 'info' };

function money(value: number) {
  return formatSignedCurrency(value);
}

export function Intelligence() {
  const { trades } = useApp();
  const [period, setPeriod] = useState<Period>('Todos');
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [showAllContexts, setShowAllContexts] = useState(false);

  const filteredTrades = useMemo(() => {
    const now = Date.now();
    const cutoff = period === '7 dias' ? now - 7 * 86400000 : period === '30 dias' ? now - 30 * 86400000 : 0;
    return trades.filter((trade) => trade.timestamp >= cutoff);
  }, [trades, period]);

  const stats = useMemo(() => computeStats(filteredTrades), [filteredTrades]);

  return (
    <main className="intel-screen">
      <div className="intel-wrap">
        <header className="intel-hero">
          <div className="intel-hero-top">
            <IconBadge hero><Sparkles size={28} strokeWidth={2} /></IconBadge>
            <div>
              <h1 className="gold-title intel-h1">INTELIGÊNCIA</h1>
              <p className="intel-sub">Entenda onde seu operacional ganha dinheiro.</p>
            </div>
          </div>
          <div className="period-row">
            {(['Todos', '7 dias', '30 dias'] as Period[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeriod(option)}
                className={`period-button${period === option ? ' period-active' : ''}`}
              >
                <CalendarDays className="period-icon" />
                <span>{option}</span>
              </button>
            ))}
          </div>
        </header>

        {filteredTrades.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="intel-stack">
            <Overview stats={stats} count={filteredTrades.length} />

            <div className="cards-row">
              <Section title="ATIVOS" subtitle="Onde seu operacional entrega mais resultado" icon={<Crosshair />} tone="positive" columns="ATIVO · TRADES · WIN RATE · PNL">
                {(showAllAssets ? stats.assets : stats.assets.slice(0, 4)).map((item, index) => (
                  <RankRow key={item.key} item={item} rank={index + 1} max={stats.assetMax} />
                ))}
                {stats.assets.length > 4 && <MoreButton expanded={showAllAssets} onClick={() => setShowAllAssets((value) => !value)} label="ativos" />}
              </Section>
              <Section title="HORÁRIOS" subtitle="Quando sua execução é mais consistente" icon={<Clock3 />} tone="info" columns="TURNO · TRADES · WIN RATE · PNL">
                {stats.shifts.map((item) => <ShiftRow key={item.shift} item={item} max={stats.shiftMax} />)}
              </Section>
              <Section title="CONTEXTOS" subtitle="Quais condições favorecem sua execução" icon={<Sparkles />} tone="violet" columns="CONTEXTO · TRADES · WIN RATE · PNL">
                {(showAllContexts ? stats.contexts : stats.contexts.slice(0, 4)).map((item, index) => (
                  <RankRow key={item.key} item={item} rank={index + 1} max={stats.contextMax} />
                ))}
                {stats.contexts.length > 4 && <MoreButton expanded={showAllContexts} onClick={() => setShowAllContexts((value) => !value)} label="contextos" />}
              </Section>
            </div>

            <Section title="TIMEFRAMES" subtitle="Em qual período de gráfico você executa melhor" icon={<BarChart3 />} tone="positive">
              <div className="tf-grid">
                {stats.timeframes.map((item) => <Timeframe key={item.timeframe} item={item} max={stats.timeframeMax} />)}
              </div>
            </Section>

            <Section title="LEITURA DO OPERACIONAL" subtitle={`Os extremos do período analisado (mínimo de ${MIN_SAMPLE} trades para entrar aqui).`} icon={<LineChart />} tone="info">
              <div className="highlight-grid">
                <Highlight type="best" title="Melhor Contexto" item={stats.bestContext} />
                <Highlight type="worst" title="Menor Desempenho" item={stats.worstContext} />
              </div>
            </Section>

            <Section title="COMBINAÇÕES" subtitle={`Cruzando Ativo + Contexto + Timeframe (mínimo de ${MIN_SAMPLE} trades)`} icon={<Layers />} tone="violet">
              {stats.combos.length
                ? stats.combos.map((item, index) => <RankRow key={item.key} item={item} rank={index + 1} max={stats.comboMax} />)
                : <p className="combos-empty">Ainda não há combinações com trades suficientes para aparecer aqui.</p>}
            </Section>

            <section className="intel-panel conclusion-card">
              <IconBadge hero><Star fill="currentColor" /></IconBadge>
              <div className="conclusion-body">
                <h2 className="section-title">CONCLUSÃO</h2>
                <p className="conclusion-text">{buildConclusion(stats)}</p>
              </div>
              <Brain className="conclusion-brain" size={52} strokeWidth={1.2} />
            </section>

            <div className="foot-note">
              <Sparkles className="foot-icon" size={14} />
              <span>Dados calculados sobre todos os {filteredTrades.length} trades registrados no período selecionado. A Inteligência analisa o seu operacional, não as contas individualmente.</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="intel-panel intel-empty">
      <IconBadge hero><Brain size={28} strokeWidth={2} /></IconBadge>
      <h3 className="empty-title">Inteligência aguardando dados</h3>
      <p className="empty-text">Registre seus trades para liberar a análise de ativos, horários, contextos, timeframes e combinações de performance.</p>
    </div>
  );
}

// ---------- Ícones circulares com borda na própria cor + brilho neon ----------
type IconTone = 'primary' | 'positive' | 'info' | 'violet';

function IconBadge({ children, small = false, hero = false, tone = 'primary' }: { children: ReactNode; small?: boolean; hero?: boolean; tone?: IconTone }) {
  return (
    <div className={`icon-badge icon-badge-${tone}${hero ? ' icon-badge-hero' : ''}${small ? ' icon-badge-sm' : ''}`}>
      {children}
    </div>
  );
}

function Section({ title, subtitle, icon, children, columns, tone = 'primary' }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode; columns?: string; tone?: IconTone }) {
  return (
    <section className="intel-panel intel-section">
      <div className="section-head">
        <IconBadge small tone={tone}>{icon}</IconBadge>
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="section-sub">{subtitle}</p>
        </div>
      </div>
      {columns && <p className="columns-label">{columns}</p>}
      <div className="section-body">{children}</div>
    </section>
  );
}

function Overview({ stats, count }: { stats: ReturnType<typeof computeStats>; count: number }) {
  const primary = [
    ['Resultado líquido', money(stats.globalTotal), stats.globalTotal],
    ['Win Rate', `${stats.globalWinRate}%`, 0],
    ['Trades', String(count), 0],
    ['Profit Factor', stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2), stats.profitFactor - 1],
  ] as const;
  const secondary: Array<[string, string]> = [
    ['Resultado em R', signedR(stats.totalR)],
    ['Média de R', signedR(stats.avgR)],
    ['Sequência atual', stats.streak.count ? `${stats.streak.count} ${stats.streak.type === 'W' ? 'wins' : 'losses'}` : '—'],
    ['Melhores sequências', `${stats.bestWinStreak}W / ${stats.bestLossStreak}L`],
  ];
  return (
    <section className="intel-panel overview-panel">
      <div className="overview-head">
        <Eye className="overview-eye" size={18} />
        <h2 className="section-title">VISÃO GERAL</h2>
      </div>
      <div className="metric-grid">
        {primary.map(([label, value, tone], index) => (
          <Metric
            key={label}
            label={label}
            value={value}
            tone={tone}
            donut={index === 1 ? stats.globalWinRate : undefined}
            chart={index === 2 || index === 3}
            sub={index === 0 ? (stats.globalTotal >= 0 ? 'Positivo' : 'Atenção') : index === 1 ? `${stats.takes} takes · ${stats.stops} stops · ${stats.breakEvens} BE` : index === 2 ? 'Operações no período' : 'Lucro bruto / Perda bruta'}
          />
        ))}
      </div>
      <div className="secondary-metrics">
        {secondary.map(([label, value], index) => (
          <Metric key={label} compact label={label} value={value} icon={index === 2 ? (stats.streak.type === 'W' ? <Flame className="flame-icon" /> : stats.streak.type === 'L' ? <Snowflake className="flame-icon" /> : undefined) : undefined} />
        ))}
      </div>
      <p className="overview-note">
        <CircleDollarSign className="overview-note-icon" size={14} />
        Seu operacional está <strong className={stats.globalTotal >= 0 ? 'text-positive' : 'text-negative'}>{stats.globalTotal >= 0 ? 'positivo' : 'negativo'}</strong> no período analisado.
      </p>
    </section>
  );
}

function Metric({ label, value, tone = 0, sub, compact, icon, donut, chart }: { label: string; value: string; tone?: number; sub?: string; compact?: boolean; icon?: ReactNode; donut?: number; chart?: boolean }) {
  return (
    <div className={`metric-cell${compact ? ' metric-compact' : ''}`}>
      <p className="metric-label">{label}</p>
      <div className="metric-value-row">
        <p className={`metric-value${compact ? ' metric-value-sm' : ''}${tone > 0 ? ' text-positive' : tone < 0 ? ' text-negative' : ''}`}>{icon}{value}</p>
        {donut !== undefined && <span className="int-donut" style={{ background: `conic-gradient(var(--gold) 0 ${donut}%, var(--text-sec) ${donut}% 100%)` }} />}
        {chart && <LineChart className="metric-chart" size={24} />}
      </div>
      {sub && <p className={label === 'Resultado líquido' ? 'metric-pill' : 'metric-sub'}>{sub}</p>}
    </div>
  );
}

function MoreButton({ expanded, onClick, label }: { expanded: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="more-button">
      {expanded ? 'Mostrar menos' : `Ver todos os ${label}`}
      <span aria-hidden="true">›</span>
    </button>
  );
}

// ---------- Barra com traço central + "0" embaixo (positivo à direita, negativo à esquerda) ----------
function Bar({ value, max }: { value: number; max: number }) {
  const width = value === 0 ? 0 : Math.max(5, Math.min(100, Math.abs(value) / Math.max(1, max) * 100));
  return (
    <div className="bar-wrap">
      <div className="bar-track">
        <span className="bar-tick" />
        {value < 0 && <span className="bar-fill bar-fill-negative" style={{ width: `${width / 2}%` }} />}
        {value > 0 && <span className="bar-fill bar-fill-positive" style={{ width: `${width / 2}%` }} />}
      </div>
      <span className="bar-zero">0</span>
    </div>
  );
}

function RTag({ value }: { value: number }) {
  return <span className={`r-tag ${value >= 0 ? 'positive-tag' : 'negative-tag'}`}>{signedR(value)}</span>;
}

function RankRow({ item, rank, max }: { item: GroupStat; rank: number; max: number }) {
  return (
    <div className="rank-row">
      <div className={`rank-badge${rank === 1 ? ' rank-first' : ''}`}>{String(rank).padStart(2, '0')}</div>
      <div className="rank-body">
        <div className="rank-top">
          <span className="rank-name">{item.key}</span>
          <span className="rank-right">
            <span className={`int-value ${item.total >= 0 ? 'text-positive' : 'text-negative'}`}>{money(item.total)}</span>
            <RTag value={item.sumR} />
          </span>
        </div>
        <Bar value={item.total} max={max} />
        <p className="rank-meta">{item.count} trades · {item.winRate}% de acerto</p>
      </div>
    </div>
  );
}

function ShiftRow({ item, max }: { item: ReturnType<typeof computeStats>['shifts'][number]; max: number }) {
  const Icon = SHIFT_ICON[item.shift];
  return (
    <div className="rank-row">
      <IconBadge small tone={SHIFT_TONE[item.shift]}><Icon size={14} /></IconBadge>
      <div className="rank-body">
        <div className="rank-top">
          <span className="rank-name">{item.shift === 'Noite/Madrugada' ? 'Noite / Madrugada' : item.shift}</span>
          <span className="rank-right">
            <span className={`int-value ${item.total >= 0 ? 'text-positive' : 'text-negative'}`}>{money(item.total)}</span>
            <RTag value={item.sumR} />
          </span>
        </div>
        <Bar value={item.total} max={max} />
        <p className="rank-meta">{item.count} trades · {item.winRate}% de acerto</p>
      </div>
    </div>
  );
}

function Timeframe({ item, max }: { item: ReturnType<typeof computeStats>['timeframes'][number]; max: number }) {
  return (
    <div className="rank-row tf-cell">
      <p className="tf-name">{item.timeframe}</p>
      <p className={`int-value tf-value ${item.total >= 0 ? 'text-positive' : 'text-negative'}`}>{item.count ? money(item.total) : '—'}</p>
      {item.count > 0 && <Bar value={item.total} max={max} />}
      <p className="rank-meta">{item.count} trades{item.count ? ` · ${item.winRate}%` : ''}</p>
      {item.count > 0 && <p className={`tf-r ${item.sumR >= 0 ? 'text-positive' : 'text-negative'}`}>{signedR(item.sumR)}</p>}
    </div>
  );
}

function Highlight({ type, title, item }: { type: 'best' | 'worst'; title: string; item: GroupStat | null }) {
  const bad = type === 'worst' && (item?.total ?? 0) < 0;
  return (
    <div className={`int-highlight${type === 'best' ? ' highlight-best' : bad ? ' highlight-worst' : ''}`}>
      <div className="highlight-head">
        <div className={`highlight-icon ${type === 'best' ? 'hl-positive' : bad ? 'hl-negative' : 'hl-neutral'}`}>
          {type === 'best' ? <Trophy size={17} /> : bad ? <AlertTriangle size={17} /> : <TrendingDown size={17} />}
        </div>
        <div className="min-w-0">
          <p className="metric-label">{title}</p>
          <p className="highlight-name">{item?.key ?? 'Sem dados suficientes'}</p>
        </div>
      </div>
      {item && (
        <>
          <div className="highlight-stats">
            <p className={`int-value highlight-total ${item.total >= 0 ? 'text-positive' : 'text-negative'}`}>{money(item.total)}</p>
            <p className="rank-meta">{item.count} trades · {item.winRate}% acerto · {signedR(item.sumR)}</p>
          </div>
          {bad && <p className="highlight-warn">Este contexto está gerando prejuízo real.</p>}
          {type === 'worst' && !bad && <p className="highlight-note">Resultado positivo, mas abaixo do melhor contexto.</p>}
        </>
      )}
    </div>
  );
}

// ---------- Regras de negócio (idênticas ao original, nada foi alterado) ----------
function signedR(value: number) { return `${value >= 0 ? '+' : ''}${value.toFixed(1)}R`; }
function shiftOf(timestamp: number): Shift { const hour = new Date(timestamp).getHours(); return hour >= 6 && hour < 12 ? 'Manhã' : hour >= 12 && hour < 18 ? 'Tarde' : 'Noite/Madrugada'; }
function buildGroup(map: Map<string, Omit<GroupStat, 'key' | 'winRate' | 'avgR'>>): GroupStat[] { return Array.from(map.entries()).map(([key, item]) => { const decisive = item.wins + item.losses; return { key, ...item, winRate: decisive ? Math.round(item.wins / decisive * 100) : 0, avgR: decisive ? item.sumR / decisive : 0 }; }).sort((a, b) => b.total - a.total); }
function pickHighlight(list: GroupStat[], mode: 'best' | 'worst'): GroupStat | null { const eligible = list.filter((x) => x.count >= MIN_SAMPLE); if (!eligible.length) return null; return mode === 'best' ? eligible[0] : eligible[eligible.length - 1]; }
function computeStreaks(trades: Trade[]) { const decisive = [...trades].filter((trade) => trade.result !== 'BE').sort((a, b) => a.timestamp - b.timestamp); let bestWin = 0, bestLoss = 0, runWin = 0, runLoss = 0; for (const trade of decisive) { if (trade.result === 'Take') { runWin++; runLoss = 0; bestWin = Math.max(bestWin, runWin); } else { runLoss++; runWin = 0; bestLoss = Math.max(bestLoss, runLoss); } } let count = 0; let type: 'W' | 'L' | null = null; for (let index = decisive.length - 1; index >= 0; index--) { const win = decisive[index]?.result === 'Take'; if (type === null) { type = win ? 'W' : 'L'; count = 1; } else if ((win && type === 'W') || (!win && type === 'L')) count++; else break; } return { bestWinStreak: bestWin, bestLossStreak: bestLoss, streak: { type, count } }; }

function computeStats(trades: Trade[]) {
  const takes = trades.filter((trade) => trade.result === 'Take').length, stops = trades.filter((trade) => trade.result === 'Stop').length, breakEvens = trades.filter((trade) => trade.result === 'BE').length;
  const globalTotal = trades.reduce((sum, trade) => sum + trade.amount, 0), grossProfit = trades.filter((trade) => trade.amount > 0).reduce((sum, trade) => sum + trade.amount, 0), grossLoss = Math.abs(trades.filter((trade) => trade.amount < 0).reduce((sum, trade) => sum + trade.amount, 0)), totalR = trades.reduce((sum, trade) => sum + tradeR(trade), 0);
  const decisive = takes + stops, profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss;
  const maps = { asset: new Map<string, Omit<GroupStat, 'key' | 'winRate' | 'avgR'>>(), context: new Map<string, Omit<GroupStat, 'key' | 'winRate' | 'avgR'>>(), shift: new Map<string, Omit<GroupStat, 'key' | 'winRate' | 'avgR'>>(), timeframe: new Map<string, Omit<GroupStat, 'key' | 'winRate' | 'avgR'>>(), combo: new Map<string, Omit<GroupStat, 'key' | 'winRate' | 'avgR'>>() };
  const bump = (map: typeof maps.asset, key: string, trade: Trade) => { const item = map.get(key) ?? { total: 0, count: 0, wins: 0, losses: 0, sumR: 0 }; item.total += trade.amount; item.count++; item.sumR += tradeR(trade); item.wins += trade.result === 'Take' ? 1 : 0; item.losses += trade.result === 'Stop' ? 1 : 0; map.set(key, item); };
  trades.forEach((trade) => { bump(maps.asset, trade.asset, trade); bump(maps.context, trade.context, trade); bump(maps.shift, shiftOf(trade.timestamp), trade); bump(maps.timeframe, trade.timeframe, trade); bump(maps.combo, `${trade.asset} · ${trade.context} · ${trade.timeframe}`, trade); });
  const assets = buildGroup(maps.asset), contexts = buildGroup(maps.context), groupsByShift = buildGroup(maps.shift), byTimeframe = buildGroup(maps.timeframe), combos = buildGroup(maps.combo).filter((item) => item.count >= MIN_SAMPLE).slice(0, 8);
  const empty = (key: string): GroupStat => ({ key, total: 0, count: 0, wins: 0, losses: 0, winRate: 0, sumR: 0, avgR: 0 });
  const shifts = SHIFT_ORDER.map((shift) => ({ ...(groupsByShift.find((item) => item.key === shift) ?? empty(shift)), shift }));
  const timeframes = TIMEFRAMES.map((timeframe) => ({ ...(byTimeframe.find((item) => item.key === timeframe) ?? empty(timeframe)), timeframe }));
  const bestContext = pickHighlight(contexts, 'best');
  const worstContext = pickHighlight(contexts, 'worst');
  const streaks = computeStreaks(trades);
  return { takes, stops, breakEvens, globalTotal, profitFactor, globalWinRate: decisive ? Math.round(takes / decisive * 100) : 0, totalR, avgR: decisive ? totalR / decisive : 0, assets, contexts, shifts, timeframes, combos, bestContext, worstContext, ...streaks, assetMax: maxOf(assets), contextMax: maxOf(contexts), shiftMax: maxOf(shifts), timeframeMax: maxOf(timeframes), comboMax: maxOf(combos) };
}
function maxOf(items: Array<{ total: number }>) { return Math.max(1, ...items.map((item) => Math.abs(item.total))); }
function buildConclusion(stats: ReturnType<typeof computeStats>) { if (!stats.bestContext) return `Ainda faltam trades suficientes (mínimo de ${MIN_SAMPLE}) para apontar uma vantagem clara no seu operacional.`; const bestShift = [...stats.shifts].filter((item) => item.count).sort((a, b) => b.total - a.total)[0]; const bestAsset = stats.assets.filter((item) => item.count >= MIN_SAMPLE)[0]; let text = `Sua maior vantagem atualmente está em ${stats.bestContext.key}`; if (bestShift) text += `, principalmente no período da ${bestShift.shift}`; if (bestAsset) text += `, operando ${bestAsset.key}`; text += '.'; if (stats.worstContext && stats.worstContext.total < 0) text += ` Fique de olho em ${stats.worstContext.key}, que está gerando prejuízo real no período.`; return text; }
