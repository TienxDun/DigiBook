
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const getPages = () => {
    const pages: (number | string)[] = [];
    const delta = 1; // Hiển thị 1 trang xung quanh trang hiện tại

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);

    if (currentPage > delta + 2) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - (delta + 1)) {
      pages.push('...');
    }

    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="flex flex-col items-center gap-5 mt-16 px-4">
      <div className="flex items-center justify-center gap-1.5 p-1.5 bg-slate-50/80 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/30 transition-all duration-300">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-md hover:ring-1 hover:ring-slate-200 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
          aria-label="Previous page"
        >
          <i className="fa-solid fa-chevron-left text-[10px] group-hover:-translate-x-0.5 transition-transform"></i>
        </button>

        <div className="flex items-center gap-1">
          {getPages().map((page, index) => (
            typeof page === 'number' ? (
              <button
                key={index}
                onClick={() => onPageChange(page)}
                className={`w-9 h-9 md:w-10 md:h-10 rounded-xl font-black text-xs transition-all flex items-center justify-center ${
                  currentPage === page
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105 z-10'
                    : 'text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm hover:ring-1 hover:ring-slate-200'
                }`}
              >
                {page}
              </button>
            ) : (
              <span key={index} className="px-1 text-slate-300 font-black tracking-tighter text-xs select-none">
                •••
              </span>
            )
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-md hover:ring-1 hover:ring-slate-200 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
          aria-label="Next page"
        >
          <i className="fa-solid fa-chevron-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
        </button>
      </div>
      
    </div>
  );
};

export default Pagination;
