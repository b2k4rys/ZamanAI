/**
 * Gemini API Integration for Zaman AI
 * Uses Google Generative Language API (Gemini 2.0 Flash Lite)
 */

const GEMINI_API_KEY = "AIzaSyDzBZDpBWZQmHNTOrQJgdwNFSI-TbdW-Gs";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    status: string;
  };
}

/**
 * Convert chat messages to Gemini format
 * Gemini doesn't have separate system messages, so we prepend system context to the first user message
 */
function formatMessagesForGemini(messages: Message[]): string {
  const systemMessages = messages
    .filter(m => m.role === "system")
    .map(m => m.content)
    .join("\n\n");

  const conversationHistory = messages
    .filter(m => m.role !== "system")
    .map(m => `${m.role === "user" ? "Пользователь" : "Ассистент"}: ${m.content}`)
    .join("\n\n");

  // Combine system instructions with conversation
  return `${systemMessages}\n\n---\n\n${conversationHistory}`;
}

/**
 * Send a request to Gemini API
 */
export async function callGemini(messages: Message[]): Promise<string> {
  try {
    const prompt = formatMessagesForGemini(messages);

    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.95,
      }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle specific error codes
      if (response.status === 403) {
        throw new Error("Ошибка доступа к API. Проверьте API ключ.");
      }
      if (response.status === 429) {
        throw new Error("Превышен лимит запросов. Подождите 10-15 секунд и попробуйте снова.");
      }
      
      throw new Error(errorData.error?.message || `Ошибка API: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();

    // Extract text from response
    const messageContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!messageContent) {
      console.error("Unexpected Gemini response format:", data);
      throw new Error("Непредвиденный формат ответа от модели");
    }

    return messageContent;

  } catch (error) {
    console.error("Gemini API error:", error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error("⚠️ Ошибка связи с сервером");
  }
}

/**
 * Test function to verify Gemini API connection
 */
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const response = await callGemini([
      { role: "user", content: "Привет! Ты работаешь?" }
    ]);
    console.log("Gemini test response:", response);
    return true;
  } catch (error) {
    console.error("Gemini connection test failed:", error);
    return false;
  }
}
