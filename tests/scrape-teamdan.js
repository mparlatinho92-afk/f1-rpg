/**
 * scrape-teamdan.js
 * Scrapt South American Formula Libre / Temporada-Rennen 1946–1952
 * von teamdan.com (via Wayback Machine).
 *
 * Struktur: <hr> trennt Jahr-Sektionen und Renn-Sektionen.
 * Rennergebnisse stehen als Plain-Text (NICHT in <pre>) direkt im HTML.
 *
 * Ausführen: node tests/scrape-teamdan.js
 * Output:    tests/pre1950-data/temporada-YYYY.json
 */

const https  = require('https');
const fs     = require('fs');
const path   = require('path');

const URL     = 'https://web.archive.org/web/20160123172355/http://www.teamdan.com/archive/gen/temporad.html';
const OUT_DIR = path.join(__dirname, 'pre1950-data');

// ── Slug-Aliase ────────────────────────────────────────────────────────────
const SLUG_ALIASES = {
    'juan-manuel-fangio':      'juan-manuel-fangio',
    'j-m-fangio':              'juan-manuel-fangio',
    'luigi-villoresi':         'luigi-villoresi',
    'achille-varzi':           'achille-varzi',
    'alberto-ascari':          'alberto-ascari',
    'jose-froilan-gonzalez':   'jose-froilan-gonzalez',
    'froilan-gonzalez':        'jose-froilan-gonzalez',
    'nino-farina':             'nino-farina',
    'giuseppe-farina':         'nino-farina',
    'louis-chiron':            'louis-chiron',
    'raymond-sommer':          'raymond-sommer',
    'prince-bira':             'prince-bira',
    'jean-pierre-wimille':     'jean-pierre-wimille',
    'tazio-nuvolari':          'tazio-nuvolari',
    'luigi-fagioli':           'luigi-fagioli',
    'philippe-etancelin':      'philippe-etancelin',
    'emmanuel-de-graffenried': 'emmanuel-de-graffenried',
    'toulo-de-graffenried':    'emmanuel-de-graffenried',
    'oscar-galvez':            'oscar-galvez',
    'juan-galvez':             'juan-galvez',
    'clemar-bucci':            'clemar-bucci',
    'chico-landi':             'chico-landi',
};

function decodeHtml(str) {
    return str
        .replace(/&[Ee]acute;/g, 'e').replace(/&[Ee]grave;/g, 'e').replace(/&[Ee]circ;/g, 'e')
        .replace(/&[Aa]acute;/g, 'a').replace(/&[Aa]grave;/g, 'a').replace(/&[Aa]tilde;/g, 'a').replace(/&[Aa]circ;/g, 'a')
        .replace(/&[Oo]acute;/g, 'o').replace(/&[Oo]tilde;/g, 'o').replace(/&[Oo]circ;/g, 'o')
        .replace(/&[Ii]acute;/g, 'i').replace(/&iuml;/g, 'i')
        .replace(/&[Uu]acute;/g, 'u').replace(/&uuml;/g, 'u').replace(/&[Uu]circ;/g, 'u')
        .replace(/&ccedil;/g, 'c').replace(/&ntilde;/g, 'n')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&#\d+;/g, '');
}

