/* domain.js: pure game and money rules. No React, no DOM. */
(function (RU) {
  'use strict';
  const { STATS, TH, CATS, mins, parse, today, addDays, lastDays, diffDays, shortDate, monthKey, daysInMonth } = RU;

  /* ----- levels ----- */
  function lvl(p) { let l = 1; for (let i = 1; i < TH.length; i++) if (p >= TH[i]) l = i + 1; return l; }
  function prog(p) {
    const l = lvl(p);
    if (l >= 5) return { l: 5, frac: 1, cur: p - TH[4], need: 0 };
    const a = TH[l - 1], b = TH[l];
    return { l, frac: (p - a) / (b - a), cur: p - a, need: b - a };
  }
  function playerLevel(stats) {
    const t = Object.values(stats).reduce((a, b) => a + b, 0);
    return { lv: Math.floor(t / 10) + 1, frac: (t % 10) / 10 };
  }

  /* ----- tasks and classes ----- */
  const taskSort = (a, b) => { const x = a.due || '9999-12-31', y = b.due || '9999-12-31'; return x < y ? -1 : x > y ? 1 : 0; };
  function dueInfo(t) {
    if (!t.due) return null;
    const n = diffDays(t.due);
    if (n < 0) return { c: 'late', l: 'Telat ' + -n + ' hari' };
    if (n === 0) return { c: 'today', l: 'Hari ini' };
    if (n === 1) return { c: 'today', l: 'Besok' };
    if (n <= 6) return { c: '', l: n + ' hari lagi' };
    return { c: '', l: shortDate(t.due) };
  }
  function classStatus(list) {
    const now = new Date(), m = now.getHours() * 60 + now.getMinutes();
    let nextSet = false; const out = {};
    list.forEach((c) => {
      if (m >= mins(c.end)) out[c.id] = 'Selesai';
      else if (m >= mins(c.start)) out[c.id] = 'Berlangsung';
      else if (!nextSet) { out[c.id] = 'Berikutnya'; nextSet = true; } else out[c.id] = 'Nanti';
    });
    return out;
  }

  /* ----- streaks and reflection ----- */
  function streak(has) {
    let n = 0, i = has(addDays(0)) ? 0 : 1;
    for (; i < 400; i++) { if (has(addDays(-i))) n++; else break; }
    return n;
  }
  const habitStatus = (h, d) => (h.logs && h.logs[d]) || (h.done && h.done[d] ? 'full' : '');
  const habitScheduled = (h, d) => { const days = Array.isArray(h.days) ? h.days : [0,1,2,3,4,5,6]; return h.frequency !== 'custom' || days.includes(dayIndex(d)); };
  function dayIndex(d) { return (parse(d).getDay() + 6) % 7; }
  const habitStreak = (h) => streak((d) => !!habitStatus(h, d));
  function habitConsistency(S, days) {
    let scheduled = 0, completed = 0;
    S.habits.forEach((h) => days.forEach((d) => { if (habitScheduled(h, d)) { scheduled++; if (habitStatus(h, d)) completed++; } }));
    return scheduled ? Math.round(completed / scheduled * 100) : null;
  }
  const checkinStreak = (S) => streak((d) => !!S.checkins[d]);
  function avgConf(S, days) {
    const v = days.map((d) => S.checkins[d]).filter(Boolean).map((c) => c.conf);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  }

  /* ----- money ----- */
  const zeroCats = () => { const o = {}; CATS.forEach((c) => { o[c.k] = 0; }); return o; };
  const catKey = (k) => (k in zeroCats() ? k : 'lain');
  const monthTx = (S, ym) => S.tx.filter((t) => t.date.slice(0, 7) === ym);

  function monthSummary(S, ym) {
    const r = { inc: 0, out: 0, byCat: zeroCats(), count: 0 };
    monthTx(S, ym).forEach((t) => {
      r.count++;
      if (t.type === 'in') r.inc += t.amount;
      else { r.out += t.amount; r.byCat[catKey(t.cat)] += t.amount; }
    });
    return r;
  }
  function dayTotals(S, days) {
    const map = {};
    days.forEach((d) => { map[d] = { d, byCat: zeroCats(), total: 0, count: 0 }; });
    S.tx.forEach((t) => {
      const m = map[t.date];
      if (t.type === 'out' && m) { m.byCat[catKey(t.cat)] += t.amount; m.total += t.amount; m.count++; }
    });
    return days.map((d) => map[d]);
  }
  const spentOn = (S, date) => dayTotals(S, [date])[0];
  function budgetInfo(S) {
    const ym = monthKey(), spent = monthSummary(S, ym).out, budget = (S.budget && S.budget.amount) || 0;
    const daysLeft = daysInMonth(ym) - new Date().getDate() + 1;
    const left = budget - spent;
    return {
      ym, spent, budget, left, daysLeft, over: budget > 0 && spent > budget,
      frac: budget > 0 ? Math.min(1, spent / budget) : 0,
      perDay: budget > 0 && left > 0 ? Math.floor(left / daysLeft) : 0
    };
  }

  /* ----- weekly review ----- */
  function weekSummary(S) {
    const days = lastDays(7), prev = lastDays(14).slice(0, 7);
    const gain = {}; STATS.forEach((s) => { gain[s.k] = 0; });
    S.events.forEach((e) => { if (days.includes(e.d)) gain[e.k] += e.n; });
    STATS.forEach((s) => { gain[s.k] = Math.max(0, gain[s.k]); });
    const tasksDone = S.tasks.filter((t) => t.done && days.includes(t.doneAt)).length;
    const hangouts = S.confidants.reduce((a, c) => a + (c.log || []).filter((l) => days.includes(l.d)).length, 0);
    const habitRate = habitConsistency(S, days);
    const checkins = days.filter((d) => S.checkins[d]).length;
    const spent = S.tx.filter((t) => t.type === 'out' && days.includes(t.date)).reduce((a, t) => a + t.amount, 0);
    return { gain, tasksDone, hangouts, habitRate, checkins, spent, conf: avgConf(S, days), confPrev: avgConf(S, prev) };
  }

  const hasExamples = (S) =>
    [S.classes, S.tasks, S.confidants, S.habits, S.tx, S.notes].some((l) => l.some((x) => x.example)) ||
    Object.values(S.checkins).some((c) => c.example) || !!(S.budget && S.budget.example);

  Object.assign(RU, {
    lvl, prog, playerLevel, taskSort, dueInfo, classStatus, streak, habitStatus, habitScheduled, habitConsistency, habitStreak, checkinStreak, avgConf,
    zeroCats, monthTx, monthSummary, dayTotals, spentOn, budgetInfo, weekSummary, hasExamples
  });
})(window.RU = window.RU || {});
