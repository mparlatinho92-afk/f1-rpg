#!/usr/bin/env node
/**
 * karriere-peak-sim.js — dieselbe Peak-Messung, aber auf einem frischen Lauf.
 *
 * `karriere-peak.js` misst einen vorhandenen Export. Dieses Skript simuliert
 * stattdessen N Saisons und misst danach — damit sind Aenderungen an
 * checkCareerEnds() pruefbar, ohne dass jemand erst hunderte Saisons spielt.
 *
 * Aufruf:  node tests/karriere-peak-sim.js [startJahr] [saisons] [abJahr]
 *   startJahr  Default 1980
 *   saisons    Default 90   — generierte Fahrer brauchen Zeit fuer ganze Karrieren
 *   abJahr     Default startJahr+30 — davor ist das Feld noch historisch besetzt
 *
 * Immer mit SIMCORE_FROM_INDEX=1 laufen lassen, sonst misst es den letzten
 * gebauten Monolithen statt der Arbeitskopie:
 *
 *   SIMCORE_FROM_INDEX=1 node tests/karriere-peak-sim.js 1980 90
 *   $env:SIMCORE_FROM_INDEX="1"; node tests/karriere-peak-sim.js 1980 90
 *
 * MESSFALLEN:
 *   - GAME_STATE.history taugt hier NICHT als Quelle: `drivers` ist dort ein
 *     heavy field und im Steady-State leer. Der Snapshot wird deshalb Saison
 *     fuer Saison selbst gezogen, bevor die Uebergangskette laeuft.
 *   - Der Snapshot muss VOR checkCareerEnds() liegen (sonst fehlen die Fahrer,
 *     die gerade aufhoeren), die Ruecktritte NACH checkCareerEnds() (sonst sind
 *     sie noch nicht eingetragen).
 *   - Die Uebergangskette ist exakt die aus monte-carlo-multi.js. Weicht sie ab,
 *     misst man eine Welt, die es im Spiel nicht gibt.
 */
const path = require('path');
const { getContext } = require('./sim-core');
const { messe, serienAusSaisons, ladeRealitaet } = require('./karriere-peak');

const startYear = Number(process.argv[2] || 1980);
const saisons = Number(process.argv[3] || 90);
const endYear = startYear + saisons - 1;
const abJahr = Number(process.argv[4] || (startYear + 30));
const LAEUFE = Number((process.argv.find(a => a.startsWith('--laeufe=')) || '').split('=')[1] || 1);
const MIN_SAISONS = 4;

const ctx = getContext();

function simuliereSaison(c) {
    const races = c.GAME_STATE.races || [];
    for (let i = 0; i < races.length; i++) {
        const isRain = Math.random() < 0.15;
        const result = c.simulateRace(i, isRain);
        if (!result) continue;
        c.applyRaceResults(result);
    }
}

function schnappschuss(c, year) {
    const gs = c.GAME_STATE;
    const champPunkte = Math.max(0, ...Object.values(gs.driverStandings || {}).map(s => s.points || 0));
    return {
        year: year,
        championPoints: champPunkte,
        // nur die Felder, die die Messung braucht — ein tiefer Klon des ganzen
        // Kaders ueber 90 Saisons kostet sonst mehrere Gigabyte
        drivers: (gs.drivers || []).map(d => ({
            id: d.id, histId: d.histId, name: d.name,
            generated: d.generated, birthYear: d.birthYear, pace: d.pace
        })),
        driverStandings: JSON.parse(JSON.stringify(gs.driverStandings || {})),
        retirements: []
    };
}

console.log('[karriere-peak-sim] ' + startYear + '-' + endYear + ' (' + saisons + ' Saisons)'
    + (LAEUFE > 1 ? ' x' + LAEUFE + ' Laeufe' : '') + ', Gruppe C ab ' + abJahr);

