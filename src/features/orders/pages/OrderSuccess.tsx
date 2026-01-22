
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const ConfettiPiece = ({ delay }: { delay: number }) => {
  const randomColor = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#0ea5e9'][Math.floor(Math.random() * 5)];
  const randomX = Math.random() * 100;
  const randomRotate = Math.random() * 360;

  return (
    <motion.div
      initial={{ y: -20, x: `${randomX}vw`, opacity: 1, rotate: 0 }}
      animate={{ y: '110vh', rotate: randomRotate + 360, opacity: 0 }}
      transition={{ duration: Math.random() * 2 + 3, delay: delay, ease: 'linear' }}
      style={{ backgroundColor: randomColor }}
      className="fixed top-0 w-3 h-3 rounded-sm z-50 pointer-events-none"
    />
  );
};

const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const orderId = location.state?.orderId || 'DB' + (Math.floor(Math.random() * 900000) + 100000);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Stop generating confetti after 5 seconds to performance
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">

      {/* CSS/Motion Confetti Effect */}
      {showConfetti && Array.from({ length: 50 }).map((_, i) => (
        <ConfettiPiece key={i} delay={Math.random() * 2} />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="max-w-xl w-full text-center relative z-10"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-200 relative"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-emerald-400 rounded-full opacity-30 blur-xl" // Pulse Glow
          />
          <i className="fa-solid fa-check text-5xl text-white"></i>
        </motion.div>

        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-3 tracking-tighter uppercase">
          Thành công!
        </h1>
        <p className="text-slate-500 font-bold max-w-sm mx-auto mb-8 text-sm uppercase tracking-wide">
          Cảm ơn bạn đã lựa chọn DigiBook.
          <br className="hidden sm:block" />
          Hành trình tri thức mới đang chờ đợi bạn.
        </p>

        {/* Ticket / Order Card */}
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden text-left mb-10 group hover:shadow-[0_20px_60px_-10px_rgba(99,102,241,0.15)] transition-shadow duration-500">
          {/* Decorative bg */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -ml-16 -mb-16 opacity-60 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-dashed border-slate-200">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Mã đơn hàng</p>
              <p className="text-2xl font-black text-indigo-600 tracking-tight">#{orderId}</p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-clock"></i> Đang xử lý
            </div>
          </div>

          <div className="relative z-10 pt-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                <i className="fa-solid fa-truck-fast"></i>
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Dự kiến giao hàng</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">2 - 4 ngày làm việc</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                <i className="fa-solid fa-envelope"></i>
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Xác nhận qua Email</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Chúng tôi đã gửi chi tiết đơn hàng tới email của bạn</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/"
            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-arrow-left"></i>
            Tiếp tục mua sắm
          </Link>
          <Link
            to={`/my-orders`}
            className="flex-1 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.15em] border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Quản lý đơn hàng
            <i className="fa-solid fa-box-open"></i>
          </Link>
        </div>

      </motion.div>
    </div>
  );
};

export default OrderSuccess;
