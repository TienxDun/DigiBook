import { Author, Book } from '@/shared/types';

export interface TikiAuthor {
  id?: number | string;
  name?: string | null;
  slug?: string | null;
}

export interface TikiBadge {
  code?: string | null;
  text?: string | null;
  type?: string | null;
}

export interface TikiImage {
  base_url?: string | null;
  large_url?: string | null;
  medium_url?: string | null;
  small_url?: string | null;
  thumbnail_url?: string | null;
}

export interface TikiSpecificationAttribute {
  code?: string | null;
  name?: string | null;
  value?: string | number | null;
}

export interface TikiSpecificationGroup {
  name?: string | null;
  attributes?: TikiSpecificationAttribute[] | null;
}

export interface TikiCategoryNode {
  id?: number | string;
  name?: string | null;
}

export interface TikiStockItem {
  qty?: number | string | null;
}

export interface TikiQuantitySold {
  text?: string | null;
  value?: number | string | null;
}

export interface TikiProduct {
  id?: number | string | null;
  master_id?: number | string | null;
  sku?: string | number | null;
  name?: string | null;
  short_description?: string | null;
  description?: string | null;
  price?: number | string | null;
  list_price?: number | string | null;
  original_price?: number | string | null;
  discount_rate?: number | string | null;
  rating_average?: number | string | null;
  review_count?: number | string | null;
  thumbnail_url?: string | null;
  images?: TikiImage[] | null;
  authors?: TikiAuthor[] | null;
  badges?: TikiBadge[] | null;
  badges_new?: TikiBadge[] | null;
  badges_v3?: TikiBadge[] | null;
  categories?: TikiCategoryNode | TikiCategoryNode[] | null;
  category?: string | null;
  quantity_sold?: TikiQuantitySold | number | string | null;
  all_time_quantity_sold?: number | string | null;
  inventory_status?: string | null;
  stock_item?: TikiStockItem | null;
  specifications?: TikiSpecificationGroup[] | null;
}

export interface NormalizeTikiBookOptions {
  internalCategories?: string[];
  fallbackCategory?: string;
}

export interface NormalizeBookForPersistenceOptions extends NormalizeTikiBookOptions {
  authors?: Author[];
}

const DEFAULT_CATEGORY = 'Văn học';
const DEFAULT_LANGUAGE = 'Tiếng Việt';
const TIKI_TAX_NOTE = 'Giá sản phẩm trên Tiki đã bao gồm thuế';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Kinh tế': ['kinh te', 'tai chinh', 'doanh nghiep', 'quan tri', 'marketing', 'dau tu'],
  'Kỹ năng': ['ky nang', 'self help', 'song dep', 'phat trien ban than', 'giao tiep'],
  'Lịch sử': ['lich su', 'tieu su', 'chien tranh', 'nhan vat lich su'],
  'Thiếu nhi': ['thieu nhi', 'truyen tranh', 'manga', 'ehon', 'tre em'],
  'Tâm lý': ['tam ly', 'tam linh', 'cam xuc', 'hanh vi'],
  'Văn học': ['van hoc', 'tieu thuyet', 'truyen ngan', 'tho', 'phieu luu'],
};

function safeTrim(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeWhitespace(value: string): string {
  return safeTrim(value).replace(/\s+/g, ' ');
}

function stripVietnamese(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

export function stripHtml(value: string): string {
  return normalizeWhitespace(decodeHtmlEntities(value).replace(/<[^>]*>/g, ' '));
}

function sanitizeDescription(value: string): string {
  let normalized = decodeHtmlEntities(value || '');
  const boilerplateIndex = normalized.indexOf(TIKI_TAX_NOTE);
  if (boilerplateIndex >= 0) {
    normalized = normalized.slice(0, boilerplateIndex);
  }

  normalized = normalized.replace(/<br\s*\/?>/gi, '\n');
  normalized = normalized.replace(/<\/p>/gi, '\n\n');
  normalized = normalized.replace(/<\/li>/gi, '\n');
  normalized = normalized.replace(/<li[^>]*>/gi, '- ');
  normalized = normalized.replace(/<[^>]*>/g, ' ');
  normalized = normalized.replace(/\r/g, '');
  normalized = normalized.replace(/[ \t]+\n/g, '\n');
  normalized = normalized.replace(/\n{3,}/g, '\n\n');
  normalized = normalized.replace(/[ \t]{2,}/g, ' ');
  return normalized.trim();
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.-]/g, '');
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toInt(value: unknown, fallback = 0): number {
  const parsed = Math.trunc(toNumber(value, fallback));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pickFirstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    const normalized = normalizeWhitespace(safeTrim(value));
    if (normalized) return normalized;
  }
  return '';
}

