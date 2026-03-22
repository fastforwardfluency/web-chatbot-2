import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getBackendChatResponse } from "./src/services/backendGeminiService";
import { sendWhatsAppMessage } from "./src/services/metaService";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json());

  // Meta WhatsApp Webhook Verification (GET)
  app.get("/api/whatsapp/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode && token) {
      if (mode === "subscribe" && token === verifyToken) {
        console.log("[META WEBHOOK] Verified successfully!");
        res.status(200).send(challenge);
      } else {
        console.error("[META WEBHOOK] Verification failed. Token mismatch.");
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(400);
    }
  });

  // Meta WhatsApp Webhook Message Handling (POST)
  app.post("/api/whatsapp/webhook", async (req, res) => {
    const body = req.body;

    // Check if this is a WhatsApp message event
    if (body.object === "whatsapp_business_account") {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const message = body.entry[0].changes[0].value.messages[0];
        const from = message.from; // Sender's phone number
        const text = message.text?.body; // Message text

        if (text) {
          console.log(`[META WEBHOOK] Received message from ${from}: ${text}`);

          try {
            // 1. Get AI Response
            const aiResponse = await getBackendChatResponse(text, []);
            
            // 2. Send Response back to WhatsApp
            if (aiResponse) {
              await sendWhatsAppMessage(from, aiResponse);
            }

            // 3. Check for human handoff
            if (aiResponse?.toLowerCase().includes("notify the team") || aiResponse?.toLowerCase().includes("speak to a human")) {
              console.log(`[HUMAN HANDOFF ALERT] User ${from} needs assistance.`);
            }
          } catch (error) {
            console.error("[META WEBHOOK] Error processing message:", error);
          }
        }
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
