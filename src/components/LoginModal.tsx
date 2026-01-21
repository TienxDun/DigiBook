import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginModal: React.FC = () => {
  const {
    showLoginModal,
    setShowLoginModal,
    authMode,
    setAuthMode,
    authError,
    setAuthError,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    sendPasswordReset
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!showLoginModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(displayName, email, password, confirmPassword);
      }
    } catch (error) {
      // Error is handled in context
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      // Error handled in context
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError('Vui lòng nhập Email trước.');
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordReset(email);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all">
      <div className="relative bg-white w-full max-w-[380px] rounded-[2rem] p-1 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.15)] border border-white/20 animate-fadeIn overflow-hidden">
        <div className="relative bg-white rounded-[1.9rem] p-8">
          <button
            onClick={() => {
              if (!isLoading) {
                setShowLoginModal(false);
                setConfirmPassword('');
                setAuthError('');
              }
            }}
            disabled={isLoading}
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>

          <div className="mb-8 text-center">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg shadow-slate-200">
              <i className="fa-solid fa-book-open text-white text-xl"></i>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
              {authMode === 'login' ? 'Chào mừng bạn' : 'Tham gia cùng cửa hàng'}
            </h2>
            <p className="text-micro font-bold uppercase tracking-premium text-slate-400 mt-2">
              DigiBook • Không gian tri thức
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authError && (
              <div className="p-3 bg-rose-50 text-rose-500 text-micro font-bold uppercase tracking-premium rounded-xl flex items-center gap-2 animate-shake">
                <i className="fa-solid fa-circle-exclamation text-sm"></i>
                {authError}
              </div>
            )}

            <div className="space-y-3">
              {authMode === 'register' && (
                <div className="space-y-1">
                  <div className="relative group">
                    <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors text-sm"></i>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Họ và tên"
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all text-slate-900 text-sm placeholder:text-slate-300 shadow-sm shadow-slate-200/50 disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="relative group">
                  <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors text-sm"></i>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Địa chỉ Email"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all text-slate-900 text-sm placeholder:text-slate-300 shadow-sm shadow-slate-200/50 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="relative group">
                  <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors text-sm"></i>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mật khẩu"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all text-slate-900 text-sm placeholder:text-slate-300 shadow-sm shadow-slate-200/50 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
                {authMode === 'login' && (
                  <div className="flex justify-end pr-2">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={isLoading}
                      className="text-micro font-bold text-slate-400 hover:text-slate-900 uppercase tracking-premium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                )}
              </div>

              {authMode === 'register' && (
                <div className="space-y-1">
                  <div className="relative group">
                    <i className="fa-solid fa-shield-halved absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors text-sm"></i>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Xác nhận mật khẩu"
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all text-slate-900 text-sm placeholder:text-slate-300 shadow-sm shadow-slate-200/50 disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-premium text-micro hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-slate-100 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && authMode !== 'login' /* Wait, generic loading check */ ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : null}
              {authMode === 'login' ? (isLoading ? 'Đang đăng nhập...' : 'Đăng nhập') : (isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản')}
            </button>

            <div className="relative py-2 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-micro font-bold text-slate-300 uppercase tracking-premium px-1">Hoặc sử dụng</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-4 bg-white border border-slate-200 rounded-2xl font-bold flex items-center justify-center gap-4 hover:bg-slate-50 hover:border-slate-300 hover:shadow-xl transition-all text-slate-700 active:scale-[0.98] relative overflow-hidden group shadow-lg shadow-slate-100/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <i className="fa-solid fa-spinner fa-spin text-slate-400"></i>
              ) : (
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-5" alt="Google Logo" />
              )}
              <span className="text-micro font-bold uppercase tracking-premium">{isLoading ? 'Đang kết nối...' : 'Tiếp tục bằng Google'}</span>
              {!isLoading && (
                <div className="absolute bottom-0 left-0 w-full h-[3px] flex opacity-80 group-hover:opacity-100 transition-opacity">
                  <div className="flex-1 bg-[#4285F4]"></div>
                  <div className="flex-1 bg-[#EA4335]"></div>
                  <div className="flex-1 bg-[#FBBC05]"></div>
                  <div className="flex-1 bg-[#34A853]"></div>
                </div>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!isLoading) {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setAuthError('');
                    setConfirmPassword('');
                  }
                }}
                disabled={isLoading}
                className="text-micro font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-premium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authMode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
