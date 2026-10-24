#!/usr/bin/env node
/**
 * rennverlauf-real.js — Wie verläuft ein echtes Rennen Runde für Runde? Real 1996–2024.
 *
 * Gegenstück zum Ticker: der zeigt nur den Weg zum feststehenden Ergebnis. Diese Kennzahlen
 * beschreiben, wie dieser Weg real aussieht — damit der Ticker-Verlauf daran gemessen werden kann.
 * `verlaufKennzahlen()` wird exportiert, damit Ticker und Realität mit DERSELBEN Rechnung laufen.
 *
 * Daten: tests/jolpica-data/runden-YYYY.json (erst `node tests/scrape-jolpica-runden.js`)
 *        + F1DB (Konstrukteur je Fahrer und Rennen, für „ohne Dom").
 *
 * Aufruf: node tests/rennverlauf-real.js [vonJahr] [bisJahr]
 *
 * Kennzahlen je Rennen (ab Runde 1 — die Startrunde misst start-runde1-real.js):
 *  - Platzwechsel je Runde: vertauschte Paare zwischen zwei Runden unter den Fahrern, die in beiden
 *    liegen. ⚠ Enthält Boxenstopp-Tausch (Fahrer fällt beim Stopp zurück und holt wieder auf), das
 *    ist echte Bewegung im Klassement, aber kein Überholmanöver.
 *  - Profil: Anteil aller Platzwechsel eines Rennens je Zehntel der Distanz.
 *  - Führungswechsel, Rennen ohne Führungswechsel, verschiedene Führende.
 *  - Sieger führt endgültig ab: Anteil der Distanz, ab dem der Sieger nicht mehr abgegeben hat.
 *  - Spearman zur Zielreihenfolge nach 10/25/50/75/90 % der Distanz, nur Ankommer
 *    (≥ 90 % der Siegerrunden). Zeigt, wie früh das Endergebnis feststeht.
 * ⚠ Ausfälle verschwinden aus den Rundendaten; ein Ausfall vor einem Fahrer ist KEIN Platzwechsel.
 * ⚠ Teamdominanz: Führungswechsel und „Sieger führt ab" sind bei Mercedes 2014–20 Merkmal eines
 *   Autos, nicht der Ära. Deshalb jede Ära zweimal: alle und ohne das Team mit den meisten Siegen.
 */
const fs = require('fs');
const path = require('path');

const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const spearman = (xs, ys) => {   // Durchschnittsränge
    const rang = v => { const o = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]), r = new Array(v.length);
        for (let i = 0; i < o.length;) { let k = i; while (k + 1 < o.length && o[k + 1][0] === o[i][0]) k++;
            for (let m = i; m <= k; m++) r[o[m][1]] = (i + k) / 2; i = k + 1; } return r; };
    const a = rang(xs), b = rang(ys), ma = avg(a), mb = avg(b);
    let n = 0, da = 0, db = 0; for (let i = 0; i < a.length; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
    return da && db ? n / Math.sqrt(da * db) : NaN;
};
const ANTEILE = [0.10, 0.25, 0.50, 0.75, 0.90];

/**
 * laps: Array je Runde (ab Runde 1) mit Fahrer-Schlüsseln in Positionsreihenfolge.
 * Wer fehlt, ist ausgefallen oder überrundet und hat die Runde nicht beendet.
 */
