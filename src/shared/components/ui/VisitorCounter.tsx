import React, { useEffect, useState } from 'react';

interface VisitorCounterProps {
    siteCode?: string;
    path?: string;
}

export const VisitorCounter: React.FC<VisitorCounterProps> = ({
    siteCode = '',
    path = '/' // Unused for TOTAL.json but kept for interface compatibility
}) => {
    const [count, setCount] = useState<string | null>(null);

    useEffect(() => {
        if (!siteCode || siteCode === 'YOUR_CODE') return;

        const fetchStats = async () => {
            try {
                // Using TOTAL.json to get total site views as per requirements.
                // rnd param prevents caching.
                const url = `https://${siteCode}.goatcounter.com/counter/TOTAL.json?rnd=${Math.random()}`;

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data && data.count) {
                    setCount(data.count);
                }
            } catch (error) {
                console.warn('Không thể lấy lượt truy cập:', error);
            }
        };

        fetchStats();
    }, [siteCode]);

    // Format count: if null, show loading dash, else number
    const displayCount = count ? parseInt(count).toLocaleString() : '---';

    return (
        <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group cursor-help visit-count-container"
            title="Lượt truy cập"
        >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <i className="fa-solid fa-users-viewfinder text-slate-400 group-hover:text-emerald-400 transition-colors text-xs"></i>
            <span className="text-xs font-bold font-mono text-slate-300 group-hover:text-white transition-colors visit-count-value">
                {displayCount}
            </span>
        </div>
    );
};

export default VisitorCounter;
