import { apiClient, handleApiError } from '../client';
import { ApiResponse } from '../types';
import { UserProfile, Address } from '@/shared/types';

export const usersApi = {
  // GET user profile
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data } = await apiClient.get<ApiResponse<UserProfile>>(`/api/users/${userId}`);
      return data.data || null;
    } catch (error) {
      console.error('Error fetching user profile:', handleApiError(error));
      return null;
    }
  },

  // UPDATE user profile
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await apiClient.put(`/api/users/${userId}`, updates);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // UPDATE wishlist
  async updateWishlist(userId: string, wishlistIds: string[]): Promise<void> {
    try {
      await apiClient.put(`/api/users/${userId}/wishlist`, { wishlistIds });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // ADD address
  async addAddress(userId: string, address: Omit<Address, 'id'>): Promise<void> {
    try {
      await apiClient.post(`/api/users/${userId}/addresses`, address);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // UPDATE address
  async updateAddress(userId: string, addressId: string, address: Address): Promise<void> {
    try {
      await apiClient.put(`/api/users/${userId}/addresses/${addressId}`, address);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // DELETE address
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/users/${userId}/addresses/${addressId}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // SET default address
  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    try {
      await apiClient.put(`/api/users/${userId}/addresses/${addressId}/set-default`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // ===== Phase 1: New Wishlist Methods (RESTful) =====

  /**
   * Add book to wishlist (RESTful individual operation)
   * Note: Also keep updateWishlist() for bulk operations
   */
  async addToWishlist(userId: string, bookId: string): Promise<void> {
    try {
      await apiClient.post(`/api/users/${userId}/wishlist/${bookId}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Remove book from wishlist (RESTful individual operation)
   */
  async removeFromWishlist(userId: string, bookId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/users/${userId}/wishlist/${bookId}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Get wishlist book IDs
   */
  async getWishlist(userId: string): Promise<string[]> {
    try {
      const { data } = await apiClient.get<ApiResponse<string[]>>(`/api/users/${userId}/wishlist`);
      return data.data || [];
    } catch (error) {
      console.error('Error fetching wishlist:', handleApiError(error));
      return [];
    }
  },

  // ===== Phase 2: Admin User Management Methods =====

  /**
   * Get all users (admin only)
   */
  async getAll(): Promise<UserProfile[]> {
    try {
      const { data } = await apiClient.get<ApiResponse<UserProfile[]>>('/api/users');
      return data.data || [];
    } catch (error) {
      console.error('Error fetching all users:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get user by email (admin search)
   */
  async getByEmail(email: string): Promise<UserProfile | null> {
    try {
      const { data } = await apiClient.get<ApiResponse<UserProfile>>(`/api/users/email/${email}`);
      return data.data || null;
    } catch (error) {
      console.error('Error fetching user by email:', handleApiError(error));
      return null;
    }
  },

  /**
   * Get users by role (filter by admin/user)
   */
  async getByRole(role: string): Promise<UserProfile[]> {
    try {
      const { data } = await apiClient.get<ApiResponse<UserProfile[]>>(`/api/users/role/${role}`);
      return data.data || [];
    } catch (error) {
      console.error('Error fetching users by role:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get users by status (active/banned)
   */
  async getByStatus(status: string): Promise<UserProfile[]> {
    try {
      const { data } = await apiClient.get<ApiResponse<UserProfile[]>>(`/api/users/status/${status}`);
      return data.data || [];
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
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};