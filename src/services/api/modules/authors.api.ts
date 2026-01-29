import { apiClient, handleApiError } from '../client';
import { ApiResponse } from '../types';
import { Author } from '@/shared/types';

export const authorsApi = {
  /**
   * Get all authors
   */
  async getAll(): Promise<Author[]> {
    try {
      const { data } = await apiClient.get<ApiResponse<Author[]>>('/api/authors');
      return data.data || [];
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
      const { data } = await apiClient.get<ApiResponse<Author>>(`/api/authors/${id}`);
      return data.data || null;
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
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};
