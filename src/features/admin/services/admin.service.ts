import { adminApi } from '@/services/api';
import { db } from '@/services/db';
import { Author, Book, CategoryInfo, Coupon, Order, SystemLog, UserProfile } from '../types';

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
  getBooks: async (): Promise<Book[]> => db.getBooks(),
  saveBook: async (book: SaveBookPayload) => db.saveBook(book),
  updateBook: async (bookId: string, updates: Partial<Book>) => db.updateBook(bookId, updates),
  deleteBook: async (bookId: string) => db.deleteBook(bookId),
  deleteBooksBulk: async (ids: string[]) => db.deleteBooksBulk(ids),
  deduplicateBooks: async () => db.deduplicateBooks(),
  searchBooksFromTiki: async (query: string, page?: number) => db.searchBooksFromTiki(query, page),
  getBookDetailsFromTiki: async (bookId: string) => db.getBookDetailsFromTiki(bookId),
  getRawTikiData: async (bookId: string) => db.getRawTikiData(bookId),

  getAuthors: async (): Promise<Author[]> => db.getAuthors(),
  saveAuthor: async (author: SaveAuthorPayload) => db.saveAuthor(author),
  deleteAuthor: async (authorId: string) => db.deleteAuthor(authorId),

  getCategories: async (): Promise<CategoryInfo[]> => db.getCategories(),
  createCategory: async (category: CategoryInfo) => db.createCategory(category),
  updateCategory: async (categoryName: string, category: CategoryInfo) => db.updateCategory(categoryName, category),
  deleteCategory: async (categoryName: string) => db.deleteCategory(categoryName),
  seedDatabase: async () => db.seedDatabase(),

  getCoupons: async (): Promise<Coupon[]> => db.getCoupons(),
  saveCoupon: async (coupon: SaveCouponPayload) => db.saveCoupon(coupon),
  deleteCoupon: async (couponId: string) => db.deleteCoupon(couponId),

  getOrders: async (): Promise<Order[]> => {
    const orders = await db.getAllOrders();
    return orders || [];
  },
  getOrderById: async (orderId: string) => db.getOrderWithItems(orderId),
  updateOrderStatus: async (orderId: string, status: string, step: number) => db.updateOrderStatus(orderId, status, step),

  getUsers: async (): Promise<UserProfile[]> => db.getAllUsers(),
  updateUserRole: async (userId: string, role: 'admin' | 'user') => db.updateUserRole(userId, role),
  updateUserStatus: async (userId: string, status: 'active' | 'banned') => db.updateUserStatus(userId, status),
  deleteUser: async (userId: string) => db.deleteUser(userId),

  getLogs: async (): Promise<SystemLog[]> => db.getSystemLogs(),
  getRecentLogs: async (limit: number): Promise<SystemLog[]> => db.getSystemLogs(0, limit),

  syncAllUsersMembership: async () => adminApi.syncAllUsersMembership(),
};
