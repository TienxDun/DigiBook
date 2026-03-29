import { apiClient, handleApiError } from '../client';
import { ApiResponse } from '../types';
import { Author } from '@/shared/types';
import { cache } from '../../cache';

const AUTHORS_CACHE_KEY = 'authors:all';
const AUTHOR_DETAIL_PREFIX = 'authors:id:';
const TTL_24H = 24 * 60 * 60 * 1000;

interface FetchAuthorsOptions {
  force?: boolean;
}

export const authorsApi = {
  /**
   * Get all authors
   */
  async getAll(options?: FetchAuthorsOptions): Promise<Author[]> {
    try {
      if (options?.force) {
        const response = await apiClient.get<ApiResponse<Author[]>>('/api/authors', {
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

        return response.data.data || [];
      }

      const { data } = await cache.swr<Author[]>(
        AUTHORS_CACHE_KEY,
        async () => {
          const response = await apiClient.get<ApiResponse<Author[]>>('/api/authors');
          return response.data.data || [];
        },
        { ttl: TTL_24H, persist: true, tags: ['authors'] }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching authors:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get author by ID
   */
  async getById(id: string): Promise<Author | null> {
    try {
      const { data } = await cache.swr<Author | null>(
        `${AUTHOR_DETAIL_PREFIX}${id}`,
        async () => {
          const response = await apiClient.get<ApiResponse<Author>>(`/api/authors/${id}`);
          return response.data.data || null;
        },
        { ttl: TTL_24H, persist: true, tags: ['authors'] }
      );
      return data || null;
    } catch (error) {
      console.error('Error fetching author:', handleApiError(error));
      return null;
    }
  },

  /**
   * Search authors by name
   */
  async searchByName(name: string): Promise<Author[]> {
    try {
      const { data } = await apiClient.get<ApiResponse<Author[]>>('/api/authors/search', {
        params: { name }
      });
      return data.data || [];
    } catch (error) {
      console.error('Error searching authors:', handleApiError(error));
      return [];
    }
  },

  /**
   * Create new author (admin)
   */
  async create(author: Omit<Author, 'id'>): Promise<string | null> {
    try {
      const { data } = await apiClient.post<ApiResponse<Author>>('/api/authors', author);
      cache.clear('authors');
      return data.data?.id || null;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Update author (admin)
   */
  async update(id: string, author: Partial<Author>): Promise<void> {
    try {
      await apiClient.put(`/api/authors/${id}`, author);
      cache.clear('authors');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Delete author (admin)
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/authors/${id}`);
      cache.clear('authors');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};
