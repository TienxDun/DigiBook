import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBooks } from '../contexts/BookContext';
import { db } from '@/services/db';
import { ChatMessage } from '@/services/db/ai';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';

const AIAssistant: React.FC = () => {
    const { viewingBook } = useBooks();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Greeting & Context Setup
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            let initialMsg = "Xin chào! Tôi là trợ lý AI của DigiBook. Bạn cần tìm sách gì hôm nay?";

            if (viewingBook) {
                initialMsg = `Chào bạn! Tôi thấy bạn đang xem cuốn "${viewingBook.title}". Bạn có muốn tôi tóm tắt nội dung hay phân tích sâu hơn về tác phẩm này không?`;
            } else if (user) {
                initialMsg = `Chào ${user.name}! Bạn muốn khám phá thể loại nào hôm nay?`;
            }

            setMessages([{ role: 'assistant', content: initialMsg }]);
        }
    }, [isOpen, viewingBook, user]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async (e?: FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg: ChatMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];

        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            // Prepare messages for AI (including system context if needed)
            const aiPayload = [...newMessages];

            // Inject System Context if looking at a book
            if (viewingBook) {
                const systemContext: ChatMessage = {
                    role: 'system',
                    content: `User is viewing book: Title="${viewingBook.title}", Author="${viewingBook.author}", Category="${viewingBook.category}", Price=${viewingBook.price}, Description="${viewingBook.description}". Answer questions based on this context if relevant.`
                };
                // Prepend system message. Note: chatWithAI handles 'system' role mapping.
                aiPayload.unshift(systemContext);
            }

            const responseText = await db.chatWithAI(aiPayload);

            setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Xin lỗi, tôi gặp sự cố kết nối. Vui lòng thử lại." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed z-50 bottom-6 right-6 lg:bottom-10 lg:right-10 w-14 h-14 lg:w-16 lg:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? 'bg-rose-500 rotate-90 text-white' : 'bg-indigo-600 text-white animate-bounce-slow'}`}
            >
                <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-robot'} text-xl lg:text-2xl`}></i>
            </button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed z-50 bottom-24 right-4 lg:bottom-32 lg:right-10 w-[90vw] sm:w-[380px] h-[500px] max-h-[70vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between shadow-md shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white text-lg">
                                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-base leading-tight">Trợ lý AI</h3>
                                    <p className="text-indigo-200 text-xs font-medium">DigiBook Smart Assistant</p>
                                </div>
                            </div>
                            <button onClick={() => setMessages([])} className="w-8 h-8 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Xóa hội thoại">
                                <i className="fa-solid fa-rotate-right"></i>
                            </button>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth"
                        >
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                        }`}>
                                        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2">
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 shrink-0">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Hỏi tôi về sách..."
                                    className="w-full pl-4 pr-12 py-3 bg-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center disabled:opacity-50 disabled:bg-slate-300 transition-all hover:bg-indigo-700"
                                >
                                    <i className="fa-solid fa-paper-plane text-xs"></i>
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIAssistant;
