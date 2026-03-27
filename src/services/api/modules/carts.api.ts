import { apiClient, handleApiError } from '../client';
import { ApiResponse } from '../types';

export const cartsApi = {
  async getCart(userId: string): Promise<any[]> {
    try {
      const { data } = await apiClient.get<ApiResponse<{ items: any[] }>>(`/api/carts/${userId}`);
      return data.data?.items || [];
    } catch (error) {
      console.error('Error fetching cart:', handleApiError(error));
      return [];
    }
  },

  async updateCart(userId: string, items: any[]): Promise<void> {
    try {
      await apiClient.put(`/api/carts/${userId}`, { items });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};
