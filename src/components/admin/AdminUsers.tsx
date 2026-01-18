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
}

const AdminUsers: React.FC<AdminUsersProps> = ({ users, refreshData }) => {
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      <div className="flex flex-wrap items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm shadow-slate-200/40 transition-all hover:border-slate-300">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-micro font-bold text-slate-400 uppercase tracking-premium">Vai trò:</span>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              {(['all', 'admin', 'user'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setUserRoleFilter(role)}
                  className={`px-4 py-1.5 rounded-lg text-micro font-bold uppercase tracking-premium transition-all ${
                    userRoleFilter === role 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {role === 'all' ? 'Tất cả' : role === 'admin' ? 'Quản trị' : 'Khách'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-micro font-bold text-slate-400 uppercase tracking-premium">Trạng thái:</span>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              {(['all', 'active', 'banned'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setUserStatusFilter(status)}
                  className={`px-4 py-1.5 rounded-lg text-micro font-bold uppercase tracking-premium transition-all ${
                    userStatusFilter === status 
                    ? (status === 'banned' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-slate-900 text-white shadow-lg shadow-slate-100')
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {status === 'all' ? 'Tất cả' : status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input 
              type="text"
              placeholder="Tìm theo tên, email, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-[11px] font-bold w-full focus:ring-4 ring-indigo-50 focus:bg-white transition-all outline-none"
            />
          </div>
          <button 
            onClick={refreshData}
            className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-100"
            title="Làm mới danh sách"
          >
            <i className="fa-solid fa-rotate"></i>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm shadow-slate-200/20 overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Người dùng</th>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Liên hệ</th>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Thông tin thêm</th>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium text-center">Vai trò</th>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium text-center">Trạng thái</th>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedUsers.length > 0 ? paginatedUsers.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <img 
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random&bold=true`} 
                      className="w-12 h-12 rounded-2xl object-cover shadow-sm border-2 border-white ring-1 ring-slate-200" 
                      alt={user.name} 
                    />
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{user.name || 'Hội viên DigiBook'}</p>
                      <p className="text-micro font-bold text-slate-400 uppercase tracking-premium">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-1.5">
                    <p className="text-micro font-bold text-slate-700 flex items-center gap-2">
                      <i className="fa-solid fa-phone text-indigo-400 text-[10px]"></i>
                      {user.phone || 'Chưa có SĐT'}
                    </p>
                    <p className="text-micro font-medium text-slate-400 flex items-start gap-2 max-w-[180px]">
                      <i className="fa-solid fa-location-dot text-slate-300 mt-0.5"></i>
                      <span className="leading-relaxed">{user.address || 'Địa chỉ trống'}</span>
                    </p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-micro font-bold uppercase tracking-premium ${
                        user.gender === 'Nữ' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {user.gender || 'N/A'}
                      </span>
                      <span className="text-micro font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {user.birthday || '--/--/----'}
                      </span>
                    </div>
                    {user.bio ? (
                      <p className="text-xs text-slate-400 italic font-medium line-clamp-1 max-w-[150px]" title={user.bio}>
                        "{user.bio}"
                      </p>
                    ) : (
                      <p className="text-xs text-slate-300 italic">Chưa có giới thiệu</p>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <button 
                    onClick={() => handleUpdateUserRole(user.id, user.role || 'user')}
                    className={`px-4 py-1.5 rounded-xl text-micro font-bold uppercase tracking-premium transition-all shadow-sm ${
                      user.role === 'admin' 
                      ? 'bg-indigo-600 text-white shadow-indigo-100 hover:scale-105' 
                      : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {user.role === 'admin' ? 'Quản trị' : 'Khách'}
                  </button>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-micro font-bold uppercase tracking-premium ${
                      user.status === 'banned' 
                      ? 'bg-rose-50 text-rose-600' 
                      : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'banned' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                      {user.status === 'banned' ? 'Đã khóa' : 'Hoạt động'}
                    </span>
                    <span className="text-micro font-medium text-slate-300 uppercase tracking-premium">
                      Cập nhật: {user.updatedAt?.toDate ? user.updatedAt.toDate().toLocaleDateString('vi-VN') : 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button 
                      onClick={() => handleUpdateUserStatus(user.id, user.status || 'active')}
                      title={user.status === 'banned' ? 'Mở khóa' : 'Khóa tài khoản'}
                      className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all shadow-sm ${
                        user.status === 'banned' 
                        ? 'bg-white border-emerald-100 text-emerald-500 hover:bg-emerald-500 hover:text-white hover:shadow-emerald-100' 
                        : 'bg-white border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white hover:shadow-rose-100'
                      }`}
                    >
                      <i className={`fa-solid ${user.status === 'banned' ? 'fa-unlock' : 'fa-user-slash'}`}></i>
                    </button>

                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      title="Xóa tài khoản vĩnh viễn"
                      className="w-10 h-10 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 hover:shadow-lg hover:shadow-rose-100 transition-all shadow-sm flex items-center justify-center"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                  <i className="fa-solid fa-users-slash text-4xl mb-4 opacity-20"></i>
                  <p className="text-micro font-bold uppercase tracking-premium">Không tìm thấy người dùng phù hợp</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/30">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
