import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';
import { SystemLog } from '../types';

export const useAdminLogs = (enabled: boolean, initialLimit: number, pageSize = 50) => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (limit = initialLimit) => {
    setIsLoading(true);
    setError(null);
    try {
      const nextLogs = await adminService.getRecentLogs(limit);
      setLogs(nextLogs);
      setHasMore(limit >= pageSize && nextLogs.length === limit);
      return nextLogs;
    } catch (err: any) {
      setError(err?.message || 'Không thể tải nhật ký hệ thống');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [initialLimit, pageSize]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextLogs = await adminService.getRecentLogs(logs.length + pageSize);
      setLogs(nextLogs);
      setHasMore(nextLogs.length >= logs.length + pageSize);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, logs.length, pageSize]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  return {
    logs,
    setLogs,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    refresh,
    loadMore,
  };
};
