// ─────────────────────────────────────────────────────────────────────────────
// Grinding mode — mesin judge.
//
// Idenya: user cuma nulis SATU fungsi, persis kayak LeetCode. Semua urusan
// baca input, panggil fungsi berkali-kali, dan cetak hasil dikerjain harness
// yang di-generate di sini lalu ditempel ke kode user sebelum dikirim ke
// Wandbox. Jadi kompleksitasnya ditanggung kode, bukan user.
//
// Dua encoding dipakai, tergantung bahasanya punya JSON di stdlib atau nggak:
//   · "json"  → stdin = JSON array of arg-arrays, output = JSON array hasil.
//   · "lines" → satu nilai per baris (C++/Java yang nggak punya JSON bawaan).
//
// Perbandingan hasil TIDAK dilakukan di dalam sandbox — program cuma mencetak
// jawabannya, klien yang membandingkan. Jadi kunci jawaban nggak pernah masuk
// ke kode yang dijalankan, dan diff-nya bisa ditampilkan utuh.
// ─────────────────────────────────────────────────────────────────────────────

export const SENTINEL = '__PG__';

const isArr = (t) => t.endsWith('[]');
const elem = (t) => t.slice(0, -2);

// ── encoding stdin ───────────────────────────────────────────────────────────

function encLines(type, v, out) {
  if (isArr(type)) {
    const a = v ?? [];
    out.push(String(a.length));
    for (const x of a) encLines(elem(type), x, out);
  } else if (type === 'bool') out.push(v ? '1' : '0');
  else if (type === 'string') out.push(String(v ?? ''));
  else out.push(String(v));
}

/** @returns {string} isi stdin buat sekumpulan test case */
export function encodeStdin(task, lang, cases) {
  if (LANG[lang].enc === 'json') return JSON.stringify(cases.map((c) => c.in));
  const out = [String(cases.length)];
  for (const c of cases) task.params.forEach((p, i) => encLines(p.type, c.in[i], out));
  return out.join('\n') + '\n';
}

// ── decoding output ──────────────────────────────────────────────────────────

function decLines(type, cur) {
  if (isArr(type)) {
    const n = parseInt(cur.next(), 10);
    const a = [];
    for (let i = 0; i < n; i++) a.push(decLines(elem(type), cur));
    return a;
  }
  const raw = cur.next();
  if (type === 'int') return parseInt(raw, 10);
  if (type === 'float') return parseFloat(raw);
  if (type === 'bool') return raw.trim() === '1' || raw.trim() === 'true';
  return raw;
}

/**
 * Pisahin output program jadi (a) apa pun yang user cetak sendiri dan
 * (b) hasil tiap test case.
 * @returns {{console:string, results:Array<{ok:boolean,v?:any,e?:string}>}|null}
 *          null kalau sentinel nggak ketemu (program mati sebelum selesai).
 */
export function parseOutput(task, lang, raw) {
  const text = String(raw ?? '');
  const lines = text.split('\n');
  let at = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === SENTINEL) { at = i; break; }
  }
  if (at === -1) return null;

  const consoleOut = lines.slice(0, at).join('\n').replace(/\n+$/, '');
  const rest = lines.slice(at + 1);

  if (LANG[lang].enc === 'json') {
    try {
      const arr = JSON.parse(rest.join('\n').trim());
      return { console: consoleOut, results: Array.isArray(arr) ? arr : [] };
    } catch {
      return null;
    }
  }

  let i = 0;
  const cur = { next: () => (i < rest.length ? rest[i++] : '') };
  const results = [];
  try {
    while (i < rest.length) {
      const tag = cur.next().trim();
      if (!tag) break;
      if (tag === 'OK') results.push({ ok: true, v: decLines(task.ret, cur) });
      else if (tag === 'ERR') results.push({ ok: false, e: cur.next() });
      else break;
    }
  } catch {
    /* output kepotong — kembalikan yang sempat kebaca */
  }
  return { console: consoleOut, results };
}

// ── definisi bahasa ──────────────────────────────────────────────────────────
//
// Tiap bahasa: tipe → tipe native, stub yang dilihat user, dan harness yang
// ditempel di belakang kode dia.

