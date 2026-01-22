
import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileNav from './MobileNav';
import { CartSidebar } from '@/features/cart';

import { useAuth } from '@/features/auth';
import { CartItem, CategoryInfo, Book } from '@/types';

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
    <main className={`flex-grow flex flex-col w-full ${isAdmin ? '' : 'pt-16 lg:pt-20'} `}>
      {children}
    </main>
  );
};

export const LayoutWrapper: React.FC<{
  children: React.ReactNode,
  onSearch: (q: string) => void,
  searchQuery: string,
}> = ({
  children,
  onSearch,
  searchQuery,
}) => {
    const location = useLocation();
    const isAdmin = location.pathname.startsWith('/admin');

    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        {!isAdmin && (
          <Header
            onSearch={onSearch}
            searchQuery={searchQuery}
          />
        )}

        <MainContent>{children}</MainContent>

        {!isAdmin && <Footer />}
        {!isAdmin && <MobileNav />}


        <CartSidebar />
      </div>
    );
  };
