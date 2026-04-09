import { apiClient } from '../client';

export const adminApi = {
  /**
   * Sync all users' membership data (TotalSpent and Tier)
   * This is a heavy operation that recalculates based on all order history.
   */
  syncAllUsersMembership: async () => {
    const response = await apiClient.post('/api/admin/membership/sync-all');
    return response.data;
  },
  getSummary: async () => {
    const response = await apiClient.get('/api/admin/summary');
    return response.data;
  },
};
