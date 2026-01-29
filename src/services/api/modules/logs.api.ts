import { apiClient, handleApiError } from '../client';
import { ApiResponse } from '../types';
import { SystemLog } from '@/shared/types';

interface LogStatistics {
  total: number;
  byStatus: Record<string, number>;
  byLevel: Record<string, number>;
  byCategory: Record<string, number>;
  recentErrors: number;
}

export const logsApi = {
  /**
   * Get all system logs (admin)
   */
  async getAll(): Promise<SystemLog[]> {
    try {
      const { data } = await apiClient.get<ApiResponse<SystemLog[]>>('/api/logs');
      return data.data || [];
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
      const { data } = await apiClient.get<ApiResponse<SystemLog[]>>(`/api/logs/status/${status}`);
      return data.data || [];
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
      const { data } = await apiClient.get<ApiResponse<SystemLog[]>>(`/api/logs/user/${user}`);
      return data.data || [];
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
      const { data } = await apiClient.get<ApiResponse<SystemLog[]>>(`/api/logs/action/${action}`);
      return data.data || [];
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
      const { data } = await apiClient.get<ApiResponse<LogStatistics>>('/api/logs/statistics');
      return data.data || null;
    } catch (error) {
      console.error('Error fetching log statistics:', handleApiError(error));
      return null;
    }
  },

  /**
   * Get recent logs with limit (admin)
   */
  async getRecent(limit: number = 50): Promise<SystemLog[]> {
    try {
      const { data } = await apiClient.get<ApiResponse<SystemLog[]>>('/api/logs/recent', {
        params: { limit }
      });
      return data.data || [];
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
      return data.data?.deletedCount || 0;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};
