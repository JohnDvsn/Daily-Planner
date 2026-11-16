/* views/schedule.js: the Jadwal tab. */
(function (RU) {
  'use strict';
  const { html, DAYS, DS, mins, dayIdx, classStatus } = RU;
  const { useApp, Panel, Field, ClassRow } = RU;
  const { useState, useRef } = React;

  function ClassForm({ day, setDay }) {
    const { dispatch, notify } = useApp();
    const [course, setCourse] = useState(''), [room, setRoom] = useState(''), [start, setStart] = useState('08:00'), [end, setEnd] = useState('09:40');
    const ref = useRef(null);
    const submit = (e) => {
      e.preventDefault();
      if (!course.trim()) return notify('Isi nama mata kuliah');
      if (mins(end) <= mins(start)) return notify('Jam selesai harus setelah jam mulai');
      dispatch({ type: 'CLASS_ADD', item: { day, start, end, course: course.trim(), room: room.trim() } });
      setCourse(''); setRoom(''); if (ref.current) ref.current.focus();
    };
    return html`<form className="form" onSubmit=${submit}>
      <${Field} label="Mata kuliah" wide=${true}><input ref=${ref} type="text" maxLength="60" autoComplete="off" value=${course} onChange=${(e) => setCourse(e.target.value)} /><//>
      <${Field} label="Hari"><select value=${day} onChange=${(e) => setDay(+e.target.value)}>${DAYS.map((n, i) => html`<option key=${i} value=${i}>${n}</option>`)}</select><//>
      <${Field} label="Ruang"><input type="text" maxLength="30" autoComplete="off" value=${room} onChange=${(e) => setRoom(e.target.value)} /><//>
      <${Field} label="Mulai"><input type="time" value=${start} onChange=${(e) => setStart(e.target.value)} /><//>
      <${Field} label="Selesai"><input type="time" value=${end} onChange=${(e) => setEnd(e.target.value)} /><//>
      <div className="wide"><button className="btn" type="submit">Simpan kelas</button></div>
    </form>`;
  }

  function Schedule() {
    const { S } = useApp();
    const td = dayIdx();
    const [sel, setSel] = useState(td);
    const list = S.classes.filter((c) => c.day === sel).sort((a, b) => mins(a.start) - mins(b.start));
    const stt = sel === td ? classStatus(list) : {};
    return html`<div className="cols">
      <${Panel} title=${DAYS[sel]}>
        <div className="days" role="group" aria-label="Pilih hari">
          ${DAYS.map((n, i) => {
            const cnt = S.classes.filter((c) => c.day === i).length;
            return html`<button key=${i} type="button" className=${i === td ? 'today' : ''} aria-pressed=${i === sel} onClick=${() => setSel(i)}>${DS[i]}${cnt > 0 && html`<sup>${cnt}</sup>`}</button>`;
          })}
        </div>
        ${list.length ? html`<div className="list">${list.map((c) => html`<${ClassRow} key=${c.id} c=${c} status=${stt[c.id]} />`)}</div>` : html`<p className="empty">${'Tidak ada kelas di hari ' + DAYS[sel] + '.'}</p>`}
      <//>
      <${Panel} title="Tambah kelas"><${ClassForm} day=${sel} setDay=${setSel} /><//>
    </div>`;
  }
  RU.views.jadwal = Schedule;
})(window.RU = window.RU || {});