function slugify(name) {
    const s = decodeHtml(name)
        .toLowerCase()
        .replace(/['"''"\u201c\u201d]/g, '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    return SLUG_ALIASES[s] || s;
}

function classifyDnf(reason) {
    if (!reason) return 'unknown';
    const r = reason.toLowerCase();
    if (/engine|gearbox|oil|fuel|fire|brake|wheel|tyre|tire|suspension|transmission|clutch|supercharger|magneto|radiator|overheating|valve|mechanical/.test(r)) return 'tech';
    if (/spun|spin|crash/.test(r)) return 'driver';
    if (/collision|contact/.test(r)) return 'collision';
    return 'unknown';
}

// ── Ergebnis-Text parsen ──────────────────────────────────────────────────
// Gleiche Logik wie silhouet.com – Finisher starten mit Zahl, DNF mit Leerzeichen
function parseResultText(text) {
    const entries = [];
    const lines   = text.split('\n');
    let inDnf     = false;

    for (const rawLine of lines) {
        const line = decodeHtml(rawLine.replace(/\t/g, '  '));

        if (/did not finish/i.test(line))  { inDnf = true;  continue; }
        if (/fastest lap|notes?:/i.test(line)) break;
        if (line.trim() === '')            continue;
        if (/^\s*[*<]/.test(line))         continue; // Fußnoten / HTML-Reste

        // DNS / DNA überspringen
        if (/\b(DNS|DNA)\b/.test(line) && !/^\s*\d/.test(line)) continue;

        // Finisher: beginnt mit 1–2 Ziffern
        const mFin = line.match(/^\s{0,3}(\d{1,2})\s+(.+)/);
        // DNF: mind. 3 führende Leerzeichen
        const mDnf = !mFin && inDnf && line.match(/^\s{3,}(\S.+)/);

        if (!mFin && !mDnf) continue;
        if (mFin && inDnf)  continue; // Nummerierte Zeile im DNF-Block → Randfall ignorieren

        const pos      = mFin ? parseInt(mFin[1]) : null;
        const rest     = mFin ? mFin[2] : mDnf[1];
        const isDnf    = inDnf || !mFin;

        // DNS-Kennzeichnung am Zeilenende
        if (/\bDNS\b|\bDNA\b/.test(rest)) continue;

        // Name = alles bis zum ersten doppelten Leerzeichen
        const parts    = rest.split(/\s{2,}/);
        const namePart = (parts[0] || '').trim();

        // Nationalkürzel "(XX)" aus Name entfernen – steht nicht immer am Ende
        const natM = namePart.match(/^(.*?)\s*\([A-Z?]{1,3}\)/);
        const driverName = (natM ? natM[1] : namePart).trim();
        if (!driverName || driverName === '?' || driverName.length < 2) continue;
        // Anführungszeichen-Spitznamen behalten ("Raph" → raph)

        let dnfReason = null;
        if (isDnf) {
            const last  = parts[parts.length - 1] || '';
            const slash = last.lastIndexOf('/');
            const raw   = slash >= 0 ? last.slice(slash + 1).trim() : last.trim();
            // "10 laps" allein → kein Grund bekannt
            dnfReason = /^\d+\s+laps?$/i.test(raw) ? 'unknown' : classifyDnf(raw);
        }

        entries.push({
            pos,
            dnf:        isDnf,
            dnfReason:  isDnf ? (dnfReason || 'unknown') : null,
            driver:     driverName,
            driverSlug: slugify(driverName),
        });
    }

    return entries;
}

// ── HTML → Rennen pro Jahr ─────────────────────────────────────────────────
function parsePage(html) {
    // Wayback-Toolbar + Script-Blöcke entfernen
    const body = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '');

    const byYear = {};
    let currentYear = null;

    // Nach <hr> splitten (sowohl <hr> als auch <hr width="...">)
    const sections = body.split(/<hr[^>]*>/i);

    for (const section of sections) {
        // Neues Jahr? → <a name="1946"> .. <a name="1952">
        const yearM = section.match(/<a\s+name="(194[6-9]|195[0-2])"/i);
        if (yearM) {
            currentYear = parseInt(yearM[1]);
            if (!byYear[currentYear]) byYear[currentYear] = [];
        }
        if (!currentYear) continue;

        // Renn-Sektion: muss eine <h2> enthalten
        const h2M = section.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
        if (!h2M) continue;

        const raceName = decodeHtml(h2M[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());

        // Datum aus <h3>
        const h3M  = section.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
        const meta = h3M ? decodeHtml(h3M[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()) : '';
        const dateM = meta.match(/^(\d+\s+\w+\s+\d{4})/);
        const date  = dateM ? dateM[1] : '';

        // Jahr aus Datum validieren/korrigieren (falls Sektion noch unter falschem Jahr)
        const dateYear = date.match(/(\d{4})$/);
        if (dateYear) {
            const y = parseInt(dateYear[1]);
            if (y >= 1946 && y <= 1952) {
                currentYear = y;
                if (!byYear[currentYear]) byYear[currentYear] = [];
            }
        }

        // Ergebnis-Text: alles nach </h3> (oder nach </h2> wenn kein h3) bis Ende der Sektion
        // HTML-Tags entfernen, Text übrig lassen
        const afterHeader = section
            .replace(/[\s\S]*?<\/h3>/i, '')   // alles bis Ende h3 weg
            .replace(/<[^>]+>/g, '')           // restliche Tags weg
            .replace(/\r/g, '');

        const entries = parseResultText(afterHeader);
        if (entries.length === 0) continue;

        byYear[currentYear].push({ date, name: raceName, entries });
    }

    return byYear;
}

// ── HTTP fetch ─────────────────────────────────────────────────────────────
function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url,
            { headers: { 'User-Agent': 'f1-rpg-research/1.0 (private)' } },
            res => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return fetchPage(res.headers.location).then(resolve).catch(reject);
                }
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => resolve(data));
            });
        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
    });
}

// ── Hauptprogramm ──────────────────────────────────────────────────────────
async function main() {
    console.log('Lade teamdan.com Temporada-Seite …');
    const html = await fetchPage(URL);
    console.log(`  ${html.length} Bytes empfangen`);

    const byYear = parsePage(html);
    const years  = Object.keys(byYear).map(Number).sort((a, b) => a - b);

    if (years.length === 0) {
        console.log('  ✗ Keine Rennen gefunden – HTML-Struktur prüfen');
        return;
    }

    let totalRaces = 0, totalEntries = 0;

    for (const year of years) {
        const races   = byYear[year];
        const outPath = path.join(OUT_DIR, `temporada-${year}.json`);

        fs.writeFileSync(outPath, JSON.stringify({
            year,
            source:  'teamdan.com/archive/gen/temporad.html (Wayback Machine 2016)',
            scraped: new Date().toISOString(),
            races,
        }, null, 2), 'utf8');

        const e = races.reduce((s, r) => s + r.entries.length, 0);
        totalRaces   += races.length;
        totalEntries += e;
        console.log(`  ${year}: ${races.length} Rennen, ${e} Einträge → temporada-${year}.json`);
    }

    console.log(`\n✓ Fertig: ${years.length} Jahre (${years[0]}–${years[years.length - 1]}), ${totalRaces} Rennen, ${totalEntries} Einträge`);
}

main().catch(console.error);
