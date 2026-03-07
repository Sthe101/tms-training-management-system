'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
});

const toastStyles: Record<ToastType, { strip: string; icon: string }> = {
  success: { strip: 'bg-green-500', icon: 'text-green-500' },
  error:   { strip: 'bg-red-500',   icon: 'text-red-500' },
  info:    { strip: 'bg-[#0891b2]', icon: 'text-[#0891b2]' },
  warning: { strip: 'bg-amber-500', icon: 'text-amber-500' },
};

const toastIcons: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => remove(id), AUTO_DISMISS_MS);
    },
    [remove],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (msg) => show(msg, 'success'),
      error: (msg) => show(msg, 'error'),
      info: (msg) => show(msg, 'info'),
      warning: (msg) => show(msg, 'warning'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-auto pointer-events-none">
        {toasts.map((toast) => {
          const styles = toastStyles[toast.type];
          const Icon = toastIcons[toast.type];
          return (
            <div
              key={toast.id}
              className="flex items-stretch rounded-lg bg-white border border-gray-100 shadow-md pointer-events-auto w-max max-w-xs overflow-hidden animate-in slide-in-from-right-4 fade-in duration-200"
            >
              <div className={cn('w-1 flex-shrink-0', styles.strip)} />
              <div className="flex items-center gap-2 px-3 py-2.5">
                <Icon className={cn('w-4 h-4 flex-shrink-0', styles.icon)} />
                <p className="text-sm text-gray-800 whitespace-nowrap">
                  {toast.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
