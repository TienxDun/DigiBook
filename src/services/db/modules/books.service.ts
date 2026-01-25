
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  limit,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  startAfter,
  orderBy,
  QueryDocumentSnapshot,
  increment
} from "firebase/firestore";
import { db_fs } from "../../../lib/firebase";
import { Book } from '@/shared/types/';
import { wrap, fetchWithProxy } from "../core";

export async function getBooks(): Promise<Book[]> {
  return wrap(
    getDocs(collection(db_fs, 'books')).then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as Book))),
    []
  );
}

// ... (keep intermediate code if any, but replace logic in saveBook)




export async function getBooksPaginated(
  limitCount: number = 10,
  lastVisibleDoc?: QueryDocumentSnapshot,
  category?: string,
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'rating' = 'newest'
): Promise<{ books: Book[], lastDoc: QueryDocumentSnapshot | null }> {
  return wrap(
    (async () => {
      const booksRef = collection(db_fs, 'books');
      let q = query(booksRef, limit(limitCount));

      // Build Order By
      // Note: Firestore requires indexes for combined fields. 
      // Ensure 'category' + sort field index exists.
      let orderField = 'title';
      let orderDir: 'asc' | 'desc' = 'asc';

      switch (sortBy) {
        case 'newest': orderField = 'updatedAt'; orderDir = 'desc'; break; // Use updatedAt as prompt fix since createdAt might be missing
        case 'price_asc': orderField = 'price'; orderDir = 'asc'; break;
        case 'price_desc': orderField = 'price'; orderDir = 'desc'; break;
        case 'rating': orderField = 'rating'; orderDir = 'desc'; break;
        default: orderField = 'title'; orderDir = 'asc';
      }

      // Base constraints
      const constraints: any[] = [];

      if (category && category !== 'Tất cả sách') {
        constraints.push(where('category', '==', category));
      }

      // If sorting by something other than equality filter field, that field must be first in orderBy
      constraints.push(orderBy(orderField, orderDir));

      // If we have category filter (equality), and sort by specific field, 
      // Firestore behaves well if index exists.

      if (lastVisibleDoc) {
        constraints.push(startAfter(lastVisibleDoc));
      }

      constraints.push(limit(limitCount));

      q = query(booksRef, ...constraints);

      const snap = await getDocs(q);
      const books = snap.docs.map(d => ({ id: d.id, ...d.data() } as Book));
      const lastDoc = snap.docs[snap.docs.length - 1] || null;

      return { books, lastDoc };
    })(),
    { books: [], lastDoc: null }
  );
}

export async function getBookById(id: string): Promise<Book | undefined> {
  return wrap(
    getDoc(doc(db_fs, 'books', id)).then(snap => snap.exists() ? { id: snap.id, ...snap.data() } as Book : undefined),
    undefined
  );
}

