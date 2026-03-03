import { IPaymentProvider } from './IPaymentProvider';
import { PayOSProvider } from './providers/PayOSProvider';
import { PaymentMethodType } from './types';

export class PaymentProviderFactory {
  /**
   * Tạo payment provider dựa trên payment method
   */
  static createProvider(type: PaymentMethodType): IPaymentProvider {
    switch (type) {
      case 'payos':
        return new PayOSProvider();
      case 'cod':
        throw new Error('COD does not require a payment provider');
      default:
        throw new Error(`Unsupported payment method: ${type}`);
    }
  }
}
