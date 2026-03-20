import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    content: {
      type: Type.OBJECT,
      properties: {
        hook: { type: Type.STRING, description: "Phân tích 3 giây đầu tiên" },
        body: { type: Type.STRING, description: "Phân tích nội dung chính" },
        cta: { type: Type.STRING, description: "Phân tích lời kêu gọi hành động (CTA)" },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Các gợi ý cải thiện nội dung" }
      },
      required: ["hook", "body", "cta", "suggestions"]
    },
    audio: {
      type: Type.OBJECT,
      properties: {
        pacing: { type: Type.STRING, description: "Phân tích tốc độ và nhịp điệu lời nói" },
        sentiment: { type: Type.STRING, description: "Cảm xúc của âm thanh" },
        audioSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Các gợi ý cải thiện âm thanh" }
      },
      required: ["pacing", "sentiment", "audioSuggestions"]
    },
    visual: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: "Mô tả các yếu tố hình ảnh và chất lượng" },
        visualSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Các gợi ý cải thiện hình ảnh" }
      },
      required: ["description", "visualSuggestions"]
    },
    viralScore: { type: Type.NUMBER, description: "Điểm tiềm năng viral dự kiến từ 0 đến 100" },
    summary: { type: Type.STRING, description: "Tóm tắt tổng quan về tiềm năng của video" }
  },
  required: ["content", "audio", "visual", "viralScore", "summary"]
};

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isAbortError = error.message?.includes('aborted') || error.name === 'AbortError';
    if (retries > 0 && (isAbortError || error.message?.includes('fetch') || error.status === 503)) {
      console.warn(`Retrying Gemini call... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function analyzeTranscript(transcript: string): Promise<AnalysisResult> {
  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Hãy phân tích bản ghi video TikTok sau đây để đánh giá tiềm năng viral. 
        Tập trung vào Hook (3 giây đầu), Nhịp độ, Cảm xúc và CTA.
        Tất cả các câu trả lời phải bằng tiếng Việt.
        
        Bản ghi:
        ${transcript}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA as any,
        },
      });

      const text = response.text;
      if (!text) throw new Error("Không nhận được phản hồi từ AI");
      return JSON.parse(text) as AnalysisResult;
    } catch (error) {
      console.error("Gemini Transcript Error:", error);
      throw error;
    }
  });
}

export async function analyzeVideo(videoBase64: string, mimeType: string): Promise<AnalysisResult> {
  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              data: videoBase64,
              mimeType: mimeType,
            },
          },
          {
            text: "Hãy phân tích video TikTok này để đánh giá tiềm năng viral. Xem xét các hook hình ảnh, nhịp độ, cảm xúc âm thanh và cấu trúc nội dung tổng thể (Hook, Body, CTA). Cung cấp điểm viral và các gợi ý cải thiện. Tất cả các câu trả lời phải bằng tiếng Việt.",
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA as any,
        },
      });

      const text = response.text;
      if (!text) throw new Error("Không nhận được phản hồi từ AI");
      return JSON.parse(text) as AnalysisResult;
    } catch (error) {
      console.error("Gemini Video Error:", error);
      throw error;
    }
  });
}
