import { useEffect, useState } from 'react';
import { ADMIN_THEME_STORAGE_KEY } from '../constants';
import { AdminTheme } from '../types';

export const useAdminTheme = (defaultTheme: AdminTheme = 'midnight') => {
  const [theme, setTheme] = useState<AdminTheme>(() => {
    const storedTheme = localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
    return storedTheme === 'light' || storedTheme === 'midnight' ? storedTheme : defaultTheme;
  });

  useEffect(() => {
    if (theme === 'midnight') {
      document.body.classList.add('admin-midnight');
    } else {
      document.body.classList.remove('admin-midnight');
    }

    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
    return () => document.body.classList.remove('admin-midnight');
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => currentTheme === 'midnight' ? 'light' : 'midnight');
  };

  return {
    theme,
    isMidnight: theme === 'midnight',
    setTheme,
    toggleTheme,
  };
};
