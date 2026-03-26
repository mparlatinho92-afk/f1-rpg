/**
 * calculate-elo.js
 * Chronologische Elo-Berechnung für alle F1-Fahrer 1930–2024.
 *
 * Quellen:
 *   tests/pre1950-data/full-YYYY.json     – goldenera.fi 1930–1940
 *   tests/pre1950-data/silhouet-YYYY.json – silhouet.com 1946–1949
 *   F1DB_RESULTS in index.html            – 1950–2024 (Positionen + DNF-Gründe)
 *   f1db-quali-compressed.js              – Qualifying-Positionen
 *
 * Ausführen: node tests/calculate-elo.js
 * Output:    tests/elo_ratings.json
 */

const fs   = require('fs');
const path = require('path');

const HTML_FILE  = path.join(__dirname, '..', 'index.html');
const QUALI_JS   = path.join(__dirname, '..', 'f1db-quali-compressed.js');
const PRE50_DIR  = path.join(__dirname, 'pre1950-data');
const OUT_FILE   = path.join(__dirname, 'elo_ratings.json');

const START_ELO  = 1500;
const K_RACE     = 16;     // 1950+: Renn-Duelle
const K_QUALI    = 32;     // 1950+: Quali-Teamduelle
const K_PRE50    = 20;     // vor 1950: weniger Rennen → langsamere Bewegung

