
import { GoogleGenAI } from "@google/genai";
import { Transaction, BankAccount } from './types';

// The Google GenAI SDK must be initialized with the API key from process.env.API_KEY.
export const getFinancialAdvice = async (transactions: Transaction[], accounts: BankAccount[]) => {
  if (!process.env.API_KEY) {
    return "系統目前處於離線展示模式，AI 建議功能暫不開放。請在 GitHub Secrets 中配置 API_KEY 以啟用。";
  }

  // Always use a named parameter when initializing GoogleGenAI.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const summary = transactions.reduce((acc, t) => {
    const amount = Number(t.amount);
    if (t.type === 'INCOME') acc.income += amount;
    else acc.expense += amount;
    return acc;
  }, { income: 0, expense: 0 });

  const categorySummary = transactions.reduce((acc: any, t) => {
    if (t.type === 'EXPENSE') {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    }
    return acc;
  }, {});

  const prompt = `
    你是一位專業的財務顧問。以下是使用者的財務摘要：
    - 總收入：${summary.income} 元
    - 總支出：${summary.expense} 元
    - 銀行帳戶總覽：${accounts.map(a => `${a.name}: ${a.balance}元`).join(', ')}
    - 支出分類摘要：${JSON.stringify(categorySummary)}
    
    請提供一段 300 字以內的專業建議，包含：
    1. 支出分析。
    2. 儲蓄建議。
    3. 針對具體支出的節約提示。
    請用繁體中文回答，語氣親切且專業。
  `;

  try {
    // Call generateContent with both model name and prompt directly.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    // The response object features a text property (not a method).
    return response.text || "無法生成 AI 建議。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI 服務暫時無法使用，請稍後再試。";
  }
};
