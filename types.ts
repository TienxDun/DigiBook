
export interface Author {
  id: string;
  name: string;
  bio: string;
  avatar: string;
}

export interface Book {
  id: string;
  title: string;
  author: string; // Tên tác giả (để hiển thị nhanh)
  authorId?: string; // ID liên kết đến bảng Author
  authorBio: string;
  price: number;
  original_price?: number;
  stock_quantity: number;
  rating: number;
  cover: string;
  category: string;
  description: string;
  isbn: string;
  pages: number;
  publisher: string;
  publishYear: number;
  language: string;
  badge?: string;
}

export interface CartItem extends Book {
  quantity: number;
}

export interface CategoryInfo {
  name: string;
  icon: string;
  description: string;
}