// ── Slug-Deduplication (Abkürzungen + Namensvarianten → kanonischer Slug) ──
// Quelle: dedup-check.js – Analyse aller pre-1950-Scraped-Daten
const SLUG_ALIASES = {
    // Trossi (3 Varianten im Scraper-Output)
    'trossi':              'carlo-felice-trossi',
    'c-trossi':            'carlo-felice-trossi',
    'carlo-trossi':        'carlo-felice-trossi',
    // Vollständige Duplikate (Spitzname = echter Name)
    'tim-birkin':          'henry-birkin',          // Henry "Tim" Birkin
    'dick-seaman':         'richard-seaman',         // Richard "Dick" Seaman
    'mario-u-borzacchini': 'baconin-borzacchini',    // Baconin = Spitzname für Mario Umberto
    'nando-righetti':      'ferdinando-righetti',    // Nando = Ferdinando
    // Grover-Williams: "Williams" und "W. Williams" → gleiche Person
    'williams':            'w-williams',
    // Single-Lastname (scraper nannte nur Nachname)
    'caracciola':          'rudolf-caracciola',
    'varzi':               'achille-varzi',
    'nuvolari':            'tazio-nuvolari',
    'wimille':             'jean-pierre-wimille',
    'chiron':              'louis-chiron',
    'brivio':              'antonio-brivio',
    'divo':                'albert-divo',
    'bouriat':             'guy-bouriat',
    'ghersi':              'pietro-ghersi',
    'siena':               'eugenio-siena',
    'moll':                'guy-moll',
    'borzacchini':         'baconin-borzacchini',
    'marinoni':            'attilio-marinoni',
    'maserati':            'ernesto-maserati',
    'snowberger':          'russ-snowberger',
    'sandri':              'guglielmo-sandri',
    'bergere':             'cliff-bergere',
    'willman':             'tony-willman',
    'winn':                'billy-winn',
    'loyer':               'roger-loyer',
    'righetti':            'ferdinando-righetti',
    'delommez':            'henri-delommez',
    'tetaldi':             'emile-tetaldi',
    'carini':              'piero-carini',
    'romano':              'emilio-romano',
    'polledry':            'victor-polledry',
    'bonnet':              'rene-bonnet',
    'deutsch':             'charles-deutsch',
    'cornet':              'emile-cornet',
    'claes':               'johnny-claes',
    'chardonnet':          'andre-chardonnet',
    'flahaut':             'pierre-flahaut',
    'manzon':              'robert-manzon',
    'trintignant':         'maurice-trintignant',
    'veyron':              'pierre-veyron',
    'huc':                 'charles-huc',
    'walker':              'peter-walker',
    'chaboud':             'eugene-chaboud',
    'meyrat':              'pierre-meyrat',
    'villeneuve':          'louis-villeneuve',
    // Raph-Varianten (alle = Georges Raph, französischer Fahrer)
    'raph':                'georges-raph',
    'george-raph':         'georges-raph',
    // Initial-Nachname-Abkürzungen (X-lastname → vollständiger Slug)
    'l-fagioli':           'luigi-fagioli',
    'e-maserati':          'ernesto-maserati',
    'g-bouriat':           'guy-bouriat',
    'g-zehender':          'goffredo-zehender',
    'p-ghersi':            'pietro-ghersi',
    'a-ruggeri':           'amedeo-ruggeri',
    'h-stuck':             'hans-stuck',
    'g-campari':           'giuseppe-campari',
    'b-borzacchini':       'baconin-borzacchini',
    'h-birkin':            'henry-birkin',
    'a-divo':              'albert-divo',
    'g-minozzi':           'giovanni-minozzi',
    'b-lewis':             'brian-lewis',
    'j-gaupillat':         'jean-gaupillat',
    'h-stoffel':           'henri-stoffel',
    'a-brivio':            'antonio-brivio',
    'g-comotti':           'gianfranco-comotti',
    'a-marinoni':          'attilio-marinoni',
    'p-pietsch':           'paul-pietsch',
    'b-rosemeyer':         'bernd-rosemeyer',
    'k-evans':             'kenneth-evans',
    'd-evans':             'david-evans',
    'i-troubetskoy':       'igor-troubetskoy',
    'l-arcangeli':         'luigi-arcangeli',
    'c-biondetti':         'clemente-biondetti',
    'g-eyston':            'george-eyston',
    'p-taruffi':           'piero-taruffi',
    'e-siena':             'eugenio-siena',
    'a-momberger':         'august-momberger',
    'w-sebastian':         'wilhelm-sebastian',
    'm-tadini':            'mario-tadini',
    'e-henne':             'ernst-henne',
    'h-geier':             'hanns-geier',
    'r-mays':              'raymond-mays',            // 1935 German GP = Raymond Mays (britisch/ERA), nicht Rex Mays (US)
    'r-eccles':            'roy-eccles',
    'f-mcevoy':            'frederick-mcevoy',
    'e-bianco':            'ettore-bianco',
    'v-belmondo':          'vittorio-belmondo',
    'r-seaman':            'richard-seaman',
    'b-cummings':          'bill-cummings',
    'r-snowberger':        'russ-snowberger',
    'm-varet':             'maurice-varet',
    'h-hamilton':          'hugh-hamilton',           // Hugh Hamilton (1930s), nicht Duncan Hamilton (postwar)
    'r-ferrand':           'ren-ferrand',
    'e-eminente':          'emilio-eminente',
    'm-fourny':            'max-fourny',
    'o-merz':              'otto-merz',
    'm-lehoux':            'marcel-lehoux',
    'f-montier':           'ferdinand-montier',
    'e-howe':              'earl-howe',
    'r-snchal':            'robert-snchal',
    'p-avattaneo':         'pietro-avattaneo',        // Fallback: kein Full-Match gefunden, behalte Initial
    // Scraper-Artefakte (fehlende Leerzeichen im Namen)
    'bbira':               'prince-bira',
    'b-bira':              'prince-bira',
    'petancelin':          'philippe-etancelin',
    'hlouveau':            'henri-louveau',
    'wwilliams':           'w-williams',
    'r-dreyfus':           'ren-dreyfus',
    // Neu aus 1922–1929 + erweiterten 1930–1940-Daten
    'h-lang':              'hermann-lang',
    'g-rovere':            'gino-rovere',
    'c-pintacuda':         'carlo-pintacuda',
    'f-minoia':            'ferdinando-minoia',
    'b-ivanowski':         'boris-ivanowski',
    'p-fairfield':         'pat-fairfield',
    'w-bumer':             'walter-bumer',
    'c-conelli':           'caberto-conelli',
    'g-darnoux':           'georges-darnoux',
    'r-balestrero':        'renato-balestrero',
    'c-brackenbury':       'charles-brackenbury',
    'm-borzacchini':       'mario-u-borzacchini',
    'b-sojka':             'bruno-sojka',
    'h-resch':             'hans-resch',
    'l-soffietti':         'luigi-soffietti',
    'h-dobbs':             'hector-dobbs',
    'c-paul':              'cyril-paul',
    'p-whitehead':         'peter-whitehead',
    'r-hasse':             'rudolf-hasse',
    'h-mller':             'hermann-mller',
    'g-rocco':             'giovanni-rocco',
    'p-monkhouse':         'peter-monkhouse',
    'e-dupont':            'emile-dupont',
    'c-montier':           'charles-montier',
    's-czaykowski':        'stanislas-czaykowski',
    'g-lurani':            'giovanni-lurani',
    'u-klinger':           'umberto-klinger',
    'a-caniato':           'alfredo-caniato',
    'm-baumer':            'maurice-baumer',
    'l-joly':              'louis-joly',
    'f-schmidt':           'florian-schmidt',
    'e-burggaller':        'ernst-gnther-burggaller',
    'g-sandri':            'guglielmo-sandri',
    'w-everitt':           'william-everitt',
    'l-eccles':            'lindsay-eccles',
    'w-handley':           'walter-handley',
    'p-driscoll':          'patrick-driscoll',
    'f-severi':            'francesco-severi',
    'l-schell':            'lucy-schell',
    'k-don':               'kaye-don',
    'd-scribbans':         'denis-scribbans',
    'r-parnell':           'reg-parnell',
    'e-villoresi':         'emilio-villoresi',
    'f-ashby':             'francis-ashby',
    'c-gazzabini':         'carlo-gazzabini',
    'w-cotton':            'william-cotton',
    // Mittel-Fälle (geprüft)
    'k-rudolff':           'knut-rudoff',
    'r-carrire':           'ren-carrir',
    'r-toni':              'raffaele-toti',
    // AAA/USAC Schreibvarianten
    'louie-unser':         'louis-unser',
};

