import { IPaymentProvider } from '../IPaymentProvider';
import { PaymentConfig, OrderData, PaymentEvent, CreatePaymentRequest } from '../types';
import { apiClient } from '../../api/client';

export class PayOSProvider implements IPaymentProvider {
  private paymentWindow: Window | null = null;

  getProviderName(): string {
    return 'PayOS';
  }

  initialize(config: PaymentConfig): void {
    // Not needed for new tab flow
  }

  async createPayment(orderData: OrderData): Promise<string> {
    try {
      const returnUrl = new URL(`${window.location.origin}/DigiBook/#/payment-callback`);
      returnUrl.searchParams.set('orderId', orderData.orderId);
      returnUrl.searchParams.set('orderCode', orderData.orderCode);

      const cancelUrl = new URL(`${window.location.origin}/DigiBook/#/payment-cancel`);
      cancelUrl.searchParams.set('orderId', orderData.orderId);
      cancelUrl.searchParams.set('orderCode', orderData.orderCode);

      const requestData: CreatePaymentRequest = {
        orderId: orderData.orderId,
        orderCode: orderData.orderCode,
        amount: orderData.amount,
        description: orderData.description,
        returnUrl: returnUrl.toString(),
        cancelUrl: cancelUrl.toString(),
        customer: orderData.customer,
        items: orderData.items,
      };

      const response = await apiClient.post<any>(
        '/api/payment/create',
        requestData
      );

      console.log('Payment API Response:', response.data);

      if (response.data.success) {
        const checkoutUrl = response.data.checkoutUrl;
        console.log('Checkout URL:', checkoutUrl);
        
        if (!checkoutUrl || checkoutUrl === '') {
          throw new Error('Payment API did not return a valid checkout URL. Please check PayOS credentials and configuration.');
        }
        
        return checkoutUrl;
      } else {
        throw new Error(response.data.message || 'Failed to create payment');
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create payment');
    }
  }

  open(checkoutUrl?: string): void {
    if (!checkoutUrl) {
      throw new Error('Checkout URL is required to open payment window.');
    }
    
    // Mở tab mới với checkoutUrl
    console.log('Opening PayOS payment in new tab:', checkoutUrl);
    this.paymentWindow = window.open(checkoutUrl, '_blank');
    
    if (!this.paymentWindow) {
      throw new Error('Failed to open payment window. Please allow popups for this site.');
    }
  }

  close(): void {
    if (this.paymentWindow && !this.paymentWindow.closed) {
      this.paymentWindow.close();
    }
  }

  onSuccess(callback: (event: PaymentEvent) => void): void {
    // Not used in new tab flow - callbacks handled by URL redirects
  }

  onCancel(callback: (event: PaymentEvent) => void): void {
    // Not used in new tab flow - callbacks handled by URL redirects
  }

  onExit(callback: (event: PaymentEvent) => void): void {
    // Not used in new tab flow - callbacks handled by URL redirects
  }
}
