import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/db';
import { AIModelConfig } from '../../types';
import { AVAILABLE_AI_MODELS } from '../../constants/ai-models';
import ReactMarkdown from 'react-markdown';

const formatTimeAgo = (date: any) => {
  if (!date) return 'Vừa xong';
  const d = date.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
};

interface AdminAIProps {
  theme: "midnight" | "light";
  aiConfig: { activeModelId: string };
  refreshData: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const AdminAI: React.FC<AdminAIProps> = ({ theme, aiConfig, refreshData }) => {
  const isMidnight = theme === 'midnight';
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [activeModelId, setActiveModelId] = useState(aiConfig.activeModelId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('Bạn là một trợ lý AI thông minh tại DigiBook, luôn giúp đỡ người dùng một cách chuyên nghiệp và thân thiện.');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadData = async () => {
    const loadedModels = await db.getAIModels();
    setModels(loadedModels);
  };

  const handleModelChange = async (modelId: string) => {
    try {
      await db.updateAIConfig(modelId);
      setActiveModelId(modelId);
      refreshData();
    } catch (error) {
      console.error("Failed to update AI model", error);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    const currentMessages = [...messages];

    // Add system message if it's the first message or if we want to ensure context
    const messagesToFetch: ChatMessage[] = [];
    if (systemPrompt.trim()) {
      messagesToFetch.push({ role: 'system', content: systemPrompt });
    }
    messagesToFetch.push(...currentMessages, userMsg);

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await db.chatWithAI(messagesToFetch);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Lỗi: Không thể kết nối tới AI service. Vui lòng kiểm tra API Key." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncModels = async () => {
    if (!window.confirm("Bạn có muốn làm mới danh sách Model từ hệ thống? Việc này sẽ ghi đè danh sách hiện tại.")) return;

    setLoading(true);
    try {
      await db.syncAIModels(AVAILABLE_AI_MODELS);
      await loadData();
      alert("Đã đồng bộ thành công dánh sách Model!");
    } catch (error) {
      console.error("Sync failed", error);
      alert("Lỗi khi đồng bộ Model.");
    } finally {
      setLoading(false);
    }
  };

  const handleScanGroqModels = async () => {
    setLoading(true);
    try {
      const groqModels = await db.fetchGroqModels();
      if (groqModels.length === 0) {
        alert("Không tìm thấy model nào từ Groq hoặc lỗi API Key.");
        return;
      }

      let addedCount = 0;
      for (const m of groqModels) {
        const modelConfig: AIModelConfig = {
          id: m.id,
          name: m.id.split(':').pop() || m.id,
          category: 'Groq Cloud',
          rpm: 'N/A',
          tpm: 'N/A',
          rpd: 'N/A'
        };
        await db.addAIModel(modelConfig);
        addedCount++;
      }

      await loadData();
      alert(`Đã nhập xong ${addedCount} models từ Groq Cloud!`);
    } catch (error) {
      console.error("Groq scan failed", error);
      alert("Lỗi khi quét Groq Models.");
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(models.map(m => m.category)))];

  const filteredModels = models.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || m.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const activeModel = models.find(m => m.id === activeModelId);

  return (
    <div className={`h-[calc(100vh-140px)] flex gap-4 animate-fadeIn p-2 overflow-hidden`}>

      {/* LEFT: MODEL REGISTRY SIDEBAR */}
      <div className={`w-80 flex flex-col rounded-3xl border shadow-xl overflow-hidden transition-all duration-500 shrink-0 ${isMidnight ? 'bg-slate-900/60 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200 shadow-slate-200/50'
        }`}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xs font-black uppercase tracking-widest ${isMidnight ? 'text-slate-200' : 'text-slate-800'}`}>
              <i className="fa-solid fa-microchip mr-2 text-primary"></i>
              Model Registry
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {models.length}
            </span>
          </div>

          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground"></i>
              <input
                type="text"
                placeholder="Tìm model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-8 pr-3 py-2.5 rounded-xl text-[10px] font-bold outline-none transition-all ${isMidnight ? 'bg-black/30 text-white border border-white/5 focus:border-primary/50' : 'bg-slate-100 border border-slate-200'
                  }`}
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all border ${filterCategory === cat
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : isMidnight ? 'bg-slate-800/50 border-white/5 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-primary'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {filteredModels.map((model, idx) => (
            <button
              key={model.id}
              onClick={() => handleModelChange(model.id)}
              className={`w-full p-3 rounded-2xl text-left transition-all relative border overflow-hidden group ${activeModelId === model.id
                ? isMidnight ? 'bg-primary/10 border-primary/40' : 'bg-primary/5 border-primary/20'
                : isMidnight ? 'bg-transparent border-transparent hover:bg-white/5' : 'bg-transparent border-transparent hover:bg-slate-50'
                }`}
            >
              <div className="flex items-start justify-between mb-1">
                <span className={`text-[11px] font-black uppercase tracking-tight transition-all ${activeModelId === model.id ? 'text-primary' : isMidnight ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                  {model.name}
                </span>
                {activeModelId === model.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(112,51,255,1)]"></div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">{model.category}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase">{model.rpm} RPM</span>
              </div>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-white/5 grid grid-cols-2 gap-2">
          <button onClick={handleSyncModels} className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isMidnight ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}>
            <i className="fa-solid fa-rotate"></i> Sync
          </button>
          <button onClick={handleScanGroqModels} className="py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2 bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <i className="fa-solid fa-bolt"></i> Scan API
          </button>
        </div>
      </div>

      {/* CENTER: THE SYNAPSE (CHAT AREA) */}
      <div className={`flex-1 flex flex-col rounded-[2rem] border shadow-2xl relative overflow-hidden transition-all duration-500 ${isMidnight ? 'bg-slate-950 border-white/5' : 'bg-slate-50 border-slate-200'
        }`}>
        {/* Chat Header */}
        <div className={`p-4 border-b flex items-center justify-between z-10 backdrop-blur-md ${isMidnight ? 'bg-slate-900/40 border-white/5' : 'bg-white/80 border-slate-200'
          }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <i className="fa-solid fa-brain-circuit"></i>
            </div>
            <div>
              <h4 className={`text-xs font-black uppercase tracking-widest ${isMidnight ? 'text-white' : 'text-slate-800'}`}>Synapse Studio</h4>
              <p className="text-[10px] font-bold text-primary flex items-center gap-1.5 uppercase">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse"></span>
                {activeModel?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${showSystemPrompt
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                : isMidnight ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600'
                }`}
            >
              <i className="fa-solid fa-user-gear mr-1.5"></i> Persona
            </button>
            <button onClick={() => setMessages([])} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isMidnight ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
              }`}>
              <i className="fa-solid fa-trash-can text-sm"></i>
            </button>
          </div>
        </div>

        {/* System Prompt Bar - Collapsible */}
        {showSystemPrompt && (
          <div className={`p-4 border-b animate-slideInDown overflow-hidden ${isMidnight ? 'bg-slate-900/60 border-white/5 shadow-inner' : 'bg-amber-50/50 border-slate-200'
            }`}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-2">
                <i className="fa-solid fa-ghost"></i> AI System Instruction
              </label>
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Hành vi cốt lõi của AI</span>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Ví dụ: Bạn là một nhà văn lãng mạn..."
              className={`w-full p-3 rounded-xl text-xs font-medium h-20 outline-none resize-none transition-all ${isMidnight ? 'bg-black/40 text-slate-200 border border-white/5 focus:border-amber-500/30' : 'bg-white border border-slate-200 focus:border-amber-500'
                }`}
            />
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <i className="fa-solid fa-comment-dots text-3xl text-primary"></i>
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest">Sẵn sàng nhận lệnh</p>
              <p className="text-[9px] font-bold uppercase mt-1">Giao diện Studio mới đã được kích hoạt</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideIn`}>
              <div className={`max-w-[80%] p-4 rounded-3xl transition-all hover:scale-[1.01] ${msg.role === 'user'
                ? 'bg-primary text-white rounded-tr-sm shadow-xl shadow-primary/20'
                : isMidnight
                  ? 'bg-slate-800 text-slate-100 border border-white/5 rounded-tl-sm shadow-2xl'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-lg'
                }`}>
                <div className="flex items-center gap-2 mb-2 opacity-60">
                  <i className={`fa-solid ${msg.role === 'user' ? 'fa-user' : 'fa-robot'} text-[10px]`}></i>
                  <span className="text-[9px] font-black uppercase tracking-widest">{msg.role}</span>
                </div>
                <div className={`prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-code:text-xs ${msg.role === 'user'
                    ? 'prose-p:text-white prose-headings:text-white prose-strong:text-white prose-li:text-white'
                    : isMidnight
                      ? 'prose-p:text-slate-100 prose-headings:text-slate-100 prose-strong:text-slate-100 prose-li:text-slate-100 font-medium'
                      : 'prose-p:text-slate-900 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-li:text-slate-900 font-medium'
                  }`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className={`px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 ${isMidnight ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t ${isMidnight ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200'}`}>
          <form onSubmit={handleSend} className="relative group flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi AI bất cứ điều gì..."
                className={`w-full pl-6 pr-14 py-4 rounded-2xl text-[13px] font-medium outline-none transition-all ${isMidnight
                  ? 'bg-black/40 text-white border border-white/5 focus:border-primary/50 focus:ring-4 focus:ring-primary/5'
                  : 'bg-slate-100 text-slate-800 border border-slate-200 focus:bg-white focus:border-primary'
                  }`}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${loading || !input.trim()
                  ? 'bg-slate-400 opacity-20 cursor-not-allowed text-white'
                  : 'bg-primary text-white shadow-lg shadow-primary/30 hover:scale-110 active:scale-95'
                  }`}
              >
                <i className={`fa-solid ${loading ? 'fa-spinner animate-spin' : 'fa-paper-plane'}`}></i>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT: CONTROL PANEL (HYPERPARAMETERS) */}
      <div className={`w-72 flex flex-col rounded-3xl border shadow-xl transition-all duration-500 ${isMidnight ? 'bg-slate-900/60 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200'
        }`}>
        <div className="p-5 border-b border-white/5">
          <h3 className={`text-xs font-black uppercase tracking-widest ${isMidnight ? 'text-slate-200' : 'text-slate-800'}`}>
            <i className="fa-solid fa-sliders mr-2 text-primary"></i>
            Hyperparameters
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
          {/* Temperature */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                <i className="fa-solid fa-fire-flame-curved text-primary"></i> Temperature
              </label>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-primary text-primary-foreground">{settings.temperature}</span>
            </div>
            <input
              type="range" min="0" max="2" step="0.1"
              value={settings.temperature}
              onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none bg-primary/20 accent-primary cursor-pointer"
            />
            <p className="text-[9px] font-medium text-muted-foreground leading-relaxed italic">Điều chỉnh tính 'sáng tạo'. Cao: bay bổng, Thấp: chính xác.</p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                <i className="fa-solid fa-coins text-primary"></i> Max Tokens
              </label>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-primary text-primary-foreground">{settings.maxTokens}</span>
            </div>
            <input
              type="range" min="100" max="4000" step="100"
              value={settings.maxTokens}
              onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none bg-primary/20 accent-primary cursor-pointer"
            />
            <p className="text-[9px] font-medium text-muted-foreground leading-relaxed italic">Giới hạn độ dài tối đa của phản hồi từ AI.</p>
          </div>

          {/* Top P */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                <i className="fa-solid fa-bullseye text-primary"></i> Top P
              </label>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-primary text-primary-foreground">{settings.topP}</span>
            </div>
            <input
              type="range" min="0" max="1" step="0.1"
              value={settings.topP}
              onChange={(e) => setSettings({ ...settings, topP: parseFloat(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none bg-primary/20 accent-primary cursor-pointer"
            />
            <p className="text-[9px] font-medium text-muted-foreground leading-relaxed italic">Kiểm soát tính đa dạng của từ vựng.</p>
          </div>

          {/* Quick Context Stats */}
          <div className={`mt-8 p-4 rounded-2xl border ${isMidnight ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
            <h5 className="text-[9px] font-black uppercase text-primary mb-3">Model Telemetry</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground font-bold uppercase">Messages</span>
                <span className="font-black">{messages.length}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground font-bold uppercase">Provider</span>
                <span className="font-black text-primary">{activeModel?.category.split(' ')[0]}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground font-bold uppercase">Status</span>
                <span className="text-emerald-500 font-black animate-pulse uppercase">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminAI;
