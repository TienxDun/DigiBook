import { CartItem } from '@/shared/types/';
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

/**
 * Check stock quantity for all items in the cart
 */
export async function validateCartStock(cartItems: CartItem[]): Promise<StockValidationResult> {
    if (!cartItems || cartItems.length === 0) {
        return { isValid: true, errors: [] };
    }

    const errors: StockError[] = [];
    const ids = cartItems.map(item => item.id);

    let stockMap = new Map<string, number>();

    try {
        const books = await booksApi.getBooksByIds(ids);
        books.forEach((book: any) => {
            stockMap.set(book.id, book.stockQuantity || 0);
        });
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
 * Check stock for a specific book
 */
export async function checkBookStock(bookId: string, requestedQuantity: number): Promise<{
    available: number;
    canFulfill: boolean;
}> {
    try {
        const books = await booksApi.getBooksByIds([bookId]);
        const book: any = books[0];
        if (!book) {
            return { available: 0, canFulfill: false };
        }
        const availableStock = book.stockQuantity || 0;

        return {
            available: availableStock,
            canFulfill: availableStock >= requestedQuantity
        };
    } catch (error) {
        console.error(`Error checking stock for book ${bookId}:`, error);
        return { available: 0, canFulfill: false };
    }
}

