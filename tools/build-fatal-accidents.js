// build-fatal-accidents.js — erzeugt data/fatal-accidents.js (18.11.2026)
//
// REALE TÖDLICHE UNFÄLLE IM STECKBRIEF (Nutzer 18.11.2026, FIXES_OFFEN.md „Tödliche Unfälle“):
// Alle real tödlich verunglückten F1-Fahrer, aber nur im Fenster von 10 Jahren nach ihrer letzten
// F1-Saison (Hulme 1974 → † 1992 fällt raus, Alboreto 1994 → † 2001 Testunfall gehört dazu).
// Natürlicher Tod bleibt unsichtbar.
//
// QUELLE: Motorsport Memorial (motorsportmemorial.org, Datenbank „ct“) — Nutzer: „hat alles“.
// MM führt Todesfälle im Motorsport (Rennen, Training, Test, Rallye, Rekordversuch). Flugzeug-
// und Straßenunfälle (Graham Hill, Hawthorn, Hailwood) stehen dort nicht und bleiben draußen.
//
// ABGLEICH: F1DB-Fahrer mit Todesdatum ≤ 10 Jahre nach der letzten Saison (seasons-entrants-drivers)
// gegen die MM-Namensliste: gleicher Nachname (erste 5 Buchstaben) UND Todesdatum ± 3 Tage
// (MM nennt teils den Unfalltag, F1DB den Todestag: Hoyt, Whitehead je 1 Tag).
//
// Aufruf: node tools/build-fatal-accidents.js <cacheOrdner>
//   Lädt fehlende MM-Seiten in <cacheOrdner> (1 s Pause je Abruf), sonst nur Auswertung.
//   Der Cache gehört NICHT ins Projekt (fremde Seiten, nur Rohdaten).
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const cache = process.argv[2];
if (!cache) { console.error('Aufruf: node tools/build-fatal-accidents.js <cacheOrdner>'); process.exit(1); }
fs.mkdirSync(cache, { recursive: true });
const BASIS = 'http://www.motorsportmemorial.org/';

function holen(datei, url) {
    const p = path.join(cache, datei);
    if (!fs.existsSync(p)) {
        execFileSync('curl', ['-s', '-A', 'Mozilla/5.0', '-o', p, url]);
        execFileSync(process.execPath, ['-e', 'setTimeout(()=>{},1000)']);
    }
    return fs.readFileSync(p, 'latin1');
}
const ent = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&([A-Za-z])(uml|acute|grave|circ|tilde|cedil|ring);/g, (m, b, a) =>
        (b + ({ uml: '̈', acute: '́', grave: '̀', circ: '̂', tilde: '̃', cedil: '̧', ring: '̊' })[a]).normalize('NFC'))
    .replace(/&szlig;/g, 'ß');
const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const datum = s => { const d = String(s).match(/(\d+)\.(\w+)\.(\d{4})/); return d ? `${d[3]}-${String(MON[d[2].toLowerCase().slice(0, 3)]).padStart(2, '0')}-${d[1].padStart(2, '0')}` : null; };

// 1. MM-Namensliste
const mm = [];
for (const L of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const h = holen(`idx_${L}.html`, `${BASIS}query.php?db=ct&q=name&n=${L}`);
    const re = /focus\.php\?db=ct&n=(\d+)">([^<]*)<\/a>[\s\S]*?Death date: <\/span>([^<]*)</g;
    let m; while ((m = re.exec(h))) mm.push({ n: m[1], name: ent(m[2]).trim(), date: datum(m[3]) });
}

// 2. Kandidaten aus F1DB
const J = f => JSON.parse(fs.readFileSync(path.join(root, 'f1db-json-splitted', `f1db-${f}.json`), 'utf8'));
const letzte = {};
for (const e of J('seasons-entrants-drivers')) letzte[e.driverId] = Math.max(letzte[e.driverId] || 0, e.year);
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
const tage = (a, b) => Math.abs((new Date(a) - new Date(b)) / 864e5);
const kand = J('drivers').filter(d => d.dateOfDeath && letzte[d.id] && +d.dateOfDeath.slice(0, 4) - letzte[d.id] <= 10);

// 3. Einzelseiten auswerten
const ART = { race: 'Rennen', practice: 'Training', qualifying: 'Qualifikation', 'qualifying heat': 'Qualifikation',
    test: 'Testfahrt', testing: 'Testfahrt', 'private testing': 'Testfahrt', 'rally stage': 'Rallye-Etappe',
    'record attempt': 'Rekordversuch', 'speed record attempt': 'Rekordversuch', 'hill climb': 'Bergrennen', 'hillclimb': 'Bergrennen',
    'private test': 'Testfahrt', 'series test': 'Testfahrt', 'warm-up': 'Warm-up', 'post-race': 'nach dem Rennen',
    'marathon race': 'Rennen', 'hillclimb - practice': 'Bergrennen, Training', 'hillclimb - race': 'Bergrennen' };
const out = {}, ohne = [];
for (const d of kand) {
    const t = mm.find(x => x.date && tage(x.date, d.dateOfDeath) <= 3 && norm(x.name).includes(norm(d.lastName).slice(0, 5)));
    if (!t) { ohne.push(d.id); continue; }
    const h = holen(`f${t.n}.html`, `${BASIS}focus.php?db=ct&n=${t.n}`).replace(/[\r\n]+/g, ' ');
    const feld = k => { const m = h.match(new RegExp(k + ': </span>([^<]*)<')); return m ? ent(m[1]).replace(/\s+/g, ' ').trim() : ''; };
    const art = feld('Event type').toLowerCase();
    const serie = feld('Series').replace(/^.*\(FIA\) Formula 1 World Championship$/, 'Formel-1-WM');
    const rennen = feld('Race');
    out[d.id] = {
        tod: d.dateOfDeath, unfall: datum(feld('Event date')) || d.dateOfDeath,
        // „[private test]“ ist kein Veranstaltungsname → dann die Serie
        anlass: rennen && !/^\[.*\]$/.test(rennen) ? rennen : serie, serie,
        // Klammerzusätze flach: der Steckbrief setzt den Ort selbst in Klammern
        ort: feld('Venue').replace(/\s*\(officially[^)]*\)/i, '').replace(/\s*\(([^)]*)\)/g, ', $1'),
        art: ART[art] || art || '', mm: +t.n
    };
}
const kopf = `// data/fatal-accidents.js — GENERIERT von tools/build-fatal-accidents.js, nicht von Hand ändern.\n`
    + `// Reale tödliche Unfälle von F1-Fahrern, ≤ 10 Jahre nach der letzten F1-Saison. Quelle: Motorsport Memorial.\n`
    + `// { slug: { tod, unfall, anlass, serie, ort, art, mm } } — mm = focus.php?db=ct&n=<mm>\n`;
fs.writeFileSync(path.join(root, 'data', 'fatal-accidents.js'), kopf + 'const REAL_FATAL_ACCIDENTS = ' + JSON.stringify(out) + ';\n');
console.log(`data/fatal-accidents.js: ${Object.keys(out).length} Unfälle; ${kand.length} Kandidaten, ${ohne.length} ohne MM-Eintrag (kein Motorsport-Tod)`);
console.log('ohne: ' + ohne.join(', '));
const arten = {}; for (const v of Object.values(out)) arten[v.art] = (arten[v.art] || 0) + 1;
console.log('Arten: ' + JSON.stringify(arten));
