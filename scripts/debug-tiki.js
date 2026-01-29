
// Helper to replicate core.ts fetchWithProxy
async function fetchWithProxy(targetUrl) {
    const proxies = [
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://corsproxy.io/?',
        // 'https://api.allorigins.win/raw?url=', // This one sometimes fails in node if headers issues
    ];

    for (const proxy of proxies) {
        try {
            console.log(`Trying proxy: ${proxy}...`);
            const url = proxy + encodeURIComponent(targetUrl);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Status ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Proxy failed: ${error.message}`);
        }
    }
}

async function run() {
    console.log("--- Fetching Raw Data for 'Kinh tế' from Tiki ---");
    const targetUrl = `https://tiki.vn/api/v2/products?q=${encodeURIComponent('Kinh tế')}&limit=1&page=1`;

    try {
        const data = await fetchWithProxy(targetUrl);
        console.log("--- RAW RESPONSE DATA (First Item) ---");
        if (data && data.data && data.data.length > 0) {
            console.log(JSON.stringify(data.data[0], null, 2));
        } else {
            console.log("No data found or structure changed");
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fatal error:", e);
    }
}

run();
