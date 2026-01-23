import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  id: string;
  type: ToastType;
  title?: string | React.ReactNode;
  message?: string;
  content?: React.ReactNode;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 4000;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const decrement = (100 / duration) * 50;
        return Math.max(prev - decrement, 0);
      });
    }, 50);

    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [toast.id, duration, onDismiss]);

  const getToastConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: 'fa-circle-check',
          iconColor: 'text-emerald-500',
        };
      case 'error':
        return {
          icon: 'fa-circle-xmark',
          iconColor: 'text-rose-500',
        };
      case 'warning':
        return {
          icon: 'fa-triangle-exclamation',
          iconColor: 'text-amber-500',
        };
      case 'info':
        return {
          icon: 'fa-circle-info',
          iconColor: 'text-indigo-500',
        };
    }
  };

  const config = getToastConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, type: 'spring', bounce: 0, stiffness: 300, damping: 20 }}
      layout
      className="group relative w-full max-w-sm bg-white border border-slate-100/50 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden backdrop-blur-md"
    >
      <div className="p-3.5 pr-10 flex items-start gap-3">
        {/* Simple Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
          <i className={`fas ${config.icon} text-lg`}></i>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {toast.content ? (
            <div>{toast.content}</div>
          ) : (
            <>
              {toast.title && (
                 <div className="font-semibold text-slate-800 text-[14px] leading-5">
                  {toast.title}
                 </div>
              )}
              {toast.message && (
                <p className="text-slate-500 text-[13px] leading-5 mt-0.5">
                  {toast.message}
                </p>
              )}
            </>
          )}
        </div>

        {/* Minimal Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(toast.id);
          }}
          className="absolute top-3 right-3 p-1 text-slate-300 hover:text-slate-500 transition-colors rounded-full"
        >
          <i className="fas fa-xmark text-sm"></i>
        </button>
      </div>

      {/* Thin Progress line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-100">
        <motion.div
          className={`h-full ${config.iconColor.replace('text-', 'bg-')} opacity-60`}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.05, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
};

export default Toast;
