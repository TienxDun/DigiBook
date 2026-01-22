
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/features/auth';
import { BookProvider } from '@/features/books';
import { CartProvider } from '@/features/cart';
import './index.css';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker
registerSW({
  onNeedRefresh() {
    if (confirm('Ứng dụng đã có bản cập nhật mới. Bạn có muốn làm mới ngay?')) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log('Ứng dụng đã sẵn sàng hoạt động ngoại tuyến!');
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <BookProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </BookProvider>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);
