import "dotenv/config";
import express from "express";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { LiveServerMessage, Session } from "@google/genai";
import { WebSocket, WebSocketServer } from "ws";
import { createGeminiClient } from "./server/geminiClient.ts";
import {
  buildLiveConnectConfig,
  formatServerErrorMessage,
  LIVE_MODEL,
  PROACTIVE_GREETING_TRIGGER,
} from "./server/tutorConfig.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

interface ClientAudioMessage {
  type?: string;
  data?: string;
  audio?: string;
}

function sendJson(ws: WebSocket, payload: Record<string, unknown>) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      model: LIVE_MODEL,
      configured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/live" });

  wss.on("connection", async (clientWs) => {
    if (!process.env.GEMINI_API_KEY) {
      sendJson(clientWs, {
        type: "error",
        message:
          "Shàngwèi shèdìng GEMINI_API_KEY, qǐng yú Settings > Secrets jiārù jīnyào hòu zài shì.",
      });
      clientWs.close();
      return;
    }

    let session: Session | null = null;
    let isClosing = false;

    const cleanup = () => {
      if (isClosing) return;
      isClosing = true;
      if (session) {
        try {
          session.close();
        } catch {
          // Ignore already closed session
        }
        session = null;
      }
    };

    clientWs.on("close", cleanup);
    clientWs.on("error", cleanup);

    try {
      const ai = createGeminiClient();

      session = await ai.live.connect({
        model: LIVE_MODEL,
        config: buildLiveConnectConfig(),
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (isClosing || clientWs.readyState !== WebSocket.OPEN) {
              return;
            }

            const serverContent = message.serverContent;
            if (!serverContent) {
              return;
            }

            if (serverContent.interrupted) {
              sendJson(clientWs, { type: "interrupted" });
            }

            if (serverContent.inputTranscription?.text) {
              sendJson(clientWs, {
                type: "inputTranscript",
                text: serverContent.inputTranscription.text,
              });
            }

            if (serverContent.outputTranscription?.text) {
              sendJson(clientWs, {
                type: "outputTranscript",
                text: serverContent.outputTranscription.text,
              });
            }

            for (const part of serverContent.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                sendJson(clientWs, {
                  type: "audio",
                  data: part.inlineData.data,
                });
              }
            }

            if (serverContent.turnComplete) {
              sendJson(clientWs, { type: "turnComplete" });
            }
          },
          onerror: (err: unknown) => {
            console.error("[Gemini Live onerror]", err);
            if (isClosing) return;
            sendJson(clientWs, {
              type: "error",
              message: formatServerErrorMessage(err),
            });
          },
          onclose: (event: unknown) => {
            console.log("[Gemini Live onclose]", event);
            if (!isClosing && clientWs.readyState === WebSocket.OPEN) {
              sendJson(clientWs, { type: "closed" });
              clientWs.close();
            }
          },
        },
      });

      if (isClosing || clientWs.readyState !== WebSocket.OPEN) {
        cleanup();
        return;
      }

      sendJson(clientWs, { type: "connected" });

      // Trigger the tutor's proactive Traditional Chinese opening greeting
      session.sendClientContent({
        turns: [
          {
            role: "user",
            parts: [{ text: PROACTIVE_GREETING_TRIGGER }],
          },
        ],
        turnComplete: true,
      });

      clientWs.on("message", (raw) => {
        if (isClosing || !session) return;
        try {
          const parsed = JSON.parse(raw.toString()) as ClientAudioMessage;
          const base64Audio = parsed.data ?? parsed.audio;
          if (typeof base64Audio === "string" && base64Audio.length > 0) {
            session.sendRealtimeInput({
              audio: {
                data: base64Audio,
                mimeType: "audio/pcm;rate=16000",
              },
            });
          }
        } catch {
          // Ignore malformed client frames
        }
      });
    } catch (err) {
      console.error("[Gemini Live connect error]", err);
      sendJson(clientWs, {
        type: "error",
        message: formatServerErrorMessage(err),
      });
      cleanup();
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close();
      }
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distDir, "index.html"));
      });
    }
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Mandarin Partner server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
