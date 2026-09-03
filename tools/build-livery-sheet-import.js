/**
 * build-livery-sheet-import.js
 *
 *   node tools/build-livery-sheet-import.js
 *
 * Übersetzt den Google-Calc-Reiter „teamfarben" (Rohkopie in
 * tools/quellen/teamfarben-sheet.md) in das Import-Format f1rpg-livery/1 →
 * tools/quellen/livery-sheet-import.json
 *
 * Das Sheet mischt vier Formen, die hier getrennt gelesen werden:
 *   A  Saison-Zeilen      „Saison 2015" + Chat-/Doc-Link + Referenzbild
 *   B  Team-Linien        „Jordan/Midland/…" + Statusnotiz + Referenzbild
 *   C  flache Team-Liste  „Osella | 2278c1"  – Farbe OHNE Jahresangabe
 *   D  Aufschlüsselung    Jahr × Team-Matrix mit Farbworten („blau-blau-weiß")
 *
 * Nichts wird geraten: Was sich nicht auflösen lässt, landet im Bericht am
 * Ende und NICHT in der Datei.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Core = require('./livery-core.js');

const ROOT = path.resolve(__dirname, '..');
const p = f => path.join(ROOT, f);

// ---------------------------------------------------------------- Spielseite
function loadDataFile(rel, names) {
    const src = fs.readFileSync(p(rel), 'utf8') + '\n;' +
        names.map(n => `globalThis.__${n} = (typeof ${n} !== "undefined") ? ${n} : null;`).join('');
    const sandbox = { window: {}, console: console };
    vm.runInNewContext(src, sandbox, { timeout: 120000, filename: rel });
    const out = {};
    for (const n of names) out[n] = sandbox['__' + n] || null;
    return out;
}

const { SEASON_DATA } = loadDataFile('data/seasons.js', ['SEASON_DATA']);
const { INDY_500_ONLY_CONSTRUCTORS } = loadDataFile('data/hist.js', ['INDY_500_ONLY_CONSTRUCTORS']);
const game = Core.extractGameColors(fs.readFileSync(p('index.html'), 'utf8'))(SEASON_DATA);
const built = Core.buildCells({
    SEASON_DATA, game, indyConstructors: INDY_500_ONLY_CONSTRUCTORS || []
});

// ------------------------------------------------------------- Namensbrücke
// Schreibweisen aus dem Sheet, die resolveTeam nicht von selbst trifft.
const ALIAS = {
    'ats (italien)': 'ATI', 'ats wheels': 'ATW', 'alfa romeo 1950-1988': 'ALF',
    'alfa romeo (alt)': 'ALF', 'alta special': 'ALS', 'alfa-special': 'ALS',
    'iso marlboro': 'ISO', 'iso-marlboro': 'ISO', 'osca': 'OSC',
    'lotus (altes lotus)': 'LOT', 'renault alt': 'REN', 'behra porsche': 'BEH',
    'behra-porsche': 'BEH', 'march-werksteam': 'MAR', 'embassy hill': 'HIL',
    'eagle (all american cars)': 'EAG', 'aston-butterworth': 'AST',
    'aston butterworth': 'AST', 'f2 ende der 1960er auswahl': null,
    'weitere deutsche kleinstkonstruktere': null, 'nürburgring deutsche kleinstkonstruktere': null,
    'copersucar': 'FIT', 'larrousse': 'LOL', 'fondmetal': 'FON', 'leyton house': 'LEY'
};

/** Sheet-Beschriftung säubern: Klammern, Bugnotizen, Jahreszahlen weg. */
function cleanName(raw) {
    return String(raw || '')
        .replace(/\\/g, '')
        .replace(/\s*nicht anklickbar ist grau\s*/ig, '')
        .replace(/\s*\(.*?\)\s*/g, ' ')
        .replace(/\s*\d{4}\s*-\s*\d{4}\s*/g, ' ')
        .trim();
}

const unresolved = [];
function resolve(rawName, context) {
    const cleaned = cleanName(rawName);
    const aliasKey = String(rawName || '').replace(/\\/g, '').trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(ALIAS, aliasKey)) {
        const v = ALIAS[aliasKey];
        if (v === null) return null;                       // bewusst nichts
        if (built.teams[v]) return v;
    }
    const cleanKey = cleaned.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(ALIAS, cleanKey)) {
        const v = ALIAS[cleanKey];
        if (v === null) return null;
        if (built.teams[v]) return v;
    }
    const hit = Core.resolveTeam(cleaned, built);
    if (!hit) unresolved.push({ name: String(rawName).trim(), context });
    return hit;
}

/**
 * Lebensspanne eines Teams – für Farben aus der flachen Liste ohne Jahr.
 *
 * Gibt null zurück, wenn die Historie eine grosse Luecke hat: dann traegt eine
 * ID mehrere Konstrukteure (AST = Aston Butterworth 1952 + Aston Martin 1959/60
 * + Aston Martin 2021-2025), und eine Farbe ohne Jahresangabe waere nicht
 * zuordenbar. Lieber nichts schreiben als das Falsche.
 */
