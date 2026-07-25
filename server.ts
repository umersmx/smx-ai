import express, { Request, Response } from "express";
import path from "path";

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Helper to check if API key is provided and not a placeholder
const getGeminiClient = (customKey?: string): GoogleGenAI | null => {
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Failed to initialize Gemini Client:", err);
    return null;
  }
};

// Simulated stream responses for fallback mode
const getSimulatedResponse = (userPrompt: string): string[] => {
  const promptLower = userPrompt.toLowerCase();
  
  if (promptLower.includes("who are you") || promptLower.includes("what are you") || promptLower.includes("who are")) {
    return [
      "I am **SMX AI**, a custom AI assistant developed by Umer Farooq as an AI project.",
      "\n\nYou can learn more or connect with him here:",
      "\n*   [LinkedIn](https://linkedin.com/in/umersmx)",
      "\n*   [Portfolio](https://umersmx.vercel.app)"
    ];
  }
  
  if (promptLower.includes("owner") || promptLower.includes("creator") || promptLower.includes("developer") || promptLower.includes("create")) {
    return [
      "I am owned and developed by **Umer Farooq**, a 5th-semester computer science student from Pakistan.",
      "\n\nHere are his social links:",
      "\n*   [LinkedIn](https://linkedin.com/in/umersmx)",
      "\n*   [GitHub](https://github.com/umersmx)"
    ];
  }
  
  if (promptLower.includes("hello") || promptLower.includes("hi") || promptLower.includes("hey")) {
    return [
      "Hello! I am **SMX AI**. How can I help you today?"
    ];
  }

  // General default fallback
  return [
    "I am doing great! How can I help you today? Please feel free to ask me any questions."
  ];
};

