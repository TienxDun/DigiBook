/**
 * Toast Adapter - Compatibility layer for react-hot-toast
 * 
 * File này cung cấp API tương thích với react-hot-toast
 * để code cũ vẫn hoạt động với hệ thống Toast mới
 * 
 * Import và sử dụng giống như react-hot-toast:
 * 
 * @example
 * ```tsx
 * import toast from '@/shared/utils/toast';
 * // hoặc
 * import { toast } from '@/shared/utils/toast';
 * 
 * toast.success('Thành công!');
 * toast.error('Có lỗi xảy ra');
 * toast('Thông báo thường');
 * ```
 */

import { ToastType } from '@/shared/components';
import React from 'react';

// Singleton instance để lưu trữ hàm showToast từ context
let toastInstance: {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
} | null = null;

export const setToastInstance = (instance: typeof toastInstance) => {
  toastInstance = instance;
};

// Helper để extract text từ JSX elements
const extractTextFromJSX = (node: any): { title: string; description?: string } => {
  if (typeof node === 'string') {
    return parseMessage(node);
  }
  
  // Nếu là React element với props.children
  if (React.isValidElement(node)) {
    const children = (node.props as any).children;
    
    if (Array.isArray(children)) {
      // Lấy text từ các p tags
      const texts = children
        .filter((child: any) => React.isValidElement(child) && (child as any).type === 'p')
        .map((child: any) => {
          const childProps = (child as any).props;
          return typeof childProps.children === 'string' ? childProps.children : '';
        })
        .filter(Boolean);
      
      if (texts.length >= 2) {
        return { title: texts[0], description: texts.slice(1).join(' ') };
      }
      if (texts.length === 1) {
        return { title: texts[0] };
      }
    }
    
    // Fallback: lấy text content đơn giản
    if (typeof children === 'string') {
      return { title: children };
    }
  }
  
  return { title: String(node) };
};

// Helper function để parse message (có thể là string đơn giản hoặc có title)
const parseMessage = (message: string): { title: string; description?: string } => {
  // Nếu message có dấu ":" hoặc "!" ở đầu, tách làm title và description
  const colonIndex = message.indexOf(':');
  const exclamIndex = message.indexOf('!');
  
  if (colonIndex > 0 && colonIndex < 50) {
    return {
      title: message.substring(0, colonIndex).trim(),
      description: message.substring(colonIndex + 1).trim() || undefined,
    };
  }
  
  if (exclamIndex > 0 && exclamIndex < 50) {
    const title = message.substring(0, exclamIndex + 1).trim();
    const rest = message.substring(exclamIndex + 1).trim();
    return {
      title,
      description: rest || undefined,
    };
  }
  
  return { title: message };
};

// Main toast function
const toast = (message: string | React.ReactNode, options?: { duration?: number }) => {
  if (!toastInstance) {
    console.warn('Toast system not initialized');
    return '';
  }
  
  const { title, description } = typeof message === 'string' 
    ? parseMessage(message)
    : extractTextFromJSX(message);
  
  toastInstance.showToast('info', title, description, options?.duration);
  return `toast-${Date.now()}`;
};

// Toast methods
toast.success = (message: string | React.ReactNode, options?: { duration?: number }) => {
  if (!toastInstance) {
    console.warn('Toast system not initialized');
    return '';
  }
  
  const { title, description } = typeof message === 'string'
    ? parseMessage(message)
    : extractTextFromJSX(message);
  
  toastInstance.showToast('success', title, description, options?.duration);
  return `toast-${Date.now()}`;
};

toast.error = (message: string | React.ReactNode, options?: { duration?: number }) => {
  if (!toastInstance) {
    console.warn('Toast system not initialized');
    return '';
  }
  
  const { title, description } = typeof message === 'string'
    ? parseMessage(message)
    : extractTextFromJSX(message);
  
  toastInstance.showToast('error', title, description, options?.duration);
  return `toast-${Date.now()}`;
};

toast.loading = (message: string, options?: { duration?: number }) => {
  if (!toastInstance) {
    console.warn('Toast system not initialized');
    return '';
  }
  
  const { title, description } = parseMessage(message);
  toastInstance.showToast('info', title, description, options?.duration || 2000);
  return `toast-${Date.now()}`;
};

toast.promise = async <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  },
  options?: { duration?: number }
): Promise<T> => {
  toast.loading(messages.loading, { duration: 1000 });
  
  try {
    const result = await promise;
    toast.success(messages.success, options);
    return result;
  } catch (error) {
    toast.error(messages.error, options);
    throw error;
  }
};

// Named export
export { toast };

// Default export
export default toast;
