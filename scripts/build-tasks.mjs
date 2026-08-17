// Build data task grinding mode.
//
//   node scripts/build-tasks.mjs
//
// Sumbernya di tasks/*.mjs — di situ tiap soal ditulis lengkap dengan
// reference solution-nya. Script ini:
//   1. validasi bentuk soal (tipe, jumlah argumen, karakter terlarang),
//   2. cek reference solution beneran menghasilkan output contoh yang ditulis
//      di soal — kalau meleset, build gagal,
//   3. cross-check ke brute force kalau soalnya nyediain,
//   4. hitung kunci jawaban semua test case,
//   5. emit ke public/ TANPA solution-nya.
//
// Jadi kunci jawaban nggak pernah diketik manual, dan solusi yang salah
// ketahuan di build, bukan pas user ngerjain.

import { writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import easy from '../tasks/easy.mjs';
import medium from '../tasks/medium.mjs';
import hard from '../tasks/hard.mjs';
import expert from '../tasks/expert.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public', 'tasks');

const LEVELS = [
  { key: 'easy', label: 'Easy', tasks: easy },
  { key: 'medium', label: 'Medium', tasks: medium },
  { key: 'hard', label: 'Hard', tasks: hard },
  { key: 'expert', label: 'Expert', tasks: expert },
];

const TYPES = new Set(['int', 'float', 'bool', 'string', 'int[]', 'string[]', 'int[][]', 'string[][]']);
const IDENT = /^[a-z][A-Za-z0-9]*$/;

const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

/** Cek sebuah nilai beneran sesuai tipe yang dideklarasikan. */
function checkType(where, type, v) {
  if (type.endsWith('[]')) {
    if (!Array.isArray(v)) return fail(where, `harusnya array (${type}), dapat ${typeof v}`);
    v.forEach((x, i) => checkType(`${where}[${i}]`, type.slice(0, -2), x));
    return;
  }
  if (type === 'int') {
    if (!Number.isInteger(v)) return fail(where, `harusnya bilangan bulat, dapat ${JSON.stringify(v)}`);
    if (Math.abs(v) > 9e15) return fail(where, `kegedean buat bilangan bulat: ${v}`);
    return;
  }
  if (type === 'float') {
    if (typeof v !== 'number' || !Number.isFinite(v)) return fail(where, `harusnya bilangan, dapat ${JSON.stringify(v)}`);
    return;
  }
  if (type === 'bool') {
    if (typeof v !== 'boolean') return fail(where, `harusnya true/false, dapat ${JSON.stringify(v)}`);
    return;
  }
  if (type === 'string') {
    if (typeof v !== 'string') return fail(where, `harusnya string, dapat ${JSON.stringify(v)}`);
    // encoding baris-per-nilai (C++/Java) nggak bisa bawa newline di dalam string
    if (/[\n\r]/.test(v)) fail(where, 'string nggak boleh mengandung newline');
    return;
  }
  fail(where, `tipe nggak dikenal: ${type}`);
}

const EPS = 1e-9;
function same(type, a, b) {
  if (type.endsWith('[]')) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((x, i) => same(type.slice(0, -2), x, b[i]));
  }
  if (type === 'float') return Math.abs(a - b) <= EPS * Math.max(1, Math.abs(b));
  if (type === 'bool') return !!a === !!b;
  if (type === 'string') return String(a) === String(b);
  return Number(a) === Number(b);
}

const show = (v) => {
  const s = JSON.stringify(v);
  return s && s.length > 120 ? s.slice(0, 117) + '…' : s;
};

const inputSize = (args) =>
  args.reduce((n, a) => n + (Array.isArray(a) ? a.flat().length : typeof a === 'string' ? a.length : 1), 0);

const ids = new Set();
const index = [];
const files = [];

