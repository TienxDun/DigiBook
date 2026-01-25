
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from '@/shared/utils/toast';
import { useAuth } from '@/features/auth';
import { db } from '@/services/db';
import { ErrorHandler } from '@/services/errorHandler';
import { useCart } from '@/features/cart';
import { motion, AnimatePresence } from 'framer-motion';
import { Address } from '@/shared/types';
import { AddressList, AddressFormModal } from '@/features/auth';

import { validateCartStock } from '@/services/db/utils/validateCartStock';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

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

  // Address Management
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  // Order Form Data - Will be auto-filled from selected address
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    note: ''
  });

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, value: number, type: 'percentage' | 'fixed' } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // 1. Load User Addresses & Profile
  const fetchUserData = async () => {
    if (!user) return;
    try {
      const profile = await db.getUserProfile(user.id);
      if (profile?.addresses && profile.addresses.length > 0) {
        setAddresses(profile.addresses);
        // Auto-select default address
        const defaultAddr = profile.addresses.find(a => a.isDefault) || profile.addresses[0];
        handleSelectAddress(defaultAddr);
      } else {
        // Fallback or empty state
        setAddresses([]);
      }
    } catch (e) {
      console.error("Error fetching user data:", e);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  // Handle Address Selection
  const handleSelectAddress = (addr: Address) => {
    setSelectedAddrId(addr.id);
    setFormData(prev => ({
      ...prev,
      name: addr.recipientName,
      phone: addr.phone,
      address: addr.fullAddress
    }));
  };

  // Address CRUD Handlers
  const handleAddAddress = async (newAddr: any) => {
    if (!user) return;
    try {
      await db.addUserAddress(user.id, newAddr);
      await fetchUserData(); // Refresh list
      toast.success('Thêm địa chỉ thành công');
    } catch (error) {
      ErrorHandler.handle(error, 'thêm địa chỉ');
    }
  };

  const handleUpdateAddress = async (addr: any) => {
    if (!user) return;
    try {
      await db.updateUserAddress(user.id, addr);
      await fetchUserData();
      toast.success('Cập nhật địa chỉ thành công');
    } catch (error) {
      ErrorHandler.handle(error, 'cập nhật địa chỉ');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    try {
      await db.removeUserAddress(user.id, id);
      await fetchUserData();
      if (selectedAddrId === id) {
        setFormData(prev => ({ ...prev, name: '', phone: '', address: '' }));
        setSelectedAddrId(null);
      }
      toast.success('Đã xóa địa chỉ');
    } catch (error) {
      ErrorHandler.handle(error, 'xóa địa chỉ');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!user) return;
    try {
      await db.setDefaultAddress(user.id, id);
      await fetchUserData();
      toast.success('Đã thay đổi địa chỉ mặc định');
    } catch (error) {
      ErrorHandler.handle(error, 'đặt địa chỉ mặc định');
    }
  };


  // 2. Validate stock logic (Unchanged mostly)
  useEffect(() => {
    const checkStockOnLoad = async () => {
      if (cart.length === 0) return;

      setIsValidatingStock(true);
      const validation = await validateCartStock(cart);
      setIsValidatingStock(false);

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

      if (!validation.isValid && validation.errors.length > 0) {
        const errorMessages = validation.errors.map(err => {
          if (err.type === 'OUT_OF_STOCK') {
            return `- ${err.title}: Đã hết hàng`;
          } else {
            return `- ${err.title}: Chỉ còn ${err.availableQuantity} sản phẩm`;
          }
        }).join('\n');

        toast.error(
          <div className="flex flex-col gap-2">
            <p className="font-bold">Số lượng trong kho đã thay đổi!</p>
            <div className="text-xs whitespace-pre-line">{errorMessages}</div>
          </div>,
          { duration: 6000 }
        );

        validation.errors.forEach(err => {
          if (err.type === 'OUT_OF_STOCK') {
            removeFromCart(err.bookId);
          } else {
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
  }, []);

  useEffect(() => {
    // Only redirect if cart is empty AND we are not currently submitting
    if (cart.length === 0 && !isSubmittingRef.current) navigate('/');
  }, [cart, navigate]);


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

  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) return;

    setIsApplyingCoupon(true);
    try {
      const coupon = await db.validateCoupon(couponCode, subtotal);
      // Simulate a small delay for UX so spinner is visible
      await new Promise(r => setTimeout(r, 600));

      if (coupon) {
        setAppliedCoupon({ code: coupon.code, value: coupon.value, type: coupon.type });
        setCouponCode('');
        toast.success('Áp dụng mã giảm giá thành công!');
      } else {
        setCouponError('Mã giảm giá không hợp lệ hoặc không đủ điều kiện.');
        toast.error('Mã giảm giá không hợp lệ');
      }
    } catch (e) {
      setCouponError('Lỗi khi kiểm tra mã.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleCouponKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  const handleCompleteOrder = async () => {
    if (!user) { setShowLoginModal(true); return; }

    // Validation
    if (!formData.name || !formData.phone || !formData.address) {
      if (addresses.length === 0) {
        toast.error('Vui lòng thêm địa chỉ giao hàng.');
      } else if (!selectedAddrId) {
        toast.error('Vui lòng chọn địa chỉ giao hàng.');
      } else {
        toast.error('Thông tin giao hàng không hợp lệ.');
      }
      return;
    }

    setIsProcessing(true);

    try {
      // Stock check
      const validation = await validateCartStock(cart);
      if (!validation.isValid) {
        setIsProcessing(false);
        toast.error('Có thay đổi về tồn kho. Vui lòng kiểm tra lại giỏ hàng.');
        return;
      }

      await new Promise(r => setTimeout(r, 1500)); // UX delay

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

      isSubmittingRef.current = true;
      clearCart();
      setIsProcessing(false);
      navigate('/order-success', { state: { orderId: order.id } });
    } catch (error: any) {
      if (error.code === 'OUT_OF_STOCK') {
        toast.error(`KHO HÀNG THAY ĐỔI: ${error.message}.`);
      } else {
        ErrorHandler.handle(error, 'thanh toán');
      }
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-20 pb-32 lg:pb-10 xl:overflow-hidden fade-in selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 h-full flex flex-col">

        {/* Breadcrumbs */}
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-4 lg:gap-6 xl:gap-6 items-start h-full pb-2">

          {/* Column 1: Shipping Info (Addresses) */}
          <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-4 h-full xl:overflow-hidden">
            <section className="bg-white/80 backdrop-blur-md rounded-2xl p-4 xl:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-500 flex flex-col xl:h-full">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <i className="fa-solid fa-map-location-dot text-sm"></i>
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800 tracking-tight">Địa chỉ nhận hàng</h2>
                    <p className="text-[10px] font-medium text-slate-500">Chọn địa chỉ đã lưu</p>
                  </div>
                </div>
                <button
                  onClick={() => { setEditingAddress(null); setShowAddressModal(true); }}
                  className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all shadow-sm"
                  title="Thêm địa chỉ mới"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                <AddressList
                  addresses={addresses}
                  selectable={true}
                  selectedId={selectedAddrId || undefined}
                  onSelect={handleSelectAddress}
                  onDelete={handleDeleteAddress}
                  onSetDefault={handleSetDefaultAddress}
                  onEdit={(addr) => { setEditingAddress(addr); setShowAddressModal(true); }}
                />

                <div className="pt-4 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Ghi chú vận chuyển (Tùy chọn)</label>
                    <div className="relative group">
                      <textarea
                        name="note"
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        placeholder="Lời nhắn cho shipper..."
                        className="w-full py-2.5 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-800 text-sm shadow-sm hover:border-indigo-300 h-16 xl:h-20 resize-none"
                      />
                      <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <i className="fa-solid fa-message text-xs"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Column 2: Payment Method */}
          <div className="lg:col-span-6 xl:col-span-4 h-full xl:overflow-hidden">
            <section className="bg-white/80 backdrop-blur-md rounded-2xl p-4 xl:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative overflow-hidden flex flex-col xl:h-full">
              <div className="flex items-center gap-3 mb-3 shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
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

          {/* Column 3: Order Summary */}
          <div className="lg:col-span-6 xl:col-span-4 h-full xl:overflow-hidden">
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

              {/* Items List */}
              <div className="px-5 xl:px-6 py-3 overflow-y-auto custom-scrollbar flex-1 space-y-4 max-h-[30vh] xl:max-h-none">
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

              {/* Financial & Actions */}
              <div className="bg-white shrink-0">
                <div className="px-5 xl:px-6 py-3 bg-slate-50/50 border-t border-b border-slate-50">
                  <div className="relative flex gap-2">
                    <input
                      type="text"
                      placeholder="Mã giảm giá"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyDown={handleCouponKeyDown}
                      disabled={isApplyingCoupon}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide outline-none focus:border-indigo-500 transition-colors disabled:opacity-70"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode || isApplyingCoupon}
                      className="bg-slate-900 text-white px-3 rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-indigo-600 disabled:opacity-50 transition-all min-w-[80px] flex items-center justify-center gap-1"
                    >
                      {isApplyingCoupon && <i className="fa-solid fa-circle-notch fa-spin text-[10px]"></i>}
                      {isApplyingCoupon ? 'Kiểm tra' : 'Áp dụng'}
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

      <AddressFormModal
        isOpen={showAddressModal}
        onClose={() => {
          setShowAddressModal(false);
          setEditingAddress(null);
        }}
        onSave={async (data) => {
          if (editingAddress) {
            await handleUpdateAddress({ ...data, id: editingAddress.id });
          } else {
            await handleAddAddress(data);
          }
        }}
        initialData={editingAddress}
      />
    </div>
  );
};

export default CheckoutPage;
