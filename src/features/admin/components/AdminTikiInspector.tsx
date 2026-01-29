import React, { useState } from 'react';
import { db } from '@/services/db';
import toast from '@/shared/utils/toast';
import { Book } from '@/shared/types';

interface AdminTikiInspectorProps {
    theme?: 'light' | 'midnight';
}

const AdminTikiInspector: React.FC<AdminTikiInspectorProps> = ({ theme = 'light' }) => {
    const isMidnight = theme === 'midnight';
    const [tikiInput, setTikiInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [rawData, setRawData] = useState<any | null>(null);
    const [mappedData, setMappedData] = useState<Partial<Book> | null>(null);

    const handleInspect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tikiInput.trim()) return;

        // Extract ID if URL is pasted
        let tikiId = tikiInput.trim();
        // Regex for tiki url like https://tiki.vn/...-p123123.html or just 123123
        const urlMatch = tikiId.match(/-p(\d+)\.html/);
        if (urlMatch && urlMatch[1]) {
            tikiId = urlMatch[1];
        } else if (tikiId.includes('tiki.vn') && tikiId.includes('product_id=')) {
            const urlParams = new URLSearchParams(tikiId.split('?')[1]);
            const pid = urlParams.get('product_id');
            if (pid) tikiId = pid;
        }

        setIsLoading(true);
        setRawData(null);
        setMappedData(null);

        try {
            const [raw, mapped] = await Promise.all([
                db.getRawTikiData(tikiId),
                db.getBookDetailsFromTiki(tikiId)
            ]);

            if (raw && !raw.error) {
                setRawData(raw);
                setMappedData(mapped);
                toast.success(`Đã lấy dữ liệu cho ID: ${tikiId}`);
            } else {
                toast.error('Không tìm thấy dữ liệu hoặc lỗi API');
                setRawData(raw); // Show error object if any
            }
        } catch (error) {
            console.error(error);
            toast.error('Lỗi khi kiểm tra Tiki API');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn h-full flex flex-col">
            <div className={`p-6 lg:p-10 rounded-[2.5rem] border shadow-2xl transition-all ${isMidnight ? 'bg-[#1e293b]/40 border-white/5 shadow-black/20' : 'bg-card border-border shadow-slate-200/50'
                }`}>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                            <i className="fa-solid fa-microscope text-primary"></i>
                            Tiki API Inspector
                        </h3>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-premium mt-1">
                            Kiểm tra dữ liệu thô (Raw JSON) trực tiếp từ Tiki
                        </p>
                    </div>
                </div>

                <form onSubmit={handleInspect} className="flex gap-4 items-center max-w-2xl">
                    <div className={`flex-1 flex items-center px-4 h-12 rounded-2xl border ${isMidnight ? 'bg-slate-800/50 border-white/10' : 'bg-muted border-border'
                        }`}>
                        <i className="fa-solid fa-link text-muted-foreground mr-3"></i>
                        <input
                            type="text"
                            value={tikiInput}
                            onChange={(e) => setTikiInput(e.target.value)}
                            placeholder="Nhập Tiki Product ID hoặc dán URL sản phẩm..."
                            className="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-muted-foreground/50"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95 ${isLoading
                                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                : 'bg-primary text-primary-foreground shadow-primary/30 hover:bg-primary/90'
                            }`}
                    >
                        {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-search"></i>}
                        Kiểm tra
                    </button>
                </form>
            </div>

            {(rawData || mappedData) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                    {/* Raw Data Column */}
                    <div className={`p-6 rounded-[2rem] border overflow-hidden flex flex-col ${isMidnight ? 'bg-[#1e293b]/60 border-white/5' : 'bg-card border-border'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-black uppercase tracking-wide text-foreground flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Raw JSON Response
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-muted text-muted-foreground">Read-only</span>
                        </div>
                        <div className={`flex-1 overflow-auto custom-scrollbar rounded-xl p-4 text-xs font-mono border ${isMidnight ? 'bg-slate-950 border-white/5 text-slate-300' : 'bg-slate-50 border-border text-slate-700'
                            }`}>
                            <pre>{JSON.stringify(rawData, null, 2)}</pre>
                        </div>
                    </div>

                    {/* Mapped Data Column */}
                    <div className={`p-6 rounded-[2rem] border overflow-hidden flex flex-col ${isMidnight ? 'bg-[#1e293b]/60 border-white/5' : 'bg-card border-border'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-black uppercase tracking-wide text-foreground flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Mapped Data (DigiBook)
                            </h4>
                        </div>
                        <div className={`flex-1 overflow-auto custom-scrollbar rounded-xl p-4 text-xs font-mono border ${isMidnight ? 'bg-slate-950 border-white/5 text-emerald-400' : 'bg-slate-50 border-border text-emerald-700'
                            }`}>
                            <pre>{JSON.stringify(mappedData, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTikiInspector;
