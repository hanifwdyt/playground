// Verifikasi harness judge: buat tiap bahasa × tiap tipe return, jalanin fungsi
// identitas (return salah satu parameter) lewat Wandbox beneran, lalu cek hasil
// yang balik SAMA PERSIS sama input. Ini yang mastiin encode/decode tiap tipe
// nggak meleset di bahasa mana pun.
//
//   node scripts/verify-harness.mjs            # semua bahasa
//   node scripts/verify-harness.mjs Go Java    # bahasa tertentu

import { LANG, LANG_KEYS, buildProgram, encodeStdin, parseOutput, sameValue, stubFor, fmtValue } from '../public/grind-harness.js';

const WANDBOX = 'https://wandbox.org/api';

const PARAMS = [
  { name: 'pInt', type: 'int' },
  { name: 'pFloat', type: 'float' },
  { name: 'pBool', type: 'bool' },
  { name: 'pStr', type: 'string' },
  { name: 'pIntArr', type: 'int[]' },
  { name: 'pStrArr', type: 'string[]' },
  { name: 'pIntMat', type: 'int[][]' },
  { name: 'pStrMat', type: 'string[][]' },
];

const CASES = [
  [7, 3.5, true, 'halo dunia', [1, 2, 3], ['a', 'bb'], [[1, 2], [3]], [['x'], ['y', 'z']]],
  [-42, -0.125, false, '', [], [], [], []],
  [0, 1234.56789, true, 'spasi  ganda & simbol #$%', [-5, 0, 999999], ['', 'kosong di depan'], [[], [7, 8, 9]], [[''], []]],
];

async function compilers() {
  const list = await (await fetch(`${WANDBOX}/list.json`)).json();
  const by = {};
  for (const c of list) {
    if (!by[c.language] && !/head/i.test(c.name)) by[c.language] = c.name;
  }
  return by;
}

function taskFor(ret) {
  return { id: 'probe', fn: 'probe', params: PARAMS, ret, compare: 'exact' };
}

/** Ganti badan stub jadi "return <param>" — dipakai buat uji identitas. */
function identitySolution(task, lang, paramName) {
  const stub = stubFor(task, lang);
  const stmt =
    lang === 'PHP' ? `return $${paramName};`
    : lang === 'Ruby' ? paramName
    : lang === 'Go' ? `return ${paramName}`
    : lang === 'Python' ? `return ${paramName}`
    : `return ${paramName};`;

  return stub
    .split('\n')
    .filter((l) => !/^\s*(return .*|pass)\s*$/.test(l))
    .map((l) => (/tulis solusi lo di sini/.test(l) ? l.replace(/(#|\/\/).*$/, stmt) : l))
    .join('\n');
}

async function runOne(lang, compiler, ret) {
  const task = taskFor(ret);
  const idx = PARAMS.findIndex((p) => p.type === ret);
  const code = identitySolution(task, lang, PARAMS[idx].name);
  const program = buildProgram(task, lang, code);
  const cases = CASES.map((c) => ({ in: c }));
  const stdin = encodeStdin(task, lang, cases);

  const res = await fetch(`${WANDBOX}/compile.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ compiler, code: program, stdin }),
  });
  if (!res.ok) return { ok: false, why: `HTTP ${res.status}` };
  const d = await res.json();

  const parsed = parseOutput(task, lang, d.program_output || '');
  if (!parsed) {
    return {
      ok: false,
      why: 'sentinel nggak ketemu',
      detail: [d.compiler_error, d.program_error, d.program_output].filter(Boolean).join('\n').slice(0, 600),
    };
  }
  if (parsed.results.length !== cases.length) {
    return { ok: false, why: `hasil ${parsed.results.length}/${cases.length}`, detail: JSON.stringify(parsed.results).slice(0, 400) };
  }
  for (let i = 0; i < cases.length; i++) {
    const r = parsed.results[i];
    if (!r.ok) return { ok: false, why: `case ${i} error: ${r.e}` };
    if (!sameValue(r.v, CASES[i][idx], ret)) {
      return { ok: false, why: `case ${i} beda`, detail: `got ${fmtValue(r.v, ret)}\nwant ${fmtValue(CASES[i][idx], ret)}` };
    }
  }
  return { ok: true };
}

async function pool(jobs, size = 4) {
  const out = [];
  let at = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (at < jobs.length) {
        const i = at++;
        out[i] = await jobs[i]();
      }
    })
  );
  return out;
}

const only = process.argv.slice(2);
const langs = only.length ? only : LANG_KEYS;
const comp = await compilers();
const RETS = [...new Set(PARAMS.map((p) => p.type))];

let fail = 0;
for (const lang of langs) {
  if (!LANG[lang]) { console.log(`? ${lang}: bahasa nggak dikenal`); fail++; continue; }
  const compiler = comp[lang];
  if (!compiler) { console.log(`? ${lang}: compiler nggak ada di Wandbox`); fail++; continue; }

  const results = await pool(RETS.map((ret) => () => runOne(lang, compiler, ret).catch((e) => ({ ok: false, why: String(e.message || e) }))));
  const bad = results.map((r, i) => [RETS[i], r]).filter(([, r]) => !r.ok);
  const mark = bad.length ? '✗' : '✓';
  console.log(`${mark} ${lang.padEnd(12)} ${compiler.padEnd(22)} ${results.length - bad.length}/${results.length} tipe return`);
  for (const [ret, r] of bad) {
    fail++;
    console.log(`    · ${ret}: ${r.why}`);
    if (r.detail) console.log(r.detail.split('\n').map((l) => '      ' + l).join('\n'));
  }
}

console.log(fail ? `\n${fail} gagal` : '\nsemua harness lolos');
process.exit(fail ? 1 : 0);
