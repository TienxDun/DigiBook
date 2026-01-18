import React, { useState } from 'react';
import { db } from '../../services/db';
import Pagination from '../Pagination';

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
    <div className="space-y-6 animate-fadeIn">
      {/* User Filters Bar */}
      <div className={`${
        isMidnight 
        ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5 shadow-2xl hover:border-indigo-500/30' 
        : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/40 hover:border-slate-300'
        } flex flex-wrap items-center justify-between gap-6 p-6 rounded-[2rem] border transition-all`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Vai trò:</span>
            <div className={`flex gap-2 p-1 rounded-xl ${isMidnight ? 'bg-white/5' : 'bg-slate-100'}`}>
              {(['all', 'admin', 'user'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => { setUserRoleFilter(role); setCurrentPage(1); }}
                  className={`px-4 py-1.5 rounded-lg text-micro font-bold uppercase tracking-premium transition-all ${
                    userRoleFilter === role 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : `${isMidnight ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`
                  }`}
                >
                  {role === 'all' ? 'Tất cả' : role === 'admin' ? 'Quản trị' : 'Khách'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Trạng thái:</span>
            <div className={`flex gap-2 p-1 rounded-xl ${isMidnight ? 'bg-white/5' : 'bg-slate-100'}`}>
              {(['all', 'active', 'banned'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => { setUserStatusFilter(status); setCurrentPage(1); }}
                  className={`px-4 py-1.5 rounded-lg text-micro font-bold uppercase tracking-premium transition-all ${
                    userStatusFilter === status 
                    ? (status === 'banned' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-100')
                    : `${isMidnight ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`
                  }`}
                >
                  {status === 'all' ? 'Tất cả' : status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 group">
            <i className={`fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isMidnight ? 'text-slate-600 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-600'} text-xs`}></i>
            <input 
              type="text"
              placeholder="Tìm theo tên, email, SĐT..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className={`pl-10 pr-4 py-2.5 rounded-2xl text-[11px] font-bold w-full outline-none transition-all ${
                isMidnight 
                ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500 focus:bg-white/10' 
                : 'bg-slate-50 border-none focus:ring-4 ring-indigo-50 focus:bg-white'
              }`}
            />
          </div>
          <button 
            onClick={refreshData}
            className={`w-10 h-10 rounded-xl transition-all border ${
              isMidnight 
              ? 'bg-white/5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 border-white/5' 
              : 'bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border-slate-100'
            }`}
            title="Làm mới danh sách"
          >
            <i className="fa-solid fa-rotate"></i>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className={`${
        isMidnight 
        ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5 shadow-2xl' 
        : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/20'
        } rounded-[2rem] border overflow-hidden min-h-[500px]`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className={`${isMidnight ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'} border-b`}>
                <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Người dùng</th>
                <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Liên hệ</th>
                <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Thông tin thêm</th>
                <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest text-center ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Vai trò</th>
                <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest text-center ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Trạng thái</th>
                <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest text-right ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Thao tác</th>
              </tr>
            </thead>
          <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-slate-50'}`}>
            {paginatedUsers.length > 0 ? paginatedUsers.map(user => (
              <tr key={user.id} className={`group transition-all ${isMidnight ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'}`}>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random&bold=true`} 
                        alt={user.name} 
                        className={`w-12 h-12 rounded-2xl object-cover shadow-sm group-hover:scale-110 transition-transform ${isMidnight ? 'border-white/10' : 'border-white'} border-2 ring-1 ${isMidnight ? 'ring-white/5' : 'ring-slate-200'}`}
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${isMidnight ? 'border-[#1e1e2d]' : 'border-white'} ${user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm mb-0.5 ${isMidnight ? 'text-white' : 'text-slate-900'}`}>{user.name || 'Hội viên DigiBook'}</h4>
                      <p className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-1.5">
                    <p className={`text-micro font-bold flex items-center gap-2 ${isMidnight ? 'text-slate-300' : 'text-slate-700'}`}>
                      <i className="fa-solid fa-phone text-indigo-400 text-[10px]"></i>
                      {user.phone || 'Chưa có SĐT'}
                    </p>
                    <p className={`text-micro font-medium flex items-start gap-2 max-w-[180px] ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>
                      <i className="fa-solid fa-location-dot text-slate-300 mt-0.5"></i>
                      <span className="leading-relaxed">{user.address || 'Địa chỉ trống'}</span>
                    </p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-micro font-bold uppercase tracking-premium ${
                        user.gender === 'Nữ' 
                        ? (isMidnight ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600')
                        : (isMidnight ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600')
                      }`}>
                        {user.gender || 'N/A'}
                      </span>
                      <span className={`text-micro font-bold px-2 py-0.5 rounded-lg ${
                        isMidnight ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {user.birthday || '--/--/----'}
                      </span>
                    </div>
                    {user.bio ? (
                      <p className={`text-xs italic font-medium line-clamp-1 max-w-[150px] ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`} title={user.bio}>
                        "{user.bio}"
                      </p>
                    ) : (
                      <p className={`text-xs italic ${isMidnight ? 'text-slate-700' : 'text-slate-300'}`}>Chưa có giới thiệu</p>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <button 
                    onClick={() => handleUpdateUserRole(user.id, user.role || 'user')}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-micro font-extrabold uppercase tracking-widest transition-all ${
                      user.role === 'admin' 
                      ? (isMidnight ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-amber-50 text-amber-600')
                      : (isMidnight ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:text-white' : 'bg-slate-100 text-slate-500')
                    }`}
                  >
                    <i className={user.role === 'admin' ? "fa-solid fa-shield-halved text-[10px]" : "fa-solid fa-user text-[10px]"}></i>
                    {user.role === 'admin' ? 'Quản trị' : 'Khách'}
                  </button>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-micro font-extrabold uppercase tracking-widest shadow-sm ${
                      (user.status || 'active') === 'active'
                      ? (isMidnight ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600')
                      : (isMidnight ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-600')
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ (user.status || 'active') === 'active' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
                      {(user.status || 'active') === 'active' ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isMidnight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {user.updatedAt?.toDate ? user.updatedAt.toDate().toLocaleDateString('vi-VN') : ''}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all transform sm:translate-x-2 sm:group-hover:translate-x-0">
                     <button 
                      onClick={() => handleUpdateUserStatus(user.id, user.status || 'active')}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                        (user.status || 'active') === 'active'
                        ? (isMidnight ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-100')
                        : (isMidnight ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100')
                      }`}
                      title={(user.status || 'active') === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                    >
                      <i className={`fa-solid ${(user.status || 'active') === 'active' ? 'fa-user-lock' : 'fa-user-check'} text-xs`}></i>
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                        isMidnight ? 'bg-white/5 text-slate-500 hover:bg-rose-600 hover:text-white' : 'bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white'
                      }`}
                      title="Xóa vĩnh viễn"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isMidnight ? 'bg-white/5 text-slate-700' : 'bg-slate-50 text-slate-200'}`}>
                        <i className="fa-solid fa-users-slash text-3xl opacity-20"></i>
                      </div>
                      <p className={`text-sm font-bold ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Không tìm thấy người dùng nào phù hợp</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Integration */}
        {filteredUsers.length > itemsPerPage && (
          <div className={`px-8 py-6 border-t ${isMidnight ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/30'}`}>
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
