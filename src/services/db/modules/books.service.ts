
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
  deleteDoc,
  writeBatch,
  serverTimestamp,
  startAfter,
  orderBy,
  QueryDocumentSnapshot,
  increment
} from "firebase/firestore";
import { db_fs } from "../../../lib/firebase";
import { Book, Author } from '@/shared/types/';
import { wrap, logActivity, fetchWithProxy } from "../core";
import { enrichAuthorFromWiki } from "./metadata.service";

export async function getBooks(): Promise<Book[]> {
  return wrap(
    getDocs(collection(db_fs, 'books')).then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as Book))),
    []
  );
}

// ... (keep intermediate code if any, but replace logic in saveBook)

// Inside saveBook function logic replacement:
/*
      // 1. Check and Auto-create Author if needed
      if (cleanBook.author) { // Only if author name is provided
        const authorName = cleanBook.author.trim();
        
        // Check if author exists by name (case-insensitive approximation via query)
        const authorsRef = collection(db_fs, 'authors');
        const q = query(authorsRef, where('name', '==', authorName), limit(1));
        const authorSnap = await getDocs(q);

        let authorId: string;

        if (!authorSnap.empty) {
          // Author exists, use their ID
          authorId = authorSnap.docs[0].id;
        } else {
          // Create new Author
          // Try to enrich from Wikipedia first
          let wikiData = null;
          try {
             wikiData = await enrichAuthorFromWiki(authorName);
             if (wikiData) {
                logActivity('AUTO_ENRICH_AUTHOR', `Found Wiki info for: ${authorName}`, 'SUCCESS', 'INFO', 'SYSTEM');
             }
          } catch(err) {
             console.warn("Wiki enrich failed silently", err);
          }

          authorId = `author-${Date.now()}`;
          const newAuthor: Author = {
            id: authorId,
            name: authorName,
            bio: wikiData?.bio || cleanBook.authorBio || `Tác giả của cuốn sách "${cleanBook.title}".`,
            avatar: wikiData?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random&size=256`
          };
          await setDoc(doc(db_fs, 'authors', authorId), { ...newAuthor, createdAt: serverTimestamp() });
          logActivity('AUTO_CREATE_AUTHOR', `Created author: ${authorName}`, 'SUCCESS', 'INFO', 'SYSTEM');
        }
        
        // Link book to author
        cleanBook.authorId = authorId;
      }
*/


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
      // 1. Check and Auto-create Author if needed
      if (cleanBook.author) { // Only if author name is provided
        const authorName = cleanBook.author.trim();
        const authorKey = authorName.toLowerCase();

        // Check if author exists by name (case-insensitive approximation via query)
        const authorsRef = collection(db_fs, 'authors');
        // Note: Firestore queries are case-sensitive usually, but we check exact match on 'name' field first
        // Ideally we should have a normalized 'nameLower' field, but for now we query by standard name
        // Or we use the existing helper from metadata service if we could import it, but let's do direct query to avoid circ dep

        const q = query(authorsRef, where('name', '==', authorName), limit(1));
        const authorSnap = await getDocs(q);

        let authorId: string;

        if (!authorSnap.empty) {
          // Author exists, use their ID
          authorId = authorSnap.docs[0].id;
        } else {
          // Create new Author
          authorId = `author-${Date.now()}`;
          const newAuthor: Author = {
            id: authorId,
            name: authorName,
            bio: cleanBook.authorBio || `Tác giả của cuốn sách "${cleanBook.title}".`,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random&size=256`
          };
          await setDoc(doc(db_fs, 'authors', authorId), { ...newAuthor, createdAt: serverTimestamp() });
          logActivity('AUTO_CREATE_AUTHOR', `Created author: ${authorName}`, 'SUCCESS', 'INFO', 'SYSTEM');
        }

        // Link book to author
        cleanBook.authorId = authorId;
      }

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
        isAvailable: isAvailable
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
    const cleanId = String(tikiId).replace('TK-', '');
    const url = `https://tiki.vn/api/v2/products/${cleanId}`;

    // Use multi-proxy fetcher
    const data = await fetchWithProxy(url);

    if (!data || data.error) return null;

    // Extract more detailed info
    const specs = data.specifications || [];
    let publisher = 'Đang cập nhật';
    let publishYear = new Date().getFullYear();
    let pages = 0;
    let language = 'Tiếng Việt';
    let bookLayout = '';

    // Parse specifications
    const mainSpecs = specs.find((s: any) => s.name === 'Thông tin chi tiết');
    if (mainSpecs && mainSpecs.attributes) {
      for (const attr of mainSpecs.attributes) {
        const code = attr.code;
        const value = attr.value;

        if (code === 'publisher_vn') publisher = value;
        if (code === 'publication_date') {
          const yearStr = value.split(' ')[0].split('-')[0].split('/')[0];
          publishYear = parseInt(yearStr) || publishYear;
        }
        if (code === 'number_of_page') pages = parseInt(value) || 0;
        if (code === 'book_cover') bookLayout = value;
        if (code === 'languages') language = value === 'Tiếng Việt' ? 'Tiếng Việt' : value;
      }
    }

    let desc = data.description || '';
    const boilerplateIndex = desc.indexOf('Giá sản phẩm trên Tiki đã bao gồm thuế');
    if (boilerplateIndex > -1) desc = desc.substring(0, boilerplateIndex);

    desc = desc.replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    desc = desc.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n');

    if (bookLayout) desc = `${desc}\n\nLoại bìa: ${bookLayout}`;
    if (!desc) desc = 'Chưa có mô tả chi tiết cho cuốn sách này.';

    return {
      description: desc,
      publisher: publisher,
      publishYear: publishYear,
      pages: pages,
      language: language,
      cover: data.images && data.images[0] ? data.images[0].base_url : undefined
    };

  } catch (e) {
    console.error("Error fetching Tiki details:", e);
    return null;
  }
}


export async function fetchBookByISBN(isbn: string): Promise<Book | null> {
  try {
    if (!isbn || isbn.length < 10) return null;

    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.items || data.items.length === 0) return null;

    const info = data.items[0].volumeInfo;

    const gbCats = info.categories || [];
    let appCat = "Văn học";
    if (gbCats.some((c: string) => c.toLowerCase().includes('business') || c.toLowerCase().includes('economics'))) appCat = 'Kinh tế';
    else if (gbCats.some((c: string) => c.toLowerCase().includes('history'))) appCat = 'Lịch sử';
    else if (gbCats.some((c: string) => c.toLowerCase().includes('child') || c.toLowerCase().includes('juvenile'))) appCat = 'Thiếu nhi';
    else if (gbCats.some((c: string) => c.toLowerCase().includes('self-help') || c.toLowerCase().includes('skill'))) appCat = 'Kỹ năng';

    let coverUrl = info.imageLinks?.thumbnail?.replace('http:', 'https:') || "";
    if (coverUrl.includes('zoom=1')) coverUrl = coverUrl.replace('zoom=1', 'zoom=2');

    if (!coverUrl) {
      coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
    }

    const saleInfo = data.items[0].saleInfo;
    const isAvailable = saleInfo?.saleability === 'FOR_SALE';

    return {
      id: isbn,
      title: info.title || 'Không có tiêu đề',
      author: info.authors?.join(', ') || 'Nhiều tác giả',
      authorBio: info.description?.substring(0, 300) || 'Thông tin tác giả đang được cập nhật.',
      price: saleInfo?.listPrice?.amount || 0,
      stockQuantity: 100,
      rating: Number(info.averageRating || 5),
      cover: coverUrl,
      category: appCat,
      description: info.description || 'Chưa có mô tả.',
      isbn: isbn,
      pages: info.pageCount || 0,
      publisher: info.publisher || 'Đang cập nhật',
      publishYear: parseInt(info.publishedDate?.split('-')[0]) || new Date().getFullYear(),
      language: info.language === 'vi' ? 'Tiếng Việt' : (info.language === 'en' ? 'English' : (info.language === 'ja' ? '日本語' : (info.language === 'fr' ? 'Français' : info.language.toUpperCase()))),
      badge: '',
      isAvailable: isAvailable
    } as Book;
  } catch (error) {
    console.error("Error fetching book by ISBN:", error);
    return null;
  }
}

// Bổ sung các function khác cần thiết để giữ trọn vẹn logic trong db.ts
// Ví dụ saveBooksBatch cần truy cập getAuthors (sẽ được import từ metadata.ts sau này)
