import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { toast } from 'react-hot-toast';
import { ErrorHandler } from '../../services/errorHandler';
import { AIModelConfig } from '../../types';

interface AIConfig {
  activeModelId: string;
}

interface AdminAIProps {
  aiConfig: AIConfig;
  refreshData: () => void;
}

const AdminAI: React.FC<AdminAIProps> = ({ aiConfig, refreshData }) => {
  const [isUpdatingAI, setIsUpdatingAI] = useState(false);
  const [testPrompt, setTestPrompt] = useState('Hãy viết một lời chào ngắn tới quản trị viên của DigiBook.');
  const [testResult, setTestResult] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  
  // States for CRUD
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AIModelConfig>({
    id: '',
    name: '',
    category: 'Google Gemini',
    rpm: '',
    tpm: '',
    rpd: ''
  });

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
      const data = await db.getAIModels();
      setModels(data);
    } catch (error) {
      ErrorHandler.handle(error, 'tải danh sách model');
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Check which API keys are available
  const keysStatus = {
    gemini: !!import.meta.env.VITE_GEMINI_API_KEY,
    groq: !!import.meta.env.VITE_GROQ_API_KEY,
    openRouter: !!import.meta.env.VITE_OPENROUTER_API_KEY
  };

  const currentModel = models.find(m => m.id === aiConfig.activeModelId);

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

  const handleOpenAddModal = () => {
    setFormData({
      id: '',
      name: '',
      category: 'Google Gemini',
      rpm: '',
      tpm: '',
      rpd: ''
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (model: AIModelConfig) => {
    setFormData({ ...model });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteModel = async (modelId: string) => {
    if (aiConfig.activeModelId === modelId) {
      toast.error('Không thể xóa model đang hoạt động');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn xóa model này?')) return;

    try {
      await db.deleteAIModel(modelId);
      toast.success('Đã xóa model thành công');
      loadModels();
    } catch (error) {
      ErrorHandler.handle(error, 'xóa model AI');
    }
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name) {
      toast.error('Vui lòng điền đầy đủ ID và Tên model');
      return;
    }

    try {
      if (isEditing) {
        await db.updateAIModelInfo(formData);
        toast.success('Đã cập nhật thông tin model');
      } else {
        await db.addAIModel(formData);
        toast.success('Đã thêm model mới');
      }
      setShowModal(false);
      loadModels();
    } catch (error) {
      ErrorHandler.handle(error, 'lưu model AI');
    }
  };

  const handleTestAI = async () => {
    if (!testPrompt.trim()) return;
    
    setIsTesting(true);
    setTestResult('Đang kết nối tới AI...');
    try {
      const result = await db.getAIInsights(null, testPrompt);
      setTestResult(result);
    } catch (error: any) {
      setTestResult('Lỗi: ' + error.message);
      toast.error('Lỗi khi kiểm tra AI API');
    } finally {
      setIsTesting(false);
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
              <h3 className="text-xl font-extrabold">{currentModel?.name || 'Đang cập nhật...'}</h3>
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

        <div className="bg-white rounded-[2rem] p-8 border border-slate-200/60 shadow-xl shadow-slate-200/40 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <i className="fa-solid fa-circle-info"></i>
              </div>
              <h3 className="font-extrabold text-slate-900 uppercase tracking-tight">Trạng thái API & Hạn mức</h3>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1.5 rounded-xl text-micro font-bold uppercase tracking-premium flex items-center gap-2 ${keysStatus.gemini ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${keysStatus.gemini ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-rose-500'}`}></span>
                Gemini
              </span>
              <span className={`px-3 py-1.5 rounded-xl text-micro font-bold uppercase tracking-premium flex items-center gap-2 ${keysStatus.groq ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${keysStatus.groq ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-rose-500'}`}></span>
                Groq
              </span>
              <span className={`px-3 py-1.5 rounded-xl text-micro font-bold uppercase tracking-premium flex items-center gap-2 ${keysStatus.openRouter ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${keysStatus.openRouter ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-rose-500'}`}></span>
                OpenRouter
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            Hệ thống hỗ trợ 3 nhà cung cấp: **Gemini (Google)**, **Groq Cloud** và **OpenRouter**. 
            Các model có hạn mức khác nhau (RPM/TPM). 
            Trong đó **OpenRouter** cung cấp quyền truy cập vào nhiều model "Free" ổn định khi Gemini đạt ngưỡng giới hạn.
          </p>
        </div>
      </div>

      {/* AI API Sandbox / Test */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <i className="fa-solid fa-vial"></i>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg uppercase tracking-tight">Kiểm tra API AI (Sandbox)</h3>
          </div>
          <div className="text-micro font-bold text-slate-400 uppercase tracking-premium">
            Thử nghiệm trực tiếp với Model đang chọn
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-premium ml-1">Câu lệnh thử nghiệm (Prompt)</label>
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                className="w-full h-40 p-5 bg-slate-50 border-none rounded-2xl text-slate-700 font-medium text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                placeholder="Nhập câu hỏi để test..."
              />
              <button
                onClick={handleTestAI}
                disabled={isTesting || !testPrompt.trim()}
                className="w-full py-4 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-200 text-white rounded-2xl font-bold text-sm tracking-tight transition-all shadow-lg shadow-slate-200 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isTesting ? (
                  <>
                    <i className="fa-solid fa-circle-notch animate-spin"></i>
                    ĐANG XỬ LÝ...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane text-xs"></i>
                    GỬI YÊU CẦU TEST
                  </>
                )}
              </button>
            </div>
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-premium ml-1">Kết quả từ AI</label>
              <div className="w-full h-40 p-5 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl overflow-y-auto">
                {testResult ? (
                  <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{testResult}</p>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                    <i className="fa-solid fa-robot text-2xl opacity-20"></i>
                    <p className="text-xs font-bold uppercase tracking-premium opacity-40">Kết quả sẽ hiển thị tại đây</p>
                  </div>
                )}
              </div>
              {testResult && (
                <button 
                  onClick={() => setTestResult('')}
                  className="text-micro font-bold text-indigo-600 uppercase tracking-premium hover:text-indigo-700 transition-colors ml-1"
                >
                  Xóa kết quả
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Model Selection Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100/50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="font-extrabold text-slate-900 text-lg uppercase tracking-tight">Danh sách Model khả dụng</h3>
            <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-micro font-bold uppercase tracking-premium">
              {models.length} Model được hỗ trợ
            </div>
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-micro font-bold uppercase tracking-premium shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
          >
            <i className="fa-solid fa-plus"></i>
            Thêm Model Mới
          </button>
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
                <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {models.map(model => (
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
                    <div className="flex items-center justify-end gap-3">
                      {aiConfig.activeModelId === model.id ? (
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-micro uppercase tracking-premium px-4">
                          <i className="fa-solid fa-circle-check"></i>
                          <span>Đang dùng</span>
                        </div>
                      ) : (
                        <button
                          disabled={isUpdatingAI}
                          onClick={() => handleUpdateAIModel(model.id)}
                          className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-micro font-bold uppercase tracking-premium hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                        >
                          Sử dụng
                        </button>
                      )}
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEditModal(model)}
                          className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-600 flex items-center justify-center transition-all"
                          title="Sửa model"
                        >
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        <button 
                          onClick={() => handleDeleteModel(model.id)}
                          className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition-all"
                          title="Xóa model"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-extrabold text-slate-900 text-lg uppercase tracking-tight">
                {isEditing ? 'Sửa thông tin Model' : 'Thêm Model mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl hover:bg-white flex items-center justify-center text-slate-400 transition-all">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleSaveModel} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-micro font-bold text-slate-400 uppercase tracking-premium ml-1">Model ID (Phải đúng ID của API)</label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-slate-700 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
                  placeholder="e.g. gemini-1.5-pro"
                />
              </div>

              <div className="space-y-2">
                <label className="text-micro font-bold text-slate-400 uppercase tracking-premium ml-1">Tên hiển thị</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-slate-700 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="e.g. Gemini Pro v1.5"
                />
              </div>

              <div className="space-y-2">
                <label className="text-micro font-bold text-slate-400 uppercase tracking-premium ml-1">Phân loại / Nhà cung cấp</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-slate-700 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  <option value="Google Gemini">Google Gemini</option>
                  <option value="Groq Cloud">Groq Cloud</option>
                  <option value="OpenRouter">OpenRouter</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-micro font-bold text-slate-400 uppercase tracking-premium ml-1">RPM</label>
                  <input
                    type="text"
                    value={formData.rpm}
                    onChange={(e) => setFormData({ ...formData, rpm: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-700 font-bold text-xs focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="15"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-micro font-bold text-slate-400 uppercase tracking-premium ml-1">TPM</label>
                  <input
                    type="text"
                    value={formData.tpm}
                    onChange={(e) => setFormData({ ...formData, tpm: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-700 font-bold text-xs focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="1M"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-micro font-bold text-slate-400 uppercase tracking-premium ml-1">RPD</label>
                  <input
                    type="text"
                    value={formData.rpd}
                    onChange={(e) => setFormData({ ...formData, rpd: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-700 font-bold text-xs focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="1.5K"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm tracking-tight hover:bg-slate-200 transition-all"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  className="flex-2 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm tracking-tight shadow-lg shadow-slate-200 hover:bg-indigo-600 transition-all"
                >
                  {isEditing ? 'CẬP NHẬT' : 'THÊM MODEL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAI;
