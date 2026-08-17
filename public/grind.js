// ─────────────────────────────────────────────────────────────────────────────
// Grinding mode — LeetCode-style, nempel di atas playground yang sudah ada.
//
// Yang ditanggung kode supaya user nggak perlu mikirin: stub fungsi
// di-generate per bahasa, input di-encode, harness ditempel, hasil di-decode
// dan dibandingin sama kunci. User cuma nulis satu fungsi lalu tekan Run.
//
// Semua progres & draft kode disimpan di localStorage — nggak ada akun, nggak
// ada spinner buat data sendiri.
// ─────────────────────────────────────────────────────────────────────────────

import {
  LANG, LANG_KEYS, buildProgram, encodeStdin, parseOutput,
  sameValue, fmtValue, stubFor, preludeLines,
} from './grind-harness.js';
import { LEVELS, TASKS } from './tasks-index.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const clip = (s, n) => (s.length > n ? s.slice(0, n) + ` … (${s.length} karakter)` : s);

const KEY = {
  mode: 'pg-mode',
  lang: 'pg-grind-lang',
  last: 'pg-grind-last',
  progress: 'pg-grind-progress',
  height: 'pg-grind-h',
  draft: (id, lang) => `pg-grind-draft:${id}:${lang}`,
};

const store = {
  get(k, fallback = null) {
    try {
      const v = localStorage.getItem(k);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

const state = {
  mode: 'play',
  task: null,       // data soal yang lagi kebuka
  lang: 'JavaScript',
  running: false,
  playCode: null,   // kode playground yang dititipin pas pindah mode
  playLang: null,
  undo: null,
};

let progress = store.get(KEY.progress, {}) || {};
const taskCache = new Map();
const byId = new Map(TASKS.map((t) => [t.id, t]));

// ── data soal ────────────────────────────────────────────────────────────────

function fetchTask(id) {
  if (taskCache.has(id)) return taskCache.get(id);
  const p = fetch(`/tasks/${id}.json`)
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .catch((e) => { taskCache.delete(id); throw e; });
  taskCache.set(id, p);
  return p;
}

const solved = (id) => !!progress[id]?.solved;
const solvedIn = (level) => TASKS.filter((t) => t.level === level && solved(t.id)).length;
const totalSolved = () => TASKS.filter((t) => solved(t.id)).length;

function markProgress(id, didSolve) {
  const p = progress[id] ?? { solved: false, tries: 0 };
  p.tries++;
  if (didSolve && !p.solved) { p.solved = true; p.at = new Date().toISOString(); }
  progress[id] = p;
  store.set(KEY.progress, progress);
  paintProgress();
}

// ── markdown ringan buat teks soal ───────────────────────────────────────────

function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
function md(src) {
  return String(src)
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n');
      if (lines.every((l) => /^\s*-\s+/.test(l))) {
        return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*-\s+/, ''))}</li>`).join('')}</ul>`;
      }
      return `<p>${lines.map(inline).join('<br>')}</p>`;
    })
    .join('');
}

// ── render soal ──────────────────────────────────────────────────────────────

const levelLabel = (k) => LEVELS.find((l) => l.key === k)?.label ?? k;

function fmtArgs(task, args) {
  return task.params.map((p, i) => `${p.name} = ${clip(fmtValue(args[i], p.type), 220)}`).join(', ');
}

function signature(task) {
  return `${task.fn}(${task.params.map((p) => `${p.name}: ${p.type}`).join(', ')}) → ${task.ret}`;
}

