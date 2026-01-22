import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Book, CartItem } from '@/shared/types/';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/features/auth';
import { db } from '@/services/db';
import { checkBookStock } from '@/services/db/utils/validateCartStock';

interface CartContextType {
    cart: CartItem[];
    cartCount: number;
    selectedCartItemIds: string[];
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
    addToCart: (book: Book, quantity?: number, startPos?: { x: number, y: number }) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, delta: number) => void;
    clearCart: () => void;
    clearSelectedItems: () => void;
    toggleSelection: (id: string) => void;
    toggleAll: (selectAll: boolean) => void;
    selectedItems: CartItem[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>(() =>
        JSON.parse(localStorage.getItem('digibook_cart') || '[]')
    );
    const [selectedCartItemIds, setSelectedCartItemIds] = useState<string[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoadedFromCloud, setIsLoadedFromCloud] = useState(false);
    const { user } = useAuth();

    // Lưu vào localStorage khi giỏ hàng thay đổi
    useEffect(() => {
        localStorage.setItem('digibook_cart', JSON.stringify(cart));
    }, [cart]);

    // Đồng bộ từ Cloud khi người dùng đăng nhập
    useEffect(() => {
        const syncFromCloud = async () => {
            if (user) {
                const cloudCart = await db.getUserCart(user.id);
                if (cloudCart && cloudCart.length > 0) {
                    // Ưu tiên giỏ hàng cloud nếu có
                    setCart(cloudCart);
                }
            }
            setIsLoadedFromCloud(true);
        };
        syncFromCloud();
    }, [user]);

    // Đồng bộ lên Cloud khi giỏ hàng thay đổi
    useEffect(() => {
        if (user && isLoadedFromCloud) {
            db.syncUserCart(user.id, cart);
        }
    }, [cart, user, isLoadedFromCloud]);

    // Đồng bộ lựa chọn với item trong giỏ
    useEffect(() => {
        const cartIds = cart.map(item => item.id);
        setSelectedCartItemIds(prev => prev.filter(id => cartIds.includes(id)));
    }, [cart]);

    const cartCount = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart]);

    const selectedItems = useMemo(() =>
        cart.filter(item => selectedCartItemIds.includes(item.id)),
        [cart, selectedCartItemIds]);

    const addToCart = useCallback(async (book: Book, quantity: number = 1, startPos?: { x: number, y: number }) => {
        // Kiểm tra số lượng hiện tại trong giỏ
        const existingInCart = cart.find(item => item.id === book.id);
        const currentCartQuantity = existingInCart?.quantity || 0;
        const totalQuantityNeeded = currentCartQuantity + quantity;

        // Kiểm tra số lượng tồn kho
        const stockCheck = await checkBookStock(book.id, totalQuantityNeeded);

        if (!stockCheck.canFulfill) {
            if (stockCheck.available === 0) {
                toast.error(
                    <div className="flex flex-col gap-1">
                        <p className="font-semibold">Sản phẩm đã hết hàng!</p>
                        <p className="text-xs font-normal">{book.title}</p>
                    </div>
                );
            } else if (currentCartQuantity >= stockCheck.available) {
                toast.error(
                    <div className="flex flex-col gap-1">
                        <p className="font-semibold">Bạn đã có số lượng tối đa trong giỏ!</p>
                        <p className="text-xs font-normal">Chỉ còn {stockCheck.available} sản phẩm trong kho</p>
                    </div>
                );
            } else {
                const remainingCanAdd = stockCheck.available - currentCartQuantity;
                toast.error(
                    <div className="flex flex-col gap-1">
                        <p className="font-semibold">Không đủ số lượng trong kho!</p>
                        <p className="text-xs font-normal">Bạn chỉ có thể thêm tối đa {remainingCanAdd} sản phẩm nữa</p>
                    </div>
                );
            }
            return;
        }

        // Nếu có đủ hàng, thêm vào giỏ
        setCart(prev => {
            const existing = prev.find(item => item.id === book.id);
            if (existing) {
                return prev.map(item =>
                    item.id === book.id ? { ...item, quantity: item.quantity + quantity } : item
                );
            }
            return [...prev, { ...book, quantity }];
        });

        // Logic animation (copy từ App.tsx cũ hoặc giữ lại để các component gọi)
        if (startPos) {
            const cartIcon = document.querySelector('.cart-trigger');
            if (cartIcon) {
                const rect = cartIcon.getBoundingClientRect();
                const endPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
                window.dispatchEvent(new CustomEvent('cart-animation', {
                    detail: { start: startPos, end: endPos, image: book.cover }
                }));
            }
        }

        // Tự động chọn món vừa thêm
        setSelectedCartItemIds(prev => prev.includes(book.id) ? prev : [...prev, book.id]);

        toast.success(
            <div className="flex flex-col gap-1">
                <p>Đã thêm vào giỏ hàng!</p>
                <p className="text-xs font-normal text-slate-500 line-clamp-1">{book.title}</p>
            </div>
        );

        setIsCartOpen(true);
    }, [cart]);

    const removeFromCart = useCallback((id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    }, []);

    const updateQuantity = useCallback((id: string, delta: number) => {
        setCart(prev => prev.map(item =>
            item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        ));
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
        setSelectedCartItemIds([]);
    }, []);

    const clearSelectedItems = useCallback(() => {
        setCart(prev => prev.filter(item => !selectedCartItemIds.includes(item.id)));
        setSelectedCartItemIds([]);
    }, [selectedCartItemIds]);

    const toggleSelection = useCallback((id: string) => {
        setSelectedCartItemIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }, []);

    const toggleAll = useCallback((selectAll: boolean) => {
        setSelectedCartItemIds(selectAll ? cart.map(i => i.id) : []);
    }, [cart]);

    const value = {
        cart,
        cartCount,
        selectedCartItemIds,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        clearSelectedItems,
        toggleSelection,
        toggleAll,
        selectedItems
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
