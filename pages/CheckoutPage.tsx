
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../types';
import { useAuth } from '../App';
import { db } from '../services/db';

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
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, value: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Auto-fill user name if logged in
  useEffect(() => {
    if (user && !formData.name) setFormData(prev => ({ ...prev, name: user.name }));
    if (cart.length === 0) navigate('/');
  }, [user, cart, navigate]);

  // Calculations
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const shipping = subtotal > 500000 ? 0 : 25000;
  const discount = appliedCoupon ? appliedCoupon.value : 0;
  const total = subtotal + shipping - discount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    // FIX: Method added to DataService
    const coupon = db.validateCoupon(couponCode, subtotal);
    if (coupon) {
      setAppliedCoupon({ code: coupon.code, value: coupon.value });
      setCouponCode('');
    } else {
      setCouponError('Mã giảm giá không hợp lệ hoặc không đủ điều kiện.');
    }
  };

  const handleCompleteOrder = async () => {
    if (!user) { setShowLoginModal(true); return; }
    if (!formData.name || !formData.phone || !formData.address) { 
      alert('Vui lòng nhập đầy đủ thông tin giao hàng.'); 
      return; 
    }

    setIsProcessing(true);
    // Simulate API Call
    await new Promise(r => setTimeout(r, 2000));

    // FIX: Await createOrder as it is an async function
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

    onClearCart();
    setIsProcessing(false);
    navigate('/order-success', { state: { orderId: order.id } });
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-24 lg:pt-32">
      {/* Checkout Progress Stepper */}
      <div className="bg-white border-b border-slate-100 py-6 mb-10">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            {[
              { label: 'Giỏ hàng', active: true, done: true },
              { label: 'Thanh toán', active: true, done: false },
              { label: 'Hoàn tất', active: false, done: false }
            ].map((step, i, arr) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                    step.active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {step.done ? <i className="fa-solid fa-check"></i> : i + 1}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${step.active ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
                {i < arr.length - 1 && <div className={`flex-1 h-0.5 mx-4 rounded-full ${arr[i+1].active ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 pb-20">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Forms */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Shipping Information */}
            <section className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <i className="fa-solid fa-truck-fast text-lg"></i>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Thông tin giao hàng</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nơi chúng tôi gửi tri thức đến bạn</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="Nhập tên người nhận..." 
                    className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-100 focus:ring-4 ring-indigo-50 transition-all font-bold text-slate-900" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                  <input 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    placeholder="09xx xxx xxx" 
                    className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-100 focus:ring-4 ring-indigo-50 transition-all font-bold text-slate-900" 
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ chi tiết</label>
                  <input 
                    name="address" 
                    value={formData.address} 
                    onChange={handleInputChange} 
                    placeholder="Số nhà, tên đường, phường/xã..." 
                    className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-100 focus:ring-4 ring-indigo-50 transition-all font-bold text-slate-900" 
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ghi chú đơn hàng (Tùy chọn)</label>
                  <textarea 
                    name="note" 
                    value={formData.note} 
                    onChange={handleInputChange} 
                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..." 
                    className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-100 focus:ring-4 ring-indigo-50 transition-all font-bold text-slate-900 h-24 resize-none" 
                  />
                </div>
              </div>
            </section>

            {/* Payment Methods */}
            <section className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                  <i className="fa-solid fa-credit-card text-lg"></i>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Phương thức thanh toán</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">An toàn & bảo mật tuyệt đối</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                    paymentMethod === 'cod' 
                    ? 'border-indigo-600 bg-indigo-50/30' 
                    : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-indigo-600' : 'border-slate-200'}`}>
                    {paymentMethod === 'cod' && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">Thanh toán khi nhận hàng</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tiền mặt (COD)</p>
                  </div>
                  <i className="fa-solid fa-money-bill-wave ml-auto text-slate-300 text-xl"></i>
                </button>

                <button 
                  onClick={() => setPaymentMethod('online')}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                    paymentMethod === 'online' 
                    ? 'border-indigo-600 bg-indigo-50/30' 
                    : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-indigo-600' : 'border-slate-200'}`}>
                    {paymentMethod === 'online' && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">Thanh toán trực tuyến</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Thẻ / Chuyển khoản</p>
                  </div>
                  <i className="fa-solid fa-building-columns ml-auto text-slate-300 text-xl"></i>
                </button>
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-4 space-y-8 sticky top-24">
            
            {/* Items Summary Card */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden">
              <h3 className="text-lg font-black text-slate-900 mb-6">Tóm tắt đơn hàng</h3>
              
              <div className="max-h-60 overflow-y-auto no-scrollbar space-y-4 mb-8">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4 items-center group">
                    <div className="w-14 h-20 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                      <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mb-1">SL: {item.quantity}</p>
                      <p className="font-black text-slate-900 text-xs">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="pt-6 border-t border-slate-50 mb-6">
                <div className="relative mb-2">
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Mã giảm giá (VD: WELCOME5)" 
                    className="w-full py-3.5 pl-4 pr-24 bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-indigo-100 text-xs font-bold"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
                  >
                    Áp dụng
                  </button>
                </div>
                {couponError && <p className="text-[9px] text-rose-500 font-bold ml-2">{couponError}</p>}
                {appliedCoupon && (
                  <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-lg mt-2 border border-emerald-100">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-solid fa-ticket"></i> {appliedCoupon.code}
                    </span>
                    <button onClick={() => setAppliedCoupon(null)} className="text-emerald-700 hover:text-rose-500"><i className="fa-solid fa-circle-xmark"></i></button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 pt-6 border-t border-slate-50">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Tạm tính ({cart.length} món)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Phí vận chuyển</span>
                  <span>{shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-xs font-bold text-emerald-600">
                    <span>Giảm giá mã quà tặng</span>
                    <span>-{formatPrice(appliedCoupon.value)}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-base font-black text-slate-900">Tổng cộng</span>
                  <span className="text-2xl font-black text-indigo-600 tracking-tight">{formatPrice(total)}</span>
                </div>
              </div>

              <button 
                onClick={handleCompleteOrder} 
                disabled={isProcessing}
                className={`w-full mt-8 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${
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
                    Xác nhận đặt hàng
                    <i className="fa-solid fa-arrow-right-long"></i>
                  </>
                )}
              </button>
              
              <div className="mt-6 flex items-center justify-center gap-4 opacity-40">
                <i className="fa-brands fa-cc-visa text-2xl"></i>
                <i className="fa-brands fa-cc-mastercard text-2xl"></i>
                <i className="fa-solid fa-shield-halved text-xl"></i>
              </div>
            </div>

            {/* Support Info */}
            <div className="px-8 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                Bằng việc nhấn đặt hàng, bạn đồng ý với <a href="#" className="text-indigo-600 underline">Điều khoản dịch vụ</a> và <a href="#" className="text-indigo-600 underline">Chính sách bảo mật</a> của DigiBook.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
