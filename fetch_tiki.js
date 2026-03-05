async function fetchBooks() {
    const queries = ["Kinh tế", "Kỹ năng", "Lịch sử", "Thiếu nhi", "Văn học"];
    const results = {};
    for (const q of queries) {
        try {
            const url = `https://tiki.vn/api/v2/products?limit=1&q=sách+${encodeURIComponent(q)}`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });
            const data = await response.json();
            if (data && data.data && data.data.length > 0) {
                const productId = data.data[0].id;
                const detailRes = await fetch(`https://tiki.vn/api/v2/products/${productId}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                    }
                });
                results[q] = await detailRes.json();
            }
        } catch (error) {
            console.error(`Error fetching ${q}:`, error);
        }
    }

    // Save to a local json file for reference
    const fs = require('fs');
    fs.writeFileSync('C:/Users/leuti/Desktop/GitHub/DigiBook/tiki_books_sample.json', JSON.stringify(results, null, 2));
    console.log("Successfully saved to tiki_books_sample.json");

    // Analyze fields from the first one
    const firstBook = results["Kinh tế"];
    if (firstBook) {
        console.log("Top-level keys:", Object.keys(firstBook).join(', '));
        if (firstBook.specifications) {
            console.log("Specifications:", JSON.stringify(firstBook.specifications, null, 2));
        }
    }
}

fetchBooks();
