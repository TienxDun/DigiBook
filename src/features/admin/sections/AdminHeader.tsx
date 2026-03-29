import React from 'react';
import { ADMIN_TABS } from '../constants';
import { AdminTabId, AdminTheme } from '../types';

interface AdminHeaderProps {
  activeTab: AdminTabId;
  adminTheme: AdminTheme;
  onOpenMobileMenu: () => void;
  onToggleTheme: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  adminTheme,
  onOpenMobileMenu,
  onToggleTheme,
}) => {
  const isMidnight = adminTheme === 'midnight';

  return (
    <header className={`backdrop-blur-xl border-b sticky top-0 z-40 h-24 flex items-center justify-between px-6 lg:px-10 transition-all ${isMidnight ? 'border-white/5 bg-[#0f172a]/80 shadow-lg' : 'border-border bg-background/80'}`}>
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileMenu}
          className={`lg:hidden w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 border ${isMidnight ? 'bg-slate-800 text-slate-200 border-white/5' : 'bg-card text-foreground border-border'}`}
        >
          <i className="fa-solid fa-bars-staggered"></i>
        </button>
        <div className="animate-fadeIn">
          <h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight text-foreground">
            {ADMIN_TABS[activeTab].title}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <button
          onClick={onToggleTheme}
          className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg border ${isMidnight ? 'bg-slate-800 border-white/5 text-amber-400 shadow-black/20 hover:bg-slate-700' : 'bg-card text-indigo-600 border-border shadow-slate-200/50 hover:bg-slate-50'}`}
          title={isMidnight ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        >
          <i className={`fa-solid ${isMidnight ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>

        <div className="hidden md:flex flex-col items-end">
          <span className="text-micro font-black text-muted-foreground uppercase tracking-widest">{new Date().toLocaleDateString('vi-VN', { weekday: 'long' })}</span>
          <span className={`text-sm font-black ${isMidnight ? 'text-slate-200' : 'text-foreground'}`}>{new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
