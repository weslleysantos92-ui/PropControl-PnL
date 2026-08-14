import type { AccountSize, AccountStatus } from '../types';
import { SIZE_COLORS } from '../types';

export function SizeTag({ size, className = '' }: { size: AccountSize; className?: string }) {
  const c = SIZE_COLORS[size];
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${c.soft} ${c.text} ${className}`}>{size}</span>;
}

export function StatusTag({ status, size, className = '' }: { status: AccountStatus; size?: AccountSize; className?: string }) {
  const color = status === 'Financiada' ? 'bg-funded-soft text-funded-text' : status === 'Reprovada' ? 'bg-loss-soft text-loss-text' : size ? `${SIZE_COLORS[size].soft} ${SIZE_COLORS[size].text}` : 'bg-ink-700 text-gray-300';
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${color} ${className}`}>{status === 'Avaliacao' ? 'Avaliação' : status}</span>;
}
