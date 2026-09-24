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

const diffs = [], spears = [], abws = [], schwachDiffs = [], starkDiffs = [];
for (const jahr of JAHRE) {
    let out;
    try {
        out = execFileSync(process.execPath, ['--max-old-space-size=4096', SKRIPT, String(jahr), String(LAEUFE)],
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
        + ((isNaN(schwachIst) ? '-' : schwachIst.toFixed(1)) + '/' + (isNaN(schwachZiel) ? '-' : schwachZiel.toFixed(1))).padStart(14) + warn);
}

console.log('  ' + '─'.repeat(86));
console.log('  Ø Betrag Punktefahrer-Abweichung : ' + avg(diffs.map(Math.abs)).toFixed(2) + ' Fahrer');
console.log('  Ø vorzeichenbehaftet             : ' + (avg(diffs) >= 0 ? '+' : '') + avg(diffs).toFixed(2)
    + '   (kippt das Vorzeichen, heben sich zwei Fehler auf)');
console.log('  Ø Spearman                       : ' + avg(spears).toFixed(3));
console.log('  Punkteanteil schwaches Drittel   : Ø Spiel − real ' + (avg(schwachDiffs) >= 0 ? '+' : '') + avg(schwachDiffs).toFixed(2)
    + ' Prozentpunkte · Ø Betrag ' + avg(schwachDiffs.map(Math.abs)).toFixed(2));
console.log('  Punkteanteil starkes Drittel     : Ø Spiel − real ' + (avg(starkDiffs) >= 0 ? '+' : '') + avg(starkDiffs).toFixed(2)
    + ' Prozentpunkte · Ø Betrag ' + avg(starkDiffs.map(Math.abs)).toFixed(2));
console.log('  Ø Rangabweichung ueber alle      : ' + avg(abws).toFixed(2) + ' Plaetze');
console.log('');
console.log('  Fuer A/B denselben Aufruf zweimal: ohne SIMCORE_FROM_INDEX (Vorher)');
console.log('  und mit (Nachher). Nur so ist eine Aenderung von Rauschen zu trennen.');
