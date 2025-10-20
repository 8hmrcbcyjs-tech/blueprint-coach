import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// serve the static index.html
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname)); // serves index.html by default

// simple healthcheck
app.get("/healthz", (_, res) => res.status(200).send("ok"));

// AI coach endpoint
app.post("/coach", async (req, res) => {
  try {
    const { message, metrics = {} } = req.body;

    const systemPrompt = `
You are BLUEPRINT, a concise performance coach for men.
Tone: direct, supportive, minimalist. No medical advice.
Return up to 3 actions with a short why and the metric that triggered it.
Context metrics (JSON): ${JSON.stringify(metrics)}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // economical + fast; upgrade later if you like
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.5
    });

    const reply = completion.choices?.[0]?.message?.content ?? "No reply.";
    res.json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Coach error" });
  }
});

// Render injects PORT env; default to 3000 locally
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server listening on ${PORT}`));
