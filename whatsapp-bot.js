import express from 'express';
import { GoogleGenAI } from "@google/genai";

/**
 * FastForward Fluency - WhatsApp Business Chatbot (JavaScript Version)
 * 
 * This script handles incoming WhatsApp messages via a webhook,
 * processes them using Gemini AI with neuroscience knowledge,
 * and handles class bookings/strategy sessions.
 */

const app = express();
app.use(express.json());

// 1. Configuration constants
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BOOKING_LINK = "https://calendar.app.google/afaSLC9ZA3sk51u17";

const SYSTEM_INSTRUCTION = `
You are the official AI Assistant for FastForward Fluency, a language school using neuroscience-backed methods.
Ground your answers in the knowledge from these websites:
- https://fastforward-fluency.com/
- https://fastforward-fluency.com/neuroscience/
- https://fastforward-fluency.com/myths/
- https://fastforward-fluency.com/about/

Key Policies:
1. Rescheduling or Booking: ALWAYS provide this link: ${BOOKING_LINK}
2. New Clients: Provide ${BOOKING_LINK} for a Strategy Session (Level assessment EN/ES/PT).
3. Human Contact: If asked for a human, say you'll notify the team.
4. WhatsApp Tone: Keep responses concise, use *bold* for emphasis, and keep it professional yet encouraging.
5. Language: Answer in the language the user is using (EN, ES, or PT).
`;

// 2. AI Response Function
async function getAIResponse(message) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing. Please set it in your environment.");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ urlContext: {} }],
    },
  });

  return response.text;
}

// 3. WhatsApp Webhook Endpoint
// This endpoint is designed to be called by your WhatsApp provider (e.g., Twilio, Meta)
app.post("/api/whatsapp/webhook", async (req, res) => {
  // Note: The field names (Body, From) depend on your specific provider (Twilio uses these)
  const { Body, From } = req.body; 
  
  if (!Body || !From) {
    return res.status(400).send("Invalid request: Body and From are required.");
  }

  console.log(`[Incoming] From: ${From} | Message: ${Body}`);

  try {
    const aiResponse = await getAIResponse(Body);
    
    /**
     * TO SEND THE MESSAGE BACK:
     * You would use your provider's SDK here.
     * 
     * Example (Twilio):
     * const client = require('twilio')(accountSid, authToken);
     * await client.messages.create({
     *   body: aiResponse,
     *   from: 'whatsapp:+14155238886', // Your WA Business Number
     *   to: From
     * });
     */
    
    console.log(`[Outgoing] To: ${From} | Response: ${aiResponse}`);
    
    // Check for human handoff trigger
    if (aiResponse.toLowerCase().includes("notify the team")) {
      console.log(`!!! ALERT: Human assistance requested by ${From} !!!`);
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).send("Error processing message");
  }
});

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`WhatsApp Bot Backend is running on port ${PORT}`);
  console.log(`Webhook URL: http://your-app-url/api/whatsapp/webhook`);
});
