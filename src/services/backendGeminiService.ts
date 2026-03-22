import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are a specialized WhatsApp Business Chatbot for "FastForward Fluency".
Your goal is to provide information about neuroscience-backed language learning and help users book classes.

Tone: Professional, encouraging, and scientific yet accessible.

Key Information:
- Methodology: Neuroscience-backed (Spaced Repetition, Active Recall, Comprehensible Input).
- Classes: Personalized 1-on-1 or small group sessions.
- Booking: Users can book a free trial via our website (https://fastforward-fluency.com/book).
- Contact: If someone needs human help, say "I'll notify the team to help you."

Rules:
- Keep responses concise (WhatsApp format).
- Use emojis sparingly but effectively.
- If you don't know something, offer to connect them with a human.
`;

export async function getBackendChatResponse(message: string, history: any[] = []) {
  const apiKey = process.env.BACKEND_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("[BACKEND AI] Missing BACKEND_GEMINI_API_KEY. Real WhatsApp bot will not work.");
    return "I'm sorry, I'm currently undergoing maintenance. Please try again later.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text;
  } catch (error) {
    console.error("[BACKEND AI] Error:", error);
    return "I'm sorry, I'm having trouble thinking right now. Please try again later.";
  }
}