const jsonHarnessBody = (callExpr, decl = '') => `${decl}var __cases = JSON.parse(__pgInput);
var __out = [];
for (var __i = 0; __i < __cases.length; __i++) {
  var __a = __cases[__i];
  try { __out.push({ ok: true, v: ${callExpr} }); }
  catch (e) { __out.push({ ok: false, e: String((e && e.message) || e) }); }
}
console.log("\\n${SENTINEL}");
console.log(JSON.stringify(__out));`;

const TS_TYPE = {
  int: 'number', float: 'number', bool: 'boolean', string: 'string',
  'int[]': 'number[]', 'string[]': 'string[]', 'int[][]': 'number[][]', 'string[][]': 'string[][]',
};
const TS_ZERO = {
  int: '0', float: '0', bool: 'false', string: '""',
  'int[]': '[]', 'string[]': '[]', 'int[][]': '[]', 'string[][]': '[]',
};

const GO_TYPE = {
  int: 'int', float: 'float64', bool: 'bool', string: 'string',
  'int[]': '[]int', 'string[]': '[]string', 'int[][]': '[][]int', 'string[][]': '[][]string',
};
const GO_ZERO = {
  int: '0', float: '0', bool: 'false', string: '""',
  'int[]': 'nil', 'string[]': 'nil', 'int[][]': 'nil', 'string[][]': 'nil',
};

const JAVA_TYPE = {
  int: 'int', float: 'double', bool: 'boolean', string: 'String',
  'int[]': 'int[]', 'string[]': 'String[]', 'int[][]': 'int[][]', 'string[][]': 'String[][]',
};
const JAVA_ZERO = {
  int: '0', float: '0', bool: 'false', string: '""',
  'int[]': 'new int[0]', 'string[]': 'new String[0]',
  'int[][]': 'new int[0][]', 'string[][]': 'new String[0][]',
};
const JAVA_READ = {
  int: '__ri()', float: '__rd()', bool: '__rb()', string: '__rs()',
  'int[]': '__ria()', 'string[]': '__rsa()', 'int[][]': '__rim()', 'string[][]': '__rsm()',
};
const JAVA_WRITE = {
  int: '__wi', float: '__wd', bool: '__wb', string: '__ws',
  'int[]': '__wia', 'string[]': '__wsa', 'int[][]': '__wim', 'string[][]': '__wsm',
};

const CPP_TYPE = {
  int: 'long long', float: 'double', bool: 'bool', string: 'string',
  'int[]': 'vector<long long>', 'string[]': 'vector<string>',
  'int[][]': 'vector<vector<long long>>', 'string[][]': 'vector<vector<string>>',
};
const CPP_ZERO = {
  int: '0', float: '0', bool: 'false', string: '""',
  'int[]': '{}', 'string[]': '{}', 'int[][]': '{}', 'string[][]': '{}',
};
const CPP_READ = {
  int: '__ri()', float: '__rd()', bool: '__rb()', string: '__rs()',
  'int[]': '__ria()', 'string[]': '__rsa()', 'int[][]': '__rim()', 'string[][]': '__rsm()',
};
const CPP_WRITE = {
  int: '__wi', float: '__wd', bool: '__wb', string: '__ws',
  'int[]': '__wia', 'string[]': '__wsa', 'int[][]': '__wim', 'string[][]': '__wsm',
};

const PHP_TYPE = {
  int: 'int', float: 'float', bool: 'bool', string: 'string',
  'int[]': 'array', 'string[]': 'array', 'int[][]': 'array', 'string[][]': 'array',
};
const PHP_ZERO = {
  int: '0', float: '0', bool: 'false', string: "''",
  'int[]': '[]', 'string[]': '[]', 'int[][]': '[]', 'string[][]': '[]',
};

// dipakai buat komentar di stub bahasa dinamis (biar user tau bentuk datanya)
const HUMAN_TYPE = {
  int: 'bilangan bulat', float: 'bilangan desimal', bool: 'true/false', string: 'string',
  'int[]': 'array bilangan', 'string[]': 'array string',
  'int[][]': 'array 2D bilangan', 'string[][]': 'array 2D string',
};

const paramDoc = (task) =>
  task.params.map((p) => `//   ${p.name}: ${HUMAN_TYPE[p.type]}`).join('\n');

