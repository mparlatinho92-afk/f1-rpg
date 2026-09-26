#!/usr/bin/env node
/**
 * regen-staerke-real.js — was unterscheidet teilweise und durchgehend nasse Rennen real?
 *
 * Ausfallquote (echte Starter, jede Nicht-Zahl) und Unfall-Anteil an den Ausfällen, je
 * Rennwetter aus der Wiki-Infobox (tools/quellen/wiki-stoerungen.json), relativ zum
 * trockenen Mittel DERSELBEN Dekade (sonst misst man die Ära statt des Wetters).
 * Dazu der Anteil teilweise/durchgehend unter den nassen Rennen je Dekade.
 * Grundlage für Schritt 4 des Regen-Modells (26.09.2026).
 *
 * Aufruf: node tests/regen-staerke-real.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const L = f => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'f1db-json-splitted', f), 'utf8'));
const wiki = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'quellen', 'wiki-stoerungen.json'), 'utf8'));
const rr = L('f1db-races-race-results.json');
const UNFALL = /accident|collision|spun off|\bspin\b/i;
const proRennen = {};
for (const x of rr) {
    if (/^(DNQ|DNPQ|DNS|DNP|EX|WD)$/.test(x.positionText)) continue;
    const r = proRennen[x.raceId] = proRennen[x.raceId] || { jahr: x.year, n: 0, dnf: 0, unfall: 0 };
    r.n++;
    if (!/^\d+$/.test(x.positionText)) { r.dnf++; if (UNFALL.test(x.reasonRetired || '')) r.unfall++; }
}
const dek = y => Math.floor(y / 10) * 10;
// Trockenes Mittel je Dekade
const tr = {};
for (const [id, r] of Object.entries(proRennen)) {
    const w = wiki[id]; if (!w || w.regen.rennen !== 'trocken') continue;
    const t = tr[dek(r.jahr)] = tr[dek(r.jahr)] || { n: 0, dnf: 0, unfall: 0 };
    t.n += r.n; t.dnf += r.dnf; t.unfall += r.unfall;
}
const art = { trocken: [], teilweise: [], nass: [] }, anteil = {};
for (const [id, r] of Object.entries(proRennen)) {
    const w = wiki[id]; if (!w || !w.regen.rennen) continue;
    const t = tr[dek(r.jahr)]; if (!t || !r.n) continue;
    const dnfRel = (r.dnf / r.n) / (t.dnf / t.n);
    const unfRel = (r.unfall / r.n) / (t.unfall / t.n || 1);
    art[w.regen.rennen].push({ dnfRel, unfRel, unfAnteil: r.dnf ? r.unfall / r.dnf : 0 });
    if (w.regen.rennen !== 'trocken') { const a = anteil[dek(r.jahr)] = anteil[dek(r.jahr)] || { teilweise: 0, nass: 0 }; a[w.regen.rennen]++; }
}
const m = (l, k) => l.reduce((s, x) => s + x[k], 0) / l.length;
console.log('Wetter      |   n | DNF-Quote rel. zu trocken | Unfälle je Starter rel. | Unfall-Anteil an DNF');
for (const [k, l] of Object.entries(art))
    console.log(k.padEnd(11), '|', String(l.length).padStart(4), '|', m(l, 'dnfRel').toFixed(2).padStart(10), '               |', m(l, 'unfRel').toFixed(2).padStart(8), '              |', (m(l, 'unfAnteil') * 100).toFixed(0) + ' %');
console.log('\nAnteil teilweise an den nassen Rennen je Dekade:');
console.log('  ' + Object.entries(anteil).map(([d, a]) => d + ' ' + (a.teilweise / (a.teilweise + a.nass) * 100).toFixed(0) + ' % (n ' + (a.teilweise + a.nass) + ')').join(' · '));

// ── Ausfälle je Team-Drittel und Wetter (Drittel nach mittlerem Startplatz der Saison) ──
{
    const grid = L('f1db-races-starting-grid-positions.json');
    const ts = {}, tn = {};
    for (const g of grid) if (g.positionNumber) { const k = g.year + '|' + g.constructorId; ts[k] = (ts[k] || 0) + g.positionNumber; tn[k] = (tn[k] || 0) + 1; }
    const drittel = {}, jahr = {};
    for (const k in ts) { const [y, c] = k.split('|'); if (tn[k] >= 8) (jahr[y] = jahr[y] || []).push([c, ts[k] / tn[k]]); }
    for (const [y, l] of Object.entries(jahr)) { l.sort((a, b) => a[1] - b[1]); const n3 = Math.round(l.length / 3); l.forEach(([c], i) => drittel[y + '|' + c] = i < n3 ? 'stark' : i >= l.length - n3 ? 'schwach' : 'mittel'); }
    const z = {};
    for (const x of rr) {
        if (/^(DNQ|DNPQ|DNS|DNP|EX|WD)$/.test(x.positionText)) continue;
        const w = wiki[x.raceId]; const d = drittel[x.year + '|' + x.constructorId];
        if (!w || !w.regen.rennen || !d) continue;
        const k = w.regen.rennen + '|' + d; const e = z[k] = z[k] || { n: 0, mech: 0, unf: 0 };
        e.n++;
        if (!/^\d+$/.test(x.positionText)) { if (UNFALL.test(x.reasonRetired || '')) e.unf++; else e.mech++; }
    }
    console.log('\nAusfall je Starter nach Team-Drittel (Technik / Unfall):');
    for (const wt of ['trocken', 'teilweise', 'nass'])
        console.log('  ' + wt.padEnd(10), ['stark', 'mittel', 'schwach'].map(d => { const e = z[wt + '|' + d]; return d + ' ' + (e.mech / e.n * 100).toFixed(1) + ' / ' + (e.unf / e.n * 100).toFixed(1) + ' %'; }).join(' · '));
}
