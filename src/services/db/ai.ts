
/// <reference types="vite/client" />

import { Book, Order } from '../../types';
import { logActivity } from "./core";
import { getAIConfig } from "./system";
import { getOrdersByUserId } from "./orders";
import { getUserProfile } from "./users";
import { getBooks } from "./books";

// Chat Message Type
export interface ChatMessage {
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
}

async function callAIService(prompt: string, actionName: string): Promise<string> {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const groqKey = import.meta.env.VITE_GROQ_API_KEY;
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  try {
    const config = await getAIConfig();
    const modelId = config.activeModelId || 'gemini-3-flash';

    if (modelId.includes('/')) {
      if (!openRouterKey) throw new Error("Vui lòng cấu hình VITE_OPENROUTER_API_KEY trong file .env");

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'DigiBook App',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenRouter Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        logActivity(actionName, `Generated using OpenRouter (${modelId})`, 'SUCCESS', 'INFO', 'AI');
        return text.trim();
      }
    } else if (modelId.includes('llama') || modelId.includes('mixtral') || modelId.includes('gemma')) {
      if (!groqKey) throw new Error("Vui lòng cấu hình VITE_GROQ_API_KEY trong file .env");

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Groq Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        logActivity(actionName, `Generated using Groq (${modelId})`, 'SUCCESS', 'INFO', 'AI');
        return text.trim();
      }
    } else {
      if (!geminiKey) throw new Error("Vui lòng cấu hình VITE_GEMINI_API_KEY trong file .env");

      const geminiModel = modelId.startsWith('gemini-') ? modelId : 'gemini-3-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (textOutput) {
        logActivity(actionName, `Generated using Gemini (${geminiModel})`, 'SUCCESS', 'INFO', 'AI');
        return textOutput.trim();
      }
    }

    throw new Error("Không thể trích xuất nội dung từ phản hồi của AI.");
  } catch (error: any) {
    console.error("AI Service Error:", error);
    logActivity(`${actionName}_ERROR`, error.message, 'ERROR', 'ERROR', 'AI');
    return "AI đang bận một chút, bạn hãy quay lại sau nhé! Lỗi: " + error.message;
  }
}

export async function getAIInsight(bookTitle: string, author: string, description: string): Promise<string> {
  const prompt = `Bạn là một chuyên gia phê bình sách kỳ cựu tại DigiBook. Hãy viết một đoạn tóm tắt ngắn gọn mang tính khơi gợi và phân tích giá trị cốt lõi của cuốn sách sau bằng tiếng Việt.
  Tên sách: ${bookTitle}
  Tác giả: ${author}
  Mô tả cơ bản: ${description}
  
  Yêu cầu:
  - Trả lời bằng định dạng Markdown (sử dụng in đậm, danh sách nếu cần để tăng tính dễ đọc).
  - Ngôn ngữ chuyên nghiệp, sang trọng, cuốn hút.
  - Nêu bật tại sao độc giả nên đọc cuốn sách này.
  - Không lặp lại nguyên văn mô tả cơ bản.
  - Bắt đầu đoạn bằng một câu khẳng định mạnh mẽ về cuốn sách.`;

  return callAIService(prompt, 'AI_INSIGHT');
}

export async function getAuthorAIInsight(authorName: string): Promise<string> {
  const prompt = `Bạn là một chuyên gia nghiên cứu văn học. Hãy viết một đoạn giới thiệu chuyên sâu và lôi cuốn về tác giả "${authorName}". 
  
  Yêu cầu:
  - Trả lời bằng định dạng Markdown (sử dụng các tiêu đề nhỏ, in đậm hoặc danh sách gạch đầu dòng để làm nổi bật thông tin).
  - Nêu bật phong cách sáng tác đặc trưng, những chủ đề chính trong tác phẩm của họ và tầm ảnh hưởng của họ trong giới văn học. 
  - Trả lời bằng tiếng Việt, giọng văn trang trọng nhưng giàu cảm xúc.`;

  return callAIService(prompt, 'AI_AUTHOR_INSIGHT');
}

export async function getAIInsights(book: Book | null, customPrompt: string): Promise<string> {
  return callAIService(customPrompt, 'AI_GENERAL_INSIGHT');
}

