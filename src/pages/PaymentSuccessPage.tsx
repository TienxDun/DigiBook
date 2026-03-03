import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  useEffect(() => {
    // Redirect về trang orders sau 5 giây
    const timeout = setTimeout(() => {
      navigate('/orders');
    }, 5000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Đặt hàng thành công!
        </h1>
        
        <p className="text-slate-600 mb-6">
          Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được xác nhận và đang được xử lý.
        </p>

        {orderId && (
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-500 mb-1">Mã đơn hàng</p>
            <p className="text-lg font-mono font-semibold text-slate-900">{orderId}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => navigate('/orders')}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Xem đơn hàng
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            Về trang chủ
          </button>
        </div>

        <p className="text-sm text-slate-500 mt-6">
          Tự động chuyển đến trang đơn hàng sau 5 giây...
        </p>
      </div>
    </div>
  );
}
