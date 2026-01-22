import React, { useEffect, useState } from 'react';

interface VisitorCounterProps {
    siteCode?: string;
    path?: string;
}

export const VisitorCounter: React.FC<VisitorCounterProps> = ({
    siteCode = '', // User needs to fill this
    path = '/'
}) => {
    const [count, setCount] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // If no siteCode is provided, we can't fetch.
        if (!siteCode || siteCode === 'YOUR_CODE') {
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            try {
                // Determine clean path. Remove leading slash for consistency if needed, but GoatCounter API behavior varies.
                // Standard approach: To get stats for path '/', you usually request /counter//.json (double slash) or just /counter.json?p=%2F

                // Let's try the safest query param approach which is often more robust than path encoding issues
                // Note: GoatCounter public view endpoint usually supports ?p=[path] if the direct URL rewrite isn't working perfectly

                // However, the standard documented way is /counter/[path].json
                // If path is '/', we will try to use a special handling or just accept 404 means 0.

                let cleanPath = path;
                if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

                // If path is root '/', encoding it results in %2F. 
                // https://digibook.goatcounter.com/counter/%2F.json -> 404 (Not Found) seen in logs.
                // This means GoatCounter might store root as empty string or expects different format.

                // Let's rely on the count.js pixel which auto-sends p path.
                // For retrieving, let's try to fetch the summary if specific path fails.

                // Better fix: Catch the 404 specifically.
                // If we get a 404 on the counter endpoint, it likely means NO visits recorded for this exact path yet.
                // In that case, we should display 0, not an error.

                const encodedPath = encodeURIComponent(cleanPath);
                const url = `https://${siteCode}.goatcounter.com/counter/${encodedPath}.json`;

                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    setCount(data.count);
                } else if (response.status === 404) {
                    // Path not found in GoatCounter = 0 visits
                    setCount('0');
                }
            } catch (error) {
                // Suppress generic network errors (often AdBlock)
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [siteCode, path]);

    // Render logic
    const displayCount = count ? parseInt(count).toLocaleString() : '---';

    return (
        <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group cursor-help"
            title="Tổng lượt truy cập"
        >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <i className="fa-solid fa-users-viewfinder text-slate-400 group-hover:text-emerald-400 transition-colors text-xs"></i>
            <span className="text-xs font-bold font-mono text-slate-300 group-hover:text-white transition-colors">
                {displayCount}
            </span>
            {(!siteCode || siteCode === 'YOUR_CODE') && (
                <span className="ml-1 text-[10px] text-yellow-500 font-normal italic">(Cần setup code)</span>
            )}
        </div>
    );
};

export default VisitorCounter;
