import { describe, expect, it } from 'vitest';
import { normalizeBookForPersistence, normalizeTikiBookData, stripHtml, TikiProduct } from './tikiNormalizer';

describe('tikiNormalizer', () => {
  it('maps raw tiki detail into DigiBook schema', () => {
    const raw: TikiProduct = {
      id: 275625701,
      sku: '1378623173921',
      name: '  Sách Tinh Hoa Kinh Tế Học ',
      short_description: '<p>Mô tả ngắn</p>',
      description: '<p>Nội dung <strong>chi tiết</strong></p><p>Giá sản phẩm trên Tiki đã bao gồm thuế theo luật hiện hành.</p>',
      price: 471200,
      original_price: 595000,
      discount_rate: 21,
      rating_average: 5,
      review_count: 190,
      thumbnail_url: 'https://salt.tikicdn.com/cache/280x280/ts/product/a2/03/f8/cover.jpg',
      images: [
        { base_url: 'https://salt.tikicdn.com/ts/product/a2/03/f8/cover.jpg' },
        { large_url: 'https://salt.tikicdn.com/cache/w1200/ts/product/62/aa/6a/gallery.jpg' },
      ],
      authors: [{ name: 'Paul Krugman' }, { name: 'Robin Wells' }],
      badges_new: [{ code: 'is_hero', text: 'Hero', type: 'icon' }],
      quantity_sold: { text: 'Đã bán 386', value: 386 },
      inventory_status: 'available',
      stock_item: { qty: 8 },
      specifications: [
        {
          name: 'Thông tin chung',
          attributes: [
            { code: 'publisher_vn', value: 'Viện Quản lý PACE' },
            { code: 'publication_date', value: '2022-01-01 00:00:00' },
            { code: 'dimensions', value: '19 x 27.5 cm' },
            { code: 'dich_gia', value: 'Nguyễn Trường Phú' },
            { code: 'book_cover', value: 'Bìa cứng' },
            { code: 'number_of_page', value: '780' },
            { code: 'manufacturer', value: 'Nhà Xuất Bản Tổng hợp TP.HCM' },
          ],
        },
      ],
    };

    const book = normalizeTikiBookData(raw, {
      internalCategories: ['Kinh tế', 'Văn học', 'Thiếu nhi'],
    });

    expect(book.id).toBe('book-275625701');
    expect(book.isbn).toBe('1378623173921');
    expect(book.title).toBe('Sách Tinh Hoa Kinh Tế Học');
    expect(book.author).toBe('Paul Krugman, Robin Wells');
    expect(book.category).toBe('Kinh tế');
    expect(book.publisher).toBe('Viện Quản lý PACE');
    expect(book.manufacturer).toBe('Nhà Xuất Bản Tổng hợp TP.HCM');
    expect(book.publishYear).toBe(2022);
    expect(book.pages).toBe(780);
    expect(book.dimensions).toBe('19 x 27.5 cm');
    expect(book.translator).toBe('Nguyễn Trường Phú');
    expect(book.bookLayout).toBe('Bìa cứng');
    expect(book.cover).toBe('https://salt.tikicdn.com/ts/product/a2/03/f8/cover.jpg');
    expect(book.images).toEqual([
      'https://salt.tikicdn.com/ts/product/a2/03/f8/cover.jpg',
      'https://salt.tikicdn.com/ts/product/62/aa/6a/gallery.jpg',
    ]);
    expect(book.description).toBe('Nội dung chi tiết');
    expect(book.quantitySold).toEqual({ text: 'Đã bán 386', value: 386 });
    expect(book.badges).toEqual([{ code: 'is_hero', text: 'Hero', type: 'icon' }]);
    expect(book.discountRate).toBe(21);
    expect(book.slug).toBe('book-275625701');
    expect(book.searchKeywords).toContain('kinh tế');
    expect(book.searchKeywords).toContain('1378623173921');
  });

  it('handles missing raw fields with safe defaults', () => {
    const raw: TikiProduct = {
      id: 12345,
      name: 'Truyện tranh cho bé',
      authors: [],
      images: [],
      specifications: [],
    };

    const book = normalizeTikiBookData(raw, {
      internalCategories: ['Thiếu nhi', 'Văn học'],
    });

    expect(book.id).toBe('book-12345');
    expect(book.isbn).toBe('TK-12345');
    expect(book.author).toBe('Nhiều tác giả');
    expect(book.category).toBe('Thiếu nhi');
    expect(book.pages).toBe(0);
    expect(book.images).toEqual([]);
    expect(book.cover).toBe('');
    expect(book.description).toBe('');
    expect(book.slug).toBe('book-12345');
    expect(book.quantitySold).toBeUndefined();
  });

  it('normalizes final payload before persistence', () => {
    const normalized = normalizeBookForPersistence(
      {
        id: 'TK-275625701',
        isbn: '1378623173921',
        title: '  Sách Tinh Hoa Kinh Tế Học  ',
        author: ' Paul Krugman ',
        price: 100000,
        originalPrice: 90000,
        stockQuantity: -1,
        cover: 'https://salt.tikicdn.com/cache/w1200/ts/product/a2/03/f8/cover.jpg',
        images: ['https://salt.tikicdn.com/cache/w1200/ts/product/a2/03/f8/cover.jpg', ''],
        category: 'kinh te',
        description: '<p>Test</p><p>Giá sản phẩm trên Tiki đã bao gồm thuế</p>',
      },
      {
        internalCategories: ['Kinh tế', 'Văn học'],
        authors: [{ id: 'author-1', name: 'Paul Krugman', bio: 'Nobel', avatar: '' }],
      }
    );

    expect(normalized.id).toBe('book-275625701');
    expect(normalized.authorId).toBe('author-1');
    expect(normalized.authorBio).toBe('Nobel');
    expect(normalized.originalPrice).toBe(100000);
    expect(normalized.stockQuantity).toBe(100);
    expect(normalized.category).toBe('Kinh tế');
    expect(normalized.cover).toBe('https://salt.tikicdn.com/ts/product/a2/03/f8/cover.jpg');
    expect(normalized.images).toEqual(['https://salt.tikicdn.com/ts/product/a2/03/f8/cover.jpg']);
    expect(normalized.description).toBe('Test');
    expect(normalized.slug).toBe('book-275625701');
  });

  it('strips html safely', () => {
    expect(stripHtml('<p>Xin &amp; chào</p>')).toBe('Xin & chào');
  });
});
