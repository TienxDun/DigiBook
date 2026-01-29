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
  showToast: (type: ToastType, title: string | React.ReactNode, message?: string, duration?: number, content?: React.ReactNode) => void;
} | null = null;

export const setToastInstance = (instance: typeof toastInstance) => {
  toastInstance = instance;
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

// Helper để xử lý message (string hoặc ReactNode)
const processMessage = (message: string | React.ReactNode): { title?: string, description?: string, content?: React.ReactNode } => {
  if (typeof message === 'string') {
    return parseMessage(message);
  }
  // Nếu là ReactNode, trả về content để render trực tiếp
  return { content: message };
};

// Main toast function
const toast = (message: string | React.ReactNode, options?: { duration?: number }) => {
  if (!toastInstance) {
    console.warn('Toast system not initialized');
    return '';
  }
  
  const { title, description, content } = processMessage(message);
  
  toastInstance.showToast('info', title || '', description, options?.duration, content);
  return `toast-${Date.now()}`;
};

// Toast methods
toast.success = (message: string | React.ReactNode, options?: { duration?: number }) => {
  if (!toastInstance) {
    console.warn('Toast system not initialized');
    return '';
  }
  
  const { title, description, content } = processMessage(message);
  
  toastInstance.showToast('success', title || '', description, options?.duration, content);
  return `toast-${Date.now()}`;
};

toast.error = (message: string | React.ReactNode, options?: { duration?: number }) => {
  if (!toastInstance) {
    console.warn('Toast system not initialized');
    return '';
  }
  
  const { title, description, content } = processMessage(message);
  
  toastInstance.showToast('error', title || '', description, options?.duration, content);
  return `toast-${Date.now()}`;
};

toast.info = (message: string | React.ReactNode, options?: { duration?: number }) => {
  if (!toastInstance) {
    console.warn('Toast system not initialized');
    return '';
  }
  
  const { title, description, content } = processMessage(message);
  
  toastInstance.showToast('info', title || '', description, options?.duration, content);
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
