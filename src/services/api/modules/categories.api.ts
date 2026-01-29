import { apiClient, handleApiError } from '../client';
import { ApiResponse } from '../types';
import { CategoryInfo } from '@/shared/types';

export const categoriesApi = {
  /**
   * Get all categories
   */
  async getAll(): Promise<CategoryInfo[]> {
    try {
      const { data } = await apiClient.get<ApiResponse<CategoryInfo[]>>('/api/categories');
      return data.data || [];
    } catch (error) {
      console.error('Error fetching categories:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get category by name (Document ID)
   */
  async getByName(name: string): Promise<CategoryInfo | null> {
    try {
      const { data } = await apiClient.get<ApiResponse<CategoryInfo>>(`/api/categories/${name}`);
      return data.data || null;
    } catch (error) {
      console.error('Error fetching category:', handleApiError(error));
      return null;
    }
  },

  /**
   * Create new category (admin)
   */
  async create(category: CategoryInfo): Promise<CategoryInfo | null> {
    try {
      const { data } = await apiClient.post<ApiResponse<CategoryInfo>>('/api/categories', category);
      return data.data || null;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Update category (admin)
   */
  async update(name: string, category: Partial<CategoryInfo>): Promise<void> {
    try {
      await apiClient.put(`/api/categories/${name}`, category);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Delete category (admin)
   */
  async delete(name: string): Promise<void> {
    try {
      await apiClient.delete(`/api/categories/${name}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};