// ── JAVA harness ─────────────────────────────────────────────────────────────

const JAVA_IO = `    static java.io.BufferedReader __in;
    static String __ln() throws Exception { String s = __in.readLine(); return s == null ? "" : s; }
    static int __ri() throws Exception { return Integer.parseInt(__ln().trim()); }
    static double __rd() throws Exception { return Double.parseDouble(__ln().trim()); }
    static boolean __rb() throws Exception { return __ln().trim().equals("1"); }
    static String __rs() throws Exception { return __ln(); }
    static int[] __ria() throws Exception { int n = __ri(); int[] a = new int[n]; for (int i = 0; i < n; i++) a[i] = __ri(); return a; }
    static String[] __rsa() throws Exception { int n = __ri(); String[] a = new String[n]; for (int i = 0; i < n; i++) a[i] = __rs(); return a; }
    static int[][] __rim() throws Exception { int n = __ri(); int[][] a = new int[n][]; for (int i = 0; i < n; i++) a[i] = __ria(); return a; }
    static String[][] __rsm() throws Exception { int n = __ri(); String[][] a = new String[n][]; for (int i = 0; i < n; i++) a[i] = __rsa(); return a; }
    static void __wi(StringBuilder b, int v) { b.append(v).append('\\n'); }
    static void __wd(StringBuilder b, double v) { b.append(v).append('\\n'); }
    static void __wb(StringBuilder b, boolean v) { b.append(v ? 1 : 0).append('\\n'); }
    static void __ws(StringBuilder b, String v) { b.append(v == null ? "" : v).append('\\n'); }
    static void __wia(StringBuilder b, int[] v) { if (v == null) { b.append(0).append('\\n'); return; } b.append(v.length).append('\\n'); for (int x : v) __wi(b, x); }
    static void __wsa(StringBuilder b, String[] v) { if (v == null) { b.append(0).append('\\n'); return; } b.append(v.length).append('\\n'); for (String x : v) __ws(b, x); }
    static void __wim(StringBuilder b, int[][] v) { if (v == null) { b.append(0).append('\\n'); return; } b.append(v.length).append('\\n'); for (int[] x : v) __wia(b, x); }
    static void __wsm(StringBuilder b, String[][] v) { if (v == null) { b.append(0).append('\\n'); return; } b.append(v.length).append('\\n'); for (String[] x : v) __wsa(b, x); }`;

function javaHarness(task) {
  const reads = task.params
    .map((p, i) => `            ${JAVA_TYPE[p.type]} __a${i} = ${JAVA_READ[p.type]};`)
    .join('\n');
  const args = task.params.map((_, i) => `__a${i}`).join(', ');
  return `class Main {
${JAVA_IO}

    public static void main(String[] __argv) throws Exception {
        __in = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        int __n = __ri();
        StringBuilder __b = new StringBuilder();
        for (int __c = 0; __c < __n; __c++) {
${reads}
            try {
                ${JAVA_TYPE[task.ret]} __r = Solution.${task.fn}(${args});
                __b.append("OK\\n");
                ${JAVA_WRITE[task.ret]}(__b, __r);
            } catch (Throwable __t) {
                __b.append("ERR\\n").append(String.valueOf(__t)).append('\\n');
            }
        }
        System.out.println("\\n${SENTINEL}");
        System.out.print(__b);
    }
}`;
}

// ── C++ harness ──────────────────────────────────────────────────────────────

const CPP_PRELUDE = `#include <bits/stdc++.h>
using namespace std;

`;

