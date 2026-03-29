import { describe, expect, it } from 'vitest';
import { buildAdminOverviewStats } from './overview';
import { Author, Book, CategoryInfo, Coupon, Order } from '../types';

const books: Book[] = [
  {
    id: 'book-1',
    title: 'Clean Architecture',
    author: 'Author A',
    authorBio: '',
    price: 100000,
    stockQuantity: 4,
    rating: 5,
    cover: '/cover-1.jpg',
    category: 'Tech',
    description: '',
    isbn: 'isbn-1',
    pages: 300,
    publisher: 'NXB',
    publishYear: 2025,
    language: 'vi',
  },
  {
    id: 'book-2',
    title: 'Refactoring',
    author: 'Author B',
    authorBio: '',
    price: 150000,
    stockQuantity: 0,
    rating: 4,
    cover: '/cover-2.jpg',
    category: 'Tech',
    description: '',
    isbn: 'isbn-2',
    pages: 280,
    publisher: 'NXB',
    publishYear: 2024,
    language: 'vi',
  },
];

const orders: Order[] = [
  {
    id: 'order-1',
    userId: 'user-1',
    date: '29/03/2026',
    status: 'Đang xử lý',
    statusStep: 1,
    customer: { name: 'Le', phone: '0123', address: 'HCM', email: 'le@example.com' },
    payment: { method: 'COD', subtotal: 100000, shipping: 0, couponDiscount: 0, total: 100000 },
    createdAt: { toDate: () => new Date() },
    items: [{ bookId: 'book-1', title: 'Clean Architecture', priceAtPurchase: 100000, quantity: 2, cover: '/cover-1.jpg' }],
  },
  {
    id: 'order-2',
    userId: 'user-2',
    date: '28/03/2026',
    status: 'Đã giao',
    statusStep: 3,
    customer: { name: 'Tran', phone: '0456', address: 'HN', email: 'tran@example.com' },
    payment: { method: 'PayOS', subtotal: 150000, shipping: 0, couponDiscount: 0, total: 150000 },
    createdAt: { toDate: () => new Date(Date.now() - 24 * 60 * 60 * 1000) },
    items: [{ bookId: 'book-2', title: 'Refactoring', priceAtPurchase: 150000, quantity: 1, cover: '/cover-2.jpg' }],
  },
];

const categories: CategoryInfo[] = [{ name: 'Tech', icon: 'fa-book', description: 'Technical books' }];
const authors: Author[] = [
  { id: 'author-1', name: 'Author A', bio: '', avatar: '' },
  { id: 'author-2', name: 'Author B', bio: '', avatar: '' },
];
const coupons: Coupon[] = [
  { id: 'coupon-1', code: 'SALE10', discountType: 'percentage', discountValue: 10, minOrderValue: 0, expiryDate: '31/12/2026', usageLimit: 10, usedCount: 1, isActive: true },
];

describe('buildAdminOverviewStats', () => {
  it('aggregates overview metrics from admin domain data', () => {
    const stats = buildAdminOverviewStats({
      orders,
      books,
      categories,
      authors,
      coupons,
      chartView: 'week',
    });

    expect(stats.totalRevenue).toBe(250000);
    expect(stats.totalOrders).toBe(2);
    expect(stats.lowStock).toBe(1);
    expect(stats.outOfStock).toBe(1);
    expect(stats.totalCategories).toBe(1);
    expect(stats.totalAuthors).toBe(2);
    expect(stats.totalCoupons).toBe(1);
    expect(stats.topSellingBooks[0]?.id).toBe('book-1');
    expect(stats.recentOrders).toHaveLength(2);
    expect(stats.revenueByDay).toHaveLength(7);
  });
});
