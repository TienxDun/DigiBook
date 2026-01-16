
import React, { createContext, useContext } from 'react';
import { Book } from './types';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isAdmin?: boolean;
}

export interface AuthContextType {
  user: User | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (n: string, e: string, p: string) => Promise<void>;
  changePassword: (oldPw: string, newPw: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  wishlist: Book[];
  toggleWishlist: (book: Book) => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
