import { apiClient, handleApiError } from '../client';
import { ApiResponse } from '../types';
import { Book } from '@/shared/types';
import { cache } from '../../cache';

const TTL_5M = 5 * 60 * 1000;
const BOOKS_TAG = 'books';

interface FetchBooksOptions {
  force?: boolean;
}

export const booksApi = {
  // GET all books
  async getAll(options?: FetchBooksOptions): Promise<Book[]> {
    try {
      if (options?.force) {
        const res = await apiClient.get<ApiResponse<Book[]>>('/api/books', {
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

      const { data } = await cache.swr<Book[]>(
        'books:all',
        async () => {
          const res = await apiClient.get<ApiResponse<Book[]>>('/api/books');
          return res.data.data || [];
        },
        { ttl: TTL_5M, tags: [BOOKS_TAG], persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching books:', handleApiError(error));
      return [];
    }
  },

  // GET book by ID
  async getById(id: string): Promise<Book | null> {
    try {
      const { data } = await cache.swr<Book | null>(
        `books:id:${id}`,
        async () => {
          const res = await apiClient.get<ApiResponse<Book>>(`/api/books/${id}`, {
            // Silence 404 logs for existence checks
            ['_silentLog' as any]: true
          });
          return res.data.data || null;
        },
        { ttl: TTL_5M, tags: [BOOKS_TAG], persist: true }
      );
      return data || null;
    } catch (error) {
      // 404 is expected during existence checks in import flow
      return null;
    }
  },

  // GET book by ISBN
  async getByIsbn(isbn: string): Promise<Book | null> {
    try {
      const { data } = await cache.swr<Book | null>(
        `books:isbn:${isbn}`,
        async () => {
          const res = await apiClient.get<ApiResponse<Book>>(`/api/books/isbn/${isbn}`, {
            // Silence 404 logs for existence checks
            ['_silentLog' as any]: true
          });
          return res.data.data || null;
        },
        { ttl: TTL_5M, tags: [BOOKS_TAG], persist: true }
      );
      return data || null;
    } catch (error) {
      // 404 is expected during existence checks in import flow
      return null;
    }
  },

  // GET book by slug
  async getBySlug(slug: string): Promise<Book | null> {
    try {
      const { data } = await cache.swr<Book | null>(
        `books:slug:${slug}`,
        async () => {
          const res = await apiClient.get<ApiResponse<Book>>(`/api/books/slug/${slug}`);
          return res.data.data || null;
        },
        { ttl: TTL_5M, tags: [BOOKS_TAG], persist: true }
      );
      return data || null;
    } catch (error) {
      console.error('Error fetching book by slug:', handleApiError(error));
      return null;
    }
  },

  // CREATE book (admin)
  async create(book: Omit<Book, 'id'>): Promise<string | null> {
    try {
      const { data } = await apiClient.post<ApiResponse<{ id: string }>>('/api/books', book);
      cache.clear(BOOKS_TAG);
      return data.data?.id || null;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // UPDATE book (admin)
  async update(id: string, book: Partial<Book>): Promise<void> {
    try {
      await apiClient.put(`/api/books/${id}`, book);
      cache.clear(BOOKS_TAG);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // DELETE book (admin)
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/books/${id}`);
      cache.clear(BOOKS_TAG);
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
  },

  /**
   * Get books by category
   */
  async getByCategory(category: string): Promise<Book[]> {
    try {
      const { data } = await cache.swr<Book[]>(
        `books:category:${category}`,
        async () => {
          const res = await apiClient.get<ApiResponse<Book[]>>(`/api/books/category/${category}`);
          return res.data.data || [];
        },
        { ttl: TTL_5M, tags: [BOOKS_TAG], persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching books by category:', handleApiError(error));
      return [];
    }
  },

  /**
   * Search books by title
   */
  async searchByTitle(title: string): Promise<Book[]> {
    try {
      const { data } = await apiClient.get<ApiResponse<Book[]>>('/api/books/search', {
        params: { title }
      });
      return data.data || [];
    } catch (error) {
      console.error('Error searching books by title:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get top rated books
   */
  async getTopRated(count: number = 10): Promise<Book[]> {
    try {
      const { data } = await cache.swr<Book[]>(
        `books:top-rated:${count}`,
        async () => {
          const res = await apiClient.get<ApiResponse<Book[]>>('/api/books/top-rated', {
            params: { count }
          });
          return res.data.data || [];
        },
        { ttl: TTL_5M, tags: [BOOKS_TAG], persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching top rated books:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get multiple books by IDs (for wishlist display)
   */
  async getBooksByIds(bookIds: string[]): Promise<Book[]> {
    try {
      const { data } = await apiClient.post<ApiResponse<Book[]>>('/api/books/by-ids', {
        bookIds
      });
      return data.data || [];
    } catch (error) {
      console.error('Error fetching books by IDs:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get related books
   */
  async getRelated(category: string, currentBookId: string, author?: string, limit: number = 4): Promise<Book[]> {
    try {
      const { data } = await cache.swr<Book[]>(
        `books:related:${category}:${currentBookId}:${author ?? 'none'}:${limit}`,
        async () => {
          const res = await apiClient.get<ApiResponse<Book[]>>('/api/books/related', {
            params: { category, currentBookId, author, limit }
          });
          return res.data.data || [];
        },
        { ttl: TTL_5M, tags: [BOOKS_TAG], persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching related books:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get paginated books (server-side slice)
   */
  async getPaginated(limit: number, offset: number, category?: string, sortBy?: string): Promise<Book[]> {
    try {
      const { data } = await cache.swr<Book[]>(
        `books:paginated:${limit}:${offset}:${category ?? 'all'}:${sortBy ?? 'newest'}`,
        async () => {
          const res = await apiClient.get<ApiResponse<Book[]>>('/api/books/paginated', {
            params: { limit, offset, category, sortBy }
          });
          return res.data.data || [];
        },
        { ttl: TTL_5M, tags: [BOOKS_TAG], persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching paginated books:', handleApiError(error));
      return [];
    }
  }
};
