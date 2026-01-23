import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const isBookDetails = location.pathname.startsWith('/book/');
  const isAdmin = location.pathname.startsWith('/admin');

  // Show button when page is scrolled up to given distance
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  if (isAdmin) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          onClick={scrollToTop}
          className={`fixed ${isBookDetails ? 'bottom-40' : 'bottom-24'} right-6 z-[110] lg:bottom-24 lg:right-8 w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-900/20 hover:bg-indigo-600 transition-colors group`}
          aria-label="Back to top"
        >
          <i className="fa-solid fa-arrow-up group-hover:-translate-y-1 transition-transform"></i>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default BackToTop;
