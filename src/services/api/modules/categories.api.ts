import { apiClient, handleApiError } from '../client';
import { ApiResponse } from '../types';
import { CategoryInfo } from '@/shared/types';
import { cache } from '../../cache';

const CATEGORIES_CACHE_KEY = 'categories:all';
const CATEGORY_DETAIL_PREFIX = 'categories:detail:';
const TTL_24H = 24 * 60 * 60 * 1000;

export const categoriesApi = {
  /**
   * Get all categories
   */
  async getAll(): Promise<CategoryInfo[]> {
    try {
      const { data } = await cache.swr<CategoryInfo[]>(
        CATEGORIES_CACHE_KEY,
        async () => {
          const response = await apiClient.get<ApiResponse<CategoryInfo[]>>('/api/categories');
          return response.data.data || [];
        },
        { ttl: TTL_24H, persist: true, tags: ['categories'] }
      );
      return data || [];
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
      const { data } = await cache.swr<CategoryInfo | null>(
        `${CATEGORY_DETAIL_PREFIX}${name}`,
        async () => {
          const response = await apiClient.get<ApiResponse<CategoryInfo>>(`/api/categories/${name}`);
          return response.data.data || null;
        },
        { ttl: TTL_24H, persist: true, tags: ['categories'] }
      );
      return data || null;
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
      cache.clear('categories');
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
      cache.clear('categories');
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
      cache.clear('categories');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};
