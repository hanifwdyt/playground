import "dotenv/config";
import express from "express";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chat, aiEnabled } from "./mentor.js";
import { createShare, getShare, shareEnabled } from "./share.js";

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

  const { language, code, output, task, messages } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "pesan kosong." });
  }

  try {
    const out = await chat({
      language: language ?? "",
      code: code ?? "",
      output: output ?? "",
      task: task && typeof task === "object" ? task : null,
      messages,
    });
    res.json(out);
  } catch (err) {
    console.error("[chat]", err?.message ?? err);
    res.status(502).json({ error: "Gagal menghubungi AI. Coba lagi." });
  }
});

app.post("/api/share", limiter, async (req, res) => {
  if (!shareEnabled()) return res.status(503).json({ error: "Share belum aktif." });

  const { language, code } = req.body ?? {};
  if (typeof code !== "string" || !code.trim()) return res.status(400).json({ error: "code kosong." });
  if (code.length > 200_000) return res.status(413).json({ error: "code kegedean buat di-share." });

  try {
    const id = await createShare({ language: String(language ?? "").slice(0, 40), code });
    res.json({ id });
  } catch (err) {
    console.error("[share]", err?.message ?? err);
    res.status(502).json({ error: "Gagal simpen share." });
  }
});

app.get("/api/share/:id", async (req, res) => {
  if (!/^[A-Za-z0-9]{4,16}$/.test(req.params.id)) return res.status(404).json({ error: "ga ketemu." });
  try {
    const data = await getShare(req.params.id);
    if (!data) return res.status(404).json({ error: "ga ketemu." });
    res.json(data);
  } catch (err) {
    console.error("[share]", err?.message ?? err);
    res.status(502).json({ error: "Gagal ambil share." });
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
// SPA fallback — tapi aset yang beneran nggak ada harus tetap 404, jangan
// dibales index.html (bikin fetch JSON gagal dengan pesan yang menyesatkan).
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/tasks/") || /\.[a-z0-9]+$/i.test(req.path)) {
    return res.status(404).json({ error: "ga ketemu." });
  }
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`playground.hanif.app → http://localhost:${PORT}`);
  console.log(`Diskusi AI: ${aiEnabled() ? "aktif" : "NONAKTIF (API key kosong)"}`);
});
