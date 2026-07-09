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

const BASE    = 'http://www.goldenera.fi/';
const OUT_DIR = path.join(__dirname, 'pre1950-data');
const DELAY   = 1500; // ms zwischen Requests

// Jahre mit vorhandenen Index-Seiten
const YEARS = [1930];

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
                await sleep(3000);
            } else {
                console.log(`  ✗ Aufgegeben: ${url.split('/').pop()} (${e.message})`);
                return null;
            }
        }
    }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Jahres-Indexseite parsen → Liste {pageUrl, anchor, date, name} ───────
function parseYearIndex(html, year) {
    const $ = cheerio.load(html);
    const races = [];
    $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        // Nur Links zu Detail-Rennseiten: gp30XX.htm oder gp3001.htm#N
        const m = href.match(/^(gp\d+\.htm)(#.+)?$/i);
        if (!m) return;
        const pageFile = m[1];
        const anchor   = m[2] ? m[2].slice(1) : null; // ohne '#'

        // Jahr-Prefix prüfen (z.B. gp30 für 1930, gp40 für 1940)
        const yy = String(year).slice(2);
        if (!pageFile.startsWith('gp' + yy) && !pageFile.startsWith('gp' + year)) return;

        // Nur Rennen-Links (nicht Foreword/Intro/SL)
        if (!anchor || /^SL$|^intro$|^fore$/i.test(anchor)) return;

        const date = $(el).closest('tr').find('td').first().text().trim();
        const name = $(el).text().replace(/\s+/g, ' ').trim();

        races.push({ pageUrl: BASE + pageFile, anchor, date, name });
    });
    return races;
}

// ── Einzelne Rennseite parsen → alle Rennen mit Ergebnissen ──────────────
function parseRacePage(html, targetAnchor) {
    const $ = cheerio.load(html);

    // Alle Anker auf der Seite finden → Rennabschnitte
    const anchors = [];
    $('a[name]').each((_, el) => { anchors.push($(el).attr('name')); });

    // Positionen der Anker im HTML-String (für Abschnitt-Splitting)
    // Stattdessen: wir suchen table.res die NACH dem Ziel-Anker und VOR dem nächsten Anker kommen.
    // Einfacher Ansatz: alle table.res sammeln und per Anker-Position zuordnen.

    const results = [];

    // Alle Renntabellen (class=res) der Seite durchlaufen
    $('table.res, TABLE.res, table[class="res"], TABLE[CLASS="res"]').each((tableIdx, table) => {
        // Anker finden der VOR dieser Tabelle liegt → Rennnummer
        let raceAnchor = null;
        let prev = $(table).prev();
        let depth = 0;
        while (prev.length && depth < 30) {
            const name = prev.find('a[name]').last().attr('name') ||
                         (prev.is('a[name]') ? prev.attr('name') : null);
            if (name) { raceAnchor = name; break; }
            prev = prev.prev();
            depth++;
        }
        // Fallback: parent traversal
        if (!raceAnchor) {
            $(table).parents().each((_, p) => {
                const name = $(p).find('a[name]').first().attr('name');
                if (name && !raceAnchor) raceAnchor = name;
            });
        }

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
    let totalRaces = 0;

    for (const year of YEARS) {
        const yy = String(year).slice(2);
        const indexUrl = `${BASE}gp${yy}.htm`;
        console.log(`\n── ${year} ──  ${indexUrl}`);

        const indexHtml = await fetch(indexUrl);
        if (!indexHtml) { console.log('  ✗ nicht gefunden'); continue; }
        await sleep(DELAY);

        const raceLinks = parseYearIndex(indexHtml, year);
        console.log(`  ${raceLinks.length} Rennen-Links gefunden`);

        // Unique Seiten-URLs sammeln & laden
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
                // Kein Ergebnis für diesen Anker → Seite hat vielleicht andere Struktur
                yearRaces.push({
                    date:    link.date,
                    name:    link.name,
                    anchor:  link.anchor,
                    pageUrl: link.pageUrl,
                    entries: [],
                    note:    'no res table found for anchor'
                });
                continue;
            }

            // Erste table.res die zu diesem Anker gehört
            const race = parsed[0];
            yearRaces.push({
                date:    link.date,
                name:    link.name,
                anchor:  link.anchor,
                entries: race.entries,
            });
            totalRaces++;
        }

        // Pro Jahr speichern
        const outPath = path.join(OUT_DIR, `full-${year}.json`);
        fs.writeFileSync(outPath, JSON.stringify({
            year,
            source:  'goldenera.fi (full results)',
            scraped: new Date().toISOString(),
            races:   yearRaces
        }, null, 2), 'utf8');

        const withResults = yearRaces.filter(r => r.entries.length > 0).length;
        console.log(`  ✓ ${yearRaces.length} Rennen, ${withResults} mit Ergebnissen → full-${year}.json`);
    }

    console.log(`\n✓ Fertig: ${YEARS.length} Jahre, ${totalRaces} Rennen mit Ergebnissen`);
}

main().catch(console.error);