// ── Regenrennen (F1DB race IDs) – fahrerbedingten DNFs ELO-neutral halten ──
// Spin/Kollision im Regen ≠ reiner Fahrerfehler → kein ELO-Malus
const WET_RACE_IDS = new Set([3,8,18,19,22,29,33,34,36,37,39,52,56,99,100,108,109,113,115,134,140,143,145,147,158,166,167,169,201,207,212,220,237,246,255,258,260,262,274,280,287,292,295,309,316,328,344,346,347,350,352,356,363,378,394,406,417,441,460,461,467,474,479,484,502,503,516,520,524,528,533,534,535,536,547,563,567,571,575,578,580,583,587,588,602,605,609,623,627,637,644,652,654,657,659,662,665,666,690,700,712,715,728,731,747,763,766,778,783,784,791,793,794,798,799,803,805,806,822,824,833,837,846,848,849,850,855,860,878,880,908,912,925,941,945,955,958,970,987,1008,1021,1032,1037,1046,1047,1050,1051,1061,1064,1070,1074,1075,1085,1122]);

// ── Elo-Kernfunktionen ─────────────────────────────────────────────────────

function expected(rA, rB) {
    return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}

function getElo(ratings, slug) {
    if (!ratings[slug]) ratings[slug] = { race: START_ELO, quali: START_ELO };
    return ratings[slug];
}

/**
 * Ein Head-to-Head-Renn-Duell: winner schlug loser.
 * kWinner / kLoser können unterschiedlich sein (z.B. 0 / K für reinen Malus).
 */
function applyRaceDuel(ratings, winnerSlug, loserSlug, kWinner, kLoser) {
    const rW = getElo(ratings, winnerSlug);
    const rL = getElo(ratings, loserSlug);
    const eW = expected(rW.race, rL.race);
    rW.race += kWinner * (1 - eW);
    rL.race += kLoser  * (0 - (1 - eW));
}

