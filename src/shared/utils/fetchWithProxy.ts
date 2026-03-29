/**
 * Helper: Multi-Proxy Fetcher
 * Used to bypass CORS issues for external APIs like Tiki.
 */
import { API_BASE_URL } from '@/services/api/client';

export async function fetchWithProxy(targetUrl: string): Promise<any> {
  const backendProxy = `${API_BASE_URL}/api/admin/tiki-proxy?url=${encodeURIComponent(targetUrl)}`;
  const proxies = [
    { url: backendProxy, encodeUrl: false, label: 'digibook-backend', directUrl: true },
    { url: 'https://api.allorigins.win/raw?url=', encodeUrl: true },
    { url: 'https://api.allorigins.win/get?url=', encodeUrl: true, useContents: true },
    { url: 'https://corsproxy.io/?', encodeUrl: true },
    { url: 'https://api.codetabs.com/v1/proxy?quest=', encodeUrl: true },
    { url: 'https://thingproxy.freeboard.io/fetch/', encodeUrl: false },
  ];

  let lastError;

  for (const proxy of proxies) {
    try {
      await new Promise(r => setTimeout(r, Math.random() * 300));
      const fetchUrl = (proxy as any).directUrl
        ? proxy.url
        : proxy.encodeUrl
          ? proxy.url + encodeURIComponent(targetUrl)
          : proxy.url + targetUrl;

      const response = await fetch(fetchUrl, {
        headers: {
          Accept: 'application/json,text/plain,*/*',
        },
      });
      if (!response.ok) throw new Error(`Proxy error: ${response.status}`);

      if ((proxy as any).useContents) {
        const wrapper = await response.json();
        if (!wrapper.contents) throw new Error('Empty contents from allorigins');
        return JSON.parse(wrapper.contents);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Proxy ${('label' in proxy && proxy.label) || proxy.url} failed for ${targetUrl}:`, error);
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error('All proxies failed');
}
