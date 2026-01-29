import { apiClient, handleApiError } from '../client';
import { ApiResponse } from '../types';
import { Book } from '@/shared/types';

export const booksApi = {
  // GET all books
  async getAll(): Promise<Book[]> {
    try {
      const { data } = await apiClient.get<ApiResponse<Book[]>>('/api/books');
      return data.data || [];
    } catch (error) {
      console.error('Error fetching books:', handleApiError(error));
      return [];
    }
  },

  // GET book by ID
  async getById(id: string): Promise<Book | null> {
    try {
      const { data } = await apiClient.get<ApiResponse<Book>>(`/api/books/${id}`);
      return data.data || null;
    } catch (error) {
      console.error('Error fetching book:', handleApiError(error));
      return null;
    }
  },

  // GET book by ISBN
  async getByIsbn(isbn: string): Promise<Book | null> {
    try {
      const { data } = await apiClient.get<ApiResponse<Book>>(`/api/books/isbn/${isbn}`);
      return data.data || null;
    } catch (error) {
      console.error('Error fetching book by ISBN:', handleApiError(error));
      return null;
    }
  },

  // GET book by slug
  async getBySlug(slug: string): Promise<Book | null> {
    try {
      const { data } = await apiClient.get<ApiResponse<Book>>(`/api/books/slug/${slug}`);
      return data.data || null;
    } catch (error) {
      console.error('Error fetching book by slug:', handleApiError(error));
      return null;
    }
  },

  // CREATE book (admin)
  async create(book: Omit<Book, 'id'>): Promise<string | null> {
    try {
      const { data } = await apiClient.post<ApiResponse<{ id: string }>>('/api/books', book);
      return data.data?.id || null;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // UPDATE book (admin)
  async update(id: string, book: Partial<Book>): Promise<void> {
    try {
      await apiClient.put(`/api/books/${id}`, book);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // DELETE book (admin)
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/books/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // SEARCH books by author
  async searchByAuthor(authorName: string): Promise<Book[]> {
    try {
      const { data } = await apiClient.get<ApiResponse<Book[]>>(`/api/books/author/${authorName}`);
      return data.data || [];
    } catch (error) {
      console.error('Error searching books by author:', handleApiError(error));
      return [];
    }
  },

  // INCREMENT view count
  async incrementViewCount(id: string): Promise<void> {
    try {
      await apiClient.post(`/api/books/${id}/increment-views`);
    } catch (error) {
      console.error('Error incrementing view count:', handleApiError(error));
    }
  }
};