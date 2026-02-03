import { Book, UserProfile, Review, Coupon, CategoryInfo, Author, SystemLog } from '@/shared/types';

// Firebase services (existing)
import * as firebaseBooks from './modules/books.service';
import * as firebaseUsers from './modules/users.service';
import * as firebaseOrders from './modules/orders.service';
import * as firebaseReviews from './modules/reviews.service';
import * as firebaseCoupons from './modules/coupons.service';
import * as firebaseSystem from './modules/system.service';
import * as firebaseMetadata from './modules/metadata.service';

// API services (new)
import { 
  booksApi, 
  usersApi, 
  ordersApi, 
  reviewsApi, 
  couponsApi, 
  categoriesApi,
  authorsApi,
  logsApi,
  type Order, 
  type OrderItem 
} from '../api';

// Feature flag
const USE_API = import.meta.env.VITE_USE_API === 'true';

console.log(`📡 Service Mode: ${USE_API ? '🔥 API Backend' : '📱 Firebase Direct'}`);

// Books Service Adapter
export const booksService = {
  async getBooks(): Promise<Book[]> {
    return USE_API 
      ? await booksApi.getAll() 
      : await firebaseBooks.getBooks();
  },

  async getBookById(id: string): Promise<Book | undefined> {
    const book = USE_API 
      ? await booksApi.getById(id) 
      : await firebaseBooks.getBookById(id);
    return book || undefined;
  },

  async getBookBySlug(slug: string): Promise<Book | undefined> {
    const book = USE_API 
      ? await booksApi.getBySlug(slug) 
      : await firebaseBooks.getBookBySlug(slug);
    return book || undefined;
  },

  async getBooksByAuthor(authorName: string, excludeId?: string, limit?: number): Promise<Book[]> {
    // API mode will come later, use Firebase for now
    return await firebaseBooks.getBooksByAuthor(authorName, excludeId, limit);
  },

  async getRelatedBooks(category: string, currentBookId: string, author?: string, limit?: number): Promise<Book[]> {
    // API mode will come later, use Firebase for now
    return await firebaseBooks.getRelatedBooks(category, currentBookId, author, limit);
  },

  async getBooksPaginated(limitCount: number, lastVisible?: any, category?: string, sortBy?: any): Promise<any> {
    // This is complex with Firestore pagination, keep Firebase for now
    return await firebaseBooks.getBooksPaginated(limitCount, lastVisible, category, sortBy);
  },

  async saveBook(book: Omit<Book, 'id'>, id?: string): Promise<string> {
    if (USE_API) {
      if (id) {
        await booksApi.update(id, book as any);
        return id;
      }
      return await booksApi.create(book) || '';
    }
    // Firebase requires full book with id
    const bookWithId = { ...book, id: id || `book-${Date.now()}` } as Book;
    await firebaseBooks.saveBook(bookWithId);
    return bookWithId.id;
  },

  async deleteBook(id: string): Promise<void> {
    return USE_API 
      ? await booksApi.delete(id) 
      : await firebaseBooks.deleteBook(id);
  },

  async incrementBookView(id: string): Promise<void> {
    // Firebase only for now
    return await firebaseBooks.incrementBookView(id);
  }
};

// Users Service Adapter
export const usersService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return USE_API 
      ? await usersApi.getProfile(userId) 
      : await firebaseUsers.getUserProfile(userId);
  },

  async updateUserProfile(profile: Partial<UserProfile> & { id: string }): Promise<void> {
    return USE_API 
      ? await usersApi.updateProfile(profile.id, profile) 
      : await firebaseUsers.updateUserProfile(profile);
  },

  async updateWishlist(userId: string, bookIds: string[]): Promise<void> {
    return USE_API 
      ? await usersApi.updateWishlist(userId, bookIds) 
      : await firebaseUsers.updateWishlist(userId, bookIds);
  }
};

// Orders Service Adapter
export const ordersService = {
  async createOrder(orderData: any, cartItems: any[]): Promise<any> {
    if (USE_API) {
      // Map cart items to OrderItem format
      const items: OrderItem[] = cartItems.map(item => ({
        bookId: item.id,
        title: item.title,
        priceAtPurchase: item.price,
        quantity: item.quantity,
        cover: item.cover
      }));

      // Map order data to API format
      const order: Order = {
        userId: orderData.userId,
        status: orderData.status,
        statusStep: orderData.statusStep,
        customer: orderData.customer,
        payment: orderData.payment
      };

      return await ordersApi.create(order, items);
    } else {
      return await firebaseOrders.createOrder(orderData, cartItems);
    }
  },

  async getUserOrders(userId: string): Promise<any[]> {
    return USE_API
      ? (await ordersApi.getByUserId(userId)) || []
      : await firebaseOrders.getOrdersByUserId(userId);
  },

  async getOrderById(orderId: string): Promise<any> {
    return USE_API
      ? await ordersApi.getById(orderId)
      : await firebaseOrders.getOrderWithItems(orderId);
  },

  async updateOrderStatus(orderId: string, status: string, statusStep: number): Promise<void> {
    if (USE_API) {
      await ordersApi.updateStatus(orderId, status, statusStep);
    } else {
      await firebaseOrders.updateOrderStatus(orderId, status, statusStep);
    }
  }
};

