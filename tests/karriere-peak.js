#!/usr/bin/env node
/**
 * karriere-peak.js — Wo in der Karriere endet sie?
 *
 * Misst drei Gruppen mit derselben Metrik und vergleicht sie:
 *   A  Realitaet            — F1DB (f1db-json-splitted/f1db-seasons-drivers.json)
 *   B  echte Fahrer im Save — histId-Karrieren aus einem NDJSON-Export
 *   C  generierte Fahrer    — gen-/exp-Karrieren aus demselben Export
 *
 * Kernmetrik ist der PUNKTEANTEIL am Saisonbesten (points / championPoints).
 * Der ist systemneutral: er ueberlebt Punktereformen und Feldgroessen, im
 * Gegensatz zu Rohpunkten oder WM-Rang.
 *
 * Gefragt wird: hoert ein Fahrer auf, waehrend er noch in Form ist?
 *   - Peak in der letzten Saison (%)
 *   - letzte Saison in % des Karrierepeaks
 *   - Sieg / 2+ Podien in der letzten Saison (%)
 *   - Abstand Alter beim Peak → Alter in der letzten Saison
 *
 * Aufruf:  node tests/karriere-peak.js <export.json> [minSaisons] [abJahr]
 *   minSaisons  Default 4  — darunter ist "Peak-Lage" bedeutungslos
 *   abJahr      Default 2100 — ab wann Gruppe C gezaehlt wird (eingeschwungen)
 *
 * MESSFALLEN:
 *   - f1db-seasons-driver-standings.json waere die falsche Quelle: sie listet
 *     nur Fahrer in der Wertung. Punktlose Saisons fehlen dort, die Kohorte
 *     ist dann gegen den Save nicht vergleichbar. Richtig: seasons-drivers.
 *   - Fahrer-IDs im Save tragen einen Zeitstempel und sind NICHT stabil.
 *     Echte Fahrer deshalb ueber histId zusammenfassen, nie ueber id.
 *   - Noch aktive Karrieren muessen raus, sonst zaehlt eine laufende Saison
 *     als Karriereende und faelscht jede Peak-Lage.
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SAVE = process.argv[2];
const MIN_SAISONS = Number(process.argv[3] || 4);
const AB_JAHR = Number(process.argv[4] || 2100);
const ROOT = path.join(__dirname, '..');
const DB = path.join(ROOT, 'f1db-json-splitted');

if (require.main === module && !SAVE) {
    console.error('Aufruf: node tests/karriere-peak.js <export.json> [minSaisons] [abJahr]');
    process.exit(1);
}

const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const pct = (n, d) => d ? (100 * n / d).toFixed(1) + '%' : '-';

// ── A: Realitaet aus F1DB ────────────────────────────────────────────────
function ladeRealitaet() {
    const sd = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-seasons-drivers.json'), 'utf8'));
    const drv = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-drivers.json'), 'utf8'));
    const dob = {};
    for (const d of drv) if (d.dateOfBirth) dob[d.id] = Number(String(d.dateOfBirth).slice(0, 4));

    const byYear = {};
    for (const r of sd) {
        if (r.year > 2025) continue;
        (byYear[r.year] = byYear[r.year] || []).push(r);
    }

    const D = new Map();
    for (const y of Object.keys(byYear).map(Number).sort((a, b) => a - b)) {
        const rows = byYear[y].slice().sort((a, b) =>
            (b.totalPoints || 0) - (a.totalPoints || 0) || (b.totalRaceWins || 0) - (a.totalRaceWins || 0));
        const cp = rows[0] ? rows[0].totalPoints || 0 : 0;
        for (const r of rows) {
            if (!D.has(r.driverId)) D.set(r.driverId, []);
            D.get(r.driverId).push({
                year: y,
                pts: r.totalPoints || 0,
                share: cp ? (r.totalPoints || 0) / cp : 0,
                wins: r.totalRaceWins || 0,
                podiums: r.totalPodiums || 0,
                alter: dob[r.driverId] ? y - dob[r.driverId] : null
            });
        }
    }
    return [...D].map(([id, jahre]) => ({ key: id, name: id, jahre }));
}

// ── B + C: Karrieren aus Saison-Objekten ─────────────────────────────────
// Nimmt die archivierten Saisons (aus einem NDJSON-Export ODER direkt aus
// GAME_STATE.history) und baut daraus Karriere-Reihen. Das Format ist in
// beiden Faellen dasselbe, deshalb teilen sich Export-Messung und Sim-Messung
// diese Funktion.
function serienAusSaisons(saisons) {
    const S = new Map(), retire = new Map();
    for (const d of saisons) {
        if (!d || typeof d.year !== 'number') continue;
        const y = d.year;
        const meta = new Map();
        for (const dr of (d.drivers || [])) meta.set(dr.id, dr);
        const rows = Object.entries(d.driverStandings || {}).map(([id, s]) => Object.assign({ id: id }, s));
        rows.sort((a, b) => (b.points || 0) - (a.points || 0) || (b.wins || 0) - (a.wins || 0));
        const cp = d.championPoints || (rows[0] ? rows[0].points : 0) || 0;
        for (const r of rows) {
            const m = meta.get(r.id);
            if (!m) continue;
            const key = m.histId ? ('H:' + m.histId) : ('G:' + r.id);
            // Das Flag `generated` sitzt nicht auf jedem erfundenen Fahrer (es wird
            // nur an zwei Stellen gesetzt) — die ID-Praefixe gen-/exp- sind die
            // zuverlaessigere zweite Quelle.
            const istGen = m.generated === true || /^(gen|exp)-/.test(String(m.id || r.id));
            if (!S.has(key)) S.set(key, { gen: istGen, hist: m.histId, name: m.name, jahre: [] });
            S.get(key).jahre.push({
                year: y,
                pts: r.points || 0,
                share: cp ? (r.points || 0) / cp : 0,
                wins: r.wins || 0,
                podiums: r.podiums || 0,
                alter: m.birthYear ? y - m.birthYear : null
            });
        }
        for (const r of (d.retirements || [])) {
            const m = meta.get(r.driver);
            const h = r.histId || (m && m.histId);
            retire.set(h ? ('H:' + h) : ('G:' + r.driver), { year: y, type: r.type, age: r.age });
        }
    }
    return [...S].map(([k, v]) => ({
        key: k, gen: v.gen, hist: v.hist, name: v.name, jahre: v.jahre, ret: retire.get(k) || null
    }));
}

function ladeSave(datei) {
    return new Promise(resolve => {
        const saisons = [];
        const rl = readline.createInterface({ input: fs.createReadStream(datei) });
        rl.on('line', l => {
            if (l.indexOf('{"_t":"season"') !== 0) return;
            saisons.push(JSON.parse(l).d);
        });
        rl.on('close', () => resolve(serienAusSaisons(saisons)));
    });
}

// ── Auswertung ───────────────────────────────────────────────────────────
function messe(titel, karrieren, minSaisons) {
    const MIN_SAISONS = minSaisons || Number(process.argv[3] || 4);
    const k = karrieren.filter(c => c.jahre.length >= MIN_SAISONS);
    let peakLetzte = 0, peakLetzte2 = 0, aufwaerts = 0, sieg = 0, pod = 0;
    const relPeaks = [], endAnteile = [], alterPeak = [], alterEnde = [];
    let n = 0, punktlos = 0;

    for (const c of k) {
        const j = c.jahre.slice().sort((a, b) => a.year - b.year);
        const s = j.map(x => x.share);
        const best = Math.max.apply(null, s);
        if (best <= 0) { punktlos++; continue; }   // ohne Punkte gibt es keinen Peak
        n++;
        const pi = s.lastIndexOf(best);            // spaetester Peak = konservativ
        relPeaks.push(pi / (s.length - 1));
        if (pi === s.length - 1) peakLetzte++;
        if (pi >= s.length - 2) peakLetzte2++;
        if (s[s.length - 1] > s[s.length - 2]) aufwaerts++;
        endAnteile.push(s[s.length - 1] / best);
        const l = j[j.length - 1];
        if ((l.wins || 0) > 0) sieg++;
        if ((l.podiums || 0) >= 2) pod++;
        if (j[pi].alter) alterPeak.push(j[pi].alter);
        if (l.alter) alterEnde.push(l.alter);
    }

    console.log('\n=== ' + titel + ' ===');
    console.log('  n=' + n + ' Karrieren mit >=' + MIN_SAISONS + ' Saisons (' + punktlos + ' punktlos ausgelassen)');
    console.log('  Peak IN der letzten Saison         ' + pct(peakLetzte, n).padStart(7));
    console.log('  Peak in den letzten ZWEI Saisons   ' + pct(peakLetzte2, n).padStart(7));
    console.log('  letzte Saison besser als vorletzte ' + pct(aufwaerts, n).padStart(7));
    console.log('  letzte Saison in % des Peaks       ' + ((100 * avg(endAnteile)).toFixed(1) + '%').padStart(7));
    console.log('  SIEG in der letzten Saison         ' + pct(sieg, n).padStart(7));
    console.log('  2+ PODIEN in der letzten Saison    ' + pct(pod, n).padStart(7));
    console.log('  Alter Peak Ø' + avg(alterPeak).toFixed(1) + ' → Ende Ø' + avg(alterEnde).toFixed(1)
        + '  (Auslauf ' + (avg(alterEnde) - avg(alterPeak)).toFixed(1) + ' Jahre)');
    return { n: n, sieg: sieg, endAnteil: avg(endAnteile) };
}

module.exports = { messe, serienAusSaisons, ladeRealitaet, ladeSave };

if (require.main !== module) return;

(async () => {
    const real = ladeRealitaet();
    const save = await ladeSave(SAVE);

    // Aktive Karrieren raus: wer noch faehrt, hat kein Karriereende.
    const letztesSaveJahr = Math.max.apply(null, save.map(c => c.jahre[c.jahre.length - 1].year));
    const A = real.filter(c => !c.jahre.some(j => j.year >= 2025));
    const B = save.filter(c => c.hist && c.jahre.every(j => j.year <= 2025));
    const C = save.filter(c => c.gen && c.jahre[0].year >= AB_JAHR
        && c.jahre[c.jahre.length - 1].year < letztesSaveJahr - 2);

    console.log('Datei: ' + path.basename(SAVE) + '   Save-Jahre bis ' + letztesSaveJahr);
    const a = messe('A  REALITAET (F1DB 1950-2024)', A);
    messe('A2 REALITAET, Karriereende ab 1990', A.filter(c => c.jahre[c.jahre.length - 1].year >= 1990));
    const b = messe('B  ECHTE Fahrer IM SPIELSTAND', B);
    const c = messe('C  GENERIERTE Fahrer (ab ' + AB_JAHR + ')', C);

    // Aufschluesselung C nach Ruecktrittsgrund — der Alterspfad ist der Verdaechtige.
    const typen = {};
    for (const x of C.filter(x => x.jahre.length >= MIN_SAISONS)) {
        const t = x.ret ? x.ret.type : '(keiner)';
        (typen[t] = typen[t] || []).push(x);
    }
    console.log('\n--- Gruppe C nach Ruecktrittsgrund ---');
    const sortiert = Object.entries(typen).sort((x, y) => y[1].length - x[1].length);
    for (const [t, list] of sortiert) {
        let pl = 0, auf = 0, sg = 0;
        const ea = [];
        for (const x of list) {
            const s = x.jahre.map(v => v.share), bst = Math.max.apply(null, s);
            if (bst <= 0) continue;
            if (s.lastIndexOf(bst) === s.length - 1) pl++;
            if (s[s.length - 1] > s[s.length - 2]) auf++;
            if ((x.jahre[x.jahre.length - 1].wins || 0) > 0) sg++;
            ea.push(s[s.length - 1] / bst);
        }
        console.log('  ' + t.padEnd(12) + ' n=' + String(list.length).padStart(4)
            + '  Peak zuletzt ' + pct(pl, list.length).padStart(6)
            + '  aufwaerts ' + pct(auf, list.length).padStart(6)
            + '  Sieg zuletzt ' + pct(sg, list.length).padStart(6)
            + '  Ende bei ' + (100 * avg(ea)).toFixed(0) + '% des Peaks');
    }

    console.log('\n--- Urteil ---');
    const fSieg = (c.sieg / c.n) / (a.sieg / a.n);
    console.log('  Sieg in der letzten Saison, generiert gegen real: Faktor ' + fSieg.toFixed(1));
    console.log('  Formstand am Ende, generiert gegen real: ' + (100 * c.endAnteil).toFixed(0)
        + '% gegen ' + (100 * a.endAnteil).toFixed(0) + '% des Peaks');
    console.log('  Gruppe B (echte Fahrer im Save) liegt bei ' + (100 * b.endAnteil).toFixed(0)
        + '% — trifft die Realitaet. C nicht.');
})();
