import React, { useState } from 'react';
import { db } from '../../services/db';
import Pagination from '../Pagination';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'banned';
  gender?: string;
  birthday?: string;
  bio?: string;
  updatedAt?: any;
}

interface AdminUsersProps {
  users: User[];
  refreshData: () => void;
  theme?: 'light' | 'midnight';
}

const AdminUsers: React.FC<AdminUsersProps> = ({ users, refreshData, theme = 'light' }) => {
  const isMidnight = theme === 'midnight';
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleUpdateUserRole = async (userId: string, currentRole: 'admin' | 'user') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Bạn có chắc muốn chuyển người dùng này thành ${newRole === 'admin' ? 'Quản trị viên' : 'Khách hàng'}?`)) return;
    
    try {
      await db.updateUserRole(userId, newRole);
      refreshData();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Có lỗi xảy ra khi cập nhật vai trò');
    }
  };

  const handleUpdateUserStatus = async (userId: string, currentStatus: 'active' | 'banned') => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    const actionText = newStatus === 'banned' ? 'KHÓA' : 'MỞ KHÓA';
    if (!window.confirm(`Bạn có chắc muốn ${actionText} tài khoản này?`)) return;
    
    try {
      await db.updateUserStatus(userId, newStatus);
      refreshData();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản này? Mọi dữ liệu hồ sơ cá nhân trong hệ thống sẽ bị gỡ bỏ.')) return;
    
    try {
      await db.deleteUser(userId);
      refreshData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Có lỗi xảy ra khi xóa tài khoản');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
    const effectiveStatus = user.status || 'active';
    const matchesStatus = userStatusFilter === 'all' || effectiveStatus === userStatusFilter;
    const matchesSearch = !searchQuery || 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery);
    return matchesRole && matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-fadeIn text-foreground">
      {/* Filters Bar */}
      <div className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card/40 backdrop-blur-md border-border shadow-3xl'} flex flex-wrap items-center justify-between gap-4 p-6 rounded-[2.5rem] transition-all hover:border-primary/20`}>
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase tracking-premium text-muted-foreground ml-1">Vai trò</span>
            <div className={`flex gap-1 p-1 rounded-xl ${
              isMidnight ? 'bg-slate-700/30 border-white/10' : 'bg-secondary/30 border-border/50'
            }`}>
              {(['all', 'admin', 'user'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => { setUserRoleFilter(role); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-premium transition-all ${
                    userRoleFilter === role
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {role === 'all' ? 'Tất cả' : role === 'admin' ? 'Admin' : 'User'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase tracking-premium text-muted-foreground ml-1">Trạng thái</span>
            <div className={`flex gap-1 p-1 rounded-xl ${
              isMidnight ? 'bg-slate-700/30 border-white/10' : 'bg-secondary/30 border-border/50'
            }`}>
              {(['all', 'active', 'banned'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => { setUserStatusFilter(status); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-premium transition-all ${
                    userStatusFilter === status
                    ? (status === 'banned' ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20' : 'bg-green-500 text-white shadow-lg shadow-green-500/20')
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {status === 'all' ? 'Tất cả' : status === 'active' ? 'Active' : 'Banned'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto mt-1">
          <div className="relative group flex-1 sm:w-72">
            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors"></i>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border font-bold outline-none transition-all ${
                isMidnight 
                ? 'bg-slate-800/50 border-white/5 text-slate-200 focus:bg-slate-800 focus:border-primary/50' 
                : 'border-border bg-secondary/30 text-foreground focus:border-primary focus:bg-card'
              }`}
            />
          </div>
          <button
            onClick={refreshData}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all shadow-sm group active:scale-95"
            title="Refresh"
          >
            <i className="fa-solid fa-rotate-right group-hover:rotate-180 transition-transform duration-500"></i>
          </button>
        </div>
      </div>

      <div className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card/40 backdrop-blur-md border-border shadow-3xl'} rounded-[2.5rem] overflow-hidden min-h-[500px]`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className={`border-b ${isMidnight ? 'bg-slate-900/50 border-white/5' : 'border-border/50'}`}>
                <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-premium">Người dùng</th>
                <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-premium">Liên hệ</th>
                <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-premium text-center">Vai trò</th>
                <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-premium text-center">Trạng thái</th>
                <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-premium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-border/30'}`}>
              <AnimatePresence mode="popLayout">
                {paginatedUsers.length > 0 ? paginatedUsers.map((user, idx) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`group transition-all duration-300 ${isMidnight ? 'hover:bg-slate-700/30' : 'hover:bg-secondary/30'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative group/avatar">
                          <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=7033ff&color=fff&bold=true`}
                            alt={user.name}
                            className="w-10 h-10 rounded-xl object-cover shadow-md border-2 border-white transition-transform group-hover/avatar:scale-105"
                            onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=7033ff&color=fff&bold=true`; }}
                          />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-white shadow-sm transition-colors ${user.status === 'banned' ? 'bg-destructive' : 'bg-green-500 shadow-green-500/20'}`}></div>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground mb-0.5 group-hover:text-primary transition-colors">{user.name || 'User'}</h4>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-premium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-foreground">
                          <i className="fa-solid fa-phone text-primary text-[8px]"></i>
                          {user.phone || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-medium text-muted-foreground max-w-[150px] truncate">
                          <i className="fa-solid fa-location-dot text-muted-foreground/40"></i>
                          {user.address || 'No address'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleUpdateUserRole(user.id, user.role || 'user')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${
                          user.role === 'admin'
                          ? 'bg-amber-500 text-white shadow-amber-500/20'
                          : (isMidnight ? 'bg-slate-700 text-slate-400 border-white/5 hover:bg-primary/20 hover:text-primary' : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border/50')
                        }`}
                      >
                        <i className={user.role === 'admin' ? "fa-solid fa-shield-halved text-[8px]" : "fa-solid fa-user text-[8px]"}></i>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                          (user.status || 'active') === 'active'
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20 shadow-lg shadow-destructive/10'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ (user.status || 'active') === 'active' ? 'bg-green-500' : 'bg-destructive animate-pulse'}`}></span>
                          {(user.status || 'active') === 'active' ? 'Active' : 'Banned'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                         <button
                          onClick={() => handleUpdateUserStatus(user.id, user.status || 'active')}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all shadow-sm ${
                            (user.status || 'active') === 'active'
                            ? 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-white'
                            : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'
                          }`}
                          title={(user.status || 'active') === 'active' ? 'Ban user' : 'Unban user'}
                        >
                          <i className={`fa-solid ${(user.status || 'active') === 'active' ? 'fa-user-lock' : 'fa-user-check'} text-[10px]`}></i>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:bg-destructive hover:text-white transition-all shadow-sm active:scale-90"
                          title="Delete user"
                        >
                          <i className="fa-solid fa-trash-can text-[10px]"></i>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner ${
                            isMidnight ? 'bg-slate-800 border-white/5' : 'bg-secondary/50 border-border/50'
                          }`}>
                            <i className="fa-solid fa-users-slash text-2xl text-muted-foreground/20"></i>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">No users found</p>
                            <p className="text-[10px] font-semibold text-muted-foreground/60">Try different filters or search terms.</p>
                          </div>
                          <button
                            onClick={() => { setUserRoleFilter('all'); setUserStatusFilter('all'); setSearchQuery(''); }}
                            className="mt-2 text-primary font-black uppercase tracking-premium text-[10px] border-b-2 border-primary/20 hover:border-primary transition-all pb-1"
                          >
                            Clear filters
                          </button>
                        </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`px-6 py-4 border-t ${isMidnight ? 'border-white/5 bg-slate-900/40' : 'border-border/50 bg-secondary/20'}`}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              theme={theme}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
