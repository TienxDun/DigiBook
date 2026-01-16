
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  writeBatch,
  limit
} from "firebase/firestore";
import { db_fs, auth } from "./firebase";
import { Book, CartItem, CategoryInfo, Author, UserProfile, Coupon } from '../types';
import { MOCK_BOOKS, CATEGORIES } from '../constants';

export interface Review {
  id?: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  createdAt: any;
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
  };
  payment: {
    method: string;
    subtotal: number;
    shipping: number;
    couponDiscount: number;
    total: number;
  };
  createdAt?: any;
}

class DataService {
  private useMock = false;
  private connectionTested = false;

  constructor() {
    if (!db_fs) {
       this.useMock = true;
       console.warn(" [DB WARNING] Firestore instance is null. Running in EMERGENCY LOCAL mode.");
       return;
    }

    // Test connection to Firestore
    this.testConnection();
  }

  private async testConnection() {
    if (this.connectionTested) return;
    
    try {
      // Try a simple query to test connection
      await getDocs(query(collection(db_fs, 'system_logs'), limit(1)));
      this.connectionTested = true;
      console.log("✅ Firestore connection successful");
    } catch (error: any) {
      console.warn("⚠️ Firestore connection failed:", error.message);
      console.warn("🔄 Switching to MOCK mode for development");
      this.useMock = true;
      this.connectionTested = true;
    }
  }

  // Hệ thống Logging tối ưu: Đơn giản & Hiệu quả
  async logActivity(action: string, detail: string, status: 'SUCCESS' | 'ERROR' = 'SUCCESS') {
    const time = new Date().toLocaleTimeString('en-US', { hour12: true });
    const user = auth?.currentUser?.email?.split('@')[0] || 'Guest';
    const badgeColor = status === 'SUCCESS' ? 'background: #10b981; color: #fff;' : 'background: #f43f5e; color: #fff;';
    
    console.log(
      `%c ${status} %c ${time} | %c${user}%c | %c${action}%c ${detail}`,
      `${badgeColor} border-radius: 4px; font-size: 10px; font-weight: bold; padding: 2px 4px;`,
      'color: #94a3b8; font-family: monospace;',
      'color: #6366f1; font-weight: 800;',
      'color: #e2e8f0;',
      'color: #1e293b; font-weight: bold;',
      'color: #64748b;'
    );

    if (db_fs && !this.useMock) {
      try {
        await addDoc(collection(db_fs, 'system_logs'), {
          action,
          detail,
          status,
          user: auth?.currentUser?.email || 'Anonymous',
          createdAt: serverTimestamp()
        });
      } catch (e) {}
    }
  }

  private async wrap<T>(promise: Promise<T>, fallback: T, actionName?: string, detail?: string): Promise<T> {
    // Wait for connection test if not completed
    if (!this.connectionTested) {
      await this.testConnection();
    }

    if (this.useMock) return fallback;
    
    try {
      const result = await promise;
      if (actionName) this.logActivity(actionName, detail || 'Done');
      return result;
    } catch (e: any) {
      if (actionName) this.logActivity(actionName, e.message, 'ERROR');
      console.error("Database Error:", e);
      return fallback;
    }
  }

  async seedDatabase(): Promise<{success: boolean, count: number, error?: string}> {
    if (!db_fs) return { success: false, count: 0, error: "Firebase chưa được cấu hình" };
    try {
      const batch = writeBatch(db_fs);
      CATEGORIES.forEach(cat => {
        const ref = doc(db_fs, 'categories', cat.name);
        batch.set(ref, cat);
      });
      
      MOCK_BOOKS.forEach(book => {
        const ref = doc(db_fs, 'books', book.id);
        batch.set(ref, { ...book, createdAt: serverTimestamp() });
      });
      
      await batch.commit();
      this.logActivity('SEED_DATA', `Imported ${MOCK_BOOKS.length} items`);
      this.useMock = false; 
      return { success: true, count: MOCK_BOOKS.length };
    } catch (error: any) {
      this.logActivity('SEED_DATA', error.message, 'ERROR');
      return { success: false, count: 0, error: error.message };
    }
  }

