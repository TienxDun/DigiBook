import { apiClient, handleApiError } from '../client';
import { ApiResponse } from '../types';
import { Review } from '@/shared/types';

export const reviewsApi = {
  /**
   * Get all reviews (admin)
   */
  async getAll(): Promise<Review[]> {
    try {
      const { data } = await apiClient.get<ApiResponse<Review[]>>('/api/reviews');
      return data.data || [];
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
      const { data } = await apiClient.get<ApiResponse<Review>>(`/api/reviews/${reviewId}`);
      return data.data || null;
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
      const { data } = await apiClient.get<ApiResponse<Review[]>>(`/api/reviews/book/${bookId}`);
      return data.data || [];
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
      const { data } = await apiClient.get<ApiResponse<Review[]>>(`/api/reviews/user/${userId}`);
      return data.data || [];
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
      const { data } = await apiClient.get<ApiResponse<{ averageRating: number }>>(`/api/reviews/book/${bookId}/average-rating`);
      return data.data?.averageRating || 0;
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
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};
