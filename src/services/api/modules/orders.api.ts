import { apiClient } from '../client';
import { ApiResponse } from '../types';

export interface OrderItem {
  bookId: string;
  title: string;
  priceAtPurchase: number;
  quantity: number;
  cover?: string;
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
  subtotal: number;
  shipping: number;
  couponDiscount: number;
  total: number;
}

export interface Order {
  id?: string;
  userId: string;
  status: string;
  statusStep: number;
  customer: OrderCustomer;
  payment: OrderPayment;
  items?: OrderItem[];
  createdAt?: any;
  updatedAt?: any;
}

export interface CreateOrderRequest {
  order: Order;
  items: OrderItem[];
}

export const ordersApi = {
  /**
   * Get all orders (admin)
   */
  async getAll(): Promise<Order[] | null> {
    try {
      const response = await apiClient.get<ApiResponse<Order[]>>('/api/orders');
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return null;
    }
  },

  /**
   * Get order by ID
   */
  async getById(orderId: string): Promise<Order | null> {
    try {
      const response = await apiClient.get<ApiResponse<Order>>(`/api/orders/${orderId}`);
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  },

  /**
   * Get orders by user ID
   */
  async getByUserId(userId: string): Promise<Order[] | null> {
    try {
      const response = await apiClient.get<ApiResponse<Order[]>>(`/api/orders/user/${userId}`);
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return null;
    }
  },

  /**
   * Create new order with Command Pattern
   */
  async create(orderData: Order, items: OrderItem[]): Promise<Order | null> {
    try {
      const response = await apiClient.post<ApiResponse<Order>>('/api/orders', {
        ...orderData,
        items
      });
      return response.data.data || null;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error; // Re-throw for error handling in checkout
    }
  },

  /**
   * Update order
   */
  async update(orderId: string, orderData: Partial<Order>): Promise<Order | null> {
    try {
      const response = await apiClient.put<ApiResponse<Order>>(`/api/orders/${orderId}`, orderData);
      return response.data.data || null;
    } catch (error) {
      console.error('Error updating order:', error);
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
      return response.data.success;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  },

  /**
   * Cancel order
   */
  async cancel(orderId: string, reason: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse<any>>(`/api/orders/${orderId}`, {
        data: { reason }
      });
      return response.data.success;
    } catch (error) {
      console.error('Error cancelling order:', error);
      return false;
    }
  },

  // ===== Phase 2: Admin Order Management Methods =====

  /**
   * Get orders by status (admin filtering)
   */
  async getByStatus(status: string): Promise<Order[]> {
    try {
      const response = await apiClient.get<ApiResponse<Order[]>>(`/api/orders/status/${status}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      return [];
    }
  },

  /**
   * Get recent orders (admin dashboard)
   */
  async getRecent(count: number = 10): Promise<Order[]> {
    try {
      const response = await apiClient.get<ApiResponse<Order[]>>('/api/orders/recent', {
        params: { count }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      return [];
    }
  },

  /**
   * Cancel order with reason using POST endpoint
   * Note: This uses the separate cancel endpoint, different from delete()
   */
  async cancelWithReason(orderId: string, reason: string): Promise<boolean> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/api/orders/${orderId}/cancel`, {
        reason
      });
      return response.data.success;
    } catch (error) {
      console.error('Error cancelling order with reason:', error);
      return false;
    }
  }
};