/** Quali-Duell: schnellerer Teamkollege schlug langsameren. */
function applyQualiDuel(ratings, fasterSlug, slowerSlug) {
    const rF = getElo(ratings, fasterSlug);
    const rS = getElo(ratings, slowerSlug);
    const eF = expected(rF.quali, rS.quali);
    rF.quali += K_QUALI * (1 - eF);
    rS.quali += K_QUALI * (0 - (1 - eF));
}

// ── DNF-Klassifikation ─────────────────────────────────────────────────────
// Gibt 'tech' | 'driver' | 'collision' | 'dsq' | 'unknown' | null (= Finisher) zurück.

function classifyDnf(status) {
    if (!status) return 'unknown';
    const s = status.toLowerCase().trim();
    if (!s || s === 'finished' || /^\+\d+/.test(s)) return null; // Finisher
    if (/disqualif/.test(s))                        return 'dsq';
    if (/collision|contact|collided/.test(s))       return 'collision';
    // Fahrerfehler: Eigendreher / Abflug ohne Fremdbeteiligung
    if (/^spun off$|^spin off$|^spin$|^spun$/.test(s)) return 'driver';
    // 'Accident' bewusst neutral: kann Technikversagen sein (Senna 1994, Schumacher 1999)
    if (/engine|gearbox|transmission|clutch|oil|fuel|fire|overheating|water|radiator|suspension|wheel|tyre|tire|brake|magneto|supercharger|head gasket|differential|steering|hydraulic|electronic|electrical|exhaust|turbo|throttle|power|ers|mgu|hybrid|energy|drs|ignition|halfshaft|driveshaft|alternator|injection|axle|battery|vibration|gearshift|cv joint|prop shaft|puncture|chassis|distributor|mechanical|undertray|spark plug|pneumatic|compressor|camshaft|drivetrain|launch control|technical defect|crankshaft|airbox|track rod|coolant|cooling/.test(s)) {
        return 'tech';
    }
    return 'unknown';
}

// ── Renn-Verarbeitung ─────────────────────────────────────────────────────

/**
 * Verarbeitet ein Pre-1950-Rennen.
 * entries: [{ pos, dnf, dnfReason, driverSlug }, ...]
 * dnfReason: 'tech' | 'driver' | 'collision' | 'unknown' | null
 * Gibt Set der aktiven Fahrer zurück (für Snapshot-Filterung).
 */
function processPreRace(ratings, entries) {
    const active   = new Set();
    const finishers = entries
        .filter(e => !e.dnf && e.pos != null)
        .sort((a, b) => a.pos - b.pos);

    const dnfEntries = entries.filter(e => e.dnf);

    // Alle Teilnehmer als aktiv markieren + initialisieren
    for (const e of entries) {
        getElo(ratings, e.driverSlug);
        active.add(e.driverSlug);
    }

    // Finisher vs Finisher: alle N*(N-1)/2 Duelle
    for (let i = 0; i < finishers.length; i++) {
        for (let j = i + 1; j < finishers.length; j++) {
            applyRaceDuel(ratings, finishers[i].driverSlug, finishers[j].driverSlug, K_PRE50, K_PRE50);
        }
    }

    // DNF-Malus: nur driver/collision bekommen Elo-Abzug vs jeden Finisher
    // Finisher bekommt K=0 (kein unfairer Bonus für "Gegner ist ausgefallen")
    for (const dnf of dnfEntries) {
        const reason = dnf.dnfReason;
        if (reason === 'tech' || reason === 'dsq' || reason === 'unknown' || !reason) continue;
        const k = reason === 'collision' ? K_PRE50 * 0.5 : K_PRE50;
        for (const fin of finishers) {
            applyRaceDuel(ratings, fin.driverSlug, dnf.driverSlug, 0, k);
        }
    }

    return active;
}

/**
 * Verarbeitet ein F1DB-Rennen (1950+).
 * entries: Arrays aus F1DB_RESULTS – Felder:
 *   [0] raceId, [1] pos, [2] posText, [3] slug, [4] team,
 *   [5] laps, [6] time, [7] gap, [8] ?, [9] status, [10] points, [11] grid
 * Gibt Set der aktiven Fahrer zurück (für Snapshot-Filterung).
 */
