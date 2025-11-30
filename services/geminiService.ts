import { GoogleGenAI, Type } from "@google/genai";
import { MonthlyData, AIAdvice } from "../types";

const apiKey = process.env.API_KEY;

export const getFinancialAdvice = async (data: MonthlyData[]): Promise<AIAdvice | null> => {
  if (!apiKey) {
    console.warn("API Key not found via process.env.API_KEY");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  // Filter only future data or relevant data to keep context small
  const simplifiedData = data.filter(d => d.totalDue > 0).map(d => ({
    month: d.month,
    totalDue: d.totalDue,
    topItems: d.items.slice(0, 3).map(i => `${i.title} (${i.installmentNumber}x)`),
  }));

  const prompt = `
    Analise a seguinte projeção de gastos de cartão de crédito para os próximos meses.
    Dados: ${JSON.stringify(simplifiedData)}
    
    Forneça uma análise financeira breve, nível de risco e dicas práticas para amortização ou controle.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Você é um consultor financeiro pessoal experiente, especialista em gestão de dívidas e fluxo de caixa no Brasil. Seja direto, prático e empático.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Resumo da situação financeira baseado na curva de gastos." },
            riskLevel: { type: Type.STRING, enum: ["Baixo", "Médio", "Alto"], description: "Nível de risco de endividamento." },
            tips: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3 dicas práticas para o usuário baseadas nos dados."
            }
          },
          required: ["summary", "riskLevel", "tips"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAdvice;
    }
    return null;

  } catch (error) {
    console.error("Error fetching Gemini advice:", error);
    return null;
  }
};
