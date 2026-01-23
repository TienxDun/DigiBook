
export interface Author {
  id: string;
  name: string;
  bio: string;
  avatar: string;
}

export interface Book {
  id: string;
  title: string;
  author: string; // Tên tác giả (để hiển thị nhanh)
  authorId?: string; // ID liên kết đến bảng Author
  authorBio: string;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  rating: number;
  cover: string;
  category: string;
  description: string;
  isbn: string;
  pages: number;
  publisher: string;
  publishYear: number;
  language: string;
  badge?: string;
  isAvailable?: boolean;
  createdAt?: any;

  // New Fields (Phase 1 Upgrade)
  slug?: string;
  viewCount?: number;
  searchKeywords?: string[];
}

export interface CartItem extends Book {
  quantity: number;
}

export interface CategoryInfo {
  name: string;
  icon: string;
  description: string;
}

export interface Address {
  id: string;
  label: string; // "Nhà riêng", "Công ty"
  recipientName: string;
  phone: string;
  fullAddress: string; // Địa chỉ chi tiết
  isDefault: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  /** @deprecated Use addresses array instead */
  address?: string;
  addresses?: Address[];
  avatar?: string;
  bio?: string;
  gender?: string;
  birthday?: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'banned';
  wishlistIds?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface Review {
  id?: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  createdAt: any;
  isPurchased?: boolean;
}

export interface OrderItem {
  bookId: string;
  title: string;
  priceAtPurchase: number;
  quantity: number;
  cover: string;
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
export type LogCategory = 'AUTH' | 'DATABASE' | 'ADMIN' | 'SYSTEM' | 'AI' | 'ORDER';

export interface SystemLog {
  id?: string;
  action: string;
  detail: string;
  status: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'WARN';
  level: LogLevel;
  category?: LogCategory;
  user: string;
  metadata?: any;
  createdAt: any;
}

export interface Order {
  id: string;
  userId: string;
  date: string;
  status: string;
  statusStep: number;
  customer: {
    name: string;
    phone: string;
    address: string;
    email: string;
    note?: string;
  };
  payment: {
    method: string;
    subtotal: number;
    shipping: number;
    couponDiscount: number;
    total: number;
  };
  createdAt?: any;
  items?: OrderItem[];
}

export interface Coupon {
  id?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}


