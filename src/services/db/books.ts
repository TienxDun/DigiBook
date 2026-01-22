
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
  QueryDocumentSnapshot
} from "firebase/firestore";
import { db_fs } from "../../lib/firebase";
import { Book, Author } from '../../types/';
import { wrap } from "./core";

export async function getBooks(): Promise<Book[]> {
  return wrap(
    getDocs(collection(db_fs, 'books')).then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as Book))),
    []
  );
}

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

export async function saveBook(book: Book): Promise<void> {
  const cleanBook = Object.fromEntries(
    Object.entries(book).filter(([_, v]) => v !== undefined)
  );
  await wrap(
    setDoc(doc(db_fs, 'books', book.id), { ...cleanBook, updatedAt: serverTimestamp() }, { merge: true }),
    undefined,
    'SAVE_BOOK',
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
    deleteDoc(doc(db_fs, 'books', id)),
    undefined,
    'DELETE_BOOK',
    id
  );
}

export async function deleteBooksBulk(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await wrap(
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

// --- Google Books Integration ---

// --- Tiki API Integration (via Proxy) ---

export async function searchBooksFromTiki(queryStr: string, page: number = 1): Promise<Book[]> {
  try {
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const tikiApiUrl = `https://tiki.vn/api/v2/products?q=${encodeURIComponent(queryStr)}&limit=20&page=${page}`;

    const response = await fetch(proxyUrl + encodeURIComponent(tikiApiUrl));
    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) return [];

    const existingBooks = await getBooks();
    const existingIsbns = new Set(existingBooks.map(b => b.isbn));

    const books: Book[] = data.data.map((item: any) => {
      // Map basic info
      const authors = item.authors ? item.authors.filter((a: any) => a.name).map((a: any) => a.name).join(', ') : 'Nhiều tác giả';

      // Tiki images often have a base url, we want high res
      let coverUrl = item.thumbnail_url || "";
      // Try to get higher res if possible (Tiki urls are usually like .../cache/280x280/...)
      // We can remove the /cache/Dimension/ part to get full size or change dimensions
      // Example: https://salt.tikicdn.com/cache/280x280/ts/product/... -> https://salt.tikicdn.com/ts/product/...
      if (coverUrl.includes('/cache/')) {
        coverUrl = coverUrl.replace(/\/cache\/[\d]+x[\d]+\//, '/');
      }

      // Map Category
      // Tiki categories are numeric or specific strings. We map roughly to our fixed categories.
      // This is heuristic.
      let appCat = 'Văn học';
      const name = item.name.toLowerCase();
      if (name.includes('kinh tế') || name.includes('tài chính') || name.includes('doanh nghiệp')) appCat = 'Kinh tế';
      else if (name.includes('lịch sử') || name.includes('tiểu sử')) appCat = 'Lịch sử';
      else if (name.includes('thiếu nhi') || name.includes('truyện tranh')) appCat = 'Thiếu nhi';
      else if (name.includes('kỹ năng') || name.includes('self help') || name.includes('đắc nhân tâm')) appCat = 'Kỹ năng';
      else if (name.includes('tâm lý')) appCat = 'Tâm lý';

      // Calculate fake original price if not present, to show discount
      const price = item.price;
      const originalPrice = item.original_price && item.original_price > price ? item.original_price : Math.round(price * 1.2);

      // Generate a predictable but unique ID from Tiki ID
      // We use TikiID as part of our ID to avoid duplicates
      const bookId = `TK-${item.id}`;

      // Do not filter by ISBN here yet, as fetching ISBN requires detail call.
      // We will check duplication by Title primarily if ISBN is missing in list view.

      return {
        id: bookId,
        title: item.name,
        author: authors,
        authorBio: 'Thông tin tác giả đang cập nhật từ Tiki.',
        category: item.categories && item.categories.name ? item.categories.name : appCat,
        price: price,
        originalPrice: originalPrice,
        stockQuantity: item.stock_item ? item.stock_item.qty : 100, // Tiki often has stock info
        description: item.short_description || 'Mô tả đang cập nhật...',
        isbn: item.sku || `TK-${item.id}`, // Fallback to SKU if ISBN not visible in list
        cover: coverUrl,
        rating: item.rating_average || 5,
        pages: 200, // Default, as list view doesn't always have pages
        publisher: 'Tiki Trading',
        publishYear: 2024,
        language: 'Tiếng Việt',
        badge: item.discount_rate ? `-${item.discount_rate}%` : ''
      } as Book;
    });

    // Filter out duplicates based on ID or SKU if we have them in existingIsbns
    // But since we just construct ID, we check if we already have this specific Tiki book
    // Or if the SKU matches an existing ISBN
    const validBooks = books.filter(b => !existingIsbns.has(b.isbn));

    return validBooks;
  } catch (error) {
    console.error("Error searching Tiki books:", error);
    return [];
  }
}

export async function getBookDetailsFromTiki(tikiId: string | number): Promise<Partial<Book> | null> {
  try {
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    // clean ID if it has TK- prefix
    const cleanId = String(tikiId).replace('TK-', '');
    const url = `https://tiki.vn/api/v2/products/${cleanId}`;

    const response = await fetch(proxyUrl + encodeURIComponent(url));
    const data = await response.json();

    if (!data || data.error) return null;

    // Extract more detailed info
    const specs = data.specifications || [];
    let publisher = 'Đang cập nhật';
    let publishYear = new Date().getFullYear();
    let dimensions = '';
    let pages = 0;
    let bookLayout = ''; // Bìa mềm/bìa cứng

    // Parse specifications
    const mainSpecs = specs.find((s: any) => s.name === 'Thông tin chi tiết');
    if (mainSpecs && mainSpecs.attributes) {
      for (const attr of mainSpecs.attributes) {
        if (attr.code === 'publisher_vn') publisher = attr.value;
        if (attr.code === 'publication_date') publishYear = parseInt(attr.value) || publishYear;
        if (attr.code === 'dimensions') dimensions = attr.value;
        if (attr.code === 'number_of_page') pages = parseInt(attr.value) || 0;
        if (attr.code === 'book_cover') bookLayout = attr.value;
      }
    }

    let desc = data.description || '';

    // Remove Tiki boilerplate text about shipping/tax
    const boilerplateIndex = desc.indexOf('Giá sản phẩm trên Tiki đã bao gồm thuế');
    if (boilerplateIndex > -1) {
      desc = desc.substring(0, boilerplateIndex);
    }

    // Replace <br> and <p> with newlines to preserve some structure
    desc = desc.replace(/<br\s*\/?>/gi, '\n');
    desc = desc.replace(/<\/p>/gi, '\n\n');

    // Strip all other HTML tags
    desc = desc.replace(/<[^>]*>/g, '');

    // Decode HTML entities (basic ones)
    desc = desc.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

    // Trim whitespace
    desc = desc.trim();

    // If description is too short or empty after cleaning
    if (!desc) {
      desc = 'Chưa có mô tả chi tiết cho cuốn sách này.';
    }

    return {
      description: desc,
      publisher: publisher,
      publishYear: publishYear,
      pages: pages,
      language: 'Tiếng Việt', // Most Tiki books are VN, simple assumption or parse
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

    return {
      id: isbn,
      title: info.title || 'Không có tiêu đề',
      author: info.authors?.join(', ') || 'Nhiều tác giả',
      authorBio: info.description?.substring(0, 300) || 'Thông tin tác giả đang được cập nhật.',
      price: 0,
      stockQuantity: 10,
      rating: Number(info.averageRating || 5),
      cover: coverUrl,
      category: appCat,
      description: info.description || 'Chưa có mô tả.',
      isbn: isbn,
      pages: info.pageCount || 0,
      publisher: info.publisher || 'Đang cập nhật',
      publishYear: parseInt(info.publishedDate?.split('-')[0]) || new Date().getFullYear(),
      language: info.language === 'vi' ? 'Tiếng Việt' : (info.language === 'en' ? 'English' : (info.language === 'ja' ? '日本語' : (info.language === 'fr' ? 'Français' : 'Tiếng Việt'))),
      badge: ''
    } as Book;
  } catch (error) {
    console.error("Error fetching book by ISBN:", error);
    return null;
  }
}

// Bổ sung các function khác cần thiết để giữ trọn vẹn logic trong db.ts
// Ví dụ saveBooksBatch cần truy cập getAuthors (sẽ được import từ metadata.ts sau này)
