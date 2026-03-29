/**
 * @file index.ts
 * @description Thin facade that keeps legacy callers on a single API-backed adapter.
 */

import { logActivity } from './core';
import { Author } from '@/shared/types';

// Build-in APIs
import { booksApi } from '../api/modules/books.api';
import { categoriesApi } from '../api/modules/categories.api';
import { authorsApi } from '../api/modules/authors.api';
import { couponsApi } from '../api/modules/coupons.api';
import { ordersApi } from '../api/modules/orders.api';
import { usersApi } from '../api/modules/users.api';
import { logsApi } from '../api/modules/logs.api';
import { reviewsApi } from '../api/modules/reviews.api';
import { tikiApi } from '../api/modules/tiki.api';
import { telegramApi } from '../api/modules/telegram.api';
import { cartsApi } from '../api/modules/carts.api';
import { normalizeBookForPersistence } from '../api/modules/tikiNormalizer';

import { Order, OrderItem, Review, SystemLog } from '@/shared/types/';

const AUTO_AUTHOR_SKIP_NAMES = new Set(['nhiều tác giả', 'vo danh', 'vô danh']);

function normalizeAuthorKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function shouldAutoCreateAuthor(name: string): boolean {
  const normalized = normalizeAuthorKey(name);
  return Boolean(normalized) && !AUTO_AUTHOR_SKIP_NAMES.has(normalized);
}

function buildAuthorAvatar(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
}

class DataService {
  // Core & Base Utility
  logActivity = logActivity;
  testConnection = async () => true;

  // Books
  getBooks = booksApi.getAll;
  getBooksPaginated = booksApi.getPaginated;
  getBookById = booksApi.getById;
  getBookBySlug = booksApi.getBySlug;
  getBooksByAuthor = booksApi.searchByAuthor;
  getRelatedBooks = booksApi.getRelated;
  
  async saveBook(book: any) {
    const [categories, authors] = await Promise.all([
      categoriesApi.getAll(),
      authorsApi.getAll(),
    ]);
    const normalizedBook = normalizeBookForPersistence(book, {
      internalCategories: categories.map((category) => category.name),
      authors,
    });

    // Ưu tiên authorId đã được resolve bởi tiki.api trước (nếu có)
    const incomingAuthorId = book.authorId || normalizedBook.authorId;

    if (incomingAuthorId) {
      // authorId đã có sẵn (được gán từ tiki.api.ts hoặc Admin form)
      normalizedBook.authorId = incomingAuthorId;
    } else {
      // Tìm tác giả theo tên (chính xác) trong DB hiện tại
      // Xử lý cả trường hợp nhiều tác giả: lấy tên đầu tiên để tìm
      const primaryAuthorName = (normalizedBook.author || '').split(',')[0].trim();
      const matchedAuthor = authors.find(
        (author) => normalizeAuthorKey(author.name) === normalizeAuthorKey(primaryAuthorName)
      );

      if (matchedAuthor) {
        normalizedBook.authorId = matchedAuthor.id;
        normalizedBook.authorBio = normalizedBook.authorBio || matchedAuthor.bio || '';
        console.log(`[saveBook] Matched author: "${matchedAuthor.name}" (${matchedAuthor.id})`);
      } else if (shouldAutoCreateAuthor(primaryAuthorName)) {
        // Tạo tác giả mới nếu chưa tồn tại
        console.log(`[saveBook] Creating new author: "${normalizedBook.author}"`);
        const createdAuthorId = await authorsApi.create({
          name: normalizedBook.author!,
          bio: normalizedBook.authorBio || '',
          avatar: buildAuthorAvatar(normalizedBook.author!),
        });

        if (createdAuthorId) {
          normalizedBook.authorId = createdAuthorId;
          console.log(`[saveBook] Created author with ID: ${createdAuthorId}`);
        }
      }
    }

    if (normalizedBook.id) {
       let existingBook = await booksApi.getById(normalizedBook.id);
       
       // Thử tìm theo ISBN nếu không tìm thấy theo ID (cho sự chuyển dịch ID Tiki -> ID book-...)
       if (!existingBook && normalizedBook.isbn) {
         existingBook = await booksApi.getByIsbn(normalizedBook.isbn);
       }

       if (existingBook) {
         await booksApi.update(existingBook.id, normalizedBook);
         return existingBook.id;
       }
    }
    return await booksApi.create(normalizedBook as Omit<any, 'id'>);
  }

  updateBook = booksApi.update;
  deleteBook = booksApi.delete;
  incrementBookView = booksApi.incrementViewCount;
  getBooksByIds = booksApi.getBooksByIds;
  
  async deleteBooksBulk(ids: string[]) {
    for (const id of ids) {
      await booksApi.delete(id);
    }
  }

  async deduplicateBooks() {
    return { deletedCount: 0 };
  }

  
  // Tiki integrations
  searchBooksFromTiki = tikiApi.searchBooksFromTiki;
  getBookDetailsFromTiki = tikiApi.getBookDetailsFromTiki;
  getRawTikiData = tikiApi.getRawTikiData;

