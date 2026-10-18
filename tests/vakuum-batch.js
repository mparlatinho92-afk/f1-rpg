#!/usr/bin/env node
/**
 * vakuum-batch.js — mehrere Vakuum-Saisons in einem Lauf, eine Tabelle.
 *
 * `vakuum-saison.js` misst EIN Jahr gründlich. Für Kalibrierung braucht man
 * viele Jahre nebeneinander — sonst kalibriert man auf zwei Saisons und merkt
 * die Überanpassung erst, wenn sie im Code steht (genau so passiert bei
 * BAD_DAY_PACE_FACTOR, s. BEFUNDE.md).
 *
 * DAS PUNKTEFAHRER-ZIEL IST SAISONSPEZIFISCH. Es gibt keine gute globale Zahl:
 * real schwanken die Punktefahrer zwischen 16 (1965) und 26 (1982), und zwar
 * NICHT systematisch mit Rennzahl oder Punkterängen (Korrelation 0,12-0,26).
 * Jede Saison hat ihr eigenes Ziel, und genau dagegen wird hier gemessen.
 *
 * Aufruf:
 *   SIMCORE_FROM_INDEX=1 node tests/vakuum-batch.js              (Standardsatz)
 *   SIMCORE_FROM_INDEX=1 node tests/vakuum-batch.js 1965,1988,2010 [laeufe]
 *   node tests/vakuum-batch.js --alle 5      jedes 5. Jahr ab 1950
 *
 * Ohne SIMCORE_FROM_INDEX misst es den letzten gebauten Monolithen — genau so
 * macht man das A/B: einmal ohne (Vorher), einmal mit (Nachher).
 *
 * ⚠ Die Messfallen stehen in vakuum-saison.js und tests/README.md. Die
 *   wichtigsten hier: beide Seiten muessen dieselben RUNDEN fahren (Indy der
 *   50er und Anomalien wie der 6-Starter-US-GP 2005 fliegen auf BEIDEN Seiten
 *   raus), und Spearman braucht Raenge ueber dieselbe Menge.
 */
const { execFileSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const ALLE = args.includes('--alle');
const erstesArg = args.find(a => !a.startsWith('--'));
const zweitesArg = args.filter(a => !a.startsWith('--'))[1];

let JAHRE;
if (ALLE) {
    const schritt = Number(erstesArg || 5);
    JAHRE = [];
    for (let y = 1950; y <= 2024; y += schritt) JAHRE.push(y);
} else if (erstesArg && erstesArg.includes(',')) {
    JAHRE = erstesArg.split(',').map(Number);
} else if (erstesArg && Number(erstesArg) > 1900) {
    JAHRE = [Number(erstesArg)];
} else {
    // Standardsatz: ueber alle Aeren verteilt, jede Punktesystem-Epoche vertreten
    JAHRE = [1955, 1961, 1965, 1972, 1975, 1982, 1988, 1995, 2002, 2005, 2010, 2018];
}
const LAEUFE = Number(
    (ALLE ? zweitesArg : (erstesArg && Number(erstesArg) > 1900 ? zweitesArg : erstesArg && erstesArg.includes(',') ? zweitesArg : args[0]))
    || 8
) || 8;

const SKRIPT = path.join(__dirname, 'vakuum-saison.js');
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;

function zahl(text, muster) {
    const m = text.match(muster);
    return m ? Number(String(m[1]).replace(',', '.')) : NaN;
}

console.log('VAKUUM-BATCH — ' + JAHRE.length + ' Saisons, je ' + LAEUFE + ' Laeufe');
console.log('Quelle: ' + (process.env.SIMCORE_FROM_INDEX ? 'index.html (Arbeitskopie)' : 'letzter Monolith'));
console.log('');
console.log('  Jahr   Renn  |  Punktefahrer            |  Rang   Spearman  Deckung   Teams     schwaches Drittel');
console.log('               |  Ziel   Ist    Diff      |                            Ist/Ziel  Anteil Ist/Ziel %');
console.log('  ' + '─'.repeat(86));

const diffs = [], spears = [], abws = [], schwachDiffs = [], starkDiffs = [], spSelbst = [], autoBias = [];
// Chaos je Rennen, ueber alle Jahre gepoolt (Zaehler aus vakuum-saison.js)
const talent = {};   // 'Auto-Drittel|Fahrer-Drittel' → [Starts, Siege, Podien, Top10, Punkte, Ausfaelle]
// [Starts, DNF, Sieg, P2–3, P4+, dann je Start P1–3 und P4+: Zielankünfte, Sieg, P2–3, P4+]
const dominator = { spiel: new Array(13).fill(0), real: new Array(13).fill(0) };
// Pace-Rang (Top 3 / 4–8 / Rest) × Startplatz (P1–3 / 4–9 / 10+), je Zelle [Starts, DNF, Sieg, Podium, Summe Zielplatz, Summe Plätze gewonnen]
const paceStart = { spiel: new Array(54).fill(0), real: new Array(54).fill(0) };
// Verteilung der Platzgewinne je Dekade: [spielAlle, realAlle, spielOhneDom, realOhneDom] je 10 Zähler
const gewinnDek = {}, domTeams = {};
const CHAOS_ARTEN = ['trocken', 'teilweise', 'durchgehend', 'nass', 'rot'];   // 'rot' überlappt mit den Wetter-Gruppen
const chaos = Object.fromEntries(CHAOS_ARTEN.map(a => [a, { n: 0, sp03: 0, p10: 0, schwach: 0, spsum: 0, ss: 0, sw: 0 }]));
for (const jahr of JAHRE) {
    let out;
    try {
        out = execFileSync(process.execPath, ['--max-old-space-size=4096', SKRIPT, String(jahr), String(LAEUFE)].concat(args.filter(a => a === '--regen' || a === '--nur-nass' || a === '--quali')),
            { encoding: 'utf8', maxBuffer: 1 << 24, env: process.env });
    } catch (e) {
        console.log('  ' + jahr + '   — Lauf fehlgeschlagen: ' + String(e.message).slice(0, 40));
        continue;
    }
    const ist = zahl(out, /Fahrer mit Punkten:\s+Spiel\s+([\d.]+)/);
    // ⚠ JEDES Muster hier auf "Fahrer mit Punkten:" ankern. Seit die Team-Kennzahl
    // dazukam, gibt es ZWEI Zeilen der Form "Spiel X real Y Differenz Z", und beide
    // allgemeinen Muster griffen die TEAMS-Zeile ab:
    //   /real\s+(\d+)\s+Differenz/        → Teamzahl in der Ziel-Spalte
    //   /Differenz\s+([+-][\d.]+)\s+Fahrer/ → \s frisst den Zeilenumbruch, also
    //     matchte es die Team-Differenz gefolgt von "\n  Fahrer mit Punkten".
    // Der zweite Fehler verfaelschte den Ø Betrag des ganzen Vollaufs.
    const ziel = zahl(out, /Fahrer mit Punkten:\s+Spiel\s+[\d.]+\s+real\s+(\d+)/);
    const diff = zahl(out, /Fahrer mit Punkten:.*?Differenz\s+([+-][\d.]+)/);
    const teamsSpiel = zahl(out, /Teams mit Punkten:\s+Spiel\s+([\d.]+)/);
    const teamsReal = zahl(out, /Teams mit Punkten:\s+Spiel\s+[\d.]+\s+real\s+(\d+)/);
    const sp = zahl(out, /Spearman-Rangkorrelation:\s+([-\d.]+)/);
    const spS = zahl(out, /Spearman Spiel<->Spiel:\s+([-\d.]+)/);
    if (!isNaN(spS)) spSelbst.push(spS);
    const ab = zahl(out, /Auto-Bias.*?Differenz ([+-][\d.]+)/);
    if (!isNaN(ab)) autoBias.push(ab);
    for (const art of CHAOS_ARTEN) {
        const m = out.match(new RegExp('Chaos ' + art + String.raw`: n (\d+) sp03 (\d+) p10 (\d+) schwach (\d+) spsum ([-\d.]+)(?: siegstark (\d+) siegschwach (\d+))?`));
        if (m) { const c = chaos[art]; c.n += +m[1]; c.sp03 += +m[2]; c.p10 += +m[3]; c.schwach += +m[4]; c.spsum += +m[5]; c.ss += +(m[6] || 0); c.sw += +(m[7] || 0); }
    }
    // Talent im schwachen Auto: "Talent t|f: Starts Siege Podien Top10 Punkte Ausfaelle"
    for (const m of out.matchAll(/Talent (\d)\|(\d): (\d+) (\d+) (\d+) (\d+) (\d+) (\d+)/g)) {
        const z = talent[m[1] + '|' + m[2]] = talent[m[1] + '|' + m[2]] || [0, 0, 0, 0, 0, 0];
        for (let i = 0; i < 6; i++) z[i] += Number(m[3 + i]);
    }
    // Zielprofil des Dominators: "Dominator spiel: n dnf p1 p23 p4 real: n dnf p1 p23 p4"
    const dm = out.match(/Dominator spiel: ([\d ]+) real: ([\d ]+)/);
    if (dm) { const a = dm[1].trim().split(' ').map(Number), b = dm[2].trim().split(' ').map(Number);
        for (let i = 0; i < 13; i++) { dominator.spiel[i] += a[i] || 0; dominator.real[i] += b[i] || 0; } }
    const ps = out.match(/PaceStart spiel: ([-\d ]+) real: ([-\d ]+)/);
    if (ps) { const a = ps[1].trim().split(' ').map(Number), b = ps[2].trim().split(' ').map(Number);
        for (let i = 0; i < 54; i++) { paceStart.spiel[i] += a[i] || 0; paceStart.real[i] += b[i] || 0; } }
    const gw = out.match(/Gewinn spiel: ([-\d ]+) real: ([-\d ]+) ohneDom spiel: ([-\d ]+) real: ([-\d ]+) dom: (\S+)/);
    if (gw) { const dek = Math.floor(jahr / 10) * 10, z = gewinnDek[dek] = gewinnDek[dek] || [0, 1, 2, 3].map(() => new Array(10).fill(0));
        for (let x = 0; x < 4; x++) gw[x + 1].trim().split(' ').map(Number).forEach((v, j) => z[x][j] += v);
        (domTeams[dek] = domTeams[dek] || {})[gw[5]] = (domTeams[dek][gw[5]] || 0) + 1; }
    const abw = zahl(out, /Rangabweichung, ALLE:\s+([\d.]+)/);
    const deck = zahl(out, /im RENNEN gestartet:\s+([\d.]+)/);
    const rennen = zahl(out, /\((\d+) von \d+ Rennen/);
    // Punkteanteil je Drittel: "Spiel a/b/c   real x/y/z" — Muster auf die Zeile ankern
    const dr = out.match(/Punkteanteil Drittel: Spiel ([\d.]+)\/([\d.]+)\/([\d.]+)\s+real ([\d.]+)\/([\d.]+)\/([\d.]+)/);
    const schwachIst = dr ? Number(dr[3]) : NaN, schwachZiel = dr ? Number(dr[6]) : NaN;
    if (dr) { schwachDiffs.push(schwachIst - schwachZiel); starkDiffs.push(Number(dr[1]) - Number(dr[4])); }

    if (!isNaN(diff)) diffs.push(diff);
    if (!isNaN(sp)) spears.push(sp);
    if (!isNaN(abw)) abws.push(abw);

    const warn = (!isNaN(deck) && deck < 97) ? ' ⚠' : '';
    console.log('  ' + jahr
        + String(isNaN(rennen) ? '-' : rennen).padStart(7)
        + '  |' + String(isNaN(ziel) ? '-' : ziel).padStart(7)
        + String(isNaN(ist) ? '-' : ist.toFixed(1)).padStart(7)
        + String(isNaN(diff) ? '-' : (diff >= 0 ? '+' : '') + diff.toFixed(1)).padStart(8)
        + '      |' + String(isNaN(abw) ? '-' : abw.toFixed(2)).padStart(7)
        + String(isNaN(sp) ? '-' : sp.toFixed(3)).padStart(10)
        + String(isNaN(deck) ? '-' : deck.toFixed(1) + ' %').padStart(10)
        + ((isNaN(teamsSpiel) ? '-' : teamsSpiel.toFixed(1)) + '/' + (isNaN(teamsReal) ? '-' : teamsReal)).padStart(11)
        + ((isNaN(schwachIst) ? '-' : schwachIst.toFixed(1)) + '/' + (isNaN(schwachZiel) ? '-' : schwachZiel.toFixed(1))).padStart(14)
        + (isNaN(spS) ? '' : '   Sp-Grenze ' + spS.toFixed(3))
        + (isNaN(ab) ? '' : '   Auto-Bias ' + (ab >= 0 ? '+' : '') + ab.toFixed(3)) + warn);
}

console.log('  ' + '─'.repeat(86));
console.log('  Ø Betrag Punktefahrer-Abweichung : ' + avg(diffs.map(Math.abs)).toFixed(2) + ' Fahrer');
console.log('  Ø vorzeichenbehaftet             : ' + (avg(diffs) >= 0 ? '+' : '') + avg(diffs).toFixed(2)
    + '   (kippt das Vorzeichen, heben sich zwei Fehler auf)');
console.log('  Ø Spearman                       : ' + avg(spears).toFixed(3)
    + (spSelbst.length ? '   (Rauschgrenze Spiel<->Spiel ' + avg(spSelbst).toFixed(3) + ')' : ''));
if (autoBias.length) console.log('  Auto-Bias (Differenz zur Kontrolle): ' + (avg(autoBias) >= 0 ? '+' : '') + avg(autoBias).toFixed(3)
    + '   (> 0: Auto zaehlt im Spiel zu viel)');
const chaosGes = CHAOS_ARTEN.filter(k => k !== 'rot').reduce((a, k) => a + chaos[k].n, 0);
if (chaosGes) {
    console.log('  Regenrennen                      : ' + ((chaosGes - chaos.trocken.n) / chaosGes * 100).toFixed(1) + ' % von ' + chaosGes + ' Rennen · rote Flagge ' + (chaos.rot.n / chaosGes * 100).toFixed(1) + ' %');
    for (const art of CHAOS_ARTEN) { const c = chaos[art]; if (!c.n) continue;
        console.log('  Chaos ' + art.padEnd(11) + '              : Ø Spearman Start→Ziel ' + (c.spsum / c.n).toFixed(3)
            + ' · < 0,3 ' + (c.sp03 / c.n * 100).toFixed(1) + ' % · Sieg ab P10 ' + (c.p10 / c.n * 100).toFixed(1) + ' % · schwaches Drittel punktet ' + (c.schwach / c.n * 100).toFixed(1) + ' %'
            + ' · Sieger stark/mittel/schwach ' + (c.ss / c.n * 100).toFixed(1) + '/' + ((c.n - c.ss - c.sw) / c.n * 100).toFixed(1) + '/' + (c.sw / c.n * 100).toFixed(1) + ' %'); }
}
if (Object.keys(talent).length) {
    // Vergleich: tests/talent-real.js (gleiche Drittel-Logik)
    const N = ['stark', 'mittel', 'schwach'];
    console.log('  Talent je Start (Sieg / Podium / Top 10 / Punkte, Ausfall) — Auto × Fahrer:');
    for (let t = 0; t < 3; t++) for (let f = 0; f < 3; f++) {
        const z = talent[t + '|' + f]; if (!z || !z[0]) continue;
        const p = i => (z[i] / z[0] * 100).toFixed(1) + ' %';
        console.log('    Auto ' + N[t].padEnd(8) + 'Fahrer ' + N[f].padEnd(8) + p(1) + ' / ' + p(2) + ' / ' + p(3) + ' / ' + p(4) + '  (' + p(5) + ')  n ' + z[0]);
    }
}
if (dominator.spiel[0]) {
    // Fahrer mit den meisten Siegen je Saison: Ausfall je Start, Rest je Zielankunft
    const z = (a, n) => { const fin = a[0] - a[1];
        return n.padEnd(6) + 'DNF ' + (a[1] / a[0] * 100).toFixed(1) + ' %  · im Ziel Sieg ' + (a[2] / fin * 100).toFixed(1)
            + ' / P2–3 ' + (a[3] / fin * 100).toFixed(1) + ' / P4+ ' + (a[4] / fin * 100).toFixed(1) + ' %  (Starts ' + a[0] + ')'; };
    console.log('  Dominator (meiste Siege)         : ' + z(dominator.spiel, 'Spiel'));
    console.log('                                     ' + z(dominator.real, 'real'));
    const s = (a, o) => 'Sieg ' + (a[o + 1] / a[o] * 100).toFixed(1) + ' / P2–3 ' + (a[o + 2] / a[o] * 100).toFixed(1) + ' / P4+ ' + (a[o + 3] / a[o] * 100).toFixed(1) + ' %  (n ' + a[o] + ')';
    for (const [o, t] of [[5, 'Start P1–3'], [9, 'Start P4+ ']]) {
        console.log('    Dominator ' + t + '  Spiel ' + s(dominator.spiel, o) + '   real ' + s(dominator.real, o));
    }
    const anteil = a => (a[9] / (a[5] + a[9]) * 100).toFixed(1);
    console.log('    Anteil Zielankünfte von P4+  Spiel ' + anteil(dominator.spiel) + ' %   real ' + anteil(dominator.real) + ' %');
}
if (paceStart.real.some(Boolean)) {
    // Sieg/Podium/DNF je Start, Ø Zielplatz je Zielankunft
    const P = ['Pace Top 3', 'Pace 4–8  ', 'Pace Rest '], S = ['Start P1–3', 'Start 4–9 ', 'Start 10+ '];
    const z = (a, o) => { const n = a[o], fin = n - a[o + 1]; if (!n) return '—'.padEnd(47);
        const p = i => (a[o + i] / n * 100).toFixed(1).padStart(5);
        return 'S' + p(2) + ' Pod' + p(3) + ' DNF' + p(1) + ' ØZ ' + (fin ? (a[o + 4] / fin).toFixed(1) : '-').padStart(4) + ' Pl ' + (fin ? ((a[o + 5] >= 0 ? '+' : '') + (a[o + 5] / fin).toFixed(2)) : '-').padStart(6) + ' n' + String(n).padStart(5); };
    console.log('  Pace-Rang × Startplatz (Sieg / Podium / DNF % je Start, Ø Zielplatz, Ø Plätze gewonnen unter Zielankünften):');
    console.log('  ' + ' '.repeat(23) + 'Spiel'.padEnd(51) + 'real');
    for (let p = 0; p < 3; p++) for (let st = 0; st < 3; st++) { const o = (p * 3 + st) * 6;
        console.log('    ' + P[p] + ' ' + S[st] + '  ' + z(paceStart.spiel, o) + '   ' + z(paceStart.real, o)); }
}
if (Object.keys(gewinnDek).length) {
    // Anteil der Zielankünfte mit großem Sprung; Top 3 von P10+: ≥+8 und Sieg je Zielankunft
    const q = (a, f) => { const n = a.slice(0, 7).reduce((x, y) => x + y, 0); return n ? (100 * f(a) / n).toFixed(1).padStart(5) : '    -'; };
    const t = (a, i) => a[7] ? (100 * a[i] / a[7]).toFixed(1).padStart(5) : '    -';
    const zeile = (a, b) => q(a, z => z[6]) + ' /' + q(b, z => z[6]) + '  ' + q(a, z => z[0]) + ' /' + q(b, z => z[0])
        + '  ' + q(a, z => z[0] + z[1] + z[5] + z[6]) + ' /' + q(b, z => z[0] + z[1] + z[5] + z[6])
        + '  ' + t(a, 8) + ' /' + t(b, 8) + '  ' + t(a, 9) + ' /' + t(b, 9) + '  n' + String(b[7]).padStart(4);
    console.log('  Verteilung Plätze gewonnen (unter Zielankünften), Spiel / real, % der Zielankünfte:');
    console.log('                 ≥+8 Plätze      ≤−8 Plätze     |Δ| ≥ 4         Top3 v. P10+: ≥+8 / Sieg     n real');
    for (const [dek, z] of Object.entries(gewinnDek)) {
        const dom = Object.entries(domTeams[dek]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => k + ' ' + n).join(', ');
        console.log('    ' + dek + 'er alle  ' + zeile(z[0], z[1]));
        console.log('           ohne Dom ' + zeile(z[2], z[3]) + '   (Dom: ' + dom + ')');
    }
}
console.log('  Punkteanteil schwaches Drittel   : Ø Spiel − real ' + (avg(schwachDiffs) >= 0 ? '+' : '') + avg(schwachDiffs).toFixed(2)
    + ' Prozentpunkte · Ø Betrag ' + avg(schwachDiffs.map(Math.abs)).toFixed(2));
console.log('  Punkteanteil starkes Drittel     : Ø Spiel − real ' + (avg(starkDiffs) >= 0 ? '+' : '') + avg(starkDiffs).toFixed(2)
    + ' Prozentpunkte · Ø Betrag ' + avg(starkDiffs.map(Math.abs)).toFixed(2));
console.log('  Ø Rangabweichung ueber alle      : ' + avg(abws).toFixed(2) + ' Plaetze');
console.log('');
console.log('  Fuer A/B denselben Aufruf zweimal: ohne SIMCORE_FROM_INDEX (Vorher)');
console.log('  und mit (Nachher). Nur so ist eine Aenderung von Rauschen zu trennen.');
