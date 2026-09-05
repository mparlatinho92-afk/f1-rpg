/**
 * build-team-nations.js — erzeugt data/team-nations.js (TEAM_NATION_BLEND).
 *
 * data/team-nations.js ist GENERIERT. Nie von Hand editieren, sondern hier
 * ändern und neu bauen.
 *
 * Anlass (2026-09-05): Der Team-Generator zog seine Nation aus
 * `pickNationMotorsport` — einer FAHRER-Verteilung. Gemessen kam dabei heraus:
 * Finnland 3,4 % der Teams, obwohl Finnland in 76 Jahren F1 NIE einen
 * Konstrukteur gestellt hat; Großbritannien dagegen 9,6 %, obwohl auf britische
 * Rennställe 44 % aller Renneinsätze entfallen. Fahrerländer und Rennstallländer
 * sind zwei verschiedene Landkarten.
 *
 * Quellen:
 *  1. f1db-seasons-constructors.json x f1db-constructors.json — welche Nation
 *     stellte in welcher Dekade wie viele Konstrukteure. Gezählt werden
 *     KONSTRUKTEURE JE SAISON, nicht Renneinsätze: sonst drückt Ferraris
 *     Dauerpräsenz alle kleinen Rennställe desselben Landes weg.
 *  2. tools/quellen/feeder-teams.csv — 77 heutige Feeder- und Endurance-Teams
 *     mit Land (Nutzer-Sheet). Korrektiv für die Gegenwart: in F2/F4/WEC gibt es
 *     tschechische, ungarische, slowenische und dänische Rennställe, die in der
 *     F1-Historie nie auftauchen. Nur für die Dekaden ab 2010 eingemischt.
 *
 * Bodensatz: ein kleiner Anteil der Fahrer-Verteilung bleibt beigemischt, damit
 * ein finnisches oder argentinisches Team möglich bleibt — nur eben selten.
 */

const fs = require('fs');
const path = require('path');

const WURZEL = path.join(__dirname, '..');
const J = f => JSON.parse(fs.readFileSync(path.join(WURZEL, 'f1db-json-splitted', f), 'utf8'));

const DEKADEN = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
const BODENSATZ = 0.15;      // Anteil Fahrer-Verteilung, damit Exoten möglich bleiben
const FEEDER_AB = 2010;      // ab welcher Dekade die Feeder-Liste mitzählt
const FEEDER_ANTEIL = 0.35;  // ihr Gewicht innerhalb dieser Dekaden

// ── 1. F1DB: Konstrukteur-Nationen je Dekade ───────────────────────────────
const laender = J('f1db-countries.json');
// ACHTUNG: f1db führt drei Codes je Land — alpha2 (DE), alpha3 (DEU) und
// iocCode (GER). Das Spiel rechnet in IOC. alpha3 zu nehmen lässt Deutschland
// als zwei verschiedene Länder erscheinen.
const ioc = {};
for (const l of laender) if (l.iocCode) ioc[l.id] = l.iocCode;

const landVon = {};
for (const k of J('f1db-constructors.json')) landVon[k.id] = ioc[k.countryId] || null;

// Indy-Filter. Das Indianapolis 500 zaehlte 1950-1960 zur WM; ohne Filter
// stellen Kurtis Kraft, Kuzma, Watson & Co. die Fuenfziger auf den Kopf
// (gemessen: USA 41,5 % statt 6 %). Die Liste pflegt das Spiel bereits.
const indyOnly = (() => {
    const s = fs.readFileSync(path.join(WURZEL, 'data', 'hist.js'), 'utf8');
    const i = s.indexOf('const INDY_500_ONLY_CONSTRUCTORS');
    const a = s.indexOf('[', i), b = s.indexOf(']', a);
    return new Set(eval(s.slice(a, b + 1)));
})();

const proDekade = {};
for (const d of DEKADEN) proDekade[d] = {};
let indyRaus = 0;
for (const z of J('f1db-seasons-constructors.json')) {
    if (indyOnly.has(z.constructorId)) { indyRaus++; continue; }
    let d = Math.floor(z.year / 10) * 10;
    if (d < 1950) d = 1950;
    if (d > 2020) d = 2020;
    const land = landVon[z.constructorId];
    if (!land) continue;
    proDekade[d][land] = (proDekade[d][land] || 0) + 1;
}
console.log('Indy-only Konstrukteure gefiltert: ' + indyOnly.size
    + ' Namen, ' + indyRaus + ' Saison-Eintraege');

