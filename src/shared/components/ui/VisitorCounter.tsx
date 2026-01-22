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
                // Determine API URL for the specific path
                // GoatCounter API quirks: 
                // - For root '/', requesting /counter/%2F.json often returns 404 if no data exists.
                // - Requesting /counter/.json (empty path) often maps to root on some servers, or returns 404.

                // Strategy:
                // We use the count.js pixel to WRITE.
                // Reading specific page counts via public JSON is tricky without a public dashboard enabled.

                // ADJUSTMENT: We will try to fetch without encoding the slash for root, 
                // or map '/' to the empty path segment which GoatCounter typically normalizes.

                let fetchPath = path;

                // If path is root '/', utilizing just '' often works better in file-based routing logic or API matching
                if (fetchPath === '/') fetchPath = '';
                else if (fetchPath.startsWith('/')) fetchPath = fetchPath.substring(1);

                // If path is empty (root), url becomes .../counter.json
                // If path is 'about', url becomes .../counter/about.json
                const url = `https://${siteCode}.goatcounter.com/counter/${encodeURIComponent(fetchPath)}.json`;

                const response = await fetch(url);

                if (response.ok) {
                    const data = await response.json();
                    setCount(data.count);
                } else {
                    // If 404, it simply means this specific path isn't tracked yet.
                    // We set count to '0' to be helpful.
                    setCount('0');
                }
            } catch (error) {
                // Silently fail for network blocks (adblockers)
                // console.log(error); 
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
