
import { GoogleGenAI } from "@google/genai";
import { Transaction, BankAccount } from './types';

export const getFinancialAdvice = async (transactions: Transaction[], accounts: BankAccount[]) => {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined") {
    return "系統目前處於離線展示模式，或未設定 API_KEY。請在 GitHub Secrets 中配置 API_KEY 以啟用 AI 分析功能。";
  }

  // 始終使用具名參數初始化 GoogleGenAI
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
    目前的收支數據如下：
    - 總收入：${summary.income} 元
    - 總支出：${summary.expense} 元
    - 銀行帳戶列表：${accounts.map(a => `${a.name}(${a.bankName}): ${a.balance}元`).join(', ')}
    - 支出分類：${JSON.stringify(categorySummary)}
  `;

  try {
    // 使用 gemini-3-pro-preview 並配置系統指令與思考預算
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: dataContext,
      config: {
        systemInstruction: "你是一位精通財務邏輯與數據分析的資深理財顧問。請根據提供的金融數據提供深度分析與具體建議（300字以內）。你的建議應包含：1. 消費行為模式評估。2. 針對高支出類別的省錢策略。3. 基於目前帳戶餘額的短期儲蓄計畫。請使用繁體中文，語氣需專業、親切且具備行動指導性。",
        thinkingConfig: { thinkingBudget: 32768 } // 啟用思考預算以獲得高品質的分析
      },
    });
    
    return response.text || "AI 暫時無法產生成果。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 分析服務暫時不可用，請檢查 API Key 是否正確。";
  }
};
