
/// <reference types="vite/client" />

import { Book } from '../../types';
import { logActivity } from "./core";
import { getAIConfig } from "./system";

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
