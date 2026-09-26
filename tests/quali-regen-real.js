#!/usr/bin/env node
/**
 * quali-regen-real.js — wie oft ist das Qualifying nass, bedingt auf das Rennwetter?
 * Zwei Wege: Regenwörter im Qualifying-Abschnitt des Wiki-Artikels (erst ab 2000
 * verlässlich, ältere Artikel haben keine Abschnitte) und die beste Quali-Zeit gegen den
 * Median derselben Streckenvariante ±4 Jahre (alle Jahre, unschärfer).
 * Ergebnis 26.09.2026: Quali nass | Rennen nass 17–33 %, | Rennen trocken 10–14 %,
 * gesamt 11–17 % — schwach gekoppelt, im Spiel dagegen immer identisch.
 * Aufruf: node tests/quali-regen-real.js   (aus dem Projektordner)
 */
const fs = require('fs');
const L = f => JSON.parse(fs.readFileSync('f1db-json-splitted/' + f, 'utf8'));
const e = JSON.parse(fs.readFileSync('tools/quellen/wiki-stoerungen.json', 'utf8'));
const races = L('f1db-races.json'), q = L('f1db-races-qualifying-results.json');
const R = new Map(races.map(r => [r.id, r]));
const med = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN; };
const qZ = {}; for (const x of q) { const t = x.year >= 2006 ? x.q1Millis : (x.timeMillis || x.q1Millis); if (t && (!qZ[x.raceId] || t < qZ[x.raceId])) qZ[x.raceId] = t; }
const qL = {};
for (const [id, t] of Object.entries(qZ)) { const r = R.get(+id); if (!r) continue;
  const ref = Object.entries(qZ).filter(([j]) => { const o = R.get(+j); return o && +j !== +id && o.circuitLayoutId === r.circuitLayoutId && Math.abs(o.year - r.year) <= 4; }).map(([, v]) => v);
  if (ref.length >= 2) qL[id] = (t / med(ref) - 1) * 100; }
function tab(name, filt, qnass) {
  const z = { rn: [0, 0], rt: [0, 0] };
  for (const [id, x] of Object.entries(e)) { if (!filt(x) || !x.regen.rennen) continue; const qn = qnass(id, x); if (qn == null) continue;
    const k = x.regen.rennen === 'trocken' ? 'rt' : 'rn'; z[k][0]++; if (qn) z[k][1]++; }
  const p = a => (a[1] / a[0] * 100).toFixed(1) + ' % (n ' + a[0] + ')';
  const pq = (z.rn[1] + z.rt[1]) / (z.rn[0] + z.rt[0]) * 100;
  console.log(name.padEnd(34), 'Quali nass | Rennen nass:', p(z.rn), '· | Rennen trocken:', p(z.rt), '· gesamt', pq.toFixed(1) + ' %');
}
tab('Wiki-Abschnitt, 2000–2025', x => x.jahr >= 2000 && x.abschnitte.quali, (id, x) => x.regen.quali);
for (const s of [4, 6]) {
  tab('Quali-Zeit > ' + s + ' %, 1950–1999', x => x.jahr < 2000, id => qL[id] == null ? null : qL[id] > s);
  tab('Quali-Zeit > ' + s + ' %, 2000–2025', x => x.jahr >= 2000, id => qL[id] == null ? null : qL[id] > s);
}
