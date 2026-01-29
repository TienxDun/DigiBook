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
  }
};