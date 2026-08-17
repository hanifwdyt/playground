// Smoke test tiap bahasa yang didukung grinding mode: solusi beneran (ditulis
// tangan di tiap bahasa) buat 2 soal — satu balikin int[], satu balikin
// string[][] yang butuh sorting. Yang diuji di sini bukan cuma encoding-nya,
// tapi juga stub-nya beneran bisa dipakai: import bawaan cukup, nama fungsi
// kebaca harness, dan tipe-tipenya masuk akal di bahasa itu.
//
//   node scripts/verify-langs.mjs [Bahasa ...]

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANG_KEYS, buildProgram, encodeStdin, parseOutput, sameValue } from '../public/grind-harness.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const WANDBOX = 'https://wandbox.org/api';

/** solusi[taskId][lang] = kode user (menggantikan isi stub) */
const SOLUSI = {
  'two-sum': {
    JavaScript: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];
    if (!seen.has(nums[i])) seen.set(nums[i], i);
  }
  return [];
}`,
    TypeScript: `function twoSum(nums: number[], target: number): number[] {
  const seen: any = {};
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen[need] !== undefined) return [seen[need], i];
    if (seen[nums[i]] === undefined) seen[nums[i]] = i;
  }
  return [];
}`,
    Python: `def twoSum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        if x not in seen:
            seen[x] = i
    return []`,
    Ruby: `def twoSum(nums, target)
  seen = {}
  nums.each_with_index do |x, i|
    return [seen[target - x], i] if seen.key?(target - x)
    seen[x] = i unless seen.key?(x)
  end
  []
end`,
    PHP: `<?php
function twoSum(array $nums, int $target): array {
    $seen = [];
    foreach ($nums as $i => $x) {
        if (isset($seen[$target - $x])) return [$seen[$target - $x], $i];
        if (!isset($seen[$x])) $seen[$x] = $i;
    }
    return [];
}`,
    Go: `func twoSum(nums []int, target int) []int {
	seen := map[int]int{}
	for i, x := range nums {
		if j, ok := seen[target-x]; ok {
			return []int{j, i}
		}
		if _, ok := seen[x]; !ok {
			seen[x] = i
		}
	}
	return []int{}
}`,
    Java: `import java.util.*;

