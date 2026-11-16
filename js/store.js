/* store.js: the shape of the saved data, the example data, and the reducer.
 * Every change to the data goes through `reducer`, so this is the one place to read to
 * see what the app can do to its state. */
(function (RU) {
  'use strict';
  const { KEY, NEED, uid, clone, today, addDays, lastDays, shiftDate, monthKey, statOf, lvl } = RU;

  const blank = () => ({
    v: 4, name: 'Player', arcana: 'fool', xp: 0,
    stats: { knowledge: 0, guts: 0, proficiency: 0, kindness: 0, charm: 0 },
    classes: [], tasks: [], confidants: [], habits: [], checkins: {}, events: [],
    notes: [], tx: [], budget: { amount: 0, example: false }, avatars: {}, finXp: ''
  });

  function seed() {
    const s = blank();
    s.stats = { knowledge: 9, guts: 4, proficiency: 6, kindness: 5, charm: 3 };
    s.classes = [
      { id: uid(), day: 0, start: '08:00', end: '09:40', course: 'Kalkulus II', room: 'R. 301', example: true },
      { id: uid(), day: 1, start: '10:00', end: '11:40', course: 'Struktur Data', room: 'Lab 2', example: true },
      { id: uid(), day: 2, start: '13:00', end: '14:40', course: 'Statistika', room: 'R. 204', example: true },
      { id: uid(), day: 3, start: '08:00', end: '09:40', course: 'Basis Data', room: 'R. 105', example: true },
      { id: uid(), day: 4, start: '09:00', end: '10:40', course: 'Pemrograman Web', room: 'Lab 1', example: true }
    ];
    s.tasks = [
      { id: uid(), title: 'Kumpulkan tugas minggu lalu yang tertunda', due: addDays(-1), stat: 'knowledge', pts: 3, done: false, example: true },
      { id: uid(), title: 'Selesaikan laporan praktikum', due: addDays(2), stat: 'proficiency', pts: 3, done: false, example: true },
      { id: uid(), title: 'Baca bab 4 sebelum kuis', due: addDays(1), stat: 'knowledge', pts: 2, done: false, example: true },
      { id: uid(), title: 'Ajak ngobrol satu teman sekelas yang belum akrab', due: '', stat: 'charm', pts: 3, done: false, example: true },
      { id: uid(), title: 'Presentasi kelompok, jadi yang pertama bicara', due: addDays(5), stat: 'guts', pts: 5, done: false, example: true }
    ];
    s.confidants = [
      { id: uid(), name: 'Teman sekelas', arcana: 'magician', rank: 2, progress: 1, notes: 'Suka diskusi soal tugas. Contoh data.', last: addDays(-4), log: [{ d: addDays(-4), note: 'Belajar bareng sebelum kuis', stat: 'charm' }], example: true },
      { id: uid(), name: 'Teman organisasi', arcana: 'chariot', rank: 1, progress: 0, notes: 'Contoh data.', last: '', log: [], example: true }
    ];
    s.habits = [
      { id: uid(), name: 'Baca materi 15 menit', stat: 'knowledge', cue: 'Setelah sarapan', minimum: 'Baca satu paragraf', target: 'Baca selama 15 menit', frequency: 'daily', days: [0,1,2,3,4,5,6], identity: 'Aku adalah pembelajar yang konsisten', logs: {}, done: { [addDays(-1)]: true, [addDays(-2)]: true, [addDays(-3)]: true }, example: true },
      { id: uid(), name: 'Ngobrol dengan satu orang', stat: 'charm', cue: '', minimum: 'Menyapa satu orang', target: 'Mengobrol dengan satu orang', frequency: 'daily', days: [0,1,2,3,4,5,6], identity: 'Aku membangun hubungan dengan orang lain', logs: {}, done: { [addDays(-1)]: true, [addDays(-3)]: true }, example: true },
      { id: uid(), name: 'Rapikan catatan kuliah', stat: 'proficiency', cue: '', minimum: 'Rapikan satu catatan', target: 'Rapikan catatan selama 10 menit', frequency: 'daily', days: [0,1,2,3,4,5,6], identity: 'Aku bekerja dengan teratur', logs: {}, done: { [addDays(-2)]: true }, example: true }
    ];
    [4, 3, 3, 2, 2].forEach((c, i) => {
      s.checkins[addDays(-(i + 1))] = { mood: [4, 4, 3, 2, 3][i], conf: c, win: 'Contoh: ikut diskusi kelompok', hard: '', next: '', example: true };
    });

    const first = monthKey() + '-01';
    const inMonth = (n) => { const d = addDays(-n); return d < first ? first : d; };
    const X = (n, type, cat, amount, note) => ({ id: uid(), date: n === 'first' ? first : inMonth(n), type, cat, amount, note, example: true });
    s.tx = [
      X('first', 'in', 'masuk', 1500000, 'Kiriman bulanan'),
      X(0, 'out', 'makan', 15000, 'Makan siang warteg'), X(0, 'out', 'jajan', 18000, 'Es kopi'),
      X(1, 'out', 'keperluan', 12000, 'Fotokopi modul'), X(1, 'out', 'makan', 20000, 'Makan malam'),
      X(2, 'out', 'jajan', 25000, 'Boba'), X(2, 'out', 'makan', 17000, 'Makan siang'),
      X(3, 'out', 'keperluan', 55000, 'Paket data'),
      X(4, 'out', 'makan', 16000, 'Sarapan dan makan siang'), X(4, 'out', 'jajan', 8000, 'Gorengan'),
      X(6, 'out', 'keperluan', 30000, 'Alat tulis'), X(6, 'out', 'makan', 18000, 'Makan malam')
    ];
    s.budget = { amount: 1000000, example: true };
    s.notes = [
      { id: uid(), course: 'Struktur Data', created: addDays(-2), updated: Date.now() - 2 * 86400000, example: true, title: 'Linked List: ringkasan',
        body: '# Linked List\n\nKumpulan node yang saling menunjuk. Tiap node punya **data** dan pointer `next`.\n\n## Perbandingan dengan array\n- Sisip di depan: O(1) di linked list, O(n) di array\n- Akses ke indeks ke-k: O(k) di linked list, O(1) di array\n\n## Yang perlu dilatih\n- [x] Buat node dan sambungkan\n- [ ] Balik urutan linked list\n- [ ] Deteksi siklus\n\n> Kalau bingung, gambar dulu kotak dan panahnya.' },
      { id: uid(), course: '', created: addDays(-1), updated: Date.now() - 86400000, example: true, title: 'Rencana belajar minggu ini',
        body: '## Target\n- [ ] Selesaikan laporan praktikum\n- [ ] Ulang bab 4 sebelum kuis\n\nBelajar paling enak pagi hari, jadi sisakan 1 jam sebelum kelas.' }
    ];
    return s;
  }

  function normalize(d) {
    const b = blank();
    const s = Object.assign(b, d || {});
    s.stats = Object.assign(b.stats, (d && d.stats) || {});
    ['classes', 'tasks', 'confidants', 'habits', 'events', 'notes', 'tx'].forEach((k) => { if (!Array.isArray(s[k])) s[k] = []; });
    if (!s.checkins || typeof s.checkins !== 'object' || Array.isArray(s.checkins)) s.checkins = {};
    if (!s.avatars || typeof s.avatars !== 'object' || Array.isArray(s.avatars)) s.avatars = {};
    if (!s.budget || typeof s.budget !== 'object') s.budget = { amount: 0, example: false };
    // Migrate legacy habits without discarding their existing completion history.
    s.habits = s.habits.map((h) => {
      h.done = h.done && typeof h.done === 'object' ? h.done : {};
      h.logs = h.logs && typeof h.logs === 'object' ? h.logs : {};
      Object.keys(h.done).forEach((date) => { if (h.done[date] && !h.logs[date]) h.logs[date] = 'full'; });
      h.cue = h.cue || ''; h.minimum = h.minimum || ('Lakukan versi terkecil dari ' + h.name);
      h.target = h.target || h.name; h.frequency = h.frequency || 'daily';
      h.days = Array.isArray(h.days) ? h.days : [0,1,2,3,4,5,6];
      h.identity = h.identity || '';
      return h;
    });
    s.xp = Number.isFinite(Number(s.xp)) ? Number(s.xp) : 0;
    s.v = 4;
    return s;
  }
  function loadLocal() {
    try { const raw = localStorage.getItem(KEY); if (raw) return normalize(JSON.parse(raw)); } catch (e) {}
    return seed();
  }

  /* add or remove stat points, return the message to show */
  function award(d, k, n) {
    const old = d.stats[k] || 0, before = lvl(old);
    d.stats[k] = Math.max(0, old + n);
    const real = d.stats[k] - old, after = lvl(d.stats[k]), st = statOf(k);
    if (real !== 0) { d.events.push({ d: today(), k, n: real }); if (d.events.length > 500) d.events.splice(0, d.events.length - 500); }
    if (after > before) return st.n + ' naik ke Lv ' + after + ': ' + st.r[after - 1];
    return st.n + (n >= 0 ? ' +' : ' ') + n;
  }
  const find = (list, id) => list.find((x) => x.id === id);

  function reducer(state, a) {
    if (a.type === 'LOAD') return { data: a.data, toast: state.toast };
    if (a.type === 'NOTIFY') return { data: state.data, toast: { id: uid(), text: a.text } };
    const d = clone(state.data);
    let msg = '';
    switch (a.type) {
      case 'FIELD': d[a.key] = a.value; break;
      case 'STAT_ADJ': msg = award(d, a.k, a.d); break;
      case 'DELETE':
        d[a.list] = d[a.list].filter((x) => x.id !== a.id);
        if (a.list === 'confidants') delete d.avatars[a.id];
        msg = 'Dihapus'; break;
      case 'CLEAR_EXAMPLES':
        ['classes', 'tasks', 'confidants', 'habits', 'tx', 'notes'].forEach((k) => { d[k] = d[k].filter((x) => !x.example); });
        Object.keys(d.checkins).forEach((k) => { if (d.checkins[k].example) delete d.checkins[k]; });
        if (d.budget.example) d.budget = { amount: 0, example: false };
        msg = 'Data contoh dihapus'; break;

      case 'AVATAR_SET': d.avatars[a.key] = a.url; msg = 'Foto diperbarui'; break;
      case 'AVATAR_CLEAR': delete d.avatars[a.key]; msg = 'Foto dihapus'; break;

      case 'TASK_ADD':
        d.tasks.push({ id: uid(), title: a.title, due: a.due || '', stat: a.stat, pts: a.pts, done: false, mission: !!a.mission });
        msg = a.mission ? 'Misi diambil' : 'Task ditambahkan'; break;
      case 'TASK_TOGGLE': {
        const t = find(d.tasks, a.id); if (!t) break;
        t.done = !t.done; t.doneAt = t.done ? today() : '';
        msg = (t.done ? 'Selesai! ' : 'Dibatalkan. ') + award(d, t.stat, t.done ? t.pts : -t.pts); break;
      }

      case 'CLASS_ADD': d.classes.push(Object.assign({ id: uid() }, a.item)); msg = 'Kelas disimpan'; break;

      case 'CONF_ADD': d.confidants.push({ id: uid(), name: a.name, arcana: a.arcana, rank: 1, progress: 0, notes: '', last: '', log: [] }); msg = 'Teman ditambahkan'; break;
      case 'CONF_SET': { const c = find(d.confidants, a.id); if (c) Object.assign(c, a.patch); break; }
      case 'CONF_HANG': {
        const c = find(d.confidants, a.id); if (!c) break;
        c.log = [{ d: today(), note: a.note, stat: a.stat }].concat(c.log || []).slice(0, 20);
        c.last = today();
        const m = award(d, a.stat, 2); let up = '';
        if (c.rank < 10) { c.progress += 1; if (c.progress >= NEED) { c.rank += 1; c.progress = 0; up = c.name + ' naik ke Rank ' + c.rank + '! '; } }
        msg = up + m; break;
      }

      case 'HABIT_ADD': d.habits.push({ id: uid(), name: a.name, stat: a.stat, cue: a.cue || '', minimum: a.minimum || ('Lakukan versi terkecil dari ' + a.name), target: a.target || a.name, frequency: a.frequency || 'daily', days: Array.isArray(a.days) ? a.days : [0,1,2,3,4,5,6], identity: a.identity || '', logs: {}, done: {} }); msg = 'Kebiasaan ditambahkan'; break;
      case 'HABIT_LOG': {
        const h = find(d.habits, a.id); if (!h || a.date !== today()) break;
        h.logs = h.logs || {}; h.done = h.done || {};
        const previous = h.logs[a.date] || (h.done[a.date] ? 'full' : '');
        if (previous) { msg = 'Kebiasaan hari ini sudah tercatat'; break; }
        const status = a.status === 'minimum' ? 'minimum' : 'full';
        h.logs[a.date] = status; h.done[a.date] = true;
        const xp = status === 'full' ? 3 : 1; d.xp = (d.xp || 0) + xp;
        if (status === 'full') msg = award(d, h.stat, 1) + ' · +' + xp + ' XP';
        else msg = 'Versi minimum tercatat · +' + xp + ' XP';
        break;
      }
      case 'HABIT_RECOVER': {
        const h = find(d.habits, a.id); if (!h || a.date !== today()) break;
        h.logs = h.logs || {}; h.done = h.done || {};
        if (h.logs[a.date] || h.done[a.date]) { msg = 'Misi hari ini sudah tercatat'; break; }
        h.logs[a.date] = 'minimum'; h.done[a.date] = true; d.xp = (d.xp || 0) + 1;
        msg = 'Recovery Mission selesai · +1 XP. Kamu sudah kembali!'; break;
      }
      case 'HABIT_TOGGLE': {
        const h = find(d.habits, a.id); if (!h) break;
        const on = !h.done[a.date];
        if (on) h.done[a.date] = true; else delete h.done[a.date];
        const keep = lastDays(120);
        Object.keys(h.done).forEach((k) => { if (!keep.includes(k)) delete h.done[k]; });
        if (a.date === today()) msg = award(d, h.stat, on ? 1 : -1);
        break;
      }

      case 'CHECKIN': {
        const had = !!d.checkins[a.date];
        d.checkins[a.date] = { mood: a.mood, conf: a.conf, win: a.win, hard: a.hard, next: a.next };
        msg = had ? 'Refleksi diperbarui' : 'Refleksi tersimpan. ' + award(d, 'knowledge', 1); break;
      }

      case 'NOTE_ADD': d.notes.unshift({ id: a.id, title: '', body: '', course: a.course || '', created: today(), updated: Date.now() }); msg = 'Catatan baru'; break;
      case 'NOTE_SET': { const n = find(d.notes, a.id); if (n) { Object.assign(n, a.patch); n.updated = Date.now(); } break; }

      case 'TX_ADD':
        d.tx.push(Object.assign({ id: uid() }, a.item));
        msg = a.item.type === 'in' ? 'Uang masuk dicatat' : 'Pengeluaran dicatat';
        if (d.finXp !== today()) { d.finXp = today(); msg += '. ' + award(d, 'proficiency', 1); }
        break;
      case 'BUDGET_SET': d.budget = { amount: a.amount, example: false }; msg = a.amount > 0 ? 'Anggaran disimpan' : 'Anggaran dihapus'; break;
      default: break;
    }
    return { data: d, toast: msg ? { id: uid(), text: msg } : state.toast };
  }

  Object.assign(RU, { blank, seed, normalize, loadLocal, award, reducer });
})(window.RU = window.RU || {});
