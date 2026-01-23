
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CartProvider, useCart } from './CartContext';
import React, { useEffect } from 'react';
import { Book } from '@/shared/types';

// Mocks
vi.mock('@/services/db', () => ({
    db: {
        getUserCart: vi.fn().mockResolvedValue([]),
        syncUserCart: vi.fn(),
    }
}));

vi.mock('@/services/db/utils/validateCartStock', () => ({
    checkBookStock: vi.fn().mockResolvedValue({ canFulfill: true, available: 10 }),
}));

vi.mock('@/features/auth', () => ({
    useAuth: vi.fn().mockReturnValue({ user: null }),
}));

vi.mock('@/shared/utils/toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Test Component to consume the hook
const TestComponent = () => {
    const { cartCount } = useCart();
    return <div data-testid="cart-count">{cartCount}</div>;
};

// Mock Book Data
const mockBook: Book = {
    id: 'book-1',
    title: 'Test Book',
    author: 'Test Author',
    authorBio: '',
    price: 100000,
    stockQuantity: 10,
    rating: 5,
    cover: 'cover.jpg',
    category: 'Fiction',
    description: 'Desc',
    isbn: '123',
    pages: 100,
    publisher: 'Pub',
    publishYear: 2024,
    language: 'VN'
};

const InteractiveTestComponent = () => {
    const { cart, addToCart, removeFromCart, updateQuantity, cartCount } = useCart();

    return (
        <div>
            <span data-testid="count">{cartCount}</span>
            <button onClick={() => addToCart(mockBook)}>Add Book</button>
            {cart.map(item => (
                <div key={item.id} data-testid={`item-${item.id}`}>
                    <span data-testid={`qty-${item.id}`}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)}>Inc</button>
                    <button onClick={() => updateQuantity(item.id, -1)}>Dec</button>
                    <button onClick={() => removeFromCart(item.id)}>Remove</button>
                </div>
            ))}
        </div>
    );
};

describe('CartContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    it('provides initial empty cart', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );
        expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    });
});

describe('CartContext Interactive', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    it('adds item to cart correctly', async () => {
        render(
            <CartProvider>
                <InteractiveTestComponent />
            </CartProvider>
        );

        const addButton = screen.getByText('Add Book');
        const { fireEvent } = await import('@testing-library/react');
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByTestId('count')).toHaveTextContent('1');
            expect(screen.getByTestId('qty-book-1')).toHaveTextContent('1');
        });
    });

    it('increases quantity when adding same item', async () => {
        render(
            <CartProvider>
                <InteractiveTestComponent />
            </CartProvider>
        );

        const addButton = screen.getByText('Add Book');
        const { fireEvent } = await import('@testing-library/react');

        fireEvent.click(addButton);
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByTestId('count')).toHaveTextContent('2');
            expect(screen.getByTestId('qty-book-1')).toHaveTextContent('2');
        });
    });

    it('updates quantity correctly', async () => {
        render(
            <CartProvider>
                <InteractiveTestComponent />
            </CartProvider>
        );

        const addButton = screen.getByText('Add Book');
        const { fireEvent } = await import('@testing-library/react');
        fireEvent.click(addButton);

        await waitFor(() => expect(screen.getByTestId('qty-book-1')).toHaveTextContent('1'));

        const incButton = screen.getByText('Inc');
        fireEvent.click(incButton);
        await waitFor(() => expect(screen.getByTestId('qty-book-1')).toHaveTextContent('2'));

        const decButton = screen.getByText('Dec');
        fireEvent.click(decButton);
        await waitFor(() => expect(screen.getByTestId('qty-book-1')).toHaveTextContent('1'));
    });

    it('removes item from cart', async () => {
        render(
            <CartProvider>
                <InteractiveTestComponent />
            </CartProvider>
        );

        const addButton = screen.getByText('Add Book');
        const { fireEvent } = await import('@testing-library/react');
        fireEvent.click(addButton);

        await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

        const removeButton = screen.getByText('Remove');
        fireEvent.click(removeButton);

        await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'));
    });
});
