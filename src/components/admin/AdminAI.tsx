import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../services/db';
import { toast } from 'react-hot-toast';
import { ErrorHandler } from '../../services/errorHandler';
import { AIModelConfig } from '../../types';
import { AVAILABLE_AI_MODELS } from '../../constants/ai-models';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Portal component for rendering modals outside DOM structure
const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return createPortal(children, document.body);
};

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
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Lock scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

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
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncModels = async () => {
    if (!window.confirm('Bạn có muốn làm mới danh sách model từ hệ thống? Tất cả dữ liệu hiện tại sẽ bị xóa và thay thế bằng cấu hình mặc định.')) return;
    
    setIsUpdatingAI(true);
    try {
      const count = await db.syncAIModels(AVAILABLE_AI_MODELS);
      toast.success(`Đã làm mới hoàn toàn ${count} model hệ thống`);
      loadModels();
    } catch (error) {
      ErrorHandler.handle(error, 'đồng bộ model AI');
    } finally {
      setIsUpdatingAI(false);
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

  if (isLoadingModels) return <div className="p-12 text-center animate-pulse font-black text-primary/40 uppercase tracking-[0.2em] text-sm">Đang khởi tạo AI Engine...</div>;

  return (
    <div className="space-y-8 animate-fadeIn text-foreground">
      {/* AI Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary shadow-3xl shadow-primary/20 rounded-[2.5rem] p-8 text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <i className="fa-solid fa-microchip text-8xl"></i>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-md">
                <i className="fa-solid fa-brain text-xl text-white"></i>
              </div>
              <div>
                <p className="text-micro font-black uppercase tracking-premium opacity-60">Model Hiện tại</p>
                <h3 className="text-xl font-black line-clamp-1">{currentModel?.name || 'Đang cập nhật...'}</h3>
              </div>
            </div>
            <div className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="opacity-60 font-black uppercase text-micro tracking-premium">Trạng thái:</span>
                <span className="font-black uppercase tracking-widest text-micro bg-white/20 px-3 py-1 rounded-xl">Hoạt động</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-60 font-black uppercase text-micro tracking-premium">Phân khúc:</span>
                <span className="font-black uppercase tracking-widest text-micro text-white">{currentModel?.category || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card/40 backdrop-blur-md border-border shadow-3xl'} rounded-[2.5rem] p-8 col-span-2 flex flex-col justify-center gap-6`}>
          <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-border/50">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10 text-primary shadow-sm">
                <i className="fa-solid fa-key text-xl"></i>
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tight text-foreground">Trạng thái Connector</h3>
                <p className="text-micro font-black uppercase tracking-premium text-muted-foreground">Khởi tạo môi trường thông qua .env</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(keysStatus) as Array<keyof typeof keysStatus>).map((key) => (
                <span key={key} className={`px-4 py-2 rounded-xl text-micro font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${
                  keysStatus[key] 
                  ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                  : 'bg-destructive/10 text-destructive border-destructive/20'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${keysStatus[key] ? 'bg-green-500' : 'bg-destructive animate-pulse'}`}></span>
                  {key}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-4">
            <i className="fa-solid fa-shield-halved text-primary mt-1"></i>
            <p className="text-sm leading-relaxed font-bold text-muted-foreground/80 italic">
              "Toàn bộ yêu cầu phân tích từ mô hình được truyền tải qua cổng bảo mật gRPC/Lớp 7. DigiBook AI đảm bảo mọi kết quả trả về tuân thủ tiêu chuẩn an toàn dữ liệu và tối ưu hóa tài nguyên hệ thống."
            </p>
          </div>
        </div>
      </div>

      {/* Main Controls Section */}
      <div className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card/40 backdrop-blur-md border-border shadow-3xl'} rounded-[2.5rem] p-8 min-h-[600px]`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 pb-6 border-b border-border/50">
          <div className="flex items-center gap-10">
            <button
              onClick={() => setActiveTab('models')}
              className={`pb-4 text-micro font-black uppercase tracking-premium relative transition-all ${
                activeTab === 'models' ? 'text-primary' : (isMidnight ? 'text-slate-400 hover:text-primary' : 'text-muted-foreground hover:text-foreground')
              }`}
            >
              Models Registry
              {activeTab === 'models' && <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 w-full h-1 rounded-full bg-primary" />}
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`pb-4 text-micro font-black uppercase tracking-premium relative transition-all ${
                activeTab === 'test' ? 'text-primary' : (isMidnight ? 'text-slate-400 hover:text-primary' : 'text-muted-foreground hover:text-foreground')
              }`}
            >
              AI Laboratory
              {activeTab === 'test' && <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 w-full h-1 rounded-full bg-primary" />}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSyncModels}
              disabled={isUpdatingAI}
              className={`px-6 py-3.5 rounded-2xl font-black text-micro uppercase tracking-premium transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2 ${
                isMidnight 
                  ? 'bg-slate-700/50 text-slate-400 hover:bg-primary hover:text-primary-foreground' 
                  : 'bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              <i className={`fa-solid fa-rotate ${isUpdatingAI ? 'animate-spin' : ''}`}></i>
              Sync Defaults
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-6 py-3.5 rounded-2xl bg-primary text-white font-black text-micro uppercase tracking-premium shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i>
              Register Model
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'models' ? (
            <motion.div
              key="models"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              {Object.entries(groupedModels).map(([category, catModels]) => (
                <div key={category} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-1 bg-primary rounded-full"></div>
                    <h4 className="text-micro font-black uppercase tracking-[0.25em] text-muted-foreground">{category} Ecosystem</h4>
                    <div className="flex-1 h-[1px] bg-border/40"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {catModels.length > 0 ? catModels.map((model) => (
                      <div 
                        key={model.id}
                        className={`group p-6 rounded-3xl border transition-all duration-500 relative flex flex-col justify-between ${
                          activeModelId === model.id 
                          ? (isMidnight ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' : 'bg-primary/5 border-primary shadow-lg shadow-primary/5')
                          : (isMidnight 
                             ? 'bg-slate-800/40 border-white/5 hover:border-primary/40 hover:bg-slate-800' 
                             : 'bg-secondary/30 border-border hover:border-primary/40 hover:bg-card shadow-sm')
                        }`}
                      >
                        {activeModelId === model.id && (
                          <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg animate-bounce-slow">
                            <i className="fa-solid fa-check text-xs"></i>
                          </div>
                        )}
                        
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-micro font-black uppercase tracking-widest text-primary/60">{model.category}</span>
                            <div className="flex gap-2">
                                <button 
                                  onClick={() => handleOpenEditModal(model)}
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90 ${
                                    isMidnight 
                                      ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-primary hover:border-primary/30' 
                                      : 'bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/30'
                                  }`}
                                >
                                  <i className="fa-solid fa-pen-nib text-[10px]"></i>
                                </button>
                                <button 
                                  onClick={() => handleDeleteModel(model.id)}
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90 ${
                                    isMidnight 
                                      ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-destructive hover:border-destructive/30' 
                                      : 'bg-card border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30'
                                  }`}
                                >
                                  <i className="fa-solid fa-trash-alt text-[10px]"></i>
                                </button>
                            </div>
                          </div>
                          
                          <h5 className="text-base font-black text-foreground mb-4 group-hover:text-primary transition-colors">{model.name}</h5>
                          
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-card border border-border/50 p-2.5 rounded-2xl flex flex-col items-center">
                              <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/60 mb-0.5">RPM</span>
                              <span className="font-extrabold text-xs">{model.rpm || '∞'}</span>
                            </div>
                            <div className="bg-card border border-border/50 p-2.5 rounded-2xl flex flex-col items-center">
                              <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/60 mb-0.5">TPM</span>
                              <span className="font-extrabold text-xs">{model.tpm || '∞'}</span>
                            </div>
                            <div className="bg-card border border-border/50 p-2.5 rounded-2xl flex flex-col items-center">
                              <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/60 mb-0.5">RPD</span>
                              <span className="font-extrabold text-xs">{model.rpd || '∞'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          disabled={activeModelId === model.id || isUpdatingAI}
                          onClick={() => handleUpdateModel(model.id)}
                          className={`mt-6 w-full py-3.5 rounded-2xl text-micro font-black uppercase tracking-[0.15em] transition-all disabled:opacity-100 ${
                            activeModelId === model.id 
                            ? 'bg-primary text-white shadow-md shadow-primary/20' 
                            : (isMidnight 
                                ? 'bg-slate-700/50 text-slate-400 hover:bg-primary/10 hover:text-primary' 
                                : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary')
                          }`}
                        >
                          {activeModelId === model.id ? 'Core Engine Active' : 'Switch to this model'}
                        </button>
                      </div>
                    )) : (
                      <p className="text-xs font-semibold text-muted-foreground italic py-4">No registered models found in this category.</p>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="test"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 xl:grid-cols-2 gap-10"
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-micro font-black uppercase tracking-premium text-muted-foreground ml-1">AI Instruction Console</label>
                  <textarea
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    placeholder="Enter system instruction or prompt here..."
                    className="w-full h-80 p-8 rounded-[2rem] bg-secondary/30 border border-border text-foreground font-bold text-sm outline-none focus:border-primary focus:bg-card focus:shadow-3xl focus:shadow-primary/5 transition-all resize-none leading-relaxed"
                  />
                </div>
                <button
                  onClick={handleTestAI}
                  disabled={isTesting}
                  className="w-full py-5 rounded-[1.5rem] bg-primary text-white font-black text-micro uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isTesting ? (
                    <><i className="fa-solid fa-spinner animate-spin"></i> Processing Request...</>
                  ) : (
                    <><i className="fa-solid fa-bolt"></i> Execute AI Test Pulse</>
                  )}
                </button>
              </div>

              <div className="space-y-3 flex flex-col">
                <label className="text-micro font-black uppercase tracking-premium text-muted-foreground ml-1">AI Output Stream</label>
                <div className={`flex-1 rounded-[2rem] border overflow-hidden relative flex flex-col bg-card shadow-3xl`}>
                  <div className="flex-1 p-8 overflow-y-auto custom-scrollbar prose prose-primary prose-xs max-w-none text-foreground/80">
                    {testResult ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {testResult}
                      </ReactMarkdown>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
                        <i className="fa-solid fa-terminal text-5xl mb-6"></i>
                        <p className="text-micro font-black uppercase tracking-widest">Waiting for output...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Register/Edit Model Modal */}
      <AnimatePresence>
        {showModal && (
          <Portal>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className={`w-full max-w-xl rounded-[3rem] shadow-3xl overflow-hidden border ${
                  isMidnight ? 'bg-slate-800 border-white/10' : 'bg-card border-border'
                }`}
              >
                 <div className="p-10 pb-0 flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-micro font-black text-primary uppercase tracking-[0.2em]">{isEditing ? 'Administration' : 'Creation'}</span>
                    <h2 className="text-3xl font-black tracking-tight text-foreground">{isEditing ? 'Modify AI Model' : 'Register New Model'}</h2>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)}
                    className={`w-12 h-12 rounded-2xl transition-all active:scale-90 flex items-center justify-center ${
                      isMidnight 
                        ? 'bg-slate-700/50 text-slate-400 hover:bg-destructive/10 hover:text-destructive' 
                        : 'bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                    }`}
                  >
                    <i className="fa-solid fa-xmark text-lg"></i>
                  </button>
                </div>

                <form onSubmit={handleSaveModel} className="p-10 space-y-8">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-micro font-black uppercase tracking-premium text-muted-foreground ml-1">Ecosystem Provider</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                          className={`w-full px-6 py-4 rounded-2xl border font-bold text-sm outline-none focus:border-primary transition-all ${
                            isMidnight ? 'bg-slate-700/50 border-white/5' : 'bg-secondary/50 border-border'
                          }`}
                        >
                          <option value="Google Gemini">Google Gemini</option>
                          <option value="Groq Cloud">Groq Cloud</option>
                          <option value="OpenRouter">OpenRouter</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-micro font-black uppercase tracking-premium text-muted-foreground ml-1">Model ID (System Name)</label>
                        <input
                          type="text"
                          value={formData.id}
                          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                          placeholder="e.g. gemini-1.5-pro"
                          className={`w-full px-6 py-4 rounded-2xl border font-bold text-sm outline-none focus:border-primary focus:bg-card transition-all ${
                            isMidnight ? 'bg-slate-700/50 border-white/5' : 'bg-secondary/50 border-border'
                          }`}
                        />
                      </div>
                   </div>

                   <div className="space-y-3">
                    <label className="text-micro font-black uppercase tracking-premium text-muted-foreground ml-1">Friendly Display Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Gemini 1.5 Pro (Premium AI)"
                      className={`w-full px-6 py-4 rounded-2xl border font-bold text-sm outline-none focus:border-primary focus:bg-card transition-all ${
                        isMidnight ? 'bg-slate-700/50 border-white/5' : 'bg-secondary/50 border-border'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <label className="text-micro font-black uppercase tracking-premium text-muted-foreground ml-1">RPM Limit</label>
                      <input
                        type="text"
                        value={formData.rpm}
                        onChange={(e) => setFormData({ ...formData, rpm: e.target.value })}
                        placeholder="e.g. 15"
                        className={`w-full px-6 py-4 rounded-2xl border font-bold text-sm outline-none focus:border-primary focus:bg-card transition-all text-center ${
                          isMidnight ? 'bg-slate-700/50 border-white/5' : 'bg-secondary/50 border-border'
                        }`}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-micro font-black uppercase tracking-premium text-muted-foreground ml-1">TPM Limit</label>
                      <input
                        type="text"
                        value={formData.tpm}
                        onChange={(e) => setFormData({ ...formData, tpm: e.target.value })}
                        placeholder="e.g. 1M"
                        className={`w-full px-6 py-4 rounded-2xl border font-bold text-sm outline-none focus:border-primary focus:bg-card transition-all text-center ${
                          isMidnight ? 'bg-slate-700/50 border-white/5' : 'bg-secondary/50 border-border'
                        }`}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-micro font-black uppercase tracking-premium text-muted-foreground ml-1">RPD Limit</label>
                      <input
                        type="text"
                        value={formData.rpd}
                        onChange={(e) => setFormData({ ...formData, rpd: e.target.value })}
                        placeholder="e.g. 1500"
                        className={`w-full px-6 py-4 rounded-2xl border font-bold text-sm outline-none focus:border-primary focus:bg-card transition-all text-center ${
                          isMidnight ? 'bg-slate-700/50 border-white/5' : 'bg-secondary/50 border-border'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className={`flex-1 py-4 rounded-2xl font-black text-micro uppercase tracking-widest transition-all active:scale-95 ${
                        isMidnight ? 'bg-slate-700/50 text-slate-400 hover:bg-border' : 'bg-secondary text-muted-foreground hover:bg-border'
                      }`}
                    >
                      Bỏ qua
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black text-micro uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? <i className="fa-solid fa-spinner animate-spin mr-2"></i> : <i className="fa-solid fa-save mr-2"></i>}
                      {isEditing ? 'Lưu cấu hình' : 'Tạo mới'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAI;