function span(teamId) {
    const ys = built.teams[teamId].years;
    for (let i = 1; i < ys.length; i++) {
        if (ys[i] - ys[i - 1] > 4) return null;
    }
    return { from: ys[0], to: ys[ys.length - 1] };
}

// ------------------------------------------------------------------- Parsing
const rawLines = fs.readFileSync(p('tools/quellen/teamfarben-sheet.md'), 'utf8').split(/\r?\n/);
const rows = rawLines
    .filter(l => l.trim().startsWith('|'))
    .map(l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.replace(/\\/g, '').trim()));

// Der Export enthält das GANZE Spreadsheet. Nur zwei Bereiche betreffen Farben;
// alles danach (Werksteam/Privateer, Landsmann-Regel, Owner-Driver, Kalender)
// wird bewusst nicht angefasst.
const idxOf = (pred, from) => { for (let i = from || 0; i < rows.length; i++) if (pred(rows[i])) return i; return -1; };
const FARB_ENDE = idxOf(r => /^drei Arten von Teams/i.test(r[0] || ''));
const MATRIX_VON = idxOf(r => r.some(c => /^March-Werksteam$/i.test(c)));
const MATRIX_BIS = idxOf(r => /^siehe Link:/i.test(r[0] || ''), MATRIX_VON + 1);
if (FARB_ENDE < 0 || MATRIX_VON < 0) {
    throw new Error('Bereichsmarker im Sheet nicht gefunden – Aufbau hat sich geändert.');
}

const isSep = r => r.every(c => /^:?-+:?$/.test(c) || c === '');
const isUrl = c => /^https?:\/\//i.test(c);
const isImage = c => isUrl(c) && !/docs\.google|claude\.ai|wikipedia|reddit|racingyears|classicf3|fandom/i.test(c);
const isLink = c => isUrl(c) && /docs\.google|claude\.ai/i.test(c);

