import React, { useState } from 'react';
import { SystemLog } from '../../types';
import Pagination from '../Pagination';

interface AdminLogsProps {
  logs: SystemLog[];
  hasMoreLogs: boolean;
  onLoadMore: () => void;
  isLoadingMoreLogs: boolean;
  theme?: 'light' | 'midnight';
}

const AdminLogs: React.FC<AdminLogsProps> = ({ logs, hasMoreLogs, onLoadMore, isLoadingMoreLogs, theme = 'light' }) => {
  const isMidnight = theme === 'midnight';
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  const currentLogs = logs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className={`${
        isMidnight 
        ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5 shadow-2xl hover:border-indigo-500/30' 
        : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/40 hover:border-slate-300'
        } flex flex-wrap items-center justify-between gap-6 p-6 rounded-[2rem] border transition-all`}>
        <div>
          <h3 className={`text-lg font-extrabold uppercase tracking-tight ${isMidnight ? 'text-white' : 'text-slate-900'}`}>Nhật ký hoạt động</h3>
          <p className={`text-micro font-bold uppercase tracking-premium mt-1 ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Lưu vết mọi thay đổi trong hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl text-micro font-extrabold uppercase tracking-widest ${
            isMidnight ? 'bg-white/5 text-slate-400 border border-white/5' : 'bg-slate-100 text-slate-500'
          }`}>
            {logs.length} Bản ghi
          </div>
          {hasMoreLogs && (
            <button 
              onClick={onLoadMore}
              disabled={isLoadingMoreLogs}
              className={`px-4 py-2 rounded-xl text-micro font-extrabold uppercase tracking-widest transition-all disabled:opacity-50 ${
                isMidnight 
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white' 
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
              }`}
            >
              {isLoadingMoreLogs ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-download mr-2"></i>}
              Tải thêm
            </button>
          )}
        </div>
      </div>

      <div className={`${
        isMidnight 
        ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5 shadow-2xl' 
        : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/20'
        } rounded-[2rem] border overflow-hidden min-h-[500px]`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className={`${isMidnight ? 'bg-white/5 border-white/5' : 'bg-slate-50'} border-b`}>
                <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Thời gian</th>
                <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Người dùng</th>
                <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Hành động</th>
                <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Nội dung</th>
                <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest text-center ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Kết quả</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-slate-50'}`}>
              {currentLogs.map(log => (
                <tr key={log.id} className={`group transition-all ${isMidnight ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'}`}>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className={`text-sm font-extrabold ${isMidnight ? 'text-white' : 'text-slate-900'}`}>
                        {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleTimeString('vi-VN') : 'N/A'}
                      </span>
                      <span className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleDateString('vi-VN') : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMidnight ? 'bg-white/5 text-slate-500 border border-white/5' : 'bg-slate-100 text-slate-400'}`}>
                        <i className="fa-solid fa-user text-[10px]"></i>
                      </div>
                      <span className={`text-micro font-extrabold uppercase tracking-premium ${isMidnight ? 'text-indigo-400' : 'text-slate-700'}`}>{log.user}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-xs font-black uppercase tracking-tight ${isMidnight ? 'text-slate-200' : 'text-slate-900'}`}>{log.action}</span>
                  </td>
                  <td className="px-8 py-6 max-w-md">
                    <p className={`text-xs font-semibold leading-relaxed ${isMidnight ? 'text-slate-400' : 'text-slate-500'}`}>{log.detail}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-3 py-1.5 rounded-lg text-micro font-extrabold uppercase tracking-widest shadow-sm ${
                      (log.status === 'SUCCESS' || (log.status as string) === 'success') 
                      ? (isMidnight ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600') :
                      (log.status === 'ERROR' || (log.status as string) === 'error') 
                      ? (isMidnight ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-600') :
                      ((log.status as string) === 'warning' || (log.status as string) === 'WARNING') 
                      ? (isMidnight ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-amber-50 text-amber-600') :
                      (isMidnight ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600')
                    }`}>
                      {(log.status === 'SUCCESS' || (log.status as string) === 'success') ? 'Thành công' :
                       (log.status === 'ERROR' || (log.status as string) === 'error') ? 'Lỗi hệ thống' :
                       ((log.status as string) === 'warning' || (log.status as string) === 'WARNING') ? 'Cảnh báo' : 'Thông tin'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className={`p-8 border-t flex justify-center ${isMidnight ? 'border-white/5 bg-white/[0.02]' : 'border-slate-50 bg-slate-50/30'}`}>
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              theme={theme}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
