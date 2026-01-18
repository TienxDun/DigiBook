import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

const LoginModal: React.FC = () => {
  const { 
    showLoginModal, 
    setShowLoginModal, 
    authError, 
    setAuthError,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    sendPasswordReset
  } = useAuth();
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  if (!showLoginModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      loginWithEmail(email, password);
    } else {
      registerWithEmail(displayName, email, password, confirmPassword);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all">
      <div className="relative bg-white w-full max-w-[380px] rounded-[2rem] p-1 shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-fadeIn overflow-hidden">
        <div className="relative bg-white rounded-[1.9rem] p-8">
          <button 
            onClick={() => {
              setShowLoginModal(false);
              setConfirmPassword('');
              setAuthError('');
            }} 
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all"
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
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-xl outline-none focus:bg-white focus:border-slate-900 font-bold transition-all text-slate-900 text-sm placeholder:text-slate-300" 
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
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-xl outline-none focus:bg-white focus:border-slate-900 font-bold transition-all text-slate-900 text-sm placeholder:text-slate-300" 
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
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-xl outline-none focus:bg-white focus:border-slate-900 font-bold transition-all text-slate-900 text-sm placeholder:text-slate-300" 
                  />
                </div>
                {authMode === 'login' && (
                  <div className="flex justify-end pr-2">
                    <button 
                      type="button"
                      onClick={async () => {
                        if (!email) {
                          setAuthError('Vui lòng nhập Email trước.');
                          return;
                        }
                        try {
                          await sendPasswordReset(email);
                        } catch (err: any) {
                          setAuthError(err.message);
                        }
                      }}
                      className="text-micro font-bold text-slate-400 hover:text-slate-900 uppercase tracking-premium transition-colors"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                )}
              </div>

              {authMode === 'register' && (
                <div className="space-y-1">
                  <div className="relative group">
                    <i className="fa-solid fa-shield-check absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors text-sm"></i>
                    <input 
                      type="password" 
                      required
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      placeholder="Xác nhận mật khẩu" 
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-xl outline-none focus:bg-white focus:border-slate-900 font-bold transition-all text-slate-900 text-sm placeholder:text-slate-300" 
                    />
                  </div>
                </div>
              )}
            </div>
            
            <button 
              type="submit"
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-premium text-micro hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-slate-100"
            >
              {authMode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>

            <div className="relative py-2 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-micro font-bold text-slate-300 uppercase tracking-premium px-1">Hoặc sử dụng</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            <button 
              type="button"
              onClick={loginWithGoogle} 
              className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold flex items-center justify-center gap-4 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-700 active:scale-[0.98] relative overflow-hidden group shadow-lg shadow-slate-100/50"
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-5" alt="Google Logo" />
              <span className="text-micro font-bold uppercase tracking-premium">Tiếp tục bằng Google</span>
              <div className="absolute bottom-0 left-0 w-full h-[3px] flex opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="flex-1 bg-[#4285F4]"></div>
                <div className="flex-1 bg-[#EA4335]"></div>
                <div className="flex-1 bg-[#FBBC05]"></div>
                <div className="flex-1 bg-[#34A853]"></div>
              </div>
            </button>

            <div className="text-center pt-2">
              <button 
                type="button"
                onClick={() => { 
                  setAuthMode(authMode === 'login' ? 'register' : 'login'); 
                  setAuthError(''); 
                  setConfirmPassword('');
                }} 
                className="text-micro font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-premium"
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
