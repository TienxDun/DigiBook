
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Book } from '../types/';
import {
  auth,
  googleProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail
} from "../lib/firebase";
import { db } from '@/services/db';
import { toast } from 'react-hot-toast';
import ErrorHandler from '../services/errorHandler';

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
  registerWithEmail: (n: string, e: string, p: string, confirmPw: string) => Promise<void>;
  changePassword: (oldPw: string, newPw: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  wishlist: Book[];
  toggleWishlist: (book: Book) => void;
  clearWishlist: () => void;
  loading: boolean;
  authError: string;
  setAuthError: (err: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [wishlist, setWishlist] = useState<Book[]>(() => JSON.parse(localStorage.getItem('digibook_wishlist') || '[]'));
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');

  const syncUser = useCallback(async (firebaseUser: any, forceName?: string) => {
    if (firebaseUser) {
      const profile = await db.getUserProfile(firebaseUser.uid);

      if (profile?.status === 'banned') {
        if (auth) await signOut(auth);
        setUser(null);
        toast.error('Tài khoản của bạn đã bị khóa bởi quản trị viên.', { id: 'auth-banned' });
        db.logActivity('AUTH_BANNED_BLOCK', `User ${firebaseUser.email} tried to login but is banned`, 'ERROR');
        return false;
      }

      const userData: User = {
        id: firebaseUser.uid,
        name: forceName || profile?.name || firebaseUser.displayName || "Độc giả",
        email: firebaseUser.email || profile?.email || "",
        avatar: profile?.avatar || firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(forceName || firebaseUser.displayName || 'U')}&background=4f46e5&color=fff`,
        isAdmin: profile?.role === 'admin'
      };

      setUser(userData);

      // Đồng bộ wishlist từ Firestore nếu có
      if (profile?.wishlistIds && profile.wishlistIds.length > 0) {
        const remoteBooks = await db.getBooksByIds(profile.wishlistIds);
        setWishlist(remoteBooks);
      } else {
        const localWishlist = JSON.parse(localStorage.getItem('digibook_wishlist') || '[]');
        if (localWishlist.length > 0) {
          // Nếu Firestore trống nhưng local có dữ liệu, đẩy lên Firestore (lần đầu dùng)
          await db.updateWishlist(firebaseUser.uid, localWishlist.map((b: any) => b.id));
        }
      }

      if (!profile || forceName || (firebaseUser.displayName && !profile.name)) {
        await db.updateUserProfile({
          id: firebaseUser.uid,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          role: userData.isAdmin ? 'admin' : 'user',
          ...(!profile && { status: 'active' })
        });
      }
      return true;
    } else {
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    let unsubscribe = () => { };
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        syncUser(firebaseUser).finally(() => setLoading(false));
      });
    } else {
      setLoading(false);
    }
    return () => unsubscribe();
  }, [syncUser]);

  useEffect(() => {
    localStorage.setItem('digibook_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const loginWithGoogle = async () => {
    try {
      if (!auth) throw new Error("Auth not initialized");
      const result = await signInWithPopup(auth, googleProvider);
      const success = await syncUser(result.user);
      if (!success) return;

      db.logActivity('AUTH_LOGIN_GOOGLE', `Email: ${result.user.email}`, 'SUCCESS');
      setShowLoginModal(false);
      toast.success(`Chào mừng trở lại, ${result.user.displayName || 'bạn'}!`);
    } catch (error: any) {
      const result = ErrorHandler.handle(error, 'AUTH_LOGIN_GOOGLE');
      setAuthError(result.error);
    }
  };

  const loginWithEmail = async (e: string, p: string) => {
    try {
      if (!auth) throw new Error("Auth not initialized");
      const result = await signInWithEmailAndPassword(auth, e, p);
      const success = await syncUser(result.user);
      if (!success) return;

      db.logActivity('AUTH_LOGIN_EMAIL', `Email: ${result.user.email}`, 'SUCCESS');
      setShowLoginModal(false);
      setAuthError('');
      toast.success(`Chào mừng trở lại, ${result.user.displayName || 'bạn'}!`);
    } catch (error: any) {
      const result = ErrorHandler.handle(error, 'AUTH_LOGIN_EMAIL');
      setAuthError(result.error);
    }
  };

  const registerWithEmail = async (n: string, e: string, p: string, confirmPw: string) => {
    try {
      if (!auth) throw new Error("Auth not initialized");
      if (p !== confirmPw) {
        setAuthError("Mật khẩu xác nhận không khớp.");
        return;
      }

      const res = await createUserWithEmailAndPassword(auth, e, p);
      await updateProfile(res.user, { displayName: n });
      await syncUser(res.user, n);

      db.logActivity('AUTH_REGISTER', `Email: ${e} | Tên: ${n}`, 'SUCCESS');
      setShowLoginModal(false);
      setAuthError('');
      toast.success('Tạo tài khoản thành công!');
      window.location.hash = '/';
    } catch (error: any) {
      const result = ErrorHandler.handle(error, 'AUTH_REGISTER');
      setAuthError(result.error);
    }
  };

  const changePassword = async (oldPw: string, newPw: string) => {
    try {
      if (!auth || !auth.currentUser) throw new Error("Chưa đăng nhập");
      const isGoogleUser = auth.currentUser.providerData.some(p => p.providerId === 'google.com');
      if (isGoogleUser) throw new Error("Tài khoản Google không thể đổi mật khẩu trực tiếp tại đây.");

      const credential = EmailAuthProvider.credential(auth.currentUser.email!, oldPw);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPw);

      db.logActivity('AUTH_CHANGE_PASSWORD', `Email: ${auth.currentUser.email}`, 'SUCCESS');
      toast.success('Đổi mật khẩu thành công!');
    } catch (error: any) {
      const result = ErrorHandler.handle(error, 'AUTH_CHANGE_PASSWORD');
      throw new Error(result.error);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      if (!auth) throw new Error("Auth not initialized");
      await sendPasswordResetEmail(auth, email);
      db.logActivity('AUTH_FORGOT_PASSWORD', `Email: ${email}`, 'SUCCESS');
      toast.success('Đã gửi email khôi phục mật khẩu!');
    } catch (error: any) {
      const result = ErrorHandler.handle(error, 'AUTH_FORGOT_PASSWORD');
      throw new Error(result.error);
    }
  };

  const logout = async () => {
    const prevEmail = user?.email || 'Unknown';
    if (auth) {
      await signOut(auth);
      db.logActivity('AUTH_LOGOUT', `User: ${prevEmail}`, 'SUCCESS');
    }
    setUser(null);
    // Khi logout, quay lại dùng wishlist từ localStorage
    setWishlist(JSON.parse(localStorage.getItem('digibook_wishlist') || '[]'));
  };

  const toggleWishlist = useCallback(async (book: Book) => {
    let updated: Book[] = [];

    setWishlist(prev => {
      const exists = prev.find(b => b.id === book.id);
      updated = exists ? prev.filter(b => b.id !== book.id) : [...prev, book];
      return updated;
    });

    // Sycn to cloud IF user is logged in - OUTSIDE of state updater
    if (user) {
      try {
        await db.updateWishlist(user.id, updated.map(b => b.id));
      } catch (err) {
        console.error("Wishlist sync error:", err);
      }
    }
  }, [user]);

  const clearWishlist = useCallback(async () => {
    setWishlist([]);
    if (user) {
      try {
        await db.updateWishlist(user.id, []);
      } catch (error) {
        console.error("Failed to clear wishlist on Firestore:", error);
      }
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      changePassword,
      sendPasswordReset,
      logout,
      showLoginModal,
      setShowLoginModal,
      authMode,
      setAuthMode,
      wishlist,
      toggleWishlist,
      clearWishlist,
      loading,
      authError,
      setAuthError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
