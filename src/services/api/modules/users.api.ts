import { apiClient, handleApiError } from '../client';
import { ApiResponse } from '../types';
import { UserProfile, Address } from '@/shared/types';
import { cache } from '../../cache';

const TTL_5M = 5 * 60 * 1000;
const USERS_TAG = 'users';

export const usersApi = {
  // GET user profile
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data } = await cache.swr<UserProfile | null>(
        `users:profile:${userId}`,
        async () => {
          const response = await apiClient.get<ApiResponse<UserProfile>>(`/api/users/${userId}`);
          return response.data.data || null;
        },
        { ttl: TTL_5M, tags: [USERS_TAG], persist: true }
      );
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', handleApiError(error));
      return null;
    }
  },

  // UPDATE user profile
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await apiClient.put(`/api/users/${userId}`, updates);
      cache.clear(USERS_TAG);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        try {
          await apiClient.post('/api/users', { ...updates, id: userId });
          cache.clear(USERS_TAG);
          return;
        } catch (postError) {
          throw new Error(handleApiError(postError));
        }
      }
      throw new Error(handleApiError(error));
    }
  },

  async updateRole(userId: string, role: NonNullable<UserProfile['role']>): Promise<void> {
    try {
      await apiClient.put(`/api/users/${userId}/role`, { role });
      cache.clear(USERS_TAG);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async updateStatus(userId: string, status: NonNullable<UserProfile['status']>): Promise<void> {
    try {
      await apiClient.put(`/api/users/${userId}/status`, { status });
      cache.clear(USERS_TAG);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // UPDATE wishlist
  async updateWishlist(userId: string, wishlistIds: string[]): Promise<void> {
    try {
      await apiClient.put(`/api/users/${userId}/wishlist`, { wishlistIds });
      cache.clear(USERS_TAG);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // ADD address
  async addAddress(userId: string, address: Omit<Address, 'id'>): Promise<void> {
    try {
      await apiClient.post(`/api/users/${userId}/addresses`, address);
      cache.clear(USERS_TAG);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // UPDATE address
  async updateAddress(userId: string, addressId: string, address: Address): Promise<void> {
    try {
      await apiClient.put(`/api/users/${userId}/addresses/${addressId}`, address);
      cache.clear(USERS_TAG);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // DELETE address
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/users/${userId}/addresses/${addressId}`);
      cache.clear(USERS_TAG);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // SET default address
  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    try {
      await apiClient.put(`/api/users/${userId}/addresses/${addressId}/set-default`);
      cache.clear(USERS_TAG);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Add book to wishlist
   */
  async addToWishlist(userId: string, bookId: string): Promise<void> {
    try {
      await apiClient.post(`/api/users/${userId}/wishlist/${bookId}`);
      cache.clear(USERS_TAG);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Remove book from wishlist
   */
  async removeFromWishlist(userId: string, bookId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/users/${userId}/wishlist/${bookId}`);
      cache.clear(USERS_TAG);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Get wishlist book IDs
   */
  async getWishlist(userId: string): Promise<string[]> {
    try {
      const { data } = await cache.swr<string[]>(
        `users:wishlist:${userId}`,
        async () => {
          const response = await apiClient.get<ApiResponse<string[]>>(`/api/users/${userId}/wishlist`);
          return response.data.data || [];
        },
        { ttl: TTL_5M, tags: [USERS_TAG], persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching wishlist:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get all users (admin only)
   */
  async getAll(): Promise<UserProfile[]> {
    try {
      const { data } = await cache.swr<UserProfile[]>(
        'users:all',
        async () => {
          const response = await apiClient.get<ApiResponse<UserProfile[]>>('/api/users');
          return response.data.data || [];
        },
        { ttl: TTL_5M, tags: [USERS_TAG], persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching all users:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<UserProfile | null> {
    try {
      const { data } = await cache.swr<UserProfile | null>(
        `users:email:${email}`,
        async () => {
          const response = await apiClient.get<ApiResponse<UserProfile>>(`/api/users/email/${email}`);
          return response.data.data || null;
        },
        { ttl: TTL_5M, tags: [USERS_TAG], persist: true }
      );
      return data;
    } catch (error) {
      console.error('Error fetching user by email:', handleApiError(error));
      return null;
    }
  },

  /**
   * Get users by role
   */
  async getByRole(role: string): Promise<UserProfile[]> {
    try {
      const { data } = await cache.swr<UserProfile[]>(
        `users:role:${role}`,
        async () => {
          const response = await apiClient.get<ApiResponse<UserProfile[]>>(`/api/users/role/${role}`);
          return response.data.data || [];
        },
        { ttl: TTL_5M, tags: [USERS_TAG], persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching users by role:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get users by status
   */
  async getByStatus(status: string): Promise<UserProfile[]> {
    try {
      const { data } = await cache.swr<UserProfile[]>(
        `users:status:${status}`,
        async () => {
          const response = await apiClient.get<ApiResponse<UserProfile[]>>(`/api/users/status/${status}`);
          return response.data.data || [];
        },
        { ttl: TTL_5M, tags: [USERS_TAG], persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching users by status:', handleApiError(error));
      return [];
    }
  },

  /**
   * Create new user (admin)
   */
  async create(user: Omit<UserProfile, 'id'>): Promise<string | null> {
    try {
      const { data } = await apiClient.post<ApiResponse<UserProfile>>('/api/users', user);
      cache.clear(USERS_TAG);
      return data.data?.id || null;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Delete user (admin)
   */
  async delete(userId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/users/${userId}`);
      cache.clear(USERS_TAG);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};