const CPP_IO = `static string __ln(){ string s; if(!getline(cin,s)) s=""; if(!s.empty() && s.back()=='\\r') s.pop_back(); return s; }
static long long __ri(){ string s=__ln(); return s.empty()?0LL:stoll(s); }
static double __rd(){ string s=__ln(); return s.empty()?0.0:stod(s); }
static bool __rb(){ return __ln()=="1"; }
static string __rs(){ return __ln(); }
static vector<long long> __ria(){ long long n=__ri(); vector<long long> a; for(long long i=0;i<n;i++) a.push_back(__ri()); return a; }
static vector<string> __rsa(){ long long n=__ri(); vector<string> a; for(long long i=0;i<n;i++) a.push_back(__rs()); return a; }
static vector<vector<long long>> __rim(){ long long n=__ri(); vector<vector<long long>> a; for(long long i=0;i<n;i++) a.push_back(__ria()); return a; }
static vector<vector<string>> __rsm(){ long long n=__ri(); vector<vector<string>> a; for(long long i=0;i<n;i++) a.push_back(__rsa()); return a; }
static void __wi(ostringstream& o, long long v){ o << v << "\\n"; }
static void __wd(ostringstream& o, double v){ ostringstream t; t << setprecision(15) << v; o << t.str() << "\\n"; }
static void __wb(ostringstream& o, bool v){ o << (v?1:0) << "\\n"; }
static void __ws(ostringstream& o, const string& v){ o << v << "\\n"; }
static void __wia(ostringstream& o, const vector<long long>& v){ o << v.size() << "\\n"; for(auto& x: v) __wi(o,x); }
static void __wsa(ostringstream& o, const vector<string>& v){ o << v.size() << "\\n"; for(auto& x: v) __ws(o,x); }
static void __wim(ostringstream& o, const vector<vector<long long>>& v){ o << v.size() << "\\n"; for(auto& x: v) __wia(o,x); }
static void __wsm(ostringstream& o, const vector<vector<string>>& v){ o << v.size() << "\\n"; for(auto& x: v) __wsa(o,x); }`;

function cppHarness(task) {
  const reads = task.params
    .map((p, i) => `        ${CPP_TYPE[p.type]} __a${i} = ${CPP_READ[p.type]};`)
    .join('\n');
  const args = task.params.map((_, i) => `__a${i}`).join(', ');
  return `${CPP_IO}

int main(){
    ios::sync_with_stdio(false);
    long long __n = __ri();
    ostringstream __o;
    for (long long __c = 0; __c < __n; __c++) {
${reads}
        try {
            ${CPP_TYPE[task.ret]} __r = ${task.fn}(${args});
            __o << "OK\\n";
            ${CPP_WRITE[task.ret]}(__o, __r);
        } catch (const std::exception& __e) {
            __o << "ERR\\n" << __e.what() << "\\n";
        } catch (...) {
            __o << "ERR\\n" << "exception" << "\\n";
        }
    }
    cout << "\\n${SENTINEL}" << "\\n" << __o.str();
    cout.flush();
    return 0;
}`;
}

// ── GO harness ───────────────────────────────────────────────────────────────

function goHarness(task) {
  const decls = task.params
    .map(
      (p, i) => `\t\tvar __a${i} ${GO_TYPE[p.type]}
\t\tif len(__args) > ${i} { json.Unmarshal(__args[${i}], &__a${i}) }`
    )
    .join('\n');
  const args = task.params.map((_, i) => `__a${i}`).join(', ');
  return `func __pgCall(f func() interface{}) (v interface{}, e string) {
\tdefer func() {
\t\tif r := recover(); r != nil {
\t\t\te = fmt.Sprint(r)
\t\t\tv = nil
\t\t}
\t}()
\tv = f()
\treturn
}

func main() {
\tvar _, _, _, _ = sort.Ints, strings.TrimSpace, math.Abs, strconv.Itoa
\t__data, _ := io.ReadAll(os.Stdin)
\tvar __cases [][]json.RawMessage
\tif err := json.Unmarshal(__data, &__cases); err != nil {
\t\tpanic(err)
\t}
\t__out := make([]map[string]interface{}, 0, len(__cases))
\tfor _, __args := range __cases {
${decls}
\t\t__v, __e := __pgCall(func() interface{} { return ${task.fn}(${args}) })
\t\tif __e != "" {
\t\t\t__out = append(__out, map[string]interface{}{"ok": false, "e": __e})
\t\t} else {
\t\t\t__out = append(__out, map[string]interface{}{"ok": true, "v": __v})
\t\t}
\t}
\t__b, _ := json.Marshal(__out)
\tfmt.Println("\\n${SENTINEL}")
\tfmt.Println(string(__b))
}`;
}

