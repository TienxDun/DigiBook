
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/db';
import BookCard from '../components/BookCard';
import { Book, Author } from '../types';

interface AuthorPageProps {
  onAddToCart: (book: Book) => void;
}

const AuthorPage: React.FC<AuthorPageProps> = ({ onAddToCart }) => {
  const { authorName } = useParams<{ authorName: string }>();
  const [authorBooks, setAuthorBooks] = useState<Book[]>([]);
  const [authorInfo, setAuthorInfo] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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
  }, [authorName]);

  if (loading) return <div className="py-20 text-center"><i className="fa-solid fa-spinner fa-spin text-3xl text-indigo-600"></i></div>;

  return (
    <div className="w-[92%] xl:w-[60%] mx-auto px-4 py-12 lg:py-20 fade-in">
      <div className="bg-slate-900 rounded-[3.5rem] p-10 lg:p-16 mb-20 relative overflow-hidden text-white shadow-2xl shadow-indigo-100">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-600/10 blur-[100px]" aria-hidden="true"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-40 h-40 lg:w-56 lg:h-56 rounded-full overflow-hidden border-8 border-white/5 shadow-2xl bg-indigo-100 flex-shrink-0">
            <img 
              src={authorInfo?.avatar || `https://ui-avatars.com/api/?name=${authorName}&background=4f46e5&color=fff&size=256&bold=true`} 
              alt={authorName} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center md:text-left">
            <span className="inline-block px-4 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-black uppercase tracking-widest mb-4">Tác giả tiêu biểu</span>
            <h1 className="text-4xl lg:text-6xl font-black mb-6">{authorName}</h1>
            <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-8">
              {authorInfo?.bio || `${authorName} là một tác giả có tầm ảnh hưởng lớn trong nền văn học, nổi tiếng với những tác phẩm mang tính triết lý và nhân văn sâu sắc.`}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-8">
              <div>
                <div className="text-2xl font-black">{authorBooks.length}</div>
                <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">Tác phẩm</div>
              </div>
              <div className="w-px h-10 bg-white/10 hidden sm:block"></div>
              <div>
                <div className="text-2xl font-black">4.9/5</div>
                <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">Đánh giá</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-2">Giá sách của tác giả</p>
        <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Tác phẩm của {authorName}</h2>
      </div>
      {authorBooks.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-8">
          {authorBooks.map(book => (
            <BookCard key={book.id} book={book} onAddToCart={onAddToCart} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
           <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Hiện chưa có tác phẩm nào của tác giả này trên kệ</p>
        </div>
      )}
    </div>
  );
};

export default AuthorPage;
