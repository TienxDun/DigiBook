import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { USE_API, toggleServiceMode } from '@/services/db/adapter';
import { useAuth } from '@/features/auth';

export const ServiceModeSwitcher: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!user?.isAdmin) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col items-start gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-4 rounded-2xl shadow-premium min-w-[240px]"
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
                <span>Chuyển đổi chế độ sẽ làm mới lại toàn bộ ứng dụng để đồng bộ cache.</span>
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-premium border-4 border-white transition-colors ${
          USE_API ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'
        }`}
      >
        {USE_API ? '🔥' : '📱'}
        {/* Pulse effect */}
        <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute inset-0 rounded-full ${USE_API ? 'bg-emerald-500' : 'bg-indigo-500'}`}
            style={{ zIndex: -1 }}
        />
      </motion.button>
    </div>
  );
};
