
/// <reference types="vite/client" />

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
  limit,
  terminate,
  clearIndexedDbPersistence
} from "firebase/firestore";
import { db_fs, auth } from "./firebase";
import { 
  Book, 
  CartItem, 
  CategoryInfo, 
  Author, 
  UserProfile, 
  Coupon, 
  AIModelConfig,
  Review,
  OrderItem,
  SystemLog,
  Order 
} from '../types';
import { INITIAL_CATEGORIES } from '../constants/categories';

class DataService {
  private connectionTested = false;

  constructor() {
    if (!db_fs) {
       console.error(" [DB ERROR] Firestore instance is null. App cannot function without database.");
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
      console.error("❌ Firestore connection failed:", error.message);
      
      // Handle BloomFilterError or Persistence errors by clearing cache
      if (error.name === 'BloomFilterError' || (error.message && error.message.includes('persistence'))) {
        console.warn("🔄 Attemping to clear Firestore persistence due to cache error...");
        try {
          await terminate(db_fs);
          await clearIndexedDbPersistence(db_fs);
          console.log("✨ Persistence cleared. Re-initializing...");
          window.location.reload();
        } catch (clearErr) {
          console.error("Failed to clear persistence:", clearErr);
        }
      }
      
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

    if (db_fs) {
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
      INITIAL_CATEGORIES.forEach(cat => {
        const ref = doc(db_fs, 'categories', cat.name);
        batch.set(ref, cat);
      });
      
      // MOCK_BOOKS has been removed for 100% online mode
      // To add books, use the Admin "Auto Sync from Internet" feature
      
      await batch.commit();
      this.logActivity('SEED_DATA', `Seeded ${INITIAL_CATEGORIES.length} categories. Remember to register/login with admin@gmail.com for full admin access.`);
      return { success: true, count: INITIAL_CATEGORIES.length };
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

  async getBooksByIds(ids: string[]): Promise<Book[]> {
    if (!ids.length) return [];
    // Firestore limited to 10 in 'in' queries usually, let's just fetch all and filter or do batching if it grows
    // For now, since wishlist is small, we can fetch all or use multiple getDocs.
    // Better way: get all books and Filter (since book collection is small in typical demo)
    // Or fetch individually in parallel for larger sets.
    const books = await this.getBooks();
    return books.filter(b => ids.includes(b.id));
  }

  async getRelatedBooks(category: string, currentBookId: string, author?: string, limitCount: number = 4): Promise<Book[]> {
    return this.wrap(
      (async () => {
        const booksRef = collection(db_fs, 'books');
        
        // Query theo category trước
        const qCat = query(
          booksRef, 
          where('category', '==', category),
          limit(limitCount + 1)
        );
        const snapCat = await getDocs(qCat);
        let related = snapCat.docs
          .map(d => ({ id: d.id, ...d.data() } as Book))
          .filter(b => b.id !== currentBookId);
          
        // Nếu vẫn ít, có thể lấy thêm nhưng hiện tại chỉ cần category là đủ cho logic này
        return related.slice(0, limitCount);
      })(),
      []
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
      // 1. Kiểm tra tồn kho trước khi tạo đơn
      const bookChecks = await Promise.all(
        cartItems.map(item => getDoc(doc(db_fs, 'books', item.id)))
      );

      const outOfStockItems: string[] = [];
      cartItems.forEach((item, index) => {
        const snap = bookChecks[index];
        if (snap.exists()) {
          const currentStock = snap.data().stockQuantity || 0;
          if (currentStock < item.quantity) {
            outOfStockItems.push(item.title);
          }
        }
      });

      if (outOfStockItems.length > 0) {
        const error = new Error(`Rất tiếc, các sách sau đã hết hàng hoặc không đủ số lượng: ${outOfStockItems.join(', ')}`);
        (error as any).code = 'OUT_OF_STOCK';
        throw error;
      }

      // 2. Nếu đủ kho, tiến hành tạo đơn
      const items: OrderItem[] = cartItems.map(item => ({
        bookId: item.id,
        title: item.title,
        priceAtPurchase: item.price,
        quantity: item.quantity,
        cover: item.cover
      }));
      
      const batch = writeBatch(db_fs);
      const orderRef = doc(collection(db_fs, 'orders'));
      const orderId = orderRef.id;

      batch.set(orderRef, {
        ...orderInfo,
        items,
        date: new Date().toLocaleDateString('vi-VN'),
        createdAt: serverTimestamp()
      });

      cartItems.forEach((item, index) => {
        if (bookChecks[index].exists()) {
          batch.update(doc(db_fs, 'books', item.id), { stockQuantity: increment(-item.quantity) });
        }
      });

      await batch.commit();

      this.logActivity('ORDER_CREATED', orderId);
      return { id: orderId };
    } catch (e: any) {
      if (e.code === 'OUT_OF_STOCK') {
        this.logActivity('ORDER_FAILED', e.message, 'ERROR');
      } else {
        this.logActivity('ORDER_CREATED', e.message, 'ERROR');
      }
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

  async checkIfUserPurchasedBook(userId: string, bookId: string): Promise<boolean> {
    return this.wrap(
      getDocs(query(collection(db_fs, 'orders'), where("userId", "==", userId)))
        .then(snap => {
          return snap.docs.some(d => {
            const orderData = d.data();
            return orderData.items?.some((item: any) => item.bookId === bookId);
          });
        }),
      false
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
      getDocs(query(collection(db_fs, 'books', bookId, 'reviews'), orderBy('createdAt', 'desc')))
        .then(snap => {
          return snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
        }),
      []
    );
  }

  async addReview(review: Omit<Review, 'createdAt'>): Promise<void> {
    await this.wrap(
      (async () => {
        // 1. Thêm review vào sub-collection
        const reviewRef = collection(db_fs, 'books', review.bookId, 'reviews');
        await addDoc(reviewRef, { ...review, createdAt: serverTimestamp() });

        // 2. Tự động tính toán lại rating trung bình cho sách
        // Lưu ý: Trong môi trường production, logic này nên được đặt trong Cloud Functions
        const allReviewsSnap = await getDocs(reviewRef);
        const reviews = allReviewsSnap.docs.map(d => d.data() as Review);
        
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
          const averageRating = (totalRating / reviews.length).toFixed(1);
          
          await updateDoc(doc(db_fs, 'books', review.bookId), {
            rating: Number(averageRating)
          });
        }
      })(),
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
  async deleteBooksBulk(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.wrap(
      (async () => {
        const batch = writeBatch(db_fs);
        ids.forEach(id => {
          batch.delete(doc(db_fs, 'books', id));
        });
        await batch.commit();
      })(),
      undefined,
      'DELETE_BOOKS_BULK',
      `${ids.length} items`
    );
  }

  async deleteAuthorsBulk(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.wrap(
      (async () => {
        const batch = writeBatch(db_fs);
        ids.forEach(id => {
          batch.delete(doc(db_fs, 'authors', id));
        });
        await batch.commit();
      })(),
      undefined,
      'DELETE_AUTHORS_BULK',
      `${ids.length} items`
    );
  }

  async deleteCategoriesBulk(names: string[]): Promise<void> {
    if (names.length === 0) return;
    await this.wrap(
      (async () => {
        const batch = writeBatch(db_fs);
        names.forEach(name => {
          batch.delete(doc(db_fs, 'categories', name));
        });
        await batch.commit();
      })(),
      undefined,
      'DELETE_CATEGORIES_BULK',
      `${names.length} items`
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
    const userRef = doc(db_fs, 'users', profile.id);
    const snap = await getDoc(userRef);
    
    await this.wrap(
      setDoc(userRef, { 
        ...profile, 
        updatedAt: serverTimestamp(),
        ...(!snap.exists() ? { createdAt: serverTimestamp(), status: 'active' } : {})
      }, { merge: true }),
      undefined,
      'UPDATE_USER_PROFILE',
      profile.id
    );
  }

  async updateWishlist(userId: string, bookIds: string[]): Promise<void> {
    await this.updateUserProfile({ id: userId, wishlistIds: bookIds });
    this.logActivity('UPDATE_WISHLIST', `User: ${userId} | Items: ${bookIds.length}`, 'SUCCESS');
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

          // Cải thiện độ phân giải hình ảnh từ Google Books
          let coverUrl = info.imageLinks?.thumbnail?.replace('http:', 'https:') || "";
          
          if (coverUrl.includes('zoom=1')) {
            coverUrl = coverUrl.replace('zoom=1', 'zoom=2'); // Thử lấy ảnh chất lượng cao hơn
          }

          // Dự phòng ảnh từ Open Library (Chất lượng thường cao hơn - size Large)
          const isbn13 = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier;
          if (isbn13) {
            // Chúng ta có thể dùng URL của Open Library làm ưu tiên hoặc fallback nếu Google Books quá xấu
            // Ở đây tôi sẽ giữ Google Books vì nó khớp tiêu đề hơn, nhưng bạn có thể đổi logic
          }

          if (!coverUrl) {
             coverUrl = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800&auto=format&fit=crop';
          }

          // Thử lấy thêm poster từ OpenLibrary nếu có ISBN
          const finalIsbn = isbn;
          
          return {
            id: finalIsbn,
            title: info.title,
            author: info.authors?.join(', ') || 'Nhiều tác giả',
            authorBio: info.description?.substring(0, 300) || 'Thông tin tác giả đang được cập nhật.',
            price: Math.floor(Math.random() * (350000 - 85000) + 85000), // Random price VND
            originalPrice: Math.floor(Math.random() * (450000 - 400000) + 400000),
            stockQuantity: Math.floor(Math.random() * 50) + 5,
            rating: info.averageRating || (4 + Math.random()).toFixed(1),
            cover: coverUrl,
            category: appCat,
            description: info.description || 'Chưa có mô tả chi tiết cho cuốn sách này.',
            isbn: finalIsbn,
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

  // --- AI & EXTERNAL SERVICES ---

  private async callAIService(prompt: string, actionName: string): Promise<string> {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    try {
      const config = await this.getAIConfig();
      const modelId = config.activeModelId;

      // XÁC ĐỊNH PROVIDER DỰA TRÊN MODEL ID
      
      // 1. OPENROUTER (Nếu model ID có chứa '/' - định dạng chuẩn của OpenRouter)
      if (openRouterKey && modelId.includes('/')) {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'DigiBook App',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          this.logActivity(actionName, `Generated using OpenRouter (${modelId})`);
          return text.trim();
        }
      }

      // 2. GROQ (Nếu model ID chứa 'llama', 'mixtral' hoặc 'gemma' và không thuộc OpenRouter)
      if (groqKey && (modelId.includes('llama') || modelId.includes('mixtral') || modelId.includes('gemma')) && !modelId.includes('/')) {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          this.logActivity(actionName, `Generated using Groq (${modelId})`);
          return text.trim();
        }
      }

      // 3. GEMINI (Mặc định cho các model gemini-* hoặc fallback cuối)
      if (geminiKey) {
        // Fallback model nếu modelId không hợp lệ cho Gemini trực tiếp
        const geminiModel = modelId.startsWith('gemini-') ? modelId : 'gemini-2.5-flash-lite';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        const data = await response.json();
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (textOutput) {
          this.logActivity(actionName, `Generated using Gemini (${geminiModel})`);
          return textOutput.trim();
        }
      }

      throw new Error("Không có API Key khả dụng cho Model đã chọn.");
    } catch (error: any) {
      console.error("AI Service Error:", error);
      this.logActivity(`${actionName}_ERROR`, error.message, 'ERROR');
      return "AI đang bận một chút, bạn hãy quay lại sau nhé! Lỗi: " + error.message;
    }
  }

  async getAIInsight(bookTitle: string, author: string, description: string): Promise<string> {
    const prompt = `Bạn là một chuyên gia phê bình sách kỳ cựu tại DigiBook. Hãy viết một đoạn tóm tắt ngắn gọn (khoảng 100-150 chữ) mang tính khơi gợi và phân tích giá trị cốt lõi của cuốn sách sau bằng tiếng Việt.
    Tên sách: ${bookTitle}
    Tác giả: ${author}
    Mô tả cơ bản: ${description}
    
    Yêu cầu:
    - Ngôn ngữ chuyên nghiệp, sang trọng, cuốn hút.
    - Nêu bật tại sao độc giả nên đọc cuốn sách này.
    - Không lặp lại nguyên văn mô tả cơ bản.
    - Bắt đầu đoạn bằng một câu khẳng định mạnh mẽ về cuốn sách.`;

    return this.callAIService(prompt, 'AI_INSIGHT');
  }

  async getAuthorAIInsight(authorName: string): Promise<string> {
    const prompt = `Bạn là một chuyên gia nghiên cứu văn học. Hãy viết một đoạn giới thiệu chuyên sâu và lôi cuốn (khoảng 150-200 chữ) về tác giả "${authorName}". 
    Hãy nêu bật phong cách sáng tác đặc trưng, những chủ đề chính trong tác phẩm của họ và tầm ảnh hưởng của họ trong giới văn học. Trả lời bằng tiếng Việt, giọng văn trang trọng nhưng giàu cảm xúc.`;

    return this.callAIService(prompt, 'AI_AUTHOR_INSIGHT');
  }

  // AI Configuration Management
  async getAIConfig(): Promise<{ activeModelId: string }> {
    try {
      const docRef = doc(db_fs, 'system_configs', 'ai_settings');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as { activeModelId: string };
      }
      return { activeModelId: 'gemini-2.5-flash-lite' };
    } catch (error) {
      console.error("Error getting AI config:", error);
      return { activeModelId: 'gemini-2.5-flash-lite' };
    }
  }

  async updateAIConfig(modelId: string): Promise<void> {
    await this.wrap(
      setDoc(doc(db_fs, 'system_configs', 'ai_settings'), { 
        activeModelId: modelId,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.email || 'admin'
      }),
      undefined,
      'UPDATE_AI_CONFIG',
      `Switched to model: ${modelId}`
    );
  }

  // --- AI Models CRUD ---
  async getAIModels(): Promise<AIModelConfig[]> {
    const defaultModel: AIModelConfig = { 
      id: 'gemini-2.5-flash-lite', 
      name: 'Gemini 2.5 Flash Lite', 
      category: 'Google Gemini', 
      rpm: '20', 
      tpm: '2M', 
      rpd: '2K' 
    };

    try {
      const snap = await getDocs(collection(db_fs, 'ai_models'));
      const models = snap.docs.map(doc => ({ ...doc.data() } as AIModelConfig));
      if (models.length === 0) return [defaultModel];
      return models;
    } catch (error) {
      console.error("Error getting AI models:", error);
      return [defaultModel];
    }
  }

  async addAIModel(model: AIModelConfig): Promise<void> {
    await this.wrap(
      setDoc(doc(db_fs, 'ai_models', model.id), {
        ...model,
        createdAt: serverTimestamp()
      }),
      undefined,
      'ADD_AI_MODEL',
      `Model: ${model.name} (${model.id})`
    );
  }

  async updateAIModelInfo(model: AIModelConfig): Promise<void> {
    await this.wrap(
      updateDoc(doc(db_fs, 'ai_models', model.id), {
        ...model,
        updatedAt: serverTimestamp()
      }),
      undefined,
      'UPDATE_AI_MODEL',
      `Model: ${model.id}`
    );
  }

  async deleteAIModel(modelId: string): Promise<void> {
    await this.wrap(
      deleteDoc(doc(db_fs, 'ai_models', modelId)),
      undefined,
      'DELETE_AI_MODEL',
      `Model: ${modelId}`
    );
  }

  async getAIInsights(book: Book | null, customPrompt: string): Promise<string> {
    return this.callAIService(customPrompt, 'AI_GENERAL_INSIGHT');
  }

  // --- User Management ---
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      // Đầu tiên thử lấy tất cả không theo thứ tự (để tránh lỗi field missing)
      const snap = await getDocs(collection(db_fs, 'users'));
      const allUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      
      // Sau đó sắp xếp theo client (an toàn hơn nếu thiếu field)
      return allUsers.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error("Error getting users:", error);
      return [];
    }
  }

  async updateUserRole(userId: string, newRole: 'admin' | 'user'): Promise<void> {
    await this.wrap(
      updateDoc(doc(db_fs, 'users', userId), { 
        role: newRole,
        updatedAt: serverTimestamp()
      }),
      undefined,
      'UPDATE_USER_ROLE',
      `UserId: ${userId} to ${newRole}`
    );
  }

  async updateUserStatus(userId: string, newStatus: 'active' | 'banned'): Promise<void> {
    await this.wrap(
      updateDoc(doc(db_fs, 'users', userId), { 
        status: newStatus,
        updatedAt: serverTimestamp()
      }),
      undefined,
      'UPDATE_USER_STATUS',
      `UserId: ${userId} to ${newStatus}`
    );
  }

  async deleteUser(userId: string): Promise<void> {
    await this.wrap(
      deleteDoc(doc(db_fs, 'users', userId)),
      undefined,
      'DELETE_USER',
      `UserId: ${userId}`
    );
  }
}

export const db = new DataService();

export type { Order, OrderItem, Review, SystemLog };