// Mehrere Laeufe werden zu EINER Kohorte zusammengefasst. Ein Lauf ueber 80
// Saisons liefert nur rund 40 abgeschlossene generierte Karrieren — bei so
// einem n liegen 10 Prozentpunkte Unterschied noch im Rauschen.
let serien = [];
let saisonListe = [];
let gesamtKarrieren = 0;
for (let lauf = 0; lauf < LAEUFE; lauf++) {
    ctx.initFromYear(startYear);
    saisonListe = [];
    for (let year = startYear; year <= endYear; year++) {
        simuliereSaison(ctx);
        const snap = schnappschuss(ctx, year);
        saisonListe.push(snap);
        if (year % 20 === 0) process.stdout.write('  ' + year + '... ');
        if (year >= endYear) break;

        // ── Saison-Uebergang, identisch zu monte-carlo-multi.js ──────────
        if (typeof ctx.updateDriverCareerScores === 'function') ctx.updateDriverCareerScores();
        if (typeof ctx.processDriverPaceDevelopment === 'function') ctx.processDriverPaceDevelopment();
        if (typeof ctx.checkCareerEnds === 'function') ctx.checkCareerEnds();
        if (typeof ctx.initReservePool === 'function') ctx.initReservePool(year + 1);
        if (typeof ctx._injectNewSeasonDrivers === 'function') ctx._injectNewSeasonDrivers(year + 1);
        if (typeof ctx.processTeamChanges === 'function') ctx.processTeamChanges();

        // Ruecktritte erst HIER abgreifen, nach processTeamChanges: checkCareerEnds
        // traegt nur Alters- und career_end-Abgaenge ein, die Entlassungen kommen
        // erst aus processTeamChanges. Wer frueher abgreift, misst 16 statt 300
        // Entlassungen und haelt den Rest faelschlich fuer "still verschwunden".
        // Danach kommt startNewSeason und setzt seasonRetirements zurueck.
        snap.retirements = JSON.parse(JSON.stringify(ctx.GAME_STATE.seasonRetirements || []));

        ctx.startNewSeason();
    }
    // Schluessel je Lauf eindeutig halten, sonst verschmelzen gleichnamige
    // Karrieren aus verschiedenen Laeufen zu einer unmoeglich langen.
    const s = serienAusSaisons(saisonListe).map(c => Object.assign({}, c, { key: lauf + '|' + c.key }));
    gesamtKarrieren += s.length;
    serien = serien.concat(s);
    console.log(' [Lauf ' + (lauf + 1) + '/' + LAEUFE + ': ' + s.length + ' Karrieren]');
}

const letzterJahrgang = endYear;
const C = serien.filter(c => c.gen
    && c.jahre[0].year >= abJahr
    && c.jahre[c.jahre.length - 1].year < letzterJahrgang - 2);

// Diagnose: wenn C winzig ist, misst man Rauschen — dann Saisons oder Laeufe hoch.
const genAlle = serien.filter(c => c.gen);
console.log('  davon generiert: ' + genAlle.length
    + ', davon im Fenster ' + abJahr + '-' + (letzterJahrgang - 3) + ' abgeschlossen: ' + C.length
    + ' (mit >=' + MIN_SAISONS + ' Saisons: ' + C.filter(c => c.jahre.length >= MIN_SAISONS).length + ')');

const real = ladeRealitaet();
const A = real.filter(c => !c.jahre.some(j => j.year >= 2025));


const a = messe('A  REALITAET (F1DB 1950-2024)', A, MIN_SAISONS);
const c = messe('C  GENERIERTE Fahrer aus diesem Lauf', C, MIN_SAISONS);