const GO_PRELUDE = `package main

import (
\t"encoding/json"
\t"fmt"
\t"io"
\t"math"
\t"os"
\t"sort"
\t"strconv"
\t"strings"
)

`;

// ── tabel bahasa ─────────────────────────────────────────────────────────────

export const LANG = {
  JavaScript: {
    label: 'JavaScript',
    monaco: 'javascript',
    enc: 'json',
    stub: (t) => `${paramDoc(t)}
function ${t.fn}(${t.params.map((p) => p.name).join(', ')}) {
  // tulis solusi lo di sini
}`,
    build: (t, code) => `${code}

// ── harness (jangan diubah) ──
const __pgInput = require('fs').readFileSync(0, 'utf8');
${jsonHarnessBody(`${t.fn}.apply(null, __a)`)}`,
  },

  TypeScript: {
    label: 'TypeScript',
    monaco: 'typescript',
    enc: 'json',
    stub: (t) =>
      `function ${t.fn}(${t.params.map((p) => `${p.name}: ${TS_TYPE[p.type]}`).join(', ')}): ${TS_TYPE[t.ret]} {
  // tulis solusi lo di sini
  return ${TS_ZERO[t.ret]};
}`,
    build: (t, code) => `${code}

// ── harness (jangan diubah) ──
// eval langsung (bukan (0,eval)) biar tetap di scope modul CJS — di scope global
// \`require\` nggak ada. Dipakai supaya nggak butuh @types/node cuma buat baca stdin.
const __pgInput: string = eval("require('fs')").readFileSync(0, 'utf8');
${jsonHarnessBody(`(${t.fn} as any).apply(null, __a)`)}`,
  },

  Python: {
    label: 'Python',
    monaco: 'python',
    enc: 'json',
    stub: (t) => `${paramDoc(t).replace(/\/\//g, '#')}
def ${t.fn}(${t.params.map((p) => p.name).join(', ')}):
    # tulis solusi lo di sini
    pass`,
    build: (t, code) => `${code}

# ── harness (jangan diubah) ──
import sys as _pg_sys, json as _pg_json
_pg_sys.setrecursionlimit(30000)

def _pg_run():
    _cases = _pg_json.loads(_pg_sys.stdin.read())
    _out = []
    for _a in _cases:
        try:
            _out.append({"ok": True, "v": ${t.fn}(*_a)})
        except Exception as _e:
            _out.append({"ok": False, "e": "%s: %s" % (type(_e).__name__, _e)})
    print("\\n${SENTINEL}")
    print(_pg_json.dumps(_out))

_pg_run()`,
  },

  Ruby: {
    label: 'Ruby',
    monaco: 'ruby',
    enc: 'json',
    stub: (t) => `${paramDoc(t).replace(/\/\//g, '#')}
def ${t.fn}(${t.params.map((p) => p.name).join(', ')})
  # tulis solusi lo di sini
end`,
    build: (t, code) => `${code}

# ── harness (jangan diubah) ──
require 'json'
__cases = JSON.parse($stdin.read)
__out = __cases.map do |__a|
  begin
    { "ok" => true, "v" => send(:${t.fn}, *__a) }
  rescue => __e
    { "ok" => false, "e" => "#{__e.class}: #{__e.message}" }
  end
end
puts "\\n${SENTINEL}"
puts JSON.generate(__out)`,
  },

  PHP: {
    label: 'PHP',
    monaco: 'php',
    enc: 'json',
    stub: (t) => `<?php
function ${t.fn}(${t.params.map((p) => `${PHP_TYPE[p.type]} $${p.name}`).join(', ')}): ${PHP_TYPE[t.ret]} {
    // tulis solusi lo di sini
    return ${PHP_ZERO[t.ret]};
}`,
    build: (t, code) => `${code}

// ── harness (jangan diubah) ──
$__cases = json_decode(stream_get_contents(STDIN), true);
$__out = [];
foreach ($__cases as $__a) {
    try {
        $__out[] = ["ok" => true, "v" => ${t.fn}(...$__a)];
    } catch (\\Throwable $__e) {
        $__out[] = ["ok" => false, "e" => get_class($__e) . ': ' . $__e->getMessage()];
    }
}
echo "\\n${SENTINEL}\\n";
echo json_encode($__out) . "\\n";`,
  },

  Go: {
    label: 'Go',
    monaco: 'go',
    enc: 'json',
    stub: (t) => `// fmt, sort, strings, math, strconv udah di-import otomatis.
// Butuh paket lain? tulis import-nya di baris paling atas.
func ${t.fn}(${t.params.map((p) => `${p.name} ${GO_TYPE[p.type]}`).join(', ')}) ${GO_TYPE[t.ret]} {
\t// tulis solusi lo di sini
\treturn ${GO_ZERO[t.ret]}
}`,
    build: (t, code) => `${GO_PRELUDE}${code}

// ── harness (jangan diubah) ──
${goHarness(t)}`,
  },

  Java: {
    label: 'Java',
    monaco: 'java',
    enc: 'lines',
    stub: (t) => `import java.util.*;

class Solution {
    static ${JAVA_TYPE[t.ret]} ${t.fn}(${t.params.map((p) => `${JAVA_TYPE[p.type]} ${p.name}`).join(', ')}) {
        // tulis solusi lo di sini
        return ${JAVA_ZERO[t.ret]};
    }
}`,
    build: (t, code) => `${code}

// ── harness (jangan diubah) ──
${javaHarness(t)}`,
  },

  'C++': {
    label: 'C++',
    monaco: 'cpp',
    enc: 'lines',
    stub: (t) => `#include <bits/stdc++.h>
using namespace std;

${CPP_TYPE[t.ret]} ${t.fn}(${t.params.map((p) => `${CPP_TYPE[p.type]} ${p.name}`).join(', ')}) {
    // tulis solusi lo di sini
    return ${CPP_ZERO[t.ret]};
}`,
    build: (t, code) => `${CPP_PRELUDE}${code}

// ── harness (jangan diubah) ──
${cppHarness(t)}`,
  },
};

