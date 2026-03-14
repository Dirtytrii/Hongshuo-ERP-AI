import { GoogleGenAI } from '@google/genai';
import { AppState } from '../types';

// 延迟初始化 AI 客户端，只在需要时创建
let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY 未设置。请在项目根目录创建 .env 文件并设置 GEMINI_API_KEY=your_api_key');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

/**
 * Analyzes the construction data using Gemini 2.0 Flash.
 * Balanced speed and cost for AI 决策室 analysis.
 */
export const analyzeConstructionData = async (query: string, data: AppState): Promise<string> => {
  try {
    // Construct a comprehensive prompt with the current data state
    const prompt = `
      You are an expert Construction Data Analyst and Strategic Consultant for "Hongshuo Construction".
      
      Here is the current live database of the company in JSON format:
      
      Projects Status:
      ${JSON.stringify(data.projects, null, 2)}
      
      Inventory Levels:
      ${JSON.stringify(data.inventory, null, 2)}
      
      Finance Records:
      ${JSON.stringify(data.financeRecords, null, 2)}
      
      Recent Stock Logs:
      ${JSON.stringify(data.stockLogs.slice(0, 20), null, 2)}
      
      ---
      USER QUERY: "${query}"
      ---
      
      Please perform a deep analysis based on the data provided. 
      - If the user asks about financial health, calculate margins and cash flow.
      - If the user asks about inventory, check for shortages relative to project progress.
      - If the user asks for strategy, provide actionable, high-level advice.
      - Format your response clearly. Use bullet points or bold text for key figures.
      - Do not include raw JSON in the output, interpret it for a business executive.
    `;

    // Call Gemini 2.0 Flash (cost-effective, fast)
    const aiClient = getAI();
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 8192,
      },
    });

    return response.text || 'Analysis complete, but no text was generated.';
  } catch (error: unknown) {
    const err = error as {
      message?: string;
      status?: number;
      statusCode?: number;
      code?: number;
      name?: string;
      response?: { status?: number };
    };
    const status = err?.status ?? err?.statusCode ?? err?.response?.status;
    const safeMessage = err?.message != null ? String(err.message).slice(0, 500) : '';
    console.error('Gemini Analysis Failed:', error);

    const is429 =
      status === 429 ||
      safeMessage.includes('429') ||
      safeMessage.includes('RESOURCE_EXHAUSTED') ||
      safeMessage.includes('quota') ||
      safeMessage.includes('limit: 0');
    if (is429) {
      return '请求过于频繁或当前 API 配额已用尽（429）。请稍后再试，或在 Google AI Studio 查看用量与配额：https://ai.google.dev/gemini-api/docs/rate-limits 。若需更高额度，请检查计费与方案。';
    }
    return 'I apologize, but I encountered an error while analyzing the data. Please ensure the API key is valid and try again.';
  }
};
