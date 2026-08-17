// Level Medium — hash map, dua penunjuk, stack, sorting, greedy, binary search.

export default [
  {
    id: 'substring-unik',
    title: 'Substring Terpanjang Tanpa Ulang',
    tagline: 'Jendela yang melar dan menyusut',
    statement: `Cari panjang **substring terpanjang** di \`s\` yang semua karakternya berbeda.

Substring artinya potongan berurutan — bukan subsequence yang boleh loncat-loncat.`,
    constraints: ['0 ≤ panjang s ≤ 50.000', 's berisi huruf, angka, dan simbol ASCII'],
    hints: [
      'Bayangin jendela yang bergeser. Ujung kanan maju terus; kalau ketemu karakter yang sudah ada di dalam jendela, ujung kirinya yang harus geser.',
      'Simpan posisi terakhir tiap karakter. Saat ketemu duplikat, kiri langsung lompat ke posisi setelah kemunculan sebelumnya — nggak perlu geser satu-satu.',
    ],
    fn: 'longestUnique',
    params: [{ name: 's', type: 'string' }],
    ret: 'int',
    samples: [
      { in: ['abcabcbb'], out: 3, note: '"abc" panjangnya 3' },
      { in: ['bbbbb'], out: 1, note: 'Cuma satu karakter yang bisa masuk jendela' },
      { in: ['pwwkew'], out: 3, note: '"wke" — "pwke" nggak valid karena bukan potongan berurutan' },
    ],
    tests: [
      [''],
      ['a'],
      ['au'],
      ['dvdf'],
      ['abcdefghijklmnopqrstuvwxyz'],
      ['tmmzuxt'],
      ['ngoding itu seru'],
      ['ab'.repeat(5000)],
    ],
    solution: (s) => {
      const last = new Map();
      let best = 0, left = 0;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (last.has(ch) && last.get(ch) >= left) left = last.get(ch) + 1;
        last.set(ch, i);
        best = Math.max(best, i - left + 1);
      }
      return best;
    },
  },

  {
    id: 'kurung-seimbang',
    title: 'Kurung Seimbang',
    tagline: 'Tiap yang dibuka harus ditutup — urutannya benar',
    statement: `String \`s\` cuma berisi karakter \`(\`, \`)\`, \`[\`, \`]\`, \`{\`, \`}\`.

Kembalikan \`true\` kalau semua kurung tertutup dengan benar: tiap kurung buka ditutup oleh pasangan yang sejenis, dan urutannya nggak saling menyilang.`,
    constraints: ['0 ≤ panjang s ≤ 50.000', 'Hanya berisi enam karakter kurung di atas'],
    hints: [
      'Yang terakhir dibuka harus yang pertama ditutup. Struktur data apa yang perilakunya persis begitu?',
      'Dorong tiap kurung buka ke stack. Ketemu kurung tutup, ambil yang paling atas dan cek jenisnya cocok. Di akhir stack harus kosong.',
    ],
    fn: 'isBalanced',
    params: [{ name: 's', type: 'string' }],
    ret: 'bool',
    samples: [
      { in: ['()[]{}'], out: true, note: 'Tiga pasangan berurutan' },
      { in: ['([)]'], out: false, note: 'Menyilang — bukan bersarang' },
      { in: ['{[()]}'], out: true, note: 'Bersarang rapi' },
    ],
    tests: [
      [''],
      ['('],
      [')'],
      ['(('],
      ['(]'],
      ['{[]}()'],
      ['(((((((((())))))))))'],
      ['('.repeat(10000) + ')'.repeat(10000)],
      ['()'.repeat(9999) + '('],
    ],
    solution: (s) => {
      const pair = { ')': '(', ']': '[', '}': '{' };
      const st = [];
      for (const ch of s) {
        if (ch === '(' || ch === '[' || ch === '{') st.push(ch);
        else if (st.pop() !== pair[ch]) return false;
      }
      return st.length === 0;
    },
  },

  {
    id: 'untung-maksimal',
    title: 'Untung Maksimal',
    tagline: 'Beli sekali, jual sekali',
    statement: `\`harga[i]\` adalah harga sebuah saham di hari ke-\`i\`.

Kamu boleh **beli satu kali** lalu **jual satu kali** di hari sesudahnya. Kembalikan untung terbesar yang bisa didapat.

Kalau nggak ada cara untuk untung, kembalikan \`0\`.`,
    constraints: ['0 ≤ panjang harga ≤ 100.000', '0 ≤ harga[i] ≤ 1.000.000'],
    hints: [
      'Nggak perlu cek semua pasangan hari. Saat berdiri di hari ke-i, satu-satunya hal yang penting dari masa lalu adalah harga termurah sejauh ini.',
      'Sekali jalan: perbarui harga termurah, dan tiap langkah coba jual di hari itu.',
    ],
    fn: 'maxProfit',
    params: [{ name: 'harga', type: 'int[]' }],
    ret: 'int',
    samples: [
      { in: [[7, 1, 5, 3, 6, 4]], out: 5, note: 'Beli di 1, jual di 6' },
      { in: [[7, 6, 4, 3, 1]], out: 0, note: 'Turun terus — mending nggak transaksi' },
    ],
    tests: [
      [[]],
      [[5]],
      [[1, 2]],
      [[2, 1]],
      [[3, 3, 3, 3]],
      [[2, 4, 1, 7]],
      [Array.from({ length: 20000 }, (_, i) => (i * 7919) % 1000)],
    ],
    solution: (harga) => {
      let min = Infinity, best = 0;
      for (const p of harga) {
        if (p < min) min = p;
        else if (p - min > best) best = p - min;
      }
      return best;
    },
  },

  {
    id: 'kelompok-anagram',
    title: 'Kelompokkan Anagram',
    tagline: 'Kata-kata sekeluarga huruf',
    statement: `Kelompokkan kata-kata yang saling anagram ke dalam grup yang sama.

Supaya hasilnya bisa dicek otomatis, urutannya dikunci:

- isi tiap grup diurut **alfabetis menaik**
- antar grup diurut berdasarkan **kata pertama** tiap grup, alfabetis menaik`,
    constraints: ['0 ≤ jumlah kata ≤ 5.000', '1 ≤ panjang tiap kata ≤ 50', 'Semua huruf kecil a-z'],
    hints: [
      'Dua kata anagram kalau bentuk "normal"-nya sama. Bentuk normal paling gampang: hurufnya diurut.',
      'Pakai map dari kunci-normal ke daftar kata. Baru di akhir, urutkan isi grup dan urutan grupnya.',
    ],
    fn: 'groupAnagrams',
    params: [{ name: 'kata', type: 'string[]' }],
    ret: 'string[][]',
    samples: [
      {
        in: [['eat', 'tea', 'tan', 'ate', 'nat', 'bat']],
        out: [['ate', 'eat', 'tea'], ['bat'], ['nat', 'tan']],
        note: 'Grup diurut berdasarkan kata pertamanya: ate < bat < nat',
      },
      { in: [['']], out: [['']], note: 'String kosong pun satu grup' },
    ],
    tests: [
      [[]],
      [['a']],
      [['abc', 'cba', 'bac', 'xyz']],
      [['listen', 'silent', 'enlist', 'google', 'gogole']],
      [['aa', 'aa', 'aa']],
      [Array.from({ length: 300 }, (_, i) => (i % 3 === 0 ? 'ab' : i % 3 === 1 ? 'ba' : 'cd'))],
    ],
    solution: (kata) => {
      const g = new Map();
      for (const w of kata) {
        const k = [...w].sort().join('');
        if (!g.has(k)) g.set(k, []);
        g.get(k).push(w);
      }
      const out = [...g.values()].map((v) => v.sort());
      out.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
      return out;
    },
  },

  {
    id: 'top-k',
    title: 'Angka Paling Sering',
    tagline: 'K juara frekuensi',
    statement: `Kembalikan \`k\` angka yang paling sering muncul di \`nums\`.

Urutan hasilnya dikunci: **frekuensi dari besar ke kecil**; kalau frekuensinya sama, **angka yang lebih kecil duluan**.`,
    constraints: ['1 ≤ panjang nums ≤ 100.000', '1 ≤ k ≤ jumlah angka berbeda di nums', '-100.000 ≤ nums[i] ≤ 100.000'],
    hints: [
      'Langkah satu selalu sama: hitung frekuensi pakai map.',
      'Setelah itu tinggal urutkan pasangan (angka, frekuensi) dengan aturan dua tingkat, lalu ambil k teratas.',
    ],
    fn: 'topK',
    params: [{ name: 'nums', type: 'int[]' }, { name: 'k', type: 'int' }],
    ret: 'int[]',
    samples: [
      { in: [[1, 1, 1, 2, 2, 3], 2], out: [1, 2], note: '1 muncul 3x, 2 muncul 2x' },
      { in: [[4, 4, 5, 5, 6], 2], out: [4, 5], note: '4 dan 5 sama-sama 2x — yang kecil duluan' },
    ],
    tests: [
      [[1], 1],
      [[7, 7, 7], 1],
      [[-1, -1, 2, 2, 3, 3, 3], 3],
      [[5, 4, 3, 2, 1], 5],
      [[1, 2, 3, 1, 2, 1], 2],
      [Array.from({ length: 20000 }, (_, i) => i % 50), 5],
    ],
    solution: (nums, k) => {
      const c = new Map();
      for (const x of nums) c.set(x, (c.get(x) ?? 0) + 1);
      return [...c.entries()]
        .sort((a, b) => b[1] - a[1] || a[0] - b[0])
        .slice(0, k)
        .map((e) => e[0]);
    },
  },

  {
    id: 'gabung-interval',
    title: 'Gabungkan Rentang',
    tagline: 'Jadwal yang tumpang tindih dilebur',
    statement: `\`rentang\` berisi pasangan \`[mulai, selesai]\`. Gabungkan semua rentang yang **tumpang tindih atau bersentuhan**, lalu kembalikan daftar rentang hasilnya, urut menaik berdasarkan \`mulai\`.

Dua rentang dianggap bersentuhan kalau ujung yang satu sama dengan pangkal yang lain, misal \`[1,4]\` dan \`[4,6]\` jadi \`[1,6]\`.`,
    constraints: ['0 ≤ jumlah rentang ≤ 20.000', 'mulai ≤ selesai', '-1.000.000 ≤ nilai ≤ 1.000.000'],
    hints: [
      'Urutkan dulu berdasarkan titik mulai. Setelah itu masalahnya jadi sekali jalan.',
      'Simpan rentang terakhir di hasil. Rentang berikutnya entah nyambung (perlebar ujungnya) atau nggak (dorong sebagai rentang baru).',
    ],
    fn: 'mergeIntervals',
    params: [{ name: 'rentang', type: 'int[][]' }],
    ret: 'int[][]',
    samples: [
      { in: [[[1, 3], [2, 6], [8, 10], [15, 18]]], out: [[1, 6], [8, 10], [15, 18]], note: '[1,3] dan [2,6] tumpang tindih' },
      { in: [[[1, 4], [4, 5]]], out: [[1, 5]], note: 'Bersentuhan di titik 4' },
    ],
    tests: [
      [[]],
      [[[5, 5]]],
      [[[3, 4], [1, 2]]],
      [[[1, 10], [2, 3], [4, 5], [6, 7]]],
      [[[-5, -1], [-2, 3], [10, 12], [11, 11]]],
      [Array.from({ length: 2000 }, (_, i) => [i * 3, i * 3 + 1])],
    ],
    solution: (rentang) => {
      const s = rentang.map((r) => [...r]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const out = [];
      for (const r of s) {
        const last = out[out.length - 1];
        if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
        else out.push([...r]);
      }
      return out;
    },
  },

  {
    id: 'putar-array',
    title: 'Putar Array',
    tagline: 'Geser ke kanan, yang jatuh masuk lagi dari kiri',
    statement: `Putar isi \`nums\` ke **kanan** sebanyak \`k\` langkah. Elemen yang keluar di ujung kanan masuk lagi dari ujung kiri.

\`k\` bisa lebih besar dari panjang array.`,
    constraints: ['0 ≤ panjang nums ≤ 100.000', '0 ≤ k ≤ 1.000.000.000'],
    hints: [
      'Kalau k lebih besar dari panjang array, sebagian putaran cuma balik ke posisi semula. Sisa bagi berguna di sini.',
      'Hasilnya = potongan k terakhir, lalu disambung sisanya.',
    ],
    fn: 'rotate',
    params: [{ name: 'nums', type: 'int[]' }, { name: 'k', type: 'int' }],
    ret: 'int[]',
    samples: [
      { in: [[1, 2, 3, 4, 5, 6, 7], 3], out: [5, 6, 7, 1, 2, 3, 4], note: 'Tiga elemen terakhir pindah ke depan' },
      { in: [[1, 2], 5], out: [2, 1], note: '5 langkah pada array panjang 2 sama saja dengan 1 langkah' },
    ],
    tests: [
      [[], 3],
      [[1], 0],
      [[1], 1000000000],
      [[1, 2, 3], 3],
      [[-1, -100, 3, 99], 2],
      [Array.from({ length: 10000 }, (_, i) => i), 12345],
    ],
    solution: (nums, k) => {
      const n = nums.length;
      if (n === 0) return [];
      const s = k % n;
      return [...nums.slice(n - s), ...nums.slice(0, n - s)];
    },
  },

  {
    id: 'cari-terputar',
    title: 'Cari di Array Terputar',
    tagline: 'Terurut, tapi sudah diputar entah berapa langkah',
    statement: `\`nums\` awalnya terurut menaik dan semua nilainya berbeda, tapi sudah diputar di suatu titik. Contoh: \`[0,1,2,4,5,6,7]\` bisa jadi \`[4,5,6,7,0,1,2]\`.

Cari indeks \`target\`, atau \`-1\` kalau nggak ada. Targetnya **O(log n)**. Memindai satu-satu bakal lolos test juga, tapi bukan itu yang dilatih di soal ini.`,
    constraints: ['0 ≤ panjang nums ≤ 100.000', 'Semua nilai berbeda', '-1.000.000 ≤ nilai ≤ 1.000.000'],
    hints: [
      'Meski sudah diputar, kalau array dibelah dua, minimal satu sisinya pasti masih terurut rapi.',
      'Tiap langkah: tentukan sisi mana yang terurut, cek apakah target berada di rentang sisi itu. Kalau iya lanjut ke sana, kalau nggak ke sisi sebelahnya.',
    ],
    fn: 'searchRotated',
    params: [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }],
    ret: 'int',
    samples: [
      { in: [[4, 5, 6, 7, 0, 1, 2], 0], out: 4, note: '0 ada di indeks 4' },
      { in: [[4, 5, 6, 7, 0, 1, 2], 3], out: -1, note: 'Nggak ada di array' },
    ],
    tests: [
      [[], 5],
      [[1], 1],
      [[1], 0],
      [[3, 1], 1],
      [[5, 1, 3], 3],
      [[1, 2, 3, 4, 5], 5],
      [[6, 7, 8, 1, 2, 3, 4, 5], 8],
      [(() => { const a = Array.from({ length: 20000 }, (_, i) => i); return [...a.slice(7777), ...a.slice(0, 7777)]; })(), 19999],
    ],
    solution: (nums, target) => {
      let lo = 0, hi = nums.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] === target) return mid;
        if (nums[lo] <= nums[mid]) {
          if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
          else lo = mid + 1;
        } else {
          if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
          else hi = mid - 1;
        }
      }
      return -1;
    },
  },

  {
    id: 'subarray-maksimal',
    title: 'Subarray Jumlah Terbesar',
    tagline: 'Potongan berurutan paling menguntungkan',
    statement: `Cari **jumlah terbesar** dari sebuah subarray (potongan berurutan, minimal berisi satu elemen) di dalam \`nums\`.

Kalau semua angkanya negatif, jawabannya adalah angka negatif yang paling besar.`,
    constraints: ['1 ≤ panjang nums ≤ 200.000', '-100.000 ≤ nums[i] ≤ 100.000'],
    hints: [
      'Saat berdiri di elemen ke-i, pilihannya cuma dua: sambung potongan sebelumnya, atau mulai potongan baru dari sini.',
      'Kalau jumlah berjalan sudah negatif, menyambungnya cuma bikin rugi — lebih baik mulai dari nol lagi.',
    ],
    fn: 'maxSubarray',
    params: [{ name: 'nums', type: 'int[]' }],
    ret: 'int',
    samples: [
      { in: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], out: 6, note: '[4,-1,2,1] jumlahnya 6' },
      { in: [[-3, -1, -7]], out: -1, note: 'Semua negatif — ambil yang paling ringan' },
    ],
    tests: [
      [[1]],
      [[-1]],
      [[5, 4, -1, 7, 8]],
      [[0, 0, 0]],
      [[-2, -1, -3, -4]],
      [Array.from({ length: 20000 }, (_, i) => ((i * 37) % 201) - 100)],
    ],
    solution: (nums) => {
      let best = -Infinity, cur = 0;
      for (const x of nums) {
        cur = Math.max(x, cur + x);
        best = Math.max(best, cur);
      }
      return best;
    },
  },

  {
    id: 'matriks-spiral',
    title: 'Matriks Spiral',
    tagline: 'Baca melingkar dari luar ke dalam',
    statement: `Baca semua isi \`matriks\` dengan pola **spiral searah jarum jam**, mulai dari pojok kiri atas, lalu kembalikan urutannya sebagai satu array.

Matriks nggak harus persegi.`,
    constraints: ['0 ≤ jumlah baris ≤ 200', '0 ≤ jumlah kolom ≤ 200', 'Semua baris punya panjang sama'],
    hints: [
      'Pikirkan empat batas: atas, bawah, kiri, kanan. Tiap selesai satu sisi, batasnya menyusut ke dalam.',
      'Hati-hati saat tinggal satu baris atau satu kolom tersisa — jangan sampai kebaca dua kali.',
    ],
    fn: 'spiral',
    params: [{ name: 'matriks', type: 'int[][]' }],
    ret: 'int[]',
    samples: [
      { in: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], out: [1, 2, 3, 6, 9, 8, 7, 4, 5], note: 'Muter luar dulu, tengah terakhir' },
      { in: [[[1, 2], [3, 4], [5, 6]]], out: [1, 2, 4, 6, 5, 3], note: 'Matriks 3×2' },
    ],
    tests: [
      [[]],
      [[[7]]],
      [[[1, 2, 3, 4]]],
      [[[1], [2], [3]]],
      [[[1, 2], [3, 4]]],
      [Array.from({ length: 20 }, (_, r) => Array.from({ length: 30 }, (_, c) => r * 30 + c))],
    ],
    solution: (matriks) => {
      const out = [];
      if (!matriks.length || !matriks[0].length) return out;
      let top = 0, bottom = matriks.length - 1, left = 0, right = matriks[0].length - 1;
      while (top <= bottom && left <= right) {
        for (let c = left; c <= right; c++) out.push(matriks[top][c]);
        top++;
        for (let r = top; r <= bottom; r++) out.push(matriks[r][right]);
        right--;
        if (top <= bottom) { for (let c = right; c >= left; c--) out.push(matriks[bottom][c]); bottom--; }
        if (left <= right) { for (let r = bottom; r >= top; r--) out.push(matriks[r][left]); left++; }
      }
      return out;
    },
  },
];
