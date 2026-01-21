
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@/services/db';
import { Author, Book } from '../types';
import { Skeleton } from '../components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const AuthorsPage: React.FC = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [authorsData, booksData] = await Promise.all([
          db.getAuthors(),
          db.getBooks()
        ]);
        setAuthors(authorsData);
        setAllBooks(booksData);
      } catch (error) {
        console.error("Error fetching authors data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, []);

  const authorStats = useMemo(() => {
    const stats: Record<string, number> = {};
    allBooks.forEach(book => {
      const authorKey = book.author.toLowerCase();
      stats[authorKey] = (stats[authorKey] || 0) + 1;
    });
    return stats;
  }, [allBooks]);

  const filteredAuthors = useMemo(() => {
    return authors.filter(author =>
      author.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [authors, searchQuery]);

  const alphabeticalGroups = useMemo(() => {
    if (searchQuery) return {};
    const groups: Record<string, Author[]> = {};
    authors.forEach(author => {
      const firstLetter = author.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(author);
    });
    return Object.fromEntries(
      Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    ) as Record<string, Author[]>;
  }, [authors, searchQuery]);

  const featuredAuthors = useMemo(() => {
    return [...authors]
      .sort((a, b) => (authorStats[b.name.toLowerCase()] || 0) - (authorStats[a.name.toLowerCase()] || 0))
      .slice(0, 4);
  }, [authors, authorStats]);

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen pt-4 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 h-48 bg-indigo-950 rounded-[2.5rem] flex flex-col justify-center px-10">
            <Skeleton className="h-4 w-32 mb-4 opacity-20" />
            <Skeleton className="h-10 w-64 opacity-20" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="w-32 h-32 lg:w-40 lg:h-40 rounded-full mb-4" />
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-600/5 to-transparent -z-10 pointer-events-none"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute top-1/2 -left-24 w-72 h-72 bg-purple-500/5 rounded-full blur-[100px] -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-6 lg:pt-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-6 text-micro font-bold uppercase tracking-premium text-slate-400">
          <Link to="/" className="hover:text-indigo-600 transition-colors">Trang chủ</Link>
          <i className="fa-solid fa-chevron-right text-xs opacity-50"></i>
          <span className="text-slate-900">Tác giả</span>
        </nav>

        {/* Header Block & Search */}
        <div className="bg-indigo-950 rounded-[1.5rem] lg:rounded-[2rem] p-5 lg:p-8 mb-8 relative overflow-hidden shadow-2xl shadow-indigo-950/20 border border-white/5">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent blur-[80px]" aria-hidden="true"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-400/5 rounded-full blur-[80px]"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-end justify-between gap-6 lg:gap-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <i className="fa-solid fa-feather-pointed text-white text-base"></i>
                </div>
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-lg text-micro font-bold uppercase tracking-premium border border-indigo-500/20">Cộng đồng sáng tác</span>
              </div>
              <h1 className="text-3xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">Những người truyền <br className="hidden lg:block" /> cảm hứng</h1>
              <p className="text-indigo-100/60 max-w-xl text-xs lg:text-sm font-medium leading-relaxed mb-0">
                Khám phá những cây bút lỗi lạc, những tâm hồn đồng điệu đang xây dựng hệ sinh thái tri thức DigiBook.
              </p>
            </div>

            <div className="w-full lg:w-80">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Tìm tên tác giả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3.5 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-400 focus:bg-white/10 transition-all font-medium placeholder:text-indigo-200/30 text-sm"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400">
                  <i className="fa-solid fa-magnifying-glass text-xs"></i>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between px-2">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-premium">Hiện có {authors.length} tác giả</p>
                {searchQuery && (
                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-premium">Tìm thấy {filteredAuthors.length}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Alphabet Jump */}
        {!searchQuery && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-8">
            {Object.keys(alphabeticalGroups).map(letter => (
              <button
                key={letter}
                onClick={() => {
                  const el = document.getElementById(`letter-${letter}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-[10px] font-black text-slate-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
              >
                {letter}
              </button>
            ))}
          </div>
        )}

        {/* Featured Section */}
        {!searchQuery && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-premium">Tác giả nổi bật</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredAuthors.map((author, index) => (
                <motion.div
                  key={author.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/50 hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-500"
                >
                  <Link to={`/author/${author.name}`} className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden mb-4 shadow-lg group-hover:scale-110 transition-transform duration-700 rotate-2 group-hover:rotate-0">
                      <img
                        src={author.avatar || `https://ui-avatars.com/api/?name=${author.name}&background=4f46e5&color=fff&size=512&bold=true`}
                        alt={author.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-base font-black text-slate-900 mb-1">{author.name}</h3>
                    <p className="text-micro font-bold text-indigo-500 uppercase tracking-premium mb-3">{authorStats[author.name.toLowerCase()] || 0} Tác phẩm</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 text-center leading-relaxed">
                      {author.bio || "Tác giả ưu tú với nhiều tác phẩm có giá trị cao đang được yêu thích tại DigiBook."}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results or Alphabetical List */}
        <div className="space-y-10">
          {searchQuery ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              <AnimatePresence mode="popLayout">
                {filteredAuthors.map((author, index) => {
                  const bookCount = authorStats[author.name.toLowerCase()] || 0;
                  return (
                    <motion.div
                      key={author.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.03 }}
                      className="group"
                    >
                      <Link to={`/author/${author.name}`} className="flex flex-col items-center">
                        <div className="relative mb-4">
                          <div className="relative w-28 h-28 lg:w-32 lg:h-32 rounded-3xl overflow-hidden border-[4px] border-white shadow-xl shadow-slate-200 group-hover:shadow-2xl group-hover:shadow-indigo-500/10 group-hover:border-indigo-50 transition-all duration-700 group-hover:-rotate-3 group-hover:scale-105">
                            <img
                              src={author.avatar || `https://ui-avatars.com/api/?name=${author.name}&background=4f46e5&color=fff&size=512&bold=true`}
                              alt={author.name}
                              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                          </div>
                          <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white w-9 h-9 rounded-xl flex flex-col items-center justify-center border-2 border-white shadow-lg">
                            <span className="text-[10px] font-black leading-none">{bookCount}</span>
                            <span className="text-[8px] font-bold uppercase">Sách</span>
                          </div>
                        </div>
                        <h3 className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors truncate w-full text-center">{author.name}</h3>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            Object.keys(alphabeticalGroups).map((letter) => (
              <div key={letter} id={`letter-${letter}`} className="relative scroll-mt-24">
                <div className="flex items-center gap-4 mb-6 group/letter">
                  <span className="text-4xl font-black text-slate-200 group-hover/letter:text-indigo-100 transition-colors uppercase select-none">{letter}</span>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alphabeticalGroups[letter].map(author => (
                    <Link
                      key={author.id}
                      to={`/author/${author.name}`}
                      className="flex items-center gap-4 p-4 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
                    >
                      <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                        <img
                          src={author.avatar || `https://ui-avatars.com/api/?name=${author.name}&background=4f46e5&color=fff&size=512&bold=true`}
                          alt={author.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">{author.name}</h4>
                        <p className="text-micro font-bold text-slate-400 uppercase tracking-premium">
                          {authorStats[author.name.toLowerCase()] || 0} Tác phẩm
                        </p>
                      </div>
                      <i className="fa-solid fa-arrow-right ml-auto text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all mr-2"></i>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {filteredAuthors.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 text-center"
          >
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-user-slash text-3xl text-slate-300"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy tác giả</h3>
            <p className="text-slate-400 font-medium max-w-xs mx-auto">Chúng tôi không tìm thấy kết quả nào phù hợp với từ khóa "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-6 px-6 py-3 bg-white border border-slate-200 text-indigo-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
            >
              Xóa tìm kiếm
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AuthorsPage;

