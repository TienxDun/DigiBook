
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CartItem } from '../types';
import { useAuth } from '../AuthContext';
import { db } from '../services/db';
import { ErrorHandler } from '../services/errorHandler';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const CheckoutPage: React.FC<{ cart: CartItem[], onClearCart: () => void }> = ({ cart, onClearCart }) => {
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAuth();
  
  // States
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({ 
    name: user?.name || '', 
    phone: '', 
    address: '', 
    note: '' 
  });

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, value: number, type: 'percentage' | 'fixed' } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Auto-fill user profile if logged in
  useEffect(() => {
    const fillProfile = async () => {
      if (user) {
        try {
          const profile = await db.getUserProfile(user.id);
          setFormData(prev => ({
            ...prev,
            name: profile?.name || user.name || '',
            phone: profile?.phone || '',
            address: profile?.address || ''
          }));
        } catch (e) {
          console.error("Error auto-filling profile:", e);
        }
      }
    };
    
    fillProfile();
    if (cart.length === 0) navigate('/');
  }, [user, cart, navigate]);

  // Calculations
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const shipping = subtotal > 500000 ? 0 : 25000;
  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') {
      return (subtotal * appliedCoupon.value) / 100;
    }
    return appliedCoupon.value;
  }, [appliedCoupon, subtotal]);
  const total = subtotal + shipping - discount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyCoupon = async () => {
    setCouponError('');
    const coupon = await db.validateCoupon(couponCode, subtotal);
    if (coupon) {
      setAppliedCoupon({ code: coupon.code, value: coupon.value, type: coupon.type });
      setCouponCode('');
    } else {
      setCouponError('Mã giảm giá không hợp lệ hoặc không đủ điều kiện.');
    }
  };

  const handleCompleteOrder = async () => {
    if (!user) { setShowLoginModal(true); return; }
    if (!formData.name || !formData.phone || !formData.address) { 
      toast.error('Vui lòng nhập đầy đủ thông tin giao hàng.'); 
      return; 
    }

    setIsProcessing(true);
    
    try {
      // Đợi xử lý
      await new Promise(r => setTimeout(r, 1500));

      const order = await db.createOrder({
        userId: user.id,
        status: 'Đang xử lý',
        statusStep: 1,
        customer: { 
          name: formData.name, 
          phone: formData.phone, 
          address: formData.address, 
          email: user.email 
        },
        payment: {
          method: paymentMethod === 'online' ? 'Chuyển khoản / Thẻ' : 'Tiền mặt khi nhận hàng (COD)',
          subtotal,
          shipping,
          couponDiscount: discount,
          total
        }
      }, cart);

      if (appliedCoupon) {
        await db.incrementCouponUsage(appliedCoupon.code);
      }

      onClearCart();
      setIsProcessing(false);
      navigate('/order-success', { state: { orderId: order.id } });
    } catch (error: any) {
      if (error.code === 'OUT_OF_STOCK') {
        toast.error(`KHO HÀNG THAY ĐỔI: ${error.message}. Vui lòng kiểm tra lại giỏ hàng.`);
      } else {
        ErrorHandler.handle(error, 'thanh toán');
      }
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-20 lg:pt-24 fade-in">
      <div className="bg-white border-b border-slate-100 py-5 mb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            {[
              { label: 'Giỏ hàng', active: true, done: true },
              { label: 'Thanh toán', active: true, done: false },
              { label: 'Hoàn tất', active: false, done: false }
            ].map((step, i, arr) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-micro transition-all ${
                    step.active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {step.done ? <i className="fa-solid fa-check"></i> : i + 1}
                  </div>
                  <span className={`text-micro font-bold uppercase tracking-premium ${step.active ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
                {i < arr.length - 1 && <div className={`flex-1 h-0.5 mx-3 rounded-full ${arr[i+1].active ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3.5 mb-8">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <i className="fa-solid fa-truck-fast text-lg"></i>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 leading-tight tracking-tight uppercase">Thông tin giao hàng</h2>
                  <p className="text-micro text-slate-400 font-bold uppercase tracking-premium">Nơi chúng tôi gửi tri thức đến bạn</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-micro font-bold text-slate-400 uppercase tracking-premium ml-1">Họ và tên</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="Nhập tên người nhận..." 
                    className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-indigo-100 focus:ring-4 ring-indigo-50 transition-all font-bold text-slate-900 text-sm" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-micro font-bold text-slate-400 uppercase tracking-premium ml-1">Số điện thoại</label>
                  <input 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    placeholder="09xx xxx xxx" 
                    className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-indigo-100 focus:ring-4 ring-indigo-50 transition-all font-bold text-slate-900 text-sm" 
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-micro font-bold text-slate-400 uppercase tracking-premium ml-1">Địa chỉ chi tiết</label>
                  <input 
                    name="address" 
                    value={formData.address} 
                    onChange={handleInputChange} 
                    placeholder="Số nhà, tên đường, phường/xã..." 
                    className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-indigo-100 focus:ring-4 ring-indigo-50 transition-all font-bold text-slate-900 text-sm" 
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-micro font-bold text-slate-400 uppercase tracking-premium ml-1">Ghi chú đơn hàng (Tùy chọn)</label>
                  <textarea 
                    name="note" 
                    value={formData.note} 
                    onChange={handleInputChange} 
                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..." 
                    className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-indigo-100 focus:ring-4 ring-indigo-50 transition-all font-bold text-slate-900 text-sm h-24 resize-none" 
                  />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3.5 mb-8">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <i className="fa-solid fa-credit-card text-lg"></i>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 leading-tight tracking-tight uppercase">Phương thức thanh toán</h2>
                  <p className="text-micro text-slate-400 font-bold uppercase tracking-premium">An toàn & bảo mật tuyệt đối</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === 'cod' 
                    ? 'border-indigo-600 bg-indigo-50/30' 
                    : 'border-slate-50 bg-slate-50/30 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-indigo-600' : 'border-slate-200'}`}>
                    {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>}
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-[13px]">Thanh toán khi nhận hàng</p>
                    <p className="text-micro text-slate-400 font-bold uppercase tracking-premium">Tiền mặt (COD)</p>
                  </div>
                  <i className="fa-solid fa-money-bill-wave ml-auto text-slate-300 text-lg"></i>
                </button>

                <button 
                  onClick={() => setPaymentMethod('online')}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === 'online' 
                    ? 'border-indigo-600 bg-indigo-50/30' 
                    : 'border-slate-50 bg-slate-50/30 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-indigo-600' : 'border-slate-200'}`}>
                    {paymentMethod === 'online' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>}
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-[13px]">Thanh toán trực tuyến</p>
                    <p className="text-micro text-slate-400 font-bold uppercase tracking-premium">Thẻ / Chuyển khoản</p>
                  </div>
                  <i className="fa-solid fa-building-columns ml-auto text-slate-300 text-lg"></i>
                </button>
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm overflow-hidden">
              <h3 className="text-base font-extrabold text-slate-900 mb-5 uppercase tracking-premium">Tóm tắt đơn hàng</h3>
              
              <div className="max-h-60 overflow-y-auto no-scrollbar space-y-4 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4 items-center group">
                    <div className="w-12 h-16 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                      <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-label truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.title}</h4>
                      <p className="text-micro text-slate-400 font-bold mb-0.5">SL: {item.quantity}</p>
                      <p className="font-extrabold text-slate-900 text-label">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-5 border-t border-slate-50 mb-5">
                <div className="relative mb-2">
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Mã giảm giá" 
                    className="w-full py-2.5 pl-3.5 pr-20 bg-slate-50 border border-transparent rounded-lg outline-none focus:bg-white focus:border-indigo-100 text-[11px] font-bold"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    className="absolute right-1 top-1 bottom-1 px-3 bg-slate-900 text-white rounded-md text-micro font-bold uppercase tracking-premium hover:bg-indigo-600 transition-all"
                  >
                    Áp dụng
                  </button>
                </div>
                {couponError && <p className="text-micro text-rose-500 font-bold ml-1">{couponError}</p>}
                {appliedCoupon && (
                  <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 rounded-lg mt-1.5 border border-emerald-100">
                    <span className="text-micro font-bold text-emerald-700 uppercase tracking-premium flex items-center gap-2">
                      <i className="fa-solid fa-ticket"></i> {appliedCoupon.code}
                    </span>
                    <button onClick={() => setAppliedCoupon(null)} className="text-emerald-700 hover:text-rose-500 text-xs"><i className="fa-solid fa-circle-xmark"></i></button>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 pt-5 border-t border-slate-50">
                <div className="flex justify-between text-label font-bold text-slate-500">
                  <span className="uppercase tracking-premium text-micro">Tạm tính ({cart.length})</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-label font-bold text-slate-500">
                  <span className="uppercase tracking-premium text-micro">Vận chuyển</span>
                  <span>{shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-label font-bold text-emerald-600">
                    <span className="uppercase tracking-premium text-micro">Giảm giá (Coupon)</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-extrabold text-slate-900 uppercase tracking-premium">Tổng tiền</span>
                  <span className="text-xl font-extrabold text-indigo-600 tracking-tight">{formatPrice(total)}</span>
                </div>
              </div>

              <button 
                onClick={handleCompleteOrder} 
                disabled={isProcessing}
                className={`w-full mt-6 py-4 rounded-xl font-extrabold text-micro uppercase tracking-premium transition-all shadow-xl flex items-center justify-center gap-2.5 ${
                  isProcessing 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-200'
                }`}
              >
                {isProcessing ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Hoàn tất đặt hàng
                    <i className="fa-solid fa-arrow-right-long"></i>
                  </>
                )}
              </button>
              
              <div className="mt-5 flex items-center justify-center gap-4 opacity-30">
                <i className="fa-brands fa-cc-visa text-xl"></i>
                <i className="fa-brands fa-cc-mastercard text-xl"></i>
                <i className="fa-solid fa-shield-halved text-lg"></i>
              </div>
            </div>

            <div className="px-6 text-center">
              <p className="text-micro font-bold text-slate-400 uppercase tracking-premium leading-relaxed">
                Bằng việc nhấn đặt hàng, bạn đồng ý với <a href="#" className="text-indigo-600 underline">Điều khoản</a> & <a href="#" className="text-indigo-600 underline">Chính sách</a> của DigiBook.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
