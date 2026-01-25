
// Helper to replicate core.ts fetchWithProxy
async function fetchWithProxy(targetUrl) {
    const proxies = [
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://corsproxy.io/?',
    ];

    for (const proxy of proxies) {
        try {
            // console.log(`Trying proxy: ${proxy}...`);
            const url = proxy + encodeURIComponent(targetUrl);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Status ${response.status}`);
            return await response.json();
        } catch (error) {
            // console.error(`Proxy failed: ${error.message}`);
        }
    }
}

async function checkGoogleBooks() {
    console.log("\n--- Checking Google Books API ---");
    const query = "Kinh tế học";
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=3&langRestrict=vi`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.items) {
            data.items.forEach(b => {
                const info = b.volumeInfo;
                console.log(`[Google] ${info.title}`);
                console.log(`   - Authors: ${info.authors?.join(', ')}`);
                console.log(`   - Publisher: ${info.publisher}`);
                console.log(`   - Image: ${info.imageLinks?.thumbnail ? "YES" : "NO"} (${info.imageLinks?.thumbnail})`);
            });
        }
    } catch (e) { console.error("Google Error", e); }
}

async function checkFahasa() {
    console.log("\n--- Checking Fahasa (via Proxy) ---");
    // Fahasa generic search API endpoint often used by their frontend
    // Note: This is reverse-engineered and might be flaky without headers
    // Using a sample product URL or search API
    // https://www.fahasa.com/catalog/search/?q=kinh+t%E1%BA%BF

    // Fahasa uses Algolia often or internal mageplaza search. 
    // Let's try a direct endpoint if known, otherwise we might scrape.
    // Actually, Fahasa API usually requires complex headers/cookies. 
    // Let's try a specific known endpoint structure if possible, else skip deep integration.

    // Attempting simple search URL via proxy to see if it returns JSON or HTML
    const searchUrl = `https://www.fahasa.com/catalogsearch/result/?q=${encodeURIComponent('kinh tế')}`;
    // scraping HTML is hard in this env without cheerio, let's look for an API pattern
    // Quick knowledge retrieval: Fahasa mobile API or similar?
    // Let's try to fetch an endpoint used by their suggestions:
    // https://www.fahasa.com/search/ajax/suggest/?q=kinh

    const suggestUrl = `https://www.fahasa.com/search/ajax/suggest/?q=${encodeURIComponent('kinh tế')}`;

    try {
        const data = await fetchWithProxy(suggestUrl);
        console.log("Fahasa Suggestion Response:", JSON.stringify(data).substring(0, 500) + "...");
    } catch (e) { console.error("Fahasa Check Failed", e); }
}

async function run() {
    await checkGoogleBooks();
    await checkFahasa();
}

run();
