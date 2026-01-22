
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';

const Footer: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-foreground text-white pt-12 pb-8">
      <div className="w-[92%] xl:w-[60%] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-book-bookmark text-xl"></i>
              </div>
              <span className="text-2xl font-extrabold tracking-tighter text-white">Digi<span className="text-primary">Book</span></span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              DigiBook là không gian tri thức hiện đại, nơi mang đến những cuốn sách chọn lọc giúp bạn khai phá tiềm năng và tìm thấy niềm cảm hứng mỗi ngày.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary transition-all text-slate-300 hover:text-white">
                <i className="fa-brands fa-facebook-f text-sm"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary transition-all text-slate-300 hover:text-white">
                <i className="fa-brands fa-instagram text-sm"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary transition-all text-slate-300 hover:text-white">
                <i className="fa-brands fa-tiktok text-sm"></i>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-premium text-white mb-8">Khám phá</h4>
            <ul className="space-y-4 text-label font-bold text-slate-400">
              <li><Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link></li>
              <li><Link to="/authors" className="hover:text-primary transition-colors">Các tác giả</Link></li>
              <li><Link to="/category/Tất cả sách" className="hover:text-primary transition-colors">Sách mới về</Link></li>
              <li><Link to="/category/Văn học" className="hover:text-primary transition-colors">Văn học tiểu thuyết</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-premium text-white mb-8">Hỗ trợ khách hàng</h4>
            <ul className="space-y-4 text-label font-bold text-slate-400">
              <li><Link to="/my-orders" className="hover:text-primary transition-colors">Theo dõi đơn hàng</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">Chính sách đổi trả</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Câu hỏi thường gặp</a></li>
              {user?.isAdmin && (
                <li><Link to="/admin" className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2">
                  <i className="fa-solid fa-user-gear"></i> Hệ thống Admin
                </Link></li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-premium text-white mb-8">Đăng ký bản tin</h4>
            <p className="text-slate-400 text-sm mb-6 font-medium">Nhận ngay ưu đãi 10% cho đơn hàng đầu tiên và cập nhật sách mới hàng tuần.</p>
            <form className="relative">
              <input
                type="email"
                placeholder="Email của bạn..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm focus:border-primary focus:outline-none transition-all"
              />
              <button className="absolute right-2 top-2 bottom-2 w-10 bg-primary rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all">
                <i className="fa-solid fa-paper-plane text-xs"></i>
              </button>
            </form>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-premium">
            © 2026 DigiBook Store. Được thiết kế với <i className="fa-solid fa-heart text-rose-500 mx-1"></i> cho người yêu sách.
          </div>
          <div className="flex items-center gap-6">
            <img src="https://img.icons8.com/color/48/visa.png" alt="Visa" className="h-6 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer" />
            <img src="https://img.icons8.com/color/48/mastercard.png" alt="Mastercard" className="h-6 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer" />
            <img src="https://img.icons8.com/color/48/paypal.png" alt="Paypal" className="h-6 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
