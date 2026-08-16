import type { AppData } from './types';
import { uid } from './storage';

const DAY = 24 * 60 * 60 * 1000;

export function seedData(): AppData {
  const now = Date.now();
  const accounts = [
    { name: 'PnL 25K #01', code: '749302', size: '25K' as const, status: 'Avaliacao' as const },
    { name: 'PnL 25K #02', code: '749303', size: '25K' as const, status: 'Avaliacao' as const },
    { name: 'PnL 25K #03', code: '749304', size: '25K' as const, status: 'Avaliacao' as const },
  ].map((a, i) => ({ id: uid(), ...a, createdAt: now - (3 - i) * DAY, queueOrder: i }));

  const trades = [
    { id: uid(), accountId: accounts[0].id, asset: 'MNQ' as const, context: 'Captura de Liquidez' as const, timeframe: 'M5' as const, result: 'Take' as const, amount: 45, note: 'Limpo, respeitei o plano.', timestamp: now - 2 * DAY + 13 * 60 * 60 * 1000 },
    { id: uid(), accountId: accounts[1].id, asset: 'NQ' as const, context: 'Rompimento' as const, timeframe: 'M15' as const, result: 'Stop' as const, amount: -60, note: 'Entrei cedo, paciência da próxima.', timestamp: now - DAY + 15 * 60 * 60 * 1000 },
    { id: uid(), accountId: accounts[0].id, asset: 'MGC' as const, context: 'Estrutura Wyckoff' as const, timeframe: 'M15' as const, result: 'Take' as const, amount: 80, note: 'Boa leitura de fluxo.', timestamp: now - DAY + 19 * 60 * 60 * 1000 },
  ];

  const movements = [
    { id: uid(), type: 'investimento' as const, amount: 0, description: 'Cadastro PnL Global', timestamp: now - 3 * DAY },
  ];

  return { accounts, trades, movements, seeded: true };
}
