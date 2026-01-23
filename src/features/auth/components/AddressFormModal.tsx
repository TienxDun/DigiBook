import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Address } from '@/shared/types';
import { AddressInput, MapPicker } from '@/shared/components';
import { mapService, AddressResult } from '@/services/map';
import toast from '@/shared/utils/toast';

interface AddressFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (address: Omit<Address, 'id'>) => Promise<void>;
    initialData?: Address | null;
}

export const AddressFormModal: React.FC<AddressFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData
}) => {
    const [formData, setFormData] = useState({
        label: 'Nhà riêng',
        recipientName: '',
        phone: '',
        fullAddress: '',
        isDefault: false
    });

    const [coordinates, setCoordinates] = useState<{ lat: number, lon: number } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                label: initialData.label,
                recipientName: initialData.recipientName,
                phone: initialData.phone,
                fullAddress: initialData.fullAddress,
                isDefault: initialData.isDefault
            });
            // Note: Address interface doesn't store lat/lon currently, but we could if we updated the schema.
            // For now we just reset coordinates or rely on text address.
            setCoordinates(null);
        } else {
            setFormData({
                label: 'Nhà riêng',
                recipientName: '',
                phone: '',
                fullAddress: '',
                isDefault: false
            });
            setCoordinates(null);
        }
    }, [initialData, isOpen]);

    const handleAddressSelect = (result: AddressResult) => {
        if (result.lat && result.lon) {
            setCoordinates({ lat: parseFloat(result.lat), lon: parseFloat(result.lon) });
        }
    };

    const handleMapLocationSelect = async (lat: number, lon: number) => {
        setCoordinates({ lat, lon });
        const details = await mapService.getAddressDetails(lat, lon);
        if (details && details.display_name) {
            setFormData(prev => ({ ...prev, fullAddress: details.display_name }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.recipientName || !formData.phone || !formData.fullAddress) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Có lỗi xảy ra khi lưu địa chỉ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                {initialData ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
                            </h2>
                            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <form id="address-form" onSubmit={handleSubmit} className="space-y-6">

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-3">Tên người nhận <span className="text-rose-500">*</span></label>
                                        <div className="relative group">
                                            <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"></i>
                                            <input
                                                type="text"
                                                value={formData.recipientName}
                                                onChange={e => setFormData({ ...formData, recipientName: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 ring-indigo-500/10 font-bold transition-all text-slate-900"
                                                placeholder="VD: Nguyễn Văn A"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-3">Số điện thoại <span className="text-rose-500">*</span></label>
                                        <div className="relative group">
                                            <i className="fa-solid fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"></i>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 ring-indigo-500/10 font-bold transition-all text-slate-900"
                                                placeholder="VD: 0912 345 678"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-3">Địa chỉ chi tiết <span className="text-rose-500">*</span></label>
                                    <div className="relative z-20">
                                        <i className="fa-solid fa-location-dot absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10"></i>
                                        <AddressInput
                                            label=""
                                            value={formData.fullAddress}
                                            onChange={(val) => setFormData({ ...formData, fullAddress: val })}
                                            onSelect={handleAddressSelect}
                                            placeholder="Tìm kiếm địa chỉ hoặc nhập thủ công..."
                                            className="pl-10 !py-3"
                                        />
                                    </div>

                                    {/* Map Integration */}
                                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                        <MapPicker
                                            onLocationSelect={handleMapLocationSelect}
                                            initialLat={coordinates?.lat}
                                            initialLon={coordinates?.lon}
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-3">Loại địa chỉ</label>
                                        <div className="flex gap-3">
                                            {['Nhà riêng', 'Công ty'].map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, label: type })}
                                                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${formData.label === type
                                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-end pb-3">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${formData.isDefault ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 group-hover:border-indigo-400'
                                                }`}>
                                                {formData.isDefault && <i className="fa-solid fa-check text-white text-xs"></i>}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={formData.isDefault}
                                                onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                                            />
                                            <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">Đặt làm địa chỉ mặc định</span>
                                        </label>
                                    </div>
                                </div>

                            </form>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                form="address-form"
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
                                {initialData ? 'Cập nhật' : 'Lưu địa chỉ'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