function processF1DBRace(ratings, entries, raceId = 0) {
    const active    = new Set();
    const finishers = [];
    const dnfs      = [];

    for (const e of entries) {
        const posText = e[2];
        const slug    = e[3];
        const pos     = e[1];
        const status  = e[9] || '';

        // DNQ / DNPQ → nicht am Rennen teilgenommen → weder aktiv noch ELO
        if (posText === 'DNPQ' || posText === 'DNQ') continue;

        // DSQ / DNS: am Wochenende dabei → initialisieren + als aktiv markieren, aber kein ELO-Update
        if (posText === 'DSQ' || posText === 'DNS' || posText === 'EX') {
            getElo(ratings, slug);
            active.add(slug);
            continue;
        }

        // Aktiv initialisieren
        getElo(ratings, slug);
        active.add(slug);

        if (pos !== null && !isNaN(parseInt(posText))) {
            finishers.push({ slug, pos });
        } else {
            // DNF oder unbekannter Status
            const dnfType = classifyDnf(status) || 'unknown';
            const laps    = parseInt(e[5]) || 0;
            dnfs.push({ slug, dnfType, laps });
        }
    }

    finishers.sort((a, b) => a.pos - b.pos);

    // Finisher vs Finisher
    for (let i = 0; i < finishers.length; i++) {
        for (let j = i + 1; j < finishers.length; j++) {
            applyRaceDuel(ratings, finishers[i].slug, finishers[j].slug, K_RACE, K_RACE);
        }
    }

    // DNF-Malus
    // Massenkarambolage: K für collision-DNFs geteilt durch Anzahl der Collision-DNFs
    // auf derselben Runde – verschiedene Unfälle in verschiedenen Runden bleiben unabhängig.
    const collisionPerLap = {};
    for (const dnf of dnfs) {
        if (dnf.dnfType === 'collision') {
            collisionPerLap[dnf.laps] = (collisionPerLap[dnf.laps] || 0) + 1;
        }
    }
    const isWetRace = WET_RACE_IDS.has(raceId);
    for (const dnf of dnfs) {
        if (dnf.dnfType === 'tech' || dnf.dnfType === 'dsq' || dnf.dnfType === 'unknown') continue;
        // Regen: fahrerbedingter Ausfall (Spin, Kollision) ist ELO-neutral –
        // Streckenbedingungen sind mitverantwortlich, kein reiner Fahrerfehler.
        if (isWetRace && (dnf.dnfType === 'driver' || dnf.dnfType === 'collision')) continue;
        let k;
        if (dnf.dnfType === 'collision') {
            k = (K_RACE * 0.5) / Math.max(1, collisionPerLap[dnf.laps] || 1);
        } else {
            k = K_RACE; // driver (Spin, Spun off)
        }
        for (const fin of finishers) {
            applyRaceDuel(ratings, fin.slug, dnf.slug, 0, k);
        }
    }

    return active;
}

/**
 * Verarbeitet Quali-Teamduelle für ein Rennen.
 * qualiEntries: [[pos, slug, time_ms, ...], ...]
 * teamMap:      { driverSlug → teamId }
 */
function processQualiRace(ratings, qualiEntries, teamMap) {
    const byTeam = {};
    for (const entry of qualiEntries) {
        const pos  = entry[0];
        const slug = entry[1];
        const team = teamMap[slug];
        if (!team) continue;
        if (!byTeam[team]) byTeam[team] = [];
        byTeam[team].push({ pos, slug });
    }

    for (const drivers of Object.values(byTeam)) {
        if (drivers.length < 2) continue;
        drivers.sort((a, b) => a.pos - b.pos);
        // Nur bestes vs. schlechtestes (bei 3+ Fahrern pro Team in alten Saisons)
        const faster = drivers[0].slug;
        const slower = drivers[drivers.length - 1].slug;
        applyQualiDuel(ratings, faster, slower);
    }
}

