/* ui.js: shared building blocks used by more than one view. */
(function (RU) {
  'use strict';
  const { html, STATS, ARC, prog, dueInfo, statOf, habitStreak, habitStatus, today, shortDate, lastDays } = RU;
  const { useState, useEffect, useRef, createContext, useContext } = React;

  const Ctx = createContext(null);
  const useApp = () => useContext(Ctx);

  function Panel({ title, children }) {
    return html`<section className="panel">${title && html`<h2 className="h2">${title}</h2>`}${children}</section>`;
  }
  function Field({ label, wide, children }) {
    return html`<label className=${'field' + (wide ? ' wide' : '')}><span>${label}</span>${children}</label>`;
  }
  function Options({ items }) { return items.map((it) => html`<option key=${it[0]} value=${it[0]}>${it[1]}</option>`); }
  const statItems = STATS.map((s) => [s.k, s.n]);
  const arcItems = ARC.map((a) => [a.id, a.num + ' · ' + a.name]);

  function Check({ on, onClick, label }) {
    return html`<button type="button" className="chk" aria-pressed=${on} aria-label=${label} onClick=${onClick}>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10.5l4.5 4.5L17 5" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="square" /></svg>
    </button>`;
  }

  /* two-step delete: first click arms the button, second click deletes */
  function DelButton({ onConfirm }) {
    const [armed, setArmed] = useState(false);
    useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 3000); return () => clearTimeout(t); }, [armed]);
    return html`<button type="button" className=${'del' + (armed ? ' armed' : '')} onClick=${() => { if (armed) { setArmed(false); onConfirm(); } else setArmed(true); }}>${armed ? 'Yakin?' : 'Hapus'}</button>`;
  }

  function Toast({ toast }) {
    const [on, setOn] = useState(false);
    useEffect(() => {
      if (!toast.id) return;
      setOn(true);
      const t = setTimeout(() => setOn(false), 2400);
      return () => clearTimeout(t);
    }, [toast.id]);
    return html`<div className=${'toast' + (on ? ' on' : '')} role="status" aria-live="polite">${toast.text}</div>`;
  }

  function Scale({ value, onChange, labels, name }) {
    return html`<div>
      <div className="scale" role="group" aria-label=${name}>
        ${[1, 2, 3, 4, 5].map((n) => html`<button key=${n} type="button" aria-pressed=${value === n} onClick=${() => onChange(n)}>${n}</button>`)}
      </div>
      <p className="hint">${value ? labels[value - 1] : 'Pilih 1 sampai 5'}</p>
    </div>`;
  }

  /* Profile photo. id is "me" or a friend's id. Click it to pick a photo from the device. */
  function Avatar({ id, name, size, badge, editable }) {
    const { S, dispatch, notify } = useApp();
    const url = S.avatars[id], canEdit = editable !== false;
    const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
    const onFile = async (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!f) return;
      try { dispatch({ type: 'AVATAR_SET', key: id, url: await RU.fileToAvatar(f) }); }
      catch (err) { notify(err.message || 'Foto gagal dipakai'); }
    };
    const face = url ? html`<img src=${url} alt=${'Foto ' + name} />` : html`<span className="initial" aria-hidden="true">${initial}</span>`;
    return html`<div className=${'avatar-wrap' + (canEdit ? '' : ' static')} style=${{ '--av': size + 'px' }}>
      ${canEdit
        ? html`<label className="avatar">${face}<span className="av-edit">${url ? 'Ganti' : 'Foto'}</span>
            <input className="sr" type="file" accept="image/*" aria-label=${'Pilih foto untuk ' + name} onChange=${onFile} /></label>`
        : html`<div className="avatar">${face}</div>`}
      ${badge && html`<span className="av-badge">${badge}</span>`}
      ${canEdit && url && html`<button type="button" className="av-x" aria-label=${'Hapus foto ' + name} onClick=${() => dispatch({ type: 'AVATAR_CLEAR', key: id })}>×</button>`}
    </div>`;
  }

  function Radar({ stats }) {
    const cx = 220, cy = 165, R = 100, n = 5;
    const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const pt = (i, v) => [cx + Math.cos(ang(i)) * R * v / 5, cy + Math.sin(ang(i)) * R * v / 5];
    const f = (p) => p[0].toFixed(1) + ',' + p[1].toFixed(1);
    const poly = (v) => STATS.map((_, i) => f(pt(i, v))).join(' ');
    const vals = STATS.map((s) => { const pr = prog(stats[s.k]); return { s, pr, v: pr.l < 5 ? pr.l + pr.frac : 5 }; });
    const summary = vals.map((x) => x.s.n + ' level ' + x.pr.l).join(', ');
    return html`<svg className="radar" viewBox="0 0 440 300" role="img" aria-label=${'Grafik stat: ' + summary}>
      ${[1, 2, 3, 4, 5].map((v) => html`<polygon key=${'r' + v} className="ring" points=${poly(v)} />`)}
      ${STATS.map((_, i) => { const e = pt(i, 5); return html`<line key=${'a' + i} className="axis" x1=${cx} y1=${cy} x2=${e[0].toFixed(1)} y2=${e[1].toFixed(1)} />`; })}
      <polygon className="shape" points=${vals.map((x, i) => f(pt(i, x.v))).join(' ')} />
      ${vals.map((x, i) => { const p = pt(i, x.v); return html`<circle key=${'d' + i} className="dot" cx=${p[0].toFixed(1)} cy=${p[1].toFixed(1)} r="4" />`; })}
      ${vals.map((x, i) => {
        const a = ang(i), lp = pt(i, 6.4);
        const anchor = Math.abs(Math.sin(a)) > 0.7 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
        return html`<g key=${'l' + i}>
          <text className="lb" x=${lp[0].toFixed(1)} y=${lp[1].toFixed(1)} textAnchor=${anchor}>${x.s.n}</text>
          <text className="lv" x=${lp[0].toFixed(1)} y=${(lp[1] + 16).toFixed(1)} textAnchor=${anchor}>${'LV ' + x.pr.l}</text>
        </g>`;
      })}
    </svg>`;
  }

  function TaskRow({ t }) {
    const { dispatch } = useApp();
    const di = dueInfo(t), st = statOf(t.stat);
    return html`<div className=${'row' + (t.done ? ' done' : '')}>
      <${Check} on=${t.done} label=${t.done ? 'Batalkan selesai' : 'Tandai selesai'} onClick=${() => dispatch({ type: 'TASK_TOGGLE', id: t.id })} />
      <div><div className="t">${t.title}</div>
        <div className="m">
          ${di && !t.done && html`<span className=${'pill ' + di.c}>${di.l}</span>`}
          <span>${'+' + t.pts + ' ' + st.n}</span>
          ${t.mission && html`<span className="pill">Misi</span>`}
          ${t.example && html`<span className="pill ex">Contoh</span>`}
        </div></div>
      <${DelButton} onConfirm=${() => dispatch({ type: 'DELETE', list: 'tasks', id: t.id })} />
    </div>`;
  }

  function ClassRow({ c, status }) {
    const { dispatch } = useApp();
    return html`<div className="row">
      <span className="time">${c.start + '–' + c.end}</span>
      <div><div className="t">${c.course}</div>
        <div className="m">
          ${c.room && html`<span>${c.room}</span>`}
          ${status && html`<span className=${'pill ' + (status === 'Berlangsung' ? 'now' : '')}>${status}</span>`}
          ${c.example && html`<span className="pill ex">Contoh</span>`}
        </div></div>
      <${DelButton} onConfirm=${() => dispatch({ type: 'DELETE', list: 'classes', id: c.id })} />
    </div>`;
  }

  function HabitToday({ h }) {
    const { dispatch } = useApp();
    const status = habitStatus(h, today()), n = habitStreak(h);
    return html`<div className="row habit-home-row">
      ${!status ? html`<div className="habit-home-actions"><button type="button" className="mini" aria-label=${'Target tercapai: ' + h.name} onClick=${() => dispatch({ type: 'HABIT_LOG', id: h.id, date: today(), status: 'full' })}>✓</button><button type="button" className="mini" aria-label=${'Versi minimum: ' + h.name} onClick=${() => dispatch({ type: 'HABIT_LOG', id: h.id, date: today(), status: 'minimum' })}>½</button></div>` : html`<span className="pill today">${status === 'full' ? 'Target' : 'Minimum'}</span>`}
      <div><div className="t">${h.name}</div><div className="m"><span>${status ? 'Sudah tercatat hari ini' : 'Target utama / versi minimum'}</span></div></div>
      <span className=${'pill' + (n >= 3 ? ' today' : '')}>${n + ' hari'}</span>
    </div>`;
  }

  /* 14-day confidence / mood lines */
  function TrendChart({ checkins }) {
    const days = lastDays(14);
    const W = 440, H = 210, L = 26, Rr = 12, T = 12, B = 26;
    const x = (i) => L + (i * (W - L - Rr)) / (days.length - 1);
    const y = (v) => T + ((5 - v) / 4) * (H - T - B);
    const series = [
      { key: 'conf', name: 'Percaya diri', color: 'var(--red-hi)', dash: '', w: 3.5 },
      { key: 'mood', name: 'Suasana hati', color: 'var(--fg)', dash: '6 5', w: 2.5 }
    ];
    const total = days.filter((d) => checkins[d]).length;
    function segments(key) {
      const segs = []; let cur = [];
      days.forEach((d, i) => { const c = checkins[d]; if (c) cur.push([x(i), y(c[key]), d, c[key]]); else if (cur.length) { segs.push(cur); cur = []; } });
      if (cur.length) segs.push(cur);
      return segs;
    }
    return html`<div>
      <div className="legend">${series.map((s) => html`<span key=${s.key}><i className="sw" style=${{ borderTopColor: s.color, borderTopStyle: s.dash ? 'dashed' : 'solid' }}></i>${s.name}</span>`)}</div>
      <svg className="chart" viewBox=${'0 0 ' + W + ' ' + H} role="img" aria-label=${'Tren percaya diri dan suasana hati 14 hari terakhir, ' + total + ' hari terisi'}>
        ${[1, 2, 3, 4, 5].map((v) => html`<g key=${v}><line className="grid" x1=${L} x2=${W - Rr} y1=${y(v)} y2=${y(v)} /><text className="ax" x=${L - 8} y=${y(v) + 4} textAnchor="end">${v}</text></g>`)}
        ${[0, 7, 13].map((i) => html`<text key=${'t' + i} className="ax" x=${x(i)} y=${H - 6} textAnchor=${i === 0 ? 'start' : i === 13 ? 'end' : 'middle'}>${shortDate(days[i])}</text>`)}
        ${series.map((s) => segments(s.key).map((seg, si) => html`<g key=${s.key + si}>
          ${seg.length > 1 && html`<polyline points=${seg.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')} fill="none" style=${{ stroke: s.color }} strokeWidth=${s.w} strokeDasharray=${s.dash || undefined} strokeLinejoin="round" />`}
          ${seg.map((p) => html`<circle key=${p[2]} cx=${p[0].toFixed(1)} cy=${p[1].toFixed(1)} r="4" style=${{ fill: s.color }}><title>${s.name + ' ' + shortDate(p[2]) + ': ' + p[3]}</title></circle>`)}
        </g>`))}
      </svg>
      ${total < 2 && html`<p className="hint">Isi refleksi beberapa hari dan garisnya akan muncul di sini.</p>`}
    </div>`;
  }

  Object.assign(RU, {
    Ctx, useApp, Panel, Field, Options, statItems, arcItems, Check, DelButton, Toast, Scale, Avatar, Radar,
    TaskRow, ClassRow, HabitToday, TrendChart, views: {}
  });
})(window.RU = window.RU || {});
