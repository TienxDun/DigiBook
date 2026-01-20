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
  const logsPerPage = 15; // Phân trang ít hơn để gọn gàng

  const currentLogs = logs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  const getStatusConfig = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'SUCCESS') return { icon: 'fa-circle-check', color: 'text-success bg-success/10 border-success/20', label: 'Thành công' };
    if (s === 'ERROR') return { icon: 'fa-circle-xmark', color: 'text-destructive bg-destructive/10 border-destructive/20', label: 'Lỗi' };
    if (s === 'WARNING' || s === 'WARN') return { icon: 'fa-triangle-exclamation', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', label: 'Cảnh báo' };
    return { icon: 'fa-circle-info', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', label: 'Thông tin' };
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header gọn gàng hơn */}
      <div className={`${
        isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card border-border shadow-sm'
        } flex items-center justify-between p-5 rounded-3xl border transition-all`}>
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isMidnight ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div>
            <h3 className={`text-base font-bold ${isMidnight ? 'text-white' : 'text-foreground'}`}>Nhật ký hoạt động</h3>
            <p className={`text-xs ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>{logs.length} bản ghi hệ thống</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasMoreLogs && (
            <button 
              onClick={onLoadMore}
              disabled={isLoadingMoreLogs}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 ${
                isMidnight 
                ? 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10' 
                : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
              }`}
            >
              {isLoadingMoreLogs ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-cloud-arrow-down"></i>}
              Tải thêm
            </button>
          )}
        </div>
      </div>

      <div className={`${
        isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card border-border shadow-sm'
        } rounded-3xl border overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${isMidnight ? 'border-white/5 bg-white/[0.02]' : 'border-border bg-secondary/30'}`}>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Thời gian & Người dùng</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Hành động</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nội dung chi tiết</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-border'}`}>
              {currentLogs.map(log => {
                const status = getStatusConfig(log.status || 'INFO');
                return (
                  <tr key={log.id} className={`group transition-colors ${isMidnight ? 'hover:bg-white/5' : 'hover:bg-secondary/20'}`}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-sm font-semibold ${isMidnight ? 'text-slate-200' : 'text-slate-700'}`}>
                          {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : 'N/A'} - {log.user}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleDateString('vi-VN') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs font-bold uppercase tracking-wide ${isMidnight ? 'text-primary' : 'text-primary'}`}>{log.action}</span>
                        {log.category && (
                          <span className="text-[9px] font-medium text-muted-foreground italic px-0.5">
                            # {log.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-sm">
                      <p className={`text-xs line-clamp-1 group-hover:line-clamp-none transition-all ${isMidnight ? 'text-slate-400' : 'text-slate-600'}`}>
                        {log.detail}
                      </p>
                      {log.metadata && (
                        <div className="mt-1 hidden group-hover:block animate-fadeIn">
                          <pre className="text-[10px] p-2 bg-black/5 rounded font-mono text-muted-foreground overflow-x-auto">
                            {typeof log.metadata === 'string' ? log.metadata : JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.color}`}>
                          <i className={`fa-solid ${status.icon}`}></i>
                          {status.label}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className={`p-4 border-t flex justify-center ${isMidnight ? 'border-white/5 bg-white/[0.01]' : 'border-border bg-secondary/10'}`}>
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