// ── Daten laden ────────────────────────────────────────────────────────────

function loadF1DBResults() {
    console.log('  Lade F1DB_RESULTS aus HTML …');
    const html = fs.readFileSync(HTML_FILE, 'utf8');
    const line = html.split('\n').find(l => l.includes('const F1DB_RESULTS'));
    if (!line) throw new Error('F1DB_RESULTS nicht in index.html gefunden');
    const json = line.replace(/^\s*const F1DB_RESULTS\s*=\s*/, '').replace(/;\s*$/, '');
    return JSON.parse(json);
}

function loadQualiData() {
    console.log('  Lade F1DB_QUALIFYING …');
    const src = fs.readFileSync(QUALI_JS, 'utf8');
    const json = src.replace(/^\s*const F1DB_QUALIFYING\s*=\s*/, '').replace(/;\s*$/, '');
    return JSON.parse(json);
}

function resolveAlias(slug) {
    let s = slug, seen = new Set();
    while (SLUG_ALIASES[s] && !seen.has(s)) { seen.add(s); s = SLUG_ALIASES[s]; }
    return s;
}

function resolveAliases(entries) {
    return entries.map(e => ({ ...e, driverSlug: resolveAlias(e.driverSlug) }));
}

function loadPre1950() {
    console.log('  Lade Pre-1950-Daten …');
    const allRaces = [];

    for (let y = 1930; y <= 1940; y++) {
        const fp = path.join(PRE50_DIR, `full-${y}.json`);
        if (!fs.existsSync(fp)) continue;
        const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
        for (const race of data.races) {
            if (!race.entries || race.entries.length === 0) continue;
            allRaces.push({ year: y, name: race.name, entries: resolveAliases(race.entries) });
        }
    }

    for (let y = 1946; y <= 1949; y++) {
        const fp = path.join(PRE50_DIR, `silhouet-${y}.json`);
        if (!fs.existsSync(fp)) continue;
        const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
        for (const race of data.races) {
            if (!race.entries || race.entries.length === 0) continue;
            allRaces.push({ year: y, name: race.name, entries: resolveAliases(race.entries) });
        }
    }

    // Temporada: Südamerika 1946–1952 (teamdan.com)
    for (let y = 1946; y <= 1952; y++) {
        const fp = path.join(PRE50_DIR, `temporada-${y}.json`);
        if (!fs.existsSync(fp)) continue;
        const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
        for (const race of data.races) {
            if (!race.entries || race.entries.length === 0) continue;
            allRaces.push({ year: y, name: race.name, entries: resolveAliases(race.entries) });
        }
    }

    // AAA/USAC Championship 1930–1960 (champcarstats.com)
    // Indy 500 1950–1960 überspringen → bereits in F1DB enthalten (Doppelzählung vermeiden)
    for (let y = 1930; y <= 1960; y++) {
        const fp = path.join(PRE50_DIR, `champcar-${y}.json`);
        if (!fs.existsSync(fp)) continue;
        const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
        for (const race of data.races) {
            if (!race.entries || race.entries.length === 0) continue;
            if (race.isIndy && y >= 1950) continue; // F1DB hat Indy 500 1950–1960
            allRaces.push({ year: y, name: race.name, entries: resolveAliases(race.entries) });
        }
    }

    return allRaces;
}

// ── Hauptprogramm ──────────────────────────────────────────────────────────

