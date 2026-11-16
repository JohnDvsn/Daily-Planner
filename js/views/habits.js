/* views/habits.js: habit builder, flexible completion and recovery missions. */
(function (RU) {
  'use strict';
  const { html, HABIT_IDEAS, DS, statOf, habitStreak, habitStatus, habitScheduled, lastDays, today, dayIdxOf, shortDate, DAYS } = RU;
  const { useApp, Panel, Field, Options, statItems, DelButton } = RU;
  const { useState } = React;

  function HabitForm() {
    const { S, dispatch, notify } = useApp();
    const [name, setName] = useState(''), [stat, setStat] = useState('knowledge');
    const [cue, setCue] = useState(''), [target, setTarget] = useState(''), [minimum, setMinimum] = useState('');
    const [identity, setIdentity] = useState(''), [days, setDays] = useState([0,1,2,3,4,5,6]);
    const toggleDay = (day) => setDays((old) => old.includes(day) ? old.filter((x) => x !== day) : old.concat(day).sort());
    const submit = (e) => {
      e.preventDefault();
      if (!name.trim()) return notify('Isi nama kebiasaannya');
      if (!minimum.trim()) return notify('Isi versi minimum agar kebiasaan mudah dimulai');
      if (!days.length) return notify('Pilih minimal satu hari');
      dispatch({ type: 'HABIT_ADD', name: name.trim(), stat, cue: cue.trim(), target: target.trim() || name.trim(), minimum: minimum.trim(), identity: identity.trim(), frequency: days.length === 7 ? 'daily' : 'custom', days });
      setName(''); setCue(''); setTarget(''); setMinimum(''); setIdentity(''); setDays([0,1,2,3,4,5,6]);
    };
    const ideas = HABIT_IDEAS.filter((i) => !S.habits.some((h) => h.name === i.name));
    return html`<div>
      <form className="form" onSubmit=${submit}>
        <${Field} label="Nama kebiasaan" wide=${true}><input type="text" maxLength="60" autoComplete="off" value=${name} onChange=${(e) => setName(e.target.value)} placeholder="Contoh: Belajar Python" /><//>
        <${Field} label="Pemicu (setelah apa?)" wide=${true}><input type="text" maxLength="100" value=${cue} onChange=${(e) => setCue(e.target.value)} placeholder="Contoh: Setelah sarapan" /><//>
        <${Field} label="Target utama" wide=${true}><input type="text" maxLength="120" value=${target} onChange=${(e) => setTarget(e.target.value)} placeholder="Contoh: Belajar selama 30 menit" /><//>
        <${Field} label="Versi minimum" wide=${true}><input type="text" maxLength="120" value=${minimum} onChange=${(e) => setMinimum(e.target.value)} placeholder="Contoh: Buka editor dan tulis 1 baris kode" /><//>
        <${Field} label="Identitas yang dibangun" wide=${true}><input type="text" maxLength="120" value=${identity} onChange=${(e) => setIdentity(e.target.value)} placeholder="Contoh: Aku pembelajar yang konsisten" /><//>
        <${Field} label="Melatih stat"><select value=${stat} onChange=${(e) => setStat(e.target.value)}><${Options} items=${statItems} /></select><//>
        <${Field} label="Jadwal" wide=${true}><div className="days">${DAYS.map((d, i) => html`<button key=${i} type="button" aria-pressed=${days.includes(i)} onClick=${() => toggleDay(i)}>${DS[i]}</button>`)}</div><//>
        <div><button className="btn" type="submit">Tambah kebiasaan</button></div>
      </form>
      ${ideas.length > 0 && html`<div style=${{ marginTop: 16 }}><p className="hint" style=${{ margin: '0 0 8px' }}>Ide awal (bisa kamu lengkapi setelah ditambahkan):</p><div className="chips">${ideas.map((i) => html`<button key=${i.name} type="button" className="chip" onClick=${() => { setName(i.name); setStat(i.stat); setTarget(i.name); setMinimum('Lakukan versi paling kecil dari aktivitas ini'); }}>${i.name}</button>`)}</div></div>`}
    </div>`;
  }

  function HabitRow({ h }) {
    const { dispatch } = useApp();
    const days = lastDays(7), n = habitStreak(h), t = today(), status = habitStatus(h, t);
    const missed = days.slice(0, 6).reverse().some((d) => habitScheduled(h, d) && !habitStatus(h, d));
    return html`<div className="habit habit-card">
      <div className="habit-main">
        <div className="t">${h.name}</div>
        <div className="m"><span>${statOf(h.stat).n}</span><span className=${'pill' + (n >= 3 ? ' today' : '')}>${n + ' hari beruntun'}</span>${h.example && html`<span className="pill ex">Contoh</span>`}</div>
        ${h.cue && html`<p className="hint">Pemicu: ${h.cue}</p>`}
        <p className="hint">Target: ${h.target || h.name}</p>
        <p className="hint">Minimum: ${h.minimum}</p>
        ${h.identity && html`<p className="hint"><em>${h.identity}</em></p>`}
      </div>
      <div className="strip" role="group" aria-label=${'7 hari terakhir: ' + h.name}>
        ${days.map((d) => { const st = habitStatus(h, d); return html`<span key=${d} className=${'habit-day ' + (d === t ? 'today ' : '') + (st === 'full' ? 'full' : st === 'minimum' ? 'minimum' : '')} title=${DAYS[dayIdxOf(d)] + ': ' + (st === 'full' ? 'target utama' : st === 'minimum' ? 'minimum' : 'belum dicatat')}>${DS[dayIdxOf(d)]}</span>`; })}
      </div>
      <div className="habit-actions">
        ${!status ? html`<button type="button" className="btn sm" onClick=${() => dispatch({ type: 'HABIT_LOG', id: h.id, date: t, status: 'full' })}>Target tercapai · +3 XP</button><button type="button" className="btn sm ghost" onClick=${() => dispatch({ type: 'HABIT_LOG', id: h.id, date: t, status: 'minimum' })}>Versi minimum · +1 XP</button>` : html`<span className="pill today">${status === 'full' ? 'Target tercapai' : 'Minimum tercapai'}</span>`}
        ${!status && missed && html`<button type="button" className="btn sm ghost" onClick=${() => dispatch({ type: 'HABIT_RECOVER', id: h.id, date: t })}>Recovery Mission · +1 XP</button>`}
      </div>
      <${DelButton} onConfirm=${() => dispatch({ type: 'DELETE', list: 'habits', id: h.id })} />
    </div>`;
  }

  function Habits() {
    const { S } = useApp();
    return html`<div className="stack">
      <${Panel} title="Kebiasaan">
        <div className="kpis"><div className="kpi"><b>${S.xp || 0}</b><span>Total XP karakter</span></div><div className="kpi"><b>${S.habits.filter((h) => habitStatus(h, today())).length}</b><span>Habit tercatat hari ini</span></div></div>
        ${S.habits.length ? html`<div className="list">${S.habits.map((h) => html`<${HabitRow} key=${h.id} h=${h} />`)}</div>` : html`<p className="empty">Belum ada kebiasaan. Mulai dari satu yang kecil. Kebiasaan kecil yang konsisten menang melawan niat besar yang sekali jalan.</p>`}
        <p className="hint">Target utama memberi +3 XP dan +1 Stat. Versi minimum memberi +1 XP tanpa mengurangi Stat. Recovery Mission memberi +1 XP tanpa penalti. Setiap habit hanya bisa mendapat satu catatan per hari.</p>
      <//>
      <${Panel} title="Tambah kebiasaan"><${HabitForm} /><//>
    </div>`;
  }
  RU.views.habit = Habits;
})(window.RU = window.RU || {});
