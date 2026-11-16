/* views/notes.js: the Catatan tab. A small notebook with light Markdown, so studying does not need another app.
 *
 * Supported while writing:  # Judul   ## Subjudul   - daftar   1. daftar bernomor   - [ ] checklist
 *                           > kutipan   **tebal**   *miring*   `kode` */
(function (RU) {
  'use strict';
  const { html, uid } = RU;
  const { useApp, Panel, Field, DelButton } = RU;
  const { useState, useEffect, useRef, useCallback } = React;

  /* ----- tiny Markdown renderer (builds React elements, never raw HTML) ----- */
  function inline(text, keyBase) {
    const out = [], re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
    let last = 0, m, i = 0;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push(text.slice(last, m.index));
      const t = m[0];
      if (t.startsWith('**')) out.push(html`<strong key=${keyBase + '-' + i}>${t.slice(2, -2)}</strong>`);
      else if (t.startsWith('`')) out.push(html`<code key=${keyBase + '-' + i}>${t.slice(1, -1)}</code>`);
      else out.push(html`<em key=${keyBase + '-' + i}>${t.slice(1, -1)}</em>`);
      last = m.index + t.length; i++;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }

  function Md({ text, onToggle }) {
    const lines = text.split('\n'), blocks = [];
    let list = null;
    const close = () => { if (list) { blocks.push(list); list = null; } };
    const add = (kind, item) => {
      if (!list || list.kind !== kind) { close(); list = { kind, items: [], key: 'l' + blocks.length }; }
      list.items.push(item);
    };
    lines.forEach((ln, i) => {
      let m;
      if ((m = /^\s*[-*] \[( |x|X)\] (.*)$/.exec(ln))) add('todo', { i, done: m[1] !== ' ', text: m[2] });
      else if ((m = /^\s*[-*] (.*)$/.exec(ln))) add('ul', { i, text: m[1] });
      else if ((m = /^\s*\d+[.)] (.*)$/.exec(ln))) add('ol', { i, text: m[1] });
      else {
        close();
        if ((m = /^## (.*)$/.exec(ln))) blocks.push({ kind: 'h2', i, text: m[1] });
        else if ((m = /^# (.*)$/.exec(ln))) blocks.push({ kind: 'h1', i, text: m[1] });
        else if ((m = /^> ?(.*)$/.exec(ln))) blocks.push({ kind: 'quote', i, text: m[1] });
        else if (ln.trim()) blocks.push({ kind: 'p', i, text: ln });
      }
    });
    close();
    if (!blocks.length) return html`<p className="empty">Belum ada isi. Pindah ke Tulis untuk mulai mencatat.</p>`;
    return html`<div className="md">${blocks.map((b, bi) => {
      if (b.items) {
        if (b.kind === 'todo') return html`<ul className="md-todo" key=${bi}>${b.items.map((it) => html`<li key=${it.i}>
          <${RU.Check} on=${it.done} label=${(it.done ? 'Batalkan ' : 'Centang ') + it.text} onClick=${() => onToggle(it.i)} /><span className=${it.done ? 'done' : ''}>${inline(it.text, 't' + it.i)}</span></li>`)}</ul>`;
        const Tag = b.kind === 'ol' ? 'ol' : 'ul';
        return html`<${Tag} key=${bi}>${b.items.map((it) => html`<li key=${it.i}>${inline(it.text, 'b' + it.i)}</li>`)}<//>`;
      }
      if (b.kind === 'h1') return html`<h3 className="md-h1" key=${bi}>${inline(b.text, 'h' + b.i)}</h3>`;
      if (b.kind === 'h2') return html`<h4 className="md-h2" key=${bi}>${inline(b.text, 'h' + b.i)}</h4>`;
      if (b.kind === 'quote') return html`<blockquote key=${bi}>${inline(b.text, 'q' + b.i)}</blockquote>`;
      return html`<p key=${bi}>${inline(b.text, 'p' + b.i)}</p>`;
    })}</div>`;
  }

  /* insert Markdown at the cursor of a textarea */
  function format(ta, kind, body) {
    const s = ta.selectionStart, e = ta.selectionEnd;
    if (kind === 'bold' || kind === 'code') {
      const mark = kind === 'bold' ? '**' : '`', sel = body.slice(s, e) || 'teks';
      return { body: body.slice(0, s) + mark + sel + mark + body.slice(e), from: s + mark.length, to: s + mark.length + sel.length };
    }
    const ls = s === 0 ? 0 : body.lastIndexOf('\n', s - 1) + 1;
    const pre = { h1: '# ', h2: '## ', ul: '- ', todo: '- [ ] ', quote: '> ' }[kind];
    return { body: body.slice(0, ls) + pre + body.slice(ls), from: s + pre.length, to: e + pre.length };
  }
  const TOOLS = [['h1', 'Judul'], ['h2', 'Sub'], ['ul', 'Daftar'], ['todo', 'Checklist'], ['quote', 'Kutipan'], ['bold', 'Tebal'], ['code', 'Kode']];

  /* ----- editor: keeps text locally and saves 0.6s after you stop typing ----- */
  function NoteEditor({ note, courses, fresh }) {
    const { dispatch } = useApp();
    const [title, setTitle] = useState(note.title), [body, setBody] = useState(note.body), [course, setCourse] = useState(note.course || '');
    const [mode, setMode] = useState('tulis');
    const cur = useRef({ title, body, course }), timer = useRef(null), dirty = useRef(false), ta = useRef(null);
    cur.current = { title, body, course };

    const flush = useCallback(() => {
      clearTimeout(timer.current);
      if (!dirty.current) return;
      dirty.current = false;
      dispatch({ type: 'NOTE_SET', id: note.id, patch: { title: cur.current.title, body: cur.current.body, course: cur.current.course } });
    }, [note.id]);
    const change = (patch) => {
      Object.assign(cur.current, patch);
      dirty.current = true;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 600);
    };
    useEffect(() => () => flush(), [flush]);

    const onTitle = (v) => { setTitle(v); change({ title: v }); };
    const onBody = (v) => { setBody(v); change({ body: v }); };
    const onCourse = (v) => { setCourse(v); change({ course: v }); flush(); };
    const tool = (kind) => {
      const el = ta.current; if (!el) return;
      const r = format(el, kind, body);
      onBody(r.body);
      requestAnimationFrame(() => { el.focus(); el.setSelectionRange(r.from, r.to); });
    };
    const toggleLine = (i) => {
      const lines = body.split('\n');
      lines[i] = /\[ \]/.test(lines[i]) ? lines[i].replace('[ ]', '[x]') : lines[i].replace(/\[[xX]\]/, '[ ]');
      const nb = lines.join('\n');
      setBody(nb); cur.current.body = nb; dirty.current = true; flush();
    };
    const words = body.trim() ? body.trim().split(/\s+/).length : 0;
    const opts = Array.from(new Set(courses.concat(course ? [course] : [])));

    return html`<div id="note-editor" className="editor">
      <label className="sr" htmlFor="note-title">Judul catatan</label>
      <input id="note-title" className="ntitle" type="text" maxLength="80" autoComplete="off" autoFocus=${fresh} placeholder="Judul catatan" value=${title} onChange=${(e) => onTitle(e.target.value)} onBlur=${flush} />
      <div className="editor-bar">
        <${Field} label="Mata kuliah"><select value=${course} onChange=${(e) => onCourse(e.target.value)}>
          <option value="">Tanpa mata kuliah</option>${opts.map((c) => html`<option key=${c} value=${c}>${c}</option>`)}</select><//>
        <div className="tabs" style=${{ margin: 0 }}>
          <button type="button" aria-pressed=${mode === 'tulis'} onClick=${() => setMode('tulis')}>Tulis</button>
          <button type="button" aria-pressed=${mode === 'lihat'} onClick=${() => { flush(); setMode('lihat'); }}>Lihat</button>
        </div>
      </div>
      ${mode === 'tulis'
        ? html`<div className="toolbar" role="toolbar" aria-label="Format">${TOOLS.map((t) => html`<button key=${t[0]} type="button" onClick=${() => tool(t[0])}>${t[1]}</button>`)}</div>
            <label className="sr" htmlFor="note-body">Isi catatan</label>
            <textarea id="note-body" ref=${ta} className="nbody" maxLength="20000" placeholder="Mulai menulis. Pakai tombol di atas untuk judul, daftar, dan checklist." value=${body} onChange=${(e) => onBody(e.target.value)} onBlur=${flush}></textarea>`
        : html`<div className="preview"><${Md} text=${body} onToggle=${toggleLine} /></div>`}
      <div className="editor-foot"><span className="dim">${words + ' kata · tersimpan otomatis'}</span><${DelButton} onConfirm=${() => dispatch({ type: 'DELETE', list: 'notes', id: note.id })} /></div>
    </div>`;
  }

  function Notes() {
    const { S, dispatch } = useApp();
    const [sel, setSel] = useState(null), [q, setQ] = useState(''), [filter, setFilter] = useState(''), [fresh, setFresh] = useState(false);
    const courses = Array.from(new Set(S.classes.map((c) => c.course).concat(S.notes.map((n) => n.course)).filter(Boolean)));
    const query = q.trim().toLowerCase();
    const visible = S.notes.slice().sort((a, b) => b.updated - a.updated).filter((n) =>
      (!filter || n.course === filter) && (!query || (n.title + ' ' + n.body + ' ' + n.course).toLowerCase().includes(query)));
    const note = S.notes.find((n) => n.id === sel) || visible[0] || null;

    const add = () => {
      const id = uid();
      dispatch({ type: 'NOTE_ADD', id, course: filter });
      setSel(id); setFresh(true); setQ('');
    };
    const pick = (id) => {
      setSel(id); setFresh(false);
      if (window.matchMedia && window.matchMedia('(max-width: 820px)').matches) {
        setTimeout(() => { const el = document.getElementById('note-editor'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
      }
    };

    return html`<div className="cols notes">
      <${Panel} title="Catatan">
        <div className="form" style=${{ marginBottom: 12 }}>
          <label className="field wide"><span>Cari</span><input type="text" autoComplete="off" placeholder="Judul, isi, atau mata kuliah" value=${q} onChange=${(e) => setQ(e.target.value)} /></label>
          <div className="wide"><button type="button" className="btn" onClick=${add}>Catatan baru</button></div>
        </div>
        ${courses.length > 0 && html`<div className="chips" role="group" aria-label="Filter mata kuliah" style=${{ marginBottom: 12 }}>
          <button type="button" className=${'chip' + (!filter ? ' on' : '')} aria-pressed=${!filter} onClick=${() => setFilter('')}>Semua</button>
          ${courses.map((c) => html`<button key=${c} type="button" className=${'chip' + (filter === c ? ' on' : '')} aria-pressed=${filter === c} onClick=${() => setFilter(filter === c ? '' : c)}>${c}</button>`)}
        </div>`}
        ${visible.length
          ? html`<div className="nlist">${visible.map((n) => html`<button key=${n.id} type="button" className="nitem" aria-current=${note && note.id === n.id ? 'true' : undefined} onClick=${() => pick(n.id)}>
              <b>${n.title || 'Tanpa judul'}</b>
              <span>${(n.body.replace(/[#>*`\-\[\]]/g, '').trim().slice(0, 70) || 'Kosong')}</span>
              <span>${(n.course ? n.course + ' · ' : '') + new Date(n.updated).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + (n.example ? ' · contoh' : '')}</span>
            </button>`)}</div>`
          : html`<p className="empty">${S.notes.length ? 'Tidak ada catatan yang cocok.' : 'Belum ada catatan. Tekan Catatan baru untuk mulai, misalnya ringkasan kuliah atau daftar yang mau dipelajari.'}</p>`}
      <//>
      ${note ? html`<${Panel}><${NoteEditor} key=${note.id} note=${note} courses=${courses} fresh=${fresh} /><//>` : html`<${Panel} title="Editor"><p className="empty">Pilih catatan di samping atau buat yang baru.</p><//>`}
    </div>`;
  }
  RU.views.catatan = Notes;
})(window.RU = window.RU || {});
