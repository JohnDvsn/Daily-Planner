/* storage.js: saving and loading.
 *
 * Two copies are kept: the whole state in this browser (localStorage), and a per-user cloud save.
 * The cloud save is split into small documents so notes, money and photos can grow without
 * hitting the size limit of one document:
 *
 *   data/users/<id>/save                 core   profile, stats, classes, tasks, friends, habits, check-ins
 *   data/users/<id>/save/notes/<noteId>  one note
 *   data/users/<id>/save/months/<YYYY-MM>  one month of transactions
 *   data/users/<id>/save/avatars/<key>   one profile photo ("me" or a friend's id)
 *
 * Only documents whose content changed are written. */
(function (RU) {
  'use strict';
  const { KEY, clone, normalize } = RU;
  const { useState, useEffect, useRef } = React;

  function splitState(S) {
    const parts = {};
    const core = Object.assign({}, S);
    delete core.tx; delete core.notes; delete core.avatars;
    parts.core = core;
    S.notes.forEach((n) => { parts['n:' + n.id] = n; });
    const months = {};
    S.tx.forEach((t) => { const m = t.date.slice(0, 7); (months[m] = months[m] || []).push(t); });
    Object.keys(months).forEach((m) => { parts['m:' + m] = { items: months[m] }; });
    Object.keys(S.avatars).forEach((k) => { parts['a:' + k] = { url: S.avatars[k] }; });
    return parts;
  }

  function joinState(core, notes, months, avatars) {
    const S = Object.assign({}, core);
    S.notes = notes;
    S.tx = [].concat.apply([], months.map((m) => m.items || []));
    S.avatars = avatars;
    return normalize(S);
  }

  function refFor(base, key) {
    if (key === 'core') return base;
    const i = key.indexOf(':');
    const col = { n: 'notes', m: 'months', a: 'avatars' }[key.slice(0, i)];
    return base.collection(col).doc(key.slice(i + 1));
  }

  function sigs(parts) { const o = {}; Object.keys(parts).forEach((k) => { o[k] = JSON.stringify(parts[k]); }); return o; }

  function usePersistence(data, dispatch) {
    const [status, setStatus] = useState('local');
    const base = useRef(null), last = useRef({}), timer = useRef(null), retry = useRef(null);
    const saving = useRef(false), dirty = useRef(false), edited = useRef(false), skip = useRef(true);
    const latest = useRef(data), flushRef = useRef(null);
    latest.current = data;

    flushRef.current = async function flush() {
      if (!base.current || saving.current) return;
      saving.current = true; dirty.current = false;
      let ok = true;
      try {
        const now = sigs(splitState(latest.current)), jobs = [];
        Object.keys(now).forEach((k) => { if (last.current[k] !== now[k]) jobs.push({ k, op: 'set' }); });
        Object.keys(last.current).forEach((k) => { if (!(k in now)) jobs.push({ k, op: 'del' }); });
        for (const j of jobs) {
          const r = refFor(base.current, j.k);
          if (j.op === 'set') { await r.set(JSON.parse(now[j.k])); last.current[j.k] = now[j.k]; }
          else { await r.delete(); delete last.current[j.k]; }
        }
      } catch (e) { ok = false; }
      saving.current = false;
      if (!ok) { setStatus('fail'); clearTimeout(retry.current); retry.current = setTimeout(() => flushRef.current(), 8000); }
      else if (dirty.current) flushRef.current();
      else setStatus('cloud');
    };

    /* every change: mirror to this browser, then schedule a cloud write */
    useEffect(() => {
      if (skip.current) { skip.current = false; return; }
      edited.current = true;
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
      if (!base.current) { setStatus('local'); return; }
      dirty.current = true; setStatus('saving');
      clearTimeout(timer.current);
      timer.current = setTimeout(() => flushRef.current(), 700);
    }, [data]);

    /* once: connect to the cloud save and load it */
    useEffect(() => {
      (async () => {
        try {
          if (!window.claude || !window.claude.use) return;
          const db = await window.claude.use('db');
          const user = await window.claude.use('user');
          if (!db || !user) return;
          const id = await user.id();
          if (!id) return;
          const b = db.doc('data/users/' + id + '/save');
          const snap = await b.get();
          if (snap.exists && !edited.current) {
            const [ns, ms, as] = await Promise.all([b.collection('notes').get(), b.collection('months').get(), b.collection('avatars').get()]);
            if (!edited.current) {
              const avatars = {};
              as.docs.forEach((d) => { const v = d.data(); if (v && v.url) avatars[d.id] = v.url; });
              const next = joinState(clone(snap.data()), ns.docs.map((d) => clone(d.data())), ms.docs.map((d) => clone(d.data())), avatars);
              last.current = sigs(splitState(next));
              try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {}
              skip.current = true;
              dispatch({ type: 'LOAD', data: next });
              base.current = b; setStatus('cloud');
              return;
            }
          }
          last.current = {};
          base.current = b; setStatus('saving');
          flushRef.current();
        } catch (e) { setStatus(base.current ? 'fail' : 'local'); }
      })();
    }, []);

    return status;
  }

  Object.assign(RU, { splitState, joinState, usePersistence });
})(window.RU = window.RU || {});
