
import React, { useState, useEffect } from 'react';
import toast from '@/shared/utils/toast';
import { useAuth } from '@/features/auth';
import { db } from '@/services/db';
import { UserProfile } from '@/shared/types';
import { ErrorHandler } from '@/services/errorHandler';
import { AddressList, AddressFormModal } from '@/features/auth';

const ProfilePage: React.FC = () => {
    const { user, changePassword } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [stats, setStats] = useState({ orders: 0, wishlist: 0 });

    // Address Management State
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState<any>(null); // Use 'any' or Address if imported
    const [addrLoadingId, setAddrLoadingId] = useState<string | null>(null);

    // Password change state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [pwError, setPwError] = useState('');
    const [pwLoading, setPwLoading] = useState(false);

    // Form state (Personal Info only)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        bio: '',
        gender: 'Nam',
        birthday: ''
    });

    // Refresh profile helper
    const refreshProfile = async () => {
        if (!user) return;
        const profileData = await db.getUserProfile(user.id);
        if (profileData) {
            setProfile(profileData);
            setFormData({
                name: profileData.name || user.name || '',
                phone: profileData.phone || '',
                bio: profileData.bio || '',
                gender: profileData.gender || 'Nam',
                birthday: profileData.birthday || ''
            });
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                const [profileData, ordersData] = await Promise.all([
                    db.getUserProfile(user.id),
                    db.getOrdersByUserId(user.id)
                ]);

                if (profileData) {
                    setProfile(profileData);
                    setFormData({
                        name: profileData.name || user.name || '',
                        phone: profileData.phone || '',
                        bio: profileData.bio || '',
                        gender: profileData.gender || 'Nam',
                        birthday: profileData.birthday || ''
                    });
                    setStats({
                        orders: ordersData.length,
                        wishlist: profileData.wishlistIds?.length || 0
                    });
                } else {
                    setFormData(prev => ({ ...prev, name: user.name }));
                    setStats({ orders: ordersData.length, wishlist: 0 });
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    const handleSaveInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            await db.updateUserProfile({
                id: user.id,
                email: user.email,
                avatar: user.avatar,
                ...formData
            });
            toast.success('Cập nhật thông tin thành công!');
        } catch (error) {
            ErrorHandler.handle(error, 'lưu thông tin cá nhân');
        } finally {
            setSaving(false);
        }
    };

    const handleAddAddress = async (newAddr: any) => {
        if (!user) return;
        try {
            await db.addUserAddress(user.id, newAddr);
            await refreshProfile();
            toast.success('Thêm địa chỉ thành công');
        } catch (error) {
            ErrorHandler.handle(error, 'thêm địa chỉ');
            throw error;
        }
    };

    const handleUpdateAddress = async (addr: any) => {
        if (!user) return;
        try {
            await db.updateUserAddress(user.id, addr);
            await refreshProfile();
            toast.success('Cập nhật địa chỉ thành công');
        } catch (error) {
            ErrorHandler.handle(error, 'cập nhật địa chỉ');
            throw error;
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (!user) return;
        if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;

        setAddrLoadingId(id);
        try {
            await db.removeUserAddress(user.id, id);
            await refreshProfile();
            toast.success('Đã xóa địa chỉ');
        } catch (error) {
            ErrorHandler.handle(error, 'xóa địa chỉ');
        } finally {
            setAddrLoadingId(null);
        }
    };

    const handleSetDefaultAddress = async (id: string) => {
        if (!user) return;
        setAddrLoadingId(id);
        try {
            await db.setDefaultAddress(user.id, id);
            await refreshProfile();
            toast.success('Đã thay đổi địa chỉ mặc định');
        } catch (error) {
            ErrorHandler.handle(error, 'đặt địa chỉ mặc định');
        } finally {
            setAddrLoadingId(null);
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
            toast.success('Đổi mật khẩu thành công!');
            setShowPasswordModal(false);
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            ErrorHandler.handle(err, 'đổi mật khẩu');
            setPwError(err.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
        } finally {
            setPwLoading(false);
        }
    };

    if (!user) return <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">...</div>;
    if (loading) return <div className="min-h-[70vh] flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div></div>;

    return (
        <div className="bg-slate-50 min-h-screen py-10 lg:py-12">
            <div className="w-[94%] xl:w-[75%] 2xl:w-[65%] mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header: Unchanged */}
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                        {/* ... Existing User Header Avatar ... */}
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-all"></div>
                            <img src={user.avatar} alt={user.name} className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl relative z-10 object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-2 uppercase">{user.name}</h1>
                            <p className="text-slate-500 font-bold flex items-center justify-center md:justify-start gap-2">
                                <i className="fa-solid fa-envelope text-indigo-500"></i> {user.email}
                            </p>
                            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                                <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-micro font-bold uppercase tracking-premium text-slate-400">
                                    {user.isAdmin ? 'Quản trị viên' : 'Độc giả thân thiết'}
                                </span>
                                <button onClick={() => setShowPasswordModal(true)} className="px-4 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-full text-micro font-bold uppercase tracking-premium transition-all flex items-center gap-2 group/btn">
                                    <i className="fa-solid fa-key text-[10px] group-hover/btn:rotate-12 transition-transform"></i> Đổi mật khẩu
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-4 gap-8">
                        {/* Sidebar: Stats & Bio */}
                        <div className="space-y-6 lg:col-span-1">
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/60 shadow-slate-200/20 overflow-hidden relative group">
                                <h2 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-tight relative z-10"><i className="fa-solid fa-chart-simple text-indigo-600"></i> Thống kê</h2>
                                <div className="space-y-6 relative z-10">
                                    <div className="flex items-center justify-between"><span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Đơn hàng</span><span className="text-xl font-black text-slate-900">{stats.orders}</span></div>
                                    <div className="flex items-center justify-between"><span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Yêu thích</span><span className="text-xl font-black text-slate-900">{stats.wishlist}</span></div>
                                </div>
                            </div>
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/60 shadow-slate-200/20">
                                <h2 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-tight"><i className="fa-solid fa-address-card text-indigo-600"></i> Tiểu sử</h2>
                                <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Viết vài dòng giới thiệu..." className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 font-medium text-sm transition-all resize-none text-slate-600 shadow-inner" />
                            </div>
                        </div>

                        {/* Main Forms */}
                        <div className="lg:col-span-3 space-y-8">
                            {/* Personal Info Form */}
                            <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-sm border border-slate-200/60 shadow-slate-200/20 relative">
                                <h2 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600"><i className="fa-solid fa-user-pen"></i></div>
                                    Thông tin cá nhân
                                </h2>
                                <form onSubmit={handleSaveInfo} className="space-y-8">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-micro font-bold text-slate-400 uppercase tracking-premium ml-4">Họ và tên</label>
                                            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full pl-6 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 font-bold text-slate-900 shadow-inner" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-micro font-bold text-slate-400 uppercase tracking-premium ml-4">Số điện thoại</label>
                                            <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="09xx xxx xxx" className="w-full pl-6 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 font-bold text-slate-900 shadow-inner" />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-micro font-bold text-slate-400 uppercase tracking-premium ml-4">Giới tính</label>
                                            <div className="flex gap-4">
                                                {['Nam', 'Nữ', 'Khác'].map(g => (
                                                    <button key={g} type="button" onClick={() => setFormData({ ...formData, gender: g })} className={`flex-1 py-4 rounded-2xl font-extrabold text-micro uppercase tracking-premium transition-all ${formData.gender === g ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{g}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-micro font-bold text-slate-400 uppercase tracking-premium ml-4">Ngày sinh</label>
                                            <input type="date" value={formData.birthday} onChange={e => setFormData({ ...formData, birthday: e.target.value })} className="w-full pl-6 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 font-bold text-slate-900 shadow-inner" />
                                        </div>
                                    </div>
                                    <div className="pt-2 flex justify-end">
                                        <button type="submit" disabled={saving} className="px-8 py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-premium text-xs hover:bg-indigo-600 transition-all shadow-lg flex items-center gap-3 disabled:opacity-50">
                                            {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
                                            {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Address Management Section */}
                            <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-sm border border-slate-200/60 shadow-slate-200/20">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600"><i className="fa-solid fa-map-location-dot"></i></div>
                                        Sổ địa chỉ
                                    </h2>
                                    <button
                                        onClick={() => { setEditingAddress(null); setShowAddressModal(true); }}
                                        className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold uppercase tracking-wide text-xs hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 shadow-sm border border-indigo-100"
                                    >
                                        <i className="fa-solid fa-plus"></i> Thêm mới
                                    </button>
                                </div>

                                <AddressList
                                    addresses={profile?.addresses || []}
                                    onDelete={handleDeleteAddress}
                                    onSetDefault={handleSetDefaultAddress}
                                    onEdit={(addr) => { setEditingAddress(addr); setShowAddressModal(true); }}
                                    loadingId={addrLoadingId}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AddressFormModal
                isOpen={showAddressModal}
                onClose={() => {
                    setShowAddressModal(false);
                    setEditingAddress(null);
                }}
                onSave={async (data) => {
                    if (editingAddress) {
                        await handleUpdateAddress({ ...data, id: editingAddress.id });
                    } else {
                        await handleAddAddress(data);
                    }
                }}
                initialData={editingAddress}
            />

            {/* Password Modal (Existing) */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl overflow-hidden">
                        <button onClick={() => setShowPasswordModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all"><i className="fa-solid fa-xmark"></i></button>
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase mb-8">Đổi mật khẩu</h2>
                        <form onSubmit={handlePasswordChange} className="space-y-6">
                            {pwError && <div className="p-4 bg-rose-50 border border-rose-100 text-micro font-bold rounded-2xl flex items-center gap-3 text-rose-600"><i className="fa-solid fa-triangle-exclamation text-sm"></i>{pwError}</div>}
                            <div className="space-y-2"><label className="text-micro font-bold text-slate-400 uppercase tracking-premium ml-4">Mật khẩu cũ</label><input type="password" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-600 font-bold" /></div>
                            <div className="space-y-2"><label className="text-micro font-bold text-slate-400 uppercase tracking-premium ml-4">Mật khẩu mới</label><input type="password" value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-600 font-bold" /></div>
                            <div className="space-y-2"><label className="text-micro font-bold text-slate-400 uppercase tracking-premium ml-4">Xác nhận</label><input type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-600 font-bold" /></div>
                            <button type="submit" disabled={pwLoading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-extrabold uppercase tracking-premium text-micro hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                                {pwLoading && <i className="fa-solid fa-spinner fa-spin"></i>}
                                {pwLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
