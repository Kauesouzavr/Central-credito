'use client';

import { useEffect, useId } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const EASE = [0.23, 1, 0.32, 1];

export function Modal({ open, onClose, title, description, size = 'md', children }) {
  const tituloId = useId();
  const reduzir = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const aoTeclar = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-ink/25 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduzir ? 0 : 0.2, ease: EASE }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            className={twMerge(
              'glass-strong relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-[28px]',
              size === 'lg' ? 'max-w-2xl' : 'max-w-lg'
            )}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: reduzir ? 0 : 0.24, ease: EASE }}
          >
            <header className="flex items-start justify-between gap-4 px-6 pb-2 pt-6 sm:px-8 sm:pt-8">
              <div>
                <h2 id={tituloId} className="text-2xl font-extrabold tracking-tight text-ink">
                  {title}
                </h2>
                {description && <p className="mt-1 text-base text-ink-soft">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-ink-soft transition-colors duration-150 hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </header>
            <div className="overflow-y-auto px-6 pb-6 pt-4 sm:px-8 sm:pb-8">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
