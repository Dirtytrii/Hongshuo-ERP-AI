import { GoogleGenAI } from "@google/genai";
import { AppState } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes the construction data using Gemini 3 Pro with Thinking Mode.
 * We prioritize deep reasoning (Thinking) over fast responses for this feature.
 */
export const analyzeConstructionData = async (
  query: string, 
  data: AppState
): Promise<string> => {
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

    // Call Gemini 3 Pro Preview with Thinking Budget
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 32768, // Maximum thinking budget for deep analysis
        },
        // Note: When using thinkingConfig, we do not set maxOutputTokens to avoid conflicting limits
        // as the model needs room to "think" and then "speak".
      },
    });

    return response.text || "Analysis complete, but no text was generated.";
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return "I apologize, but I encountered an error while analyzing the data. Please ensure the API key is valid and try again.";
  }
};