/**
 * Custom Toast System for DigiBook
 * 
 * Hệ thống toast notification tùy chỉnh với:
 * - Giao diện đẹp, hiện đại với gradient backgrounds
 * - Animation mượt mà với Framer Motion
 * - Progress bar tự động đếm ngược
 * - Support 4 loại: success, error, info, warning
 * - Responsive cho mobile & desktop
 * - Tự động dismiss hoặc đóng thủ công
 * - Giới hạn tối đa 3 toast cùng lúc
 */

export { ToastProvider, ToastContext } from './ToastContext';
export { useToast } from './useToast';
export { default as Toast } from './Toast';
export type { ToastData, ToastType } from './Toast';