  async getBooks(): Promise<Book[]> {
    return this.wrap(
      getDocs(collection(db_fs, 'books')).then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as Book))),
      []
    );
  }

  async getBookById(id: string): Promise<Book | undefined> {
    return this.wrap(
      getDoc(doc(db_fs, 'books', id)).then(snap => snap.exists() ? { id: snap.id, ...snap.data() } as Book : undefined),
      undefined
    );
  }

  async getCategories(): Promise<CategoryInfo[]> {
    return this.wrap(
      getDocs(collection(db_fs, 'categories')).then(snap => snap.docs.map(d => d.data() as CategoryInfo)),
      []
    );
  }

  async getAuthors(): Promise<Author[]> {
    return this.wrap(
      getDocs(collection(db_fs, 'authors')).then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as Author))),
      []
    );
  }

  async saveBook(book: Book): Promise<void> {
    await this.wrap(
      setDoc(doc(db_fs, 'books', book.id), { ...book, updatedAt: serverTimestamp() }, { merge: true }),
      undefined,
      'SAVE_BOOK',
      book.title
    );
  }

  async deleteBook(id: string): Promise<void> {
    await this.wrap(
      deleteDoc(doc(db_fs, 'books', id)),
      undefined,
      'DELETE_BOOK',
      id
    );
  }

  async createOrder(orderInfo: any, cartItems: CartItem[]) {
    try {
      const items: OrderItem[] = cartItems.map(item => ({
        bookId: item.id,
        title: item.title,
        priceAtPurchase: item.price,
        quantity: item.quantity,
        cover: item.cover
      }));
      
      const result = await addDoc(collection(db_fs, 'orders'), {
        ...orderInfo,
        items,
        date: new Date().toLocaleDateString('vi-VN'),
        createdAt: serverTimestamp()
      });

      const batch = writeBatch(db_fs);
      cartItems.forEach(item => {
        batch.update(doc(db_fs, 'books', item.id), { stock_quantity: increment(-item.quantity) });
      });
      await batch.commit();

      this.logActivity('ORDER_CREATED', result.id);
      return { id: result.id };
    } catch (e: any) {
      this.logActivity('ORDER_CREATED', e.message, 'ERROR');
      throw e;
    }
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    const q = userId === 'admin' 
      ? collection(db_fs, 'orders')
      : query(collection(db_fs, 'orders'), where("userId", "==", userId));
    
    return this.wrap(
      getDocs(q).then(snap => {
        const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        return orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      }),
      []
    );
  }

  async getOrderWithItems(orderId: string): Promise<(Order & { items: OrderItem[] }) | undefined> {
    return this.wrap(
      getDoc(doc(db_fs, 'orders', orderId)).then(snap => snap.exists() ? { id: snap.id, ...snap.data() } as any : undefined),
      undefined
    );
  }

  async updateOrderStatus(orderId: string, newStatus: string, newStatusStep: number): Promise<void> {
    await this.wrap(
      updateDoc(doc(db_fs, 'orders', orderId), { 
        status: newStatus, 
        statusStep: newStatusStep,
        updatedAt: serverTimestamp()
      }),
      undefined,
      'UPDATE_ORDER_STATUS',
      `${orderId} -> ${newStatus} (step ${newStatusStep})`
    );
  }

  async validateCoupon(code: string, subtotal: number): Promise<{ code: string, value: number, type: 'percentage' | 'fixed' } | null> {
    const couponRef = doc(db_fs, 'coupons', code.toUpperCase());
    const snap = await getDoc(couponRef);
    
    if (!snap.exists()) {
      return null;
    }

    const data = snap.data() as Coupon;
    const now = new Date().toISOString().split('T')[0];
    
    const isValid = data.isActive && 
                    subtotal >= data.minOrderValue && 
                    data.usedCount < data.usageLimit &&
                    data.expiryDate >= now;
    
    if (isValid) return { code: data.code, value: data.discountValue, type: data.discountType };
    return null;
  }

  async getCoupons(): Promise<Coupon[]> {
    return this.wrap(
      getDocs(collection(db_fs, 'coupons')).then(snap => 
        snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon))
      ),
      []
    );
  }

  async saveCoupon(coupon: Coupon): Promise<void> {
    const code = coupon.code.toUpperCase();
    await this.wrap(
      setDoc(doc(db_fs, 'coupons', code), { ...coupon, code, updatedAt: serverTimestamp() }, { merge: true }),
      undefined,
      'SAVE_COUPON',
      code
    );
  }

  async deleteCoupon(code: string): Promise<void> {
    await this.wrap(
      deleteDoc(doc(db_fs, 'coupons', code.toUpperCase())),
      undefined,
      'DELETE_COUPON',
      code
    );
  }

  async incrementCouponUsage(code: string): Promise<void> {
    const couponRef = doc(db_fs, 'coupons', code.toUpperCase());
    await this.wrap(
      updateDoc(couponRef, {
        usedCount: increment(1)
      }),
      undefined,
      'COUPON_USE',
      code
    );
  }

  async getReviewsByBookId(bookId: string): Promise<Review[]> {
    return this.wrap(
      getDocs(query(collection(db_fs, 'reviews'), where("bookId", "==", bookId)))
        .then(snap => {
          const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
          return reviews.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        }),
      []
    );
  }

  async addReview(review: Omit<Review, 'createdAt'>): Promise<void> {
    await this.wrap(
      addDoc(collection(db_fs, 'reviews'), { ...review, createdAt: serverTimestamp() }),
      undefined,
      'ADD_REVIEW',
      review.bookId
    );
  }

  async saveAuthor(author: Author): Promise<void> {
    const id = author.id || Date.now().toString();
    await this.wrap(
      setDoc(doc(db_fs, 'authors', id), { ...author, id }, { merge: true }),
      undefined,
      'SAVE_AUTHOR',
      author.name
    );
  }

  async deleteAuthor(id: string): Promise<void> {
    await this.wrap(
      deleteDoc(doc(db_fs, 'authors', id)),
      undefined,
      'DELETE_AUTHOR',
      id
    );
  }

  async saveCategory(category: CategoryInfo): Promise<void> {
    await this.wrap(
      setDoc(doc(db_fs, 'categories', category.name), category, { merge: true }),
      undefined,
      'SAVE_CAT',
      category.name
    );
  }

  async deleteCategory(name: string): Promise<void> {
    await this.wrap(
      deleteDoc(doc(db_fs, 'categories', name)),
      undefined,
      'DELETE_CAT',
      name
    );
  }

  async getSystemLogs(offset: number = 0, limitCount: number = 100): Promise<SystemLog[]> {
    return this.wrap(
      getDocs(query(collection(db_fs, 'system_logs'), orderBy('createdAt', 'desc'), limit(offset + limitCount)))
        .then(snap => {
          const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() } as SystemLog));
          return allDocs.slice(offset); // Skip offset, return remaining
        }),
      []
    );
  }

  // Quản lý thông tin cá nhân
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.wrap(
      getDoc(doc(db_fs, 'users', userId)).then(snap => {
        if (snap.exists()) return snap.data() as UserProfile;
        return null;
      }),
      null
    );
  }

  async updateUserProfile(profile: Partial<UserProfile> & { id: string }): Promise<void> {
    await this.wrap(
      setDoc(doc(db_fs, 'users', profile.id), { 
        ...profile, 
        updatedAt: serverTimestamp(),
        // Nếu là tài khoản mới hoàn toàn, thêm createdAt
      }, { merge: true }),
      undefined,
      'UPDATE_USER_PROFILE',
      profile.id
    );
  }

  // --- AUTO-GENERATOR FUNCTIONS ---

  async fetchBooksFromGoogle(q: string = 'sách tiếng việt', maxResults: number = 20): Promise<Book[]> {
    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=${maxResults}&langRestrict=vi`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.items) return [];

      // Lấy danh sách ISBN hiện có để lọc trùng
      const existingBooks = await this.getBooks();
      const existingIsbns = new Set(existingBooks.map(b => b.isbn));

      const books: Book[] = data.items
        .map((item: any) => {
          const info = item.volumeInfo;
          const isbnObj = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10');
          const isbn = isbnObj?.identifier || `GB-${item.id}`;

          // Chỉ lấy nếu chưa có trong DB
          if (existingIsbns.has(isbn)) return null;

          // Mapping category đơn giản
          const gbCats = info.categories || [];
          let appCat = 'Văn học'; // Default
          if (gbCats.some((c: string) => c.toLowerCase().includes('business') || c.toLowerCase().includes('economics'))) appCat = 'Kinh tế';
          else if (gbCats.some((c: string) => c.toLowerCase().includes('history'))) appCat = 'Lịch sử';
          else if (gbCats.some((c: string) => c.toLowerCase().includes('child') || c.toLowerCase().includes('juvenile'))) appCat = 'Thiếu nhi';
          else if (gbCats.some((c: string) => c.toLowerCase().includes('self-help') || c.toLowerCase().includes('skill'))) appCat = 'Kỹ năng';

          return {
            id: isbn,
            title: info.title,
            author: info.authors?.join(', ') || 'Nhiều tác giả',
            authorBio: info.description?.substring(0, 200) || 'Thông tin tác giả đang được cập nhật.',
            price: Math.floor(Math.random() * (350000 - 85000) + 85000), // Random price VND
            original_price: Math.floor(Math.random() * (450000 - 400000) + 400000),
            stock_quantity: Math.floor(Math.random() * 50) + 5,
            rating: info.averageRating || (4 + Math.random()).toFixed(1),
            cover: info.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800&auto=format&fit=crop',
            category: appCat,
            description: info.description || 'Chưa có mô tả chi tiết cho cuốn sách này.',
            isbn: isbn,
            pages: info.pageCount || 200,
            publisher: info.publisher || 'Đang cập nhật',
            publishYear: parseInt(info.publishedDate?.split('-')[0]) || 2023,
            language: 'Tiếng Việt'
          } as Book;
        })
        .filter((b: any) => b !== null);

      return books;
    } catch (error) {
      console.error("Error fetching from Google Books:", error);
      return [];
    }
  }

  async saveBooksBatch(books: Book[]): Promise<number> {
    if (books.length === 0) return 0;
    
    return this.wrap(
      (async () => {
        const batch = writeBatch(db_fs);
        
        // --- Tự động đồng bộ Tác giả ---
        const existingAuthors = await this.getAuthors();
        const authorMap = new Map(existingAuthors.map(a => [a.name.toLowerCase().trim(), a.id]));
        
        for (const book of books) {
          const authorName = book.author.trim();
          const authorKey = authorName.toLowerCase();
          
          let authorId: string;
          
          if (authorMap.has(authorKey)) {
            authorId = authorMap.get(authorKey)!;
          } else {
            // Tạo tác giả mới nếu chưa tồn tại
            authorId = `author-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const newAuthor: Author = {
              id: authorId,
              name: authorName,
              bio: book.authorBio || `Tác giả của cuốn sách "${book.title}".`,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random&size=256`
            };
            
            const authorDocRef = doc(db_fs, 'authors', authorId);
            batch.set(authorDocRef, { ...newAuthor, createdAt: serverTimestamp() });
            authorMap.set(authorKey, authorId); // Tránh tạo trùng trong cùng một batch
          }
          
          // Gán authorId vào sách
          book.authorId = authorId;
          
          const bookDocRef = doc(db_fs, 'books', book.id);
          batch.set(bookDocRef, { ...book, updatedAt: serverTimestamp() }, { merge: true });
        }
        
        await batch.commit();
        return books.length;
      })(),
      0,
      'BATCH_SAVE_BOOKS',
      `Imported ${books.length} items and synced authors`
    );
  }
}

export const db = new DataService();
