import type { AppData } from './types';
import { uid } from './storage';

const DAY = 24 * 60 * 60 * 1000;

export function seedData(): AppData {
  const now = Date.now();
  const accounts = [
    { name: 'Lucid 25K #01', code: 'L-1029', size: '25K' as const, status: 'Avaliacao' as const, propFirm: 'Lucid' },
    { name: 'Lucid 25K #02', code: 'L-1030', size: '25K' as const, status: 'Avaliacao' as const, propFirm: 'Lucid' },
    { name: 'Lucid 25K #03', code: 'L-1031', size: '25K' as const, status: 'Avaliacao' as const, propFirm: 'Lucid' },
    { name: 'Lucid 25K #04', code: 'L-1032', size: '25K' as const, status: 'Avaliacao' as const, propFirm: 'Lucid' },
  ].map((a, i) => ({
    id: uid(),
    ...a,
    createdAt: now - (4 - i) * DAY,
    queueOrder: i,
  }));

  const trades = [
    {
      id: uid(),
      accountId: accounts[0].id,
      asset: 'MNQ' as const,
      context: 'Captura de Liquidez' as const,
      timeframe: 'M5' as const,
      result: 'Take' as const,
      amount: 45,
      note: 'Limpo, respeitei o plano.',
      timestamp: now - 2 * DAY + 13 * 60 * 60 * 1000,
    },
    {
      id: uid(),
      accountId: accounts[1].id,
      asset: 'NQ' as const,
      context: 'Rompimento' as const,
      timeframe: 'M15' as const,
      result: 'Stop' as const,
      amount: -60,
      note: 'Entrei cedo, paciência da próxima.',
      timestamp: now - 1 * DAY + 15 * 60 * 60 * 1000,
    },
    {
      id: uid(),
      accountId: accounts[0].id,
      asset: 'MGC' as const,
      context: 'Estrutura Wyckoff' as const,
      timeframe: 'M15' as const,
      result: 'Take' as const,
      amount: 80,
      note: 'Boa leitura de fluxo.',
      timestamp: now - 1 * DAY + 19 * 60 * 60 * 1000,
    },
  ];

  const movements = [
    {
      id: uid(),
      type: 'investimento' as const,
      amount: 150,
      description: 'Inscrição Lucid 25K #01',
      timestamp: now - 5 * DAY,
    },
  ];

  return { accounts, trades, movements, seeded: true };
}
