
import { GoogleGenAI } from "@google/genai";
import { Transaction, BankAccount } from './types';

// Use the recommended Gemini model and initialization pattern for financial advisory tasks.
export const getFinancialAdvice = async (transactions: Transaction[], accounts: BankAccount[]) => {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined") {
    return "系統目前處於離線展示模式，或未設定 API_KEY。請在 GitHub Secrets 中配置 API_KEY 以啟用 AI 分析功能。";
  }

  // Always use the named parameter for API key initialization.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const summary = transactions.reduce((acc, t) => {
    const amount = Number(t.amount);
    if (t.type === 'INCOME') acc.income += amount;
    else acc.expense += amount;
    return acc;
  }, { income: 0, expense: 0 });

  const categorySummary = transactions.reduce((acc: Record<string, number>, t) => {
    if (t.type === 'EXPENSE') {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    }
    return acc;
  }, {});

  const dataContext = `
    使用者目前總收入：${summary.income} 元
    使用者目前總支出：${summary.expense} 元
    各銀行帳戶狀態：${accounts.map(a => `${a.name}: ${a.balance}元`).join(', ')}
    支出分類詳細分布：${JSON.stringify(categorySummary)}
  `;

  try {
    // Using gemini-3-pro-preview for complex reasoning tasks like financial advising.
    // System instructions are moved to the config for better separation of concerns.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: dataContext,
      config: {
        systemInstruction: "你是一位資深專業財務顧問。請根據提供的資產與支出數據進行深度邏輯分析。請提供專業且具體建議（約 300 字）：1. 支出合理性評估。2. 給予具體的「儲蓄與理財建議」。3. 找出可能存在的財務漏洞。請使用繁體中文，並以親切、專業的語氣回答。",
        // Enable thinking budget for complex financial analysis to improve reasoning quality.
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });
    
    // Access the text property directly as it is a getter.
    return response.text || "AI 暫時無法產生成果。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 分析服務暫時不可用，請檢查 API Key 是否正確或網路連接。";
  }
};
