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
    <div className="space-y-8 animate-fadeIn text-foreground">
      {/* Filters Bar */}
      <div className="bg-card/40 backdrop-blur-md border border-border shadow-3xl flex flex-wrap items-center justify-between gap-6 p-8 rounded-[2.5rem] transition-all hover:border-primary/20">
        <div className="flex items-center gap-8">
          <div className="space-y-3">
            <span className="text-micro font-black uppercase tracking-premium text-muted-foreground ml-1">Phân loại vai trò</span>
            <div className="flex gap-2 p-1.5 rounded-2xl bg-secondary/30 border border-border/50">
              {(['all', 'admin', 'user'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => { setUserRoleFilter(role); setCurrentPage(1); }}
                  className={`px-5 py-2.5 rounded-xl text-micro font-black uppercase tracking-premium transition-all ${
                    userRoleFilter === role 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {role === 'all' ? 'Tất cả' : role === 'admin' ? 'Quản trị' : 'Khách hàng'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-micro font-black uppercase tracking-premium text-muted-foreground ml-1">Trạng thái tài khoản</span>
            <div className="flex gap-2 p-1.5 rounded-2xl bg-secondary/30 border border-border/50">
              {(['all', 'active', 'banned'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => { setUserStatusFilter(status); setCurrentPage(1); }}
                  className={`px-5 py-2.5 rounded-xl text-micro font-black uppercase tracking-premium transition-all ${
                    userStatusFilter === status 
                    ? (status === 'banned' ? 'bg-destructive text-white shadow-lg shadow-destructive/20' : 'bg-green-500 text-white shadow-lg shadow-green-500/20')
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {status === 'all' ? 'Tất cả' : status === 'active' ? 'Đang chạy' : 'Bị khóa'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5 w-full sm:w-auto mt-2">
          <div className="relative group flex-1 sm:w-80">
            <i className="fa-solid fa-search absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors"></i>
            <input 
              type="text"
              placeholder="Họ tên, email hoặc SĐT..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-12 pr-6 py-4 rounded-[1.5rem] border border-border bg-secondary/30 text-foreground font-bold outline-none focus:border-primary focus:bg-card transition-all"
            />
          </div>
          <button 
            onClick={refreshData}
            className="w-14 h-14 flex items-center justify-center rounded-2xl bg-secondary text-muted-foreground hover:bg-primary hover:text-white transition-all shadow-sm group active:scale-95"
            title="Làm mới"
          >
            <i className="fa-solid fa-rotate-right group-hover:rotate-180 transition-transform duration-500"></i>
          </button>
        </div>
      </div>

      {/* Users List Card */}
      <div className="bg-card/40 backdrop-blur-md border border-border shadow-3xl rounded-[2.5rem] overflow-hidden min-h-[550px]">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="border-b border-border/50">
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium">Hội viên DigiBook</th>
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium">Thông tin liên hệ</th>
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium">Hồ sơ cá nhân</th>
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium text-center">Vai trò</th>
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium text-center">Trạng thái</th>
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              <AnimatePresence mode="popLayout">
                {paginatedUsers.length > 0 ? paginatedUsers.map((user, idx) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group transition-all duration-300 hover:bg-secondary/30"
                  >
                    <td className="p-8">
                      <div className="flex items-center gap-5">
                        <div className="relative group/avatar">
                          <img 
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=7033ff&color=fff&bold=true`} 
                            alt={user.name} 
                            className="w-14 h-14 rounded-2xl object-cover shadow-lg border-2 border-white transition-transform group-hover/avatar:scale-110"
                            onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=7033ff&color=fff&bold=true`; }}
                          />
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm transition-colors ${user.status === 'banned' ? 'bg-destructive' : 'bg-green-500 shadow-green-500/20'}`}></div>
                        </div>
                        <div>
                          <h4 className="font-extrabold text-base text-foreground mb-1 group-hover:text-primary transition-colors">{user.name || 'Khách hàng DigiBook'}</h4>
                          <p className="text-micro font-bold text-muted-foreground uppercase tracking-premium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5 text-sm font-black text-foreground">
                          <i className="fa-solid fa-phone-volume text-primary text-[10px]"></i>
                          {user.phone || 'N/A'}
                        </div>
                        <div className="flex items-start gap-2.5 text-xs font-semibold text-muted-foreground max-w-[200px]">
                          <i className="fa-solid fa-location-dot text-muted-foreground/40 mt-0.5"></i>
                          <span className="leading-relaxed line-clamp-2">{user.address || 'Chưa cập nhật địa chỉ'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                            user.gender === 'Nữ' 
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            {user.gender || 'Bí mật'}
                          </span>
                          <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest bg-secondary/50 px-3 py-1.5 rounded-xl border border-border/50">
                            {user.birthday || '--/--/----'}
                          </span>
                        </div>
                        <p className="text-xs italic font-medium text-muted-foreground line-clamp-1 max-w-[150px]" title={user.bio}>
                          {user.bio ? `"${user.bio}"` : 'Tài khoản chưa có tiểu sử.'}
                        </p>
                      </div>
                    </td>
                    <td className="p-8 text-center">
                      <button 
                        onClick={() => handleUpdateUserRole(user.id, user.role || 'user')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-micro font-black uppercase tracking-widest transition-all shadow-sm ${
                          user.role === 'admin' 
                          ? 'bg-amber-500 text-white shadow-amber-500/20'
                          : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border/50'
                        }`}
                      >
                        <i className={user.role === 'admin' ? "fa-solid fa-shield-halved" : "fa-solid fa-user-circle"}></i>
                        {user.role === 'admin' ? 'Quản trị' : 'Thành viên'}
                      </button>
                    </td>
                    <td className="p-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-micro font-black uppercase tracking-widest border transition-all ${
                          (user.status || 'active') === 'active'
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20 shadow-lg shadow-destructive/10'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${ (user.status || 'active') === 'active' ? 'bg-green-500' : 'bg-destructive animate-pulse'}`}></span>
                          {(user.status || 'active') === 'active' ? 'Đang mở' : 'Đã khóa'}
                        </span>
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter">
                          CN: {user.updatedAt?.toDate ? user.updatedAt.toDate().toLocaleDateString('vi-VN') : 'Mới'}
                        </span>
                      </div>
                    </td>
                    <td className="p-8 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                         <button 
                          onClick={() => handleUpdateUserStatus(user.id, user.status || 'active')}
                          className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all shadow-sm ${
                            (user.status || 'active') === 'active'
                            ? 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-white'
                            : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'
                          }`}
                          title={(user.status || 'active') === 'active' ? 'Khóa tài khoản ngay' : 'Mở khóa truy cập'}
                        >
                          <i className={`fa-solid ${(user.status || 'active') === 'active' ? 'fa-user-lock' : 'fa-user-check'} text-sm`}></i>
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-secondary text-muted-foreground hover:bg-destructive hover:text-white transition-all shadow-sm active:scale-90"
                          title="Xóa vĩnh viễn"
                        >
                          <i className="fa-solid fa-trash-can text-sm"></i>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-24 text-center">
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-24 h-24 rounded-[2rem] bg-secondary/50 flex items-center justify-center border border-border/50 shadow-inner">
                            <i className="fa-solid fa-users-slash text-4xl text-muted-foreground/20"></i>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Không tìm thấy hội viên</p>
                            <p className="text-xs font-semibold text-muted-foreground/60">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
                          </div>
                          <button 
                            onClick={() => { setUserRoleFilter('all'); setUserStatusFilter('all'); setSearchQuery(''); }}
                            className="mt-4 text-primary font-black uppercase tracking-premium text-micro border-b-2 border-primary/20 hover:border-primary transition-all pb-1"
                          >
                            Xóa bộ lọc tìm kiếm
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
          <div className="p-8 border-t border-border/50 bg-secondary/20">
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