export const LANG_KEYS = Object.keys(LANG);

/**
 * Berapa baris yang ditempel SEBELUM kode user. Dipakai buat menggeser balik
 * nomor baris di pesan error compiler, biar nunjuk ke baris yang user lihat.
 */
export function preludeLines(lang) {
  const pre = { Go: GO_PRELUDE, 'C++': CPP_PRELUDE }[lang];
  return pre ? pre.split('\n').length - 1 : 0;
}

/** Kode lengkap yang dikirim ke compiler: kode user + harness. */
export function buildProgram(task, lang, userCode) {
  return LANG[lang].build(task, userCode);
}

/** Kode awal yang muncul di editor buat sebuah task. */
export function stubFor(task, lang) {
  return LANG[lang].stub(task) + '\n';
}

// ── perbandingan hasil ───────────────────────────────────────────────────────

const EPS = 1e-6;

/** Bandingin hasil program vs kunci jawaban, toleran soal float & null-vs-[]. */
export function sameValue(a, b, type) {
  if (isArr(type)) {
    const x = a ?? [], y = b ?? [];
    if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length) return false;
    return x.every((v, i) => sameValue(v, y[i], elem(type)));
  }
  if (type === 'float') return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= EPS * Math.max(1, Math.abs(b));
  if (type === 'bool') return !!a === !!b;
  if (type === 'string') return String(a ?? '') === String(b ?? '');
  return Number(a) === Number(b);
}

/**
 * Tampilan nilai buat panel hasil — ringkas, gaya literal kode.
 * Array panjang dipotong: nge-render 20.000 angka nggak nolong siapa pun dan
 * bikin panel hasil nge-lag.
 */
const MAX_SHOWN = 40;
export function fmtValue(v, type) {
  if (v === undefined) return '—';
  if (isArr(type)) {
    if (!Array.isArray(v)) return String(v);
    const head = v.slice(0, MAX_SHOWN).map((x) => fmtValue(x, elem(type)));
    const rest = v.length - MAX_SHOWN;
    return '[' + head.join(', ') + (rest > 0 ? `, … +${rest} lagi` : '') + ']';
  }
  if (type === 'string') return JSON.stringify(String(v ?? ''));
  if (type === 'bool') return v ? 'true' : 'false';
  if (type === 'float') return String(Math.round(Number(v) * 1e6) / 1e6);
  return String(v);
}
