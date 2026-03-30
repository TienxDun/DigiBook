import React from 'react';
import { motion } from 'framer-motion';

interface TierProps {
  name: string;
  discount: string;
  description: string;
  icon: string;
  threshold: string;
  colorClass: string;
  delay: number;
  isVip?: boolean;
}

const TierCard: React.FC<TierProps> = ({ name, discount, description, icon, threshold, colorClass, delay, isVip }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -10, transition: { duration: 0.3 } }}
      className={`relative p-8 rounded-[2.5rem] bg-white/70 backdrop-blur-2xl border border-white/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group overflow-hidden ${isVip ? 'ring-2 ring-indigo-500/20' : ''}`}
    >
      {/* Decorative Gradient Background */}
      <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}></div>

      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3 ${colorClass} bg-opacity-10`}>
        <i className={`fa-solid ${icon} text-2xl ${colorClass.replace('bg-', 'text-')}`}></i>
      </div>

      <div className="mb-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-black tracking-tight ${isVip ? 'bg-gradient-to-r from-indigo-600 to-rose-500 bg-clip-text text-transparent' : 'text-slate-900'}`}>
            {discount}
          </span>
          {discount !== '0%' && <span className="text-sm font-bold text-slate-400">GIẢM</span>}
        </div>
      </div>

      <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
        {description}
      </p>

      <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{threshold}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] ${colorClass.replace('bg-', 'bg-')} shadow-lg`}>
          <i className="fa-solid fa-arrow-right"></i>
        </div>
      </div>
      
      {isVip && (
        <div className="absolute top-4 right-8">
          <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-indigo-200">Popular</span>
        </div>
      )}
    </motion.div>
  );
};

export const MembershipTiers: React.FC = () => {
  const tiers = [
    {
      name: 'Regular',
      discount: '0%',
      description: 'Khởi đầu hành trình tri thức với giá niêm yết tiêu chuẩn và dịch vụ hỗ trợ tận tâm.',
      icon: 'fa-leaf',
      threshold: 'Mặc định',
      colorClass: 'bg-emerald-500',
    },
    {
      name: 'Member',
      discount: '10%',
      description: 'Nhận ngay ưu đãi 10% cho mọi đơn hàng. Thế giới sách trở nên gần gũi hơn bao giờ hết.',
      icon: 'fa-medal',
      threshold: 'Từ 1.000.000 ₫',
      colorClass: 'bg-amber-500',
    },
    {
      name: 'VIP Member',
      discount: '30%',
      description: 'Đặc quyền thượng lưu với chiết khấu lên đến 30%. Săn sách tinh hoa không cần nhìn giá.',
      icon: 'fa-crown',
      threshold: 'Từ 5.000.000 ₫',
      colorClass: 'bg-indigo-600',
      isVip: true,
    },
    {
      name: 'Wholesale',
      discount: '25%',
      description: 'Giải pháp cung ứng sách số lượng lớn cho đối tác với chiết khấu sỉ chuyên biệt.',
      icon: 'fa-handshake',
      threshold: 'Xét duyệt riêng',
      colorClass: 'bg-slate-900',
    },
  ];

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden bg-white">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-0 w-full h-full -translate-y-1/2 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50/30 blur-[150px] rounded-full translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-50/20 blur-[120px] rounded-full -translate-x-1/4"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-indigo-50 rounded-full text-indigo-600 text-[10px] sm:text-[11px] font-black uppercase tracking-widest mb-6"
          >
            <i className="fa-solid fa-gem text-xs"></i>
            <span>Đặc quyền độc giả DigiBook</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-6xl font-black text-slate-900 mb-6 lg:mb-8 tracking-tighter uppercase"
          >
            Hạng thành viên <br />
            <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent italic">Quyền lợi bất tận.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 font-medium text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto"
          >
            Càng đọc nhiều, ưu đãi càng lớn. Chúng tôi vinh danh hành trình khám phá tri thức của bạn qua từng cấp độ thành viên.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {tiers.map((tier, index) => (
            <TierCard key={tier.name} {...tier} delay={0.1 * index} />
          ))}
        </div>
        
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="mt-16 text-center"
        >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <i className="fa-solid fa-circle-info text-indigo-500"></i>
                Hạng thành viên được cập nhật tự động ngay khi đơn hàng hoàn tất.
            </p>
        </motion.div>
      </div>
    </section>
  );
};