// Reviews Service Adapter
export const reviewsService = {
  async getReviewsByBookId(bookId: string): Promise<Review[]> {
    return USE_API
      ? await reviewsApi.getByBookId(bookId)
      : await firebaseReviews.getReviewsByBookId(bookId);
  },

  async getReviewsByUserId(userId: string): Promise<Review[]> {
    return USE_API
      ? await reviewsApi.getByUserId(userId)
      : []; // Firebase doesn't have this query
  },

  async getAverageRating(bookId: string): Promise<number> {
    if (USE_API) {
      return await reviewsApi.getAverageRating(bookId);
    }
    // Firebase calculates on-the-fly
    const reviews = await firebaseReviews.getReviewsByBookId(bookId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  },

  async addReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<string | null> {
    if (USE_API) {
      return await reviewsApi.create(review);
    } else {
      await firebaseReviews.addReview(review as any);
      return null; // Firebase doesn't return ID
    }
  },

  async updateReview(reviewId: string, updates: Partial<Review>): Promise<void> {
    return USE_API
      ? await reviewsApi.update(reviewId, updates)
      : Promise.reject(new Error('Update review not supported in Firebase mode'));
  },

  async deleteReview(reviewId: string): Promise<void> {
    return USE_API
      ? await reviewsApi.delete(reviewId)
      : Promise.reject(new Error('Delete review not supported in Firebase mode'));
  }
};

// Coupons Service Adapter
export const couponsService = {
  async getAllCoupons(): Promise<Coupon[]> {
    return USE_API
      ? await couponsApi.getAll()
      : await firebaseCoupons.getCoupons();
  },

  async getCouponByCode(code: string): Promise<Coupon | null> {
    if (USE_API) {
      return await couponsApi.getByCode(code);
    }
    // Firebase doesn't have a direct getCouponByCode, use getCoupons and filter
    const coupons = await firebaseCoupons.getCoupons();
    return coupons.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
  },

  async getActiveCoupons(): Promise<Coupon[]> {
    if (USE_API) {
      return await couponsApi.getActive();
    }
    // Firebase doesn't have getActiveCoupons, filter from all coupons
    const coupons = await firebaseCoupons.getCoupons();
    return coupons.filter(c => c.isActive);
  },

  async validateCoupon(code: string, orderTotal: number): Promise<any> {
    if (USE_API) {
      try {
        const result = await couponsApi.validate(code, orderTotal);
        if (!result) return null;
        return {
          ...result.coupon,
          discount: result.discount,
          finalTotal: result.finalTotal
        };
      } catch (error: any) {
        throw error; // Re-throw for UI handling
      }
    } else {
      return await firebaseCoupons.validateCoupon(code, orderTotal);
    }
  },

  async createCoupon(coupon: Omit<Coupon, 'id'>): Promise<string | null> {
    if (USE_API) {
      return await couponsApi.create(coupon);
    }
    // Firebase uses saveCoupon for create
    await firebaseCoupons.saveCoupon(coupon as Coupon);
    return coupon.code;
  },

  async updateCoupon(couponId: string, updates: Partial<Coupon>): Promise<void> {
    if (USE_API) {
      await couponsApi.update(couponId, updates);
    }
    // Firebase uses saveCoupon for update
    await firebaseCoupons.saveCoupon({ ...updates, code: couponId } as Coupon);
  },

  async deleteCoupon(couponId: string): Promise<void> {
    return USE_API
      ? await couponsApi.delete(couponId)
      : await firebaseCoupons.deleteCoupon(couponId);
  },

  async incrementCouponUsage(couponId: string): Promise<void> {
    return USE_API
      ? await couponsApi.incrementUsage(couponId)
      : await firebaseCoupons.incrementCouponUsage(couponId);
  },

  async toggleCouponActive(couponId: string): Promise<void> {
    return USE_API
      ? await couponsApi.toggleActive(couponId)
      : Promise.reject(new Error('Toggle active not supported in Firebase mode'));
  }
};

// Categories Service Adapter
export const categoriesService = {
  async getAllCategories(): Promise<CategoryInfo[]> {
    return USE_API
      ? await categoriesApi.getAll()
      : await firebaseMetadata.getCategories();
  },

  async getCategoryByName(name: string): Promise<CategoryInfo | null> {
    if (USE_API) {
      return await categoriesApi.getByName(name);
    }
    // Firebase doesn't have getCategoryByName, get all and filter
    const categories = await firebaseMetadata.getCategories();
    return categories.find(c => c.name === name) || null;
  },

  async createCategory(category: CategoryInfo): Promise<CategoryInfo | null> {
    return USE_API
      ? await categoriesApi.create(category)
      : Promise.reject(new Error('Create category not supported in Firebase mode'));
  },

  async updateCategory(name: string, category: Partial<CategoryInfo>): Promise<void> {
    return USE_API
      ? await categoriesApi.update(name, category)
      : Promise.reject(new Error('Update category not supported in Firebase mode'));
  },

  async deleteCategory(name: string): Promise<void> {
    return USE_API
      ? await categoriesApi.delete(name)
      : Promise.reject(new Error('Delete category not supported in Firebase mode'));
  }
};

// Authors Service Adapter
export const authorsService = {
  async getAllAuthors(): Promise<Author[]> {
    return USE_API
      ? await authorsApi.getAll()
      : await firebaseMetadata.getAuthors();
  },

  async getAuthorById(id: string): Promise<Author | null> {
    if (USE_API) {
      return await authorsApi.getById(id);
    }
    // Firebase doesn't have getAuthorById, get all and filter
    const authors = await firebaseMetadata.getAuthors();
    return authors.find(a => a.id === id) || null;
  },

  async searchAuthorsByName(name: string): Promise<Author[]> {
    if (USE_API) {
      return await authorsApi.searchByName(name);
    }
    // Firebase doesn't have search, get all and filter
    const authors = await firebaseMetadata.getAuthors();
    const searchTerm = name.toLowerCase();
    return authors.filter(a => a.name.toLowerCase().includes(searchTerm));
  },

  async createAuthor(author: Omit<Author, 'id'>): Promise<string | null> {
    return USE_API
      ? await authorsApi.create(author)
      : Promise.reject(new Error('Create author not supported in Firebase mode'));
  },

  async updateAuthor(id: string, author: Partial<Author>): Promise<void> {
    return USE_API
      ? await authorsApi.update(id, author)
      : Promise.reject(new Error('Update author not supported in Firebase mode'));
  },

  async deleteAuthor(id: string): Promise<void> {
    return USE_API
      ? await authorsApi.delete(id)
      : Promise.reject(new Error('Delete author not supported in Firebase mode'));
  }
};

// Logs Service Adapter
export const logsService = {
  async getAllLogs(offset: number = 0, limitCount: number = 100): Promise<SystemLog[]> {
    if (USE_API) {
      // API doesn't support pagination yet, get all and slice
      const allLogs = await logsApi.getAll();
      return allLogs.slice(offset, offset + limitCount);
    }
    return await firebaseSystem.getSystemLogs(offset, limitCount);
  },

  async getLogsByStatus(status: string): Promise<SystemLog[]> {
    if (USE_API) {
      return await logsApi.getByStatus(status);
    }
    // Firebase doesn't support filtering by status, get all and filter client-side
    const logs = await firebaseSystem.getSystemLogs(0, 1000);
    return logs.filter(log => log.status === status);
  },

  async getLogsByUser(user: string): Promise<SystemLog[]> {
    if (USE_API) {
      return await logsApi.getByUser(user);
    }
    // Firebase doesn't support filtering by user, get all and filter client-side
    const logs = await firebaseSystem.getSystemLogs(0, 1000);
    return logs.filter(log => log.user === user);
  },

  async getLogsByAction(action: string): Promise<SystemLog[]> {
    if (USE_API) {
      return await logsApi.getByAction(action);
    }
    // Firebase doesn't support filtering by action, get all and filter client-side
    const logs = await firebaseSystem.getSystemLogs(0, 1000);
    return logs.filter(log => log.action === action);
  },

  async getLogStatistics(): Promise<any> {
    if (USE_API) {
      return await logsApi.getStatistics();
    }
    // Firebase doesn't have statistics endpoint, calculate manually
    const logs = await firebaseSystem.getSystemLogs(0, 1000);
    const stats = {
      total: logs.length,
      byStatus: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      recentErrors: logs.filter(l => l.status === 'ERROR' && 
        new Date(l.createdAt.toDate()).getTime() > Date.now() - 24 * 60 * 60 * 1000
      ).length
    };
    
    logs.forEach(log => {
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      if (log.category) {
        stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
      }
    });
    
    return stats;
  },

  async getRecentLogs(limit: number = 50): Promise<SystemLog[]> {
    if (USE_API) {
      return await logsApi.getRecent(limit);
    }
    // Firebase getSystemLogs supports limit
    return await firebaseSystem.getSystemLogs(0, limit);
  },

  async deleteOldLogs(beforeDate: string): Promise<number> {
    return USE_API
      ? await logsApi.deleteOld(beforeDate)
      : Promise.reject(new Error('Delete old logs not supported in Firebase mode'));
  }
};