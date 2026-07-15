import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  title: string;
  darkMode: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ title, darkMode, onClose, children, footer }: ModalProps) {
  const cardBg = darkMode ? '#1A1829' : '#F4F2FF';
  const textCol = darkMode ? '#E0E0FF' : '#1A1829';
  const mutedCol = darkMode ? '#9A93C9' : '#6B6490';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          onClick={e => e.stopPropagation()}
          className="rounded-3xl w-full flex flex-col"
          style={{ background: cardBg, maxWidth: 480, maxHeight: '85vh', border: '1px solid rgba(108,99,255,0.25)', boxShadow: '0 24px 70px rgba(0,0,0,0.5)' }}
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.12)'}` }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: textCol }}>{title}</h3>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 hover:opacity-70 transition-all"
              style={{ background: 'rgba(108,99,255,0.12)' }}>
              <X size={15} style={{ color: mutedCol }} />
            </button>
          </div>
          <div className="px-6 py-5 overflow-y-auto" style={{ color: mutedCol, fontSize: '0.85rem', lineHeight: 1.6 }}>
            {children}
          </div>
          {footer && (
            <div className="px-6 pb-5 pt-2 flex-shrink-0">{footer}</div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
