import "dotenv/config";
import express from "express";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chat, aiEnabled } from "./mentor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 80;

app.use(compression());
app.use(express.json({ limit: "128kb" }));
app.disable("x-powered-by");

const limiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });

app.get("/api/ai/status", (_req, res) => res.json({ enabled: aiEnabled() }));

app.post("/api/chat", limiter, async (req, res) => {
  if (!aiEnabled()) return res.status(503).json({ error: "Diskusi belum diaktifkan." });

  const { language, code, output, messages } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "pesan kosong." });
  }

  try {
    const out = await chat({
      language: language ?? "",
      code: code ?? "",
      output: output ?? "",
      messages,
    });
    res.json(out);
  } catch (err) {
    console.error("[chat]", err?.message ?? err);
    res.status(502).json({ error: "Gagal menghubungi AI. Coba lagi." });
  }
});

// ── static site ──────────────────────────────────────────────────────────────
const publicDir = path.join(__dirname, "..", "public");
app.use(
  express.static(publicDir, {
    setHeaders: (res, p) => {
      if (p.endsWith("index.html")) res.setHeader("Cache-Control", "no-cache");
    },
  })
);
app.get("*", (_req, res) => res.sendFile(path.join(publicDir, "index.html")));

app.listen(PORT, () => {
  console.log(`playground.hanif.app → http://localhost:${PORT}`);
  console.log(`Diskusi AI: ${aiEnabled() ? "aktif" : "NONAKTIF (API key kosong)"}`);
});