// ── 2. Feeder-Liste ────────────────────────────────────────────────────────
const feeder = {};
{
    const csv = fs.readFileSync(path.join(__dirname, 'quellen', 'feeder-teams.csv'), 'utf8');
    const zeilen = csv.split('\n').slice(1).filter(Boolean);
    for (const z of zeilen) {
        const land = z.split(';')[1];
        if (land) feeder[land.trim()] = (feeder[land.trim()] || 0) + 1;
    }
    console.log('Feeder-Liste: ' + zeilen.length + ' Teams aus '
        + Object.keys(feeder).length + ' Ländern');
}

// ── 3. Fahrer-Verteilung als Bodensatz ─────────────────────────────────────
// Aus MOTORSPORT_NATION_BLEND in index.html gelesen, damit beide Verteilungen
// nicht auseinanderlaufen.
const blend = (() => {
    const s = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
    const i = s.indexOf('MOTORSPORT_NATION_BLEND =');
    const start = s.indexOf('{', i);
    let d = 0, k = start;
    for (; k < s.length; k++) {
        const c = s[k];
        if (c === '{') d++;
        else if (c === '}') { d--; if (!d) { k++; break; } }
    }
    return eval('(' + s.slice(start, k) + ')');
})();

// ── 4. Mischen und normalisieren ───────────────────────────────────────────
const norm = o => {
    const sum = Object.values(o).reduce((a, b) => a + b, 0);
    if (!sum) return {};
    const r = {};
    for (const [k, v] of Object.entries(o)) r[k] = v / sum;
    return r;
};

const out = {};
for (const d of DEKADEN) {
    const hist = norm(proDekade[d]);
    const feed = norm(feeder);
    const fahr = norm(blend[d] || blend[2020] || {});

    const mix = {};
    const add = (q, faktor) => {
        for (const [k, v] of Object.entries(q)) mix[k] = (mix[k] || 0) + v * faktor;
    };
    const teamAnteil = 1 - BODENSATZ;
    if (d >= FEEDER_AB) {
        add(hist, teamAnteil * (1 - FEEDER_ANTEIL));
        add(feed, teamAnteil * FEEDER_ANTEIL);
    } else {
        add(hist, teamAnteil);
    }
    add(fahr, BODENSATZ);

    // auf drei Nachkommastellen runden, Kleinstwerte kappen
    const fertig = {};
    for (const [k, v] of Object.entries(norm(mix))) {
        const r = Math.round(v * 1000) / 1000;
        if (r >= 0.001) fertig[k] = r;
    }
    out[d] = fertig;
}

const kopf = '// GENERIERT von tools/build-team-nations.js — nicht von Hand editieren.\n'
    + '// Nationen-Gewichtung fuer den TEAM-Generator, je Dekade.\n'
    + '// Quellen: f1db-Konstrukteure je Saison (Rennstall-Realitaet) + \n'
    + '// tools/quellen/feeder-teams.csv (heutige F2/F4/WEC-Teams, ab 2010) +\n'
    + '// ' + Math.round(BODENSATZ * 100) + ' % MOTORSPORT_NATION_BLEND als Bodensatz,\n'
    + '// damit Exoten moeglich bleiben. NICHT mit MOTORSPORT_NATION_BLEND verwechseln:\n'
    + '// das ist die FAHRER-Verteilung und gilt weiter fuer Fahrer.\n';
fs.writeFileSync(path.join(WURZEL, 'data', 'team-nations.js'),
    kopf + 'const TEAM_NATION_BLEND = ' + JSON.stringify(out) + ';\n', 'utf8');

console.log('data/team-nations.js geschrieben.\n');
for (const d of DEKADEN) {
    const top = Object.entries(out[d]).sort((a, b) => b[1] - a[1]).slice(0, 8);
    console.log(d + ': ' + top.map(x => x[0] + ' ' + (x[1] * 100).toFixed(1) + '%').join('  '));
}
console.log('\nNationen je Dekade: '
    + DEKADEN.map(d => d + ':' + Object.keys(out[d]).length).join('  '));
