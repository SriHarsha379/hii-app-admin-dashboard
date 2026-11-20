import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (opts: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error:   (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info:    (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  error:   <XCircle      className="w-4 h-4 text-red-400"     />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400"  />,
  info:    <Info          className="w-4 h-4 text-blue-400"   />,
};

const STYLES: Record<ToastType, string> = {
  success: 'border-emerald-500/20 bg-emerald-500/10',
  error:   'border-red-500/20     bg-red-500/10',
  warning: 'border-amber-500/20   bg-amber-500/10',
  info:    'border-blue-500/20    bg-blue-500/10',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { ...opts, id }]); // max 5 at once
    const duration = opts.duration ?? (opts.type === 'error' ? 6000 : 4000);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const success = useCallback((title: string, message?: string) => toast({ type: 'success', title, message }), [toast]);
  const error   = useCallback((title: string, message?: string) => toast({ type: 'error',   title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ type: 'warning', title, message }), [toast]);
  const info    = useCallback((title: string, message?: string) => toast({ type: 'info',    title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0,  scale: 1   }}
              exit={{    opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl max-w-sm',
                STYLES[t.type]
              )}
            >
              <div className="mt-0.5 shrink-0">{ICONS[t.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white uppercase tracking-widest">{t.title}</p>
                {t.message && <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">{t.message}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-white/20 hover:text-white transition-colors shrink-0 mt-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx ?? { toast: ()=>{}, success: ()=>{}, error: ()=>{}, warning: ()=>{}, info: ()=>{} };
  return ctx;
}
