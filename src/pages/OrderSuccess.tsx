
import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const orderId = location.state?.orderId || 'DB' + (Math.floor(Math.random() * 900000) + 100000);
  
  return (
    <div className="container mx-auto px-6 py-24 lg:py-32 text-center fade-in max-w-2xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-emerald-100/50"
      >
        <i className="fa-solid fa-circle-check text-3xl"></i>
      </motion.div>
      
      <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4 tracking-tight">ĐẶT HÀNG THÀNH CÔNG!</h1>
      <p className="text-slate-500 font-medium mb-1.5 px-4">Cảm ơn bạn đã tin tưởng và lựa chọn DigiBook.</p>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10">Mã đơn hàng: <span className="text-indigo-600">#{orderId.toUpperCase()}</span></p>
      
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mb-10 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full blur-3xl -mr-12 -mt-12"></div>
        <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2 relative z-10">
          <i className="fa-solid fa-truck-fast text-indigo-500"></i> Dự kiến giao hàng
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed font-medium relative z-10">Đơn hàng sẽ được chuyển đến bạn trong vòng 2-5 ngày làm việc. Bạn có thể theo dõi hành trình đơn hàng tại trang <Link to="/my-orders" className="text-indigo-600 font-bold underline decoration-indigo-200 underline-offset-4">Đơn hàng của tôi</Link>.</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
        <Link to="/" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95">
          Tiếp tục mua sắm
        </Link>
        <Link to={`/my-orders/${orderId}`} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all text-center active:scale-95">
          Kiểm tra đơn hàng
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;

