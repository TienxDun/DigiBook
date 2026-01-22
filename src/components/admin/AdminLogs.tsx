import React, { useState } from 'react';
import { SystemLog } from '../../types';
import Pagination from '../ui/Pagination';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'ERROR' | 'WARNING'>('ALL');
  const logsPerPage = 15;

  // Filter logs logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      (log.user?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (log.action?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (log.detail?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (log.category?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL'
      ? true
      : statusFilter === 'WARNING'
        ? (log.status === 'WARNING' || log.status === 'WARN')
        : log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const currentLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const getStatusConfig = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'SUCCESS') return { icon: 'fa-circle-check', color: 'text-success bg-success/10 border-success/20', label: 'Thành công' };
    if (s === 'ERROR') return { icon: 'fa-circle-xmark', color: 'text-destructive bg-destructive/10 border-destructive/20', label: 'Lỗi' };
    if (s === 'WARNING' || s === 'WARN') return { icon: 'fa-triangle-exclamation', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', label: 'Cảnh báo' };
    return { icon: 'fa-circle-info', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', label: 'Thông tin' };
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'audit_logs.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* New Header UI */}
      <div className={`
        ${isMidnight ? 'bg-slate-900/40 border-white/10' : 'bg-card/40 border-border'} 
        backdrop-blur-xl border shadow-xl shadow-slate-200/30 dark:shadow-none flex flex-wrap items-center justify-between gap-6 p-5 rounded-[2.5rem] transition-all hover:border-primary/20 sticky top-0 z-30
      `}>
        <div className="flex flex-wrap items-center gap-5 flex-1 min-w-[300px]">
          {/* Search */}
          <div className="relative group flex-1 max-w-md">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-muted text-muted-foreground group-focus-within:bg-primary group-focus-within:text-primary-foreground group-focus-within:shadow-lg group-focus-within:shadow-primary/20">
              <i className="fa-solid fa-magnifying-glass text-[10px]"></i>
            </div>
            <input
              placeholder="Tìm kiếm user, hành động, nội dung..."
              className={`w-full h-12 pl-16 pr-5 rounded-2xl text-xs font-bold outline-none border transition-all 
                ${isMidnight ? 'bg-slate-800/50 border-white/5 text-white focus:bg-slate-800' : 'bg-card border-border text-foreground'}
                focus:border-primary focus:ring-4 focus:ring-primary/5`}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="h-8 w-px hidden xl:block bg-border"></div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Lọc:</span>
            <div className={`flex gap-1.5 p-1.5 rounded-2xl border ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/80 border-border/50'}`}>
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${statusFilter === 'ALL'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusFilter('SUCCESS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${statusFilter === 'SUCCESS'
                    ? 'bg-success text-success-foreground shadow-lg shadow-success/20'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Thành công
              </button>
              <button
                onClick={() => setStatusFilter('ERROR')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${statusFilter === 'ERROR'
                    ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Lỗi
              </button>
              <button
                onClick={() => setStatusFilter('WARNING')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${statusFilter === 'WARNING'
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Cảnh báo
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className={`h-12 px-6 rounded-2xl font-bold transition-all flex items-center gap-2 group border shadow-sm hover:bg-muted hover:border-border ${isMidnight
                ? 'bg-slate-800/50 border-white/5 text-slate-300'
                : 'bg-card border-border text-foreground'
              }`}
          >
            <i className="fa-solid fa-file-export text-xs opacity-50 group-hover:opacity-100 group-hover:text-primary"></i>
            <span className="text-xs uppercase tracking-wider">Xuất</span>
          </button>

          {hasMoreLogs && (
            <button
              onClick={onLoadMore}
              disabled={isLoadingMoreLogs}
              className={`h-12 px-6 rounded-2xl font-bold transition-all shadow-sm border flex items-center gap-2 group hover:bg-chart-1/20 border-chart-1/20 ${isMidnight
                  ? 'bg-slate-800/50 text-chart-1'
                  : 'bg-chart-1/10 text-chart-1'
                }`}
            >
              {isLoadingMoreLogs ? <i className="fa-solid fa-spinner fa-spin text-xs"></i> : <i className="fa-solid fa-cloud-arrow-down text-xs"></i>}
              <span className="text-xs uppercase tracking-wider">Tải thêm</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card border-border shadow-sm'
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
              {currentLogs.length > 0 ? (
                currentLogs.map(log => {
                  const status = getStatusConfig(log.status || 'INFO');
                  return (
                    <tr key={log.id} className={`group transition-colors ${isMidnight ? 'hover:bg-white/5' : 'hover:bg-secondary/20'}`}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-sm font-semibold ${isMidnight ? 'text-slate-200' : 'text-slate-700'}`}>
                            {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'} - {log.user}
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
                            <pre className={`text-[10px] p-2 rounded font-mono text-muted-foreground overflow-x-auto ${isMidnight ? 'bg-black/20 border border-white/5' : 'bg-black/5'
                              }`}>
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
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <i className="fa-solid fa-magnifying-glass text-2xl opacity-20"></i>
                      <p>Không tìm thấy nhật ký nào phù hợp</p>
                    </div>
                  </td>
                </tr>
              )}
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

