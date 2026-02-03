import React from 'react';

interface DiscountBreakdownItem {
  type: string;
  amount: number;
  reason: string;
}

interface PricingBreakdownProps {
  subtotal: number;
  shipping: number;
  discounts: DiscountBreakdownItem[];
  total: number;
  originalTotal: number;
  loading?: boolean;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

export const PricingBreakdown: React.FC<PricingBreakdownProps> = ({
  subtotal,
  shipping,
  discounts,
  total,
  originalTotal,
  loading
}) => {
  const totalDiscount = discounts.reduce((sum, d) => sum + d.amount, 0);
  const savingsPercent = subtotal > 0 ? ((totalDiscount / subtotal) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200 animate-pulse">
        <div className="h-4 bg-slate-300 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-slate-300 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200 space-y-4">
      <h3 className="font-bold text-lg text-slate-800 border-b pb-3 border-slate-300">
        💰 Chi tiết thanh toán
      </h3>

      {/* Subtotal */}
      <div className="flex justify-between text-slate-700">
        <span>Tạm tính:</span>
        <span className="font-semibold">{formatPrice(subtotal)}</span>
      </div>

      {/* Discounts */}
      {discounts.length > 0 && (
        <div className="space-y-2 border-t border-slate-300 pt-3">
          <div className="text-sm font-semibold text-green-700 flex items-center gap-2">
            <i className="fa-solid fa-gift"></i>
            <span>Ưu đãi của bạn:</span>
          </div>
          {discounts.map((discount, idx) => (
            <div key={idx} className="flex justify-between text-sm pl-6">
              <span className="text-slate-600">
                {discount.reason}
              </span>
              <span className="font-semibold text-green-600">
                -{formatPrice(discount.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Shipping */}
      <div className="flex justify-between text-slate-700">
        <span>Phí vận chuyển:</span>
        <span className={`font-semibold ${shipping === 0 ? 'text-green-600' : ''}`}>
          {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
        </span>
      </div>

      {/* Total */}
      <div className="border-t-2 border-slate-300 pt-4 flex justify-between items-center">
        <div>
          <div className="text-slate-600 text-sm">Tổng cộng:</div>
          {totalDiscount > 0 && (
            <div className="text-green-600 text-xs font-semibold">
              🎉 Tiết kiệm {formatPrice(totalDiscount)} ({savingsPercent}%)
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-600">
            {formatPrice(total)}
          </div>
          {totalDiscount > 0 && (
            <div className="text-xs text-slate-400 line-through">
              {formatPrice(subtotal + shipping)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
