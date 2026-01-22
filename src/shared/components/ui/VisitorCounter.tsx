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
                // UPDATE: Using the 't' endpoint or JSON API with query param is the most documented way for robust path handling.
                // However, simpler is better: The standard public count API is often just counter.json
                // But for the root path '/', the most compatible way across different GoatCounter configurations 
                // is to use the query parameter syntax: /counter.json?p=/

                let fetchPath = path;
                if (!fetchPath.startsWith('/')) fetchPath = '/' + fetchPath;

                // Use the query param '?p=' which correctly handles special characters and root path
                const url = `https://${siteCode}.goatcounter.com/counter.json?p=${encodeURIComponent(fetchPath)}`;

                const response = await fetch(url);

                if (response.ok) {
                    const data = await response.json();
                    setCount(data.count);
                } else if (response.status === 404) {
                    // API returns 404 if no stats found for this specific path
                    setCount('0');
                }
            } catch (error) {
                // Silently handle network errors
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
