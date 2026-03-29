import { useCallback, useEffect, useState } from 'react';

export const useAdminCollection = <T,>(loader: () => Promise<T[]>, enabled: boolean) => {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loader();
      setData(result);
      return result;
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  return {
    data,
    setData,
    isLoading,
    error,
    refresh,
  };
};
