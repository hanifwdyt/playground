// Level Easy — dasar: loop, string, array, sedikit hash map.
// `solution` cuma dipakai build script buat ngitung kunci jawaban; nggak ikut
// ke-bundle ke browser.

export default [
  {
    id: 'two-sum',
    title: 'Dua Angka',
    tagline: 'Cari sepasang angka yang jumlahnya pas',
    statement: `Kamu dikasih sebuah array bilangan \`nums\` dan sebuah angka \`target\`.

Cari **dua angka berbeda posisi** yang kalau dijumlahkan hasilnya persis \`target\`, lalu kembalikan **indeks** keduanya, urut dari kecil ke besar.

Dijamin selalu ada tepat satu jawaban, dan satu elemen nggak boleh dipakai dua kali.`,
    constraints: ['2 ≤ panjang nums ≤ 10.000', '-1.000.000 ≤ nums[i], target ≤ 1.000.000', 'Tepat ada satu jawaban'],
    hints: [
      'Cara paling polos: dua loop bersarang, cek semua pasangan. Itu jalan, tapi O(n²). Bisa lebih cepat?',
      'Pas berdiri di angka x, yang kamu cari itu target - x. Kalau tiap angka yang udah dilewati kamu simpan di map (angka → indeks), pencarian jadi sekali lihat.',
    ],
    fn: 'twoSum',
    params: [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }],
    ret: 'int[]',
    samples: [
      { in: [[2, 7, 11, 15], 9], out: [0, 1], note: 'nums[0] + nums[1] = 2 + 7 = 9' },
      { in: [[3, 2, 4], 6], out: [1, 2], note: 'nums[1] + nums[2] = 2 + 4 = 6' },
      { in: [[3, 3], 6], out: [0, 1], note: 'Dua elemen beda posisi meski nilainya sama' },
    ],
    tests: [
      [[-1, -2, -3, -4, -5], -8],
      [[0, 4, 3, 0], 0],
      [[1000000, -999999, 5], 1],
      [[5, 75, 25], 100],
      [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 19],
      [Array.from({ length: 2000 }, (_, i) => i * 3), 5991],
    ],
    solution: (nums, target) => {
      const seen = new Map();
      for (let i = 0; i < nums.length; i++) {
        const need = target - nums[i];
        if (seen.has(need)) return [seen.get(need), i];
        if (!seen.has(nums[i])) seen.set(nums[i], i);
      }
      return [];
    },
  },

  {
    id: 'palindrom',
    title: 'Palindrom Bersih',
    tagline: 'Baca dari depan sama kayak dari belakang',
    statement: `Sebuah kalimat disebut palindrom kalau dibaca dari depan dan dari belakang sama saja — **setelah** semua karakter selain huruf dan angka dibuang, dan huruf besar/kecil dianggap sama.

Kembalikan \`true\` kalau kalimatnya palindrom.`,
    constraints: ['0 ≤ panjang s ≤ 20.000', 's boleh berisi huruf, angka, spasi, dan tanda baca'],
    hints: [
      'Bersihin dulu jadi huruf kecil tanpa tanda baca, baru bandingkan.',
      'Kalau mau tanpa bikin string baru: dua penunjuk, satu dari kiri satu dari kanan, lompati karakter yang bukan huruf/angka.',
    ],
    fn: 'isPalindrome',
    params: [{ name: 's', type: 'string' }],
    ret: 'bool',
    samples: [
      { in: ['Kasur ini rusak'], out: true, note: 'Jadi "kasurinirusak" — sama dari dua arah' },
      { in: ['Ibu Ratna, antar ubi!'], out: true, note: 'Tanda baca dan spasi diabaikan' },
      { in: ['playground'], out: false, note: 'Dibalik jadi "dnuorgyalp"' },
    ],
    tests: [
      [''],
      ['a'],
      ['ab'],
      ['A man, a plan, a canal: Panama'],
      ['12321'],
      ['1 2 3 2 2'],
      ['Kasur Nababan rusak'],
      ['.,;!?'],
      ['No lemon, no melon'],
    ],
    solution: (s) => {
      const c = s.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (let i = 0, j = c.length - 1; i < j; i++, j--) if (c[i] !== c[j]) return false;
      return true;
    },
  },

  {
    id: 'balik-kalimat',
    title: 'Balik Kalimat',
    tagline: 'Urutan katanya dibalik, spasinya dirapikan',
    statement: `Kembalikan kalimat dengan **urutan katanya dibalik**.

Kata dipisahkan satu spasi atau lebih. Spasi di awal, di akhir, dan spasi ganda di tengah harus hilang dari hasil — antar kata cukup satu spasi.`,
    constraints: ['0 ≤ panjang s ≤ 10.000', 's berisi huruf, angka, dan spasi'],
    hints: [
      'Pecah jadi daftar kata, buang yang kosong, balik urutannya, gabung lagi pakai satu spasi.',
      'Hati-hati input yang isinya cuma spasi — hasilnya string kosong, bukan spasi.',
    ],
    fn: 'reverseWords',
    params: [{ name: 's', type: 'string' }],
    ret: 'string',
    samples: [
      { in: ['belajar ngoding itu seru'], out: 'seru itu ngoding belajar', note: 'Kata dibalik, hurufnya nggak' },
      { in: ['  halo   dunia  '], out: 'dunia halo', note: 'Spasi berlebih dirapikan' },
    ],
    tests: [
      [''],
      ['     '],
      ['satu'],
      ['a b c d e'],
      ['  Kopi   susu  gula   aren '],
      ['9 8 7'],
    ],
    solution: (s) => s.split(/\s+/).filter(Boolean).reverse().join(' '),
  },

  {
    id: 'fizz-buzz',
    title: 'Fizz Buzz',
    tagline: 'Ritual wajib sebelum wawancara',
    statement: `Kembalikan daftar berisi \`n\` string untuk angka 1 sampai \`n\`, dengan aturan:

- kelipatan 3 **dan** 5 → \`"FizzBuzz"\`
- kelipatan 3 → \`"Fizz"\`
- kelipatan 5 → \`"Buzz"\`
- sisanya → angkanya sendiri dalam bentuk string

Urutannya dari 1 sampai n.`,
    constraints: ['1 ≤ n ≤ 5.000'],
    hints: [
      'Cek kondisi paling ketat duluan (kelipatan 15), baru yang lain.',
      'Angka jadi string: tiap bahasa punya caranya — di JS cukup String(i), di Python str(i).',
    ],
    fn: 'fizzBuzz',
    params: [{ name: 'n', type: 'int' }],
    ret: 'string[]',
    samples: [
      { in: [5], out: ['1', '2', 'Fizz', '4', 'Buzz'], note: '3 kelipatan 3, 5 kelipatan 5' },
      { in: [15], out: ['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz'], note: '15 kena dua-duanya' },
    ],
    tests: [[1], [2], [3], [30], [100]],
    solution: (n) => {
      const out = [];
      for (let i = 1; i <= n; i++) {
        out.push(i % 15 === 0 ? 'FizzBuzz' : i % 3 === 0 ? 'Fizz' : i % 5 === 0 ? 'Buzz' : String(i));
      }
      return out;
    },
  },

  {
    id: 'angka-hilang',
    title: 'Angka Hilang',
    tagline: 'Satu angka kabur dari barisan',
    statement: `Array \`nums\` berisi \`n\` angka berbeda yang diambil dari rentang \`0..n\` — artinya persis **satu** angka dari rentang itu nggak ada di array.

Cari angka yang hilang itu. Urutan isi array acak.`,
    constraints: ['1 ≤ panjang nums ≤ 100.000', 'Semua nilai berbeda dan berada di rentang 0..n'],
    hints: [
      'Jumlah 0 + 1 + ... + n bisa dihitung langsung pakai rumus n(n+1)/2.',
      'Kurangi jumlah teoretis dengan jumlah isi array — sisanya ya yang hilang. Bonus: bisa juga pakai XOR.',
    ],
    fn: 'missingNumber',
    params: [{ name: 'nums', type: 'int[]' }],
    ret: 'int',
    samples: [
      { in: [[3, 0, 1]], out: 2, note: 'n = 3, jadi rentangnya 0..3; yang absen 2' },
      { in: [[0]], out: 1, note: 'n = 1, rentang 0..1' },
    ],
    tests: [
      [[1]],
      [[9, 6, 4, 2, 3, 5, 7, 0, 1]],
      [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]],
      [Array.from({ length: 5000 }, (_, i) => i + 1)],
      [Array.from({ length: 5000 }, (_, i) => (i < 2500 ? i : i + 1))],
    ],
    solution: (nums) => {
      const n = nums.length;
      let total = (n * (n + 1)) / 2;
      for (const x of nums) total -= x;
      return total;
    },
  },

  {
    id: 'anagram',
    title: 'Anagram',
    tagline: 'Huruf yang sama, susunan beda',
    statement: `Dua kata disebut anagram kalau keduanya tersusun dari **huruf yang sama persis** dengan jumlah yang sama, cuma urutannya beda.

Kembalikan \`true\` kalau \`s\` dan \`t\` anagram. Huruf besar/kecil dibedakan, spasi ikut dihitung sebagai karakter.`,
    constraints: ['0 ≤ panjang s, t ≤ 50.000', 'Berisi karakter ASCII'],
    hints: [
      'Panjang beda? Langsung false, nggak usah dilanjut.',
      'Hitung frekuensi tiap karakter di s, lalu kurangi pakai t. Kalau semua balik ke nol, berarti anagram.',
    ],
    fn: 'isAnagram',
    params: [{ name: 's', type: 'string' }, { name: 't', type: 'string' }],
    ret: 'bool',
    samples: [
      { in: ['kuda', 'daku'], out: true, note: 'Huruf k, u, d, a dua-duanya punya' },
      { in: ['rat', 'car'], out: false, note: 'Ada huruf yang beda' },
    ],
    tests: [
      ['', ''],
      ['a', 'a'],
      ['ab', 'ba'],
      ['aab', 'abb'],
      ['listen', 'silent'],
      ['Rat', 'tar'],
      ['ngoding', 'godingn'],
      ['abcdefghij'.repeat(500), 'jihgfedcba'.repeat(500)],
    ],
    solution: (s, t) => {
      if (s.length !== t.length) return false;
      const c = new Map();
      for (const ch of s) c.set(ch, (c.get(ch) ?? 0) + 1);
      for (const ch of t) {
        const v = c.get(ch);
        if (!v) return false;
        c.set(ch, v - 1);
      }
      return true;
    },
  },

  {
    id: 'gabung-terurut',
    title: 'Gabung Dua Deret Terurut',
    tagline: 'Dua antrean rapi jadi satu antrean rapi',
    statement: `\`a\` dan \`b\` masing-masing sudah terurut menaik. Gabungkan keduanya jadi satu array yang juga terurut menaik.

Nilai duplikat tetap dipertahankan (nggak dibuang).`,
    constraints: ['0 ≤ panjang a, b ≤ 100.000', '-1.000.000 ≤ nilai ≤ 1.000.000'],
    hints: [
      'Gabung lalu sort itu O(n log n). Padahal keduanya udah terurut — sayang banget informasinya dibuang.',
      'Dua penunjuk, satu di tiap array. Tiap langkah ambil yang lebih kecil, majukan penunjuknya. Jangan lupa sisa yang belum habis.',
    ],
    fn: 'mergeSorted',
    params: [{ name: 'a', type: 'int[]' }, { name: 'b', type: 'int[]' }],
    ret: 'int[]',
    samples: [
      { in: [[1, 3, 5], [2, 4, 6]], out: [1, 2, 3, 4, 5, 6], note: 'Selang-seling' },
      { in: [[], [1, 2]], out: [1, 2], note: 'Salah satu boleh kosong' },
    ],
    tests: [
      [[], []],
      [[5], [1]],
      [[1, 1, 1], [1, 1]],
      [[-9, -3, 0], [-5, -1, 8, 12]],
      [[1, 2, 3], []],
      [Array.from({ length: 1000 }, (_, i) => i * 2), Array.from({ length: 1000 }, (_, i) => i * 2 + 1)],
    ],
    solution: (a, b) => {
      const out = [];
      let i = 0, j = 0;
      while (i < a.length && j < b.length) out.push(a[i] <= b[j] ? a[i++] : b[j++]);
      while (i < a.length) out.push(a[i++]);
      while (j < b.length) out.push(b[j++]);
      return out;
    },
  },

  {
    id: 'huruf-unik',
    title: 'Karakter Unik Pertama',
    tagline: 'Yang cuma muncul sekali, paling awal',
    statement: `Cari karakter pertama di \`s\` yang **cuma muncul sekali** di seluruh string, lalu kembalikan indeksnya (mulai dari 0).

Kalau semua karakter muncul lebih dari sekali, kembalikan \`-1\`.`,
    constraints: ['0 ≤ panjang s ≤ 100.000', 's berisi huruf kecil a-z'],
    hints: [
      'Butuh dua lintasan: satu buat menghitung, satu lagi buat mencari yang hitungannya 1.',
      'Karena cuma a-z, array 26 slot lebih hemat daripada hash map.',
    ],
    fn: 'firstUniqChar',
    params: [{ name: 's', type: 'string' }],
    ret: 'int',
    samples: [
      { in: ['ngoding'], out: 2, note: 'n dan g masing-masing muncul 2x; yang pertama cuma sekali adalah o di indeks 2' },
      { in: ['aabb'], out: -1, note: 'Semua muncul dua kali' },
    ],
    tests: [
      [''],
      ['a'],
      ['aa'],
      ['abcabd'],
      ['loveleetcode'],
      ['zzzzzzy'],
      ['abcdefghijklmnopqrstuvwxyz'],
      ['aabbccddeeffg'],
    ],
    solution: (s) => {
      const c = new Map();
      for (const ch of s) c.set(ch, (c.get(ch) ?? 0) + 1);
      for (let i = 0; i < s.length; i++) if (c.get(s[i]) === 1) return i;
      return -1;
    },
  },

  {
    id: 'tangga-bintang',
    title: 'Tangga Bintang',
    tagline: 'Cetak segitiga rata kanan',
    statement: `Kembalikan \`n\` baris yang membentuk tangga bintang rata kanan.

Baris ke-\`i\` (dihitung dari 1) berisi \`n - i\` spasi diikuti \`i\` bintang \`*\`. Jadi lebar tiap baris selalu sama, yaitu \`n\`.`,
    constraints: ['1 ≤ n ≤ 200'],
    hints: [
      'Tiap baris = pengulangan spasi + pengulangan bintang. Cari cara mengulang karakter di bahasamu.',
      'Cek lebar hasilnya: tiap baris harus persis n karakter, termasuk spasi.',
    ],
    fn: 'stairs',
    params: [{ name: 'n', type: 'int' }],
    ret: 'string[]',
    samples: [
      { in: [3], out: ['  *', ' **', '***'], note: 'Baris 1 punya 2 spasi + 1 bintang' },
      { in: [1], out: ['*'], note: 'Tanpa spasi sama sekali' },
    ],
    tests: [[2], [5], [10]],
    solution: (n) => Array.from({ length: n }, (_, i) => ' '.repeat(n - i - 1) + '*'.repeat(i + 1)),
  },

  {
    id: 'rata-rata-adil',
    title: 'Rata-rata Tanpa Ekstrem',
    tagline: 'Buang nilai tertinggi & terendah dulu',
    statement: `Gaya penjurian lomba: dari daftar \`nilai\`, buang **satu** nilai terkecil dan **satu** nilai terbesar, lalu hitung rata-rata sisanya.

Kembalikan hasilnya dibulatkan ke **2 angka di belakang koma**.

Kalau ada nilai kembar, cukup buang satu buah saja untuk masing-masing sisi.`,
    constraints: ['3 ≤ panjang nilai ≤ 10.000', '0 ≤ nilai[i] ≤ 1.000'],
    hints: [
      'Nggak perlu sort: cukup catat min, max, dan total sambil sekali jalan.',
      'Rata-rata = (total - min - max) / (n - 2). Hati-hati pembagian bilangan bulat di bahasa bertipe ketat — pastikan hasilnya desimal.',
    ],
    fn: 'trimmedMean',
    params: [{ name: 'nilai', type: 'int[]' }],
    ret: 'float',
    samples: [
      { in: [[10, 20, 30, 40, 50]], out: 30, note: 'Buang 10 dan 50, sisa (20+30+40)/3 = 30' },
      { in: [[4, 4, 4, 100]], out: 4, note: 'Buang satu 4 dan satu 100, sisa (4+4)/2 = 4' },
    ],
    tests: [
      [[1, 2, 3]],
      [[100, 0, 50]],
      [[7, 7, 7, 7, 7]],
      [[1, 2, 3, 4, 5, 6, 7]],
      [[0, 0, 0, 1000]],
      [Array.from({ length: 1000 }, (_, i) => i)],
    ],
    solution: (nilai) => {
      let min = Infinity, max = -Infinity, total = 0;
      for (const x of nilai) {
        total += x;
        if (x < min) min = x;
        if (x > max) max = x;
      }
      const mean = (total - min - max) / (nilai.length - 2);
      return Math.round(mean * 100) / 100;
    },
  },
];
