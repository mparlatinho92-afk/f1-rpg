/**
 * scrape-champcar.js
 * Scrapt champcarstats.com – AAA Championship 1930–1955, USAC 1956–1960.
 * Vollständige Rennergebnisse inkl. DNFs und DNQs.
 *
 * Ausführen: node tests/scrape-champcar.js
 * Output:    tests/pre1950-data/champcar-YYYY.json
 *
 * Hinweis: Indianapolis 500 1950–1960 ist bereits in F1DB enthalten.
 * Diese Rennen werden als isIndy:true markiert und in calculate-elo.js
 * für 1950–1960 übersprungen (Doppelzählung vermeiden).
 */

'use strict';

const https = require('https');
const fs    = require('fs');
const path  = require('path');
const cheerio = require('cheerio');

const BASE    = 'http://www.champcarstats.com/';
const OUT_DIR = path.join(__dirname, 'pre1950-data');
const DELAY   = 2000;

const YEARS = [];
for (let y = 1930; y <= 1960; y++) YEARS.push(y);

// ── Slug-Normalisierung ────────────────────────────────────────────────────
// Amerikanische Fahrer haben eigene Schreibvarianten – wird nach dem Scrape
// per dedup-check.js bereinigt. Hier nur die offensichtlichsten Fixes.
const SLUG_ALIASES = {
    'al-miller':         'al-miller',        // Platzhalter, mehrere Al Millers
    'floyd-roberts':     'floyd-roberts',
};

function slugify(name) {
    return name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

// ── HTTP fetch (latin1 für windows-1252-Seiten) ────────────────────────────
function fetchOnce(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url.replace('http://', 'https://'),
            { headers: { 'User-Agent': 'f1-rpg-research/1.0 (private)' } },
            res => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return fetchOnce(res.headers.location).then(resolve).catch(reject);
                }
                if (res.statusCode === 404) return resolve(null);
                const chunks = [];
                res.on('data', c => chunks.push(Buffer.from(c, 'binary')));
                res.on('end', () => resolve(Buffer.concat(chunks).toString('latin1')));
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
                console.log(`  ⟳ Retry ${i+1} für ${url.split('/').pop()} … (${e.message})`);
                await sleep(6000);
            } else {
                console.log(`  ✗ Aufgegeben: ${url.split('/').pop()} (${e.message})`);
                return null;
            }
        }
    }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Jahres-Index parsen → [{url, name, isNonChamp}] ───────────────────────
function parseYearIndex(html, year) {
    const $ = cheerio.load(html);
    const races = [];
    const seen  = new Set();

    $('a[href*="/races/"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const m    = href.match(/races\/((\d{4})([\w]*))\.htm/i);
        if (!m) return;
        if (m[2] !== String(year)) return;
        if (seen.has(href)) return;
        seen.add(href);

        const name      = $(el).text().replace(/\s+/g, ' ').trim();
        const isNonChamp = /nc$/i.test(m[3]);
        const isIndy     = /500\s*(mile|sweepstakes)/i.test(name) || /indy|indianapolis/i.test(name);

        races.push({
            url:        href.startsWith('http') ? href : BASE + href,
            raceId:     m[1],
            name,
            isNonChamp,
            isIndy,
        });
    });

    return races;
}

// ── DNF-Klassifikation aus Status-Spalte ──────────────────────────────────
function classifyDnf(status) {
    if (!status) return 'unknown';
    const s = status.toLowerCase();
    if (/crash|accident|wall|collision|contact|hit|overtur|flip|fire(?!d)/i.test(s)) return 'collision';
    if (/spin|skid/i.test(s)) return 'driver';
    if (/engine|motor|oil|fuel|gearbox|transmission|clutch|broken|wheel|tire|tyre|suspension|supercharg|magneto|rod|piston|bearing|radiator|overheat|water|mechanical/i.test(s)) return 'tech';
    return 'unknown';
}

// ── Einzelnes Rennen parsen ───────────────────────────────────────────────
function parseRacePage(html) {
    const $ = cheerio.load(html);

    // Renntitel aus Seiten-Heading
    let raceName = $('title').text().replace(/\s+/g, ' ').trim();

    // Ergebnistabelle: die erste Tabelle mit numerischen Finish-Positionen
    const entries = [];
    let inDnq = false;

    $('table').first().find('tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 3) return;

        const col0 = $(cells[0]).text().replace(/\s+/g, ' ').trim();
        const col2 = $(cells[2]).text().replace(/\s+/g, ' ').trim();

        // DNQ-Trennlinie erkennen
        if (/did not qual|DNQ|failed to qual/i.test(col0) || /did not qual|DNQ/i.test(col2)) {
            inDnq = true;
            return;
        }

        // Nur Zeilen mit numerischer Finish-Position
        const posNum = parseInt(col0);
        if (!col0 || isNaN(posNum) && !/^(DNF|RET|DNS|DSQ)/i.test(col0)) return;

        const isDnf  = isNaN(posNum);
        const driver = $(cells[2]).text().replace(/\s+/g, ' ').trim();
        if (!driver || driver.length < 2) return;

        const laps   = cells.length >= 8 ? parseInt($(cells[7]).text().trim()) || null : null;
        const status = cells.length >= 9 ? $(cells[8]).text().replace(/\s+/g, ' ').trim() : '';

        entries.push({
            pos:       isDnf ? null : posNum,
            dnf:       isDnf,
            dnq:       inDnq,
            dnfReason: isDnf ? classifyDnf(status) : null,
            status:    (isDnf || status) ? status : null,
            driver,
            driverSlug: slugify(driver),
            laps,
        });
    });

    return entries;
}

// ── Hauptprogramm ─────────────────────────────────────────────────────────
async function main() {
    let totalRaces = 0;

    for (const year of YEARS) {
        const indexUrl = `${BASE}year/${year}.htm`;
        console.log(`\n── ${year} ──`);

        const indexHtml = await fetch(indexUrl);
        if (!indexHtml) { console.log('  ✗ Index nicht gefunden'); continue; }
        await sleep(DELAY);

        const raceLinks = parseYearIndex(indexHtml, year);
        console.log(`  ${raceLinks.length} Rennen gefunden`);

        const yearRaces = [];
        for (const link of raceLinks) {
            const marker = link.isIndy ? ' [INDY]' : link.isNonChamp ? ' [NC]' : '';
            process.stdout.write(`  ${link.name.slice(0, 40)}${marker} … `);

            const html = await fetch(link.url);
            await sleep(DELAY);

            if (!html) {
                console.log('FEHLER');
                yearRaces.push({ ...link, entries: [], note: 'fetch failed' });
                continue;
            }

            const entries = parseRacePage(html);
            console.log(`${entries.length} Fahrer`);

            yearRaces.push({
                name:       link.name,
                raceId:     link.raceId,
                isNonChamp: link.isNonChamp,
                isIndy:     link.isIndy,
                entries,
            });
            if (entries.length > 0) totalRaces++;
        }

        const outPath = path.join(OUT_DIR, `champcar-${year}.json`);
        fs.writeFileSync(outPath, JSON.stringify({
            year,
            source:  'champcarstats.com',
            scraped: new Date().toISOString(),
            races:   yearRaces,
        }, null, 2), 'utf8');

        const ok = yearRaces.filter(r => r.entries?.length > 0).length;
        console.log(`  ✓ ${ok}/${yearRaces.length} mit Ergebnissen → champcar-${year}.json`);
    }

    console.log(`\n✓ Fertig: ${totalRaces} Rennen mit Ergebnissen`);
}

main().catch(console.error);
