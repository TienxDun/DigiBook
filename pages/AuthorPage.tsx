
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, AVAILABLE_AI_MODELS } from '../services/db';
import BookCard from '../components/BookCard';
import { Book, Author } from '../types';
import { BookCardSkeleton, Skeleton } from '../components/Skeleton';

interface AuthorPageProps {
  onAddToCart: (book: Book) => void;
}

const AuthorPage: React.FC<AuthorPageProps> = ({ onAddToCart }) => {
  const { authorName } = useParams<{ authorName: string }>();
  const [authorBooks, setAuthorBooks] = useState<Book[]>([]);
  const [authorInfo, setAuthorInfo] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeModelName, setActiveModelName] = useState('Gemini');
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch model config
      db.getAIConfig().then(config => {
        const model = AVAILABLE_AI_MODELS.find(m => m.id === config.activeModelId);
        if (model) setActiveModelName(model.name.split(' (')[0]);
      });

      const [allBooks, allAuthors] = await Promise.all([
        db.getBooks(),
        db.getAuthors()
      ]);
      
      const filtered = allBooks.filter(b => b.author.toLowerCase() === authorName?.toLowerCase());
      const info = allAuthors.find(a => a.name.toLowerCase() === authorName?.toLowerCase());
      
      setAuthorBooks(filtered);
      setAuthorInfo(info || null);
      setLoading(false);
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [authorName]);

  const handleGetAIInsight = async () => {
    if (!authorName) return;
    setLoadingAI(true);
    const result = await db.getAuthorAIInsight(authorName);
    setAiInsight(result);
    setLoadingAI(false);
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen pt-20 lg:pt-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-indigo-950 rounded-[2.5rem] p-10 mb-8 flex flex-col lg:flex-row items-center gap-10">
            <Skeleton className="w-48 h-48 rounded-3xl" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-1/2" />
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
              </div>
            </div>
          </div>
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => <BookCardSkeleton key={i} />)}
              </div>
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-[400px] rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const mainCategory = authorBooks.length > 0 
    ? [...new Set(authorBooks.map(b => b.category))].sort((a,b) => 
        authorBooks.filter(x => x.category === b).length - authorBooks.filter(x => x.category === a).length
      )[0] 
    : "Văn học";

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-600 -z-10 opacity-[0.03] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-20 lg:pt-24 pb-32">
        {/* Header Block */}
        <div className="bg-indigo-950 rounded-[2.5rem] p-6 lg:p-10 mb-8 relative overflow-hidden shadow-2xl shadow-indigo-200">
           <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-500/10 blur-[100px]" aria-hidden="true"></div>
           <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-400/5 rounded-full blur-[80px]"></div>
           
           <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-14">
              <div className="w-32 h-32 lg:w-48 lg:h-48 rounded-3xl overflow-hidden border-[8px] border-white/5 shadow-2xl bg-indigo-900 flex-shrink-0 group">
                <img 
                  src={authorInfo?.avatar || `https://ui-avatars.com/api/?name=${authorName}&background=4f46e5&color=fff&size=512&bold=true`} 
                  alt={authorName} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>

              <div className="flex-1 text-center lg:text-left">
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border border-indigo-500/20">Tác giả tiêu biểu</span>
                  <span className="px-3 py-1 bg-white/5 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border border-white/5">{mainCategory}</span>
                </div>
                
                <h1 className="text-3xl lg:text-5xl font-black text-white mb-6 tracking-tighter leading-tight">{authorName}</h1>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Tác phẩm</p>
                    <p className="text-2xl font-black text-white">{authorBooks.length}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Đánh giá</p>
                    <p className="text-2xl font-black text-white">4.9<span className="text-xs text-indigo-400">/5</span></p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Độc giả</p>
                    <p className="text-2xl font-black text-white">12k+</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Theo dõi</p>
                    <p className="text-2xl font-black text-white">4.2k</p>
                  </div>
                </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Info Side */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Biography Block */}
            <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-feather-pointed text-sm"></i>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Tiểu sử & Sự nghiệp</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hành trình trải nghiệm và sáng tạo</p>
                </div>
              </div>

              <div className="prose prose-slate max-w-none">
                <p className="text-base text-slate-600 leading-[1.7] font-medium">
                  {authorInfo?.bio || `${authorName} là một trong những cây bút có sức ảnh hưởng sâu rộng trong nền văn học hiện đại. Với khả năng quan sát tinh tế và ngôn từ sắc sảo, các tác phẩm của tác giả không chỉ là những câu chuyện kể mà còn là những bản chiêm nghiệm sâu sắc về cuộc sống, con người và những giá trị nhân bản vĩnh cửu.`}
                </p>
              </div>

              {/* Genres Focus */}
              <div className="mt-8 flex flex-wrap gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Tags:</span>
                {Array.from(new Set(authorBooks.map(b => b.category))).map(cat => (
                  <Link key={cat} to={`/category/${cat}`} className="px-4 py-1.5 bg-slate-50 text-slate-600 rounded-full text-[9px] font-extrabold uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100">
                    {cat}
                  </Link>
                ))}
              </div>
            </div>

            {/* Works List */}
            <div>
              <div className="flex items-center justify-between mb-8 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                    <i className="fa-solid fa-book-bookmark text-sm"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Tất cả tác phẩm</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hiện có {authorBooks.length} cuốn trên giá sách DigiBook</p>
                  </div>
                </div>
              </div>

              {authorBooks.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 lg:gap-6 px-2 lg:px-0">
                  {authorBooks.map(book => (
                    <BookCard key={book.id} book={book} onAddToCart={onAddToCart} />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <i className="fa-solid fa-box-open text-4xl text-slate-200 mb-4"></i>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Hiện đang cập nhật thêm tác phẩm...</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Profile Side */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl shadow-2xl relative overflow-hidden group border border-white/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <i className="fa-solid fa-wand-magic-sparkles text-white text-base animate-pulse"></i>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">AI Author Profile</h3>
                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Phân tích bởi {activeModelName}</p>
                  </div>
                </div>

                {aiInsight ? (
                  <div className="animate-fadeIn">
                    <div className="relative">
                      <i className="fa-solid fa-quote-left absolute -top-3 -left-3 text-indigo-500/20 text-2xl"></i>
                      <p className="text-sm text-indigo-50/90 leading-relaxed font-medium italic relative z-10">
                        {aiInsight}
                      </p>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/5">
                       <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Các điểm nhấn sáng tạo:</p>
                       <div className="space-y-2">
                          <div className="flex items-center gap-2">
                             <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                             <span className="text-[10px] font-bold text-slate-300">Tư duy độc bản & đột phá</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                             <span className="text-[10px] font-bold text-slate-300">Kết nối cảm xúc mạnh mẽ</span>
                          </div>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4 text-center">
                    <p className="text-indigo-100/60 text-xs font-medium mb-6 leading-relaxed">
                      Để AI giúp bạn phác họa chân dung nghệ thuật và phong cách đặc trưng của {authorName}.
                    </p>
                    <button 
                      onClick={handleGetAIInsight}
                      disabled={loadingAI}
                      className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-50 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2 active:scale-95 disabled:bg-slate-800 disabled:text-slate-500"
                    >
                      {loadingAI ? (
                        <>
                          <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          Đang phân tích...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-wand-magic-sparkles text-indigo-500 text-xs"></i> Khám phá Tác giả
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Newsletter or CTA */}
            <div className="bg-emerald-600 p-8 rounded-3xl text-white shadow-xl shadow-emerald-100/50 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
               <h4 className="text-base font-black mb-1 tracking-tight">Theo dõi {authorName}</h4>
               <p className="text-[10px] text-emerald-100 font-medium mb-4 leading-relaxed">Nhận thông báo ngay khi có tác phẩm hoặc sự kiện mới nhất.</p>
               <button className="w-full py-3.5 bg-white text-emerald-600 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-emerald-50 transition-colors shadow-lg shadow-black/10">
                 Đăng ký ngay
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorPage;