function main() {
    console.log('F1 Elo-Berechnung 1930–2024\n');

    const f1dbResults = loadF1DBResults();
    const qualiData   = loadQualiData();
    const pre1950     = loadPre1950();

    // Laufender Elo-Zustand: { slug: { race: float, quali: float } }
    const ratings = {};

    // Jahres-Snapshots: { slug: { year: { race_elo, quali_elo, driver_elo } } }
    const snapshots = {};

    // Nur Fahrer speichern die in diesem Jahr tatsächlich aktiv waren (verhindert
    // carry-forward für verstorbene/zurückgetretene Fahrer).
    function saveSnapshot(year, activeDrivers) {
        for (const slug of activeDrivers) {
            const r = ratings[slug];
            if (!r) continue;
            if (!snapshots[slug]) snapshots[slug] = {};
            snapshots[slug][String(year)] = {
                race_elo:   Math.round(r.race),
                quali_elo:  Math.round(r.quali),
                driver_elo: Math.round(r.race * 0.5 + r.quali * 0.5),
            };
        }
    }

    // ── Phase 0: Pre-1950 ─────────────────────────────────────────────────
    console.log('\nPhase 0: Pre-1950 …');

    const pre50ByYear = {};
    for (const race of pre1950) {
        if (!pre50ByYear[race.year]) pre50ByYear[race.year] = [];
        pre50ByYear[race.year].push(race);
    }

    let totalPre50Races = 0;
    for (const year of Object.keys(pre50ByYear).map(Number).sort((a, b) => a - b)) {
        const activeThisYear = new Set();
        for (const race of pre50ByYear[year]) {
            const active = processPreRace(ratings, race.entries);
            active.forEach(s => activeThisYear.add(s));
        }
        saveSnapshot(year, activeThisYear);
        totalPre50Races += pre50ByYear[year].length;
        console.log(`  ${year}: ${pre50ByYear[year].length} Rennen, ${Object.keys(ratings).length} Fahrer`);
    }
    console.log(`  → ${totalPre50Races} Rennen gesamt`);

    // ── Phase 1: 1950+ ────────────────────────────────────────────────────
    console.log('\nPhase 1: 1950+ …');

    // raceId → { slug: team } für Quali-Zuordnung
    const raceTeamMaps = {};
    for (const rounds of Object.values(f1dbResults)) {
        for (const [raceId, , entries] of rounds) {
            const m = {};
            for (const e of entries) m[e[3]] = e[4];
            raceTeamMaps[String(raceId)] = m;
        }
    }

    let totalRaces = 0;
    for (const year of Object.keys(f1dbResults).map(Number).sort((a, b) => a - b)) {
        const rounds         = f1dbResults[String(year)];
        const activeThisYear = new Set();
        for (const [raceId, , entries] of rounds) {
            const active = processF1DBRace(ratings, entries, raceId);
            active.forEach(s => activeThisYear.add(s));

            const qualiEntries = qualiData[String(raceId)];
            if (qualiEntries && qualiEntries.length) {
                processQualiRace(ratings, qualiEntries, raceTeamMaps[String(raceId)] || {});
                // Quali-Teilnehmer ebenfalls als aktiv markieren
                for (const entry of qualiEntries) activeThisYear.add(entry[1]);
            }
            totalRaces++;
        }
        saveSnapshot(year, activeThisYear);
        process.stdout.write(`  ${year}: ${rounds.length} Rennen\r`);
    }
    console.log(`\n  → ${totalRaces} Rennen gesamt`);

    // ── Output ────────────────────────────────────────────────────────────
    console.log('\nSpeichere elo_ratings.json …');
    fs.writeFileSync(OUT_FILE, JSON.stringify(snapshots, null, 2), 'utf8');

    const driverCount = Object.keys(snapshots).length;
    console.log(`✓ Fertig: ${driverCount} Fahrer gespeichert\n`);

    // Top 10 letztes verfügbares Jahr
    const lastYear = Math.max(...Object.keys(f1dbResults).map(Number));
    const ranked = Object.entries(snapshots)
        .filter(([, s]) => s[String(lastYear)])
        .sort((a, b) => b[1][String(lastYear)].driver_elo - a[1][String(lastYear)].driver_elo)
        .slice(0, 15);

    console.log(`Top 15 Fahrer ${lastYear} (nach combined driver_elo):`);
    for (const [slug, s] of ranked) {
        const e = s[String(lastYear)];
        console.log(
            `  ${slug.padEnd(32)} race=${String(e.race_elo).padStart(4)}  quali=${String(e.quali_elo).padStart(4)}  combined=${e.driver_elo}`
        );
    }
}

main();
