
import { db } from './db';
import { toast } from 'react-hot-toast';

export interface ErrorResponse {
  success: false;
  error: string;
}

export class ErrorHandler {
  static handle(error: any, context: string): ErrorResponse {
    console.error(`[${context}]`, error);
    
    // Log to Firestore system_logs
    try {
      db.logActivity(`ERROR_${context.toUpperCase()}`, error.message || 'Unknown error', 'ERROR');
    } catch (e) {
      console.error("Failed to log error to DB", e);
    }
    
    // Return user-friendly message
    const message = this.getUserMessage(error);
    toast.error(`Lỗi ${context}: ${message}`);
    return { success: false, error: message };
  }
  
  private static getUserMessage(error: any): string {
    const errorCode = error.code || '';
    const errorMessage = error.message || '';

    if (errorCode.includes('permission-denied') || errorMessage.includes('permission-denied')) {
      return 'Bạn không có quyền thực hiện hành động này.';
    }
    if (errorMessage.includes('network') || errorCode.includes('network')) {
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền.';
    }
    if (errorCode === 'auth/wrong-password') {
      return 'Mật khẩu không chính xác.';
    }
    if (errorCode === 'auth/user-not-found') {
      return 'Tài khoản không tồn tại.';
    }
    if (errorCode === 'auth/email-already-in-use') {
      return 'Email này đã được sử dụng cho một tài khoản khác.';
    }
    
    return 'Đã có lỗi xảy ra. Vui lòng thử lại sau giây lát.';
  }
}

export default ErrorHandler;
