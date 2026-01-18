import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileNav from './MobileNav';
import CartSidebar from './CartSidebar';
import { useAuth } from '../AuthContext';
import { CartItem, CategoryInfo, Book } from '../types';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !user.isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export const MainContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  return (
    <main className={`flex-grow ${isAdmin ? '' : 'pt-20 lg:pt-20'}`}>
      {children}
    </main>
  );
};

export const LayoutWrapper: React.FC<{ 
  children: React.ReactNode, 
  cartCount: number, 
  cartItems: CartItem[], 
  selectedCartItemIds: string[],
  onToggleSelection: (id: string) => void,
  onToggleAll: (selectAll: boolean) => void,
  categories: CategoryInfo[],
  allBooks: Book[],
  onOpenCart: () => void, 
  onSearch: (q: string) => void,
  searchQuery: string,
  onRefreshData?: () => void,
  isCartOpen: boolean,
  onCloseCart: () => void,
  onRemoveCart: (id: string) => void,
  onUpdateCartQty: (id: string, delta: number) => void
}> = ({ 
  children, 
  cartCount, 
  cartItems, 
  selectedCartItemIds,
  onToggleSelection,
  onToggleAll,
  categories, 
  allBooks,
  onOpenCart, 
  onSearch, 
  searchQuery, 
  onRefreshData, 
  isCartOpen, 
  onCloseCart, 
  onRemoveCart, 
  onUpdateCartQty 
}) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {!isAdmin && (
        <Header 
          cartCount={cartCount} 
          cartItems={cartItems} 
          categories={categories}
          allBooks={allBooks}
          onOpenCart={onOpenCart} 
          onSearch={onSearch} 
          searchQuery={searchQuery}
          onRefreshData={onRefreshData}
        />
      )}
      
      <MainContent>{children}</MainContent>
      
      {!isAdmin && <Footer />}
      {!isAdmin && <MobileNav cartCount={cartCount} onOpenCart={onOpenCart} onRefreshData={onRefreshData} />}
      
      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={onCloseCart} 
        items={cartItems} 
        selectedIds={selectedCartItemIds}
        onToggleSelection={onToggleSelection}
        onToggleAll={onToggleAll}
        onRemove={onRemoveCart} 
        onUpdateQty={onUpdateCartQty} 
      />
    </div>
  );
};
