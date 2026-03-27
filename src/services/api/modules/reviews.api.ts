import { apiClient, handleApiError } from '../client';
import { ApiResponse } from '../types';
import { Review } from '@/shared/types';
import { cache } from '../../cache';

const REVIEWS_TAG = 'reviews';

export const reviewsApi = {
  /**
   * Get all reviews (admin)
   */
  async getAll(): Promise<Review[]> {
    try {
      const { data } = await cache.swr<Review[]>(
        `${REVIEWS_TAG}:all`,
        async () => {
          const response = await apiClient.get<ApiResponse<Review[]>>('/api/reviews');
          return response.data.data || [];
        },
        { persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching reviews:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get review by ID
   */
  async getById(reviewId: string): Promise<Review | null> {
    try {
      const { data } = await cache.swr<Review | null>(
        `${REVIEWS_TAG}:${reviewId}`,
        async () => {
          const response = await apiClient.get<ApiResponse<Review>>(`/api/reviews/${reviewId}`);
          return response.data.data || null;
        },
        { persist: true }
      );
      return data || null;
    } catch (error) {
      console.error('Error fetching review:', handleApiError(error));
      return null;
    }
  },

  /**
   * Get reviews by book ID
   */
  async getByBookId(bookId: string): Promise<Review[]> {
    try {
      const { data } = await cache.swr<Review[]>(
        `${REVIEWS_TAG}:book:${bookId}`,
        async () => {
          const response = await apiClient.get<ApiResponse<Review[]>>(`/api/reviews/book/${bookId}`);
          return response.data.data || [];
        },
        { persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching reviews by book:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get reviews by user ID
   */
  async getByUserId(userId: string): Promise<Review[]> {
    try {
      const { data } = await cache.swr<Review[]>(
        `${REVIEWS_TAG}:user:${userId}`,
        async () => {
          const response = await apiClient.get<ApiResponse<Review[]>>(`/api/reviews/user/${userId}`);
          return response.data.data || [];
        },
        { persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching reviews by user:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get average rating for a book
   */
  async getAverageRating(bookId: string): Promise<number> {
    try {
      const { data } = await cache.swr<number>(
        `${REVIEWS_TAG}:avg:${bookId}`,
        async () => {
          const response = await apiClient.get<ApiResponse<{ averageRating: number }>>(`/api/reviews/book/${bookId}/average-rating`);
          return response.data.data?.averageRating || 0;
        },
        { persist: true }
      );
      return data || 0;
    } catch (error) {
      console.error('Error fetching average rating:', handleApiError(error));
      return 0;
    }
  },

  /**
   * Create a new review
   */
  async create(review: Omit<Review, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      const { data } = await apiClient.post<ApiResponse<Review>>('/api/reviews', review);
      cache.clear(REVIEWS_TAG);
      return data.data?.id || null;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Update an existing review
   */
  async update(reviewId: string, updates: Partial<Review>): Promise<void> {
    try {
      await apiClient.put(`/api/reviews/${reviewId}`, updates);
      cache.clear(REVIEWS_TAG);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Delete a review
   */
  async delete(reviewId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/reviews/${reviewId}`);
      cache.clear(REVIEWS_TAG);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};