class Solution {
    static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            if (seen.containsKey(target - nums[i])) return new int[]{seen.get(target - nums[i]), i};
            seen.putIfAbsent(nums[i], i);
        }
        return new int[0];
    }
}`,
    'C++': `vector<long long> twoSum(vector<long long> nums, long long target) {
    unordered_map<long long, long long> seen;
    for (long long i = 0; i < (long long)nums.size(); i++) {
        auto it = seen.find(target - nums[i]);
        if (it != seen.end()) return {it->second, i};
        if (!seen.count(nums[i])) seen[nums[i]] = i;
    }
    return {};
}`,
  },

  'kelompok-anagram': {
    JavaScript: `function groupAnagrams(kata) {
  const g = new Map();
  for (const w of kata) {
    const k = [...w].sort().join('');
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(w);
  }
  return [...g.values()].map(v => v.sort()).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}`,
    TypeScript: `function groupAnagrams(kata: string[]): string[][] {
  const g: any = {};
  for (const w of kata) {
    const k = w.split('').sort().join('');
    (g[k] = g[k] || []).push(w);
  }
  return Object.keys(g).map(k => g[k].sort()).sort((a: any, b: any) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}`,
    Python: `def groupAnagrams(kata):
    g = {}
    for w in kata:
        g.setdefault(''.join(sorted(w)), []).append(w)
    return sorted([sorted(v) for v in g.values()], key=lambda v: v[0])`,
    Ruby: `def groupAnagrams(kata)
  g = Hash.new { |h, k| h[k] = [] }
  kata.each { |w| g[w.chars.sort.join] << w }
  g.values.map(&:sort).sort_by { |v| v[0] }
end`,
    PHP: `<?php
function groupAnagrams(array $kata): array {
    $g = [];
    foreach ($kata as $w) {
        $c = str_split($w ?: ' ');
        sort($c);
        $g[implode('', $w === '' ? [] : $c)][] = $w;
    }
    $out = [];
    foreach ($g as $v) { sort($v); $out[] = $v; }
    usort($out, fn($a, $b) => strcmp($a[0], $b[0]));
    return $out;
}`,
    Go: `func groupAnagrams(kata []string) [][]string {
	g := map[string][]string{}
	for _, w := range kata {
		c := strings.Split(w, "")
		sort.Strings(c)
		k := strings.Join(c, "")
		g[k] = append(g[k], w)
	}
	out := [][]string{}
	for _, v := range g {
		sort.Strings(v)
		out = append(out, v)
	}
	sort.Slice(out, func(i, j int) bool { return out[i][0] < out[j][0] })
	return out
}`,
    Java: `import java.util.*;

class Solution {
    static String[][] groupAnagrams(String[] kata) {
        Map<String, List<String>> g = new HashMap<>();
        for (String w : kata) {
            char[] c = w.toCharArray();
            Arrays.sort(c);
            g.computeIfAbsent(new String(c), k -> new ArrayList<>()).add(w);
        }
        List<List<String>> out = new ArrayList<>(g.values());
        for (List<String> v : out) Collections.sort(v);
        out.sort((a, b) -> a.get(0).compareTo(b.get(0)));
        String[][] res = new String[out.size()][];
        for (int i = 0; i < out.size(); i++) res[i] = out.get(i).toArray(new String[0]);
        return res;
    }
}`,
    'C++': `vector<vector<string>> groupAnagrams(vector<string> kata) {
    map<string, vector<string>> g;
    for (auto& w : kata) { string k = w; sort(k.begin(), k.end()); g[k].push_back(w); }
    vector<vector<string>> out;
    for (auto& kv : g) { auto v = kv.second; sort(v.begin(), v.end()); out.push_back(v); }
    sort(out.begin(), out.end(), [](const vector<string>& a, const vector<string>& b){ return a[0] < b[0]; });
    return out;
}`,
  },
};

const list = await (await fetch(`${WANDBOX}/list.json`)).json();
const compilerOf = {};
for (const c of list) if (!compilerOf[c.language] && !/head/i.test(c.name)) compilerOf[c.language] = c.name;

async function loadTask(id) {
  return JSON.parse(await readFile(path.join(root, 'public', 'tasks', `${id}.json`), 'utf8'));
}

async function run(taskId, lang) {
  const task = await loadTask(taskId);
  const code = SOLUSI[taskId][lang];
  const program = buildProgram(task, lang, code);
  const stdin = encodeStdin(task, lang, task.cases);
  const res = await fetch(`${WANDBOX}/compile.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ compiler: compilerOf[lang], code: program, stdin }),
  });
  if (!res.ok) return { ok: false, why: `HTTP ${res.status}` };
  const d = await res.json();
  const parsed = parseOutput(task, lang, d.program_output || '');
  if (!parsed) {
    return { ok: false, why: 'nggak ada hasil', detail: [d.compiler_error, d.program_error].filter(Boolean).join('\n').slice(0, 500) };
  }
  const bad = [];
  task.cases.forEach((c, i) => {
    const r = parsed.results[i];
    if (!r) return bad.push(`case ${i + 1} nggak jalan`);
    if (!r.ok) return bad.push(`case ${i + 1}: ${r.e}`);
    if (!sameValue(r.v, c.out, task.ret)) bad.push(`case ${i + 1} beda: ${JSON.stringify(r.v).slice(0, 90)} vs ${JSON.stringify(c.out).slice(0, 90)}`);
  });
  return bad.length ? { ok: false, why: `${bad.length}/${task.cases.length} gagal`, detail: bad.slice(0, 3).join('\n') } : { ok: true, n: task.cases.length };
}

const only = process.argv.slice(2);
const langs = (only.length ? only : LANG_KEYS).filter((l) => SOLUSI['two-sum'][l]);

let fail = 0;
const jobs = [];
for (const taskId of Object.keys(SOLUSI)) for (const lang of langs) jobs.push({ taskId, lang });

const out = [];
let at = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (at < jobs.length) {
      const i = at++;
      out[i] = await run(jobs[i].taskId, jobs[i].lang).catch((e) => ({ ok: false, why: String(e.message || e) }));
    }
  })
);

out.forEach((r, i) => {
  const { taskId, lang } = jobs[i];
  console.log(`${r.ok ? '✓' : '✗'} ${lang.padEnd(12)} ${taskId.padEnd(18)} ${r.ok ? `${r.n} case` : r.why}`);
  if (!r.ok) {
    fail++;
    if (r.detail) console.log(r.detail.split('\n').map((l) => '     ' + l).join('\n'));
  }
});
console.log(fail ? `\n${fail} gagal` : `\n${jobs.length} kombinasi bahasa×soal lolos`);
process.exit(fail ? 1 : 0);
