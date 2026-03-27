import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { USE_API, toggleServiceMode } from '@/services/db/adapter';
import { useAuth } from '@/features/auth';

export const ServiceModeSwitcher: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  // Chỉ hiển thị khi đang ở trang admin
  const isAdminPage = location.pathname.startsWith('/admin');
  
  if (!isAdminPage) return null;

  return (
    <div className="relative flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-4 right-0 bg-white/80 backdrop-blur-xl border border-slate-200/50 p-4 rounded-2xl shadow-premium min-w-[280px] z-[100]"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-micro font-bold uppercase tracking-widest text-slate-400">Chế độ dịch vụ</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div 
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  !USE_API 
                    ? 'border-indigo-500 bg-indigo-50/50' 
                    : 'border-slate-100 hover:border-slate-200'
                }`}
                onClick={() => !USE_API ? null : toggleServiceMode()}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${!USE_API ? 'bg-indigo-500 text-white shadow-indigo-200 shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                    📱
                  </div>
                  <div>
                    <p className={`font-bold text-small ${!USE_API ? 'text-indigo-900' : 'text-slate-600'}`}>Firebase Direct</p>
                    <p className="text-micro text-slate-400">Kết nối trực tiếp client-side</p>
                  </div>
                </div>
              </div>

              <div 
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  USE_API 
                    ? 'border-emerald-500 bg-emerald-50/50' 
                    : 'border-slate-100 hover:border-slate-200'
                }`}
                onClick={() => USE_API ? null : toggleServiceMode()}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${USE_API ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                    🔥
                  </div>
                  <div>
                    <p className={`font-bold text-small ${USE_API ? 'text-emerald-900' : 'text-slate-600'}`}>API Backend</p>
                    <p className="text-micro text-slate-400">Xử lý qua server .NET 6</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-2 bg-amber-50 rounded-lg border border-amber-100 italic">
               <p className="text-[10px] text-amber-700 leading-tight flex items-start gap-2">
                <span>⚠️</span>
                <span>Làm mới ứng dụng sau khi chuyển đổi.</span>
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center text-lg shadow-lg border transition-all ${
          USE_API 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/50' 
            : 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-100/50'
        }`}
        title={`Chế độ: ${USE_API ? 'API Backend' : 'Firebase Direct'}`}
      >
        {USE_API ? '🔥' : '📱'}
        {/* Pulse effect */}
        <motion.div
            initial={{ scale: 1, opacity: 0.3 }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute inset-0 rounded-full ${USE_API ? 'bg-emerald-400' : 'bg-indigo-400'}`}
            style={{ zIndex: -1 }}
        />
      </motion.button>
    </div>
  );
};
