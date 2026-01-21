
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
import { db_fs } from "../firebase";
import { Book, Author } from '../../types';
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

export async function fetchBooksFromGoogle(q: string = 'sách tiếng việt', maxResults: number = 20): Promise<Book[]> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=${maxResults}&langRestrict=vi`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.items) return [];

    const existingBooks = await getBooks();
    const existingIsbns = new Set(existingBooks.map(b => b.isbn));

    const books: Book[] = data.items
      .map((item: any) => {
        const info = item.volumeInfo;
        const isbnObj = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10');
        const isbn = isbnObj?.identifier || `GB-${item.id}`;

        if (existingIsbns.has(isbn)) return null;

        const gbCats = info.categories || [];
        let appCat = 'Văn học';
        if (gbCats.some((c: string) => c.toLowerCase().includes('business') || c.toLowerCase().includes('economics'))) appCat = 'Kinh tế';
        else if (gbCats.some((c: string) => c.toLowerCase().includes('history'))) appCat = 'Lịch sử';
        else if (gbCats.some((c: string) => c.toLowerCase().includes('child') || c.toLowerCase().includes('juvenile'))) appCat = 'Thiếu nhi';
        else if (gbCats.some((c: string) => c.toLowerCase().includes('self-help') || c.toLowerCase().includes('skill'))) appCat = 'Kỹ năng';

        let coverUrl = info.imageLinks?.thumbnail?.replace('http:', 'https:') || "";
        if (coverUrl.includes('zoom=1')) {
          coverUrl = coverUrl.replace('zoom=1', 'zoom=2');
        }

        if (!coverUrl) {
          coverUrl = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800&auto=format&fit=crop';
        }

        const finalIsbn = isbn;
        const finalRating = Number(info.averageRating || (4 + Math.random()).toFixed(1));

        let mappedLang = 'Tiếng Việt';
        if (info.language === 'en') mappedLang = 'English';
        else if (info.language === 'ja') mappedLang = '日本語';
        else if (info.language === 'fr') mappedLang = 'Français';
        else if (info.language === 'de') mappedLang = 'Deutsch';
        else if (info.language === 'es') mappedLang = 'Español';
        else if (info.language === 'zh') mappedLang = '中文';

        let badge = '';
        if (finalRating >= 4.8) badge = 'Bán chạy';
        else if (info.pageCount > 500) badge = 'Kinh điển';

        return {
          id: finalIsbn,
          title: info.title || 'Không có tiêu đề',
          author: info.authors?.join(', ') || 'Nhiều tác giả',
          authorBio: info.description?.substring(0, 300) || 'Thông tin tác giả đang được cập nhật.',
          price: Math.floor(Math.random() * (350000 - 85000) + 85000),
          originalPrice: Math.floor(Math.random() * (450000 - 400000) + 400000),
          stockQuantity: Math.floor(Math.random() * 50) + 5,
          rating: finalRating,
          cover: coverUrl,
          category: appCat,
          description: info.description || 'Chưa có mô tả chi tiết cho cuốn sách này.',
          isbn: finalIsbn,
          pages: info.pageCount || 200,
          publisher: info.publisher || 'Đang cập nhật',
          publishYear: parseInt(info.publishedDate?.split('-')[0]) || 2023,
          language: mappedLang,
          badge: badge
        } as Book;
      })
      .filter((b: any) => b !== null);

    return books;
  } catch (error) {
    console.error("Error fetching from Google Books:", error);
    return [];
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
