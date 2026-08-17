# playground.hanif.app

Code runner online (35+ bahasa lewat Wandbox) + **Grinding mode**: 40 soal ala
LeetCode dengan judge otomatis di 8 bahasa.

```
npm install
npm run dev          # bikin soal + jalanin server di :3000
```

## Isi

```
public/index.html        playground: editor Monaco, Run, share link, Diskusi (AI)
public/grind.js          UI grinding mode
public/grind.css         style grinding mode (nempel ke token "Minimal Mono")
public/grind-harness.js  mesin judge: codegen stub + harness per bahasa
tasks/*.mjs              SUMBER soal (statement + test + reference solution)
scripts/build-tasks.mjs  validasi soal → generate public/tasks/*.json
scripts/verify-*.mjs     verifikasi ke Wandbox beneran
server/                  Express: proxy AI mentor + short link share
```

`public/tasks/` dan `public/tasks-index.js` **di-generate** (nggak masuk git,
dibikin ulang pas build image).

## Cara kerja judge

User cuma nulis satu fungsi. Sisanya kode yang nanggung:

1. `stubFor(task, lang)` bikin kerangka fungsi sesuai tipe soal di bahasa itu.
2. Pas Run, `buildProgram()` nempelin **harness** di belakang kode user —
   harness yang baca stdin, manggil fungsinya sekali per test case, dan mencetak
   hasilnya setelah baris penanda `__PG__`.
3. Semua test case dikirim sekaligus dalam **satu** eksekusi (satu round-trip).
4. Kunci jawaban **nggak pernah masuk ke sandbox**. Program cuma mencetak
   jawabannya; browser yang membandingkan. Jadi diff-nya bisa ditampilkan utuh.

Dua encoding, tergantung bahasanya punya JSON di stdlib atau nggak:

| encoding | bahasa                                        |
| -------- | --------------------------------------------- |
| `json`   | JavaScript, TypeScript, Python, Ruby, PHP, Go |
| `lines`  | Java, C++ (satu nilai per baris)              |

Tipe yang didukung: `int`, `float`, `bool`, `string`, `int[]`, `string[]`,
`int[][]`, `string[][]`.

## Nambah soal

Tambahin objek di `tasks/easy|medium|hard|expert.mjs`:

```js
{
  id: 'kebab-case',
  title, tagline, statement,        // statement: markdown ringan (**tebal**, `kode`, "- " list)
  constraints: ['…'], hints: ['…', '…'],
  fn: 'namaFungsi',
  params: [{ name: 'nums', type: 'int[]' }],
  ret: 'int',
  samples: [{ in: [[1,2]], out: 3, note: 'kenapa' }],   // minimal 2, ditampilkan di soal
  tests:   [[[4,5]], [[]]],                             // kunci dihitung otomatis
  solution: (nums) => …,                                // reference, nggak ikut ke browser
  brute: (nums) => …, bruteMax: 3000,                   // opsional: cross-check
}
```

Lalu `npm run build:tasks`. Build **gagal** kalau `out` di contoh nggak cocok
sama `solution`, tipe nilainya meleset, string-nya mengandung newline (encoding
`lines` nggak bisa bawa itu), atau brute force nggak sepakat sama solution.
Jadi kunci jawaban nggak pernah diketik tangan.

## Verifikasi

Semuanya nembak Wandbox beneran, jadi butuh internet:

```
npm run verify:harness     # 8 bahasa × 8 tipe return, uji fungsi identitas
npm run verify:tasks       # 40 soal end-to-end pakai reference solution
npm run verify:langs       # solusi tulis tangan di 8 bahasa, 2 soal
```

## Deploy

Coolify, build pack **dockerfile**, port 80. Soal di-generate pas image build —
kalau ada soal yang salah, image-nya nggak jadi.
