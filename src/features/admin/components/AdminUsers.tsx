import React, { useState, useMemo } from 'react';
import toast from '@/shared/utils/toast';
import { db } from '@/services/db';
import { Pagination } from '@/shared/components';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile as User } from '@/shared/types';

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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleUpdateUserRole = async (userId: string, currentRole: 'admin' | 'user') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Bạn có chắc chắn muốn chuyển người dùng này thành ${newRole === 'admin' ? 'Quản trị viên' : 'Khách hàng'}?`)) return;

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
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản này?`)) return;

    try {
      await db.updateUserStatus(userId, newStatus);
      refreshData();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản này? Mọi dữ liệu liên quan trong hệ thống sẽ bị gỡ bỏ.')) return;

    try {
      await db.deleteUser(userId);
      refreshData();
      toast.success('Đã xóa người dùng thành công');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Có lỗi xảy ra khi xóa tài khoản');
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  const toggleSelectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;
    if (window.confirm(`Xóa vĩnh viễn ${selectedUsers.length} người dùng đã chọn?`)) {
      setIsDeletingBulk(true);
      try {
        await Promise.all(selectedUsers.map(id => db.deleteUser(id)));
        toast.success(`Đã xóa ${selectedUsers.length} người dùng`);
        setSelectedUsers([]);
        refreshData();
      } catch (err) {
        console.error('Error bulk deleting users', err);
        toast.error('Có lỗi khi xóa hàng loạt');
      } finally {
        setIsDeletingBulk(false);
      }
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
      {/* Users Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng người dùng', value: users.length, icon: 'fa-users', color: 'primary' },
          { label: 'Mới đăng ký', value: users.filter(u => true).length, icon: 'fa-user-plus', color: 'chart-1' },
          { label: 'Admin', value: users.filter(u => u.role === 'admin').length, icon: 'fa-user-shield', color: 'chart-2' },
          { label: 'Đã khóa', value: users.filter(u => u.status === 'banned').length, icon: 'fa-user-lock', color: 'destructive' }
        ].map((stat, i) => (
          <div key={i} className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card border-border shadow-sm'} p-6 rounded-[2rem] border group transition-all hover:border-primary/50`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-foreground">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg bg-${stat.color}/10 text-${stat.color} border border-${stat.color}/20 shadow-sm group-hover:scale-110 transition-transform`}>
                <i className={`fa-solid ${stat.icon}`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card/40 backdrop-blur-xl border-border shadow-xl shadow-slate-200/30'} flex flex-wrap items-center justify-between gap-6 p-5 rounded-[2.5rem] border transition-all hover:border-primary/20 sticky top-0 z-30`}>
        {/* Search & Stats Group */}
        <div className="flex flex-wrap items-center gap-5 flex-1 min-w-[300px]">
          <div className="relative group flex-1 max-w-sm">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isMidnight ? 'bg-slate-700 text-slate-400' : 'bg-muted text-muted-foreground'
              } group-focus-within:bg-primary group-focus-within:text-primary-foreground group-focus-within:shadow-lg group-focus-within:shadow-primary/20`}>
              <i className="fa-solid fa-magnifying-glass text-[10px]"></i>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className={`w-full h-12 pl-16 pr-5 rounded-2xl text-xs font-bold outline-none border transition-all ${isMidnight
                ? 'bg-slate-800/50 border-white/5 text-slate-200 focus:bg-slate-800'
                : 'bg-card border-border text-foreground focus:border-primary focus:ring-4 focus:ring-primary/5'
                }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full transition-all flex items-center justify-center ${isMidnight ? 'bg-slate-700 text-slate-400 hover:bg-destructive' : 'bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground'
                  }`}
              >
                <i className="fa-solid fa-xmark text-[10px]"></i>
              </button>
            )}
          </div>

          <div className={`h-8 w-px hidden xl:block ${isMidnight ? 'bg-white/5' : 'bg-border'}`}></div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Tổng:</span>
            <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-lg">{users.length}</span>
          </div>


          {/* Filters were moved to the right side */}
        </div>

        {/* Filters Group - Right Side */}
        <div className="flex items-center gap-3">
          {/* Filters */}
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
            {/* Role Filter */}
            <div className={`flex gap-1 p-1 rounded-xl border ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border/50'}`}>
              {(['all', 'admin', 'user'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => { setUserRoleFilter(role); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${userRoleFilter === role
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {role === 'all' ? 'Tất cả' : role === 'admin' ? 'Admin' : 'User'}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className={`flex gap-1 p-1 rounded-xl border ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border/50'}`}>
              {(['all', 'active', 'banned'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => { setUserStatusFilter(status); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${userStatusFilter === status
                    ? (status === 'banned' ? 'bg-destructive text-destructive-foreground shadow-sm' : 'bg-green-500 text-white shadow-sm')
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {status === 'all' ? 'All' : status === 'active' ? 'Active' : 'Banned'}
                </button>
              ))}
            </div>
          </div>

          <div className={`h-8 w-px ${isMidnight ? 'bg-white/5' : 'bg-border'}`}></div>

          <button
            onClick={refreshData}
            className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm border group ${isMidnight ? 'bg-slate-800 border-white/10 text-slate-400 hover:text-primary' : 'bg-card border-border text-muted-foreground hover:text-primary'}`}
            title="Refresh"
          >
            <i className="fa-solid fa-rotate-right group-hover:rotate-180 transition-transform duration-500"></i>
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`bg-card/40 backdrop-blur-md border-primary/20 shadow-xl flex items-center justify-between p-4 rounded-[2rem] border ${isMidnight ? 'bg-[#1e293b]/40' : ''}`}
          >
            <div className="flex items-center gap-4 ml-2">
              <span className="text-micro font-black text-primary uppercase tracking-premium">Đã chọn {selectedUsers.length} người dùng</span>
              <div className="h-4 w-px bg-border/60"></div>
              <button
                onClick={() => setSelectedUsers([])}
                className="text-micro font-bold uppercase tracking-premium transition-colors text-muted-foreground hover:text-primary"
              >
                Bỏ chọn
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDeleteUsers}
                disabled={isDeletingBulk}
                className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-white px-5 py-2.5 rounded-xl text-micro font-bold uppercase tracking-premium transition-all shadow-sm flex items-center gap-2"
              >
                <i className={isDeletingBulk ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash-can"}></i>
                <span>Xóa ({selectedUsers.length})</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`${isMidnight ? 'bg-[#1e293b] border-white/5' : 'bg-card backdrop-blur-xl border-border shadow-2xl'} rounded-[2.5rem] border overflow-hidden min-h-[500px]`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className={`border-b ${isMidnight ? 'bg-slate-900/50 border-white/5' : 'bg-muted/30 border-border'}`}>
                <th className="px-4 py-5 w-16 text-center">
                  <div
                    onClick={toggleSelectAllUsers}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${selectedUsers.length === filteredUsers.length && filteredUsers.length > 0
                      ? 'bg-primary border-primary text-primary-foreground text-xs'
                      : (isMidnight ? 'border-white/10 bg-slate-800' : 'border-border bg-card')
                      }`}
                  >
                    {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 && <i className="fa-solid fa-check"></i>}
                  </div>
                </th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide">Người dùng</th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide">Liên hệ</th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide text-center">Vai trò</th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide text-center">Trạng thái</th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide text-right">Thao tác</th>
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
                    className={`group transition-all ${selectedUsers.includes(user.id) ? (isMidnight ? 'bg-primary/10' : 'bg-primary/5') : (isMidnight ? 'hover:bg-slate-700/30' : 'hover:bg-muted/30')}`}
                  >
                    <td className="px-4 py-4 text-center">
                      <div
                        onClick={() => toggleSelectUser(user.id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${selectedUsers.includes(user.id)
                          ? 'bg-primary border-primary text-primary-foreground text-xs'
                          : (isMidnight ? 'border-white/10 bg-slate-800' : 'border-border bg-card') + ' group-hover:border-primary/50'
                          }`}
                      >
                        {selectedUsers.includes(user.id) && <i className="fa-solid fa-check"></i>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative group/avatar">
                          <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=7033ff&color=fff&bold=true`}
                            alt={user.name}
                            className="w-12 h-12 rounded-2xl object-cover shadow-md border-2 border-white/50 transition-transform group-hover/avatar:scale-105"
                            onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=7033ff&color=fff&bold=true`; }}
                          />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white transition-colors ${user.status === 'banned' ? 'bg-destructive' : 'bg-emerald-500 shadow-sm'}`}>
                            <i className={`fa-solid ${user.status === 'banned' ? 'fa-ban' : 'fa-check'}`}></i>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{user.name || 'User'}</h4>
                            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/50 bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">ID: {user.id.slice(0, 4)}</span>
                          </div>
                          <p className="text-xs font-medium text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        {user.phone && (
                          <div className="flex items-center gap-2.5 text-xs font-medium text-foreground bg-secondary/20 w-fit px-2 py-1 rounded-lg border border-border/30">
                            <i className="fa-solid fa-phone text-primary text-[10px]"></i>
                            {user.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground max-w-[200px] truncate">
                          <i className="fa-solid fa-location-dot text-muted-foreground/40 text-[10px]"></i>
                          {user.addresses?.find(a => a.isDefault)?.fullAddress || user.addresses?.[0]?.fullAddress || 'Chưa cập nhật địa chỉ'}
                        </div>
                        {(user.gender || user.birthday) && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                            {user.gender && <span>{user.gender === 'Nam' ? '♂️' : user.gender === 'Nữ' ? '♀️' : '⚧'} {user.gender}</span>}
                            {user.gender && user.birthday && <span className="opacity-30">|</span>}
                            {user.birthday && <span>🎂 {user.birthday}</span>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleUpdateUserRole(user.id, user.role || 'user')}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${user.role === 'admin'
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500 hover:text-white'
                          : (isMidnight ? 'bg-slate-700 text-slate-400 border border-white/5 hover:bg-primary/20 hover:text-primary' : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border/50')
                          }`}
                        title="Click to toggle role"
                      >
                        <i className={user.role === 'admin' ? "fa-solid fa-shield-halved" : "fa-solid fa-user"}></i>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${(user.status || 'active') === 'active'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20 shadow-sm'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${(user.status || 'active') === 'active' ? 'bg-emerald-500' : 'bg-destructive animate-pulse'}`}></span>
                          {(user.status || 'active') === 'active' ? 'Active' : 'Banned'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdateUserStatus(user.id, user.status || 'active')}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${(user.status || 'active') === 'active'
                            ? (isMidnight ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-destructive hover:text-white hover:border-destructive' : 'bg-secondary text-muted-foreground hover:bg-destructive hover:text-white')
                            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                            }`}
                          title={(user.status || 'active') === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                        >
                          <i className={`fa-solid ${(user.status || 'active') === 'active' ? 'fa-lock' : 'fa-lock-open'} text-xs`}></i>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${isMidnight
                            ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-destructive hover:text-destructive hover:bg-slate-700'
                            : 'bg-secondary text-muted-foreground hover:bg-destructive hover:text-white'
                            }`}
                          title="Xóa người dùng"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner ${isMidnight ? 'bg-slate-800 border-white/5' : 'bg-secondary/50 border-border/50'
                          }`}>
                          <i className="fa-solid fa-users-slash text-2xl text-muted-foreground/20"></i>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Không tìm thấy người dùng</p>
                          <p className="text-xs font-semibold text-muted-foreground/60">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                        </div>
                        <button
                          onClick={() => { setUserRoleFilter('all'); setUserStatusFilter('all'); setSearchQuery(''); }}
                          className="mt-2 text-primary font-black uppercase tracking-premium text-xs border-b-2 border-primary/20 hover:border-primary transition-all pb-1"
                        >
                          Xóa bộ lọc
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
    </div >
  );
};

export default AdminUsers;
