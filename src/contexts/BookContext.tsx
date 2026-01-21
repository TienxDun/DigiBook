import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Book, CategoryInfo } from '../types';
import { db } from '@/services/db';

interface BookContextType {
    allBooks: Book[];
    categories: CategoryInfo[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    refreshData: () => Promise<void>;
    loadMore: () => Promise<void>;
    hasMore: boolean;
    viewingBook: Book | null;
    setViewingBook: (book: Book | null) => void;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export const BookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [allBooks, setAllBooks] = useState<Book[]>([]);
    const [categories, setCategories] = useState<CategoryInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [viewingBook, setViewingBook] = useState<Book | null>(null);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [booksRes, catsData] = await Promise.all([
                db.getBooksPaginated(20),
                db.getCategories()
            ]);
            setAllBooks(booksRes.books);
            setLastVisible(booksRes.lastDoc);
            setHasMore(booksRes.books.length === 20);
            setCategories(catsData);
        } catch (e) {
            console.error("Failed to fetch data", e);
            setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    }, []);

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore || !lastVisible) return;

        setLoadingMore(true);
        try {
            const result = await db.getBooksPaginated(10, lastVisible);
            if (result.books.length > 0) {
                setAllBooks(prev => [...prev, ...result.books]);
                setLastVisible(result.lastDoc);
                setHasMore(result.books.length === 10);
            } else {
                setHasMore(false);
            }
        } catch (e) {
            console.error("Failed to load more books", e);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore, lastVisible]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const value = {
        allBooks,
        categories,
        loading,
        loadingMore,
        error,
        hasMore,
        viewingBook,
        setViewingBook,
        refreshData: fetchInitialData,
        loadMore
    };

    return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
};

export const useBooks = () => {
    const context = useContext(BookContext);
    if (context === undefined) {
        throw new Error('useBooks must be used within a BookProvider');
    }
    return context;
};
