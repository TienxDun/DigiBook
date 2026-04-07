import { apiClient, handleApiError } from '../client';
import { ApiResponse } from '../types';
import type { Order, OrderItem } from '@/shared/types';
import { cache } from '../../cache';

const TTL_5M = 5 * 60 * 1000;
const ORDERS_TAG = 'orders';

interface FetchOrdersOptions {
  force?: boolean;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  address: string;
  email: string;
  note?: string;
}

export interface OrderPayment {
  method: string;
  provider?: string;
  transactionId?: string;
  checkoutUrl?: string;
  status?: string;
  subtotal: number;
  shipping: number;
  couponDiscount: number;
  total: number;
}

export type OrderPayload = Omit<Order, 'id'> & { id?: string };

export interface CreateOrderRequest {
  order: OrderPayload;
  items: OrderItem[];
}

export const ordersApi = {
  /**
   * Get all orders (admin)
   */
  async getAll(options?: FetchOrdersOptions): Promise<Order[] | null> {
    try {
      if (options?.force) {
        const response = await apiClient.get<ApiResponse<Order[]>>('/api/orders', {
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

        return response.data.data || null;
      }

      const { data } = await cache.swr<Order[] | null>(
        'orders:all',
        async () => {
          const response = await apiClient.get<ApiResponse<Order[]>>('/api/orders');
          return response.data.data || null;
        },
        { ttl: TTL_5M, tags: [ORDERS_TAG], persist: true }
      );
      return data;
    } catch (error) {
      console.error('Error fetching orders:', handleApiError(error));
      return null;
    }
  },

  /**
   * Get order by ID
   */
  async getById(orderId: string, options?: FetchOrdersOptions): Promise<Order | null> {
    try {
      if (options?.force) {
        const response = await apiClient.get<ApiResponse<Order>>(`/api/orders/${orderId}`, {
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

        return response.data.data || null;
      }

      const { data } = await cache.swr<Order | null>(
        `orders:id:${orderId}`,
        async () => {
          const response = await apiClient.get<ApiResponse<Order>>(`/api/orders/${orderId}`);
          return response.data.data || null;
        },
        { ttl: TTL_5M, tags: [ORDERS_TAG], persist: true }
      );
      return data;
    } catch (error) {
      console.error('Error fetching order:', handleApiError(error));
      return null;
    }
  },

  /**
   * Get orders by user ID
   */
  async getByUserId(userId: string): Promise<Order[] | null> {
    try {
      const { data } = await cache.swr<Order[] | null>(
        `orders:user:${userId}`,
        async () => {
          const response = await apiClient.get<ApiResponse<Order[]>>(`/api/orders/user/${userId}`);
          return response.data.data || null;
        },
        { ttl: TTL_5M, tags: [ORDERS_TAG], persist: true }
      );
      return data;
    } catch (error) {
      console.error('Error fetching user orders:', handleApiError(error));
      return null;
    }
  },

  /**
   * Create new order with Command Pattern
   */
  async create(orderData: OrderPayload, items: OrderItem[]): Promise<Order | null> {
    try {
      const response = await apiClient.post<ApiResponse<Order>>('/api/orders', {
        ...orderData,
        items
      });
      cache.clear(ORDERS_TAG);
      return response.data.data || null;
    } catch (error) {
      console.error('Error creating order:', handleApiError(error));
      throw error;
    }
  },

  /**
   * Update order
   */
  async update(orderId: string, orderData: Partial<OrderPayload>): Promise<Order | null> {
    try {
      const response = await apiClient.put<ApiResponse<Order>>(`/api/orders/${orderId}`, orderData);
      cache.clear(ORDERS_TAG);
      return response.data.data || null;
    } catch (error) {
      console.error('Error updating order:', handleApiError(error));
      return null;
    }
  },

  /**
   * Update order status
   */
  async updateStatus(orderId: string, status: string, statusStep: number): Promise<boolean> {
    try {
      const response = await apiClient.patch<ApiResponse<any>>(`/api/orders/${orderId}/status`, {
        status,
        statusStep
      });
      cache.clear(ORDERS_TAG);
      return response.data.success;
    } catch (error) {
      console.error('Error updating order status:', handleApiError(error));
      return false;
    }
  },

  /**
   * Cancel order
   */
  async cancel(orderId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse<any>>(`/api/orders/${orderId}`);
      cache.clear(ORDERS_TAG);
      return response.data.success;
    } catch (error) {
      console.error('Error cancelling order:', handleApiError(error));
      return false;
    }
  },

  /**
   * Get by status
   */
  async getByStatus(status: string): Promise<Order[]> {
    try {
      const { data } = await cache.swr<Order[]>(
        `orders:status:${status}`,
        async () => {
          const response = await apiClient.get<ApiResponse<Order[]>>(`/api/orders/status/${status}`);
          return response.data.data || [];
        },
        { ttl: TTL_5M, tags: [ORDERS_TAG], persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching orders by status:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get recent
   */
  async getRecent(count: number = 10): Promise<Order[]> {
    try {
      const { data } = await cache.swr<Order[]>(
        `orders:recent:${count}`,
        async () => {
          const response = await apiClient.get<ApiResponse<Order[]>>('/api/orders/recent', {
            params: { count }
          });
          return response.data.data || [];
        },
        { ttl: TTL_5M, tags: [ORDERS_TAG], persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching recent orders:', handleApiError(error));
      return [];
    }
  },

  async cancelWithReason(orderId: string, reason: string): Promise<boolean> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/api/orders/${orderId}/cancel`, {
        reason
      });
      cache.clear(ORDERS_TAG);
      return response.data.success;
    } catch (error) {
      console.error('Error cancelling order with reason:', handleApiError(error));
      return false;
    }
  },

  async hasPurchasedBook(userId: string, bookId: string): Promise<boolean> {
    try {
      const { data } = await cache.swr<boolean>(
        `orders:user:${userId}:purchased:${bookId}`,
        async () => {
          const response = await apiClient.get<ApiResponse<{ purchased: boolean }>>(`/api/orders/user/${userId}/purchased/${bookId}`);
          return response.data.data?.purchased || false;
        },
        { ttl: TTL_5M, tags: [ORDERS_TAG], persist: true }
      );
      return data || false;
    } catch (error) {
      console.error('Error checking purchase status:', handleApiError(error));
      return false;
    }
  }
};
