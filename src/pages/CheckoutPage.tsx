
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { db } from '@/services/db';
import { ErrorHandler } from '../services/errorHandler';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

import { AddressInput } from '../components/AddressInput';
import { MapPicker } from '../components/MapPicker';
import { mapService, AddressResult } from '@/services/map';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Modern Floating Label Input Component (Keeping this for other inputs)
const FloatingInput = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div className="relative group">
    <input
      {...props}
      placeholder=" "
      className="peer w-full pt-6 pb-2 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-slate-800 placeholder-shown:pt-4 placeholder-shown:pb-4"
    />
    <label className="absolute left-4 top-4 text-slate-400 text-xs font-bold uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:text-indigo-500 pointer-events-none">
      {label}
    </label>
  </div>
);

const CheckoutPage: React.FC = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAuth();

  // States
  const isSubmittingRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: '',
    address: '',
    note: ''
  });
  const [coordinates, setCoordinates] = useState<{ lat: number, lon: number } | null>(null);

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
    // Only redirect if cart is empty AND we are not currently submitting an order
    if (cart.length === 0 && !isSubmittingRef.current) navigate('/');
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

  const handleAddressSelect = (result: AddressResult) => {
    if (result.lat && result.lon) {
      setCoordinates({ lat: parseFloat(result.lat), lon: parseFloat(result.lon) });
    }
  };

  const handleMapLocationSelect = async (lat: number, lon: number) => {
    setCoordinates({ lat, lon });
    // Reverse geocode to get address text
    const details = await mapService.getAddressDetails(lat, lon);
    if (details && details.display_name) {
      setFormData(prev => ({ ...prev, address: details.display_name }));
    }
  };

  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) return;

    // Simulate API delay for UX
    const coupon = await db.validateCoupon(couponCode, subtotal);
    if (coupon) {
      setAppliedCoupon({ code: coupon.code, value: coupon.value, type: coupon.type });
      setCouponCode('');
      toast.success('Áp dụng mã giảm giá thành công!');
    } else {
      setCouponError('Mã giảm giá không hợp lệ hoặc không đủ điều kiện.');
      toast.error('Mã giảm giá không hợp lệ');
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
      // Simulate processing visualization
      await new Promise(r => setTimeout(r, 2000));

      const order = await db.createOrder({
        userId: user.id,
        status: 'Đang xử lý',
        statusStep: 1,
        customer: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          email: user.email,
          note: formData.note
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

      isSubmittingRef.current = true; // Prevent redirect when cart is cleared
      clearCart();
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
    <div className="bg-slate-50 min-h-screen pt-20 pb-20 fade-in">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Minimalist Header Step Indicator */}
        <div className="flex items-center gap-4 mb-8 text-sm font-bold text-slate-400">
          <span className="text-slate-900 cursor-pointer hover:underline" onClick={() => navigate('/')}>Trang chủ</span>
          <i className="fa-solid fa-chevron-right text-[10px]"></i>
          <span className="text-slate-900 cursor-pointer hover:underline" onClick={() => navigate('/cart')}>Giỏ hàng</span>
          <i className="fa-solid fa-chevron-right text-[10px]"></i>
          <span className="text-indigo-600">Thanh toán</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* Left Column: Forms */}
          <div className="lg:col-span-7 space-y-10">

            {/* Shipping Info Section */}
            <section className="bg-white rounded-[2.5rem] p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                  <i className="fa-solid fa-location-dot text-xl"></i>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Thông tin giao hàng</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Nơi nhận bộ sưu tập sách của bạn</p>
                </div>
              </div>

              <div className="space-y-4">
                <FloatingInput
                  label="Họ và tên người nhận"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
                <FloatingInput
                  label="Số điện thoại liên lạc"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
                <div className="grid grid-cols-1 gap-4">
                  <div className="relative z-50">
                    <AddressInput
                      label="Địa chỉ chi tiết"
                      value={formData.address}
                      onChange={(val) => setFormData(prev => ({ ...prev, address: val }))}
                      onSelect={handleAddressSelect}
                    />
                  </div>

                  {/* Map Picker Visual */}
                  <div className="mt-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 ml-1">Vị trí trên bản đồ</p>
                    <MapPicker
                      onLocationSelect={handleMapLocationSelect}
                      initialLat={coordinates?.lat}
                      initialLon={coordinates?.lon}
                    />
                  </div>
                </div>
                <div className="relative group">
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    placeholder=" "
                    className="peer w-full pt-6 pb-2 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-slate-800 h-32 resize-none placeholder-shown:pt-4"
                  />
                  <label className="absolute left-4 top-4 text-slate-400 text-xs font-bold uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:text-indigo-500 pointer-events-none">
                    Ghi chú cho shipper (Tùy chọn)
                  </label>
                </div>
              </div>
            </section>

            {/* Payment Method Section */}
            <section className="bg-white rounded-[2.5rem] p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <i className="fa-solid fa-wallet text-xl"></i>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Phương thức thanh toán</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">An toàn và bảo mật tuyệt đối</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* COD Option */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 group ${paymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-50/50 shadow-md' : 'border-slate-100 hover:border-slate-300 bg-slate-50'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <i className={`fa-solid fa-money-bill-wave text-2xl ${paymentMethod === 'cod' ? 'text-indigo-600' : 'text-slate-300'}`}></i>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-indigo-600' : 'border-slate-300'}`}>
                      {paymentMethod === 'cod' && <div className="w-3 h-3 rounded-full bg-indigo-600"></div>}
                    </div>
                  </div>
                  <p className="font-extrabold text-slate-900 mb-1">Thanh toán khi nhận hàng</p>
                  <p className="text-xs font-bold text-slate-400">COD - Cash on Delivery</p>
                </div>

                {/* Online Payment Option */}
                <div
                  onClick={() => setPaymentMethod('online')}
                  className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 group overflow-hidden ${paymentMethod === 'online' ? 'border-indigo-600 bg-indigo-50/50 shadow-md' : 'border-slate-100 hover:border-slate-300 bg-slate-50'}`}
                >
                  <div className="absolute top-0 right-0 p-2 opacity-10 transform translate-x-4 -translate-y-4">
                    <i className="fa-solid fa-qrcode text-8xl text-indigo-900"></i>
                  </div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <i className={`fa-solid fa-credit-card text-2xl ${paymentMethod === 'online' ? 'text-indigo-600' : 'text-slate-300'}`}></i>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-indigo-600' : 'border-slate-300'}`}>
                      {paymentMethod === 'online' && <div className="w-3 h-3 rounded-full bg-indigo-600"></div>}
                    </div>
                  </div>
                  <p className="font-extrabold text-slate-900 mb-1 relative z-10">Thanh toán Online / QR</p>
                  <p className="text-xs font-bold text-slate-400 relative z-10">ZaloPay / MoMo / Banking</p>

                  {paymentMethod === 'online' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-indigo-200"
                    >
                      <span className="text-[10px] uppercase font-black tracking-wider text-indigo-600 flex items-center gap-1">
                        <i className="fa-solid fa-bolt"></i> Giảm thêm 5% tối đa 50k
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Summary Sticky */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
              {/* Decorative Pattern using CSS radial gradients or similar could go here */}

              {/* Header */}
              <div className="p-8 pb-4 border-b border-slate-50">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center justify-between">
                  Đơn hàng của bạn
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold">{cart.length} món</span>
                </h3>
              </div>

              {/* Items List */}
              <div className="px-8 py-4 max-h-[300px] overflow-y-auto no-scrollbar space-y-5">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-14 h-20 rounded-xl overflow-hidden shadow-sm border border-slate-100 shrink-0 relative">
                      <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 right-0 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-tl-lg">x{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className="font-bold text-sm text-slate-800 line-clamp-2 uppercase tracking-tight leading-snug">{item.title}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">{item.author}</p>
                    </div>
                    <div className="text-right py-1">
                      <p className="font-black text-sm text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Input */}
              <div className="px-8 py-4 bg-slate-50/50 border-t border-b border-slate-50">
                <div className="relative flex gap-2">
                  <input
                    type="text"
                    placeholder="Mã giảm giá (nếu có)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wide outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="bg-slate-900 text-white px-4 rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-indigo-600 transition-colors"
                  >
                    Áp dụng
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="mt-3 flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-ticket text-emerald-600"></i>
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Đã dùng: {appliedCoupon.code}</span>
                    </div>
                    <button onClick={() => setAppliedCoupon(null)} className="text-emerald-400 hover:text-emerald-700">
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-[10px] font-bold text-rose-500 mt-2 ml-1">{couponError}</p>
                )}
              </div>

              {/* Financial Summary */}
              <div className="p-8 space-y-3 bg-white">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-wide text-[11px]">Tạm tính</span>
                  <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-wide text-[11px]">Phí vận chuyển</span>
                  <span className={`font-bold ${shipping === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-600 font-bold uppercase tracking-wide text-[11px]">Giảm giá</span>
                    <span className="font-bold text-emerald-600">-{formatPrice(discount)}</span>
                  </div>
                )}

                <div className="pt-6 mt-3 border-t border-dashed border-slate-200 flex justify-between items-end">
                  <span className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">Tổng cộng</span>
                  <span className="text-3xl font-black text-indigo-600 tracking-tighter leading-none">{formatPrice(total)}</span>
                </div>

                <button
                  onClick={handleCompleteOrder}
                  disabled={isProcessing}
                  className="w-full mt-6 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-emerald-600 hover:shadow-emerald-200 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group active:scale-95 flex items-center justify-center gap-3"
                >
                  {isProcessing ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      Đặt hàng ngay
                      <i className="fa-solid fa-arrow-right-long group-hover:translate-x-1 transition-transform"></i>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 mt-4 opacity-40 grayscale hover:grayscale-0 transition-all cursor-help">
                  <i className="fa-brands fa-cc-visa text-2xl"></i>
                  <i className="fa-brands fa-cc-mastercard text-2xl"></i>
                  <i className="fa-solid fa-shield-halved text-lg"></i>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide ml-1">Bảo mật thanh toán 100%</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