function renderTask(task) {
  const samples = task.cases.slice(0, task.sampleCount);
  const html = `
    <div class="task-title">
      <h1>${esc(task.title)}</h1>
      <span class="task-lv lv-text-${task.level}">${esc(levelLabel(task.level))}</span>
    </div>
    <p class="task-tagline">${esc(task.tagline)}</p>
    ${md(task.statement)}

    <div class="task-sec">Fungsi</div>
    <div class="sample"><div class="sample-row"><span class="v">${esc(signature(task))}</span></div></div>

    <div class="task-sec">Contoh</div>
    ${samples.map((c, i) => `
      <div class="sample">
        <div class="sample-row"><span class="k">Input</span><span class="v">${esc(fmtArgs(task, c.in))}</span></div>
        <div class="sample-row"><span class="k">Output</span><span class="v">${esc(clip(fmtValue(c.out, task.ret), 300))}</span></div>
        ${c.note ? `<div class="sample-note">${esc(c.note)}</div>` : ''}
      </div>`).join('')}

    <div class="task-sec">Batasan</div>
    <ul class="constraint-list">${task.constraints.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>

    <div class="task-sec">Petunjuk</div>
    <div class="hint" id="hintBox"></div>
  `;
  $('#taskBody').innerHTML = html;
  renderHints(task, 0);
}

function renderHints(task, shown) {
  const box = $('#hintBox');
  if (!box) return;
  box.innerHTML =
    task.hints.slice(0, shown).map((h, i) => `<p class="hint-text"><strong>Petunjuk ${i + 1}.</strong> ${inline(h)}</p>`).join('') +
    (shown < task.hints.length
      ? `<button class="hint-btn" id="hintMore">${shown === 0 ? 'Buka petunjuk pertama' : `Masih stuck? Buka petunjuk ${shown + 1}`} →</button>`
      : `<p class="hint-btn" style="cursor:default">Petunjuknya habis. Sisanya lo yang tentuin — atau buka Diskusi.</p>`);
  const more = $('#hintMore');
  if (more) more.addEventListener('click', () => renderHints(task, shown + 1));
}

// ── bahasa ───────────────────────────────────────────────────────────────────

function buildLangSelect() {
  const sel = $('#grindLang');
  sel.innerHTML = LANG_KEYS.map((k) => `<option value="${esc(k)}">${esc(LANG[k].label)}</option>`).join('');
  sel.value = state.lang;
  sel.addEventListener('change', () => {
    saveDraft();
    state.lang = sel.value;
    store.set(KEY.lang, state.lang);
    loadCode();
    clearResults('Bahasa ganti — jalankan lagi buat ngecek.');
  });
}

function pickInitialLang() {
  const saved = store.get(KEY.lang);
  if (saved && LANG[saved]) return saved;
  const cur = window.PG?.currentLanguage?.();
  if (cur && LANG[cur]) return cur;
  return 'JavaScript';
}

// ── draft kode ───────────────────────────────────────────────────────────────

let saveTimer = null;

function saveDraft() {
  if (state.mode !== 'grind' || !state.task) return;
  const code = window.PG.getValue();
  store.set(KEY.draft(state.task.id, state.lang), code);
}

function flashSaved() {
  const el = $('#saveHint');
  el.textContent = 'Tersimpan ✓';
  el.classList.add('show');
  clearTimeout(flashSaved._t);
  flashSaved._t = setTimeout(() => el.classList.remove('show'), 1400);
}

function onEditorChanged() {
  if (state.mode !== 'grind' || !state.task) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { saveDraft(); flashSaved(); }, 500);
}

function loadCode() {
  const task = state.task;
  if (!task) return;
  const draft = store.get(KEY.draft(task.id, state.lang));
  window.PG.setHL(LANG[state.lang].monaco);
  window.PG.setValue(typeof draft === 'string' ? draft : stubFor(task, state.lang));
}

function resetCode() {
  if (!state.task) return;
  const before = window.PG.getValue();
  window.PG.setValue(stubFor(state.task, state.lang));
  saveDraft();
  toast('Kode dibalikin ke bentuk awal.', () => {
    window.PG.setValue(before);
    saveDraft();
  });
}

// ── toast + undo ─────────────────────────────────────────────────────────────

