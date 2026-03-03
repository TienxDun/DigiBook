export type PaymentMethodType = 'cod' | 'payos';

export interface PaymentConfig {
  RETURN_URL: string;
  ELEMENT_ID: string;
  CHECKOUT_URL: string;
  embedded: boolean;
  onSuccess?: (event: PaymentEvent) => void;
  onCancel?: (event: PaymentEvent) => void;
  onExit?: (event: PaymentEvent) => void;
}

export interface PaymentEvent {
  loading: boolean;
  code: string;
  id: string;
  cancel: boolean;
  orderCode: number;
  status: string;
}

export interface OrderData {
  orderId: string;
  orderCode: string;
  amount: number;
  description: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface PaymentRequest {
  orderCode: string;
  amount: number;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  returnUrl: string;
  cancelUrl: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  checkoutUrl: string;
  paymentLinkId: string;
  orderCode: string;
  qrCode: string;
}

export interface CreatePaymentRequest {
  orderId: string;
  orderCode: string;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}
