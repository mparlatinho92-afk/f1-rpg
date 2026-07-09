/**
 * scrape-goldenera-full.js
 * Scrapt goldenera.fi vollständige Rennergebnisse 1930–1940.
 * Nutzt table.res (Pos./Driver/Time/Status) statt nur Sieger.
 *
 * Ausführen: node tests/scrape-goldenera-full.js
 * Output:    tests/pre1950-data/full-YYYY.json
 */

const https   = require('https');
const fs      = require('fs');
const path    = require('path');
const cheerio = require('cheerio');

const BASE      = 'https://www.goldenera.fi/';
const RACES_URL = BASE + 'races.htm';
const OUT_DIR   = path.join(__dirname, 'pre1950-data');
const DELAY     = 2500; // ms zwischen Requests

const YEARS = [1922,1923,1924,1925,1926,1927,1928,1929,
               1930,1931,1932,1933,1934,1935,1936,1937,1938,1939,1940];

// ── Alias-Map (Kurzschreibweise → kanonischer Slug) ──────────────────────
const SLUG_ALIASES = {
    'l-chiron':       'louis-chiron',
    'a-varzi':        'achille-varzi',
    'fagioli':        'luigi-fagioli',
    'r-caracciola':   'rudolf-caracciola',
    'b-bira':         'prince-bira',
    't-nuvolari':     'tazio-nuvolari',
    'n-nuvolari':     'tazio-nuvolari',
    'g-farina':       'giuseppe-farina',
    'l-villoresi':    'luigi-villoresi',
    'j-fangio':       'juan-manuel-fangio',
    'j-m-fangio':     'juan-manuel-fangio',
    'a-ascari':       'alberto-ascari',
    'p-etancelin':    'philippe-etancelin',
    'r-sommer':       'raymond-sommer',
    'j-wimille':      'jean-pierre-wimille',
    'j-p-wimille':    'jean-pierre-wimille',
    'f-gonzalez':     'froilan-gonzalez',
};

function slugify(name) {
    const s = name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    return SLUG_ALIASES[s] || s;
}

// ── DNF-Klassifikation aus Time/Status-Text ──────────────────────────────
function classifyDnf(status) {
    if (!status) return 'unknown';
    const s = status.toLowerCase();
    if (/crash|collision|accident|wall|guardrail|barrier|hit|struck/.test(s)) return 'collision';
    if (/spin|skid|mistake|error/.test(s))       return 'driver';
    if (/engine|motor|oil|fuel|fire|gearbox|transmission|clutch|broken|wheel|tyre|tire|suspension|overheating|water|radiator|magneto|supercharger|compressor/.test(s)) return 'tech';
    return 'unknown'; // Grund nicht erkennbar
}

// ── HTTP fetch ────────────────────────────────────────────────────────────
function fetchOnce(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url.replace('http://', 'https://'),
            { headers: { 'User-Agent': 'f1-rpg-research/1.0 (private)' } },
            res => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return fetchOnce(res.headers.location).then(resolve).catch(reject);
                }
                if (res.statusCode === 404) return resolve(null);
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => resolve(data));
            });
        req.on('error', reject);
        req.setTimeout(20000, () => { req.destroy(); reject(new Error('timeout')); });
    });
}

async function fetch(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fetchOnce(url);
        } catch (e) {
            if (i < retries - 1) {
                console.log(`  ⟳ Retry ${i+1}/${retries-1} für ${url.split('/').pop()} …`);
                await sleep(6000);
            } else {
                console.log(`  ✗ Aufgegeben: ${url.split('/').pop()} (${e.message})`);
                return null;
            }
        }
    }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── races.htm parsen → Map: year → [{pageUrl, anchor, raceName, raceType}] ─
function parseRacesIndex(html) {
    const $ = cheerio.load(html);
    const byYear = {};

    // Spaltenheader lesen → Index der Jahres-Spalten (Text "22"–"40")
    const headers = [];
    $('table.lopp tr').first().find('td, th').each((i, el) => {
        headers.push($(el).text().trim());
    });

    $('table.lopp tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 3) return;
        const raceName = $(cells[0]).text().replace(/\s+/g, ' ').trim();
        const raceType = $(cells[1]).text().replace(/\s+/g, ' ').trim();

        cells.each((colIdx, td) => {
            const a = $(td).find('a[href]');
            if (!a.length) return;
            const linkText = a.text().trim();
            // Jahres-Zahl: zweistellig (22–40) oder vierstellig
            const yy = linkText.match(/^\d{2}$/) ? linkText : null;
            if (!yy) return;
            const year = 1900 + parseInt(yy);
            if (!YEARS.includes(year)) return;

            const href = a.attr('href') || '';
            const m    = href.match(/^(gp\d+\.htm)#(.+)$/i);
            if (!m) return;

            if (!byYear[year]) byYear[year] = [];
            byYear[year].push({
                pageUrl:   BASE + m[1],
                anchor:    m[2],
                raceName,
                raceType,
            });
        });
    });

    return byYear;
}