function verlaufKennzahlen(laps) {
    const L = laps.length;
    if (L < 5) return null;
    // Zielreihenfolge: mehr Runden vorn, bei gleicher Rundenzahl die Position in der letzten Runde
    const letzte = new Map();
    laps.forEach((lap, r) => lap.forEach((k, p) => letzte.set(k, [r, p])));
    const ziel = [...letzte.entries()].sort((a, b) => b[1][0] - a[1][0] || a[1][1] - b[1][1]).map(e => e[0]);
    // RV_VOLLE_DISTANZ=1: nur Fahrer über die volle Siegerdistanz (ohne Spät-Ausfälle und Überrundete).
    // Real drücken beide den Spearman nach 90 % (0,953 statt 0,972), im Ticker gibt es keine Überrundeten.
    const ankommer = new Set(ziel.filter(k => letzte.get(k)[0] + 1 >= (process.env.RV_VOLLE_DISTANZ === '1' ? L : 0.9 * L)));
    const zielRang = new Map(ziel.map((k, i) => [k, i]));
    const sieger = ziel[0];

    const wechsel = [];   // je Übergang r-1 → r
    for (let r = 1; r < L; r++) {
        const vor = new Map(laps[r - 1].map((k, p) => [k, p]));
        const jetzt = laps[r].filter(k => vor.has(k)).map(k => vor.get(k));
        let inv = 0;
        for (let i = 0; i < jetzt.length; i++) for (let j = i + 1; j < jetzt.length; j++) if (jetzt[i] > jetzt[j]) inv++;
        wechsel.push(inv);
    }
    const summe = wechsel.reduce((x, y) => x + y, 0);
    const profil = new Array(10).fill(0);
    wechsel.forEach((w, i) => { profil[Math.min(9, Math.floor((i + 1) / L * 10))] += w; });

    let fw = 0; const fuehrende = new Set([laps[0][0]]);
    let endgueltig = 0;
    for (let r = 1; r < L; r++) { if (laps[r][0] !== laps[r - 1][0]) fw++; fuehrende.add(laps[r][0]); }
    for (let r = 0; r < L; r++) if (laps[r][0] !== sieger) endgueltig = r + 1;

    const spZiel = ANTEILE.map(f => {
        const lap = laps[Math.max(0, Math.round(f * L) - 1)].filter(k => ankommer.has(k));
        return lap.length > 4 ? spearman(lap.map((_, i) => i), lap.map(k => zielRang.get(k))) : NaN;
    });
    return { runden: L, proRunde: summe / (L - 1), profil: summe ? profil.map(x => x / summe) : null,
        fw, ohneFw: fw === 0, fuehrende: fuehrende.size, siegerAb: endgueltig / L, spZiel };
}

const AEREN = [[1996, 2002], [2003, 2009], [2010, 2016], [2017, 2021], [2022, 2024]];
function tabelle(titel, gruppen) {   // gruppen: [[name, [kennzahlen…]]]
    console.log(`\n  ${titel}`);
    console.log('  Gruppe                Rennen  Runden  Wechsel/Rd  Führ.wechsel  ohne FW  Führende  Sieger führt ab   Spearman→Ziel bei 10 / 25 / 50 / 75 / 90 %');
    for (const [name, l] of gruppen) {
        if (!l.length) continue;
        const sp = ANTEILE.map((_, i) => avg(l.map(k => k.spZiel[i]).filter(x => !isNaN(x))).toFixed(3)).join(' ');
        console.log(`  ${name.padEnd(20)} ${String(l.length).padStart(6)}  ${avg(l.map(k => k.runden)).toFixed(1).padStart(6)}  ${avg(l.map(k => k.proRunde)).toFixed(2).padStart(10)}`
            + `  ${avg(l.map(k => k.fw)).toFixed(2).padStart(12)}  ${(100 * l.filter(k => k.ohneFw).length / l.length).toFixed(1).padStart(5)} %  ${avg(l.map(k => k.fuehrende)).toFixed(2).padStart(8)}`
            + `  ${(100 * avg(l.map(k => k.siegerAb))).toFixed(1).padStart(10)} %     ${sp}`);
    }
}
function profilTabelle(titel, gruppen) {
    console.log(`\n  ${titel}  (Anteil aller Platzwechsel je Zehntel der Distanz, %)`);
    console.log('  Gruppe                  0–10  10–20  20–30  30–40  40–50  50–60  60–70  70–80  80–90  90–100');
    for (const [name, l] of gruppen) {
        const p = l.map(k => k.profil).filter(Boolean); if (!p.length) continue;
        console.log(`  ${name.padEnd(20)}  ${p[0].map((_, i) => (100 * avg(p.map(x => x[i]))).toFixed(1).padStart(5)).join('  ')}`);
    }
}

