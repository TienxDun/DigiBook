
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const getPages = () => {
    const pages: (number | string)[] = [];
    const delta = 1;

    if (totalPages <= 7) {
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
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:hover:shadow-none"
      >
        <i className="fa-solid fa-chevron-left text-xs"></i>
      </button>

      {getPages().map((page, index) => (
        typeof page === 'number' ? (
          <button
            key={index}
            onClick={() => onPageChange(page)}
            className={`w-12 h-12 rounded-xl font-extrabold transition-all ${
              currentPage === page
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                : 'bg-white border border-slate-100 text-slate-500 hover:border-indigo-100 hover:text-indigo-600'
            }`}
          >
            {page}
          </button>
        ) : (
          <span key={index} className="w-12 h-12 flex items-center justify-center text-slate-400 font-extrabold">
            {page}
          </span>
        )
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:hover:shadow-none"
      >
        <i className="fa-solid fa-chevron-right text-xs"></i>
      </button>
    </div>
  );
};

export default Pagination;
