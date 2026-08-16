// ─────────────────────────────────────────────────────────────────────────────
// The mentor — a coding FRIEND to talk to while you're stuck, not an answer
// machine. The whole point of a playground is that YOU write the code. So the
// rule below is not a style choice, it's the product: the mentor is not
// allowed to hand over a fix or a copy-pasteable solution to what's on screen.
// It reads the editor to know what you're working on, then teaches the
// underlying idea through a DIFFERENT example — so you still have to do the
// work of connecting it back to your own code.
// ─────────────────────────────────────────────────────────────────────────────

import OpenAI from "openai";

const PROVIDERS = [
  { envKey: "DEEPSEEK_API_KEY", baseURL: "https://api.deepseek.com", model: "deepseek-v4-flash" },
  {
    envKey: "OPENROUTER_API_KEY",
    baseURL: "https://openrouter.ai/api/v1",
    model: "anthropic/claude-sonnet-4.5",
  },
];

const activeProvider = () => PROVIDERS.find((p) => !!process.env[p.envKey]) ?? null;
export const aiEnabled = () => activeProvider() !== null;

let client = null;
let clientFor = null;
function getClient() {
  const p = activeProvider();
  if (!p) throw new Error("no provider");
  if (!client || clientFor !== p.envKey) {
    client = new OpenAI({ baseURL: p.baseURL, apiKey: process.env[p.envKey] });
    clientFor = p.envKey;
  }
  return { client, model: p.model };
}

/**
 * Rules that hold no matter what's asked. Appended last so they always have
 * the final word.
 */
const NON_NEGOTIABLE = `
ATURAN YANG TIDAK BOLEH DILANGGAR:
- JANGAN PERNAH nulis ulang / benerin / lengkapin kode dia jadi versi siap-tempel. Kalau dia minta "benerin dong" atau "kasih kodenya", tolak halus — jelasin konsepnya, tunjuk baris/pattern yang mencurigakan, tapi biar DIA yang ngetik fix-nya sendiri.
- Kalau kamu kasih contoh kode, itu HARUS kasus & variabel yang beda total dari kode dia — domain lain, nama beda, skenario beda. Jangan pernah nulis ulang struktur baris-demi-baris dari kode dia sendiri, walau cuma buat "ilustrasi".
- Jangan langsung solve masalah dia. Kalau dia stuck di error/bug, bantu dia sendiri yang nemuin — arahin ke bagian yang perlu dicek, atau lempar 1 pertanyaan balik dulu.
- Jawaban pendek: 3-6 kalimat, boleh + 1 snippet kecil ilustratif (bukan solusi). Ini obrolan santai, bukan tutorial atau dokumentasi.
- Bahasa Indonesia santai kayak sesama programmer ngobrol, boleh selingan istilah teknis Inggris yang natural. Jangan menggurui, jangan bullet-point panjang.
- Kalau ditanya "kamu AI bukan", jawab jujur.
- Kalau pertanyaannya di luar topik ngoding sama sekali, jawab santai tapi arahin balik pelan-pelan.
`;

function buildSystem({ language, code, output }) {
  const lang = (language || "belum dipilih").slice(0, 40);
  const codeSnippet = String(code || "").slice(0, 4000);
  const outSnippet = String(output || "").slice(0, 1200);

  return [
    `Kamu teman ngobrol di code playground online. Orang di depan kamu lagi nulis & nyoba-nyoba kode sendiri buat belajar.`,
    ``,
    `PERAN KAMU: teman diskusi, BUKAN pemberi jawaban. Contoh: kalau dia nanya "gimana cara loop di ${lang}?", jangan jelasin pakai loop yang mungkin udah ada di kode dia — kasih 1 contoh loop kecil dengan kasus lain sama sekali (misal dia lagi bikin fibonacci, kamu contohin looping buat cetak nama hari, bukan fibonacci lagi). Biar dia yang connect dots-nya sendiri ke kode dia.`,
    ``,
    `KONTEKS — bahasa yang lagi dipakai: ${lang}.`,
    codeSnippet ? `Isi editor dia SEKARANG (baca buat ngerti dia lagi di mana, JANGAN ditulis ulang / dikoreksi / dijadiin contoh):\n\`\`\`\n${codeSnippet}\n\`\`\`` : `Editor dia masih kosong / belum ditulis.`,
    outSnippet ? `Output/error terakhir dari Run:\n\`\`\`\n${outSnippet}\n\`\`\`` : ``,
    NON_NEGOTIABLE,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * @param {object} args
 * @param {string} args.language
 * @param {string} args.code
 * @param {string} [args.output]
 * @param {{role:"user"|"assistant",content:string}[]} args.messages
 */
export async function chat({ language, code, output, messages }) {
  const { client: llm, model } = getClient();

  const res = await llm.chat.completions.create({
    model,
    temperature: 0.7,
    // deepseek-v4-flash is a reasoning model — reasoning_content eats into max_tokens
    // before the final `content` is written, so this needs real headroom or long
    // system-prompt reasoning eats the whole budget and content comes back empty.
    max_tokens: 1500,
    messages: [
      { role: "system", content: buildSystem({ language, code, output }) },
      ...messages.slice(-12).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content).slice(0, 2000),
      })),
    ],
  });

  const content = res.choices?.[0]?.message?.content?.trim();
  if (!content) console.error("[mentor] empty content, raw response:", JSON.stringify(res).slice(0, 2000));

  return { message: content || "Waduh, lagi ga bisa mikir jernih. Coba lagi?" };
}
