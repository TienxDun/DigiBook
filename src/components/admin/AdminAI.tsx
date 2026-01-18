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
  theme?: 'light' | 'midnight';
}

const AdminAI: React.FC<AdminAIProps> = ({ aiConfig, refreshData, theme = 'light' }) => {
  const isMidnight = theme === 'midnight';
  const [activeTab, setActiveTab] = useState<'models' | 'test'>('models');
  const [isUpdatingAI, setIsUpdatingAI] = useState(false);
  const [testPrompt, setTestPrompt] = useState('Hãy viết một lời chào ngắn tới quản trị viên của DigiBook.');
  const [testResult, setTestResult] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  
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

  const keysStatus = {
    gemini: !!import.meta.env.VITE_GEMINI_API_KEY,
    groq: !!import.meta.env.VITE_GROQ_API_KEY,
    openRouter: !!import.meta.env.VITE_OPENROUTER_API_KEY
  };

  const activeModelId = aiConfig.activeModelId;
  const currentModel = models.find(m => m.id === activeModelId);

  const handleUpdateModel = async (modelId: string) => {
    if (activeModelId === modelId) return;
    
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
    setFormData({ id: '', name: '', category: 'Google Gemini', rpm: '', tpm: '', rpd: '' });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (model: AIModelConfig) => {
    setFormData({ ...model });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteModel = async (modelId: string) => {
    if (activeModelId === modelId) {
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

  const groupedModels = {
    'Google Gemini': models.filter(m => m.category === 'Google Gemini'),
    'Groq Cloud': models.filter(m => m.category === 'Groq Cloud' || m.category === 'Groq LPU'),
    'OpenRouter': models.filter(m => m.category === 'OpenRouter'),
  };

  if (isLoadingModels) return <div className="p-12 text-center animate-pulse font-bold text-slate-400 uppercase tracking-widest">Đang khởi tạo AI Engine...</div>;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* AI Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-[2rem] p-8 text-white shadow-xl flex flex-col justify-between ${
          isMidnight 
          ? 'bg-indigo-600/90 backdrop-blur-xl shadow-indigo-500/20 border border-white/10' 
          : 'bg-indigo-600 shadow-indigo-200'
        }`}>
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isMidnight ? 'bg-white/10' : 'bg-white/20'
            }`}>
              <i className="fa-solid fa-microchip text-xl"></i>
            </div>
            <div>
              <p className="text-micro font-bold uppercase tracking-premium opacity-60 text-white/80">Model Hiện tại</p>
              <h3 className="text-xl font-extrabold line-clamp-1 text-white">{currentModel?.name || 'Đang cập nhật...'}</h3>
            </div>
          </div>
          <div className="space-y-3 pt-6 border-t border-white/10">
            <div className="flex justify-between items-center text-sm">
              <span className="opacity-60 font-medium tracking-premium uppercase text-micro text-white/80">Trạng thái:</span>
              <span className="font-extrabold uppercase tracking-widest text-micro bg-white/20 px-2 py-0.5 rounded-lg text-white">Hoạt động</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="opacity-60 font-medium tracking-premium uppercase text-micro text-white/80">Nhà cung cấp:</span>
              <span className="font-extrabold uppercase tracking-widest text-xs text-white">{currentModel?.category || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className={`rounded-[2rem] p-8 border col-span-2 transition-all ${
          isMidnight 
          ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5 shadow-2xl hover:border-indigo-500/30' 
          : 'bg-white border-slate-200/60 shadow-xl shadow-slate-200/40'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isMidnight ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-50 text-amber-500'
              }`}>
                <i className="fa-solid fa-circle-info"></i>
              </div>
              <div>
                <h3 className={`font-extrabold uppercase tracking-tight ${isMidnight ? 'text-white' : 'text-slate-900'}`}>Trạng thái API & Hạn mức</h3>
                <p className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Các nhà cung cấp đã cấu hình trong .env</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1.5 rounded-xl text-micro font-extrabold uppercase tracking-widest flex items-center gap-2 border transition-all ${
                keysStatus.gemini 
                ? (isMidnight ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-green-50 text-green-600 border-green-100') 
                : (isMidnight ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'bg-rose-50 text-rose-600 border-rose-100')
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${keysStatus.gemini ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-rose-500'}`}></span>
                Gemini
              </span>
              <span className={`px-3 py-1.5 rounded-xl text-micro font-extrabold uppercase tracking-widest flex items-center gap-2 border transition-all ${
                keysStatus.groq 
                ? (isMidnight ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-green-50 text-green-600 border-green-100') 
                : (isMidnight ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'bg-rose-50 text-rose-600 border-rose-100')
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${keysStatus.groq ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-rose-500'}`}></span>
                Groq
              </span>
              <span className={`px-3 py-1.5 rounded-xl text-micro font-extrabold uppercase tracking-widest flex items-center gap-2 border transition-all ${
                keysStatus.openRouter 
                ? (isMidnight ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-green-50 text-green-600 border-green-100') 
                : (isMidnight ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'bg-rose-50 text-rose-600 border-rose-100')
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${keysStatus.openRouter ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-rose-500'}`}></span>
                OpenRouter
              </span>
            </div>
          </div>
          <p className={`text-sm leading-relaxed font-medium ${isMidnight ? 'text-slate-400' : 'text-slate-500'}`}>
            Hệ thống DigiBook AI tự động điều phối yêu cầu dựa trên cấu hình model. Mọi dữ liệu phân tích, tạo bìa sách và tóm tắt đều được xử lý thông qua mã hóa bảo mật.
          </p>
        </div>
      </div>

      {/* Main Controls Section */}
      <div className={`rounded-[2.5rem] p-8 border transition-all ${
        isMidnight 
        ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5 shadow-2xl' 
        : 'bg-white border-slate-200/60 shadow-xl shadow-slate-200/40'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-100/50 dark:border-white/5">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('models')}
              className={`pb-4 text-micro font-extrabold uppercase tracking-widest relative transition-all ${
                activeTab === 'models' 
                ? (isMidnight ? 'text-indigo-400' : 'text-indigo-600')
                : (isMidnight ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')
              }`}
            >
              Cấu hình Models
              {activeTab === 'models' && <div className={`absolute bottom-0 left-0 w-full h-1 rounded-full ${isMidnight ? 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]' : 'bg-indigo-600'}`}></div>}
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`pb-4 text-micro font-extrabold uppercase tracking-widest relative transition-all ${
                activeTab === 'test' 
                ? (isMidnight ? 'text-indigo-400' : 'text-indigo-600')
                : (isMidnight ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')
              }`}
            >
              Thử nghiệm AI
              {activeTab === 'test' && <div className={`absolute bottom-0 left-0 w-full h-1 rounded-full ${isMidnight ? 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]' : 'bg-indigo-600'}`}></div>}
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className={`px-6 py-2.5 rounded-xl text-micro font-extrabold uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 ${
              isMidnight 
              ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:bg-indigo-400' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
            }`}
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            Thêm Model mới
          </button>
        </div>

        {activeTab === 'models' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {Object.entries(groupedModels).map(([category, items]) => (
              <div key={category} className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-6 rounded-full ${isMidnight ? 'bg-indigo-500/50' : 'bg-indigo-600'}`}></div>
                  <h4 className={`text-xs font-extrabold uppercase tracking-[0.2em] ${isMidnight ? 'text-slate-300' : 'text-slate-800'}`}>{category}</h4>
                </div>
                <div className="space-y-3">
                  {items.length > 0 ? items.map(model => (
                    <div
                      key={model.id}
                      className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all group border ${
                        activeModelId === model.id
                        ? (isMidnight ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200')
                        : (isMidnight ? 'bg-white/5 border-transparent hover:bg-white/10' : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100')
                      }`}
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          activeModelId === model.id
                          ? (isMidnight ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-indigo-600 text-white')
                          : (isMidnight ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-400 shadow-sm')
                        }`}>
                          <i className={`fa-solid ${category === 'Groq Cloud' || category === 'Groq LPU' ? 'fa-bolt' : category === 'OpenRouter' ? 'fa-globe' : 'fa-brain'}`}></i>
                        </div>
                        <div onClick={() => handleUpdateModel(model.id)} className="cursor-pointer">
                          <p className={`font-extrabold text-sm ${activeModelId === model.id ? (isMidnight ? 'text-indigo-400' : 'text-indigo-700') : (isMidnight ? 'text-slate-200' : 'text-slate-700')}`}>
                            {model.name}
                            {activeModelId === model.id && <i className="fa-solid fa-circle-check ml-2 text-[10px]"></i>}
                          </p>
                          <code className={`text-micro font-bold uppercase tracking-premium mt-0.5 ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>{model.id}</code>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenEditModal(model)}
                            className={`p-2 rounded-lg transition-colors ${isMidnight ? 'hover:bg-amber-500/10 text-slate-500 hover:text-amber-400' : 'hover:bg-amber-50 text-slate-400 hover:text-amber-600'}`}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button 
                            onClick={() => handleDeleteModel(model.id)}
                            className={`p-2 rounded-lg transition-colors ${isMidnight ? 'hover:bg-rose-500/10 text-slate-500 hover:text-rose-400' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'}`}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-0.5 pointer-events-none">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter tabular-nums text-right">RPM: {model.rpm}</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter tabular-nums text-right">TPM: {model.tpm}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className={`p-4 rounded-xl border-dashed border-2 text-center text-micro font-bold uppercase tracking-widest ${isMidnight ? 'border-white/5 text-slate-600' : 'border-slate-100 text-slate-300'}`}>
                        Chưa có model
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8 max-w-4xl mx-auto py-4">
            <div className={`rounded-3xl p-8 border transition-all ${isMidnight ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMidnight ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-600 text-white'}`}>
                        <i className="fa-solid fa-terminal text-xs"></i>
                    </div>
                    <span className={`text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-400' : 'text-slate-500'}`}>AI Playground Console</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full animate-pulse bg-emerald-500`}></span>
                    <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-widest">Connected</span>
                </div>
              </div>

              <div className="relative group">
                <textarea
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder="Nhập câu hỏi để thử nghiệm khả năng phân tích của AI..."
                  className={`w-full min-h-[160px] p-6 rounded-2xl border transition-all resize-none outline-none font-medium text-sm leading-relaxed ${
                    isMidnight 
                    ? 'bg-slate-800/50 border-white/5 text-slate-200 focus:border-indigo-500/50 focus:bg-slate-800' 
                    : 'bg-white border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50'
                  }`}
                />
                <button
                  onClick={handleTestAI}
                  disabled={isTesting || !testPrompt.trim()}
                  className={`absolute bottom-6 right-6 px-8 py-3 rounded-xl text-micro font-extrabold uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 ${
                    isTesting || !testPrompt.trim()
                    ? 'opacity-50 cursor-not-allowed bg-slate-400 text-white'
                    : (isMidnight ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100')
                  }`}
                >
                  {isTesting ? (
                    <><i className="fa-solid fa-circle-notch animate-spin"></i> Processing...</>
                  ) : (
                    <><i className="fa-solid fa-bolt"></i> Execute Prompt</>
                  )}
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`p-8 rounded-3xl border animate-slideUp relative overflow-hidden ${
                isMidnight ? 'bg-emerald-500/[0.03] border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-emerald-50/50 border-emerald-100 shadow-sm'
              }`}>
                <div className={`absolute top-0 left-0 w-1 h-full bg-emerald-500/50`}></div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <i className="fa-solid fa-square-poll-vertical"></i>
                        <span className="text-micro font-extrabold uppercase tracking-widest">AI Output Response</span>
                    </div>
                    <button onClick={() => setTestResult('')} className="text-micro font-bold uppercase text-slate-400 hover:text-rose-500 transition-colors">Clear</button>
                </div>
                <div className={`text-sm leading-relaxed whitespace-pre-wrap font-medium ${isMidnight ? 'text-slate-300' : 'text-slate-700'}`}>
                  {testResult}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CRUD Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className={`w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border transition-all animate-scaleIn ${
            isMidnight ? 'bg-[#1e293b] border-white/10 shadow-indigo-500/30' : 'bg-white border-white'
          }`}>
            <div className={`px-8 py-8 border-b flex justify-between items-center ${
              isMidnight ? 'bg-white/5 border-white/5' : 'bg-slate-50/50 border-slate-50'
            }`}>
              <div>
                <h3 className={`font-extrabold text-xl uppercase tracking-tight ${isMidnight ? 'text-white' : 'text-slate-900'}`}>
                  {isEditing ? 'Sửa thông tin Model' : 'Thêm Model mới'}
                </h3>
                <p className={`text-micro font-bold uppercase tracking-premium mt-1 ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Cấu hình tham số kỹ thuật AI</p>
              </div>
              <button onClick={() => setShowModal(false)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                isMidnight ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-white text-slate-400 shadow-sm'
              }`}>
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            
            <form onSubmit={handleSaveModel} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className={`text-micro font-bold uppercase tracking-premium ml-1 ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Model ID (API ID)</label>
                    <input
                    type="text"
                    required
                    disabled={isEditing}
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className={`w-full px-5 py-4 rounded-2xl font-bold text-sm transition-all outline-none border ${
                        isMidnight 
                        ? 'bg-slate-800/50 border-white/5 text-white focus:border-indigo-500/50' 
                        : 'bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-50'
                    }`}
                    placeholder="e.g. gemini-1.5-pro"
                    />
                </div>

                <div className="space-y-2">
                    <label className={`text-micro font-bold uppercase tracking-premium ml-1 ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Tên hiển thị</label>
                    <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-5 py-4 rounded-2xl font-bold text-sm transition-all outline-none border ${
                        isMidnight 
                        ? 'bg-slate-800/50 border-white/5 text-white focus:border-indigo-500/50' 
                        : 'bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-50'
                    }`}
                    placeholder="e.g. Gemini Pro v1.5"
                    />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-micro font-bold uppercase tracking-premium ml-1 ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Phân loại / Nhà cung cấp</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-5 py-4 rounded-2xl font-bold text-sm transition-all outline-none border appearance-none ${
                    isMidnight 
                    ? 'bg-slate-800/50 border-white/5 text-white focus:border-indigo-500/50' 
                    : 'bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-50'
                  }`}
                >
                  <option value="Google Gemini">Google Gemini</option>
                  <option value="Groq Cloud">Groq Cloud</option>
                  <option value="OpenRouter">OpenRouter</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className={`text-micro font-bold uppercase tracking-premium ml-1 ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>RPM</label>
                  <input
                    type="text"
                    value={formData.rpm}
                    onChange={(e) => setFormData({ ...formData, rpm: e.target.value })}
                    className={`w-full px-4 py-4 rounded-xl font-bold text-xs transition-all outline-none border text-center ${
                      isMidnight 
                      ? 'bg-slate-800/50 border-white/5 text-white focus:border-indigo-500/50' 
                      : 'bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-50'
                    }`}
                    placeholder="15"
                  />
                </div>
                <div className="space-y-2">
                  <label className={`text-micro font-bold uppercase tracking-premium ml-1 ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>TPM</label>
                  <input
                    type="text"
                    value={formData.tpm}
                    onChange={(e) => setFormData({ ...formData, tpm: e.target.value })}
                    className={`w-full px-4 py-4 rounded-xl font-bold text-xs transition-all outline-none border text-center ${
                      isMidnight 
                      ? 'bg-slate-800/50 border-white/5 text-white focus:border-indigo-500/50' 
                      : 'bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-50'
                    }`}
                    placeholder="1M"
                  />
                </div>
                <div className="space-y-2">
                  <label className={`text-micro font-bold uppercase tracking-premium ml-1 ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>RPD</label>
                  <input
                    type="text"
                    value={formData.rpd}
                    onChange={(e) => setFormData({ ...formData, rpd: e.target.value })}
                    className={`w-full px-4 py-4 rounded-xl font-bold text-xs transition-all outline-none border text-center ${
                      isMidnight 
                      ? 'bg-slate-800/50 border-white/5 text-white focus:border-indigo-500/50' 
                      : 'bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-50'
                    }`}
                    placeholder="1.5K"
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`flex-1 py-4 rounded-2xl font-bold text-sm tracking-tight transition-all active:scale-95 ${
                    isMidnight ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  HUỶ BỎ
                </button>
                <button
                  type="submit"
                  className={`flex-[2] py-4 rounded-2xl font-bold text-sm tracking-tight transition-all active:scale-95 shadow-lg ${
                    isMidnight 
                    ? 'bg-indigo-500 text-white shadow-indigo-500/20 hover:bg-indigo-400' 
                    : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'
                  }`}
                >
                  {isEditing ? 'CẬP NHẬT MODEL' : 'XÁC NHẬN THÊM'}
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
