// Level Hard — dynamic programming, graph, binary search on answer.

export default [
  {
    id: 'air-hujan',
    title: 'Air Hujan Tertampung',
    tagline: 'Berapa banyak air yang nyangkut di antara tembok',
    statement: `\`tinggi[i]\` adalah tinggi tembok ke-\`i\`, semuanya berdiri berdampingan dengan lebar 1.

Setelah hujan, air akan tertampung di cekungan antar tembok. Hitung **total volume air** yang tertampung.

Air di atas satu tembok setinggi \`min(tembok tertinggi di kiri, tembok tertinggi di kanan) - tinggi tembok itu\`, dan nggak boleh negatif.`,
    constraints: ['0 ≤ panjang tinggi ≤ 100.000', '0 ≤ tinggi[i] ≤ 100.000'],
    hints: [
      'Untuk tiap posisi, air yang bisa berdiri di atasnya cuma ditentukan oleh tembok tertinggi di kirinya dan di kanannya. Yang lebih pendek dari keduanya yang menentukan.',
      'Solusi rapi: dua penunjuk dari kiri dan kanan, masing-masing bawa "tertinggi sejauh ini". Yang sisinya lebih pendek yang bergerak — karena sisi itulah yang membatasi.',
    ],
    fn: 'trapWater',
    params: [{ name: 'tinggi', type: 'int[]' }],
    ret: 'int',
    samples: [
      { in: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], out: 6, note: 'Enam kotak air tertampung di cekungan-cekungannya' },
      { in: [[4, 2, 0, 3, 2, 5]], out: 9, note: 'Cekungan besar di tengah' },
    ],
    tests: [
      [[]],
      [[1]],
      [[3, 3]],
      [[5, 0, 5]],
      [[1, 2, 3, 4, 5]],
      [[5, 4, 3, 2, 1]],
      [[2, 0, 2, 0, 2, 0, 2]],
      [Array.from({ length: 20000 }, (_, i) => (i % 7) * 3)],
    ],
    solution: (tinggi) => {
      let l = 0, r = tinggi.length - 1, lm = 0, rm = 0, total = 0;
      while (l < r) {
        if (tinggi[l] < tinggi[r]) {
          lm = Math.max(lm, tinggi[l]);
          total += lm - tinggi[l];
          l++;
        } else {
          rm = Math.max(rm, tinggi[r]);
          total += rm - tinggi[r];
          r--;
        }
      }
      return total;
    },
    brute: (tinggi) => {
      let total = 0;
      for (let i = 0; i < tinggi.length; i++) {
        let lm = 0, rm = 0;
        for (let j = 0; j <= i; j++) lm = Math.max(lm, tinggi[j]);
        for (let j = i; j < tinggi.length; j++) rm = Math.max(rm, tinggi[j]);
        total += Math.min(lm, rm) - tinggi[i];
      }
      return total;
    },
    bruteMax: 5000,
  },

  {
    id: 'koin-minimum',
    title: 'Koin Minimum',
    tagline: 'Bayar pas dengan sesedikit mungkin koin',
    statement: `Kamu punya koin dengan nilai-nilai di \`koin\`, stoknya tak terbatas. Bayar tepat sejumlah \`jumlah\` dengan **sesedikit mungkin** koin.

Kembalikan jumlah koin minimum, atau \`-1\` kalau nominal itu nggak bisa dibayar pas.

Catatan: strategi rakus "ambil koin terbesar dulu" **nggak selalu benar** — coba koin \`[1,3,4]\` untuk 6.`,
    constraints: ['1 ≤ jumlah koin ≤ 20', '1 ≤ nilai koin ≤ 10.000', '0 ≤ jumlah ≤ 20.000'],
    hints: [
      'Kalau kamu tahu jawaban terbaik untuk semua nominal yang lebih kecil, jawaban untuk nominal sekarang tinggal dipilih dari situ.',
      'dp[x] = 1 + minimum dari dp[x - nilaiKoin] untuk tiap koin yang muat. Mulai dari dp[0] = 0.',
    ],
    fn: 'coinChange',
    params: [{ name: 'koin', type: 'int[]' }, { name: 'jumlah', type: 'int' }],
    ret: 'int',
    samples: [
      { in: [[1, 3, 4], 6], out: 2, note: '3 + 3. Kalau rakus: 4 + 1 + 1 = tiga koin, kalah' },
      { in: [[2], 3], out: -1, note: 'Nggak mungkin pas' },
      { in: [[5, 2, 1], 0], out: 0, note: 'Nol butuh nol koin' },
    ],
    tests: [
      [[1], 0],
      [[2], 4],
      [[186, 419, 83, 408], 6249],
      [[1, 5, 10, 25], 63],
      [[7, 11], 100],
      [[9999], 9999],
      [[3, 7, 405, 436], 8839],
    ],
    solution: (koin, jumlah) => {
      const INF = Infinity;
      const dp = new Array(jumlah + 1).fill(INF);
      dp[0] = 0;
      for (let x = 1; x <= jumlah; x++) {
        for (const c of koin) if (c <= x && dp[x - c] + 1 < dp[x]) dp[x] = dp[x - c] + 1;
      }
      return dp[jumlah] === INF ? -1 : dp[jumlah];
    },
  },

  {
    id: 'lis',
    title: 'Deret Naik Terpanjang',
    tagline: 'Boleh loncat, asal terus naik',
    statement: `Cari panjang **subsequence menaik tegas** yang paling panjang di \`nums\`.

Subsequence artinya boleh melewati elemen (nggak harus berurutan), tapi urutan aslinya harus dipertahankan. "Menaik tegas" artinya tiap elemen harus lebih besar dari sebelumnya, nggak boleh sama.`,
    constraints: ['0 ≤ panjang nums ≤ 100.000', '-1.000.000 ≤ nums[i] ≤ 1.000.000'],
    hints: [
      'Versi O(n²): dp[i] = deret naik terpanjang yang berakhir di i. Gampang ditulis dan masih lolos di sini.',
      'Versi O(n log n): simpan "ekor terkecil" untuk tiap panjang deret. Tiap angka baru menggantikan ekor pertama yang ≥ dia — dan pencarian posisinya pakai binary search.',
    ],
    fn: 'lis',
    params: [{ name: 'nums', type: 'int[]' }],
    ret: 'int',
    samples: [
      { in: [[10, 9, 2, 5, 3, 7, 101, 18]], out: 4, note: '[2,3,7,101] panjangnya 4' },
      { in: [[7, 7, 7, 7]], out: 1, note: 'Sama nilainya nggak dihitung naik' },
    ],
    tests: [
      [[]],
      [[1]],
      [[5, 4, 3, 2, 1]],
      [[1, 2, 3, 4, 5]],
      [[0, 1, 0, 3, 2, 3]],
      [[4, 10, 4, 3, 8, 9]],
      [Array.from({ length: 20000 }, (_, i) => (i * 2654435761) % 100003)],
    ],
    solution: (nums) => {
      const tails = [];
      for (const x of nums) {
        let lo = 0, hi = tails.length;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (tails[mid] < x) lo = mid + 1;
          else hi = mid;
        }
        tails[lo] = x;
      }
      return tails.length;
    },
    brute: (nums) => {
      if (!nums.length) return 0;
      const dp = new Array(nums.length).fill(1);
      let best = 1;
      for (let i = 1; i < nums.length; i++) {
        for (let j = 0; j < i; j++) if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
        best = Math.max(best, dp[i]);
      }
      return best;
    },
    bruteMax: 3000,
  },

  {
    id: 'jalur-termurah',
    title: 'Jalur Termurah',
    tagline: 'Cuma boleh ke kanan dan ke bawah',
    statement: `\`grid\` berisi biaya untuk menginjak tiap petak. Kamu mulai dari pojok **kiri atas** dan harus sampai pojok **kanan bawah**, tiap langkah cuma boleh ke **kanan** atau ke **bawah**.

Kembalikan total biaya terkecil, termasuk petak awal dan petak akhir.`,
    constraints: ['1 ≤ jumlah baris, kolom ≤ 300', '0 ≤ biaya tiap petak ≤ 1.000'],
    hints: [
      'Buat tabel biaya termurah untuk sampai ke tiap petak. Petak paling kiri atas nilainya biaya dia sendiri.',
      'Sebuah petak cuma bisa didatangi dari atas atau dari kiri — ambil yang lebih murah, tambah biaya petak itu.',
    ],
    fn: 'minPath',
    params: [{ name: 'grid', type: 'int[][]' }],
    ret: 'int',
    samples: [
      { in: [[[1, 3, 1], [1, 5, 1], [4, 2, 1]]], out: 7, note: 'Lewat 1→3→1→1→1' },
      { in: [[[1, 2, 3], [4, 5, 6]]], out: 12, note: '1→2→3→6' },
    ],
    tests: [
      [[[5]]],
      [[[1, 2, 3, 4, 5]]],
      [[[1], [2], [3]]],
      [[[0, 0], [0, 0]]],
      [[[9, 1, 9], [9, 1, 9], [9, 1, 1]]],
      [Array.from({ length: 120 }, (_, r) => Array.from({ length: 120 }, (_, c) => ((r * 31 + c * 17) % 97)))],
    ],
    solution: (grid) => {
      const rows = grid.length, cols = grid[0].length;
      const dp = new Array(cols).fill(0);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (r === 0 && c === 0) dp[c] = grid[0][0];
          else if (r === 0) dp[c] = dp[c - 1] + grid[r][c];
          else if (c === 0) dp[c] = dp[c] + grid[r][c];
          else dp[c] = Math.min(dp[c], dp[c - 1]) + grid[r][c];
        }
      }
      return dp[cols - 1];
    },
  },

  {
    id: 'hitung-pulau',
    title: 'Hitung Pulau',
    tagline: 'Daratan yang nyambung dihitung satu',
    statement: `\`grid\` adalah peta: tiap baris string berisi karakter \`'1'\` (daratan) dan \`'0'\` (air).

Hitung ada berapa **pulau**. Satu pulau adalah kumpulan petak daratan yang saling nyambung secara **horizontal atau vertikal** (diagonal nggak dihitung nyambung).`,
    constraints: ['0 ≤ jumlah baris ≤ 300', '0 ≤ panjang tiap baris ≤ 300', "Tiap karakter '0' atau '1'"],
    hints: [
      'Telusuri grid petak demi petak. Begitu ketemu daratan yang belum pernah dikunjungi, itu pulau baru.',
      'Dari petak itu, banjiri semua tetangga daratan (BFS/DFS) dan tandai sudah dikunjungi — biar nggak dihitung ulang. Hati-hati rekursi terlalu dalam untuk grid besar.',
    ],
    fn: 'countIslands',
    params: [{ name: 'grid', type: 'string[]' }],
    ret: 'int',
    samples: [
      { in: [['11000', '11000', '00100', '00011']], out: 3, note: 'Blok kiri atas, satu titik tengah, dan pasangan kanan bawah' },
      { in: [['111', '010', '111']], out: 1, note: 'Semua nyambung lewat kolom tengah' },
    ],
    tests: [
      [[]],
      [['0']],
      [['1']],
      [['101010', '010101']],
      [['1111', '1001', '1001', '1111']],
      [Array.from({ length: 100 }, (_, r) => Array.from({ length: 100 }, (_, c) => ((r + c) % 2 === 0 ? '1' : '0')).join(''))],
      [Array.from({ length: 120 }, () => '1'.repeat(120))],
    ],
    solution: (grid) => {
      const rows = grid.length;
      if (!rows) return 0;
      const cols = grid[0].length;
      const seen = Array.from({ length: rows }, () => new Uint8Array(cols));
      let count = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] !== '1' || seen[r][c]) continue;
          count++;
          const stack = [[r, c]];
          seen[r][c] = 1;
          while (stack.length) {
            const [y, x] = stack.pop();
            const nb = [[y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1]];
            for (const [ny, nx] of nb) {
              if (ny < 0 || nx < 0 || ny >= rows || nx >= cols) continue;
              if (seen[ny][nx] || grid[ny][nx] !== '1') continue;
              seen[ny][nx] = 1;
              stack.push([ny, nx]);
            }
          }
        }
      }
      return count;
    },
  },

  {
    id: 'edit-jarak',
    title: 'Jarak Edit',
    tagline: 'Berapa langkah mengubah kata jadi kata lain',
    statement: `Hitung jumlah operasi **minimum** untuk mengubah string \`a\` menjadi string \`b\`. Operasi yang boleh dipakai:

- sisip satu karakter
- hapus satu karakter
- ganti satu karakter

Ini algoritma yang dipakai fitur "maksud kamu ...?" di mesin pencari.`,
    constraints: ['0 ≤ panjang a, b ≤ 500', 'Huruf kecil a-z'],
    hints: [
      'Bandingkan potongan a[0..i] dengan b[0..j]. Kalau huruf terakhirnya sama, masalahnya mengecil tanpa biaya.',
      'Kalau beda, biayanya 1 + minimum dari tiga pilihan: hapus, sisip, atau ganti — masing-masing menunjuk ke sel tetangga di tabel dp.',
    ],
    fn: 'editDistance',
    params: [{ name: 'a', type: 'string' }, { name: 'b', type: 'string' }],
    ret: 'int',
    samples: [
      { in: ['kuda', 'kudu'], out: 1, note: 'Ganti a jadi u' },
      { in: ['horse', 'ros'], out: 3, note: 'horse → rorse → rose → ros' },
      { in: ['', 'abc'], out: 3, note: 'Sisip tiga kali' },
    ],
    tests: [
      ['', ''],
      ['a', ''],
      ['abc', 'abc'],
      ['intention', 'execution'],
      ['pisang', 'pisan'],
      ['playground', 'background'],
      ['a'.repeat(300), 'b'.repeat(300)],
      ['abcdefghij'.repeat(30), 'jihgfedcba'.repeat(30)],
    ],
    solution: (a, b) => {
      const n = a.length, m = b.length;
      let prev = Array.from({ length: m + 1 }, (_, j) => j);
      for (let i = 1; i <= n; i++) {
        const cur = new Array(m + 1);
        cur[0] = i;
        for (let j = 1; j <= m; j++) {
          cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j - 1], prev[j], cur[j - 1]);
        }
        prev = cur;
      }
      return prev[m];
    },
  },

  {
    id: 'jendela-minimum',
    title: 'Jendela Terkecil',
    tagline: 'Potongan terpendek yang memuat semua huruf',
    statement: `Cari **substring terpendek** di \`s\` yang memuat semua karakter di \`t\`, termasuk pengulangannya (kalau \`t\` punya dua huruf 'a', jendelanya juga harus punya minimal dua 'a').

Kembalikan substring itu, atau string kosong kalau nggak ada. Dijamin jawabannya unik kalau ada.`,
    constraints: ['0 ≤ panjang s ≤ 100.000', '0 ≤ panjang t ≤ 1.000', 'Huruf besar dan kecil dibedakan'],
    hints: [
      'Jendela geser lagi — tapi kali ini kanan melar sampai semua syarat terpenuhi, lalu kiri menyusut selama syaratnya masih terpenuhi.',
      'Simpan berapa jenis karakter yang kuotanya sudah terpenuhi. Jendela valid saat angka itu sama dengan jumlah karakter berbeda di t.',
    ],
    fn: 'minWindow',
    params: [{ name: 's', type: 'string' }, { name: 't', type: 'string' }],
    ret: 'string',
    samples: [
      { in: ['ADOBECODEBANC', 'ABC'], out: 'BANC', note: 'Jendela terpendek yang memuat A, B, dan C' },
      { in: ['a', 'aa'], out: '', note: 's cuma punya satu a, nggak cukup' },
    ],
    tests: [
      ['', 'a'],
      ['a', ''],
      ['a', 'a'],
      ['ab', 'b'],
      ['aaflslflsldkalskaaa', 'aaa'],
      ['cabwefgewcwaefgcf', 'cae'],
      ['ngodingituseru', 'gus'],
      ['xy'.repeat(10000) + 'z', 'xyz'],
    ],
    solution: (s, t) => {
      if (!t.length || s.length < t.length) return '';
      const need = new Map();
      for (const ch of t) need.set(ch, (need.get(ch) ?? 0) + 1);
      const have = new Map();
      let formed = 0;
      const required = need.size;
      let best = [Infinity, 0, 0];
      for (let l = 0, r = 0; r < s.length; r++) {
        const ch = s[r];
        if (need.has(ch)) {
          have.set(ch, (have.get(ch) ?? 0) + 1);
          if (have.get(ch) === need.get(ch)) formed++;
        }
        while (formed === required) {
          if (r - l + 1 < best[0]) best = [r - l + 1, l, r];
          const lc = s[l];
          if (need.has(lc)) {
            have.set(lc, have.get(lc) - 1);
            if (have.get(lc) < need.get(lc)) formed--;
          }
          l++;
        }
      }
      return best[0] === Infinity ? '' : s.slice(best[1], best[2] + 1);
    },
  },

  {
    id: 'kapal-muatan',
    title: 'Kapasitas Kapal',
    tagline: 'Muatan harus habis dalam sekian hari',
    statement: `Paket-paket di pelabuhan harus dikirim dalam \`hari\` hari. Urutan paket **nggak boleh diubah** — tiap hari kapal memuat paket berikutnya secara berurutan sampai kapasitasnya penuh.

Cari **kapasitas terkecil** yang memungkinkan semua paket terkirim dalam \`hari\` hari.`,
    constraints: ['1 ≤ jumlah paket ≤ 50.000', '1 ≤ berat[i] ≤ 500', '1 ≤ hari ≤ jumlah paket'],
    hints: [
      'Kalau kapasitasnya diketahui, ngecek "cukup nggak dalam sekian hari" itu gampang — sekali jalan hitung berapa hari yang dibutuhkan.',
      'Jawabannya ada di antara berat paket terberat dan total semua berat. Sifatnya monoton: kalau kapasitas X cukup, X+1 juga cukup. Binary search di rentang jawaban.',
    ],
    fn: 'shipDays',
    params: [{ name: 'berat', type: 'int[]' }, { name: 'hari', type: 'int' }],
    ret: 'int',
    samples: [
      { in: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5], out: 15, note: 'Bagi jadi (1..5)(6,7)(8)(9)(10)' },
      { in: [[3, 2, 2, 4, 1, 4], 3], out: 6, note: '(3,2)(2,4)(1,4)' },
    ],
    tests: [
      [[1], 1],
      [[1, 2, 3, 1, 1], 4],
      [[10, 10, 10], 3],
      [[500, 1, 1, 1], 1],
      [Array.from({ length: 20000 }, (_, i) => (i % 500) + 1), 700],
      [Array.from({ length: 5000 }, () => 7), 5000],
    ],
    solution: (berat, hari) => {
      let lo = 0, hi = 0;
      for (const w of berat) { lo = Math.max(lo, w); hi += w; }
      const bisa = (cap) => {
        let d = 1, cur = 0;
        for (const w of berat) {
          if (cur + w > cap) { d++; cur = 0; }
          cur += w;
        }
        return d <= hari;
      };
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (bisa(mid)) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    },
  },

  {
    id: 'ruang-rapat',
    title: 'Ruang Rapat Minimum',
    tagline: 'Berapa ruangan supaya nggak ada yang bentrok',
    statement: `\`jadwal\` berisi rapat dalam bentuk \`[mulai, selesai]\`. Satu ruangan cuma bisa dipakai satu rapat pada satu waktu.

Cari **jumlah ruangan minimum** supaya semua rapat kebagian tempat.

Rapat yang selesai jam 10 dan rapat yang mulai jam 10 **boleh** pakai ruangan yang sama.`,
    constraints: ['0 ≤ jumlah rapat ≤ 50.000', '0 ≤ mulai < selesai ≤ 1.000.000'],
    hints: [
      'Jawabannya sama dengan jumlah rapat terbanyak yang berlangsung bersamaan pada satu titik waktu.',
      'Pisahkan semua waktu mulai dan waktu selesai jadi dua daftar terurut, lalu jalan bareng: tiap "mulai" menambah pemakaian, tiap "selesai" mengurangi. Catat puncaknya.',
    ],
    fn: 'minRooms',
    params: [{ name: 'jadwal', type: 'int[][]' }],
    ret: 'int',
    samples: [
      { in: [[[0, 30], [5, 10], [15, 20]]], out: 2, note: 'Rapat pertama tabrakan dengan dua lainnya' },
      { in: [[[7, 10], [2, 4]]], out: 1, note: 'Nggak ada yang bentrok' },
    ],
    tests: [
      [[]],
      [[[1, 5]]],
      [[[1, 5], [5, 9]]],
      [[[1, 10], [2, 9], [3, 8], [4, 7]]],
      [[[0, 1], [0, 1], [0, 1], [2, 3]]],
      [Array.from({ length: 6000 }, (_, i) => [i, i + 3])],
    ],
    solution: (jadwal) => {
      const mulai = jadwal.map((r) => r[0]).sort((a, b) => a - b);
      const selesai = jadwal.map((r) => r[1]).sort((a, b) => a - b);
      let i = 0, j = 0, cur = 0, best = 0;
      while (i < mulai.length) {
        if (mulai[i] < selesai[j]) { cur++; i++; best = Math.max(best, cur); }
        else { cur--; j++; }
      }
      return best;
    },
  },

  {
    id: 'pecah-kata',
    title: 'Pecah Kalimat',
    tagline: 'Bisa nggak dipotong pas jadi kata-kata di kamus',
    statement: `Diberikan string \`s\` tanpa spasi dan sebuah \`kamus\`. Kembalikan \`true\` kalau \`s\` bisa dipotong-potong tepat menjadi rangkaian kata yang semuanya ada di kamus.

Satu kata boleh dipakai berkali-kali.`,
    constraints: ['0 ≤ panjang s ≤ 3.000', '0 ≤ jumlah kata di kamus ≤ 1.000', '1 ≤ panjang tiap kata ≤ 30'],
    hints: [
      'Rakus dari kiri nggak aman: potongan pertama yang cocok belum tentu bikin sisanya bisa dipecah. Perlu backtracking — atau dp.',
      'dp[i] = benar kalau s[0..i) bisa dipecah. dp[i] benar kalau ada j < i dengan dp[j] benar dan potongan s[j..i) ada di kamus.',
    ],
    fn: 'wordBreak',
    params: [{ name: 's', type: 'string' }, { name: 'kamus', type: 'string[]' }],
    ret: 'bool',
    samples: [
      { in: ['nasigoreng', ['nasi', 'goreng', 'go']], out: true, note: 'nasi + goreng' },
      { in: ['catsandog', ['cats', 'dog', 'sand', 'and', 'cat']], out: false, note: 'Selalu ada sisa yang nggak kepotong' },
    ],
    tests: [
      ['', ['a']],
      ['a', []],
      ['aaaaaaa', ['a', 'aa', 'aaa']],
      ['leetcode', ['leet', 'code']],
      ['applepenapple', ['apple', 'pen']],
      ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab', ['a', 'aa', 'aaa', 'aaaa', 'aaaaa']],
      ['ngodingsampaisubuh', ['ngoding', 'sampai', 'subuh', 'sub']],
    ],
    solution: (s, kamus) => {
      const set = new Set(kamus);
      const n = s.length;
      const dp = new Array(n + 1).fill(false);
      dp[0] = true;
      let maxLen = 0;
      for (const w of kamus) maxLen = Math.max(maxLen, w.length);
      for (let i = 1; i <= n; i++) {
        for (let j = Math.max(0, i - maxLen); j < i; j++) {
          if (dp[j] && set.has(s.slice(j, i))) { dp[i] = true; break; }
        }
      }
      return dp[n];
    },
  },
];