function normalizeImageUrl(url: unknown): string {
  const normalized = safeTrim(url);
  if (!normalized) return '';
  return normalized.replace(/\/cache\/(?:w\d+|[\d]+x[\d]+)\//i, '/');
}

function extractImageCandidates(image?: TikiImage | null): string[] {
  if (!image) return [];
  return [
    normalizeImageUrl(image.base_url),
    normalizeImageUrl(image.large_url),
    normalizeImageUrl(image.medium_url),
    normalizeImageUrl(image.small_url),
    normalizeImageUrl(image.thumbnail_url),
  ].filter(Boolean);
}

function extractImages(product: TikiProduct): string[] {
  const candidates = [
    ...((product.images || []).flatMap(extractImageCandidates)),
    normalizeImageUrl(product.thumbnail_url),
  ].filter(Boolean);

  return Array.from(new Set(candidates));
}

function getProductId(product: Partial<Book> | TikiProduct): string {
  const explicitId = safeTrim((product as Partial<Book>).id);
  if (/^TK-\d+$/i.test(explicitId)) return explicitId.replace(/^TK-/i, '');

  const numericId = pickFirstNonEmpty((product as TikiProduct).id, (product as TikiProduct).master_id);
  if (numericId) return numericId;

  const isbn = safeTrim((product as Partial<Book>).isbn);
  if (/^TK-\d+$/i.test(isbn)) return isbn.replace(/^TK-/i, '');

  return '';
}

function getCanonicalIsbn(product: Partial<Book> | TikiProduct): string {
  const bookIsbn = normalizeWhitespace(safeTrim((product as Partial<Book>).isbn));
  if (bookIsbn) return bookIsbn;

  const sku = normalizeWhitespace(safeTrim((product as TikiProduct).sku));
  if (sku) return sku;

  const productId = getProductId(product);
  return productId ? `TK-${productId}` : '';
}

function getCanonicalDocumentId(product: Partial<Book> | TikiProduct): string {
  // 1. Kiểm tra xem đã có id dạng book- chưa (để tránh tạo lại ID ngẫu nhiên)
  const existingId = normalizeWhitespace(safeTrim((product as Partial<Book>).id));
  if (/^book-/.test(existingId)) return existingId;

  // 2. Ưu tiên dùng Tiki Product ID để ID mang tính cố định (deterministic)
  // Điều này giúp tránh trùng lặp khi nhập cùng một cuốn sách nhiều lần.
  const productId = getProductId(product);
  if (productId) return `book-${productId}`;

  // 3. Cuối cùng mới dùng timestamp (như yêu cầu trong ảnh)
  return `book-${Date.now()}`;
}

function extractSpecificationMap(product: TikiProduct): Map<string, string> {
  const specificationMap = new Map<string, string>();

  for (const group of product.specifications || []) {
    for (const attribute of group.attributes || []) {
      const code = safeTrim(attribute.code);
      const value = normalizeWhitespace(stripHtml(safeTrim(attribute.value)));
      if (code && value) {
        specificationMap.set(code, value);
      }
    }
  }

  return specificationMap;
}

function getPublicationYear(rawValue: string): number {
  if (!rawValue) return 0;
  const match = rawValue.match(/(\d{4})/);
  return match ? toInt(match[1], 0) : 0;
}

function normalizeBadges(product: Partial<Book> | TikiProduct): Book['badges'] {
  const rawBadges = [
    ...(((product as TikiProduct).badges_new as TikiBadge[]) || []),
    ...(((product as TikiProduct).badges_v3 as TikiBadge[]) || []),
    ...(((product as TikiProduct).badges as TikiBadge[]) || []),
    ...((((product as Partial<Book>).badges as Book['badges']) || []) as Book['badges']),
  ];

  const seen = new Set<string>();
  return rawBadges
    .map((badge) => {
      const code = normalizeWhitespace(safeTrim(badge?.code || 'badge'));
      const text = normalizeWhitespace(safeTrim(badge?.text));
      const type = normalizeWhitespace(safeTrim(badge?.type));
      if (!code && !text && !type) return null;
      const key = `${code}|${text}|${type}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return { code, text, type };
    })
    .filter((badge): badge is NonNullable<typeof badge> => Boolean(badge));
}

function normalizeQuantitySold(product: Partial<Book> | TikiProduct): Book['quantitySold'] | undefined {
  const rawQuantity = (product as TikiProduct).quantity_sold ?? (product as Partial<Book>).quantitySold;
  const allTimeQuantity = (product as TikiProduct).all_time_quantity_sold;

  if (rawQuantity && typeof rawQuantity === 'object' && !Array.isArray(rawQuantity)) {
    const text = normalizeWhitespace(safeTrim((rawQuantity as TikiQuantitySold).text));
    const value = toInt((rawQuantity as TikiQuantitySold).value, text ? 0 : toInt(allTimeQuantity, 0));
    if (text || value > 0) {
      return {
        text: text || `${value} đã bán`,
        value,
      };
    }
  }

  const numericValue = toInt(rawQuantity, toInt(allTimeQuantity, 0));
  if (numericValue > 0) {
    return {
      text: `${numericValue} đã bán`,
      value: numericValue,
    };
  }

  return undefined;
}

function normalizeCategory(candidates: string[], internalCategories: string[], fallbackCategory?: string): string {
  const availableCategories = internalCategories.filter(Boolean);
  const fallback = availableCategories.includes(DEFAULT_CATEGORY)
    ? DEFAULT_CATEGORY
    : availableCategories[0] || fallbackCategory || DEFAULT_CATEGORY;

  const normalizedCandidates = candidates
    .map((candidate) => normalizeWhitespace(candidate))
    .filter(Boolean);

  for (const candidate of normalizedCandidates) {
    const exactMatch = availableCategories.find(
      (category) => stripVietnamese(category) === stripVietnamese(candidate)
    );
    if (exactMatch) return exactMatch;
  }

  const haystack = stripVietnamese(normalizedCandidates.join(' '));
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      const matchedCategory = availableCategories.find(
        (item) => stripVietnamese(item) === stripVietnamese(category)
      );
      return matchedCategory || category;
    }
  }

  return fallback;
}

function generateSearchKeywords(book: Partial<Book>): string[] {
  const sources = [
    safeTrim(book.title),
    safeTrim(book.author),
    safeTrim(book.category),
    safeTrim(book.publisher),
    safeTrim(book.isbn),
  ].filter(Boolean);

  const keywords = new Set<string>();
  for (const source of sources) {
    const phrase = normalizeWhitespace(source).toLowerCase();
    if (phrase) keywords.add(phrase);

    for (const token of stripVietnamese(source).split(/[^a-z0-9]+/)) {
      if (token.length >= 2) keywords.add(token);
    }
  }

  return Array.from(keywords);
}

export function normalizeTikiBookData(product: TikiProduct, options: NormalizeTikiBookOptions = {}): Partial<Book> {
  const internalCategories = options.internalCategories || [];
  const specificationMap = extractSpecificationMap(product);

  const title = normalizeWhitespace(safeTrim(product.name));
  const authorNames = (product.authors || [])
    .map((author) => normalizeWhitespace(safeTrim(author.name)))
    .filter(Boolean);
  const author = authorNames.length > 0 ? Array.from(new Set(authorNames)).join(', ') : 'Nhiều tác giả';

  const images = extractImages(product);
  const cover = images[0] || '';

  const price = Math.max(0, toNumber(product.price, 0));
  const rawOriginalPrice = Math.max(toNumber(product.original_price, 0), toNumber(product.list_price, 0));
  const originalPrice = rawOriginalPrice >= price ? rawOriginalPrice : price;
  const discountRate = Math.max(0, toNumber(product.discount_rate, 0));
  // Mặc định 100 sản phẩm tồn kho khi Tiki không trả về dữ liệu
  const rawStockQty = toInt(product.stock_item?.qty, 0);
  const stockQuantity = rawStockQty > 0 ? rawStockQty : 100;
  const isAvailable = stockQuantity > 0 || safeTrim(product.inventory_status).toLowerCase() === 'available';
  const quantitySold = normalizeQuantitySold(product);
  const badges = normalizeBadges(product);

  const category = normalizeCategory(
    [
      safeTrim(product.category),
      ...(Array.isArray(product.categories)
        ? product.categories.map((item) => safeTrim(item?.name))
        : [safeTrim((product.categories as TikiCategoryNode | undefined)?.name)]),
      title,
    ],
    internalCategories,
    options.fallbackCategory
  );

  const description = sanitizeDescription(pickFirstNonEmpty(product.description, product.short_description));
  const publisher = pickFirstNonEmpty(specificationMap.get('publisher_vn'), specificationMap.get('manufacturer'));
  const manufacturer = pickFirstNonEmpty(specificationMap.get('manufacturer'), publisher);
  const publishYear = getPublicationYear(safeTrim(specificationMap.get('publication_date')));
  const pages = Math.max(0, toInt(specificationMap.get('number_of_page'), 0));
  const dimensions = normalizeWhitespace(safeTrim(specificationMap.get('dimensions')));
  const translator = normalizeWhitespace(safeTrim(specificationMap.get('dich_gia')));
  const bookLayout = normalizeWhitespace(safeTrim(specificationMap.get('book_cover')));
  const isbn = getCanonicalIsbn(product);
  const id = getCanonicalDocumentId(product);

  const normalizedBook: Partial<Book> = {
    id,
    title,
    author,
    authorId: '',
    authorBio: '',
    category,
    price,
    originalPrice,
    stockQuantity,
    rating: Math.max(0, toNumber(product.rating_average, 0)),
    cover,
    description,
    isbn,
    pages,
    publisher,
    publishYear,
    language: DEFAULT_LANGUAGE,
    badge: discountRate > 0 ? `-${Math.round(discountRate)}%` : '',
    isAvailable,
    reviewCount: Math.max(0, toInt(product.review_count, 0)),
    quantitySold,
    badges,
    discountRate,
    images,
    dimensions,
    translator,
    bookLayout,
    manufacturer,
    slug: id, // Default slug to the generated ID
  };

  normalizedBook.searchKeywords = generateSearchKeywords(normalizedBook);
  return normalizedBook;
}

export function normalizeBookForPersistence(
  book: Partial<Book>,
  options: NormalizeBookForPersistenceOptions = {}
): Partial<Book> {
  const internalCategories = options.internalCategories || [];
  const authors = options.authors || [];
  const title = normalizeWhitespace(safeTrim(book.title));
  const author = normalizeWhitespace(safeTrim(book.author)) || 'Nhiều tác giả';
  const isbn = getCanonicalIsbn(book);
  const id = getCanonicalDocumentId({ ...book, isbn });
  const images = Array.from(
    new Set((book.images || []).map((image) => normalizeImageUrl(image)).filter(Boolean))
  );
  const cover = normalizeImageUrl(book.cover) || images[0] || '';
  const normalizedImages = images.length > 0 ? images : (cover ? [cover] : []);
  const price = Math.max(0, toNumber(book.price, 0));
  const originalPrice = Math.max(price, toNumber(book.originalPrice, price));
  const exactAuthorMatch = authors.find(
    (item) => stripVietnamese(item.name) === stripVietnamese(author)
  );

  const normalized: Partial<Book> = {
    ...book,
    id,
    title,
    author,
    authorId: exactAuthorMatch?.id || '',
    authorBio: normalizeWhitespace(safeTrim(book.authorBio || exactAuthorMatch?.bio)),
    category: normalizeCategory([safeTrim(book.category), title], internalCategories, options.fallbackCategory),
    price,
    originalPrice,
    // Mặc định 100 sản phẩm tồn kho khi không có dữ liệu
    stockQuantity: toInt(book.stockQuantity, 0) > 0 ? Math.max(0, toInt(book.stockQuantity, 0)) : 100,
    rating: Math.max(0, toNumber(book.rating, 0)),
    cover,
    description: sanitizeDescription(safeTrim(book.description)),
    isbn,
    pages: Math.max(0, toInt(book.pages, 0)),
    publisher: normalizeWhitespace(safeTrim(book.publisher)),
    publishYear: Math.max(0, toInt(book.publishYear, 0)),
    language: normalizeWhitespace(safeTrim(book.language)) || DEFAULT_LANGUAGE,
    badge: normalizeWhitespace(safeTrim(book.badge)),
    isAvailable: Boolean(book.isAvailable ?? Math.max(0, toInt(book.stockQuantity, 0)) > 0),
    slug: normalizeWhitespace(safeTrim(book.slug)) || id,
    viewCount: Math.max(0, toInt(book.viewCount, 0)),
    reviewCount: Math.max(0, toInt(book.reviewCount, 0)),
    discountRate: Math.max(0, toNumber(book.discountRate, 0)),
    images: normalizedImages,
    dimensions: normalizeWhitespace(safeTrim(book.dimensions)),
    translator: normalizeWhitespace(safeTrim(book.translator)),
    bookLayout: normalizeWhitespace(safeTrim(book.bookLayout)),
    manufacturer: normalizeWhitespace(safeTrim(book.manufacturer)),
    quantitySold: normalizeQuantitySold(book),
    badges: normalizeBadges(book),
  };

  if (!normalized.badge && (normalized.discountRate || 0) > 0) {
    normalized.badge = `-${Math.round(normalized.discountRate || 0)}%`;
  }

  normalized.searchKeywords = generateSearchKeywords(normalized);
  return normalized;
}
