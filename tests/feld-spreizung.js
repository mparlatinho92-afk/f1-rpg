#!/usr/bin/env node
/**
 * feld-spreizung.js — wie weit liegt das Feld auseinander, Ära für Ära?
 *
 * Misst vier Kennzahlen je Ära gegen F1DB und sagt, ob das Spiel die reale
 * Spreizung trifft. Gedacht als ZIELKURVE für die Kalibrierung von carSpeed,
 * Elo-Übersetzung und Form-Vielfalt — dieselbe Rolle, die ERA_ROOKIE_AGE und
 * ERA_RETIREMENT_AGE für die Karrierelänge spielen.
 *
 * Gemessen wird für ALLE Fahrer gemeinsam, echte wie generierte: sie laufen
 * durch dieselbe simulateRace, also gibt es auch nur ein Ziel. Der Befund vom
 * 16.09.2026 (BEFUNDE.md) kam genau daher, dass ich beide getrennt betrachtet
 * und dabei nur die Zukunftsjahre gemessen hatte.
 *
 * Aufruf:  node tests/feld-spreizung.js <export.json> [--csv]
 *
 * Die vier Kennzahlen:
 *   1. Punktequote      Anteil der Fahrer einer Saison, die überhaupt punkten
 *   2. Letztes Team     was das schwächste Team hält, gemessen am Meister
 *   3. Champion-Anteil  wie dominant der Fahrer-Weltmeister ist
 *   4. DNF-Quote        das Rauschen der Ära (Stand 16.09.2026: trifft bereits)
 *
 * ⚠ MESSFALLEN:
 *   - Ära-getrennt auswerten, NIE pauschal. Eine Kohorte, die nur in einem
 *     Zeitfenster vorkommt, verwechselt man sonst mit dem Zeitfenster.
 *   - Reale Feldgröße aus `f1db-seasons-drivers.json`, nicht aus den
 *     Standings: letztere listen nur Fahrer in der Wertung, die punktlosen
 *     fehlen — und genau um die geht es hier.
 *   - Reale DNF: `positionText` ist bei Ausfällen keine Zahl. DNS/DNQ/DNPQ/EX
 *     vorher herausfiltern, das sind Nicht-Starter und keine Ausfälle.
 *   - Das Punktesystem ist im Spiel ära-korrekt (`getPointsForPosition`) und
 *     scheidet als Erklärung aus. Geprüft 16.09.2026.
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SAVE = process.argv[2];
const CSV = process.argv.includes('--csv');
const ROOT = path.join(__dirname, '..');
const DB = path.join(ROOT, 'f1db-json-splitted');

if (!SAVE) {
    console.error('Aufruf: node tests/feld-spreizung.js <export.json> [--csv]');
    process.exit(1);
}

const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const f1 = v => isNaN(v) ? '   –  ' : v.toFixed(1).padStart(6);

const AEREN = [
    ['1950er', 1950, 1959], ['1960er', 1960, 1969], ['1970er', 1970, 1979],
    ['1980er', 1980, 1989], ['1990er', 1990, 1999], ['2000er', 2000, 2009],
    ['2010er', 2010, 2019], ['2020-2025', 2020, 2025]
];

// ── Realität ─────────────────────────────────────────────────────────────
function realitaet() {
    const sd = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-seasons-drivers.json'), 'utf8'));
    const cs = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-seasons-constructor-standings.json'), 'utf8'));
    const rr = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-races-race-results.json'), 'utf8'));

    const j = {};
    const hol = y => (j[y] = j[y] || { fahrer: [], teams: [], start: 0, dnf: 0 });

    for (const r of sd) { if (r.year <= 2025) hol(r.year).fahrer.push(r.totalPoints || 0); }
    for (const r of cs) { if (r.year <= 2025) hol(r.year).teams.push(r.points || 0); }
    for (const r of rr) {
        if (r.year > 2025) continue;
        const pt = String(r.positionText || '');
        if (pt === 'DNS' || pt === 'DNQ' || pt === 'DNPQ' || pt === 'EX') continue;
        const e = hol(r.year);
        e.start++;
        if (!/^\d+$/.test(pt)) e.dnf++;
    }
    return j;
}

// ── Spielstand ───────────────────────────────────────────────────────────
function spielstand(datei) {
    return new Promise(resolve => {
        const j = {};
        const rl = readline.createInterface({ input: fs.createReadStream(datei) });
        rl.on('line', l => {
            if (l.indexOf('{"_t":"season"') !== 0) return;
            const d = JSON.parse(l).d;
            const e = j[d.year] = { fahrer: [], teams: [], start: 0, dnf: 0 };
            for (const s of Object.values(d.driverStandings || {})) e.fahrer.push(s.points || 0);
            for (const s of Object.values(d.teamStandings || {})) e.teams.push(s.points || 0);
            for (const r of (d.results || [])) for (const x of (r.res || [])) {
                e.start++;
                if (x.dnf) e.dnf++;
            }
        });
        rl.on('close', () => resolve(j));
    });
}

// ── Kennzahlen ───────────────────────────────────────────────────────────
function kennzahlen(j, von, bis) {
    const ys = Object.keys(j).map(Number).filter(y => y >= von && y <= bis && j[y].fahrer.length > 3);
    if (!ys.length) return null;
    const quote = [], letzt = [], champ = [], dnf = [], feld = [];
    for (const y of ys) {
        const e = j[y];
        feld.push(e.fahrer.length);
        quote.push(100 * e.fahrer.filter(p => p > 0).length / e.fahrer.length);
        const sumF = e.fahrer.reduce((a, b) => a + b, 0);
        if (sumF > 0) champ.push(100 * Math.max(...e.fahrer) / sumF);
        if (e.teams.length > 3) {
            const t = [...e.teams].sort((a, b) => b - a);
            if (t[0] > 0) letzt.push(100 * t[t.length - 1] / t[0]);
        }
        if (e.start > 0) dnf.push(100 * e.dnf / e.start);
    }
    return { n: ys.length, feld: avg(feld), quote: avg(quote), letzt: avg(letzt), champ: avg(champ), dnf: avg(dnf) };
}

(async () => {
    const R = realitaet();
    const S = await spielstand(SAVE);

    if (CSV) {
        console.log('aera;feld_real;feld_spiel;quote_real;quote_spiel;letztes_real;letztes_spiel;champ_real;champ_spiel;dnf_real;dnf_spiel');
        for (const [name, von, bis] of AEREN) {
            const r = kennzahlen(R, von, bis), s = kennzahlen(S, von, bis);
            if (!r) continue;
            const g = (o, k) => o ? o[k].toFixed(1) : '';
            console.log([name, g(r, 'feld'), g(s, 'feld'), g(r, 'quote'), g(s, 'quote'),
                g(r, 'letzt'), g(s, 'letzt'), g(r, 'champ'), g(s, 'champ'), g(r, 'dnf'), g(s, 'dnf')].join(';'));
        }
        return;
    }

    console.log('FELD-SPREIZUNG je Ära — Spiel gegen F1DB');
    console.log('Datei: ' + path.basename(SAVE) + '\n');
    console.log('                 Feld        Punktequote      letztes Team      Champion        DNF');
    console.log('               real spiel    real spiel       real spiel       real spiel    real spiel');
    console.log('─'.repeat(92));

    const abw = { quote: [], letzt: [], champ: [], dnf: [] };
    for (const [name, von, bis] of AEREN) {
        const r = kennzahlen(R, von, bis), s = kennzahlen(S, von, bis);
        if (!r) continue;
        const z = (a, b) => f1(a) + f1(b);
        console.log('  ' + name.padEnd(11)
            + z(r.feld, s ? s.feld : NaN) + '  '
            + z(r.quote, s ? s.quote : NaN) + '  '
            + z(r.letzt, s ? s.letzt : NaN) + '  '
            + z(r.champ, s ? s.champ : NaN) + '  '
            + z(r.dnf, s ? s.dnf : NaN));
        if (s) for (const k of ['quote', 'letzt', 'champ', 'dnf']) {
            if (!isNaN(r[k]) && !isNaN(s[k])) abw[k].push(s[k] - r[k]);   // MIT Vorzeichen
        }
    }

    // Zukunftsjahre: keine Realreferenz, aber der Trend muss sichtbar bleiben
    const zukunft = Object.keys(S).map(Number).filter(y => y > 2025);
    if (zukunft.length) {
        const von = Math.min(...zukunft), bis = Math.max(...zukunft);
        const z = kennzahlen(S, von, bis);
        console.log('─'.repeat(92));
        console.log('  ' + (von + '-' + bis).padEnd(11) + '  –  ' + f1(z.feld)
            + '    –  ' + f1(z.quote) + '    –  ' + f1(z.letzt)
            + '    –  ' + f1(z.champ) + '    –  ' + f1(z.dnf)
            + '   (keine Realreferenz)');
    }

    console.log('\n── Abweichung (Spiel minus real) ──');
    console.log('  ⚠ Betrag UND Vorzeichen lesen: kippt das Vorzeichen zwischen alten und neuen');
    console.log('    Aeren, hebt der Mittelwert zwei ECHTE Fehler gegenseitig auf.');
    const namen = { quote: 'Punktequote', letzt: 'letztes Team', champ: 'Champion-Anteil', dnf: 'DNF-Quote' };
    for (const k of ['quote', 'letzt', 'champ', 'dnf']) {
        const betrag = avg(abw[k].map(Math.abs));
        const mittel = avg(abw[k]);
        const kippt = abw[k].some(v => v > 1) && abw[k].some(v => v < -1);
        const urteil = betrag <= 5 ? 'trifft' : betrag <= 12 ? 'grenzwertig' : 'DANEBEN';
        console.log('  ' + namen[k].padEnd(18)
            + 'Betrag' + f1(betrag)
            + '   vorzeichenbehaftet' + f1(mittel)
            + '   ' + urteil.padEnd(12) + (kippt ? '⚠ VORZEICHEN KIPPT' : ''));
    }
    console.log('\n  Die DNF-Quote ist der Gegenbeweis, dass Kalibrierung hier moeglich ist:');
    console.log('  sie folgt der realen Aera-Kurve bereits (52 % in den 80ern, 12 % heute).');
})();
