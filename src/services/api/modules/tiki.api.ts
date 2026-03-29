import { Book } from '@/shared/types';
import { fetchWithProxy } from '../../../shared/utils/fetchWithProxy';
import { booksApi } from './books.api';
import { categoriesApi } from './categories.api';
import { authorsApi } from './authors.api';
import { normalizeTikiBookData } from './tikiNormalizer';

export const tikiApi = {
  /**
   * Search books directly from Tiki using proxy
   */
  async searchBooksFromTiki(queryStr: string, page: number = 1): Promise<Book[]> {
    try {
      const tikiApiUrl = `https://tiki.vn/api/v2/products?q=${encodeURIComponent(queryStr)}&limit=20&page=${page}`;

      // Use multi-proxy fetcher
      const data = await fetchWithProxy(tikiApiUrl);

      if (!data.data || !Array.isArray(data.data)) return [];

      const [existingBooks, categories] = await Promise.all([
        booksApi.getAll(),
        categoriesApi.getAll(),
      ]);
      const existingIsbns = new Set(existingBooks.map(b => b.isbn));
      const internalCategories = categories.map((category) => category.name);

      const books: Book[] = data.data.map((item: any) => {
        const normalized = normalizeTikiBookData(item, { internalCategories });
        return {
          ...normalized,
          id: normalized.id,
        } as Book;
      });

      // Filter out duplicates (optional, done at display level usually)
      const validBooks = books.filter(b => b.isbn && !existingIsbns.has(b.isbn));
      
      // Internal deduplication (if multiple sellers for same ISBN in results)
      const uniqueMap = new Map<string, Book>();
      validBooks.forEach(b => {
        if (b.isbn && !uniqueMap.has(b.isbn)) {
          uniqueMap.set(b.isbn, b);
        }
      });

      return Array.from(uniqueMap.values());
    } catch (error) {
      console.error("Error searching Tiki books:", error);
      return [];
    }
  },

  /**
   * Get book details directly from Tiki
   */
  async getBookDetailsFromTiki(bookId: string | number): Promise<Partial<Book> | null> {
    try {
      // Tích hợp các định dạng ID:
      // - 'book-275531998' (định dạng mới) → extract '275531998'
      // - 'TK-275531998'  (định dạng cũ)  → extract '275531998'
      // - '275531998'     (ID thuần)      → giữ nguyên
      const rawId = String(bookId);
      const cleanId = rawId.replace(/^book-/i, '').replace(/^TK-/i, '');

      if (!cleanId || !/^\d+$/.test(cleanId)) {
        console.warn('[tikiApi] Không thể trích xuất Tiki ID hợp lệ từ:', bookId);
        return null;
      }

      const url = `https://tiki.vn/api/v2/products/${cleanId}`;

      const [data, categories, authors] = await Promise.all([
        fetchWithProxy(url),
        categoriesApi.getAll(),
        authorsApi.getAll(),
      ]);

      if (!data || data.error) return null;

      const normalized = normalizeTikiBookData(data, {
        internalCategories: categories.map((category) => category.name),
      });

      // Thử khớp tác giả từ DB ngay tại đây
      if (normalized.author) {
        const authorName = normalized.author.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
        const matchedAuthor = authors.find(
          (a) => a.name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '') === authorName
        );
        if (matchedAuthor) {
          normalized.authorId = matchedAuthor.id;
          normalized.authorBio = normalized.authorBio || matchedAuthor.bio || '';
        }
      }

      return normalized;
    } catch (e) {
      console.error('Error fetching Tiki details:', e);
      return null;
    }
  },

  /**
   * Get raw data from Tiki
   */
  async getRawTikiData(tikiId: string | number): Promise<any | null> {
    try {
      const cleanId = String(tikiId).replace('TK-', '');
      const url = `https://tiki.vn/api/v2/products/${cleanId}`;

      return await fetchWithProxy(url);
    } catch (error) {
      console.error("Error fetching raw Tiki data:", error);
      return { error: String(error) };
    }
  }
};