  // Categories
  getCategories = categoriesApi.getAll;
  getCategoryByName = categoriesApi.getByName;
  createCategory = categoriesApi.create;
  updateCategory = categoriesApi.update;
  deleteCategory = categoriesApi.delete;
  
  // Admin uses db.saveCategory optionally
  async saveCategory(category: any) {
    const categoryKey = category.name || category.id;
    if (categoryKey) {
       const existingCategory = await categoriesApi.getByName(categoryKey);
       if (existingCategory) {
       await categoriesApi.update(categoryKey, category);
       return categoryKey;
       }
    }
    const created = await categoriesApi.create({ ...category, name: categoryKey });
    return created?.name || null;
  }

  async deleteCategoriesBulk(ids: string[]) {
    for (const id of ids) {
      await categoriesApi.delete(id);
    }
  }

  // Authors
  getAuthors = authorsApi.getAll;
  getAuthorById = authorsApi.getById;
  searchAuthorsByName = authorsApi.searchByName;
  createAuthor = authorsApi.create;
  updateAuthor = authorsApi.update;
  deleteAuthor = authorsApi.delete;
  
  async getAuthorByName(name: string): Promise<Author | null> {
    const results = await authorsApi.searchByName(name);
    return results.length > 0 ? results[0] : null;
  }
  
  async saveAuthor(author: any) {
    if (author.id) {
       const existingAuthor = await authorsApi.getById(author.id);
       if (existingAuthor) {
         await authorsApi.update(author.id, author);
         return author.id;
       }
    }
    return await authorsApi.create(author);
  }

  async deleteAuthorsBulk(ids: string[]) {
    for (const id of ids) {
      await authorsApi.delete(id);
    }
  }

  // Orders
  createOrder = ordersApi.create;
  getAllOrders = ordersApi.getAll;
  getOrdersByUserId = ordersApi.getByUserId;
  getOrderWithItems = ordersApi.getById;
  updateOrderStatus = ordersApi.updateStatus;
  checkIfUserPurchasedBook = ordersApi.hasPurchasedBook;

  // Carts
  syncUserCart = cartsApi.updateCart;
  getUserCart = cartsApi.getCart;

  // Users
  getUserProfile = usersApi.getProfile;
  updateUserProfile = usersApi.updateProfile;
  updateWishlist = usersApi.updateWishlist;
  getAllUsers = usersApi.getAll;
  deleteUser = usersApi.delete;
  
  async updateUserRole(userId: string, role: string) {
    return await usersApi.updateRole(userId, role as 'user' | 'admin');
  }

  async updateUserStatus(userId: string, status: 'active' | 'banned') {
    return await usersApi.updateStatus(userId, status);
  }

  addUserAddress = usersApi.addAddress;
  updateUserAddress = usersApi.updateAddress;
  removeUserAddress = usersApi.deleteAddress;
  setDefaultAddress = usersApi.setDefaultAddress;

  // Telegram
  createTelegramLinkToken = telegramApi.createLinkToken;
  getTelegramLinkStatus = telegramApi.getLinkStatus;
  unlinkTelegram = telegramApi.unlink;

  // Coupons
  getCoupons = couponsApi.getAll;
  getCouponByCode = couponsApi.getByCode;
  getActiveCoupons = couponsApi.getActive;
  validateCoupon = couponsApi.validate;
  incrementCouponUsage = couponsApi.incrementUsage;
  saveCoupon =  async (coupon: any) => {
    if (coupon.id) {
       const existingCoupon = await couponsApi.getById(coupon.id);
       if (existingCoupon) {
         await couponsApi.update(coupon.id, coupon);
         return coupon.id;
       }
    }
    return await couponsApi.create(coupon);
  }
  deleteCoupon = couponsApi.delete;

  // Reviews
  getReviewsByBookId = reviewsApi.getByBookId;
  getReviewsByUserId = reviewsApi.getByUserId;
  getAverageRating = reviewsApi.getAverageRating;
  addReview = reviewsApi.create;
  updateReview = reviewsApi.update;
  deleteReview = reviewsApi.delete;

  // System Logs
  async getSystemLogs(offset?: number, limit?: number, options?: { force?: boolean }) {
    if (limit) {
      return await logsApi.getRecent(limit, options);
    }
    return await logsApi.getAll(options);
  }
  
  getLogsByStatus = logsApi.getByStatus;
  getLogsByUser = logsApi.getByUser;
  getLogsByAction = logsApi.getByAction;
  getLogStatistics = logsApi.getStatistics;
  getRecentLogs = logsApi.getRecent;
  deleteOldLogs = logsApi.deleteOld;

  // Mock seed database to satisfy AdminCategories.tsx
  async seedDatabase() {
    return { success: true, count: 0, msg: "Tự động quản lý bằng API" };
  }

  constructor() {}
}

export const db = new DataService();

export type { Order, OrderItem, Review, SystemLog };
