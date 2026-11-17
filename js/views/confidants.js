/* views/confidants.js: the Confidant tab. Each friend has a profile photo, an arcana and a rank. */
(function (RU) {
  'use strict';
  const { html, NEED, arcOf, statOf, shortDate } = RU;
  const { useApp, Panel, Field, Options, arcItems, DelButton, Avatar } = RU;
  const { useState } = React;

  function ConfCard({ c }) {
    const { dispatch } = useApp();
    const a = arcOf(c.arcana);
    const [hang, setHang] = useState(false), [note, setNote] = useState(''), [stat, setStat] = useState('charm');
    const submit = (e) => { e.preventDefault(); dispatch({ type: 'CONF_HANG', id: c.id, note: note.trim(), stat }); setHang(false); setNote(''); };
    return html`<article className="card">
      <div className="arc">
        <${Avatar} id=${c.id} name=${c.name} size=${88} badge=${a.num} />
        <div><div className="cname">${c.name}</div>${c.example && html`<span className="pill ex">Contoh</span>`}
          <div className="rk" style=${{ marginTop: 2 }}>${'Arcana ' + a.name}</div>
          <div className="rank" style=${{ marginTop: 6 }}><span className="rk">${'Rank ' + c.rank + (c.rank >= 10 ? ' maks' : '')}</span>
            <span className="segs" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => html`<i key=${i} className=${i < c.rank ? 'on' : ''}></i>`)}</span></div>
          ${c.rank < 10 && html`<div className="dots" style=${{ marginTop: 6 }} aria-label=${c.progress + ' dari ' + NEED + ' nongkrong'}>
            ${Array.from({ length: NEED }, (_, i) => html`<i key=${i} className=${i < c.progress ? 'on' : ''}></i>`)}<span>${'menuju Rank ' + (c.rank + 1)}</span></div>`}
        </div>
      </div>
      <${Field} label="Arcana">
        <select value=${c.arcana} onChange=${(e) => dispatch({ type: 'CONF_SET', id: c.id, patch: { arcana: e.target.value } })}><${Options} items=${arcItems} /></select>
      <//>
      <p className="hint" style=${{ marginTop: -6 }}>${a.hint}</p>
      <${Field} label="Catatan"><input className="note" type="text" maxLength="140" autoComplete="off" defaultValue=${c.notes} onBlur=${(e) => { if (e.target.value !== c.notes) dispatch({ type: 'CONF_SET', id: c.id, patch: { notes: e.target.value } }); }} /><//>
      ${(c.log || []).length ? html`<ul className="log">${c.log.slice(0, 3).map((l, i) => html`<li key=${i}>${shortDate(l.d) + ' · ' + (l.note || 'Nongkrong') + ' (+2 ' + statOf(l.stat).n + ')'}</li>`)}</ul>` : html`<p className="hint" style=${{ margin: 0 }}>Belum ada catatan nongkrong.</p>`}
      ${hang
        ? html`<form className="form" onSubmit=${submit}>
            <${Field} label="Kalian ngapain?" wide=${true}><input type="text" maxLength="100" autoComplete="off" autoFocus=${true} value=${note} onChange=${(e) => setNote(e.target.value)} /><//>
            <${Field} label="Stat +2"><select value=${stat} onChange=${(e) => setStat(e.target.value)}><${Options} items=${[['charm', 'Charm'], ['kindness', 'Kindness'], ['guts', 'Guts']]} /></select><//>
            <div className="actions"><button className="btn sm" type="submit">Catat</button><button className="btn sm ghost" type="button" onClick=${() => setHang(false)}>Batal</button></div>
          </form>`
        : html`<div className="actions"><button type="button" className="btn sm" onClick=${() => setHang(true)}>Nongkrong</button><${DelButton} onConfirm=${() => dispatch({ type: 'DELETE', list: 'confidants', id: c.id })} /></div>`}
    </article>`;
  }

  function Confidants() {
    const { S, dispatch, notify } = useApp();
    const [name, setName] = useState(''), [arcana, setArcana] = useState('fool');
    const submit = (e) => {
      e.preventDefault();
      if (!name.trim()) return notify('Isi nama temanmu');
      dispatch({ type: 'CONF_ADD', name: name.trim(), arcana }); setName('');
    };
    const sorted = S.confidants.slice().sort((a, b) => b.rank - a.rank);
    return html`<div className="stack">
      <${Panel} title="Teman baru">
        <form className="form" onSubmit=${submit}>
          <${Field} label="Nama"><input type="text" maxLength="30" autoComplete="off" value=${name} onChange=${(e) => setName(e.target.value)} /><//>
          <${Field} label="Arcana"><select value=${arcana} onChange=${(e) => setArcana(e.target.value)}><${Options} items=${arcItems} /></select><//>
          <div><button className="btn" type="submit">Tambah</button></div>
        </form>
        <p className="hint">${'Setiap ' + NEED + ' kali nongkrong, rank naik satu sampai Rank 10. Klik foto untuk menggantinya. Arcana bisa diganti kapan saja kalau sifat hubungannya berubah.'}</p>
      <//>
      ${sorted.length ? html`<div className="cgrid">${sorted.map((c) => html`<${ConfCard} key=${c.id} c=${c} />`)}</div>` : html`<p className="empty">Belum ada teman yang dilacak.</p>`}
    </div>`;
  }
  RU.views.confidant = Confidants;
})(window.RU = window.RU || {});
