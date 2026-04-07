import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/api/client';

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Đang xác thực thanh toán...');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const globalSearch = new URLSearchParams(window.location.search);
        const orderCode = searchParams.get('orderCode');
        const code = searchParams.get('code');
        const id = searchParams.get('id');
        const cancel = searchParams.get('cancel');
        const statusParam = searchParams.get('status');

        const orderId =
          searchParams.get('orderId') ||
          globalSearch.get('orderId') ||
          sessionStorage.getItem('pending_order_id');
        
        if (!orderId) {
          setStatus('failed');
          setMessage('Thông tin đơn hàng không hợp lệ');
          setTimeout(() => {
            navigate('/orders');
          }, 3000);
          return;
        }

        // Nếu bị cancel
        if (cancel === 'true' || statusParam === 'CANCELLED') {
          setStatus('failed');
          setMessage('Bạn đã hủy thanh toán');
          setTimeout(() => {
            navigate('/cart');
          }, 3000);
          return;
        }

        // Verify payment với backend
        const response = await apiClient.get(`/api/payment/verify/${orderId}`);

        console.log('Verify Response:', response.data);

        if (response.data.isValid && response.data.status === 'PAID') {
          setStatus('success');
          setMessage('Thanh toán thành công!');
          sessionStorage.removeItem('pending_order_id');
          sessionStorage.removeItem('pending_order_code');
          setTimeout(() => {
            navigate(`/payment-success/${orderId}`);
          }, 2000);
        } else {
          console.warn('Payment not completed:', response.data);
          setStatus('failed');
          setMessage(`Thanh toán chưa hoàn tất: ${response.data.status || 'PENDING'}`);
          setTimeout(() => {
            navigate('/orders');
          }, 3000);
        }
      } catch (error: any) {
        console.error('Error verifying payment:', error);
        setStatus('failed');
        setMessage('Có lỗi xảy ra khi xác thực thanh toán');
        setTimeout(() => {
          navigate('/orders');
        }, 3000);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Đang xác thực</h2>
            <p className="text-slate-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Thành công!</h2>
            <p className="text-slate-600">{message}</p>
            <p className="text-sm text-slate-500 mt-2">Đang chuyển hướng...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Thất bại</h2>
            <p className="text-slate-600">{message}</p>
            <p className="text-sm text-slate-500 mt-2">Đang chuyển hướng...</p>
          </>
        )}
      </div>
    </div>
  );
}
