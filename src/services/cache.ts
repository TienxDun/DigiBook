type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  tags?: string[];
};

const memoryCache = new Map<string, CacheEntry<any>>();
const inFlight = new Map<string, Promise<any>>();
const inFlightTags = new Map<string, string[]>();
const cacheKeyTags = new Map<string, string[]>();
const invalidationVersions = new Map<string, number>();
const stats = {
  hits: 0,
  staleHits: 0,
  misses: 0,
  sets: 0,
  persistedSets: 0,
  revalidations: 0,
};

const now = () => Date.now();
const STORAGE_PREFIX = 'digibook_cache:';

const getVersion = (key: string) => invalidationVersions.get(key) || 0;
const bumpVersion = (key: string) => {
  invalidationVersions.set(key, getVersion(key) + 1);
};
const shouldUseResult = (key: string, version: number) => getVersion(key) === version;

export interface CacheOptions {
  ttl?: number;
  persist?: boolean;
  tags?: string[];
  force?: boolean;
}

export const cache = {
  get: <T>(key: string, options?: { persist?: boolean }): T | null => {
    // 1. Check Memory
    const entry = memoryCache.get(key);
    if (entry && entry.expiresAt > now()) {
      stats.hits += 1;
      return entry.value as T;
    }

    // 2. Check LocalStorage if requested
    if (options?.persist) {
      try {
        const stored = localStorage.getItem(STORAGE_PREFIX + key);
        if (stored) {
          const parsed = JSON.parse(stored) as CacheEntry<T>;
          if (parsed.expiresAt > now()) {
            // Fill memory cache from storage for faster subsequent access
            memoryCache.set(key, parsed);
            stats.hits += 1;
            return parsed.value;
          } else {
            localStorage.removeItem(STORAGE_PREFIX + key);
          }
        }
      } catch (e) {
        console.warn('Cache: Failed to read from localStorage', e);
      }
    }

    stats.misses += 1;
    return null;
  },

  /**
   * Get stale data if available, even if expired
   */
  getStale: <T>(key: string, persist?: boolean): T | null => {
    const entry = memoryCache.get(key);
    if (entry) {
      stats.staleHits += 1;
      return entry.value;
    }

    if (persist) {
      try {
        const stored = localStorage.getItem(STORAGE_PREFIX + key);
        if (stored) {
          const parsed = JSON.parse(stored) as CacheEntry<T>;
          stats.staleHits += 1;
          return parsed.value;
        }
      } catch (e) {}
    }

    return null;
  },

  set: <T>(key: string, value: T, options?: CacheOptions): void => {
    const ttl = options?.ttl || 5 * 60 * 1000; // Default 5 mins
    const entry: CacheEntry<T> = {
      value,
      expiresAt: now() + ttl,
      tags: options?.tags,
    };

    memoryCache.set(key, entry);
    cacheKeyTags.set(key, options?.tags || []);
    stats.sets += 1;

    if (options?.persist) {
      try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
        stats.persistedSets += 1;
      } catch (e) {
        console.warn('Cache: Failed to persist to localStorage', e);
      }
    }
  },

  swr: async <T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<{ data: T; fromCache: boolean }> => {
    if (options?.force) {
      bumpVersion(key);
      inFlight.delete(key);
      inFlightTags.delete(key);
      const requestVersion = getVersion(key);

      try {
        // console.log(`🚀 [API] Force fetching fresh data for: ${key}`);
        const data = await fetcher();
        if (shouldUseResult(key, requestVersion)) {
          cache.set(key, data, options);
        }
        return { data, fromCache: false };
      } finally {
        if (getVersion(key) === requestVersion) {
          inFlight.delete(key);
          inFlightTags.delete(key);
        }
      }
    }

    // 1. Try to get fresh data from memory/storage
    const fresh = cache.get<T>(key, { persist: options?.persist });
    if (fresh !== null) {
      return { data: fresh, fromCache: true };
    }

    // 2. Try to get stale data
    const stale = cache.getStale<T>(key, options?.persist);

    // 3. Trigger revalidation in background or foreground
    // Prevent multiple concurrent requests for the same key
    if (inFlight.has(key)) {
      const activePromise = inFlight.get(key)!;
      if (stale !== null) {
        return { data: stale, fromCache: true };
      }
      return { data: await activePromise, fromCache: false };
    }

    // Create a wrapper promise that we can store immediately before firing the fetcher
    let resolveRef: (val: T) => void;
    let rejectRef: (err: any) => void;
    const wrapperPromise = new Promise<T>((resolve, reject) => {
      resolveRef = resolve;
      rejectRef = reject;
    });
    
    // Attaching a dummy catch handler to the wrapper promise to prevent 
    // "Uncaught (in promise)" errors if the API fails but no one awaits it yet.
    wrapperPromise.catch(() => {});

    // Set in-flight BEFORE calling fetcher to prevent race conditions (like React StrictMode)
    inFlight.set(key, wrapperPromise);
    if (options?.tags) {
      inFlightTags.set(key, options.tags);
      cacheKeyTags.set(key, options.tags);
    }
    const requestVersion = getVersion(key);

    if (stale !== null) {
      // Revalidation in background
      stats.revalidations += 1;
      console.log(`📡 [NETWORK] Revalidating data for: ${key}`);
      fetcher()
        .then((data) => {
          if (shouldUseResult(key, requestVersion)) {
            cache.set(key, data, options);
          }
          resolveRef!(data);
        })
        .catch((err) => {
          rejectRef!(err);
        })
        .finally(() => {
          inFlight.delete(key);
          inFlightTags.delete(key);
        });
      
      return { data: stale, fromCache: true };
    }

    // No stale data, wait for fresh
    try {
      // console.log(`🚀 [API] Fetching fresh data for: ${key}`);
      const data = await fetcher();
      if (shouldUseResult(key, requestVersion)) {
        cache.set(key, data, options);
      }
      resolveRef!(data);
      return { data, fromCache: false };
    } catch (err) {
      rejectRef!(err);
      throw err;
    } finally {
      inFlight.delete(key);
      inFlightTags.delete(key);
    }
  },

  /**
   * Legacy compatibility method
   */
  getOrSet: async <T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> => {
    const result = await cache.swr<T>(key, fetcher, { ttl: ttlMs });
    return result.data;
  },

  clear: (tags?: string[] | string): void => {
    if (!tags) {
      for (const key of new Set([
        ...memoryCache.keys(),
        ...inFlight.keys(),
        ...cacheKeyTags.keys(),
      ])) {
        bumpVersion(key);
      }
      memoryCache.clear();
      inFlight.clear();
      inFlightTags.clear();
      cacheKeyTags.clear();
      // Optional: clear all localStorage starting with prefix
      Object.keys(localStorage)
        .filter(k => k.startsWith(STORAGE_PREFIX))
        .forEach(k => localStorage.removeItem(k));
      return;
    }

    const tagList = Array.isArray(tags) ? tags : [tags];
    const invalidatedKeys = new Set<string>();
    
    // Clear In-Flight requests that match tags
    for (const [key, tags] of inFlightTags.entries()) {
      if (tags.some(t => tagList.includes(t))) {
        invalidatedKeys.add(key);
        inFlight.delete(key);
        inFlightTags.delete(key);
      }
    }

    for (const [key, tags] of cacheKeyTags.entries()) {
      if (tags.some(t => tagList.includes(t))) {
        invalidatedKeys.add(key);
      }
    }

    // Clear Memory
    for (const [key, entry] of memoryCache.entries()) {
      if (entry.tags?.some(t => tagList.includes(t))) {
        invalidatedKeys.add(key);
        memoryCache.delete(key);
      }
    }

    // Clear Storage (more expensive)
    Object.keys(localStorage)
      .filter(k => k.startsWith(STORAGE_PREFIX))
      .forEach(k => {
        try {
          const stored = localStorage.getItem(k);
          if (stored) {
            const parsed = JSON.parse(stored) as CacheEntry<any>;
            if (parsed.tags?.some(t => tagList.includes(t))) {
              invalidatedKeys.add(k.replace(STORAGE_PREFIX, ''));
              localStorage.removeItem(k);
            }
          }
        } catch (e) {}
      });

    for (const key of invalidatedKeys) {
      bumpVersion(key);
      cacheKeyTags.delete(key);
    }
  },

  logStats: (label = 'Catalog Cache') => {
    console.groupCollapsed(`%c📦 ${label}`, 'color: #673AB7; font-weight: bold;');
    console.log('Hits:', stats.hits);
    console.log('Stale Hits:', stats.staleHits);
    console.log('Misses:', stats.misses);
    console.log('Revalidations:', stats.revalidations);
    console.log('Memory Size:', memoryCache.size);
    console.log('In-Flight:', inFlight.size);
    console.log('Storage Size:', Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX)).length);
    console.groupEnd();
  },

  startConsoleLogger: (intervalMs = 60000, label = 'Cache') => {
    if (typeof window === 'undefined') return;
    const key = '__cacheLoggerStarted';
    if ((window as any)[key]) return;
    (window as any)[key] = true;
    window.setInterval(() => {
      cache.logStats(label);
    }, intervalMs);
  }
};