export async function getBookBySlug(slug: string): Promise<Book | undefined> {
  return wrap(
    (async () => {
      const q = query(collection(db_fs, 'books'), where('slug', '==', slug), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return undefined;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as Book;
    })(),
    undefined
  );
}

export async function getBooksByIds(ids: string[]): Promise<Book[]> {
  if (!ids.length) return [];
  const books = await getBooks();
  return books.filter(b => ids.includes(b.id));
}

export async function getRelatedBooks(category: string, currentBookId: string, author?: string, limitCount: number = 4): Promise<Book[]> {
  return wrap(
    (async () => {
      const booksRef = collection(db_fs, 'books');
      const qCat = query(
        booksRef,
        where('category', '==', category),
        limit(limitCount + 1)
      );
      const snapCat = await getDocs(qCat);
      let related = snapCat.docs
        .map(d => ({ id: d.id, ...d.data() } as Book))
        .filter(b => b.id !== currentBookId);
      return related.slice(0, limitCount);
    })(),
    []
  );
}

export async function getBooksByAuthor(authorName: string, excludeId?: string, limitCount: number = 5): Promise<Book[]> {
  return wrap(
    (async () => {
      const booksRef = collection(db_fs, 'books');
      const q = query(
        booksRef,
        where('author', '==', authorName),
        limit(limitCount + (excludeId ? 1 : 0))
      );
      const snap = await getDocs(q);
      let books = snap.docs.map(d => ({ id: d.id, ...d.data() } as Book));
      if (excludeId) {
        books = books.filter(b => b.id !== excludeId);
      }
      return books.slice(0, limitCount);
    })(),
    []
  );
}

// --- Helper Functions ---
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateKeywords(title: string, author: string, category: string): string[] {
  const text = `${title} ${author} ${category}`.toLowerCase();
  // Normalize
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d");

  // Create variations
  const keywords = new Set<string>();

  // 1. Full words
  text.split(/\s+/).forEach(w => {
    if (w.length > 1) keywords.add(w);
  });

  // 2. Normalized words
  normalized.split(/\s+/).forEach(w => {
    if (w.length > 1) keywords.add(w);
  });

  // 3. Edge n-grams for title (prefix search)
  const titleWords = title.toLowerCase().split(/\s+/);
  let currentPhrase = "";
  titleWords.forEach(word => {
    currentPhrase = currentPhrase ? `${currentPhrase} ${word}` : word;
    keywords.add(currentPhrase);
    const normWord = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d");
    if (normWord !== word) keywords.add(normWord);
  });

  return Array.from(keywords);
}

export async function saveBook(book: Book): Promise<void> {
  const cleanBook = Object.fromEntries(
    Object.entries(book).filter(([_, v]) => v !== undefined)
  );

  // Auto-generate fields if missing
  if (!cleanBook.slug) {
    cleanBook.slug = generateSlug(cleanBook.title);
  }

  // Always regenerate keywords to ensure freshness
  cleanBook.searchKeywords = generateKeywords(
    cleanBook.title,
    cleanBook.author || '',
    cleanBook.category || ''
  );

  if (cleanBook.viewCount === undefined) {
    cleanBook.viewCount = 0;
  }

  await wrap(
    (async () => {


      // 2. Save Book
      await setDoc(doc(db_fs, 'books', book.id), { ...cleanBook, updatedAt: serverTimestamp() }, { merge: true });
    })(),
    undefined,
    'SAVE_BOOK_WITH_ID_SYNC',
    book.title
  );
}


export async function updateBook(id: string, data: Partial<Book>): Promise<void> {
  await wrap(
    updateDoc(doc(db_fs, 'books', id), { ...data, updatedAt: serverTimestamp() }),
    undefined,
    'UPDATE_BOOK',
    id
  );
}

export async function deleteBook(id: string): Promise<void> {
  await wrap(
    (async () => {
      const batch = writeBatch(db_fs);

      // 1. Xóa tất cả reviews của book (sub-collection)
      const reviewsSnap = await getDocs(
        collection(db_fs, 'books', id, 'reviews')
      );
      reviewsSnap.docs.forEach(d => batch.delete(d.ref));

      // 2. Xóa book document
      batch.delete(doc(db_fs, 'books', id));

      await batch.commit();
    })(),
    undefined,
    'DELETE_BOOK_CASCADE',
    `${id} with ${0} reviews`
  );
}


export async function deleteBooksBulk(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await wrap(
    (async () => {
      const batch = writeBatch(db_fs);

      // Cascade delete: xóa reviews của từng book trước
      for (const id of ids) {
        const reviewsSnap = await getDocs(
          collection(db_fs, 'books', id, 'reviews')
        );
        reviewsSnap.docs.forEach(d => batch.delete(d.ref));
        batch.delete(doc(db_fs, 'books', id));
      }

      await batch.commit();
    })(),
    undefined,
    'DELETE_BOOKS_BULK_CASCADE',
    `${ids.length} books with reviews`
  );
}


export async function incrementBookView(id: string): Promise<void> {
  // Use atomic increment
  const bookRef = doc(db_fs, 'books', id);
  // We don't wrap this strictly as it's a background "fire and forget" action usually
  try {
    await updateDoc(bookRef, { viewCount: increment(1) });
  } catch (e) {
    // Silent fail for view stats
    console.warn("Failed to increment view count", e);
  }
}

// --- Google Books Integration ---

// --- Tiki API Integration (via Proxy) ---

export async function searchBooksFromTiki(queryStr: string, page: number = 1): Promise<Book[]> {
  try {
    const tikiApiUrl = `https://tiki.vn/api/v2/products?q=${encodeURIComponent(queryStr)}&limit=20&page=${page}`;

    // Use multi-proxy fetcher
    const data = await fetchWithProxy(tikiApiUrl);

    if (!data.data || !Array.isArray(data.data)) return [];

    const existingBooks = await getBooks();
    const existingIsbns = new Set(existingBooks.map(b => b.isbn));

    const books: Book[] = data.data.map((item: any) => {
      // Map badges to internal DigiBook branding
      const mappedBadges = (item.badges_new || []).map((b: any) => {
        if (b.code === 'tikinow') return { code: 'digibook_express', text: 'DigiBook Now' };
        if (b.code === 'authentic_brand') return { code: 'digibook_guarantee', text: 'Chính hãng DigiBook' };
        return { code: b.code || 'badge', text: b.text || '' };
      });
      // Map basic info
      const authors = item.authors ? item.authors.filter((a: any) => a.name).map((a: any) => a.name).join(', ') : 'Nhiều tác giả';

      // Tiki images often have a base url, we want high res
      let coverUrl = item.thumbnail_url || "";
      if (coverUrl.includes('/cache/')) {
        coverUrl = coverUrl.replace(/\/cache\/[\d]+x[\d]+\//, '/');
      }

      // Map Category
      let appCat = 'Văn học';
      const name = item.name.toLowerCase();
      if (name.includes('kinh tế') || name.includes('tài chính') || name.includes('doanh nghiệp')) appCat = 'Kinh tế';
      else if (name.includes('lịch sử') || name.includes('tiểu sử')) appCat = 'Lịch sử';
      else if (name.includes('thiếu nhi') || name.includes('truyện tranh')) appCat = 'Thiếu nhi';
      else if (name.includes('kỹ năng') || name.includes('self help') || name.includes('đắc nhân tâm')) appCat = 'Kỹ năng';
      else if (name.includes('tâm lý')) appCat = 'Tâm lý';

      const price = item.price;
      const originalPrice = item.original_price && item.original_price > price ? item.original_price : Math.round(price * 1.2);
      const bookId = `TK-${item.id}`;
      const isAvailable = item.badget_price ? true : (item.inventory_status === 'available' || (item.stock_item && item.stock_item.qty > 0));

      return {
        id: bookId,
        title: item.name,
        author: authors,
        authorBio: 'Thông tin tác giả đang cập nhật từ Tiki.',
        category: item.categories && item.categories.name ? item.categories.name : appCat,
        price: price,
        originalPrice: originalPrice,
        stockQuantity: (item.stock_item && item.stock_item.qty > 0) ? item.stock_item.qty : 100,
        description: item.short_description || 'Mô tả đang cập nhật...',
        isbn: item.sku || `TK-${item.id}`,
        cover: coverUrl,
        rating: item.rating_average || 5,
        pages: 0,
        publisher: 'Tiki Trading',
        publishYear: new Date().getFullYear(),
        language: 'Tiếng Việt',
        badge: item.discount_rate ? `-${item.discount_rate}%` : '',
        isAvailable: isAvailable,
        quantitySold: item.quantity_sold,
        badges: item.badges_new,
        discountRate: item.discount_rate,

        // Phase 2 Fields
        images: item.images ? item.images.map((img: any) => img.base_url || img.large_url) : [coverUrl],
      } as Book;
    });

    // Filter out duplicates (optional, done at display level usually)
    const validBooks = books.filter(b => !existingIsbns.has(b.isbn));
    return validBooks;
  } catch (error) {
    console.error("Error searching Tiki books:", error);
    return [];
  }
}

export async function getBookDetailsFromTiki(tikiId: string | number): Promise<Partial<Book> | null> {
  try {
    // clean ID if it has TK- prefix
    const cleanId = String(tikiId).replace('TK-', '');
    const url = `https://tiki.vn/api/v2/products/${cleanId}`;

    const data = await fetchWithProxy(url);

    if (!data || data.error) return null;

    let dimensions = '';
    let translator = '';
    let manufacturer = '';
    let publisher = 'Đang cập nhật';
    let publishYear = new Date().getFullYear();
    let pages = 0;
    let bookLayout = '';

    // Parse specifications
    const specs = data.specifications || [];
    const mainSpecs = specs.find((s: any) => s.name === 'Thông tin chi tiết' || s.name === 'Thông tin chung');

    if (mainSpecs && mainSpecs.attributes) {
      for (const attr of mainSpecs.attributes) {
        const code = attr.code;
        const value = attr.value;

        if (code === 'publisher_vn') publisher = value;
        if (code === 'manufacturer') manufacturer = value;
        if (code === 'dich_gia') translator = value;
        if (code === 'dimensions') dimensions = value;
        if (code === 'book_cover') bookLayout = value;

        if (code === 'publication_date') {
          const yearStr = String(value).split(' ')[0].split('-')[0].split('/')[0];
          const parsedYear = parseInt(yearStr);
          if (!isNaN(parsedYear)) publishYear = parsedYear;
        }
        if (code === 'number_of_page') pages = parseInt(value) || 0;
      }
    }

    let desc = data.description || '';
    const boilerplateIndex = desc.indexOf('Giá sản phẩm trên Tiki đã bao gồm thuế');
    if (boilerplateIndex > -1) {
      desc = desc.substring(0, boilerplateIndex);
    }
    desc = desc.replace(/<br\s*\/?>/gi, '\n');
    desc = desc.replace(/<\/p>/gi, '\n\n');
    desc = desc.replace(/<[^>]*>/g, '');
    desc = desc.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    desc = desc.trim();
    if (bookLayout && !desc.includes('Loại bìa')) {
      desc = `${desc}\n\nLoại bìa: ${bookLayout}`;
    }
    if (!desc) {
      desc = 'Chưa có mô tả chi tiết cho cuốn sách này.';
    }

    let images: string[] = [];
    if (data.images && Array.isArray(data.images)) {
      images = data.images.map((img: any) => img.base_url || img.large_url).filter(Boolean);
    }
    let cover = undefined;
    if (images.length > 0) cover = images[0];

    return {
      description: desc,
      publisher: publisher,
      manufacturer: manufacturer,
      publishYear: publishYear,
      pages: pages,
      language: 'Tiếng Việt',
      cover: cover,
      images: images,
      dimensions: dimensions,
      translator: translator,
      bookLayout: bookLayout,

      rating: data.rating_average || 0,
      reviewCount: data.review_count || 0,
      badges: (data.badges_new || []).map((b: any) => {
        if (b.code === 'tikinow') return { code: 'digibook_express', text: 'DigiBook Now' };
        if (b.code === 'authentic_brand') return { code: 'digibook_guarantee', text: 'Chính hãng DigiBook' };
        return { code: b.code, text: b.text };
      })
    };

  } catch (e) {
    console.error("Error fetching Tiki details:", e);
    return null;
  }
}

export async function getRawTikiData(tikiId: string | number): Promise<any | null> {
  try {
    const cleanId = String(tikiId).replace('TK-', '');
    const url = `https://tiki.vn/api/v2/products/${cleanId}`;

    return await fetchWithProxy(url);
  } catch (error) {
    console.error("Error fetching raw Tiki data:", error);
    return { error: String(error) };
  }
}




// Bổ sung các function khác cần thiết để giữ trọn vẹn logic trong db.ts
// Ví dụ saveBooksBatch cần truy cập getAuthors (sẽ được import từ metadata.ts sau này)
