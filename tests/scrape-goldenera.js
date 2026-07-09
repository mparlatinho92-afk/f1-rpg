/**
 * scrape-goldenera.js
 * Scrapt goldenera.fi GP-Siegerlisten 1919–1949 und speichert
 * die Daten als JSON in tests/pre1950-data/europe-YYYY.json
 *
 * Datenstruktur pro Rennen: Nur der Sieger ist bekannt (keine vollständigen Grids).
 * Für das Elo-System: Sieg = Sieger schlug "das Feld" dieses Jahres.
 *
 * Ausführen: node tests/scrape-goldenera.js
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');
const cheerio = require('cheerio');

const URLS = [
    { url: 'https://www.goldenera.fi/gpw2.htm', label: 'Part2 (1919-1933)' },
    { url: 'https://www.goldenera.fi/gpw3.htm', label: 'Part3 (1934-1949)' },
];

const OUT_DIR = path.join(__dirname, 'pre1950-data');

// Pause zwischen Requests (höflich)
const DELAY_MS = 2000;

// ── Alias-Map: Kurzform-Namen → kanonischer Slug ───────────────────────────
// goldenera.fi schreibt manchmal "L. Chiron" statt "Louis Chiron"
const SLUG_ALIASES = {
    'l-chiron':         'louis-chiron',
    'a-varzi':          'achille-varzi',
    'fagioli':          'luigi-fagioli',
    'r-caracciola':     'rudolf-caracciola',
    'b-bira':           'prince-bira',          // B. Bira = Prince Bira
    't-nuvolari':       'tazio-nuvolari',
    'n-nuvolari':       'tazio-nuvolari',
    'g-farina':         'giuseppe-farina',
    'l-villoresi':      'luigi-villoresi',
    'j-fangio':         'juan-manuel-fangio',
    'j-m-fangio':       'juan-manuel-fangio',
    'a-ascari':         'alberto-ascari',
    'p-etancelin':      'philippe-etancelin',
    'r-sommer':         'raymond-sommer',
    'j-wimille':        'jean-pierre-wimille',
    'j-p-wimille':      'jean-pierre-wimille',
    'f-gonzalez':       'froilan-gonzalez',
    'j-m-hawthorn':     'mike-hawthorn',
};

// ── Slugify Fahrername für Elo-Keys ────────────────────────────────────────
function slugify(name) {
    const slug = name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Akzente weg
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    return SLUG_ALIASES[slug] || slug;
}

// ── HTTP-Fetch (kein axios nötig, nur https) ────────────────────────────────
function fetchPage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'f1-rpg-research/1.0 (private project)' } }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ── Seite parsen ────────────────────────────────────────────────────────────
function parsePage(html) {
    const $ = cheerio.load(html, { decodeEntities: true });
    const byYear = {}; // { 1934: [ {date, event, circuit, driver, driverSlug, car, isMajor}, ... ] }

    let currentYear = null;

    // Alle TABLE-Elemente der Seite chronologisch durchlaufen
    $('table').each((_, table) => {
        // Jahr-Header erkennen: TR mit BGCOLOR=LIGHTGREEN und COLSPAN=5
        const yearRow = $(table).find('tr[bgcolor="LIGHTGREEN"], tr[bgcolor="lightgreen"]').first();
        if (yearRow.length) {
            const rawText = yearRow.find('b').first().text().trim();
            const yearMatch = rawText.match(/\d{4}/);
            if (yearMatch) {
                currentYear = parseInt(yearMatch[0]);
                if (!byYear[currentYear]) byYear[currentYear] = [];
            }
            return; // nächste table
        }

        // Rennen-Daten: TR ohne colspan, mit 5 TD-Zellen
        if (!currentYear) return;

        $(table).find('tr').each((_, row) => {
            const tds = $(row).find('td');
            if (tds.length < 4) return; // Leerzeilen / Header überspringen

            const date    = $(tds[0]).text().replace(/\s+/g, ' ').trim();
            const event   = $(tds[1]).text().replace(/\s+/g, ' ').trim();
            const circuit = $(tds[2]).text().replace(/\s+/g, ' ').trim();
            const driver  = $(tds[3]).text().replace(/\s+/g, ' ').trim();
            const car     = tds.length >= 5 ? $(tds[4]).text().replace(/\s+/g, ' ').trim() : '';

            // Leerzeilen / Header-Duplikate überspringen
            if (!driver || driver === 'Driver' || driver === '\u00a0') return;
            if (!event  || event  === 'Event')  return;

            // Wichtige Rennen: BGCOLOR=LIGHTBLUE auf TR oder <B> im Event
            const rowBg   = ($(row).attr('bgcolor') || '').toLowerCase();
            const eventHasBold = $(tds[1]).find('b').length > 0;
            const isMajor = rowBg === 'lightblue' || eventHasBold;

            // Geteilte Fahrten ("Fahrer A/Fahrer B") aufsplitten
            const driverNames = driver.split('/').map(d => d.trim()).filter(Boolean);

            driverNames.forEach(driverName => {
                byYear[currentYear].push({
                    date,
                    event,
                    circuit,
                    driver:     driverName,
                    driverSlug: slugify(driverName),
                    car,
                    isMajor,
                    result: 1  // goldenera.fi listet nur Sieger → immer Platz 1
                });
            });
        });
    });

    return byYear;
}

// ── Hauptprogramm ───────────────────────────────────────────────────────────
async function main() {
    const allByYear = {};

    for (const { url, label } of URLS) {
        console.log(`\nFetching ${label} …`);
        let html;
        try {
            html = await fetchPage(url);
        } catch (e) {
            console.error(`  ✗ Fehler: ${e.message}`);
            continue;
        }
        console.log(`  ${html.length} Bytes empfangen`);

        const parsed = parsePage(html);
        for (const [year, races] of Object.entries(parsed)) {
            if (!allByYear[year]) allByYear[year] = [];
            allByYear[year].push(...races);
        }

        await sleep(DELAY_MS);
    }

    // Pro Jahr eine JSON-Datei speichern
    let totalRaces = 0;
    const years = Object.keys(allByYear).map(Number).sort((a, b) => a - b);

    for (const year of years) {
        const races = allByYear[year];
        const outPath = path.join(OUT_DIR, `europe-${year}.json`);
        fs.writeFileSync(outPath, JSON.stringify({
            year,
            source: 'goldenera.fi',
            note: 'Only race winners – no full grids. result=1 means winner.',
            races
        }, null, 2), 'utf8');
        totalRaces += races.length;
        console.log(`  ${year}: ${races.length} Rennen → ${path.basename(outPath)}`);
    }

    // Zusammenfassung
    const summary = {
        scraped: new Date().toISOString(),
        years: years,
        totalRaces,
        uniqueDrivers: [...new Set(years.flatMap(y => allByYear[y].map(r => r.driverSlug)))].sort()
    };
    fs.writeFileSync(path.join(OUT_DIR, 'europe-summary.json'), JSON.stringify(summary, null, 2), 'utf8');

    console.log(`\n✓ Fertig: ${years.length} Jahre, ${totalRaces} Rennen gesamt`);
    console.log(`  Einzigartige Fahrer: ${summary.uniqueDrivers.length}`);
    console.log(`  Zusammenfassung: tests/pre1950-data/europe-summary.json`);
}

main().catch(console.error);
