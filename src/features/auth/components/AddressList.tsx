import React from 'react';
import { Address } from '@/shared/types';
import { motion, AnimatePresence } from 'framer-motion';

interface AddressListProps {
    addresses: Address[];
    onSetDefault?: (id: string) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    onEdit?: (address: Address) => void;
    loadingId?: string | null;
    selectable?: boolean;
    selectedId?: string;
    onSelect?: (address: Address) => void;
}

export const AddressList: React.FC<AddressListProps> = ({
    addresses,
    onSetDefault,
    onDelete,
    onEdit,
    loadingId,
    selectable = false,
    selectedId,
    onSelect
}) => {
    if (addresses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                    <i className="fa-solid fa-map-location-dot text-slate-300 text-xl"></i>
                </div>
                <p className="text-slate-500 font-medium text-xs text-center max-w-xs">
                    Bạn chưa lưu địa chỉ nào.
                </p>
            </div>
        );
    }

    // Sort: Default first, then others
    const sortedAddresses = [...addresses].sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));

    return (
        <div className="grid gap-3">
            <AnimatePresence mode="popLayout">
                {sortedAddresses.map((addr) => {
                    const isSelected = selectedId === addr.id;
                    return (
                        <motion.div
                            layout
                            key={addr.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={() => selectable && onSelect && onSelect(addr)}
                            className={`p-4 rounded-2xl border transition-all relative group ${selectable
                                    ? 'cursor-pointer'
                                    : ''
                                } ${isSelected
                                    ? 'bg-indigo-50 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                                    : addr.isDefault
                                        ? 'bg-white border-slate-200 shadow-sm'
                                        : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${addr.label === 'Nhà riêng'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                            {addr.label}
                                        </span>
                                        {addr.isDefault && (
                                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
                                                Mặc định
                                            </span>
                                        )}
                                        {isSelected && (
                                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white flex items-center gap-1 ml-auto lg:ml-0">
                                                <i className="fa-solid fa-check"></i> Đang chọn
                                            </span>
                                        )}
                                    </div>

                                    <h4 className="font-bold text-slate-900 text-xs mb-0.5 line-clamp-1">{addr.recipientName} <span className="text-slate-300 font-normal mx-1">|</span> <span className="text-slate-500 font-medium">{addr.phone}</span></h4>
                                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{addr.fullAddress}</p>
                                </div>

                                {(onEdit || onDelete) && (
                                    <div className="flex flex-col gap-2 shrink-0">
                                        {onEdit && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEdit(addr); }}
                                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 flex items-center justify-center transition-all shadow-sm"
                                            >
                                                <i className="fa-solid fa-pen text-[10px]"></i>
                                            </button>
                                        )}
                                        {!selectable && onDelete && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete(addr.id); }}
                                                disabled={!!loadingId || addr.isDefault}
                                                className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all shadow-sm ${addr.isDefault
                                                        ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                                        : 'bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50'
                                                    }`}
                                            >
                                                {loadingId === addr.id ? (
                                                    <i className="fa-solid fa-spinner fa-spin text-[10px]"></i>
                                                ) : (
                                                    <i className="fa-regular fa-trash-can text-[10px]"></i>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {!selectable && !addr.isDefault && (
                                <div className="mt-3 pt-3 border-t border-slate-100/50 flex justify-end">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onSetDefault && onSetDefault(addr.id); }}
                                        disabled={!!loadingId}
                                        className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 hover:underline uppercase tracking-wide disabled:opacity-50"
                                    >
                                        {loadingId === addr.id ? 'Đang xử lý...' : 'Đặt làm mặc định'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
