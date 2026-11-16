/* views/reflect.js: the Refleksi tab (daily check-in, weekly review, 14-day trend). */
(function (RU) {
  'use strict';
  const { html, STATS, MOOD, CONF, today, shortDate, weekSummary, checkinStreak, rupiah } = RU;
  const { useApp, Panel, Field, Scale, TrendChart } = RU;
  const { useState } = React;

  function CheckinForm() {
    const { S, dispatch, notify } = useApp();
    const t = today(), ex = S.checkins[t];
    const [mood, setMood] = useState(ex ? ex.mood : 0), [conf, setConf] = useState(ex ? ex.conf : 0);
    const [win, setWin] = useState(ex ? ex.win : ''), [hard, setHard] = useState(ex ? ex.hard : ''), [next, setNext] = useState(ex ? ex.next : '');
    const submit = (e) => {
      e.preventDefault();
      if (!mood || !conf) return notify('Pilih dulu suasana hati dan rasa percaya dirimu');
      dispatch({ type: 'CHECKIN', date: t, mood, conf, win: win.trim(), hard: hard.trim(), next: next.trim() });
    };
    return html`<form className="form" onSubmit=${submit}>
      <div className="wide"><div className="field"><span>Suasana hati hari ini</span></div><${Scale} value=${mood} onChange=${setMood} labels=${MOOD} name="Suasana hati" /></div>
      <div className="wide"><div className="field"><span>Percaya dirimu hari ini</span></div><${Scale} value=${conf} onChange=${setConf} labels=${CONF} name="Percaya diri" /></div>
      <${Field} label="Satu hal yang berhasil" wide=${true}><input type="text" maxLength="140" autoComplete="off" value=${win} onChange=${(e) => setWin(e.target.value)} /><//>
      <${Field} label="Satu hal yang terasa berat" wide=${true}><input type="text" maxLength="140" autoComplete="off" value=${hard} onChange=${(e) => setHard(e.target.value)} /><//>
      <${Field} label="Satu langkah kecil untuk besok" wide=${true}><input type="text" maxLength="140" autoComplete="off" value=${next} onChange=${(e) => setNext(e.target.value)} /><//>
      <div className="wide"><button className="btn" type="submit">${ex ? 'Perbarui refleksi' : 'Simpan refleksi'}</button></div>
    </form>`;
  }

  function WeekReview() {
    const { S } = useApp();
    const w = weekSummary(S);
    const max = Math.max(1, ...Object.values(w.gain));
    let confNote = 'Belum ada data refleksi minggu ini.';
    if (w.conf !== null) {
      confNote = 'Rata-rata percaya diri ' + w.conf.toFixed(1);
      if (w.confPrev !== null) { const dlt = w.conf - w.confPrev; confNote += dlt > 0.05 ? ', naik ' + dlt.toFixed(1) + ' dari minggu lalu.' : dlt < -0.05 ? ', turun ' + (-dlt).toFixed(1) + ' dari minggu lalu.' : ', sama seperti minggu lalu.'; } else confNote += '.';
    }
    return html`<${Panel} title="7 hari terakhir">
      <div className="kpis">
        <div className="kpi"><b>${w.tasksDone}</b><span>task selesai</span></div>
        <div className="kpi"><b>${w.hangouts}</b><span>kali nongkrong</span></div>
        <div className="kpi"><b>${w.habitRate === null ? '–' : w.habitRate + '%'}</b><span>kebiasaan terpenuhi</span></div>
        <div className="kpi"><b>${w.checkins + '/7'}</b><span>hari refleksi</span></div>
        <div className="kpi"><b>${RU.compactRp(w.spent)}</b><span>uang keluar</span></div>
      </div>
      <h3 className="h3">Poin stat minggu ini</h3>
      ${STATS.map((s) => html`<div className="gain" key=${s.k}><span>${s.n}</span><div className="bar"><i style=${{ width: (w.gain[s.k] / max * 100).toFixed(0) + '%' }}></i></div><b>${w.gain[s.k]}</b></div>`)}
      <p className="hint" style=${{ marginTop: 12 }}>${confNote}</p>
    <//>`;
  }

  function Reflect() {
    const { S } = useApp();
    const t = today();
    const recent = Object.keys(S.checkins).sort().reverse().filter((d) => d !== t).slice(0, 5);
    return html`<div className="cols">
      <div className="stack">
        <${Panel} title="Refleksi hari ini">
          <p className="hint" style=${{ margin: '0 0 12px' }}>${'Dua menit tiap malam. Beruntun sekarang: ' + checkinStreak(S) + ' hari.'}</p>
          <${CheckinForm} key=${t + (S.checkins[t] ? '-saved' : '-new')} />
        <//>
        ${recent.length > 0 && html`<${Panel} title="Catatan sebelumnya"><ul className="hist">
          ${recent.map((d) => { const c = S.checkins[d]; return html`<li key=${d}><b>${shortDate(d)}</b>${'Percaya diri ' + c.conf + ', suasana ' + c.mood + '.'}${c.win && html` Berhasil: ${c.win}.`}${c.hard && html` Berat: ${c.hard}.`}${c.next && html` Langkah: ${c.next}.`}${c.example && html` <span className="pill ex">Contoh</span>`}</li>`; })}
        </ul><//>`}
      </div>
      <div className="stack">
        <${WeekReview} />
        <${Panel} title="Tren 14 hari"><${TrendChart} checkins=${S.checkins} /><//>
      </div>
    </div>`;
  }
  RU.views.refleksi = Reflect;
})(window.RU = window.RU || {});
