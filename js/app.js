/* app.js: layout, navigation, and mounting. Loads last. */
(function (RU) {
  'use strict';
  const { html, TABS, arcOf, playerLevel, today, hasExamples, loadLocal, reducer, usePersistence } = RU;
  const { Ctx, useApp, Options, arcItems, Avatar, Toast } = RU;
  const { useReducer, useState, useCallback, useMemo } = React;

  const SYNC = {
    local: 'Tersimpan di browser ini', saving: 'Menyimpan…', cloud: 'Tersimpan di akunmu',
    fail: 'Belum bisa menyimpan ke akun, data aman di browser ini'
  };

  function Header() {
    const { S, dispatch } = useApp();
    const pl = playerLevel(S.stats), a = arcOf(S.arcana), d = new Date();
    return html`<div className="player panel">
      <${Avatar} id="me" name=${S.name} size=${104} badge=${'LV ' + pl.lv} />
      <div className="pl-main">
        <label className="sr" htmlFor="pname">Nama pemain</label>
        <input id="pname" key=${S.name} className="pname" type="text" maxLength="24" autoComplete="off" defaultValue=${S.name}
          onBlur=${(e) => { const v = e.target.value.trim() || 'Player'; if (v !== S.name) dispatch({ type: 'FIELD', key: 'name', value: v }); }} />
        <div className="pl-row"><label htmlFor="parc">Arcana-mu</label>
          <select id="parc" value=${S.arcana} onChange=${(e) => dispatch({ type: 'FIELD', key: 'arcana', value: e.target.value })}><${Options} items=${arcItems} /></select></div>
        <p className="hint">${a.hint}</p>
        <div className="xp" title="Menuju level berikutnya"><i style=${{ width: (pl.frac * 100).toFixed(0) + '%' }}></i></div>
      </div>
      <div className="pl-date"><small>${d.toLocaleDateString('id-ID', { weekday: 'long' })}</small>${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</div>
    </div>`;
  }

  function App() {
    const [state, dispatch] = useReducer(reducer, null, () => ({ data: loadLocal(), toast: { id: '', text: '' } }));
    const initial = (location.hash || '').replace('#', '');
    const [tab, setTab] = useState(TABS.some((t) => t[0] === initial) ? initial : 'home');
    const status = usePersistence(state.data, dispatch);
    const go = useCallback((t) => { setTab(t); try { history.replaceState(null, '', '#' + t); } catch (e) {} }, []);
    const notify = useCallback((text) => dispatch({ type: 'NOTIFY', text }), []);
    const S = state.data;
    const ctx = useMemo(() => ({ S, dispatch, go, notify }), [S, go, notify]);
    const View = RU.views[tab];
    const badge = { task: S.tasks.filter((t) => !t.done).length, habit: S.habits.filter((h) => !h.done[today()]).length };
    return html`<${Ctx.Provider} value=${ctx}>
      <div className="wrap">
        <div className="brand"><small>jadwal kuliah, task, kebiasaan, teman, catatan, dan uang dalam satu tempat</small><h1><span className="a">Rank Up</span><span className="b">Diary</span></h1></div>
        <${Header} />
        <nav className="nav" aria-label="Menu utama">
          ${TABS.map((t) => html`<button key=${t[0]} type="button" aria-current=${tab === t[0] ? 'page' : undefined} onClick=${() => go(t[0])}>${t[1]}${badge[t[0]] > 0 && html`<span className="count">${badge[t[0]]}</span>`}</button>`)}
        </nav>
        <main key=${tab} className="enter"><${View} /></main>
        <div className="foot">
          <span aria-live="polite">${SYNC[status]}</span>
          ${hasExamples(S) && html`<button type="button" className="del" onClick=${() => dispatch({ type: 'CLEAR_EXAMPLES' })}>Hapus semua data contoh</button>`}
        </div>
      </div>
      <${Toast} toast=${state.toast} />
    <//>`;
  }

  ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
})(window.RU = window.RU || {});