export async function getPersonalizedRecommendations(userId: string): Promise<Book[]> {
  try {
    // 1. Fetch User Data
    const [userProfile, orders, allBooks] = await Promise.all([
      getUserProfile(userId),
      getOrdersByUserId(userId),
      getBooks()
    ]);

    if (!userProfile) return [];

    // 2. Analyze Interests
    const purchasedBookIds = new Set<string>();
    const authorCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    // Analyze Wishlist
    if (userProfile.wishlistIds) {
      userProfile.wishlistIds.forEach(id => {
        const book = allBooks.find(b => b.id === id);
        if (book) {
          authorCounts[book.author] = (authorCounts[book.author] || 0) + 2; // Wishlist weight = 2
          categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 2;
        }
      });
    }

    // Analyze Orders
    orders.forEach(order => {
      order.items?.forEach(item => {
        purchasedBookIds.add(item.bookId);
        // Find original book for category (assuming order item has minimal info)
        const book = allBooks.find(b => b.id === item.bookId);
        if (book) {
          authorCounts[book.author] = (authorCounts[book.author] || 0) + 1; // Purchase weight = 1
          categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 1;
        }
      });
    });

    const topAuthors = Object.entries(authorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([k]) => k);

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([k]) => k);

    // 3. Filter Candidates (exclude purchased)
    // Prioritize top categories/authors but include some random for diversity
    let candidates = allBooks.filter(b => !purchasedBookIds.has(b.id));

    // Narrow down to 20 candidates if list is too large to send to AI
    // Filter by interest first
    const interestedCandidates = candidates.filter(b =>
      topCategories.includes(b.category) || topAuthors.includes(b.author)
    );

    // Fill up with high rated books if not enough interested candidates
    let finalCandidates = [...interestedCandidates];
    if (finalCandidates.length < 20) {
      const others = candidates
        .filter(b => !finalCandidates.includes(b))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 20 - finalCandidates.length);
      finalCandidates = [...finalCandidates, ...others];
    }

    finalCandidates = finalCandidates.slice(0, 30); // Max cap

    if (finalCandidates.length === 0) return [];

    // 4. Ask AI to pick top 5
    const prompt = `
    Bạn là một chuyên gia tư vấn sách cá nhân. Hãy chọn ra 4 cuốn sách phù hợp nhất cho người dùng này từ danh sách ứng viên bên dưới.
    
    HỒ SƠ NGƯỜI DÙNG:
    - Tác giả yêu thích: ${topAuthors.join(', ') || 'Chưa rõ'}
    - Thể loại yêu thích: ${topCategories.join(', ') || 'Chưa rõ'}
    
    DANH SÁCH ỨNG VIÊN (Format: ID | Tên | Tác giả | Thể loại | Rating):
    ${finalCandidates.map(b => `- ${b.id} | ${b.title} | ${b.author} | ${b.category} | ${b.rating}`).join('\n')}
    
    YÊU CẦU:
    - Trả về kết quả dưới dạng JSON Array chứa các ID của sách được chọn.
    - Định dạng JSON hợp lệ: ["id1", "id2", "id3", "id4"]
    - KHÔNG trả lời thêm bất kỳ text nào khác ngoài JSON.
    `;

    const resultText = await callAIService(prompt, 'AI_RECOMMENDATION');

    // Extract JSON from text (in case AI adds md blocks)
    const jsonMatch = resultText.match(/\[.*\]/s);
    if (!jsonMatch) return finalCandidates.slice(0, 4); // Fallback: return top rated from candidates

    const recommendedIds = JSON.parse(jsonMatch[0]);

    // Return books in order of recommendation
    const recommendedBooks = recommendedIds
      .map((id: string) => finalCandidates.find(b => b.id === id))
      .filter((b: Book | undefined): b is Book => b !== undefined);

    return recommendedBooks.length > 0 ? recommendedBooks : finalCandidates.slice(0, 4);

  } catch (error) {
    console.warn("Error getting personalized recommendations:", error);
    return []; // Fail gracefully
  }
}

export async function chatWithAI(messages: ChatMessage[]): Promise<string> {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const groqKey = import.meta.env.VITE_GROQ_API_KEY;
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  try {
    const config = await getAIConfig();
    const modelId = config.activeModelId || 'gemini-3-flash';

    // Normalize messages for OpenAI-compatible APIs (Groq, OpenRouter)
    // Map 'model' -> 'assistant'
    const openAIMessages = messages.map(m => ({
      role: m.role === 'model' ? 'assistant' : m.role,
      content: m.content
    }));

    // Normalize for Gemini
    // Map 'assistant' -> 'model'
    const geminiMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }]
    }));

    if (modelId.includes('/') || modelId.includes('llama') || modelId.includes('mixtral') || modelId.includes('gemma')) {
      // OpenRouter or Groq (OpenAI Compatible)
      const url = modelId.includes('/') ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
      const apiKey = modelId.includes('/') ? openRouterKey : groqKey;

      if (!apiKey) throw new Error("Missing API Key for " + modelId);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(modelId.includes('/') ? { 'HTTP-Referer': window.location.origin, 'X-Title': 'DigiBook App' } : {})
        },
        body: JSON.stringify({
          model: modelId,
          messages: openAIMessages
        })
      });

      if (!response.ok) throw new Error("Chat API Error");
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      return text || "No response";

    } else {
      // Gemini
      if (!geminiKey) throw new Error("Missing Gemini API Key");

      let contents = geminiMessages.filter(m => m.role !== 'system');
      let systemInstruction = geminiMessages.find(m => m.role === 'system');

      const geminiModel = modelId.startsWith('gemini-') ? modelId : 'gemini-3-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;

      const payload: any = { contents };
      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction.parts[0].text }] };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Gemini Error");
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    }

  } catch (error) {
    console.error("AI Chat Error:", error);
    return "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.";
  }
}
