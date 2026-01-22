import React, { useEffect, useState } from 'react';

interface VisitorCounterProps {
    siteCode?: string;
    path?: string;
}

export const VisitorCounter: React.FC<VisitorCounterProps> = ({
    siteCode = '',
    path = '/'
}) => {
    const [count, setCount] = useState<string | null>(null);

    useEffect(() => {
        if (!siteCode || siteCode === 'YOUR_CODE') return;

        const fetchStats = async () => {
            try {
                let fetchPath = path;
                if (!fetchPath.startsWith('/')) fetchPath = '/' + fetchPath;

                // Original URL causing CORS issues if accessed directly from client without server headers
                const targetUrl = `https://${siteCode}.goatcounter.com/counter.json?p=${encodeURIComponent(fetchPath)}`;

                // Use a CORS Proxy to bypass the "No Access-Control-Allow-Origin" error.
                // This allows us to read the JSON response even if GoatCounter's 404 responses miss CORS headers.
                // Using api.allorigins.win as a reliable free proxy for public JSON data.
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

                // Add a cache buster timestamp to prevent stale data
                const response = await fetch(`${proxyUrl}&t=${Date.now()}`);

                if (response.ok) {
                    const data = await response.json();
                    setCount(data.count);
                } else {
                    // If proxy returns error (e.g. 404 from target), assume 0 views
                    setCount('0');
                }
            } catch (error) {
                // If even the proxy fails, just show nothing
                // console.warn('VisitorCounter check failed');
            }
        };

        fetchStats();
    }, [siteCode, path]);

    // Format count: if null, show loading dash, else number
    const displayCount = count ? parseInt(count).toLocaleString() : '---';

    return (
        <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group cursor-help"
            title="Lượt truy cập"
        >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <i className="fa-solid fa-users-viewfinder text-slate-400 group-hover:text-emerald-400 transition-colors text-xs"></i>
            <span className="text-xs font-bold font-mono text-slate-300 group-hover:text-white transition-colors">
                {displayCount}
            </span>
        </div>
    );
};

export default VisitorCounter;
