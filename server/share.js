// Short share links, backed by Cloudflare KV. A snippet gets a short random
// id instead of a giant base64 blob stuffed into the URL hash.

const CF_API = "https://api.cloudflare.com/client/v4";
const ALPHABET = "23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O/1/l/I

export function shareEnabled() {
  return !!(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID && process.env.KV_NAMESPACE_ID);
}

function genId(len = 7) {
  let id = "";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < len; i++) id += ALPHABET[bytes[i] % ALPHABET.length];
  return id;
}

function kvUrl(key) {
  const { CLOUDFLARE_ACCOUNT_ID, KV_NAMESPACE_ID } = process.env;
  return `${CF_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`;
}

function authHeaders() {
  return { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` };
}

export async function createShare({ language, code }) {
  const id = genId();
  const res = await fetch(kvUrl(id), {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "text/plain" },
    body: JSON.stringify({ language, code }),
  });
  if (!res.ok) throw new Error(`KV write failed: HTTP ${res.status}`);
  return id;
}

export async function getShare(id) {
  const res = await fetch(kvUrl(id), { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`KV read failed: HTTP ${res.status}`);
  try {
    return JSON.parse(await res.text());
  } catch {
    return null;
  }
}
