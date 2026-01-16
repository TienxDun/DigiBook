
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../services/db';
import { UserProfile } from '../types';

const ProfilePage: React.FC = () => {
    const { user, changePassword } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Password change state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [pwError, setPwError] = useState('');
    const [pwLoading, setPwLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        bio: '',
        gender: 'Nam',
        birthday: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                const data = await db.getUserProfile(user.id);
                if (data) {
                    setProfile(data);
                    setFormData({
                        name: data.name || user.name || '',
                        phone: data.phone || '',
                        address: data.address || '',
                        bio: data.bio || '',
                        gender: data.gender || 'Nam',
                        birthday: data.birthday || ''
                    });
                } else {
                    // Initialize with auth data if no profile in DB
                    setFormData(prev => ({ ...prev, name: user.name }));
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await db.updateUserProfile({
                id: user.id,
                email: user.email,
                avatar: user.avatar,
                ...formData
            });
            setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu thông tin.' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwError('');
        
        if (passwords.new.length < 6) {
            setPwError('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }

        if (passwords.new !== passwords.confirm) {
            setPwError('Mật khẩu xác nhận không khớp.');
            return;
        }

        if (!passwords.current) {
            setPwError('Vui lòng nhập mật khẩu cũ để xác thực.');
            return;
        }

        setPwLoading(true);
        try {
            await changePassword(passwords.current, passwords.new);
            setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
            setShowPasswordModal(false);
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            setPwError(err.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
        } finally {
            setPwLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-4xl mb-6">
                    <i className="fa-solid fa-user-slash"></i>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Bạn chưa đăng nhập</h2>
                <p className="text-slate-500 mb-8 max-w-sm">Vui lòng đăng nhập để xem và cập nhật thông tin cá nhân của bạn.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen py-12 lg:py-20">
            <div className="w-[92%] xl:w-[60%] mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-all"></div>
                            <img 
                                src={user.avatar} 
                                alt={user.name} 
                                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl relative z-10 object-cover"
                                referrerPolicy="no-referrer"
                            />
                            <button className="absolute bottom-2 right-2 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg z-20 hover:bg-indigo-600 transition-all border-2 border-white">
                                <i className="fa-solid fa-camera text-sm"></i>
                            </button>
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tight mb-2">{user.name}</h1>
                            <p className="text-slate-500 font-bold flex items-center justify-center md:justify-start gap-2">
                                <i className="fa-solid fa-envelope text-indigo-500"></i> {user.email}
                            </p>
                            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                                <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {user.isAdmin ? 'Quản trị viên' : 'Độc giả thân thiết'}
                                </span>
                                <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    ID: {user.id.substring(0, 8)}...
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white">
                                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                                    <i className="fa-solid fa-address-card text-indigo-600"></i>
                                    Tiểu sử
                                </h3>
                                <textarea 
                                    value={formData.bio}
                                    onChange={e => setFormData({...formData, bio: e.target.value})}
                                    placeholder="Viết vài dòng giới thiệu về bản thân..."
                                    className="w-full h-32 p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-100 font-medium text-sm transition-all resize-none text-slate-600"
                                />
                            </div>
                            
                            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
                                <i className="fa-solid fa-shield-halved text-3xl mb-6 text-indigo-400"></i>
                                <h3 className="text-xl font-black mb-2 tracking-tight">Bảo mật tài khoản</h3>
                                <p className="text-slate-400 text-xs mb-6 font-medium leading-relaxed">Thông tin cá nhân của bạn được mã hóa và bảo mật tuyệt đối theo tiêu chuẩn quốc tế.</p>
                                <button 
                                    onClick={() => setShowPasswordModal(true)}
                                    className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    Đổi mật khẩu
                                </button>
                            </div>
                        </div>

                        {/* Password Change Modal */}
                        {showPasswordModal && (
                            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fadeIn">
                                <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl overflow-hidden">
                                     {/* Background Decoration */}
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-violet-600"></div>
                                    <button 
                                        onClick={() => setShowPasswordModal(false)}
                                        className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all"
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>

                                    <div className="mb-8">
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Đổi mật khẩu</h2>
                                        <p className="text-slate-400 text-xs font-medium mt-1">Cập nhật mật khẩu mới cho tài khoản của bạn</p>
                                    </div>

                                    <form onSubmit={handlePasswordChange} className="space-y-6">
                                        {pwError && (
                                            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold rounded-2xl flex items-center gap-3">
                                                <i className="fa-solid fa-triangle-exclamation text-sm"></i>
                                                {pwError}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mật khẩu cũ</label>
                                            <div className="relative group">
                                                <i className="fa-solid fa-key absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"></i>
                                                <input 
                                                    type="password" 
                                                    required
                                                    value={passwords.current}
                                                    onChange={e => setPasswords({...passwords, current: e.target.value})}
                                                    placeholder="Nhập mật khẩu hiện tại"
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 transition-all font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mật khẩu mới</label>
                                            <div className="relative group">
                                                <i className="fa-solid fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"></i>
                                                <input 
                                                    type="password" 
                                                    required
                                                    value={passwords.new}
                                                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                                                    placeholder="Ít nhất 6 ký tự"
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 transition-all font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Xác nhận mật khẩu</label>
                                            <div className="relative group">
                                                <i className="fa-solid fa-shield-check absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"></i>
                                                <input 
                                                    type="password" 
                                                    required
                                                    value={passwords.confirm}
                                                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                                    placeholder="Nhập lại mật khẩu mới"
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 transition-all font-bold"
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            type="submit"
                                            disabled={pwLoading}
                                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {pwLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-[3rem] p-8 lg:p-12 shadow-sm border border-white relative overflow-hidden">
                                {message.text && (
                                    <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm animate-fadeIn ${
                                        message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                    }`}>
                                        <i className={`fa-solid ${message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                                        {message.text}
                                    </div>
                                )}

                                <form onSubmit={handleSave} className="space-y-8">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Họ và tên</label>
                                            <div className="relative group">
                                                <i className="fa-solid fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"></i>
                                                <input 
                                                    type="text" 
                                                    value={formData.name}
                                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 ring-indigo-50 font-bold transition-all text-slate-900" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Số điện thoại</label>
                                            <div className="relative group">
                                                <i className="fa-solid fa-phone absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"></i>
                                                <input 
                                                    type="tel" 
                                                    value={formData.phone}
                                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                                    placeholder="09xx xxx xxx"
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 ring-indigo-50 font-bold transition-all text-slate-900" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Địa chỉ giao hàng</label>
                                        <div className="relative group">
                                            <i className="fa-solid fa-location-dot absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"></i>
                                            <input 
                                                type="text" 
                                                value={formData.address}
                                                onChange={e => setFormData({...formData, address: e.target.value})}
                                                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 ring-indigo-50 font-bold transition-all text-slate-900" 
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Giới tính</label>
                                            <div className="flex gap-4">
                                                {['Nam', 'Nữ', 'Khác'].map(g => (
                                                    <button 
                                                        key={g}
                                                        type="button"
                                                        onClick={() => setFormData({...formData, gender: g})}
                                                        className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                                                            formData.gender === g 
                                                            ? 'bg-slate-900 text-white shadow-lg' 
                                                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        {g}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Ngày sinh</label>
                                            <div className="relative group">
                                                <i className="fa-solid fa-calendar absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"></i>
                                                <input 
                                                    type="date" 
                                                    value={formData.birthday}
                                                    onChange={e => setFormData({...formData, birthday: e.target.value})}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 ring-indigo-50 font-bold transition-all text-slate-900" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button 
                                            type="submit"
                                            disabled={saving}
                                            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-[1.2rem] font-black uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
                                        >
                                            {saving ? (
                                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <i className="fa-solid fa-floppy-disk"></i>
                                            )}
                                            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
