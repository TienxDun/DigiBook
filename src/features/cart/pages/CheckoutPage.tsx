
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/features/auth';
import { db } from '@/services/db';
import { ErrorHandler } from '@/services/errorHandler';
import { useCart } from '@/features/cart';
import { motion, AnimatePresence } from 'framer-motion';

import { AddressInput, MapPicker } from '@/shared/components';
import { mapService, AddressResult } from '@/services/map';
import { validateCartStock } from '@/services/db/utils/validateCartStock';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Modern Static Label Input with Icon
const FormInput = ({ label, icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string, icon?: string }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative group">
      <input
        {...props}
        className={`w-full py-2.5 ${icon ? 'pl-9' : 'px-3'} pr-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-slate-800 text-sm shadow-sm hover:border-indigo-300 ${props.className}`}
      />
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <i className={`fa-solid ${icon} text-xs`}></i>
        </div>
      )}
    </div>
  </div>
);

const CheckoutPage: React.FC = () => {
  const { cart, clearCart, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAuth();

  // States
  const isSubmittingRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidatingStock, setIsValidatingStock] = useState(false);
  const [stockInfo, setStockInfo] = useState<Record<string, number>>({});
  const [hasStockErrors, setHasStockErrors] = useState(false);
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

  // Validate stock khi load trang checkout
  useEffect(() => {
    const checkStockOnLoad = async () => {
      if (cart.length === 0) return;

      setIsValidatingStock(true);
      const validation = await validateCartStock(cart);
      setIsValidatingStock(false);

      // Cập nhật thông tin số lượng kho
      const stockData: Record<string, number> = {};
      for (const item of cart) {
        const found = validation.errors.find(err => err.bookId === item.id);
        if (found) {
          stockData[item.id] = found.availableQuantity;
        } else {
          // Nếu không có lỗi, lấy thông tin từ DB
          const book = await db.getBookById(item.id);
          stockData[item.id] = book?.stockQuantity || 0;
        }
      }
      setStockInfo(stockData);
      setHasStockErrors(!validation.isValid);

      if (!validation.isValid && validation.errors.length > 0) {
        const errorMessages = validation.errors.map(err => {
          if (err.type === 'OUT_OF_STOCK') {
            return `- ${err.title}: Đã hết hàng`;
          } else {
            return `- ${err.title}: Chỉ còn ${err.availableQuantity} sản phẩm (bạn đang chọn ${err.requestedQuantity})`;
          }
        }).join('\n');

        toast.error(
          <div className="flex flex-col gap-2">
            <p className="font-bold">Số lượng trong kho đã thay đổi!</p>
            <div className="text-xs whitespace-pre-line">{errorMessages}</div>
            <p className="text-xs font-semibold">Giỏ hàng sẽ được cập nhật tự động.</p>
          </div>,
          { duration: 6000 }
        );

        // Tự động cập nhật giỏ hàng
        validation.errors.forEach(err => {
          if (err.type === 'OUT_OF_STOCK') {
            removeFromCart(err.bookId);
          } else {
            // Cập nhật số lượng về số lượng tối đa có thể
            const item = cart.find(i => i.id === err.bookId);
            if (item) {
              const deltaNeeded = err.availableQuantity - item.quantity;
              updateQuantity(err.bookId, deltaNeeded);
            }
          }
        });
      }
    };

    checkStockOnLoad();
  }, []); // Chạy 1 lần khi mount

  // Revalidate khi cart thay đổi (sau khi auto-update)
  useEffect(() => {
    const revalidateStock = async () => {
      if (cart.length === 0) {
        setStockInfo({});
        setHasStockErrors(false);
        return;
      }

      const validation = await validateCartStock(cart);

      // Cập nhật stockInfo
      const stockData: Record<string, number> = {};
      for (const item of cart) {
        const found = validation.errors.find(err => err.bookId === item.id);
        if (found) {
          stockData[item.id] = found.availableQuantity;
        } else {
          const book = await db.getBookById(item.id);
          stockData[item.id] = book?.stockQuantity || 0;
        }
      }
      setStockInfo(stockData);
      setHasStockErrors(!validation.isValid);
    };

    // Chỉ revalidate nếu không phải lần đầu load
    const timer = setTimeout(() => {
      revalidateStock();
    }, 500);

    return () => clearTimeout(timer);
  }, [cart]);

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
      // Kiểm tra lại số lượng kho trước khi đặt hàng
      const validation = await validateCartStock(cart);
      if (!validation.isValid) {
        setIsProcessing(false);
        const errorMsg = validation.errors.map(err =>
          err.type === 'OUT_OF_STOCK'
            ? `${err.title}: Đã hết hàng`
            : `${err.title}: Chỉ còn ${err.availableQuantity}/${err.requestedQuantity}`
        ).join(', ');
        toast.error(
          <div className="flex flex-col gap-1">
            <p className="font-bold">Không thể đặt hàng!</p>
            <p className="text-xs">{errorMsg}</p>
          </div>,
          { duration: 5000 }
        );
        return;
      }

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
    <div className="bg-slate-50 min-h-screen pt-20 pb-10 xl:overflow-hidden fade-in selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 h-full flex flex-col">

        {/* Modern Breadcrumbs - Compact */}
        <nav className="flex items-center gap-2 mb-4 xl:mb-6 text-xs font-medium shrink-0">
          <button onClick={() => navigate('/')} className="text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
            <i className="fa-solid fa-house opacity-70"></i>
            <span className="hidden sm:inline">Trang chủ</span>
          </button>
          <i className="fa-solid fa-chevron-right text-[8px] text-slate-300"></i>
          <button onClick={() => navigate('/cart')} className="text-slate-500 hover:text-indigo-600 transition-colors">
            Giỏ hàng
          </button>
          <i className="fa-solid fa-chevron-right text-[8px] text-slate-300"></i>
          <span className="text-indigo-600 font-bold px-2 py-0.5 bg-indigo-50 rounded-full text-[10px] uppercase tracking-wide">
            Thanh toán
          </span>
        </nav>

        {/* Main Content Grid - 3 Columns Layout for XL (Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-4 lg:gap-6 xl:gap-6 items-start h-full pb-2">

          {/* Column 1: Shipping Info (Left) */}
          <div className="lg:col-span-7 xl:col-span-4 flex flex-col gap-4 h-full xl:overflow-hidden">
            <section className="bg-white/80 backdrop-blur-md rounded-2xl p-4 xl:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-500 flex flex-col xl:h-full">
              <div className="flex items-center gap-3 mb-3 relative shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <i className="fa-solid fa-truck-fast text-sm"></i>
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800 tracking-tight">Thông tin giao hàng</h2>
                  <p className="text-[10px] font-medium text-slate-500">Nơi nhận bộ sưu tập sách</p>
                </div>
              </div>

              <div className="space-y-4 relative z-10 xl:overflow-y-auto xl:pr-1 custom-scrollbar flex-1 pb-1">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormInput
                    label="Họ và tên"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    icon="fa-user"
                  />
                  <FormInput
                    label="Số điện thoại"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    icon="fa-phone"
                  />
                </div>

                <div className="space-y-4">
                  <div className="relative z-20">
                    <AddressInput
                      label="Địa chỉ chi tiết"
                      value={formData.address}
                      onChange={(val) => setFormData(prev => ({ ...prev, address: val }))}
                      onSelect={handleAddressSelect}
                    />
                  </div>

                  {/* Map Picker Visual - Compact */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <i className="fa-solid fa-map-location text-indigo-500 text-[10px]"></i>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Ghim vị trí</p>
                    </div>
                    <div className="rounded-lg overflow-hidden shadow-sm border border-slate-200 h-28 xl:h-32">
                      <MapPicker
                        onLocationSelect={handleMapLocationSelect}
                        initialLat={coordinates?.lat}
                        initialLon={coordinates?.lon}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Ghi chú (Tùy chọn)</label>
                  <div className="relative group">
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      className="w-full py-2.5 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-800 text-sm shadow-sm hover:border-indigo-300 h-16 xl:h-20 resize-none"
                    />
                    <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      <i className="fa-solid fa-message text-xs"></i>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Column 2: Payment Method (Middle) */}
          <div className="lg:col-span-5 xl:col-span-4 h-full xl:overflow-hidden">
            <section className="bg-white/80 backdrop-blur-md rounded-2xl p-4 xl:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative overflow-hidden flex flex-col xl:h-full">
              <div className="flex items-center gap-3 mb-3 shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200 -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <i className="fa-solid fa-wallet text-sm"></i>
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800 tracking-tight">Thanh toán</h2>
                  <p className="text-[10px] font-medium text-slate-500">An toàn & Bảo mật</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 xl:overflow-y-auto xl:pr-1 custom-scrollbar flex-1 content-start">
                {/* COD Option */}
                <label className={`relative flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 group ${paymentMethod === 'cod' ? 'border-indigo-500 bg-indigo-50/50 shadow-md' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mr-3 transition-colors shrink-0 ${paymentMethod === 'cod' ? 'border-indigo-600' : 'border-slate-300'}`}>
                    {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm mr-3 shrink-0">
                    <i className="fa-solid fa-hand-holding-dollar"></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-xs">Thanh toán khi nhận hàng</p>
                    <p className="text-[10px] text-slate-500 font-medium">COD - Cash on Delivery</p>
                  </div>
                </label>

                {/* Online Payment Option */}
                <div className="relative">
                  <label className={`relative flex items-center p-3 rounded-t-xl border-2 cursor-pointer transition-all duration-300 group z-10 ${paymentMethod === 'online' ? 'border-indigo-500 bg-indigo-50/50 shadow-md rounded-b-none border-b-0' : 'border-slate-100 hover:border-slate-200 bg-white rounded-b-xl'}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                      className="hidden"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mr-3 transition-colors shrink-0 ${paymentMethod === 'online' ? 'border-indigo-600' : 'border-slate-300'}`}>
                      {paymentMethod === 'online' && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm mr-3 shrink-0">
                      <i className="fa-solid fa-building-columns"></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 text-xs">Chuyển khoản / QR</p>
                        <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                          -5%
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">Mọi ngân hàng & Ví điện tử</p>
                    </div>
                  </label>

                  <AnimatePresence>
                    {paymentMethod === 'online' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="bg-indigo-50/30 border-2 border-t-0 border-indigo-500 rounded-b-xl p-3 pl-[3rem] -mt-[2px] relative z-0"
                      >
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                          {/* Brand Icons Small */}
                          <div className="h-5 px-2 bg-white border border-slate-200 rounded flex items-center text-[9px] font-black text-blue-600 italic">ZaloPay</div>
                          <div className="h-5 px-2 bg-white border border-slate-200 rounded flex items-center text-[9px] font-black text-pink-600">MoMo</div>
                          <div className="h-5 px-2 bg-white border border-slate-200 rounded flex items-center text-[9px] font-bold text-green-600">VCB</div>
                        </div>
                        <p className="text-[9px] text-indigo-600 font-bold mt-2">
                          <i className="fa-solid fa-circle-info mr-1"></i>
                          Quét QR sau khi đặt
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </section>
          </div>

          {/* Column 3: Order Summary (Right) */}
          <div className="lg:col-span-12 xl:col-span-4 h-full xl:overflow-hidden">
            <div className="bg-white rounded-[1.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden relative flex flex-col xl:h-full">
              {/* Receipt Top Pattern */}
              <div className="h-1.5 bg-gradient-to-r from-red-400 via-purple-400 to-indigo-400 shrink-0"></div>

              <div className="p-5 xl:p-6 pb-2 border-b border-slate-50 shrink-0">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                  <i className="fa-solid fa-receipt text-slate-300"></i>
                  Đơn hàng
                  <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ml-auto">{cart.length}</span>
                </h3>
              </div>

              {/* Items List - Flexible Height */}
              <div className="px-5 xl:px-6 py-3 overflow-y-auto custom-scrollbar flex-1 space-y-4 max-h-[25vh] xl:max-h-none">
                {cart.map(item => {
                  const availableStock = stockInfo[item.id];
                  const isLowStock = availableStock !== undefined && availableStock < item.quantity * 2;
                  const isOutOfStock = availableStock !== undefined && availableStock < item.quantity;

                  return (
                    <div key={item.id} className="flex gap-3 group">
                      <div className="w-12 h-16 rounded-lg overflow-hidden shadow-md border border-slate-100 shrink-0 relative group-hover:scale-105 transition-transform duration-300">
                        <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                        <span className="absolute top-0.5 left-0.5 bg-black/70 text-white text-[8px] font-bold px-1 rounded backdrop-blur-sm">x{item.quantity}</span>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="font-bold text-slate-800 text-xs leading-tight mb-0.5 line-clamp-2 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{item.author}</p>
                        {availableStock !== undefined && (
                          <div className={`text-[9px] font-bold mt-0.5 flex items-center gap-1 ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-500' : 'text-emerald-600'
                            }`}>
                            <i className={`fa-solid ${isOutOfStock ? 'fa-circle-exclamation' : 'fa-box'}`}></i>
                            <span>Kho: {availableStock}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex flex-col justify-center">
                        <p className="font-black text-slate-900 text-sm">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon & Bottom Fixed section */}
              <div className="bg-white shrink-0">
                {/* Coupon Input */}
                <div className="px-5 xl:px-6 py-3 bg-slate-50/50 border-t border-b border-slate-50">
                  <div className="relative flex gap-2">
                    <input
                      type="text"
                      placeholder="Mã giảm giá"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode}
                      className="bg-slate-900 text-white px-3 rounded-lg font-bold text-[10px] uppercase tracking-wide hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="mt-2 flex items-center justify-between p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                        <i className="fa-solid fa-check text-emerald-600"></i> {appliedCoupon.code}
                      </span>
                      <button onClick={() => setAppliedCoupon(null)} className="text-emerald-400 hover:text-emerald-700">
                        <i className="fa-solid fa-xmark text-xs"></i>
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-[10px] font-bold text-rose-500 mt-1">{couponError}</p>}
                </div>

                {/* Financial Summary */}
                <div className="p-5 xl:p-6 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wide">Tạm tính</span>
                    <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wide">Vận chuyển</span>
                    <span className={`font-bold ${shipping === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-600 font-bold uppercase tracking-wide">Giảm giá</span>
                      <span className="font-bold text-emerald-600">-{formatPrice(discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-end pt-3 mt-2 border-t border-dashed border-slate-200">
                    <span className="font-black text-slate-900 uppercase tracking-wide text-xs">Tổng cộng</span>
                    <div className="text-right">
                      <span className="block text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight leading-none">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCompleteOrder}
                    disabled={isProcessing || hasStockErrors || isValidatingStock}
                    className={`w-full mt-3 py-4 rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-lg transition-all duration-300 disabled:cursor-not-allowed group active:scale-95 flex items-center justify-center gap-2 ${hasStockErrors
                      ? 'bg-red-500 text-white opacity-60 shadow-red-200'
                      : 'bg-slate-900 text-white shadow-slate-200 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-200 disabled:opacity-70'
                      }`}
                  >
                    {isProcessing ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                        Xử lý...
                      </>
                    ) : hasStockErrors ? (
                      <>
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        Không đủ hàng trong kho
                      </>
                    ) : isValidatingStock ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                        Kiểm tra kho...
                      </>
                    ) : (
                      <>
                        Đặt hàng ngay
                        <i className="fa-solid fa-arrow-right-long group-hover:translate-x-1 transition-transform"></i>
                      </>
                    )}
                  </button>

                  {hasStockErrors && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-[10px] font-bold text-red-700 text-center flex items-center justify-center gap-1">
                        <i className="fa-solid fa-circle-info"></i>
                        Vui lòng cập nhật số lượng trước khi đặt hàng
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3 mt-3 opacity-40">
                    <i className="fa-brands fa-cc-visa text-lg"></i>
                    <i className="fa-brands fa-cc-mastercard text-lg"></i>
                    <span className="text-[8px] font-bold text-slate-500 uppercase">256-bit SSL Secure</span>
                  </div>
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
