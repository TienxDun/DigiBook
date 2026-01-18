import React, { useState } from 'react';
import { SystemLog } from '../../types';
import Pagination from '../Pagination';

interface AdminLogsProps {
  logs: SystemLog[];
  hasMoreLogs: boolean;
  onLoadMore: () => void;
  isLoadingMoreLogs: boolean;
}

const AdminLogs: React.FC<AdminLogsProps> = ({ logs, hasMoreLogs, onLoadMore, isLoadingMoreLogs }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  const currentLogs = logs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm shadow-slate-200/40 transition-all hover:border-slate-300">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Nhật ký hoạt động</h3>
          <p className="text-micro font-bold text-slate-400 uppercase tracking-premium mt-1">Lưu vết mọi thay đổi trong hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-micro font-bold uppercase tracking-premium">
            {logs.length} Bản ghi
          </div>
          {hasMoreLogs && (
            <button 
              onClick={onLoadMore}
              disabled={isLoadingMoreLogs}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-micro font-bold uppercase tracking-premium hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
            >
              {isLoadingMoreLogs ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-download mr-2"></i>}
              Tải thêm
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm shadow-slate-200/20 overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Thời gian</th>
                <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Người dùng</th>
                <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Hành động</th>
                <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Nội dung</th>
                <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium text-center">Kết quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-extrabold text-slate-900">
                        {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleTimeString('vi-VN') : 'N/A'}
                      </span>
                      <span className="text-micro font-bold text-slate-400 uppercase tracking-premium">
                        {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleDateString('vi-VN') : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <i className="fa-solid fa-user text-[10px]"></i>
                      </div>
                      <span className="text-micro font-bold text-slate-700 uppercase tracking-premium">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-tight">{log.action}</span>
                  </td>
                  <td className="px-8 py-6 max-w-md">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{log.detail}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-3 py-1 rounded-lg text-micro font-bold uppercase tracking-premium ${
                      (log.status === 'SUCCESS' || (log.status as string) === 'success') ? 'bg-emerald-50 text-emerald-600' :
                      (log.status === 'ERROR' || (log.status as string) === 'error') ? 'bg-rose-50 text-rose-600' :
                      ((log.status as string) === 'warning' || (log.status as string) === 'WARNING') ? 'bg-amber-50 text-amber-600' :
                      'bg-blue-50 text-blue-600'
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
          <div className="p-8 border-t border-slate-50 flex justify-center">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