module.exports = { verlaufKennzahlen, tabelle, profilTabelle, AEREN, spearman, avg };

if (require.main === module) {
    const VON = Number(process.argv[2] || 1996), BIS = Number(process.argv[3] || 2024);
    const DB = path.join(__dirname, '..', 'f1db-json-splitted');
    const lade = f => JSON.parse(fs.readFileSync(path.join(DB, f), 'utf8'));
    const erg = lade('f1db-races-race-results.json').filter(e => e.year >= VON && e.year <= BIS);
    const fahrer = lade('f1db-drivers.json');
    const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
    const nachGeburt = {};
    for (const d of fahrer) (nachGeburt[d.dateOfBirth] = nachGeburt[d.dateOfBirth] || []).push(d);

    // Dom-Team je Saison: meiste Siege laut F1DB
    const domVon = {};
    { const sk = {}; for (const e of erg) if (e.positionNumber === 1) { const k = e.year + '|' + e.constructorId; sk[k] = (sk[k] || 0) + 1; }
      for (const [k, n] of Object.entries(sk)) { const [y, c] = k.split('|'); if (!domVon[y] || n > sk[y + '|' + domVon[y]]) domVon[y] = c; } }
    const teamVon = new Map(erg.map(e => [e.year + '|' + e.round + '|' + e.driverId, e.constructorId]));

    const alle = [], ohneDom = [];
    let ohneZuordnung = 0, ohneTeam = 0, fehlend = [];
    for (let jahr = VON; jahr <= BIS; jahr++) {
        const datei = path.join(__dirname, 'jolpica-data', `runden-${jahr}.json`);
        if (!fs.existsSync(datei)) { fehlend.push(jahr); continue; }
        const j = JSON.parse(fs.readFileSync(datei, 'utf8'));
        const zuF1db = {};
        for (const [eid, x] of Object.entries(j.drivers || {})) {
            const kand = nachGeburt[x.dob] || [];
            const t = kand.length === 1 ? kand[0] : kand.find(d => norm(d.lastName) === norm(x.family));
            if (t) zuF1db[eid] = t.id; else ohneZuordnung++;
        }
        for (const r of j.races) {
            if (!r.laps || !r.laps.length) continue;
            const laps = r.laps.map(lap => lap.map(i => r.ids[i]));
            const k = verlaufKennzahlen(laps);
            if (!k) continue;
            k.jahr = jahr; alle.push(k);
            const dom = domVon[jahr];
            const istDom = eid => { const t = teamVon.get(jahr + '|' + r.round + '|' + zuF1db[eid]); if (!t) ohneTeam++; return t === dom; };
            const domFrei = new Set(r.ids.filter(eid => !istDom(eid)));
            const k2 = verlaufKennzahlen(laps.map(lap => lap.filter(eid => domFrei.has(eid))));
            if (k2) { k2.jahr = jahr; ohneDom.push(k2); }
        }
    }
    console.log(`RENNVERLAUF real ${VON}–${BIS}: ${alle.length} Rennen`
        + (fehlend.length ? ` · ohne Rundendaten: ${fehlend.join(', ')}` : '')
        + (ohneZuordnung ? ` · ${ohneZuordnung} Ergast-IDs ohne F1DB-Fahrer` : '')
        + (ohneTeam ? ` · ${ohneTeam} Fahrer-Rennen ohne Team` : ''));
    const jeAera = (l, z) => AEREN.map(([a, b]) => [`${a}–${b} ${z}`, l.filter(k => k.jahr >= a && k.jahr <= b)]);
    tabelle('Verlauf je Ära', [...jeAera(alle, 'alle'), ...jeAera(ohneDom, 'o. Dom'), [`${VON}–${BIS} alle`, alle], [`${VON}–${BIS} o. Dom`, ohneDom]]);
    profilTabelle('Wann sich etwas tut', [...jeAera(alle, 'alle'), [`${VON}–${BIS} alle`, alle]]);
}
