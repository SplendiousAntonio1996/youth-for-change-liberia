import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { AnimatedCheckmark } from '../components/AnimatedCheckmark';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (message: string, title?: string, duration?: number) => string;
  error: (message: string, title?: string, duration?: number) => string;
  info: (message: string, title?: string, duration?: number) => string;
  warning: (message: string, title?: string, duration?: number) => string;
  showSuccess: (message: string, title?: string, duration?: number) => string;
  showError: (message: string, title?: string, duration?: number) => string;
  showInfo: (message: string, title?: string, duration?: number) => string;
  showWarning: (message: string, title?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4500 }: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title: string = 'Success', duration: number = 4500) =>
      addToast({ type: 'success', title, message, duration }),
    [addToast]
  );

  const error = useCallback(
    (message: string, title: string = 'Error', duration: number = 5500) =>
      addToast({ type: 'error', title, message, duration }),
    [addToast]
  );

  const info = useCallback(
    (message: string, title: string = 'Notice', duration: number = 4500) =>
      addToast({ type: 'info', title, message, duration }),
    [addToast]
  );

  const warning = useCallback(
    (message: string, title: string = 'Warning', duration: number = 5000) =>
      addToast({ type: 'warning', title, message, duration }),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        info,
        warning,
        showSuccess: success,
        showError: error,
        showInfo: info,
        showWarning: warning
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  return (
    <aside
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 15, transition: { duration: 0.2 } }}
            layout
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all ${getToastStyles(
              toast.type
            )}`}
            role="status"
            aria-live="polite"
          >
            <div className="shrink-0 mt-0.5">{getToastIcon(toast.type)}</div>
            <div className="flex-1 min-w-0 pr-1">
              {toast.title && (
                <h4 className="font-bold text-sm leading-snug tracking-tight">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs sm:text-sm mt-0.5 leading-relaxed opacity-90 break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 -mr-1 -mt-1 p-1 rounded-lg hover:bg-black/10 transition-colors opacity-70 hover:opacity-100 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </aside>
  );
};

function getToastIcon(type: ToastType) {
  switch (type) {
    case 'success':
      return <AnimatedCheckmark size={20} color="emerald" showHalo={false} strokeWidth={2.6} />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-rose-600" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    case 'info':
    default:
      return <Info className="w-5 h-5 text-blue-600" />;
  }
}

function getToastStyles(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'bg-emerald-50/95 border-emerald-300 text-emerald-950 shadow-emerald-950/10';
    case 'error':
      return 'bg-rose-50/95 border-rose-300 text-rose-950 shadow-rose-950/10';
    case 'warning':
      return 'bg-amber-50/95 border-amber-300 text-amber-950 shadow-amber-950/10';
    case 'info':
    default:
      return 'bg-blue-50/95 border-blue-300 text-blue-950 shadow-blue-950/10';
  }
}
