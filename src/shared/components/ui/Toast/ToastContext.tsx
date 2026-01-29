import React, { createContext, useCallback, useState, ReactNode, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast, { ToastData, ToastType } from './Toast';

interface ToastContextValue {
  showToast: (type: ToastType, title: string | ReactNode, message?: string, duration?: number, content?: ReactNode) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback(
    (type: ToastType, title: string | ReactNode, message?: string, duration?: number, content?: ReactNode) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastData = {
        id,
        type,
        title,
        message,
        content,
        duration: duration || 4000,
      };

      setToasts((prev) => {
        // Giới hạn tối đa 3 toast cùng lúc
        const updated = [...prev, newToast];
        return updated.slice(-3);
      });
    },
    []
  );

  const success = useCallback(
    (title: string, message?: string, duration?: number) => {
      showToast('success', title, message, duration);
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) => {
      showToast('error', title, message, duration);
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string, duration?: number) => {
      showToast('info', title, message, duration);
    },
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string, duration?: number) => {
      showToast('warning', title, message, duration);
    },
    [showToast]
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Initialize toast adapter for backward compatibility
  useEffect(() => {
    import('@/shared/utils/toast').then(({ setToastInstance }) => {
      setToastInstance({ showToast });
    });
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        success,
        error,
        info,
        warning,
        dismiss,
      }}
    >
      {children}
      
      {/* Toast Container */}
      <div className="fixed z-[9999] pointer-events-none 
        /* Mobile: Top Center, fit width */
        top-[72px] left-0 right-0 flex flex-col items-center px-4
        /* Desktop: Top Right, fixed width */
        lg:top-[88px] lg:left-auto lg:right-0 lg:items-end lg:px-6
      ">
        <div className="flex flex-col gap-3 w-full max-w-sm pointer-events-auto">
          <AnimatePresence mode="popLayout">
            {toasts.map((toast) => (
              <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
};
