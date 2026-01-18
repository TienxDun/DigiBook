
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
  original_price?: number;
  stock_quantity: number;
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
}

export interface CartItem extends Book {
  quantity: number;
}

export interface CategoryInfo {
  name: string;
  icon: string;
  description: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  bio?: string;
  gender?: string;
  birthday?: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'banned';
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

export interface SystemLog {
  id: string;
  action: string;
  detail: string;
  status: 'SUCCESS' | 'ERROR';
  user: string;
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

export interface AIModelConfig {
  id: string;
  name: string;
  category: string;
  rpm: string;
  tpm: string;
  rpd: string;
}
