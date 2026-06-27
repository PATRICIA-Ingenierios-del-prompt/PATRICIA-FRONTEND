import { useState, useEffect, useCallback } from 'react';
import { X, Heart, Calendar, MessageCircle, AlertTriangle, Trophy, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'match' | 'evento' | 'chat' | 'reporte' | 'logro' | 'xp' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

let toastQueue: Toast[] = [];
let listeners: ((toasts: Toast[]) => void)[] = [];

const notify = (listeners: ((toasts: Toast[]) => void)[], toasts: Toast[]) => {
  listeners.forEach(l => l([...toasts]));
};

export const addToast = (toast: Omit<Toast, 'id'>) => {
  const t: Toast = { ...toast, id: Math.random().toString(36).slice(2), duration: toast.duration ?? 4000 };
  toastQueue = [...toastQueue, t];
  notify(listeners, toastQueue);
  setTimeout(() => {
    toastQueue = toastQueue.filter(x => x.id !== t.id);
    notify(listeners, toastQueue);
  }, t.duration);
};

const typeConfig: Record<ToastType, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  match:  { icon: Heart,         color: '#FF6B9D', bg: 'rgba(255,107,157,0.12)' },
  evento: { icon: Calendar,      color: '#FFB347', bg: 'rgba(255,179,71,0.12)' },
  chat:   { icon: MessageCircle, color: '#6C63FF', bg: 'rgba(108,99,255,0.12)' },
  reporte:{ icon: AlertTriangle, color: '#FF4D6A', bg: 'rgba(255,77,106,0.12)' },
  logro:  { icon: Trophy,        color: '#FFB347', bg: 'rgba(255,179,71,0.12)' },
  xp:     { icon: Zap,           color: '#7FE7C4', bg: 'rgba(127,231,196,0.12)' },
  info:   { icon: MessageCircle, color: 'var(--p-muted)', bg: 'rgba(139,133,176,0.12)' },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.push(setToasts);
    return () => { listeners = listeners.filter(l => l !== setToasts); };
  }, []);

  const dismiss = (id: string) => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 340 }}>
      <AnimatePresence>
        {toasts.map(toast => {
          const cfg = typeConfig[toast.type];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="flex items-start gap-3 px-4 py-3.5 rounded-2xl border pointer-events-auto cursor-pointer"
              style={{ background: 'var(--p-card)', borderColor: `${cfg.color}30`, backdropFilter: 'blur(12px)', boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${cfg.color}20` }}
              onClick={() => dismiss(toast.id)}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                <Icon size={16} style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--p-text)' }}>{toast.title}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--p-muted)', marginTop: '2px' }}>{toast.message}</p>
              </div>
              <button onClick={() => dismiss(toast.id)} className="flex-shrink-0 mt-0.5 hover:opacity-70">
                <X size={13} style={{ color: 'var(--p-muted)' }} />
              </button>
              {/* Progress bar */}
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 rounded-full"
                style={{ background: cfg.color, width: '100%' }}
                initial={{ scaleX: 1, originX: 0 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: (toast.duration ?? 4000) / 1000, ease: 'linear' }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
