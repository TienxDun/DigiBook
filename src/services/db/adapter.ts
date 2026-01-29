import { Book, UserProfile } from '@/shared/types';

// Firebase services (existing)
import * as firebaseBooks from './modules/books.service';
import * as firebaseUsers from './modules/users.service';
import * as firebaseOrders from './modules/orders.service';
import * as firebaseReviews from './modules/reviews.service';
import * as firebaseCoupons from './modules/coupons.service';
import * as firebaseSystem from './modules/system.service';
import * as firebaseMetadata from './modules/metadata.service';

// API services (new)
import { booksApi, usersApi } from '../api';

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