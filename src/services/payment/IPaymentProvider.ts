import { PaymentConfig, OrderData, PaymentEvent } from './types';

export interface IPaymentProvider {
  /**
   * Khởi tạo payment provider với cấu hình
   */
  initialize(config: PaymentConfig): void;

  /**
   * Tạo payment và trả về checkout URL
   */
  createPayment(orderData: OrderData): Promise<string>;

  /**
   * Mở popup/iframe thanh toán
   */
  open(checkoutUrl?: string): void;

  /**
   * Đóng popup/iframe thanh toán
   */
  close(): void;

  /**
   * Đăng ký callback khi thanh toán thành công
   */
  onSuccess(callback: (event: PaymentEvent) => void): void;

  /**
   * Đăng ký callback khi hủy thanh toán
   */
  onCancel(callback: (event: PaymentEvent) => void): void;

  /**
   * Đăng ký callback khi đóng popup
   */
  onExit(callback: (event: PaymentEvent) => void): void;

  /**
   * Lấy tên provider
   */
  getProviderName(): string;
}
