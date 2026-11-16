/* views/money.js: the Uang tab. Log income and spending (Makan, Jajan, Keperluan, Lainnya),
 * then see where the money went: a donut for the month and stacked columns for the last 14 days. */
(function (RU) {
  'use strict';
  const { html, CATS, catOf, today, shiftDate, shortDate, longDate, monthKey, monthLabel, shiftMonth, daysInMonth, rupiah, compactRp, niceStep } = RU;
  const { monthTx, monthSummary, dayTotals, budgetInfo } = RU;
  const { useApp, Panel, Field, DelButton } = RU;
  const { useState, useRef } = React;

  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

  /* ----- add a transaction ----- */
  function MoneyForm() {
    const { dispatch, notify } = useApp();
    const [type, setType] = useState('out'), [cat, setCat] = useState('makan'), [amt, setAmt] = useState(''), [date, setDate] = useState(today()), [note, setNote] = useState('');
    const ref = useRef(null);
    const submit = (e) => {
      e.preventDefault();
      const n = parseInt(amt, 10);
      if (!n) return notify('Isi jumlah uangnya');
      if (!date) return notify('Pilih tanggalnya');
      dispatch({ type: 'TX_ADD', item: { type, cat: type === 'in' ? 'masuk' : cat, amount: n, date, note: note.trim() } });
      setAmt(''); setNote(''); if (ref.current) ref.current.focus();
    };
    return html`<form className="form" onSubmit=${submit}>
      <div className="wide seg" role="group" aria-label="Jenis">
        <button type="button" aria-pressed=${type === 'out'} onClick=${() => setType('out')}>Keluar</button>
        <button type="button" aria-pressed=${type === 'in'} onClick=${() => setType('in')}>Masuk</button>
      </div>
      <${Field} label="Jumlah (Rp)" wide=${true}>
        <input ref=${ref} type="text" inputMode="numeric" autoComplete="off" placeholder="0" value=${amt ? Number(amt).toLocaleString('id-ID') : ''} onChange=${(e) => setAmt(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10))} />
      <//>
      ${type === 'out' && html`<div className="wide"><div className="field"><span>Untuk apa</span></div>
        <div className="catpick" role="group" aria-label="Kategori">
          ${CATS.map((c) => html`<button key=${c.k} type="button" aria-pressed=${cat === c.k} onClick=${() => setCat(c.k)}><i className="dot-c" style=${{ background: c.color }}></i>${c.n}</button>`)}
        </div></div>`}
      <${Field} label="Tanggal"><input type="date" value=${date} onChange=${(e) => setDate(e.target.value)} /><//>
      <${Field} label=${type === 'in' ? 'Dari mana' : 'Catatan'}><input type="text" maxLength="60" autoComplete="off" placeholder=${type === 'in' ? 'Kiriman, beasiswa, gaji' : 'Opsional'} value=${note} onChange=${(e) => setNote(e.target.value)} /><//>
      <div className="wide"><button className="btn" type="submit">${type === 'in' ? 'Catat uang masuk' : 'Catat pengeluaran'}</button></div>
    </form>`;
  }

  /* ----- charts ----- */
  function Donut({ byCat, total }) {
    const R = 62, C = 2 * Math.PI * R, segs = CATS.filter((c) => byCat[c.k] > 0);
    let off = 0;
    const label = segs.map((c) => c.n + ' ' + pct(byCat[c.k], total) + ' persen').join(', ');
    return html`<svg className="donut" viewBox="0 0 180 180" role="img" aria-label=${'Pengeluaran ' + rupiah(total) + ': ' + label}>
      <circle cx="90" cy="90" r=${R} fill="none" style=${{ stroke: 'var(--surface-2)' }} strokeWidth="26" />
      ${segs.map((c) => {
        const len = (byCat[c.k] / total) * C, gap = segs.length > 1 ? 2 : 0;
        const el = html`<circle key=${c.k} cx="90" cy="90" r=${R} fill="none" style=${{ stroke: c.color }} strokeWidth="26"
          strokeDasharray=${Math.max(0, len - gap).toFixed(2) + ' ' + C.toFixed(2)} strokeDashoffset=${(-off).toFixed(2)} transform="rotate(-90 90 90)">
          <title>${c.n + ': ' + rupiah(byCat[c.k])}</title></circle>`;
        off += len; return el;
      })}
      <text className="dn-v" x="90" y="92" textAnchor="middle">${compactRp(total)}</text>
      <text className="dn-l" x="90" y="110" textAnchor="middle">keluar</text>
    </svg>`;
  }

  function CatBreakdown({ sum }) {
    const total = sum.out;
    const top = CATS.slice().sort((a, b) => sum.byCat[b.k] - sum.byCat[a.k])[0];
    return html`<div>
      <div className="donut-wrap">
        <${Donut} byCat=${sum.byCat} total=${total} />
        <div>
          ${CATS.map((c) => html`<div className="catrow" key=${c.k}>
            <span className="catname"><i className="dot-c" style=${{ background: c.color }}></i>${c.n}</span>
            <span className="catamt">${rupiah(sum.byCat[c.k])}<small>${pct(sum.byCat[c.k], total) + '%'}</small></span>
            <div className="bar"><i style=${{ width: pct(sum.byCat[c.k], total) + '%', background: c.color }}></i></div>
          </div>`)}
        </div>
      </div>
      <p className="hint" style=${{ marginTop: 12 }}>${'Terbesar: ' + top.n + ', ' + pct(sum.byCat[top.k], total) + '% dari pengeluaran bulan ini.'}</p>
    </div>`;
  }

  function DailyChart({ S, endDate }) {
    const days = Array.from({ length: 14 }, (_, i) => shiftDate(endDate, i - 13));
    const data = dayTotals(S, days);
    const W = 440, H = 220, L = 48, Rr = 8, T = 10, B = 26;
    const max = Math.max.apply(null, data.map((d) => d.total).concat([0]));
    const step = niceStep(max || 30000), top = Math.max(step, Math.ceil(max / step) * step);
    const y = (v) => T + (1 - v / top) * (H - T - B);
    const bw = (W - L - Rr) / 14, bar = bw * 0.62, cx = (i) => L + i * bw + bw / 2;
    const ticks = []; for (let v = 0; v <= top + 0.1; v += step) ticks.push(v);
    const sum = data.reduce((a, d) => a + d.total, 0);
    return html`<div>
      <div className="legend">${CATS.map((c) => html`<span key=${c.k}><i className="dot-c" style=${{ background: c.color, marginRight: 6 }}></i>${c.n}</span>`)}</div>
      <svg className="chart" viewBox=${'0 0 ' + W + ' ' + H} role="img" aria-label=${'Pengeluaran harian 14 hari berakhir ' + shortDate(endDate) + ', total ' + rupiah(sum)}>
        ${ticks.map((v) => html`<g key=${v}><line className="grid" x1=${L} x2=${W - Rr} y1=${y(v)} y2=${y(v)} /><text className="ax" x=${L - 6} y=${y(v) + 4} textAnchor="end">${compactRp(v)}</text></g>`)}
        ${data.map((d, i) => {
          let cum = 0;
          return html`<g key=${d.d}><title>${shortDate(d.d) + ': ' + rupiah(d.total)}</title>
            ${CATS.map((c) => {
              const v = d.byCat[c.k]; if (!v) return null;
              const y1 = y(cum + v), h = y(cum) - y1; cum += v;
              return html`<rect key=${c.k} x=${(cx(i) - bar / 2).toFixed(1)} y=${y1.toFixed(1)} width=${bar.toFixed(1)} height=${Math.max(1, h - 1).toFixed(1)} style=${{ fill: c.color }} />`;
            })}
          </g>`;
        })}
        ${[0, 7, 13].map((i) => html`<text key=${'x' + i} className="ax" x=${cx(i)} y=${H - 6} textAnchor=${i === 0 ? 'start' : i === 13 ? 'end' : 'middle'}>${shortDate(days[i])}</text>`)}
      </svg>
      <p className="hint">${'Total 14 hari ' + rupiah(sum) + ', rata-rata ' + rupiah(sum / 14) + ' per hari.'}</p>
    </div>`;
  }

  /* ----- month summary, budget, history ----- */
  function Summary({ ym, setYm, sum }) {
    const cur = monthKey(), net = sum.inc - sum.out;
    return html`<${Panel} title="Ringkasan">
      <div className="monthnav">
        <button type="button" className="mini" aria-label="Bulan sebelumnya" onClick=${() => setYm(shiftMonth(ym, -1))}>‹</button>
        <b>${monthLabel(ym)}</b>
        <button type="button" className="mini" aria-label="Bulan berikutnya" disabled=${ym >= cur} onClick=${() => setYm(shiftMonth(ym, 1))}>›</button>
      </div>
      <div className="kpis" style=${{ marginTop: 14 }}>
        <div className="kpi"><b>${compactRp(sum.inc)}</b><span>uang masuk</span></div>
        <div className="kpi"><b>${compactRp(sum.out)}</b><span>uang keluar</span></div>
        <div className="kpi"><b className=${net < 0 ? 'neg' : ''}>${(net < 0 ? '−' : '') + compactRp(Math.abs(net))}</b><span>selisih</span></div>
      </div>
    <//>`;
  }

  function Budget({ S }) {
    const { dispatch } = useApp();
    const b = budgetInfo(S);
    const [val, setVal] = useState(S.budget.amount ? String(S.budget.amount) : '');
    const save = (e) => { e.preventDefault(); dispatch({ type: 'BUDGET_SET', amount: parseInt(val, 10) || 0 }); };
    return html`<${Panel} title="Anggaran bulan ini">
      ${b.budget > 0 && html`<div style=${{ marginBottom: 14 }}>
        <div className=${'bar big' + (b.over ? ' over' : '')}><i style=${{ width: (b.frac * 100).toFixed(0) + '%' }}></i></div>
        <p className="hint">${rupiah(b.spent) + ' dari ' + rupiah(b.budget) + (S.budget.example ? ' (contoh)' : '') + '. ' +
          (b.over ? 'Lewat ' + rupiah(-b.left) + '.' : 'Sisa ' + rupiah(b.left) + ', kira-kira ' + rupiah(b.perDay) + ' per hari untuk ' + b.daysLeft + ' hari.')}</p></div>`}
      <form className="form" onSubmit=${save}>
        <${Field} label="Anggaran sebulan (Rp)" wide=${true}>
          <input type="text" inputMode="numeric" autoComplete="off" placeholder="Kosongkan untuk tanpa anggaran" value=${val ? Number(val).toLocaleString('id-ID') : ''} onChange=${(e) => setVal(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10))} />
        <//>
        <div className="wide"><button className="btn sm" type="submit">Simpan anggaran</button></div>
      </form>
    <//>`;
  }

  function History({ S, ym }) {
    const { dispatch } = useApp();
    const [all, setAll] = useState(false);
    const list = monthTx(S, ym).slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const shown = all ? list : list.slice(0, 25);
    const groups = [];
    shown.forEach((t) => { const g = groups[groups.length - 1]; if (g && g.d === t.date) g.items.push(t); else groups.push({ d: t.date, items: [t] }); });
    return html`<${Panel} title="Riwayat">
      ${groups.length ? groups.map((g) => {
        const dayOut = g.items.filter((t) => t.type === 'out').reduce((a, t) => a + t.amount, 0);
        return html`<div key=${g.d} className="txday">
          <div className="txhead"><b>${longDate(g.d)}</b>${dayOut > 0 && html`<span>${'keluar ' + rupiah(dayOut)}</span>`}</div>
          ${g.items.map((t) => {
            const c = t.type === 'out' ? catOf(t.cat) : null;
            return html`<div className="txrow" key=${t.id}>
              <span className="tag">${c ? html`<i className="dot-c" style=${{ background: c.color }}></i>${c.n}` : 'Masuk'}</span>
              <span className="txnote">${t.note || (c ? c.n : 'Uang masuk')}${t.example && html` <span className="pill ex">Contoh</span>`}</span>
              <span className=${t.type === 'in' ? 'amt in' : 'amt'}>${(t.type === 'in' ? '+' : '−') + rupiah(t.amount)}</span>
              <${DelButton} onConfirm=${() => dispatch({ type: 'DELETE', list: 'tx', id: t.id })} />
            </div>`;
          })}
        </div>`;
      }) : html`<p className="empty">Belum ada catatan uang di bulan ini. Catat pengeluaran pertamamu di formulir.</p>`}
      ${list.length > 25 && html`<p style=${{ margin: '12px 0 0' }}><button type="button" className="btn sm ghost" onClick=${() => setAll(!all)}>${all ? 'Tampilkan lebih sedikit' : 'Tampilkan semua (' + list.length + ')'}</button></p>`}
    <//>`;
  }

  function Money() {
    const { S } = useApp();
    const [ym, setYm] = useState(monthKey());
    const sum = monthSummary(S, ym);
    const end = ym === monthKey() ? today() : ym + '-' + String(daysInMonth(ym)).padStart(2, '0');
    return html`<div className="cols">
      <div className="stack">
        <${Summary} ym=${ym} setYm=${setYm} sum=${sum} />
        <${Panel} title="Catat uang"><${MoneyForm} /><p className="hint">Mencatat keuangan minimal sekali sehari memberi +1 Proficiency.</p><//>
        <${Panel} title="Habis ke mana">
          ${sum.out > 0 ? html`<${CatBreakdown} sum=${sum} />` : html`<p className="empty">Belum ada pengeluaran di bulan ini, jadi belum ada yang bisa digambar.</p>`}
        <//>
      </div>
      <div className="stack">
        <${Panel} title="14 hari terakhir"><${DailyChart} S=${S} endDate=${end} /><//>
        <${Budget} S=${S} key=${S.budget.amount + ':' + S.budget.example} />
        <${History} S=${S} ym=${ym} />
      </div>
    </div>`;
  }
  RU.views.uang = Money;
})(window.RU = window.RU || {});
