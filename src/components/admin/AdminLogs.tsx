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
    <div className="space-y-6 animate-fadeIn text-foreground">
      <div className={`${
        isMidnight 
        ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5 shadow-2xl hover:border-primary/30' 
        : 'bg-card border-border shadow-sm shadow-slate-200/40 hover:border-primary/30'
        } flex flex-wrap items-center justify-between gap-6 p-6 rounded-[2rem] border transition-all`}>
        <div>
          <h3 className={`text-lg font-extrabold uppercase tracking-tight ${isMidnight ? 'text-white' : 'text-foreground'}`}>Nhật ký hoạt động</h3>
          <p className={`text-micro font-bold uppercase tracking-premium mt-1 ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>Lưu vết mọi thay đổi trong hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl text-micro font-extrabold uppercase tracking-widest ${
            isMidnight ? 'bg-white/5 text-slate-400 border border-white/5' : 'bg-secondary text-muted-foreground'
          }`}>
            {logs.length} Bản ghi
          </div>
          {hasMoreLogs && (
            <button 
              onClick={onLoadMore}
              disabled={isLoadingMoreLogs}
              className={`px-4 py-2 rounded-xl text-micro font-extrabold uppercase tracking-widest transition-all disabled:opacity-50 ${
                isMidnight 
                ? 'bg-primary/20 text-primary border border-primary/20 hover:bg-primary hover:text-white' 
                : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
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
        : 'bg-card border-border shadow-sm shadow-slate-200/20'
        } rounded-[2rem] border overflow-hidden min-h-[500px]`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className={`${isMidnight ? 'bg-white/5' : 'bg-secondary/50'}`}>
              <tr className={`border-b ${isMidnight ? 'border-white/5' : 'border-border'}`}>
                <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>Thời gian</th>
                <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>Người dùng</th>
                <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>Hành động & Loại</th>
                <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>Nội dung</th>
                <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest text-center ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>Cấp độ & Kết quả</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-border'}`}>
              {currentLogs.map(log => (
                <tr key={log.id} className={`group transition-all ${isMidnight ? 'hover:bg-white/5' : 'hover:bg-secondary/20'}`}>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className={`text-sm font-extrabold ${isMidnight ? 'text-white' : 'text-foreground'}`}>
                        {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleTimeString('vi-VN') : 'N/A'}
                      </span>
                      <span className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>
                        {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleDateString('vi-VN') : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMidnight ? 'bg-white/5 text-slate-500 border border-white/5' : 'bg-secondary text-muted-foreground/50'}`}>
                        <i className="fa-solid fa-user text-xs"></i>
                      </div>
                      <span className={`text-micro font-extrabold uppercase tracking-premium ${isMidnight ? 'text-primary' : 'text-primary'}`}>{log.user}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <span className={`text-xs font-black uppercase tracking-tight ${isMidnight ? 'text-slate-200' : 'text-foreground'}`}>{log.action}</span>
                      {log.category && (
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md w-fit ${
                          isMidnight ? 'bg-primary/10 text-primary border border-primary/10' : 'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          {log.category}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 max-w-md">
                    <p className={`text-xs font-semibold leading-relaxed ${isMidnight ? 'text-slate-400' : 'text-muted-foreground'}`}>{log.detail}</p>
                    {log.metadata && (
                       <pre className="text-[10px] mt-2 p-2 bg-black/10 rounded overflow-x-auto font-mono max-w-xs text-muted-foreground">
                          {typeof log.metadata === 'string' ? log.metadata : JSON.stringify(log.metadata, null, 2)}
                       </pre>
                    )}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {/* Level Badge */}
                      {log.level && (
                        <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          log.level === 'ERROR' ? 'bg-destructive text-white' :
                          log.level === 'WARN' ? 'bg-amber-500 text-white' :
                          log.level === 'DEBUG' ? 'bg-success text-white' :
                          'bg-slate-500 text-white'
                        }`}>
                          {log.level}
                        </span>
                      )}
                      
                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-lg text-micro font-black uppercase tracking-widest shadow-lg backdrop-blur-md flex items-center justify-center gap-1.5 w-fit mx-auto border ${
                        (log.status === 'SUCCESS' || (log.status as string) === 'success') 
                        ? (isMidnight 
                            ? 'bg-success/10 text-success border-success/20 shadow-success/10' 
                            : 'bg-gradient-to-r from-success/10 to-success/5 text-success border-success/20 shadow-success/10'
                          ) :
                        (log.status === 'ERROR' || (log.status as string) === 'error') 
                        ? (isMidnight 
                            ? 'bg-destructive/10 text-destructive border-destructive/20 shadow-destructive/10' 
                            : 'bg-gradient-to-r from-destructive/10 to-destructive/5 text-destructive border-destructive/20 shadow-destructive/10'
                          ) :
                        ((log.status as string) === 'warning' || (log.status as string) === 'WARNING') 
                        ? (isMidnight 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/10' 
                            : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-600 border-amber-100 shadow-amber-100'
                          ) :
                        (isMidnight 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/10' 
                            : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border-blue-100 shadow-blue-100'
                        )
                      }`}>
                        {(log.status === 'SUCCESS' || (log.status as string) === 'success') ? (
                            <>
                              <i className="fa-solid fa-circle-check text-[9px] opacity-70"></i> Thành công
                            </>
                         ) :
                         (log.status === 'ERROR' || (log.status as string) === 'error') ? (
                            <>
                              <i className="fa-solid fa-circle-xmark text-[9px] opacity-70"></i> Lỗi
                            </>
                         ) :
                         ((log.status as string) === 'warning' || (log.status as string) === 'WARNING') ? (
                            <>
                              <i className="fa-solid fa-triangle-exclamation text-[9px] opacity-70"></i> Cảnh báo
                            </>
                         ) : (
                            <>
                               <i className="fa-solid fa-circle-info text-[9px] opacity-70"></i> Thông tin
                            </>
                         )}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className={`p-8 border-t flex justify-center ${isMidnight ? 'border-white/5 bg-white/[0.02]' : 'border-border bg-secondary/30'}`}>
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

