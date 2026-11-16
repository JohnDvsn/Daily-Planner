/* views/home.js: the Beranda tab. */
(function (RU) {
  'use strict';
  const { html, STATS, NEED, prog, arcOf, mins, dayIdx, diffDays, today, taskSort, classStatus, checkinStreak, budgetInfo, spentOn, compactRp, rupiah, shortDate } = RU;
  const { useApp, Panel, Radar, TaskRow, ClassRow, HabitToday, Avatar } = RU;

  function StatsPanel() {
    const { S, dispatch } = useApp();
    return html`<${Panel} title="Stat">
      <${Radar} stats=${S.stats} />
      <div className="list" style=${{ marginTop: 8 }}>
        ${STATS.map((s) => {
          const pr = prog(S.stats[s.k]);
          return html`<div className="stat" key=${s.k}>
            <div><div className="n">${s.n + ' · Lv ' + pr.l}</div><div className="r">${s.r[pr.l - 1] + ' · ' + (pr.l < 5 ? pr.cur + ' / ' + pr.need + ' poin' : 'level maksimal')}</div></div>
            <div className="ctl">
              <button type="button" className="mini" aria-label=${'Kurangi ' + s.n} onClick=${() => dispatch({ type: 'STAT_ADJ', k: s.k, d: -1 })}>−</button>
              <button type="button" className="mini" aria-label=${'Tambah ' + s.n} onClick=${() => dispatch({ type: 'STAT_ADJ', k: s.k, d: 1 })}>+</button>
            </div>
            <div className="bar"><i style=${{ width: (pr.frac * 100).toFixed(0) + '%' }}></i></div>
          </div>`;
        })}
      </div>
      <p className="hint">Poin masuk otomatis dari task, kebiasaan, nongkrong, refleksi, dan mencatat keuangan. Tombol + dan − untuk koreksi manual.</p>
    <//>`;
  }

  function MoneyGlance() {
    const { S, go } = useApp();
    const b = budgetInfo(S), t = spentOn(S, today());
    return html`<${Panel} title="Uang">
      <div className="kpis">
        <div className="kpi"><b>${compactRp(t.total)}</b><span>${'keluar hari ini' + (t.count ? ' (' + t.count + 'x)' : '')}</span></div>
        <div className="kpi"><b>${compactRp(b.spent)}</b><span>keluar bulan ini</span></div>
        ${b.budget > 0 && html`<div className="kpi"><b>${compactRp(Math.max(0, b.left))}</b><span>sisa anggaran</span></div>`}
      </div>
      ${b.budget > 0
        ? html`<div className=${'bar' + (b.over ? ' over' : '')} style=${{ marginBottom: 6 }}><i style=${{ width: (b.frac * 100).toFixed(0) + '%' }}></i></div>
            <p className="hint" style=${{ margin: 0 }}>${b.over ? 'Lewat ' + rupiah(-b.left) + ' dari anggaran bulan ini.' : 'Kira-kira ' + rupiah(b.perDay) + ' per hari untuk ' + b.daysLeft + ' hari ke depan.'}</p>`
        : html`<p className="hint" style=${{ margin: 0 }}>Belum ada anggaran bulanan. Atur di tab Uang supaya kelihatan sisanya.</p>`}
      <p style=${{ margin: '12px 0 0' }}><button type="button" className="btn sm" onClick=${() => go('uang')}>Catat uang</button></p>
    <//>`;
  }

  function Home() {
    const { S, go } = useApp();
    const di = dayIdx();
    const todays = S.classes.filter((c) => c.day === di).sort((a, b) => mins(a.start) - mins(b.start));
    const stt = classStatus(todays);
    const open = S.tasks.filter((t) => !t.done).sort(taskSort);
    const late = open.filter((t) => t.due && diffDays(t.due) < 0).length;
    const near = S.confidants.filter((c) => c.rank < 10).sort((a, b) => b.progress - a.progress || b.rank - a.rank)[0];
    const quiet = S.confidants.map((c) => ({ c, n: c.last ? -diffDays(c.last) : null })).filter((x) => x.n === null || x.n >= 7).slice(0, 2);
    const checked = !!S.checkins[today()], cs = checkinStreak(S);
    const notes = S.notes.slice().sort((a, b) => b.updated - a.updated).slice(0, 2);

    return html`<div className="cols">
      <div className="stack"><${StatsPanel} /><${MoneyGlance} /></div>
      <div className="stack">
        <${Panel} title="Kuliah hari ini">
          ${todays.length ? html`<div className="list">${todays.map((c) => html`<${ClassRow} key=${c.id} c=${c} status=${stt[c.id]} />`)}</div>` : html`<p className="empty">Tidak ada kelas hari ini. Isi jadwal mingguanmu di tab Jadwal.</p>`}
        <//>
        <${Panel} title="Kebiasaan hari ini">
          ${S.habits.length ? html`<div className="list">${S.habits.map((h) => html`<${HabitToday} key=${h.id} h=${h} />`)}</div>` : html`<p className="empty">Belum ada kebiasaan. Mulai dari satu yang kecil di tab Kebiasaan.</p>`}
        <//>
        <${Panel} title="Belum selesai">
          ${late > 0 && html`<p className="hint" style=${{ margin: '0 0 6px', color: 'var(--red-hi)' }}>${late + ' task sudah lewat tenggat.'}</p>`}
          ${open.length ? html`<div className="list">${open.slice(0, 5).map((t) => html`<${TaskRow} key=${t.id} t=${t} />`)}</div>` : html`<p className="empty">Semua task beres. Tambah yang baru di tab Task.</p>`}
          ${open.length > 5 && html`<p className="hint">${'Dan ' + (open.length - 5) + ' task lain di tab Task.'}</p>`}
        <//>
        <${Panel} title="Catatan terbaru">
          ${notes.length ? html`<div className="list">${notes.map((n) => html`<div className="row" key=${n.id} style=${{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
              <div><div className="t">${n.title || 'Tanpa judul'}</div><div className="m">${n.course && html`<span className="pill">${n.course}</span>`}<span>${shortDate(new Date(n.updated).toISOString().slice(0, 10))}</span></div></div>
            </div>`)}</div>` : html`<p className="empty">Belum ada catatan. Tulis ringkasan kuliah di tab Catatan.</p>`}
          <p style=${{ margin: '12px 0 0' }}><button type="button" className="btn sm ghost" onClick=${() => go('catatan')}>Buka Catatan</button></p>
        <//>
        <${Panel} title="Teman dan refleksi">
          <p className="empty" style=${{ padding: 0 }}>
            ${checked ? 'Refleksi hari ini sudah diisi. Beruntun ' + cs + ' hari.' : cs > 0 ? 'Refleksi hari ini belum diisi. Jangan putus beruntunmu, sekarang ' + cs + ' hari.' : 'Refleksi hari ini belum diisi.'}
          </p>
          ${!checked && html`<p style=${{ margin: '10px 0 0' }}><button type="button" className="btn sm" onClick=${() => go('refleksi')}>Isi refleksi</button></p>`}
          ${near && html`<div className="near"><${Avatar} id=${near.id} name=${near.name} size=${52} editable=${false} />
            <p className="empty" style=${{ padding: 0 }}>${near.name + ' (arcana ' + arcOf(near.arcana).name + ') tinggal ' + (NEED - near.progress) + ' kali nongkrong lagi menuju Rank ' + (near.rank + 1) + '.'}</p></div>`}
          ${quiet.map((x) => html`<p key=${x.c.id} className="empty" style=${{ padding: 0, marginTop: 6 }}>${x.n === null ? 'Kamu belum mencatat nongkrong dengan ' + x.c.name + '.' : 'Sudah ' + x.n + ' hari tidak nongkrong dengan ' + x.c.name + '.'}</p>`)}
          <p style=${{ margin: '12px 0 0' }}><button type="button" className="btn sm ghost" onClick=${() => go('confidant')}>Buka Confidant</button></p>
        <//>
      </div>
    </div>`;
  }
  RU.views.home = Home;
})(window.RU = window.RU || {});
