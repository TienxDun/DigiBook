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
                // GoatCounter JSON API for public view count
                // URL format: https://[code].goatcounter.com/counter/[path].json
                // Ensure path starts with / and doesn't end with / unless it's just /
                let cleanPath = path;
                if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

                // Handling the root path case which might need simple handling
                const url = `https://${siteCode}.goatcounter.com/counter${cleanPath}.json`;

                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    // The API returns { count: "123", ... }
                    setCount(data.count);
                }
            } catch (error) {
                console.error('Error fetching GoatCounter stats:', error);
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
