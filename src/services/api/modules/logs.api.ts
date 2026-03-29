import { apiClient, handleApiError } from '../client';
import { ApiResponse } from '../types';
import { SystemLog } from '@/shared/types';
import { cache } from '../../cache';

const TTL_5M = 5 * 60 * 1000;
const LOGS_TAG = 'logs';

interface FetchLogsOptions {
  force?: boolean;
}

interface LogStatistics {
  total: number;
  byStatus: Record<string, number>;
  byLevel: Record<string, number>;
  byCategory: Record<string, number>;
  recentErrors: number;
}

export const logsApi = {
  /**
   * Create a new log
   */
  async create(log: Omit<SystemLog, 'id' | 'createdAt'>): Promise<void> {
    try {
      await apiClient.post('/api/logs', log);
    } catch (error) {
      console.warn('Failed to send log to API', error);
    }
  },

  /**
   * Get all system logs (admin)
   */
  async getAll(options?: FetchLogsOptions): Promise<SystemLog[]> {
    try {
      if (options?.force) {
        const res = await apiClient.get<ApiResponse<SystemLog[]>>('/api/logs', {
          params: {
            force: true,
            _ts: Date.now(),
          },
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        });

        return res.data.data || [];
      }

      const { data } = await cache.swr<SystemLog[]>(
        'logs:all',
        async () => {
          const res = await apiClient.get<ApiResponse<SystemLog[]>>('/api/logs');
          return res.data.data || [];
        },
        { ttl: TTL_5M, tags: [LOGS_TAG], persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching logs:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get logs by status (SUCCESS, ERROR, WARNING, INFO)
   */
  async getByStatus(status: string): Promise<SystemLog[]> {
    try {
      const { data } = await cache.swr<SystemLog[]>(
        `logs:status:${status}`,
        async () => {
          const res = await apiClient.get<ApiResponse<SystemLog[]>>(`/api/logs/status/${status}`);
          return res.data.data || [];
        },
        { ttl: TTL_5M, tags: [LOGS_TAG], persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching logs by status:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get logs by user
   */
  async getByUser(user: string): Promise<SystemLog[]> {
    try {
      const { data } = await cache.swr<SystemLog[]>(
        `logs:user:${user}`,
        async () => {
          const res = await apiClient.get<ApiResponse<SystemLog[]>>(`/api/logs/user/${user}`);
          return res.data.data || [];
        },
        { ttl: TTL_5M, tags: [LOGS_TAG], persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching logs by user:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get logs by action
   */
  async getByAction(action: string): Promise<SystemLog[]> {
    try {
      const { data } = await cache.swr<SystemLog[]>(
        `logs:action:${action}`,
        async () => {
          const res = await apiClient.get<ApiResponse<SystemLog[]>>(`/api/logs/action/${action}`);
          return res.data.data || [];
        },
        { ttl: TTL_5M, tags: [LOGS_TAG], persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching logs by action:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get log statistics
   */
  async getStatistics(): Promise<LogStatistics | null> {
    try {
      const { data } = await cache.swr<LogStatistics | null>(
        'logs:statistics',
        async () => {
          const res = await apiClient.get<ApiResponse<LogStatistics>>('/api/logs/statistics');
          return res.data.data || null;
        },
        { ttl: TTL_5M, tags: [LOGS_TAG], persist: true }
      );
      return data || null;
    } catch (error) {
      console.error('Error fetching log statistics:', handleApiError(error));
      return null;
    }
  },

  /**
   * Get recent logs with limit (admin)
   */
  async getRecent(limit: number = 50, options?: FetchLogsOptions): Promise<SystemLog[]> {
    try {
      if (options?.force) {
        const res = await apiClient.get<ApiResponse<SystemLog[]>>('/api/logs/recent', {
          params: {
            limit,
            force: true,
            _ts: Date.now(),
          },
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        });

        return res.data.data || [];
      }

      const { data } = await cache.swr<SystemLog[]>(
        `logs:recent:${limit}`,
        async () => {
          const res = await apiClient.get<ApiResponse<SystemLog[]>>('/api/logs/recent', {
            params: { limit }
          });
          return res.data.data || [];
        },
        { ttl: TTL_5M, tags: [LOGS_TAG], persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching recent logs:', handleApiError(error));
      return [];
    }
  },

  /**
   * Delete logs older than specified date (admin)
   */
  async deleteOld(beforeDate: string): Promise<number> {
    try {
      const { data } = await apiClient.delete<ApiResponse<{ deletedCount: number }>>(
        '/api/logs/cleanup',
        { params: { beforeDate } }
      );
      cache.clear(LOGS_TAG);
      return data.data?.deletedCount || 0;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};
