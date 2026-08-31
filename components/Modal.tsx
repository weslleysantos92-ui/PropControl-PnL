import type { ReactNode } from 'react';

export function Modal({ open, onClose, title, children, showHeader = true }: { open: boolean; onClose: () => void; title: string; children: ReactNode; showHeader?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-ink-700 bg-ink-850 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {showHeader && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white">{title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none" aria-label="Fechar">×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function BottomSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-ink-700 bg-ink-850 p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-ink-600 mx-auto mb-5" />
        {children}
      </div>
    </div>
  );
}
