import { useEffect } from 'react';

export const useBodyScrollLock = (locked: boolean) => {
  useEffect(() => {
    document.body.style.overflow = locked ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [locked]);
};
