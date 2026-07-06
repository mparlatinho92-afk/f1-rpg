// compare-season-data-vs-f1db.js
// Vergleicht SEASON_DATA-Fahrer-Slots (data/seasons.js) mit realen F1DB-Cockpit-Zahlen
// (tests/cockpit-summary.csv, erzeugt von analyze-cockpits.js).
//
// Output: Konsole + tests/season-data-deviations.csv
// Kriterium: SD-Fahrerzahl pro Team-Jahr vs. max_cockpits aus F1DB (1950–1991).

'use strict';
const fs = require('fs');
const path = require('path');

// ── 1. SEASON_DATA laden ──────────────────────────────────────────────────────
const seasonsSrc = fs.readFileSync(path.join(__dirname, '..', 'data', 'seasons.js'), 'utf8');
const SEASON_DATA = new Function(seasonsSrc + '\n;return SEASON_DATA;')();

// ── 2. Cockpit-Summary laden ──────────────────────────────────────────────────
const csv = fs.readFileSync(path.join(__dirname, 'cockpit-summary.csv'), 'utf8');
const cockpits = {}; // slug → year → { min, max, races, detail }
for (const line of csv.split('\n').slice(1)) {
    if (!line.trim()) continue;
    const m = line.match(/^"([^"]+)",(\d+),(\d+),(\d+),(\d+),([\d.]+),(\d+),(-?\d+),"(.*)"$/);
    if (!m) continue;
    const [, slug, year, races, min, max, , , , detail] = m;
    (cockpits[slug] ||= {})[+year] = { min: +min, max: +max, races: +races, detail };
}

// ── 3. Team-Name → F1DB-Slug-Mapping ─────────────────────────────────────────
function norm(name) {
    return name.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
// Manuelle Aliasse (SD-Name → F1DB-Slug)
const ALIAS = {
    'simca-gordini': 'gordini',
    'talbot-lago': 'talbot-lago',
    'alfa-romeo': 'alfa-romeo',
    'osca': 'osca',
    'wolf': 'wolf',
    'atc-ats': 'ats-wheels',            // deutsches ATS-Team 1977–84
    'ats': 'ats-wheels',
    'ats-italy': 'ats',                 // italienisches ATS 1963
    'team-lotus': 'lotus',
    'lotus': 'lotus',
    'brabham': 'brabham',
    'matra': 'matra',
    'stp-march': 'march',
    'march': 'march',
    'tyrrell': 'tyrrell',
    'mclaren': 'mclaren',
    'frank-williams': 'frank-williams-racing-cars',
    'williams': 'williams',
    'iso-marlboro': 'iso-marlboro',
    'toleman': 'toleman',
    'spirit': 'spirit',
    'ram': 'ram',
    'zakspeed': 'zakspeed',
    'rial': 'rial',
    'onyx': 'onyx',
    'leyton-house': 'leyton-house',
    'porsche': 'porsche',
    'de-tomaso': 'de-tomaso',
    'lds': 'lds',
    'renault': 'renault',
    'ligier': 'ligier',
    'shadow': 'shadow',
    'surtees': 'surtees',
    'hesketh': 'hesketh',
    'penske': 'penske',
    'copersucar-fittipaldi': 'fittipaldi',
    'fittipaldi': 'fittipaldi',
    'lola': 'lola',
    'lancia': 'lancia',
    'vanwall': 'vanwall',
    'mercedes': 'mercedes',
    'mercedes-benz': 'mercedes',
    'eagle-weslake': 'eagle',
    'eagle': 'eagle',
    'honda': 'honda',
    'cooper-maserati': 'cooper',
    'cooper': 'cooper',
    'brm': 'brm',
    'ensign': 'ensign',
    'theodore': 'theodore',
    'arrows': 'arrows',
    'osella': 'osella',
    'ags': 'ags',
    'coloni': 'coloni',
    'eurobrun': 'eurobrun',
    'life': 'life',
    'minardi': 'minardi',
    'dallara': 'dallara',
    'larrousse': 'larrousse',
    'lambo': 'lambo',
    'lamborghini': 'lambo',
    'fondmetal': 'fondmetal',
    'jordan': 'jordan',
    'benetton': 'benetton',
    'footwork': 'footwork',
    'brp': 'brp',
    'era': 'era',
    'hwm': 'hwm',
    'connaught': 'connaught',
    'maserati': 'maserati',
    'ferrari': 'ferrari',
    'bugatti': 'bugatti',
    'aston-martin': 'aston-martin',
    'tecno': 'tecno',
    'hill': 'hill',
    'embassy-hill': 'hill',
    'wolf-williams': 'wolf-williams',
    'kauhsen': 'kauhsen',
    'merzario': 'merzario',
    'rebaque': 'rebaque',
    'boro': 'boro',
    'trojan': 'trojan',
    'token': 'token',
    'amon': 'amon',
    'maki': 'maki',
    'lyncar': 'lyncar',
    'parnelli': 'parnelli',
};

// ── 4. Vergleich 1950–1991 ────────────────────────────────────────────────────
const out = [];
const unmatched = [];
for (const [yearStr, sd] of Object.entries(SEASON_DATA)) {
    const year = +yearStr;
    if (year < 1950 || year > 1991) continue;
    const teams = sd.t || [];
    const drivers = sd.d || [];
    for (const t of teams) {
        const [tid, name] = t;
        const n = norm(name);
        const slug = ALIAS[n] || n;
        const sdCount = drivers.filter(d => d[2] === tid).length;
        const cp = cockpits[slug] && cockpits[slug][year];
        if (!cp) {
            unmatched.push({ year, tid, name, slug, sdCount });
            continue;
        }
        if (sdCount !== cp.max) {
            out.push({
                year, tid, name, slug, sdCount,
                f1dbMin: cp.min, f1dbMax: cp.max, races: cp.races, detail: cp.detail,
                dir: sdCount > cp.max ? 'SD_ZU_VIEL' : 'SD_ZU_WENIG',
            });
        }
    }
}

out.sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));

console.log(`\n=== ABWEICHUNGEN SD vs F1DB (${out.length}) ===`);
for (const o of out) {
    console.log(`${o.year}  ${o.name.padEnd(22)} SD=${o.sdCount}  F1DB=${o.f1dbMin}-${o.f1dbMax} (${o.races} Rennen)  [${o.dir}]  ${o.detail.length > 60 ? o.detail.slice(0, 60) + '…' : o.detail}`);
}

console.log(`\n=== KEIN F1DB-MATCH (${unmatched.length}) — Indy-Teams oder Mapping-Lücke ===`);
for (const u of unmatched) {
    console.log(`${u.year}  ${u.name.padEnd(22)} (norm: ${u.slug})  SD=${u.sdCount}`);
}

// CSV
const lines = ['year,team_id,team_name,f1db_slug,sd_drivers,f1db_min,f1db_max,n_races,direction,detail'];
for (const o of out) {
    lines.push(`${o.year},"${o.tid}","${o.name}","${o.slug}",${o.sdCount},${o.f1dbMin},${o.f1dbMax},${o.races},${o.dir},"${o.detail}"`);
}
fs.writeFileSync(path.join(__dirname, 'season-data-deviations.csv'), lines.join('\n'), 'utf8');
console.log(`\nCSV: tests/season-data-deviations.csv (${out.length} Zeilen)`);