// ── Einzelne Rennseite parsen → alle Rennen mit Ergebnissen ──────────────
function parseRacePage(html, targetAnchor) {
    const $ = cheerio.load(html);

    // Seite linear durchlaufen: letzten gesehenen Anker vor jeder table.res merken.
    // Das ist robuster als rückwärts tasten – zwischen Anker und Tabelle können
    // 40+ Elemente (table.ent, table.mr, table.grid, Text) liegen.
    const anchorOf = new Map(); // Element-Index → letzter Anker
    let currentAnchor = null;
    $('body *').each((_, el) => {
        const name = $(el).attr('name');
        if (name && el.tagName?.toLowerCase() === 'a') currentAnchor = name;
        const cls = ($(el).attr('class') || '').toLowerCase().trim();
        if (el.tagName?.toLowerCase() === 'table' && cls === 'res') {
            anchorOf.set(el, currentAnchor);
        }
    });

    const results = [];

    // Alle Renntabellen (class=res) der Seite durchlaufen
    $('table').each((tableIdx, table) => {
        const cls = ($(table).attr('class') || '').toLowerCase().trim();
        if (cls !== 'res') return;

        const raceAnchor = anchorOf.get(table) || null;

        // Nur die gewünschte Tabelle verarbeiten (wenn Anker bekannt)
        if (targetAnchor && raceAnchor !== targetAnchor) return;

        // Ergebniszeilen parsen
        const entries = [];
        $(table).find('tr').each((_, row) => {
            const tds = $(row).find('td');
            if (tds.length < 3) return;
            const posRaw = $(tds[0]).text().trim();
            if (/^pos/i.test(posRaw) || posRaw === '') return; // Header

            const driverRaw = $(tds[2]).text().replace(/\s+/g, ' ').trim();
            if (!driverRaw || driverRaw === 'Driver') return;

            const pos     = posRaw.replace('.', '').trim(); // "1." → "1"
            const laps    = tds.length >= 9 ? $(tds[8]).text().trim() : '';
            const status  = tds.length >= 10 ? $(tds[9]).text().replace(/\s+/g, ' ').trim() : '';
            const isDnf   = /^DNF|DNQ|DNS|RET/i.test(pos);

            // Geteilte Fahrten: "Fahrer A/Fahrer B"
            const driverNames = driverRaw.split('/').map(d => d.trim()).filter(Boolean);

            driverNames.forEach(driverName => {
                entries.push({
                    pos:        isDnf ? null : parseInt(pos) || null,
                    dnf:        isDnf,
                    dnfReason:  isDnf ? classifyDnf(status) : null,
                    status:     isDnf ? status : null,
                    driver:     driverName,
                    driverSlug: slugify(driverName),
                    laps:       parseInt(laps) || null,
                });
            });
        });

        if (entries.length > 0) {
            results.push({ tableIdx, raceAnchor, entries });
        }
    });

    return results;
}

// ── Hauptprogramm ─────────────────────────────────────────────────────────
async function main() {
    const pageCache = {}; // URL → HTML (Seiten werden nur 1× geladen)
    let totalRaces  = 0;

    // ── Schritt 1: races.htm einmalig laden & parsen ──────────────────────
    console.log(`Lade races.htm …`);
    const racesHtml = await fetch(RACES_URL);
    if (!racesHtml) { console.error('races.htm nicht erreichbar'); process.exit(1); }
    await sleep(DELAY);

    const racesByYear = parseRacesIndex(racesHtml);
    for (const y of YEARS) {
        console.log(`  ${y}: ${(racesByYear[y] || []).length} Rennen mit Ergebnissen laut races.htm`);
    }

    // ── Schritt 2: Pro Jahr Seiten laden & Ergebnisse parsen ─────────────
    for (const year of YEARS) {
        const raceLinks = racesByYear[year] || [];
        if (raceLinks.length === 0) {
            console.log(`\n── ${year} ── keine Rennen in races.htm`);
            continue;
        }
        console.log(`\n── ${year} ── ${raceLinks.length} Rennen`);

        // Unique Seiten-URLs laden
        const uniquePages = [...new Set(raceLinks.map(r => r.pageUrl))];
        for (const url of uniquePages) {
            if (!pageCache[url]) {
                process.stdout.write(`  Lade ${path.basename(url)} … `);
                const html = await fetch(url);
                pageCache[url] = html || '';
                console.log(html ? `${html.length} B` : 'FEHLER');
                await sleep(DELAY);
            }
        }

        // Rennen parsen
        const yearRaces = [];
        for (const link of raceLinks) {
            const html = pageCache[link.pageUrl];
            if (!html) continue;

            const parsed = parseRacePage(html, link.anchor);
            if (parsed.length === 0) {
                yearRaces.push({
                    name:     link.raceName,
                    type:     link.raceType,
                    anchor:   link.anchor,
                    pageUrl:  link.pageUrl,
                    entries:  [],
                    note:     'no res table found for anchor',
                });
                continue;
            }

            yearRaces.push({
                name:    link.raceName,
                type:    link.raceType,
                anchor:  link.anchor,
                entries: parsed[0].entries,
            });
            totalRaces++;
        }

        const outPath = path.join(OUT_DIR, `full-${year}.json`);
        fs.writeFileSync(outPath, JSON.stringify({
            year,
            source:  'goldenera.fi/races.htm (full results)',
            scraped: new Date().toISOString(),
            races:   yearRaces,
        }, null, 2), 'utf8');

        const withResults = yearRaces.filter(r => r.entries.length > 0).length;
        console.log(`  ✓ ${withResults}/${yearRaces.length} mit Ergebnissen → full-${year}.json`);
    }

    console.log(`\n✓ Fertig: ${totalRaces} Rennen mit Ergebnissen`);
}

main().catch(console.error);
