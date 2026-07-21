
import { GoogleGenAI } from "@google/genai";
import { Product, Sale } from '../types';

// Fix: Strictly use process.env.API_KEY directly in the constructor as per guidelines
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY! });
};

export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `Escreva uma descrição atraente e curta (máximo 2 frases) para um produto de venda chamado "${productName}" que pertence à categoria "${category}". O tom deve ser vendedor e apetitoso/útil.`;
    
    // Fix: Using correct model for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    // Fix: Accessing .text property directly (not as a method)
    return response.text || "Descrição não disponível.";
  } catch (error) {
    console.error("Erro ao gerar descrição:", error);
    return "Não foi possível gerar a descrição automaticamente.";
  }
};

export const getBusinessInsights = async (products: Product[], sales: Sale[], query: string): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Create a minimized context string to save tokens but provide info
    const stockContext = products.map(p => `${p.name} (Estoque: ${p.stock})`).join(', ');
    const salesContext = `Total de vendas registradas: ${sales.length}. Faturamento total: R$ ${sales.reduce((acc, s) => acc + s.total, 0).toFixed(2)}.`;
    
    const systemInstruction = `Você é um assistente de negócios inteligente para um sistema de PDV. 
    Analise os dados fornecidos e responda à pergunta do usuário.
    Dados de Estoque: ${stockContext}
    Dados de Vendas: ${salesContext}
    Seja conciso, profissional e útil.`;

    // Fix: Using gemini-3-pro-preview for complex reasoning and data analysis tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: query,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    // Fix: Accessing .text property directly (not as a method)
    return response.text || "Sem insights disponíveis no momento.";
  } catch (error) {
    console.error("Erro ao buscar insights:", error);
    return "Desculpe, estou com dificuldades para analisar seus dados agora.";
  }
};
