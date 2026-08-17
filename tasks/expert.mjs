// Level Expert — DP bitmask, graph berbobot, parsing, divide & conquer,
// binary search on answer. Ini yang biasanya bikin orang buka tab baru.

export default [
  {
    id: 'median-dua-array',
    title: 'Median Dua Array',
    tagline: 'Cari titik tengah tanpa menggabungkan',
    statement: `\`a\` dan \`b\` dua array yang masing-masing sudah terurut menaik. Cari **median** dari gabungan keduanya.

Kalau total jumlah elemennya genap, median adalah rata-rata dua nilai tengah.

Menggabungkan lalu mengurutkan itu O(n+m) dan bakal lolos di sini — tapi soal aslinya minta **O(log(n+m))**. Coba kejar itu.`,
    constraints: ['0 ≤ panjang a, b ≤ 100.000', 'a dan b nggak boleh dua-duanya kosong', '-1.000.000 ≤ nilai ≤ 1.000.000'],
    hints: [
      'Median = titik potong yang membagi gabungan jadi dua bagian sama banyak, di mana semua isi kiri ≤ semua isi kanan.',
      'Binary search di array yang lebih pendek: tentukan berapa elemen yang diambil dari a, sisanya otomatis dari b. Cek empat nilai di perbatasan.',
    ],
    fn: 'medianDua',
    params: [{ name: 'a', type: 'int[]' }, { name: 'b', type: 'int[]' }],
    ret: 'float',
    samples: [
      { in: [[1, 3], [2]], out: 2, note: 'Gabungan [1,2,3], tengahnya 2' },
      { in: [[1, 2], [3, 4]], out: 2.5, note: 'Gabungan [1,2,3,4], rata-rata 2 dan 3' },
    ],
    tests: [
      [[], [1]],
      [[2], []],
      [[1, 1], [1, 1]],
      [[0, 0], [0, 0]],
      [[-5, -3, -1], [2, 4]],
      [[1, 2, 3, 4, 5, 6, 7, 8, 9], [10]],
      [Array.from({ length: 5000 }, (_, i) => i * 2), Array.from({ length: 4999 }, (_, i) => i * 2 + 1)],
    ],
    solution: (a, b) => {
      const all = [...a, ...b].sort((x, y) => x - y);
      const n = all.length;
      return n % 2 ? all[(n - 1) / 2] : (all[n / 2 - 1] + all[n / 2]) / 2;
    },
  },

  {
    id: 'bagi-tugas',
    title: 'Bagi Tugas',
    tagline: 'Satu orang satu tugas, total biaya sekecil mungkin',
    statement: `\`biaya[i][j]\` adalah biaya kalau orang ke-\`i\` mengerjakan tugas ke-\`j\`. Jumlah orang sama dengan jumlah tugas.

Tiap orang dapat **tepat satu** tugas dan tiap tugas dikerjakan **tepat satu** orang. Cari total biaya terkecil.

Mencoba semua kemungkinan itu \`n!\` — untuk n = 12 sudah 479 juta susunan. Perlu cara yang lebih pintar.`,
    constraints: ['1 ≤ n ≤ 13', '0 ≤ biaya[i][j] ≤ 10.000'],
    hints: [
      'Yang menentukan keputusan berikutnya cuma satu hal: tugas mana saja yang sudah terpakai. Orang keberapa yang sedang dibagi bisa disimpulkan dari jumlah tugas terpakai.',
      'Simpan himpunan tugas terpakai sebagai bit dalam satu bilangan. dp[mask] = biaya termurah setelah membagi sebanyak popcount(mask) orang pertama.',
    ],
    fn: 'assignTasks',
    params: [{ name: 'biaya', type: 'int[][]' }],
    ret: 'int',
    samples: [
      { in: [[[9, 2], [4, 7]]], out: 6, note: 'Orang 0 ambil tugas 1 (2), orang 1 ambil tugas 0 (4)' },
      { in: [[[5]]], out: 5, note: 'Cuma satu pilihan' },
    ],
    tests: [
      [[[1, 2, 3], [3, 1, 2], [2, 3, 1]]],
      [[[0, 0], [0, 0]]],
      [[[10, 1, 1], [1, 10, 1], [1, 1, 10]]],
      [[[7, 3, 9, 2], [4, 8, 1, 6], [5, 2, 7, 3], [9, 4, 2, 8]]],
      [Array.from({ length: 11 }, (_, i) => Array.from({ length: 11 }, (_, j) => ((i * 7 + j * 13) % 23) + 1))],
      [Array.from({ length: 13 }, (_, i) => Array.from({ length: 13 }, (_, j) => ((i * i + j * 5) % 31) + 1))],
    ],
    solution: (biaya) => {
      const n = biaya.length;
      const size = 1 << n;
      const dp = new Array(size).fill(Infinity);
      dp[0] = 0;
      for (let mask = 0; mask < size; mask++) {
        if (dp[mask] === Infinity) continue;
        let i = 0;
        for (let m = mask; m; m &= m - 1) i++;
        if (i === n) continue;
        for (let j = 0; j < n; j++) {
          if (mask & (1 << j)) continue;
          const next = mask | (1 << j);
          const cost = dp[mask] + biaya[i][j];
          if (cost < dp[next]) dp[next] = cost;
        }
      }
      return dp[size - 1];
    },
    brute: (biaya) => {
      const n = biaya.length;
      let best = Infinity;
      const used = new Array(n).fill(false);
      const go = (i, sum) => {
        if (sum >= best) return;
        if (i === n) { best = sum; return; }
        for (let j = 0; j < n; j++) {
          if (used[j]) continue;
          used[j] = true;
          go(i + 1, sum + biaya[i][j]);
          used[j] = false;
        }
      };
      go(0, 0);
      return best;
    },
    bruteMax: 8,
  },

  {
    id: 'knapsack',
    title: 'Ransel Terbatas',
    tagline: 'Muat yang paling berharga, jangan sampai jebol',
    statement: `Ada \`n\` barang; barang ke-\`i\` punya \`berat[i]\` dan \`nilai[i]\`. Ranselmu cuma kuat sampai \`kapasitas\`.

Tiap barang boleh diambil **paling banyak sekali**. Cari total nilai terbesar yang bisa dibawa.`,
    constraints: ['1 ≤ n ≤ 500', '1 ≤ berat[i] ≤ 1.000', '0 ≤ nilai[i] ≤ 10.000', '0 ≤ kapasitas ≤ 5.000'],
    hints: [
      'Rakus berdasarkan rasio nilai/berat itu benar untuk ransel yang barangnya bisa dipotong — tapi di sini nggak bisa. Perlu dp.',
      'dp[w] = nilai terbaik dengan sisa kapasitas w. Proses barang satu per satu, dan **iterasi kapasitasnya dari besar ke kecil** — kalau dari kecil, satu barang bisa kepakai dua kali.',
    ],
    fn: 'knapsack',
    params: [
      { name: 'berat', type: 'int[]' },
      { name: 'nilai', type: 'int[]' },
      { name: 'kapasitas', type: 'int' },
    ],
    ret: 'int',
    samples: [
      { in: [[1, 3, 4, 5], [1, 4, 5, 7], 7], out: 9, note: 'Ambil barang berat 3 dan 4 → nilai 4 + 5' },
      { in: [[5], [10], 3], out: 0, note: 'Nggak ada yang muat' },
    ],
    tests: [
      [[1], [5], 1],
      [[2, 2, 2], [3, 3, 3], 4],
      [[1, 2, 3], [6, 10, 12], 5],
      [[10, 20, 30], [60, 100, 120], 50],
      [
        Array.from({ length: 200 }, (_, i) => ((i * 37) % 97) + 1),
        Array.from({ length: 200 }, (_, i) => ((i * 53) % 89) + 1),
        1500,
      ],
    ],
    solution: (berat, nilai, kapasitas) => {
      const dp = new Array(kapasitas + 1).fill(0);
      for (let i = 0; i < berat.length; i++) {
        for (let w = kapasitas; w >= berat[i]; w--) {
          const v = dp[w - berat[i]] + nilai[i];
          if (v > dp[w]) dp[w] = v;
        }
      }
      return dp[kapasitas];
    },
  },

  {
    id: 'hitung-inversi',
    title: 'Hitung Inversi',
    tagline: 'Sepasang angka yang urutannya kebalik',
    statement: `Sebuah **inversi** adalah pasangan indeks \`i < j\` di mana \`nums[i] > nums[j]\` — dua angka yang posisinya terbalik dari seharusnya.

Hitung total inversi di \`nums\`. Ini ukuran "seberapa berantakan" sebuah array.

Targetnya O(n log n). Cara polos O(n²) — cek semua pasangan — mungkin masih lolos di bahasa yang cepat, tapi itu bukan jawaban yang dicari.`,
    constraints: ['0 ≤ panjang nums ≤ 100.000', '-1.000.000 ≤ nums[i] ≤ 1.000.000'],
    hints: [
      'Perhatikan apa yang terjadi pas merge sort menggabungkan dua bagian: kalau elemen dari bagian kanan diambil duluan, dia melompati semua sisa elemen di bagian kiri.',
      'Setiap lompatan itu jumlahnya persis banyak inversi — hitung sambil merge. Alternatif lain: Fenwick tree setelah kompresi nilai.',
    ],
    fn: 'countInversions',
    params: [{ name: 'nums', type: 'int[]' }],
    ret: 'int',
    samples: [
      { in: [[2, 4, 1, 3, 5]], out: 3, note: 'Pasangan (2,1), (4,1), (4,3)' },
      { in: [[1, 2, 3]], out: 0, note: 'Sudah terurut' },
      { in: [[3, 2, 1]], out: 3, note: 'Terbalik total' },
    ],
    tests: [
      [[]],
      [[1]],
      [[1, 1, 1, 1]],
      [[5, 4, 3, 2, 1]],
      [[1, 3, 5, 2, 4, 6]],
      [Array.from({ length: 20000 }, (_, i) => (i * 2654435761) % 100003)],
    ],
    solution: (nums) => {
      let count = 0;
      const buf = new Array(nums.length);
      const sort = (arr, lo, hi) => {
        if (hi - lo < 2) return;
        const mid = (lo + hi) >> 1;
        sort(arr, lo, mid);
        sort(arr, mid, hi);
        let i = lo, j = mid, k = lo;
        while (i < mid && j < hi) {
          if (arr[i] <= arr[j]) buf[k++] = arr[i++];
          else { count += mid - i; buf[k++] = arr[j++]; }
        }
        while (i < mid) buf[k++] = arr[i++];
        while (j < hi) buf[k++] = arr[j++];
        for (let x = lo; x < hi; x++) arr[x] = buf[x];
      };
      sort([...nums], 0, nums.length);
      return count;
    },
    brute: (nums) => {
      let c = 0;
      for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) if (nums[i] > nums[j]) c++;
      return c;
    },
    bruteMax: 3000,
  },

  {
    id: 'jarak-terpendek',
    title: 'Jarak Terpendek',
    tagline: 'Dari satu titik ke seluruh kota',
    statement: `Ada \`n\` simpul bernomor \`0\` sampai \`n-1\`. \`jalur\` berisi \`[u, v, bobot]\` yang berarti ada jalan **dua arah** antara \`u\` dan \`v\` dengan panjang \`bobot\`.

Kembalikan array berisi jarak terpendek dari \`sumber\` ke tiap simpul, urut dari simpul 0 sampai n-1. Simpul yang nggak terjangkau diisi \`-1\`.

Boleh ada beberapa jalan antara sepasang simpul yang sama.`,
    constraints: ['1 ≤ n ≤ 5.000', '0 ≤ jumlah jalur ≤ 20.000', '1 ≤ bobot ≤ 10.000', '0 ≤ sumber < n'],
    hints: [
      'Karena bobotnya selalu positif, begitu sebuah simpul diambil dengan jarak terkecil, jaraknya nggak akan pernah membaik lagi. Itu inti Dijkstra.',
      'Ambil simpul dengan jarak sementara terkecil, lalu perbaiki tetangganya. Priority queue bikin ini cepat; tanpa itu tetap benar, cuma lebih lambat.',
    ],
    fn: 'dijkstra',
    params: [
      { name: 'n', type: 'int' },
      { name: 'jalur', type: 'int[][]' },
      { name: 'sumber', type: 'int' },
    ],
    ret: 'int[]',
    samples: [
      { in: [4, [[0, 1, 1], [1, 2, 2], [0, 2, 5], [2, 3, 1]], 0], out: [0, 1, 3, 4], note: 'Ke simpul 2 lewat 1 (1+2=3) lebih murah daripada langsung (5)' },
      { in: [3, [[0, 1, 4]], 0], out: [0, 4, -1], note: 'Simpul 2 terisolasi' },
    ],
    tests: [
      [1, [], 0],
      [2, [], 1],
      [3, [[0, 1, 1], [1, 2, 1], [0, 2, 10]], 2],
      [5, [[0, 1, 2], [0, 1, 7], [1, 2, 3], [2, 3, 1], [3, 4, 1], [0, 4, 100]], 0],
      [6, [[0, 1, 1], [1, 0, 1], [2, 3, 5], [3, 4, 5], [4, 5, 5]], 3],
      [
        800,
        Array.from({ length: 3000 }, (_, i) => [i % 800, (i * 7 + 3) % 800, ((i * 13) % 50) + 1]),
        7,
      ],
    ],
    solution: (n, jalur, sumber) => {
      const adj = Array.from({ length: n }, () => []);
      for (const [u, v, w] of jalur) {
        adj[u].push([v, w]);
        adj[v].push([u, w]);
      }
      const dist = new Array(n).fill(Infinity);
      dist[sumber] = 0;
      // binary heap sederhana
      const heap = [[0, sumber]];
      const push = (item) => {
        heap.push(item);
        let i = heap.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (heap[p][0] <= heap[i][0]) break;
          [heap[p], heap[i]] = [heap[i], heap[p]];
          i = p;
        }
      };
      const pop = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length) {
          heap[0] = last;
          let i = 0;
          for (;;) {
            const l = 2 * i + 1, r = l + 1;
            let s = i;
            if (l < heap.length && heap[l][0] < heap[s][0]) s = l;
            if (r < heap.length && heap[r][0] < heap[s][0]) s = r;
            if (s === i) break;
            [heap[s], heap[i]] = [heap[i], heap[s]];
            i = s;
          }
        }
        return top;
      };
      while (heap.length) {
        const [d, u] = pop();
        if (d > dist[u]) continue;
        for (const [v, w] of adj[u]) {
          if (d + w < dist[v]) { dist[v] = d + w; push([dist[v], v]); }
        }
      }
      return dist.map((d) => (d === Infinity ? -1 : d));
    },
  },

  {
    id: 'regex-mini',
    title: 'Regex Mini',
    tagline: 'Titik dan bintang, cuma itu',
    statement: `Cocokkan string \`s\` dengan pola \`pola\` yang cuma mengenal dua karakter khusus:

- \`.\` cocok dengan **satu** karakter apa pun
- \`*\` berarti karakter **tepat sebelumnya** boleh muncul nol kali atau lebih

Kecocokan harus menutupi **seluruh** string, bukan sebagian. Pola dijamin valid (nggak diawali \`*\`, nggak ada \`**\`).`,
    constraints: ['0 ≤ panjang s ≤ 1.000', '0 ≤ panjang pola ≤ 1.000', 'Huruf kecil, titik, dan bintang'],
    hints: [
      'Bandingkan dari belakang atau pakai dp dua dimensi: cocok[i][j] = apakah s[0..i) cocok dengan pola[0..j).',
      'Yang bikin pusing itu bintang: dia bisa berarti "lewati pasangan huruf+bintang ini" (nol kali) atau "pakai sekali lagi lalu tetap di pola yang sama".',
    ],
    fn: 'regexMatch',
    params: [{ name: 's', type: 'string' }, { name: 'pola', type: 'string' }],
    ret: 'bool',
    samples: [
      { in: ['aab', 'c*a*b'], out: true, note: 'c* jadi nol kali, a* jadi dua kali' },
      { in: ['mississippi', 'mis*is*p*.'], out: false, note: 'Pola habis sebelum string habis' },
      { in: ['ab', '.*'], out: true, note: 'Titik-bintang menelan apa saja' },
    ],
    tests: [
      ['', ''],
      ['', 'a*'],
      ['a', ''],
      ['aa', 'a'],
      ['aa', 'a*'],
      ['ab', '.*c'],
      ['aaa', 'ab*a*c*a'],
      ['abcd', 'd*'],
      ['a'.repeat(60), 'a*'.repeat(30)],
      ['ngoding', 'n.*g'],
    ],
    solution: (s, pola) => {
      const n = s.length, m = pola.length;
      const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(false));
      dp[0][0] = true;
      for (let j = 1; j <= m; j++) if (pola[j - 1] === '*' && j >= 2) dp[0][j] = dp[0][j - 2];
      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
          const p = pola[j - 1];
          if (p === '*') {
            const prev = pola[j - 2];
            dp[i][j] = (j >= 2 && dp[i][j - 2]) || ((prev === '.' || prev === s[i - 1]) && dp[i - 1][j]);
          } else {
            dp[i][j] = (p === '.' || p === s[i - 1]) && dp[i - 1][j - 1];
          }
        }
      }
      return dp[n][m];
    },
  },

  {
    id: 'jendela-maksimum',
    title: 'Maksimum Jendela Geser',
    tagline: 'Nilai terbesar di tiap jendela selebar k',
    statement: `Sebuah jendela selebar \`k\` bergeser dari kiri ke kanan sepanjang \`nums\`, satu langkah per waktu.

Kembalikan nilai **terbesar** di tiap posisi jendela, urut dari kiri.

Menghitung ulang maksimum di tiap posisi itu O(n·k). Targetnya O(n) — tiap elemen cuma boleh masuk dan keluar sekali.`,
    constraints: ['1 ≤ panjang nums ≤ 200.000', '1 ≤ k ≤ panjang nums', '-1.000.000 ≤ nums[i] ≤ 1.000.000'],
    hints: [
      'Kalau ada angka yang lebih besar masuk dari kanan, semua angka lebih kecil di sebelah kirinya nggak akan pernah jadi maksimum lagi. Buang saja.',
      'Simpan **indeks** dalam deque yang isinya selalu menurun. Kepala deque = maksimum jendela sekarang; buang kepala kalau sudah keluar jendela.',
    ],
    fn: 'slidingMax',
    params: [{ name: 'nums', type: 'int[]' }, { name: 'k', type: 'int' }],
    ret: 'int[]',
    samples: [
      { in: [[1, 3, -1, -3, 5, 3, 6, 7], 3], out: [3, 3, 5, 5, 6, 7], note: 'Enam posisi jendela' },
      { in: [[9], 1], out: [9], note: 'Jendela selebar 1 = arraynya sendiri' },
    ],
    tests: [
      [[1, 2, 3, 4, 5], 5],
      [[5, 4, 3, 2, 1], 2],
      [[-7, -8, 7, 5, 7, 1, 6, 0], 4],
      [[1, 1, 1, 1], 2],
      [[7, 2, 4], 2],
      [Array.from({ length: 10000 }, (_, i) => ((i * 7919) % 2001) - 1000), 500],
    ],
    solution: (nums, k) => {
      const out = [];
      const dq = [];
      for (let i = 0; i < nums.length; i++) {
        while (dq.length && dq[0] <= i - k) dq.shift();
        while (dq.length && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();
        dq.push(i);
        if (i >= k - 1) out.push(nums[dq[0]]);
      }
      return out;
    },
    brute: (nums, k) => {
      const out = [];
      for (let i = 0; i + k <= nums.length; i++) out.push(Math.max(...nums.slice(i, i + k)));
      return out;
    },
    bruteMax: 3000,
  },

  {
    id: 'urutan-kursus',
    title: 'Urutan Kursus',
    tagline: 'Ambil mata kuliah tanpa melanggar prasyarat',
    statement: `Ada \`n\` kursus bernomor \`0\` sampai \`n-1\`. \`syarat\` berisi pasangan \`[a, b]\` yang artinya kursus \`a\` **baru boleh diambil setelah** kursus \`b\` selesai.

Kembalikan satu urutan pengambilan yang valid. Kalau ada beberapa urutan valid, pilih yang **paling kecil secara leksikografis** (nomor kecil didahulukan kalau sama-sama boleh diambil).

Kalau prasyaratnya melingkar sehingga nggak mungkin selesai, kembalikan array kosong.`,
    constraints: ['1 ≤ n ≤ 20.000', '0 ≤ jumlah syarat ≤ 50.000', 'Boleh ada pasangan syarat yang sama persis'],
    hints: [
      'Hitung berapa prasyarat yang belum selesai untuk tiap kursus. Yang hitungannya nol siap diambil sekarang.',
      'Kalau ada beberapa yang siap, mana yang dipilih menentukan urutan akhirnya — antrean biasa nggak cukup, butuh yang selalu mengeluarkan nomor terkecil.',
    ],
    fn: 'courseOrder',
    params: [{ name: 'n', type: 'int' }, { name: 'syarat', type: 'int[][]' }],
    ret: 'int[]',
    samples: [
      { in: [4, [[1, 0], [2, 0], [3, 1], [3, 2]]], out: [0, 1, 2, 3], note: '0 dulu, lalu 1 dan 2 (pilih yang kecil), terakhir 3' },
      { in: [2, [[0, 1], [1, 0]]], out: [], note: 'Saling menunggu — mustahil' },
    ],
    tests: [
      [1, []],
      [3, []],
      [3, [[2, 1], [1, 0]]],
      [5, [[0, 4], [1, 4], [2, 4], [3, 4]]],
      [4, [[1, 0], [1, 0], [2, 1]]],
      [6, [[1, 0], [2, 1], [3, 2], [1, 3]]],
      [
        3000,
        Array.from({ length: 6000 }, (_, i) => [(i % 2999) + 1, i % 2999]),
      ],
    ],
    solution: (n, syarat) => {
      const adj = Array.from({ length: n }, () => []);
      const indeg = new Array(n).fill(0);
      for (const [a, b] of syarat) {
        adj[b].push(a);
        indeg[a]++;
      }
      // min-heap indeks siap
      const heap = [];
      const push = (x) => {
        heap.push(x);
        let i = heap.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (heap[p] <= heap[i]) break;
          [heap[p], heap[i]] = [heap[i], heap[p]];
          i = p;
        }
      };
      const pop = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length) {
          heap[0] = last;
          let i = 0;
          for (;;) {
            const l = 2 * i + 1, r = l + 1;
            let s = i;
            if (l < heap.length && heap[l] < heap[s]) s = l;
            if (r < heap.length && heap[r] < heap[s]) s = r;
            if (s === i) break;
            [heap[s], heap[i]] = [heap[i], heap[s]];
            i = s;
          }
        }
        return top;
      };
      for (let i = 0; i < n; i++) if (indeg[i] === 0) push(i);
      const out = [];
      while (heap.length) {
        const u = pop();
        out.push(u);
        for (const v of adj[u]) if (--indeg[v] === 0) push(v);
      }
      return out.length === n ? out : [];
    },
  },

  {
    id: 'bagi-adil',
    title: 'Bagi Beban Paling Adil',
    tagline: 'Pecah jadi k bagian, ringankan yang terberat',
    statement: `Bagi \`nums\` menjadi tepat \`k\` bagian **berurutan** yang nggak boleh kosong. Tiap bagian punya total, dan yang jadi masalah adalah bagian dengan total **terbesar**.

Cari nilai terkecil yang mungkin untuk total terbesar itu.`,
    constraints: ['1 ≤ panjang nums ≤ 50.000', '1 ≤ k ≤ panjang nums', '0 ≤ nums[i] ≤ 10.000'],
    hints: [
      'Susah kalau dipikir sebagai "cari pembagiannya". Balik pertanyaannya: kalau batas maksimum per bagian ditetapkan X, cukup nggak k bagian?',
      'Pengecekan itu rakus dan sekali jalan. Dan sifatnya monoton terhadap X — jadi binary search di rentang [nilai terbesar, total semua].',
    ],
    fn: 'splitLargest',
    params: [{ name: 'nums', type: 'int[]' }, { name: 'k', type: 'int' }],
    ret: 'int',
    samples: [
      { in: [[7, 2, 5, 10, 8], 2], out: 18, note: '[7,2,5] dan [10,8] — terbesar 18' },
      { in: [[1, 2, 3, 4, 5], 5], out: 5, note: 'Tiap angka jadi bagian sendiri' },
    ],
    tests: [
      [[1], 1],
      [[0, 0, 0], 2],
      [[10, 10, 10, 10], 2],
      [[1, 4, 4], 3],
      [[2, 3, 1, 2, 4, 3], 3],
      [Array.from({ length: 20000 }, (_, i) => (i % 97) + 1), 350],
    ],
    solution: (nums, k) => {
      let lo = 0, hi = 0;
      for (const x of nums) { lo = Math.max(lo, x); hi += x; }
      const cukup = (limit) => {
        let parts = 1, cur = 0;
        for (const x of nums) {
          if (cur + x > limit) { parts++; cur = 0; }
          cur += x;
        }
        return parts <= k;
      };
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (cukup(mid)) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    },
  },

  {
    id: 'kalkulator',
    title: 'Kalkulator Ekspresi',
    tagline: 'Hitung sendiri, tanpa eval',
    statement: `Hitung nilai sebuah ekspresi matematika dalam bentuk string. Yang bisa muncul: bilangan bulat non-negatif, operator \`+\` \`-\` \`*\` \`/\`, kurung \`(\` \`)\`, dan spasi.

Aturannya seperti biasa: perkalian dan pembagian didahulukan, kurung mengalahkan semuanya. **Pembagian dibulatkan ke arah nol** (7/2 = 3, dan -7/2 = -3).

Ekspresi dijamin valid. Dan ya — pakai \`eval\` bawaan bahasa itu curang.`,
    constraints: ['1 ≤ panjang ekspresi ≤ 5.000', 'Hasil antara dan hasil akhir muat di bilangan 64-bit'],
    hints: [
      'Tanpa kurung, ini bisa diselesaikan pakai stack: dorong angka, tapi untuk * dan / langsung gabungkan dengan angka teratas.',
      'Kurung tinggal bikin masalahnya berulang: begitu ketemu "(", selesaikan isinya dulu (rekursi atau simpan keadaan di stack), hasilnya diperlakukan seperti satu angka biasa.',
    ],
    fn: 'calculate',
    params: [{ name: 'ekspresi', type: 'string' }],
    ret: 'int',
    samples: [
      { in: ['2+3*4'], out: 14, note: 'Perkalian duluan' },
      { in: ['(2+3)*4'], out: 20, note: 'Kurung mengubah urutan' },
      { in: ['14-3/2'], out: 13, note: '3/2 dibulatkan ke arah nol jadi 1' },
    ],
    tests: [
      ['1'],
      ['1 + 1'],
      [' 2-1 + 2 '],
      ['(1+(4+5+2)-3)+(6+8)'],
      ['2*(5+5*2)/3+(6/2+8)'],
      ['100/3/3'],
      ['0-2*3'],
      ['((((1+2))))*3'],
      ['1000000*1000000/1000000'],
    ],
    solution: (ekspresi) => {
      let i = 0;
      const s = ekspresi;
      const parseExpr = () => {
        const stack = [];
        let sign = '+';
        let num = 0;
        for (;;) {
          const ch = s[i];
          if (ch === ' ') { i++; continue; }
          if (ch >= '0' && ch <= '9') {
            num = num * 10 + (ch.charCodeAt(0) - 48);
            i++;
            continue;
          }
          if (ch === '(') { i++; num = parseExpr(); continue; }
          // operator, ')' atau akhir string
          if (sign === '+') stack.push(num);
          else if (sign === '-') stack.push(-num);
          else if (sign === '*') stack.push(stack.pop() * num);
          else stack.push(Math.trunc(stack.pop() / num));
          num = 0;
          if (ch === undefined || ch === ')') { i++; break; }
          sign = ch;
          i++;
        }
        return stack.reduce((a, b) => a + b, 0);
      };
      return parseExpr();
    },
  },
];
