import { Book } from '@/shared/types';
import { fetchWithProxy } from '../../../shared/utils/fetchWithProxy';
import { booksApi } from './books.api';

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

      const existingBooks = await booksApi.getAll();
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
        const isbn = item.sku || `TK-${item.id}`;
        const bookId = isbn; // Using ISBN as primary document ID to avoid duplicates across sellers
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
          isbn: isbn,
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
  async getBookDetailsFromTiki(tikiId: string | number): Promise<Partial<Book> | null> {
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
        // Helper: strips all HTML tags and returns clean text
        const stripHtml = (html: string): string => {
          if (!html || typeof html !== 'string') return '';
          // Remove all HTML tags and decode common HTML entities
          return html
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ')
            .trim();
        };

        for (const attr of mainSpecs.attributes) {
          const code = attr.code;
          const value = attr.value;

          if (code === 'publisher_vn') publisher = value;
          if (code === 'manufacturer') manufacturer = value;
          if (code === 'dich_gia') translator = value;
          if (code === 'dimensions') dimensions = stripHtml(value);
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
