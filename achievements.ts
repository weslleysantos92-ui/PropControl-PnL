import type { Account } from './types';
import { countFundedBySize } from './rotation';

export interface Achievement {
  id: string;
  level: '25K' | '50K' | '100K' | 'Master';
  title: string;
  description: string;
  unlocked: boolean;
  progress: { current: number; target: number };
}

export function getAchievements(accounts: Account[]): Achievement[] {
  const f25 = countFundedBySize(accounts, '25K');
  const f50 = countFundedBySize(accounts, '50K');
  const f100 = countFundedBySize(accounts, '100K');

  return [
    {
      id: 'first-25',
      level: '25K',
      title: 'Primeiro Passo',
      description: 'Financie sua primeira conta de 25K.',
      unlocked: f25 >= 1,
      progress: { current: Math.min(f25, 1), target: 1 },
    },
    {
      id: 'quarteto-25',
      level: '25K',
      title: 'Quarteto de Ferro 25K',
      description: 'Tenha 4 contas de 25K financiadas simultaneamente.',
      unlocked: f25 >= 4,
      progress: { current: Math.min(f25, 4), target: 4 },
    },
    {
      id: 'first-50',
      level: '50K',
      title: 'Subindo de Nível',
      description: 'Financie sua primeira conta de 50K.',
      unlocked: f50 >= 1,
      progress: { current: Math.min(f50, 1), target: 1 },
    },
    {
      id: 'consist-50',
      level: '50K',
      title: 'Consistência de 50K',
      description: 'Tenha 4 contas de 50K financiadas.',
      unlocked: f50 >= 4,
      progress: { current: Math.min(f50, 4), target: 4 },
    },
    {
      id: 'first-100',
      level: '100K',
      title: 'Elite do Mercado',
      description: 'Financie sua primeira conta de 100K.',
      unlocked: f100 >= 1,
      progress: { current: Math.min(f100, 1), target: 1 },
    },
    {
      id: 'objetivo-100',
      level: '100K',
      title: 'Objetivo Concluído',
      description: 'Atinja a meta master: 4 contas de 100K financiadas.',
      unlocked: f100 >= 4,
      progress: { current: Math.min(f100, 4), target: 4 },
    },
  ];
}

export interface MasterGoal {
  current: number;
  target: number;
  complete: boolean;
}

export function getMasterGoal(accounts: Account[]): MasterGoal {
  const current = countFundedBySize(accounts, '100K');
  return { current, target: 4, complete: current >= 4 };
}