for (const level of LEVELS) {
  if (level.tasks.length !== 10) fail(level.key, `harusnya 10 task, ada ${level.tasks.length}`);

  level.tasks.forEach((t, order) => {
    const where = `${level.key}/${t.id ?? '(tanpa id)'}`;

    if (!t.id || !/^[a-z0-9-]+$/.test(t.id)) fail(where, 'id harus kebab-case');
    if (ids.has(t.id)) fail(where, 'id kembar');
    ids.add(t.id);

    for (const f of ['title', 'tagline', 'statement', 'fn', 'ret']) {
      if (!t[f]) fail(where, `field "${f}" kosong`);
    }
    if (!IDENT.test(t.fn ?? '')) fail(where, `nama fungsi "${t.fn}" harus camelCase`);
    if (!TYPES.has(t.ret)) fail(where, `tipe return nggak didukung: ${t.ret}`);
    if (!Array.isArray(t.params) || !t.params.length) fail(where, 'params kosong');
    for (const p of t.params ?? []) {
      if (!IDENT.test(p.name)) fail(where, `nama parameter "${p.name}" harus camelCase`);
      if (!TYPES.has(p.type)) fail(where, `tipe parameter nggak didukung: ${p.type}`);
    }
    if (!Array.isArray(t.hints) || t.hints.length < 2) fail(where, 'minimal 2 hint');
    if (!Array.isArray(t.constraints) || !t.constraints.length) fail(where, 'constraints kosong');
    if (!Array.isArray(t.samples) || t.samples.length < 2) fail(where, 'minimal 2 contoh');
    if (typeof t.solution !== 'function') fail(where, 'solution bukan fungsi');
    if (problems.length) return; // jangan lanjut kalau bentuknya udah salah

    // ── contoh: kunci di soal HARUS cocok sama reference solution ──
    const cases = [];
    t.samples.forEach((s, i) => {
      const at = `${where} contoh#${i + 1}`;
      if (s.in.length !== t.params.length) return fail(at, `jumlah argumen ${s.in.length}, harusnya ${t.params.length}`);
      s.in.forEach((v, k) => checkType(`${at} arg ${t.params[k].name}`, t.params[k].type, v));
      checkType(`${at} out`, t.ret, s.out);

      let got;
      try {
        got = t.solution(...structuredClone(s.in));
      } catch (e) {
        return fail(at, `solution error: ${e.message}`);
      }
      if (!same(t.ret, got, s.out)) {
        return fail(at, `solution ngasih ${show(got)}, tapi soal nulis ${show(s.out)}`);
      }
      cases.push({ in: s.in, out: s.out, note: s.note ?? '' });
    });

    // ── test lain: kunci dihitung dari reference solution ──
    (t.tests ?? []).forEach((args, i) => {
      const at = `${where} test#${i + 1}`;
      if (args.length !== t.params.length) return fail(at, `jumlah argumen ${args.length}, harusnya ${t.params.length}`);
      args.forEach((v, k) => checkType(`${at} arg ${t.params[k].name}`, t.params[k].type, v));

      let out;
      try {
        out = t.solution(...structuredClone(args));
      } catch (e) {
        return fail(at, `solution error: ${e.message}`);
      }
      checkType(`${at} hasil solution`, t.ret, out);

      // cross-check ke brute force buat input yang cukup kecil
      if (t.brute && inputSize(args) <= (t.bruteMax ?? 1000)) {
        let bo;
        try {
          bo = t.brute(...structuredClone(args));
        } catch (e) {
          return fail(at, `brute error: ${e.message}`);
        }
        if (!same(t.ret, out, bo)) fail(at, `solution ${show(out)} ≠ brute ${show(bo)} untuk ${show(args)}`);
      }
      cases.push({ in: args, out });
    });

    if (cases.length < 5) fail(where, `cuma ${cases.length} test case, kurang`);

    index.push({
      id: t.id,
      level: level.key,
      order,
      title: t.title,
      tagline: t.tagline,
      fn: t.fn,
      params: t.params,
      ret: t.ret,
      cases: cases.length,
    });

    files.push({
      id: t.id,
      data: {
        id: t.id,
        level: level.key,
        title: t.title,
        tagline: t.tagline,
        statement: t.statement,
        constraints: t.constraints,
        hints: t.hints,
        fn: t.fn,
        params: t.params,
        ret: t.ret,
        sampleCount: t.samples.length,
        cases,
      },
    });
  });
}

if (problems.length) {
  console.error(`Build gagal — ${problems.length} masalah:\n`);
  for (const p of problems) console.error('  · ' + p);
  process.exit(1);
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

let bytes = 0;
for (const f of files) {
  const json = JSON.stringify(f.data);
  bytes += json.length;
  await writeFile(path.join(outDir, `${f.id}.json`), json);
}

const header = `// DIBIKIN OTOMATIS oleh scripts/build-tasks.mjs — jangan diedit tangan.
// Sumber soal: tasks/*.mjs
`;
await writeFile(
  path.join(root, 'public', 'tasks-index.js'),
  `${header}export const LEVELS = ${JSON.stringify(LEVELS.map((l) => ({ key: l.key, label: l.label })))};
export const TASKS = ${JSON.stringify(index, null, 0)};
`
);

const perLevel = LEVELS.map((l) => `${l.label} ${index.filter((t) => t.level === l.key).length}`).join(' · ');
const totalCases = index.reduce((n, t) => n + t.cases, 0);
const fileCount = (await readdir(outDir)).length;
console.log(`✓ ${index.length} task (${perLevel}) · ${totalCases} test case · ${fileCount} file · ${(bytes / 1024).toFixed(0)} KB`);
