import { CartItem } from '../../types/';
import { getDoc, doc } from 'firebase/firestore';
import { db_fs } from '../../lib/firebase';

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
 * Kiểm tra số lượng tồn kho cho tất cả items trong giỏ hàng
 * @param cartItems - Danh sách items cần kiểm tra
 * @returns Kết quả validation với danh sách lỗi (nếu có)
 */
export async function validateCartStock(cartItems: CartItem[]): Promise<StockValidationResult> {
    if (!cartItems || cartItems.length === 0) {
        return { isValid: true, errors: [] };
    }

    const errors: StockError[] = [];

    // Kiểm tra từng item trong giỏ
    const checks = await Promise.all(
        cartItems.map(async (item) => {
            try {
                const bookDoc = await getDoc(doc(db_fs, 'books', item.id));

                if (!bookDoc.exists()) {
                    return {
                        bookId: item.id,
                        title: item.title,
                        requestedQuantity: item.quantity,
                        availableQuantity: 0,
                        type: 'OUT_OF_STOCK' as const
                    };
                }

                const bookData = bookDoc.data();
                const availableStock = bookData.stockQuantity || 0;

                if (availableStock === 0) {
                    return {
                        bookId: item.id,
                        title: item.title,
                        requestedQuantity: item.quantity,
                        availableQuantity: 0,
                        type: 'OUT_OF_STOCK' as const
                    };
                }

                if (availableStock < item.quantity) {
                    return {
                        bookId: item.id,
                        title: item.title,
                        requestedQuantity: item.quantity,
                        availableQuantity: availableStock,
                        type: 'INSUFFICIENT_STOCK' as const
                    };
                }

                return null;
            } catch (error) {
                console.error(`Error checking stock for book ${item.id}:`, error);
                // Nếu có lỗi khi check, coi như sản phẩm hết hàng để an toàn
                return {
                    bookId: item.id,
                    title: item.title,
                    requestedQuantity: item.quantity,
                    availableQuantity: 0,
                    type: 'OUT_OF_STOCK' as const
                };
            }
        })
    );

    // Lọc ra các items có lỗi
    checks.forEach((check) => {
        if (check !== null) {
            errors.push(check);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Kiểm tra số lượng tồn kho cho một sản phẩm cụ thể
 * @param bookId - ID của sản phẩm
 * @param requestedQuantity - Số lượng muốn mua
 * @returns Số lượng có sẵn và có đủ hay không
 */
export async function checkBookStock(bookId: string, requestedQuantity: number): Promise<{
    available: number;
    canFulfill: boolean;
}> {
    try {
        const bookDoc = await getDoc(doc(db_fs, 'books', bookId));

        if (!bookDoc.exists()) {
            return { available: 0, canFulfill: false };
        }

        const bookData = bookDoc.data();
        const availableStock = bookData.stockQuantity || 0;

        return {
            available: availableStock,
            canFulfill: availableStock >= requestedQuantity
        };
    } catch (error) {
        console.error(`Error checking stock for book ${bookId}:`, error);
        return { available: 0, canFulfill: false };
    }
}
