/* views/tasks.js: the Task tab, including the weekly courage missions. */
(function (RU) {
  'use strict';
  const { html, MISSIONS, statOf, taskSort, addDays, weekNum } = RU;
  const { useApp, Panel, Field, Options, statItems, TaskRow } = RU;
  const { useState, useRef } = React;

  function TaskForm() {
    const { dispatch, notify } = useApp();
    const [title, setTitle] = useState(''), [due, setDue] = useState(''), [stat, setStat] = useState('knowledge'), [pts, setPts] = useState('3');
    const ref = useRef(null);
    const submit = (e) => {
      e.preventDefault();
      if (!title.trim()) return notify('Isi dulu nama task-nya');
      dispatch({ type: 'TASK_ADD', title: title.trim(), due, stat, pts: +pts });
      setTitle(''); setDue(''); if (ref.current) ref.current.focus();
    };
    return html`<form className="form" onSubmit=${submit}>
      <${Field} label="Apa yang harus dikerjakan" wide=${true}><input ref=${ref} type="text" maxLength="120" autoComplete="off" value=${title} onChange=${(e) => setTitle(e.target.value)} /><//>
      <${Field} label="Tenggat"><input type="date" value=${due} onChange=${(e) => setDue(e.target.value)} /><//>
      <${Field} label="Melatih stat"><select value=${stat} onChange=${(e) => setStat(e.target.value)}><${Options} items=${statItems} /></select><//>
      <${Field} label="Poin"><select value=${pts} onChange=${(e) => setPts(e.target.value)}>${[1, 2, 3, 5].map((n) => html`<option key=${n} value=${n}>${n + ' poin'}</option>`)}</select><//>
      <div className="wide"><button className="btn" type="submit">Tambah task</button></div>
    </form>`;
  }

  function Missions() {
    const { S, dispatch } = useApp();
    const w = weekNum();
    const picks = [0, 1, 2].map((i) => MISSIONS[(w * 3 + i) % MISSIONS.length]);
    return html`<${Panel} title="Misi keberanian minggu ini">
      <p className="hint" style=${{ margin: '0 0 6px' }}>Tiga langkah kecil untuk melatih percaya diri bersama orang lain. Ganti tiap minggu.</p>
      <div className="list">
        ${picks.map((m) => {
          const taken = S.tasks.some((t) => !t.done && t.title === m.t);
          return html`<div className="mission" key=${m.t}>
            <div><div className="t">${m.t}</div><div className="m dim">${'+' + m.pts + ' ' + statOf(m.stat).n}</div></div>
            <button type="button" className="btn sm" disabled=${taken} onClick=${() => dispatch({ type: 'TASK_ADD', title: m.t, due: addDays(6), stat: m.stat, pts: m.pts, mission: true })}>${taken ? 'Diambil' : 'Ambil'}</button>
          </div>`;
        })}
      </div>
    <//>`;
  }

  function Tasks() {
    const { S } = useApp();
    const [filter, setFilter] = useState('open');
    const open = S.tasks.filter((t) => !t.done).sort(taskSort);
    const done = S.tasks.filter((t) => t.done).sort((a, b) => ((b.doneAt || '') < (a.doneAt || '') ? -1 : 1));
    const shown = filter === 'open' ? open : done;
    return html`<div className="cols">
      <${Panel} title="Task">
        <div className="tabs">
          <button type="button" aria-pressed=${filter === 'open'} onClick=${() => setFilter('open')}>${'Belum selesai (' + open.length + ')'}</button>
          <button type="button" aria-pressed=${filter === 'done'} onClick=${() => setFilter('done')}>${'Selesai (' + done.length + ')'}</button>
        </div>
        ${shown.length ? html`<div className="list">${shown.map((t) => html`<${TaskRow} key=${t.id} t=${t} />`)}</div>` : html`<p className="empty">${filter === 'open' ? 'Tidak ada task yang tertunda.' : 'Belum ada task yang selesai.'}</p>`}
      <//>
      <div className="stack">
        <${Panel} title="Task baru"><${TaskForm} /><p className="hint">Poin masuk ke stat yang kamu pilih saat task ditandai selesai.</p><//>
        <${Missions} />
      </div>
    </div>`;
  }
  RU.views.task = Tasks;
})(window.RU = window.RU || {});
