import { adminApi } from '@/services/api';
import { db } from '@/services/db';
import { Author, Book, CategoryInfo, Coupon, Order, SystemLog, UserProfile } from '../types';

export interface AdminFetchOptions {
  force?: boolean;
}

export interface SaveBookPayload extends Partial<Book> {
  id?: string;
}

export interface SaveAuthorPayload extends Partial<Author> {
  id?: string;
}

export interface SaveCouponPayload extends Partial<Coupon> {
  id?: string;
}

export const adminService = {
  getBooks: async (options?: AdminFetchOptions): Promise<Book[]> => db.getBooks({ force: true, ...options }),
  saveBook: async (book: SaveBookPayload) => db.saveBook(book),
  updateBook: async (bookId: string, updates: Partial<Book>) => db.updateBook(bookId, updates),
  deleteBook: async (bookId: string) => db.deleteBook(bookId),
  deleteBooksBulk: async (ids: string[]) => db.deleteBooksBulk(ids),
  deduplicateBooks: async () => db.deduplicateBooks(),
  searchBooksFromTiki: async (query: string, page?: number) => db.searchBooksFromTiki(query, page),
  getBookDetailsFromTiki: async (bookId: string) => db.getBookDetailsFromTiki(bookId),
  getRawTikiData: async (bookId: string) => db.getRawTikiData(bookId),

  getAuthors: async (options?: AdminFetchOptions): Promise<Author[]> => db.getAuthors({ force: true, ...options }),
  saveAuthor: async (author: SaveAuthorPayload) => db.saveAuthor(author),
  deleteAuthor: async (authorId: string) => db.deleteAuthor(authorId),

  getCategories: async (options?: AdminFetchOptions): Promise<CategoryInfo[]> => db.getCategories({ force: true, ...options }),
  createCategory: async (category: CategoryInfo) => db.createCategory(category),
  updateCategory: async (categoryName: string, category: CategoryInfo) => db.updateCategory(categoryName, category),
  deleteCategory: async (categoryName: string) => db.deleteCategory(categoryName),
  seedDatabase: async () => db.seedDatabase(),

  getCoupons: async (options?: AdminFetchOptions): Promise<Coupon[]> => db.getCoupons({ force: true, ...options }),
  saveCoupon: async (coupon: SaveCouponPayload) => db.saveCoupon(coupon),
  deleteCoupon: async (couponId: string) => db.deleteCoupon(couponId),

  getOrders: async (options?: AdminFetchOptions): Promise<Order[]> => {
    const orders = await db.getAllOrders({ ...options, force: true });
    return orders || [];
  },
  getOrderById: async (orderId: string, options?: AdminFetchOptions) => db.getOrderWithItems(orderId, { ...options, force: true }),
  updateOrderStatus: async (orderId: string, status: string, step: number) => db.updateOrderStatus(orderId, status, step),

  getUsers: async (options?: AdminFetchOptions): Promise<UserProfile[]> => db.getAllUsers({ force: true, ...options }),
  updateUserRole: async (userId: string, role: 'admin' | 'user') => db.updateUserRole(userId, role),
  updateUserStatus: async (userId: string, status: 'active' | 'banned') => db.updateUserStatus(userId, status),
  deleteUser: async (userId: string) => db.deleteUser(userId),

  getLogs: async (options?: AdminFetchOptions): Promise<SystemLog[]> => db.getSystemLogs(undefined, undefined, { force: true, ...options }),
  getRecentLogs: async (limit: number, options?: AdminFetchOptions): Promise<SystemLog[]> => db.getSystemLogs(0, limit, { force: true, ...options }),

  syncAllUsersMembership: async () => adminApi.syncAllUsersMembership(),
  getDashboardSummary: async () => adminApi.getSummary(),
};
