import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type Kind = 'success' | 'error' | 'info';
interface Toast { id: number; kind: Kind; text: string }

const ToastContext = createContext<(text: string, kind?: Kind) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: Kind = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);
  const Icon = { success: CheckCircle2, error: AlertTriangle, info: Info };
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]" role="status" aria-live="polite">
        {toasts.map((t) => {
          const I = Icon[t.kind];
          return (
            <div key={t.id} className={`flex items-start gap-2.5 p-3 rounded-xl border backdrop-blur-xl shadow-2xl text-sm ${
              t.kind === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                : t.kind === 'error' ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
                  : 'bg-[#191b26]/95 border-[#ffd371]/30 text-[#e1e1f1]'}`}>
              <I className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="flex-1">{t.text}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="opacity-60 hover:opacity-100 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
