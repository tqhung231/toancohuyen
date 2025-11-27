import { GoogleGenAI } from "@google/genai";
import { Student } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateClassReport = async (className: string, students: Student[]): Promise<string> => {
  const client = getClient();
  if (!client) {
    return "API Key is missing. Please ensure your environment is configured correctly.";
  }

  const prompt = `
    I have a class of students named "${className}". Here are their performance stats (Net Score = Bonus - Minus):
    ${students.map(s => `- ${s.name}: Net Score ${s.bonus - s.minus} (Bonus: ${s.bonus}, Minus: ${s.minus})`).join('\n')}

    Please analyze these scores and provide a short, encouraging summary for the teacher. 
    1. Highlight the top performer(s).
    2. Suggest a general area of improvement if scores are low (high minus count), or praise the class if high.
    3. Keep the tone fun, professional, and motivating.
    4. Keep it under 150 words.
    5. Do not use markdown formatting like bold or italics, just plain text with paragraphs.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "Could not generate report.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while generating the report. Please try again later.";
  }
};