/** Sieht die Zelle nach Farbe aus? Bloßes Hex im Sheet steht oft ohne #. */
function asColor(cell) {
    if (!cell || isUrl(cell)) return null;
    const t = cell.trim();
    if (/^#?[0-9a-fA-F]{6}$/.test(t)) return Core.parseColorInput('#' + t.replace('#', ''));
    const parsed = Core.parseColorInput(t);
    return parsed.colors ? parsed : null;
}

const entries = [];
const context = { years: {}, teams: {} };
const notes = [];

// ---- A + B + C: die erste große Tabelle (Saisons, Team-Linien, flache Liste)
for (let ri = 0; ri < FARB_ENDE; ri++) {
    const r = rows[ri];
    if (isSep(r) || !r[0]) continue;
    const first = r[0];

    // A: Saison-Zeile
    const mSeason = /^Saison\s+(\d{4})$/i.exec(first);
    if (mSeason) {
        const year = +mSeason[1];
        const ref = r.find(isLink) || '';
        const img = r.find(isImage) || '';
        if (ref || img) context.years[year] = Object.assign({}, ref ? { ref } : null, img ? { image: img } : null);
        continue;
    }
    if (/^(Team|Konstrukteur|drei |je h|und desto|beides|Privateers|wenn |in der HTML|manche |alle Indy|siehe Link|auch Fix|einige Teams|gib mal|erfolglose|Alt History|schnelle Samlung|Fahrer fahren|Fahrer wie|EXTRA-Spalten|bis ca\.|kleinere Konstrukteure|historisch:|Mitte\/Ende|weitere,|Werksteam|größerer|Reputation)/i.test(first)) continue;
    if (isUrl(first)) continue;

    // B/C: Team-Zeile. Farbe kann in Spalte 2 oder 3 stehen, Bild in 2–5.
    const teamsRaw = first.split('/').map(s => s.trim()).filter(Boolean);
    const img = r.slice(1).find(isImage) || '';
    let colorCell = null, colorIdx = -1;
    for (let i = 1; i < r.length; i++) {
        const c = asColor(r[i]);
        if (c) { colorCell = c; colorIdx = i; break; }
    }
    const noteText = r.slice(1)
        .filter((c, i) => c && !isUrl(c) && (i + 1) !== colorIdx)
        .join(' · ');

    // Mehrfachnennung wie „Jordan/Midland/Spyker/…" ist eine Team-LINIE:
    // Notiz und Bild gelten für alle, eine Farbe stünde aber nur für eine.
    const isChain = teamsRaw.length > 1;
    let anyResolved = false;
    for (const nameRaw of teamsRaw) {
        const id = resolve(nameRaw, 'Team-Zeile "' + first.slice(0, 40) + '"');
        if (!id) continue;
        anyResolved = true;
        const ctx = context.teams[id] = context.teams[id] || {};
        if (img && !ctx.image) ctx.image = img;
        if (noteText) ctx.note = ctx.note ? ctx.note + ' · ' + noteText : noteText;

        if (colorCell && !isChain) {
            const s = span(id);
            if (!s) {
                notes.push('„' + first + '" → ' + id + ' (' + built.teams[id].name + '): Historie hat ' +
                    'Luecken, die ID traegt mehrere Konstrukteure. Farbe ' + colorCell.colors.join(' ') +
                    ' ohne Jahresangabe NICHT uebernommen – im Editor selbst setzen.');
                continue;
            }
            entries.push({
                team: id, from: s.from, to: s.to, colors: colorCell.colors,
                comment: 'aus der flachen Sheet-Liste, dort OHNE Jahresangabe – ' +
                         'Spanne = ganze Teamhistorie, bitte prüfen' + (noteText ? ' · ' + noteText : ''),
                image: img || undefined, stageHint: 'idee'
            });
        }
    }
    if (colorCell && isChain && anyResolved) {
        notes.push('Farbe an einer Team-Kette übersprungen (gilt unklar für welches Glied): ' + first);
    }
}

// ---- D: die Aufschlüsselung (Jahr × Team-Matrix)
let header = null;
const matrixEnd = MATRIX_BIS > 0 ? MATRIX_BIS : rows.length;
for (let ri = MATRIX_VON; ri < matrixEnd; ri++) {
    const r = rows[ri];
    if (isSep(r)) { header = null; continue; }
    // Kopfzeile der Matrix erkennen: mehrere Teamnamen, keine Jahreszahl vorn
    if (!header && r.length > 8 && !/^\d{4}$/.test(r[0]) && r.filter(Boolean).length >= 3) {
        const cand = [];
        for (let i = 0; i < r.length; i++) if (r[i] && !/#1-Fahrer/i.test(r[i])) cand.push(i);
        if (cand.length >= 3 && cand.length <= 8) {
            const mapped = cand.map(i => ({ idx: i, id: resolve(r[i], 'Aufschlüsselung-Kopf') }))
                               .filter(x => x.id);
            if (mapped.length >= 3) { header = mapped; continue; }
        }
    }
    if (!header || !/^\d{4}$/.test(r[0])) continue;

    const year = +r[0];
    for (const col of header) {
        const cell = r[col.idx + 1];          // Farbe steht rechts vom Fahrernamen
        if (!cell || cell === '-') continue;
        const parsed = Core.parseColorInput(cell);
        if (!parsed.colors) {
            if (cell.length > 2 && !/^[A-ZÄÖÜ][a-zäöü]+ [A-ZÄÖÜ]/.test(cell)) {
                notes.push('Aufschlüsselung ' + col.id + ' ' + year + ': „' + cell + '" nicht als Farbe lesbar');
            }
            continue;
        }
        if (!built.cells[col.id + ':' + year]) {
            notes.push('Aufschlüsselung ' + col.id + ' ' + year + ': Team fuhr in dem Jahr nicht (übersprungen)');
            continue;
        }
        entries.push({
            team: col.id, year: year, colors: parsed.colors,
            comment: 'Aufschlüsselung im Sheet: „' + cell + '"' +
                     (r[col.idx] ? ' (#1 ' + r[col.idx] + ')' : ''),
            stageHint: 'vorschlag'
        });
    }
}

// ------------------------------------------------------------------ Ausgabe
const doc = {
    schema: 'f1rpg-livery/1',
    source: {
        kind: 'sheet',
        ref: 'https://docs.google.com/spreadsheets/d/17eXHCzTZ1mlIBCmfl425hEQRrBpyTHeszwgl5cyufr0/edit?gid=941398293',
        note: 'Google-Calc-Reiter „teamfarben", Stand 02.09.2026',
        date: '2026-09-02'
    },
    context: context,
    entries: entries
};

fs.writeFileSync(p('tools/quellen/livery-sheet-import.json'), JSON.stringify(doc, null, 2), 'utf8');

const fromMatrix = entries.filter(e => e.stageHint === 'vorschlag').length;
const fromList = entries.length - fromMatrix;
console.log('\n  tools/quellen/livery-sheet-import.json geschrieben');
console.log('  Einträge gesamt      : ' + entries.length);
console.log('    aus Aufschlüsselung: ' + fromMatrix + ' (jahresgenau)');
console.log('    aus flacher Liste  : ' + fromList + ' (Teamspanne, ohne Jahr im Sheet)');
console.log('  Saisons mit Link/Bild: ' + Object.keys(context.years).length);
console.log('  Teams mit Bild/Notiz : ' + Object.keys(context.teams).length);

if (notes.length) {
    console.log('\n  ÜBERSPRUNGEN (' + notes.length + '):');
    notes.forEach(n => console.log('    · ' + n));
}
if (unresolved.length) {
    const seen = new Set();
    const list = unresolved.filter(u => !seen.has(u.name) && seen.add(u.name));
    console.log('\n  NICHT AUFGELÖSTE NAMEN (' + list.length + '):');
    list.forEach(u => console.log('    · ' + u.name + '   [' + u.context + ']'));
}
