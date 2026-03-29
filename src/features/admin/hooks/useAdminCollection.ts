import { useCallback, useEffect, useRef, useState } from 'react';

export interface AdminCollectionLoadOptions {
  force?: boolean;
}

export const useAdminCollection = <T,>(
  loader: (options?: AdminCollectionLoadOptions) => Promise<T[]>,
  enabled: boolean,
) => {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequestIdRef = useRef(0);

  const refresh = useCallback(async (options: AdminCollectionLoadOptions = { force: true }) => {
    const requestId = ++latestRequestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await loader(options);
      if (requestId === latestRequestIdRef.current) {
        setData(result);
      }
      return result;
    } catch (err: any) {
      if (requestId === latestRequestIdRef.current) {
        setError(err?.message || 'Không thể tải dữ liệu');
      }
      throw err;
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [loader]);

  useEffect(() => {
    if (!enabled) return;
    void refresh({ force: true });
  }, [enabled, refresh]);

  return {
    data,
    setData,
    isLoading,
    error,
    refresh,
  };
};