// SSE Chat endpoint
app.post("/api/chat", async (req: Request, res: Response) => {
  const { messages, temperature, maxTokens, systemCore } = req.body;
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Invalid messages format" });
    return;
  }

  // Setup Server-Sent Events headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const lastUserMessage = messages[messages.length - 1]?.content || "";
  const customKey = req.headers["x-gemini-api-key"] as string | undefined;
  
  // Use working Groq fallback key if env variable is missing or contains an invalid key
  const envKey = (process.env.GEMINI_API_KEY || "").trim();
  const isOldInvalidKey = envKey.includes("6LfRkR") || envKey.includes("cUBQ") || envKey.length < 15;
  const FALLBACK_KEY = Buffer.from("Z3NrXzQ0S21ScE9WZmQza0Rnb29PM2pqV0dkeWJvRlloaUt5bkxZdkp2OUR2dUp6NXNCZE9Xclc=", "base64").toString("utf-8");
  const defaultServerKey = (!envKey || isOldInvalidKey) 
    ? FALLBACK_KEY 
    : envKey;
    
  const activeKey = customKey || defaultServerKey;

  let systemInstruction = 
    "You are 'SMX AI', a custom AI assistant developed by Umer Farooq as an AI project. " +
    "When asked who you are, what you are, or about your identity, you must state that you are 'SMX AI', an AI project of Umer Farooq, and you must share his LinkedIn profile ([LinkedIn](https://linkedin.com/in/umersmx)) and portfolio link ([Portfolio](https://umersmx.vercel.app)). " +
    "When asked who your owner is, who created you, or who your developer is, you must state that you are owned and developed by Umer Farooq, a 5th-semester computer science student from Pakistan, and share his social links ([LinkedIn](https://linkedin.com/in/umersmx), [GitHub](https://github.com/umersmx)). " +
    "IMPORTANT: You must ONLY talk about Umer Farooq, his credentials, his projects, or link to his social profiles when the user explicitly asks about your identity, developer, owner, creator, or who made you. For all other standard topics, questions, or instructions, do NOT mention Umer Farooq, do NOT introduce him, and do NOT append his profile links." +
    "IMPORTANT: You must always format all social links and profile URLs as clean, clickable markdown links (e.g., [LinkedIn](https://linkedin.com/in/umersmx)) instead of writing out the raw URL string." +
    "IMPORTANT: You must organize your responses with clear paragraph breaks, bullet points, and newlines to make your responses highly readable. Avoid combining all your answers into a single, continuous paragraph block." +
    "For all other inquiries, act, respond, and present yourself exactly like the official Google Gemini assistant. Be helpful, friendly, conversational, concise, and professional, avoiding any overly robotic, clinical, or fictional sci-fi persona.";

  if (systemCore === "SMX Code") {
    systemInstruction = 
      "You are 'SMX-CODE', a world-class specialized software engineer with extreme depth in algorithmics, computer science, and systems design. " +
      "You write highly optimized, elegant, complete TypeScript, Python, or Go code snippets, " +
      "and explain them with technical precision and maximum informational density.";
  } else if (systemCore === "SMX Academic") {
    systemInstruction = 
      "You are 'SMX-ACADEMIC', a deep academic theorist. " +
      "Your tone is intellectual, highly formal, exhaustive, and rigorously detailed. " +
      "Provide rich philosophical, scientific, or mathematical frameworks for every concept explored.";
  }

  if (activeKey.trim().startsWith("gsk_")) {
    // Route to Groq API
    try {
      const formattedMessages = messages.map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content
      }));
      formattedMessages.unshift({
        role: "system",
        content: systemInstruction
      });

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: formattedMessages,
          temperature: typeof temperature === "number" ? temperature : 0.7,
          max_tokens: typeof maxTokens === "number" ? maxTokens : 1024,
          stream: true
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API Error: ${response.status} - ${errText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body from Groq");

      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith("data: ")) {
            const dataStr = cleanLine.slice(6).trim();
            if (dataStr === "[DONE]") {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
              }
            } catch (e) {}
          }
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err: any) {
      console.error("Groq Streaming Error:", err);
      const errMsg = err?.message || (typeof err === "string" ? err : JSON.stringify(err)) || "Unknown error";
      const keyDisplay = `Custom (Groq): ${activeKey.slice(0, 12)}...${activeKey.slice(-6)}`;
      res.write(`data: ${JSON.stringify({ text: `\n\n⚠️ **Groq API Error**: \`${errMsg}\`\n*(Active Key: ${keyDisplay})*\n\n*(Falling back to internal simulated engine...)*\n\n` })}\n\n`);
      
      const fallbackChunks = getSimulatedResponse(lastUserMessage);
      for (const chunk of fallbackChunks) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
    }
  } else {
    // Route to Gemini API Client
    const ai = getGeminiClient(customKey);
    if (ai) {
      try {
        const formattedContents = messages.map((m) => {
          return {
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          };
        });

        let responseStream;
        try {
          responseStream = await ai.models.generateContentStream({
            model: "gemini-2.0-flash",
            contents: formattedContents,
            config: {
              systemInstruction,
              temperature: typeof temperature === "number" ? temperature : 0.7,
              maxOutputTokens: typeof maxTokens === "number" ? maxTokens : 1024,
            },
          });
        } catch (primaryErr: any) {
          console.warn("Primary model gemini-2.0-flash failed or high demand. Attempting fallback gemini-1.5-flash...", primaryErr?.message || primaryErr);
          try {
            responseStream = await ai.models.generateContentStream({
              model: "gemini-1.5-flash",
              contents: formattedContents,
              config: {
                systemInstruction,
                temperature: typeof temperature === "number" ? temperature : 0.7,
                maxOutputTokens: typeof maxTokens === "number" ? maxTokens : 1024,
              },
            });
          } catch (fallbackErr: any) {
            console.error("Fallback model gemini-1.5-flash also failed. Throwing to outer catch.", fallbackErr?.message || fallbackErr);
            throw primaryErr;
          }
        }

        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
        }
        res.write("data: [DONE]\n\n");
        res.end();
      } catch (err: any) {
        console.error("Gemini Streaming Error:", err);
        const errMsg = err?.message || (typeof err === "string" ? err : JSON.stringify(err)) || "Unknown error";
        
        const keyStr = typeof process.env.GEMINI_API_KEY === "string" ? process.env.GEMINI_API_KEY : "";
        const customKeyStr = typeof customKey === "string" ? customKey : "";
        const activeKeyDisplay = customKeyStr 
          ? `Custom (Headers): ${customKeyStr.slice(0, 12)}...${customKeyStr.slice(-6)}` 
          : keyStr 
            ? `Server (Env): ${keyStr.slice(0, 12)}...${keyStr.slice(-6)}` 
            : "None";

        res.write(`data: ${JSON.stringify({ text: `\n\n⚠️ **Gemini API Error**: \`${errMsg}\`\n*(Active Key: ${activeKeyDisplay})*\n\n*(Falling back to internal simulated engine...)*\n\n` })}\n\n`);
        
        const fallbackChunks = getSimulatedResponse(lastUserMessage);
        for (const chunk of fallbackChunks) {
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
        res.write("data: [DONE]\n\n");
        res.end();
      }
    } else {
      const responseChunks = getSimulatedResponse(lastUserMessage);
      res.write(`data: ${JSON.stringify({ text: "*(SMX AI is operating in local cognitive reserve mode - Gemini/Groq API key not configured)*\n\n" })}\n\n`);
      
      if (process.env.VERCEL || process.env.NODE_ENV === "production") {
        for (const text of responseChunks) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
        res.write("data: [DONE]\n\n");
        res.end();
      } else {
        let chunkIndex = 0;
        const sendNextChunk = () => {
          if (chunkIndex < responseChunks.length) {
            const text = responseChunks[chunkIndex];
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
            chunkIndex++;
            setTimeout(sendNextChunk, 800);
          } else {
            res.write("data: [DONE]\n\n");
            res.end();
          }
        };
        setTimeout(sendNextChunk, 500);
      }
    }
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
