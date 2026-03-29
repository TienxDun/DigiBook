import React from 'react';
import { Link } from 'react-router-dom';
import { AdminMenuGroup, AdminTabId } from '../types';

interface AdminSidebarProps {
  activeTab: AdminTabId;
  isMobileMenuOpen: boolean;
  isSidebarCollapsed: boolean;
  menuGroups: AdminMenuGroup[];
  onSelectTab: (tabId: AdminTabId) => void;
  onCloseMobileMenu: () => void;
  onToggleCollapse: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  isMobileMenuOpen,
  isSidebarCollapsed,
  menuGroups,
  onSelectTab,
  onCloseMobileMenu,
  onToggleCollapse,
}) => (
  <aside className={`${isSidebarCollapsed ? 'w-24' : 'w-80'} flex flex-col fixed inset-y-0 z-[100] shadow-xl transition-all duration-500 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} bg-[#0f172a] border-white/5 border-r`}>
    <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} gap-4 h-24 relative z-20 border-b border-white/5 bg-[#0f172a]`}>
      {!isSidebarCollapsed ? (
        <div className="flex items-center gap-4 animate-fadeIn">
          <Link to="/" className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-primary-foreground hover:scale-105 shadow-xl shadow-primary/20 transition-all active:scale-95 group">
            <i className="fa-solid fa-bolt-lightning group-hover:rotate-12 transition-transform"></i>
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none text-slate-100">DigiBook</h1>
            <p className="text-[10px] font-black text-primary/80 uppercase tracking-[0.3em] mt-1.5">Architecture</p>
          </div>
        </div>
      ) : (
        <Link to="/" className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground hover:scale-105 shadow-xl shadow-primary/20 transition-all active:scale-95 group">
          <i className="fa-solid fa-bolt-lightning group-hover:rotate-12 transition-transform"></i>
        </Link>
      )}
      <button onClick={onCloseMobileMenu} className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center transition-colors text-slate-400 hover:text-white hover:bg-white/5">
        <i className="fa-solid fa-xmark text-lg"></i>
      </button>
    </div>

    <nav className="flex-1 overflow-y-auto p-4 space-y-6 mt-2 custom-scrollbar relative z-10">
      {menuGroups.map((group) => (
        <div key={group.title} className="space-y-2">
          {!isSidebarCollapsed && (
            <h3 className="px-4 text-xs font-black uppercase tracking-[0.2em] mb-4 animate-fadeIn text-slate-500">
              {group.title}
            </h3>
          )}
          <div className="space-y-1">
            {group.items.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                title={isSidebarCollapsed ? tab.label : ''}
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-5'} w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wide transition-all duration-300 group relative ${activeTab === tab.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1'}`}
              >
                <i className={`fa-solid ${tab.icon} ${isSidebarCollapsed ? 'text-lg' : 'text-sm w-5 text-center'} ${activeTab === tab.id ? 'text-white' : 'text-slate-500 group-hover:text-primary'}`}></i>
                {!isSidebarCollapsed && <span className="animate-fadeIn">{tab.label}</span>}
                {activeTab === tab.id && !isSidebarCollapsed && (
                  <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                )}
                {activeTab === tab.id && isSidebarCollapsed && (
                  <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full shadow-[0_0_10px_white]"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>

    <div className="p-4 border-t hidden lg:block border-white/5">
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest overflow-hidden bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
      >
        <i className={`fa-solid ${isSidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'} transition-transform duration-500`}></i>
        {!isSidebarCollapsed && <span className="whitespace-nowrap animate-fadeIn">Thu gọn menu</span>}
      </button>
    </div>
  </aside>
);

export default AdminSidebar;