let toastTimer = null;
function toast(msg, undo) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>`;
  if (undo) {
    const b = document.createElement('button');
    b.textContent = 'Undo';
    b.addEventListener('click', () => { undo(); hideToast(); });
    el.appendChild(b);
  }
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, undo ? 7000 : 3000);
}
function hideToast() { $('#toast').classList.remove('show'); clearTimeout(toastTimer); }

// ── buka task ────────────────────────────────────────────────────────────────

async function openTask(id) {
  const meta = byId.get(id);
  if (!meta) return;
  saveDraft();
  $('#taskBody').innerHTML = `<p class="res-empty"><span class="spin"></span> Ambil soal…</p>`;
  let task;
  try {
    task = await fetchTask(id);
  } catch (e) {
    $('#taskBody').innerHTML = `<p class="res-empty">Gagal ambil soal (${esc(e.message)}). Cek koneksi, lalu pilih ulang.</p>`;
    return;
  }
  state.task = task;
  store.set(KEY.last, id);
  renderTask(task);
  loadCode();
  clearResults();
  paintTaskButton();
  paintProgress();
  renderBrowser();
}

function paintTaskButton() {
  const t = state.task;
  const btn = $('#taskBtn');
  if (!t) {
    btn.innerHTML = '<span class="lv-dot"></span><span class="tb-name">Pilih task</span><span>▾</span>';
    return;
  }
  const n = TASKS.filter((x) => x.level === t.level).findIndex((x) => x.id === t.id) + 1;
  btn.innerHTML = `<span class="lv-dot lv-${t.level}"></span><span class="tb-name">${esc(levelLabel(t.level))} ${n}. ${esc(t.title)}</span><span>▾</span>`;
}

function paintProgress() {
  const tag = $('#taskProgressTag');
  if (tag) tag.textContent = `${totalSolved()}/${TASKS.length} selesai`;
  const p = $('#tbProgress');
  if (p) {
    const pct = Math.round((totalSolved() / TASKS.length) * 100);
    p.innerHTML = `<span class="tb-bar"><span style="width:${pct}%"></span></span><span>${totalSolved()}/${TASKS.length}</span>`;
  }
}

// ── task browser ─────────────────────────────────────────────────────────────

let browserLevel = 'easy';

function renderBrowser() {
  $('#tbTabs').innerHTML = LEVELS.map((l) => `
    <button class="tb-tab" role="tab" data-level="${l.key}" aria-selected="${l.key === browserLevel}">
      <span class="lv-dot lv-${l.key}"></span>${esc(l.label)}
      <span class="cnt">${solvedIn(l.key)}/${TASKS.filter((t) => t.level === l.key).length}</span>
    </button>`).join('');

  const list = TASKS.filter((t) => t.level === browserLevel);
  $('#tbList').innerHTML = `<div class="tb-grid">${list.map((t, i) => `
    <button class="tb-card ${solved(t.id) ? 'solved' : ''} ${state.task?.id === t.id ? 'current' : ''}" data-id="${esc(t.id)}">
      <span class="num">${String(i + 1).padStart(2, '0')}</span>
      <span class="body">
        <span class="name">${esc(t.title)}</span>
        <span class="tag">${esc(t.tagline)}</span>
      </span>
      <span class="state">${solved(t.id) ? '✓' : progress[t.id]?.tries ? '·' : ''}</span>
    </button>`).join('')}</div>`;

  paintProgress();
}

function openBrowser() {
  if (state.task) browserLevel = state.task.level;
  renderBrowser();
  $('#taskBrowser').classList.add('show');
  $('#taskBrowser').setAttribute('aria-hidden', 'false');
  $('#tbScrim').classList.add('show');
}
function closeBrowser() {
  $('#taskBrowser').classList.remove('show');
  $('#taskBrowser').setAttribute('aria-hidden', 'true');
  $('#tbScrim').classList.remove('show');
}

function nextTaskId() {
  const cur = state.task;
  const order = [...TASKS];
  const from = cur ? order.findIndex((t) => t.id === cur.id) + 1 : 0;
  for (let i = 0; i < order.length; i++) {
    const t = order[(from + i) % order.length];
    if (!solved(t.id)) return t.id;
  }
  return order[(from) % order.length].id;
}

// ── jalanin test ─────────────────────────────────────────────────────────────

function setCollapsed(on) {
  $('#resultPane').classList.toggle('collapsed', on);
  $('#resultToggle').textContent = on ? '▴' : '▾';
  window.PG.relayout();
}

function clearResults(msg) {
  $('#resultSummary').textContent = msg ?? 'Belum dijalankan';
  $('#resultSummary').className = 'rh-summary';
  $('#resultBody').innerHTML = `<p class="res-empty">Tulis solusinya, lalu <strong>Run Test</strong> (⌘↵).<br>Semua test case dijalankan sekaligus.</p>`;
}

function caseName(task, i) {
  return i < task.sampleCount ? `Contoh ${i + 1}` : `Test ${i + 1}`;
}

function renderPending(task) {
  $('#resultBody').innerHTML = task.cases.map((c, i) => `
    <div class="res-row wait">
      <button class="res-line" data-i="${i}">
        <span class="res-mark">·</span>
        <span class="res-name">${caseName(task, i)}</span>
        <span class="res-peek">${esc(clip(fmtArgs(task, c.in), 90))}</span>
      </button>
    </div>`).join('');
  setCollapsed(false);
}

function fixLines(lang, text) {
  const off = preludeLines(lang);
  if (!off) return text;
  return String(text).replace(/(prog\.\w+:)(\d+)/g, (m, a, n) => a + Math.max(1, Number(n) - off));
}

function renderResults(task, { results, consoleOut }, ms) {
  const rows = task.cases.map((c, i) => {
    const r = results[i];
    if (!r) return { i, status: 'wait', c };
    if (!r.ok) return { i, status: 'fail', c, err: r.e };
    return { i, status: sameValue(r.v, c.out, task.ret) ? 'pass' : 'fail', c, got: r.v };
  });

  const passed = rows.filter((r) => r.status === 'pass').length;
  const all = passed === rows.length && rows.length > 0;
  const firstBad = rows.find((r) => r.status !== 'pass');

  const sum = $('#resultSummary');
  sum.textContent = `${passed}/${rows.length} lulus · ${ms}ms`;
  sum.className = 'rh-summary ' + (all ? 'ok' : 'bad');

  const banner = all
    ? `<div class="res-banner win">
         <div>
           <div class="big">Semua test lulus.</div>
           <div class="sub">${rows.length} case · ${ms}ms · ${esc(state.lang)}</div>
         </div>
         <span class="spacer"></span>
         <button class="run" id="nextTaskBtn">Task berikutnya →</button>
       </div>`
    : '';

  const body = rows.map((r) => {
    const mark = r.status === 'pass' ? '✓' : r.status === 'fail' ? '✗' : '·';
    const detail = r.status === 'wait'
      ? `<div class="res-kv"><span class="k">Status</span><span class="v">Program berhenti sebelum case ini dijalankan.</span></div>`
      : `
        <div class="res-kv"><span class="k">Input</span><span class="v">${esc(clip(fmtArgs(task, r.c.in), 600))}</span></div>
        <div class="res-kv good"><span class="k">Kunci</span><span class="v">${esc(clip(fmtValue(r.c.out, task.ret), 600))}</span></div>
        ${r.err !== undefined
          ? `<div class="res-kv bad"><span class="k">Error</span><span class="v">${esc(clip(String(r.err), 600))}</span></div>`
          : `<div class="res-kv ${r.status === 'pass' ? 'good' : 'bad'}"><span class="k">Hasil</span><span class="v">${esc(clip(fmtValue(r.got, task.ret), 600))}</span></div>`}
      `;
    return `
      <div class="res-row ${r.status} ${firstBad && firstBad.i === r.i ? 'open' : ''}">
        <button class="res-line" data-i="${r.i}">
          <span class="res-mark">${mark}</span>
          <span class="res-name">${caseName(task, r.i)}</span>
          <span class="res-peek">${esc(clip(fmtArgs(task, r.c.in), 90))}</span>
        </button>
        <div class="res-detail">${detail}</div>
      </div>`;
  }).join('');

  const cons = consoleOut
    ? `<div class="res-console"><span class="lbl">Output kamu</span><pre>${esc(clip(consoleOut, 4000))}</pre></div>`
    : '';

  $('#resultBody').innerHTML = banner + body + cons;

  const next = $('#nextTaskBtn');
  if (next) next.addEventListener('click', () => openTask(nextTaskId()));

  markProgress(task.id, all);
  renderBrowser();
}

function renderRunError(title, detail) {
  $('#resultSummary').textContent = title;
  $('#resultSummary').className = 'rh-summary bad';
  $('#resultBody').innerHTML = `<div class="res-error">${esc(clip(detail, 4000))}</div>`;
  setCollapsed(false);
}

async function runTests() {
  if (state.running) return;
  if (!state.task) { openBrowser(); return; }

  const task = state.task;
  const lang = state.lang;
  const compiler = window.PG.compilerFor(lang);
  if (!compiler) {
    renderRunError('bahasa nggak tersedia', `Compiler ${lang} lagi nggak ada di daftar runtime. Coba pilih bahasa lain.`);
    return;
  }

  saveDraft();
  renderPending(task);
  $('#resultSummary').innerHTML = '<span class="spin"></span> menjalankan…';
  $('#resultSummary').className = 'rh-summary';
  state.running = true;
  window.PG.setRunning(true);

  const t0 = performance.now();
  try {
    const program = buildProgram(task, lang, window.PG.getValue());
    const stdin = encodeStdin(task, lang, task.cases);
    const d = await window.PG.runWandbox({ compiler: compiler.name, code: program, stdin });
    const ms = Math.round(performance.now() - t0);

    const parsed = parseOutput(task, lang, d.program_output || '');
    if (!parsed) {
      const why = [d.compiler_error, d.program_error, d.program_output].filter(Boolean).join('\n').trim();
      const title = d.compiler_error ? 'gagal compile' : d.signal ? 'dihentikan paksa' : d.program_error ? 'error pas jalan' : 'nggak ada hasil';
      const extra = d.signal
        ? `\n\nProgram dihentikan (signal ${d.signal}) — biasanya kelamaan jalan atau kehabisan memori. Cek lagi kompleksitas solusinya.`
        : '';
      renderRunError(
        title,
        (fixLines(lang, why) || 'Program nggak ngasih output sama sekali.') + extra
      );
      markProgress(task.id, false);
    } else {
      renderResults(task, { results: parsed.results, consoleOut: parsed.console }, ms);
    }
  } catch (e) {
    renderRunError('gagal connect', `${e.message}\n(Wandbox API mungkin lagi sibuk — coba lagi sebentar lagi.)`);
  } finally {
    state.running = false;
    window.PG.setRunning(false);
  }
}

// ── pindah mode ──────────────────────────────────────────────────────────────

function setMode(mode, { remember = true } = {}) {
  if (mode === state.mode) return;

  if (mode === 'grind') {
    state.playCode = window.PG.getValue();
    state.playLang = window.PG.currentLanguage();
  } else {
    saveDraft();
  }

  state.mode = mode;
  document.body.dataset.mode = mode;
  if (remember) store.set(KEY.mode, mode);
  for (const b of document.querySelectorAll('.mode-btn')) {
    b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
  }
  $('#runLabel').textContent = mode === 'grind' ? 'Run Test' : 'Run';

  if (mode === 'grind') {
    if (!state.task) {
      const last = store.get(KEY.last);
      openTask(last && byId.has(last) ? last : TASKS[0].id);
    } else {
      loadCode();
    }
  } else if (state.playCode !== null) {
    window.PG.restorePlayground(state.playLang, state.playCode);
    state.playCode = null;
  }
  window.PG.relayout();
}

// ── resize panel hasil ───────────────────────────────────────────────────────

function wireResize() {
  const pane = $('#resultPane');
  const grip = $('#resultResize');
  const maxH = () => Math.max(140, window.innerHeight - 220);
  const saved = store.get(KEY.height);
  if (typeof saved === 'number' && saved > 80) pane.style.height = Math.min(saved, maxH()) + 'px';

  let dragging = false, startY = 0, startH = 0;
  grip.addEventListener('pointerdown', (e) => {
    dragging = true;
    startY = e.clientY;
    startH = pane.getBoundingClientRect().height;
    grip.classList.add('active');
    grip.setPointerCapture(e.pointerId);
  });
  grip.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const h = Math.min(Math.max(startH + (startY - e.clientY), 90), maxH());
    pane.style.height = h + 'px';
    window.PG.relayout();
  });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    grip.classList.remove('active');
    store.set(KEY.height, Math.round(pane.getBoundingClientRect().height));
    window.PG.relayout();
  };
  grip.addEventListener('pointerup', end);
  grip.addEventListener('pointercancel', end);
}

// ── wiring ───────────────────────────────────────────────────────────────────

function boot() {
  state.lang = pickInitialLang();
  buildLangSelect();
  wireResize();
  clearResults();
  paintTaskButton();
  paintProgress();

  for (const b of document.querySelectorAll('.mode-btn')) {
    b.addEventListener('click', () => setMode(b.dataset.mode));
  }

  $('#taskBtn').addEventListener('click', openBrowser);
  $('#tbClose').addEventListener('click', closeBrowser);
  $('#tbScrim').addEventListener('click', closeBrowser);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#taskBrowser').classList.contains('show')) closeBrowser();
  });

  $('#tbTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.tb-tab');
    if (!tab) return;
    browserLevel = tab.dataset.level;
    renderBrowser();
  });

  $('#tbList').addEventListener('click', (e) => {
    const card = e.target.closest('.tb-card');
    if (!card) return;
    closeBrowser();
    openTask(card.dataset.id);
  });
  // prefetch pas hover — biar soal muncul tanpa jeda pas diklik
  $('#tbList').addEventListener('pointerover', (e) => {
    const card = e.target.closest('.tb-card');
    if (card) fetchTask(card.dataset.id).catch(() => {});
  });

  $('#tbReset').addEventListener('click', () => {
    const before = progress;
    progress = {};
    store.set(KEY.progress, progress);
    renderBrowser();
    toast('Progres direset.', () => {
      progress = before;
      store.set(KEY.progress, progress);
      renderBrowser();
    });
  });

  $('#resultBody').addEventListener('click', (e) => {
    const line = e.target.closest('.res-line');
    if (!line) return;
    line.closest('.res-row').classList.toggle('open');
  });

  $('#resultToggle').addEventListener('click', () => {
    setCollapsed(!$('#resultPane').classList.contains('collapsed'));
  });

  $('#resetCodeBtn').addEventListener('click', resetCode);
  window.PG.onChange(onEditorChanged);
  window.addEventListener('beforeunload', saveDraft);

  // API buat index.html
  window.PGGrind = {
    run: runTests,
    isGrinding: () => state.mode === 'grind',
    mentorTask: () =>
      state.task
        ? { title: state.task.title, level: state.task.level, statement: state.task.statement, fn: state.task.fn }
        : null,
  };

  if (store.get(KEY.mode) === 'grind') setMode('grind', { remember: false });
}

if (window.PG) boot();
else window.addEventListener('pg:ready', boot, { once: true });
