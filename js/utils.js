/* utils.js: small helpers with no game rules in them. Loads first. */
(function (RU) {
  'use strict';
  if (!window.React || !window.ReactDOM || !window.htm) {
    var r = document.getElementById('root');
    if (r) r.textContent = 'Library gagal dimuat. Coba muat ulang halaman.';
    throw new Error('React / htm tidak termuat');
  }

  const html = htm.bind(React.createElement);
  const uid = () => Math.random().toString(36).slice(2, 9);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const p2 = (n) => (n < 10 ? '0' : '') + n;

  /* dates are plain 'YYYY-MM-DD' strings in local time */
  const dstr = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  const parse = (s) => new Date(s + 'T00:00:00');
  const today = () => dstr(new Date());
  const shiftDate = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return dstr(d); };
  const addDays = (n) => shiftDate(today(), n);
  const lastDays = (n, end) => Array.from({ length: n }, (_, i) => shiftDate(end || today(), i - (n - 1)));
  const dayIdx = () => (new Date().getDay() + 6) % 7;
  const dayIdxOf = (s) => (parse(s).getDay() + 6) % 7;
  const mins = (t) => { const p = String(t || '0:0').split(':'); return +p[0] * 60 + +p[1]; };
  const diffDays = (due) => Math.round((parse(due) - parse(today())) / 86400000);
  const shortDate = (s) => parse(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  const longDate = (s) => parse(s).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
  const weekNum = () => Math.floor(parse(today()).getTime() / 604800000);

  /* months are 'YYYY-MM' */
  const monthKey = (s) => (s || today()).slice(0, 7);
  const monthLabel = (ym) => new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const shiftMonth = (ym, n) => { const d = new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1 + n, 1); return d.getFullYear() + '-' + p2(d.getMonth() + 1); };
  const daysInMonth = (ym) => new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate();

  /* money */
  const rupiah = (n) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
  function compactRp(n) {
    const a = Math.abs(n);
    if (a >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '').replace('.', ',') + ' jt';
    if (a >= 1e3) return Math.round(n / 1e3) + ' rb';
    return String(Math.round(n));
  }
  function niceStep(max) {
    const raw = max / 3, pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const pick = [1, 2, 2.5, 5, 10].find((m) => m * pow >= raw);
    return pick * pow;
  }

  /* square-crop an image file to a small JPEG data URL (for profile photos) */
  function fileToAvatar(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) return reject(new Error('Pilih file gambar'));
      if (file.size > 15 * 1024 * 1024) return reject(new Error('Gambar terlalu besar, maksimal 15 MB'));
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        try {
          const size = 192, c = document.createElement('canvas');
          c.width = c.height = size;
          const g = c.getContext('2d'), side = Math.min(img.naturalWidth, img.naturalHeight);
          g.fillStyle = '#161012'; g.fillRect(0, 0, size, size);
          g.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
          resolve(c.toDataURL('image/jpeg', 0.85));
        } catch (e) { reject(new Error('Gambar tidak bisa diproses')); }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gambar tidak bisa dibaca')); };
      img.src = url;
    });
  }

  Object.assign(RU, {
    html, uid, clone, p2, dstr, parse, today, shiftDate, addDays, lastDays, dayIdx, dayIdxOf, mins, diffDays,
    shortDate, longDate, weekNum, monthKey, monthLabel, shiftMonth, daysInMonth, rupiah, compactRp, niceStep, fileToAvatar
  });
})(window.RU = window.RU || {});
