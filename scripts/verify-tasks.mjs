// Verifikasi end-to-end tiap soal: reference solution-nya dikirim beneran ke
// Wandbox lewat pipeline yang sama persis kayak yang dipakai user (stub →
// harness → stdin → parse → banding), lalu dicek semua test case-nya lulus.
//
// Ini yang nangkep masalah yang nggak keliatan di build: stdin kegedean, soal
// yang kelewat berat sampai kena batas waktu, sama hasil yang beda gara-gara
// encoding.
//
//   node scripts/verify-tasks.mjs               # semua soal, JavaScript
//   node scripts/verify-tasks.mjs two-sum       # satu soal
//   node scripts/verify-tasks.mjs --lang=Python two-sum

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import easy from '../tasks/easy.mjs';
import medium from '../tasks/medium.mjs';
import hard from '../tasks/hard.mjs';
import expert from '../tasks/expert.mjs';
import { buildProgram, encodeStdin, parseOutput, sameValue, fmtValue } from '../public/grind-harness.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const WANDBOX = 'https://wandbox.org/api';

const SRC = [...easy, ...medium, ...hard, ...expert];

const args = process.argv.slice(2);
const langArg = args.find((a) => a.startsWith('--lang='));
const lang = langArg ? langArg.slice(7) : 'JavaScript';
const wanted = args.filter((a) => !a.startsWith('--'));

if (lang !== 'JavaScript') {
  console.error('Script ini cuma bisa pakai reference solution JavaScript.');
  process.exit(1);
}

const list = await (await fetch(`${WANDBOX}/list.json`)).json();
const compiler = list.find((c) => c.language === lang && !/head/i.test(c.name))?.name;
if (!compiler) throw new Error(`compiler ${lang} nggak ketemu`);

async function loadTask(id) {
  return JSON.parse(await readFile(path.join(root, 'public', 'tasks', `${id}.json`), 'utf8'));
}

async function check(src) {
  const task = await loadTask(src.id);
  // reference solution dijadiin kode user, diikat ke nama fungsi yang diminta soal
  const code = `const ${task.fn} = ${src.solution.toString()};`;
  const program = buildProgram(task, lang, code);
  const stdin = encodeStdin(task, lang, task.cases);

  const t0 = Date.now();
  const res = await fetch(`${WANDBOX}/compile.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ compiler, code: program, stdin }),
  });
  const ms = Date.now() - t0;
  if (!res.ok) return { ok: false, why: `HTTP ${res.status}`, ms, stdin: stdin.length };
  const d = await res.json();

  const parsed = parseOutput(task, lang, d.program_output || '');
  if (!parsed) {
    return {
      ok: false,
      why: 'nggak ada hasil',
      ms,
      stdin: stdin.length,
      detail: [d.compiler_error, d.program_error].filter(Boolean).join('\n').slice(0, 400),
    };
  }
  if (parsed.results.length !== task.cases.length) {
    return { ok: false, why: `hasil ${parsed.results.length}/${task.cases.length}`, ms, stdin: stdin.length };
  }
  for (let i = 0; i < task.cases.length; i++) {
    const r = parsed.results[i];
    if (!r.ok) return { ok: false, why: `case ${i + 1} error: ${r.e}`, ms, stdin: stdin.length };
    if (!sameValue(r.v, task.cases[i].out, task.ret)) {
      return {
        ok: false,
        why: `case ${i + 1} beda`,
        ms,
        stdin: stdin.length,
        detail: `dapat ${fmtValue(r.v, task.ret).slice(0, 160)}\nkunci ${fmtValue(task.cases[i].out, task.ret).slice(0, 160)}`,
      };
    }
  }
  return { ok: true, ms, stdin: stdin.length, cases: task.cases.length };
}

const targets = wanted.length ? SRC.filter((t) => wanted.includes(t.id)) : SRC;
if (!targets.length) {
  console.error('Soal nggak ketemu:', wanted.join(', '));
  process.exit(1);
}

let fail = 0;
let at = 0;
const results = [];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (at < targets.length) {
      const i = at++;
      results[i] = await check(targets[i]).catch((e) => ({ ok: false, why: String(e.message || e) }));
    }
  })
);

results.forEach((r, i) => {
  const t = targets[i];
  const kb = r.stdin ? `${(r.stdin / 1024).toFixed(0)}KB` : '';
  console.log(`${r.ok ? '✓' : '✗'} ${t.id.padEnd(22)} ${String(r.ms ?? '?').padStart(6)}ms ${kb.padStart(7)} ${r.ok ? `${r.cases} case` : r.why}`);
  if (!r.ok) {
    fail++;
    if (r.detail) console.log(r.detail.split('\n').map((l) => '     ' + l).join('\n'));
  }
});

console.log(fail ? `\n${fail}/${targets.length} gagal` : `\n${targets.length} soal lolos end-to-end`);
process.exit(fail ? 1 : 0);
