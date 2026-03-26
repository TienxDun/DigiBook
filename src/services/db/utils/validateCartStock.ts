import { CartItem } from '@/shared/types/';
import { getDoc, doc, getDocs, query, where, documentId, collection } from 'firebase/firestore';
import { db_fs } from '@/lib/firebase';
import { booksApi } from '@/services/api';

export interface StockValidationResult {
    isValid: boolean;
    errors: StockError[];
}

export interface StockError {
    bookId: string;
    title: string;
    requestedQuantity: number;
    availableQuantity: number;
    type: 'OUT_OF_STOCK' | 'INSUFFICIENT_STOCK';
}

const USE_API = import.meta.env.VITE_USE_API === 'true';

/**
 * Kiá»ƒm tra sá»‘ lÆ°á»£ng tá»“n kho cho táº¥t cáº£ items trong giá» hÃ ng
 * @param cartItems - Danh sÃ¡ch items cáº§n kiá»ƒm tra
 * @returns Káº¿t quáº£ validation vá»›i danh sÃ¡ch lá»—i (náº¿u cÃ³)
 */
export async function validateCartStock(cartItems: CartItem[]): Promise<StockValidationResult> {
    if (!cartItems || cartItems.length === 0) {
        return { isValid: true, errors: [] };
    }

    const errors: StockError[] = [];
    const ids = cartItems.map(item => item.id);

    let stockMap = new Map<string, number>();

    try {
        if (USE_API) {
            const books = await booksApi.getBooksByIds(ids);
            books.forEach((book: any) => {
                stockMap.set(book.id, book.stockQuantity || 0);
            });
        } else {
            stockMap = await fetchBooksStockByIds(ids);
        }
    } catch (error) {
        console.error('Error fetching stock map:', error);
    }

    cartItems.forEach((item) => {
        const availableStock = stockMap.get(item.id) ?? 0;

        if (availableStock === 0) {
            errors.push({
                bookId: item.id,
                title: item.title,
                requestedQuantity: item.quantity,
                availableQuantity: 0,
                type: 'OUT_OF_STOCK'
            });
            return;
        }

        if (availableStock < item.quantity) {
            errors.push({
                bookId: item.id,
                title: item.title,
                requestedQuantity: item.quantity,
                availableQuantity: availableStock,
                type: 'INSUFFICIENT_STOCK'
            });
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Kiá»ƒm tra sá»‘ lÆ°á»£ng tá»“n kho cho má»™t sáº£n pháº©m cá»¥ thá»ƒ
 * @param bookId - ID cá»§a sáº£n pháº©m
 * @param requestedQuantity - Sá»‘ lÆ°á»£ng muá»‘n mua
 * @returns Sá»‘ lÆ°á»£ng cÃ³ sáºµn vÃ  cÃ³ Ä‘á»§ hay khÃ´ng
 */
export async function checkBookStock(bookId: string, requestedQuantity: number): Promise<{
    available: number;
    canFulfill: boolean;
}> {
    try {
        let availableStock = 0;

        if (USE_API) {
            const books = await booksApi.getBooksByIds([bookId]);
            const book: any = books[0];
            if (!book) {
                return { available: 0, canFulfill: false };
            }
            availableStock = book.stockQuantity || 0;
        } else {
            const bookDoc = await getDoc(doc(db_fs, 'books', bookId));
            if (!bookDoc.exists()) {
                return { available: 0, canFulfill: false };
            }
            const bookData = bookDoc.data();
            availableStock = bookData.stockQuantity || 0;
        }

        return {
            available: availableStock,
            canFulfill: availableStock >= requestedQuantity
        };
    } catch (error) {
        console.error(`Error checking stock for book ${bookId}:`, error);
        return { available: 0, canFulfill: false };
    }
}

async function fetchBooksStockByIds(ids: string[]): Promise<Map<string, number>> {
    const stockMap = new Map<string, number>();
    const chunkSize = 10;

    for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const q = query(collection(db_fs, 'books'), where(documentId(), 'in', chunk));
        const snap = await getDocs(q);
        snap.docs.forEach(docSnap => {
            const data = docSnap.data();
            stockMap.set(docSnap.id, data.stockQuantity || 0);
        });
    }

    return stockMap;
}
