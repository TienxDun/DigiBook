
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const orderId = location.state?.orderId || 'DB' + (Math.floor(Math.random() * 900000) + 100000);
  
  return (
    <div className="container mx-auto px-6 py-32 text-center fade-in">
      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-50">
        <i className="fa-solid fa-check text-4xl"></i>
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Đặt hàng thành công!</h1>
      <p className="text-slate-500 text-lg mb-2">Cảm ơn bạn đã tin tưởng DigiBook.</p>
      <p className="text-slate-400 font-medium mb-10">Mã đơn hàng của bạn là: <span className="text-slate-900 font-bold">#{orderId}</span></p>
      
      <div className="max-w-md mx-auto bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm mb-12 text-left">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-truck-fast text-indigo-600"></i> Dự kiến giao hàng
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">Đơn hàng sẽ được chuyển đến bạn trong vòng 2-3 ngày làm việc. Bạn sẽ nhận được email cập nhật trạng thái đơn hàng sớm nhất.</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link to="/" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
          Tiếp tục mua sắm
        </Link>
        <Link to={`/my-orders/${orderId}`} className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-bold border border-slate-200 hover:bg-slate-50 transition-all text-center">
          Chi tiết đơn hàng
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
