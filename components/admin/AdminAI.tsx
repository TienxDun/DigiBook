import React, { useState } from 'react';
import { db } from '../../services/db';
import { toast } from 'react-hot-toast';
import { ErrorHandler } from '../../services/errorHandler';
import { AVAILABLE_AI_MODELS } from '../../constants/ai-models';

interface AIConfig {
  activeModelId: string;
}

interface AdminAIProps {
  aiConfig: AIConfig;
  refreshData: () => void;
}

const AdminAI: React.FC<AdminAIProps> = ({ aiConfig, refreshData }) => {
  const [isUpdatingAI, setIsUpdatingAI] = useState(false);

  const handleUpdateAIModel = async (modelId: string) => {
    if (aiConfig.activeModelId === modelId) return;
    
    setIsUpdatingAI(true);
    try {
      await db.updateAIConfig(modelId);
      toast.success('Đã cập nhật model AI thành công');
      refreshData();
    } catch (error) {
      ErrorHandler.handle(error, 'cập nhật model AI');
    } finally {
      setIsUpdatingAI(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* AI Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <i className="fa-solid fa-microchip text-xl"></i>
            </div>
            <div>
              <p className="text-micro font-bold uppercase tracking-premium opacity-60">Model Hiện tại</p>
              <h3 className="text-xl font-extrabold">{AVAILABLE_AI_MODELS.find(m => m.id === aiConfig.activeModelId)?.name || 'Gemini 1.5 Flash'}</h3>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="opacity-60 font-medium">Trạng thái:</span>
              <span className="font-extrabold uppercase tracking-tight">Hoạt động</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="opacity-60 font-medium">Phiên bản:</span>
              <span className="font-extrabold uppercase tracking-tight">Latest</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm col-span-2">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <i className="fa-solid fa-circle-info"></i>
            </div>
            <h3 className="font-extrabold text-slate-900 uppercase tracking-tight">Lưu ý về hạn mức (Rate Limits)</h3>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            Hệ thống sử dụng Gemini API. Các model có hạn mức khác nhau về RPM (Requests/Min) và TPM (Tokens/Min). 
            Vui lòng chọn model phù hợp với lưu lượng truy cập của cửa hàng để tránh lỗi gián đoạn dịch vụ AI.
          </p>
        </div>
      </div>

      {/* Model Selection Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-extrabold text-slate-900 text-lg uppercase tracking-tight">Danh sách Model khả dụng</h3>
          <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-micro font-bold uppercase tracking-premium">
            {AVAILABLE_AI_MODELS.length} Model được hỗ trợ
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Model ID</th>
                <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Phân loại</th>
                <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium text-center">RPM</th>
                <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium text-center">TPM</th>
                <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium text-center">RPD</th>
                <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {AVAILABLE_AI_MODELS.map(model => (
                <tr key={model.id} className={`hover:bg-slate-50 transition-all group ${aiConfig.activeModelId === model.id ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${aiConfig.activeModelId === model.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <i className="fa-solid fa-microchip text-xs"></i>
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">{model.name}</p>
                        <code className="text-micro font-bold text-slate-400">{model.id}</code>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-micro font-bold uppercase tracking-premium">
                      {model.category}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center text-sm font-bold text-slate-600">{model.rpm}</td>
                  <td className="px-8 py-6 text-center text-sm font-bold text-slate-600">{model.tpm}</td>
                  <td className="px-8 py-6 text-center text-sm font-bold text-slate-600">{model.rpd}</td>
                  <td className="px-8 py-6 text-right">
                    {aiConfig.activeModelId === model.id ? (
                      <div className="flex items-center justify-end gap-2 text-indigo-600 font-bold text-micro uppercase tracking-premium">
                        <i className="fa-solid fa-circle-check"></i>
                        <span>Đang sử dụng</span>
                      </div>
                    ) : (
                      <button
                        disabled={isUpdatingAI}
                        onClick={() => handleUpdateAIModel(model.id)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-900 rounded-xl text-micro font-bold uppercase tracking-premium hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all disabled:opacity-50"
                      >
                        Sử dụng
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAI;