// Aufschluesselung nach Ruecktrittsgrund — der Alterspfad ist der geaenderte
const avg = x => x.length ? x.reduce((p, q) => p + q, 0) / x.length : NaN;
const pct = (n, d) => d ? (100 * n / d).toFixed(1) + '%' : '-';
const typen = {};
for (const x of C.filter(x => x.jahre.length >= MIN_SAISONS)) {
    const t = x.ret ? x.ret.type : '(keiner)';
    (typen[t] = typen[t] || []).push(x);
}
console.log('\n--- nach Ruecktrittsgrund ---');
for (const [t, list] of Object.entries(typen).sort((x, y) => y[1].length - x[1].length)) {
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

// Karrierelaenge — die Gegenprobe: wird jetzt zu SPAET zurueckgetreten?
const dauer = C.map(x => x.jahre.length);
const alterEnde = C.map(x => x.jahre[x.jahre.length - 1].alter).filter(Boolean);
console.log('\n--- Gegenprobe Karrierelaenge (Kippt es ins andere Extrem?) ---');
console.log('  Saisons im Feld: Ø' + avg(dauer).toFixed(1) + '  max ' + Math.max.apply(null, dauer));
console.log('  Alter letzte Saison: Ø' + avg(alterEnde).toFixed(1) + '  max ' + Math.max.apply(null, alterEnde));
console.log('  Zielwerte real: Karriere 4-7 Saisons, Alter am Ende ~33-35, Sieg zuletzt ~8 %');

// Karriere-Bogen: der eigentliche Befund. Karriere in fuenf Abschnitte, je
// Anteil am eigenen Peak. Real 16/37/42/37/26, Flachheit 32 %.
const Bg = [[], [], [], [], []]; const flach = []; let nb = 0;
for (const x of C.filter(v => v.jahre.length >= 5)) {
    const s2 = x.jahre.map(v => v.share); const bst = Math.max.apply(null, s2);
    if (bst <= 0) continue; nb++;
    const norm = s2.map(v => v / bst);
    for (let i = 0; i < 5; i++) {
        const a = Math.floor(i * norm.length / 5), b = Math.max(a + 1, Math.floor((i + 1) * norm.length / 5));
        Bg[i].push(avg(norm.slice(a, b)));
    }
    flach.push(avg(norm));
}
console.log('\n--- KARRIERE-BOGEN (n=' + nb + ') ---');
console.log('  Abschnitt 1-5: ' + Bg.map(x => (100 * avg(x)).toFixed(0) + '%').join('  '));
console.log('  Flachheit: ' + (100 * avg(flach)).toFixed(0) + '%   (real 32 %, je hoeher desto flacher)');
console.log('  real:          16%  37%  42%  37%  26%');

// Gegenprobe Pace-Inflation: steigt das Feldniveau ueber die Saisons davon?
const jahrPace = {};
for (const sn of saisonListe) {
    const ps = (sn.drivers || []).map(d => d.pace).filter(v => typeof v === 'number');
    if (ps.length) jahrPace[sn.year] = avg(ps);
}
const jahre2 = Object.keys(jahrPace).map(Number).sort((a, b) => a - b);
if (jahre2.length > 20) {
    const frueh = jahre2.slice(0, 10).map(y => jahrPace[y]);
    const spaet = jahre2.slice(-10).map(y => jahrPace[y]);
    console.log('\n--- Gegenprobe Pace-Inflation (letzter Lauf) ---');
    console.log('  Feld-Pace erste 10 Saisons Ø' + avg(frueh).toFixed(1)
        + '  letzte 10 Ø' + avg(spaet).toFixed(1)
        + '   Drift ' + (avg(spaet) - avg(frueh) >= 0 ? '+' : '') + (avg(spaet) - avg(frueh)).toFixed(1));
}

console.log('\n--- Urteil ---');
console.log('  Sieg in der letzten Saison: generiert ' + pct(c.sieg, c.n) + '  gegen real ' + pct(a.sieg, a.n));
console.log('  Formstand am Ende: ' + (100 * c.endAnteil).toFixed(0) + '% gegen real ' + (100 * a.endAnteil).toFixed(0) + '% des Peaks');
