/**
 * scrape-silhouet.js
 * Scrapt silhouet.com Rennergebnisse 1946–1949 (vollständige Resultate).
 * Alle Rennen eines Jahres sind auf einer einzigen Seite im <pre>-Format.
 *
 * Ausführen: node tests/scrape-silhouet.js
 * Output:    tests/pre1950-data/silhouet-YYYY.json
 */

const https   = require('https');
const fs      = require('fs');
const path    = require('path');

const BASE    = 'https://www.silhouet.com/motorsport/archive/f1/nc';
const OUT_DIR = path.join(__dirname, 'pre1950-data');
const DELAY   = 2000;
const YEARS   = [1946, 1947, 1948, 1949];

// ── Slug ─────────────────────────────────────────────────────────────────
const SLUG_ALIASES = {
    'b-bira':           'prince-bira',
    'bbira':            'prince-bira',
    'bira':             'prince-bira',
    'j-m-fangio':       'juan-manuel-fangio',
    'j-fangio':         'juan-manuel-fangio',
    'fangio':           'juan-manuel-fangio',
    'g-farina':         'giuseppe-farina',
    'l-villoresi':      'luigi-villoresi',
    'a-ascari':         'alberto-ascari',
    'l-chiron':         'louis-chiron',
    'r-sommer':         'raymond-sommer',
    'j-wimille':        'jean-pierre-wimille',
    'j-p-wimille':      'jean-pierre-wimille',
    'f-gonzalez':       'froilan-gonzalez',
    'j-f-gonzalez':     'froilan-gonzalez',
    'p-etancelin':      'philippe-etancelin',
    'levegh':           'pierre-levegh',
    "'levegh'":         'pierre-levegh',
};

function decodeHtml(str) {
    return str
        .replace(/&eacute;/gi, 'e').replace(/&egrave;/gi, 'e').replace(/&ecirc;/gi, 'e')
        .replace(/&aacute;/gi, 'a').replace(/&agrave;/gi, 'a').replace(/&atilde;/gi, 'a')
        .replace(/&oacute;/gi, 'o').replace(/&otilde;/gi, 'o')
        .replace(/&iacute;/gi, 'i').replace(/&iuml;/gi, 'i')
        .replace(/&uacute;/gi, 'u').replace(/&uuml;/gi, 'u')
        .replace(/&ccedil;/gi, 'c').replace(/&ntilde;/gi, 'n')
        .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
        .replace(/&#\d+;/g, '');
}

function slugify(name) {
    const s = decodeHtml(name)
        .toLowerCase()
        .replace(/['''"]/g, '')          // Anführungszeichen weg
        .replace(/\./g, '')              // Punkte weg (B.Bira → BBira)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    return SLUG_ALIASES[s] || s;
}

// ── DNF-Klassifikation ────────────────────────────────────────────────────
function classifyDnf(reason) {
    if (!reason) return 'unknown';
    const r = reason.toLowerCase();
    if (/accident|crash|collision|hit|spun|spin(?! off)|stall/.test(r))  return 'driver';
    if (/spin off|spun off/.test(r))                                       return 'driver';
    if (/engine|gearbox|transmission|clutch|oil|fuel|fire|overheating|water|radiator|suspension|wheel|tyre|tire|brake|magneto|supercharger|head gasket|differential|steering/.test(r)) return 'tech';
    if (/disqualif/.test(r)) return 'dsq';
    return 'unknown';
}

// ── HTTP fetch ────────────────────────────────────────────────────────────
function fetchOnce(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url,
            { headers: { 'User-Agent': 'f1-rpg-research/1.0 (private)' } },
            res => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    return fetchOnce(res.headers.location).then(resolve).catch(reject);
                }
                if (res.statusCode === 404 || res.statusCode === 403) return resolve(null);
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
        try { return await fetchOnce(url); }
        catch (e) {
            if (i < retries - 1) { await sleep(3000); }
            else { console.log(`  ✗ ${url.split('/').pop()} (${e.message})`); return null; }
        }
    }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Rennseite parsen ──────────────────────────────────────────────────────
// Format innerhalb <pre>:
//   1 11 Driver Name          Car Model     Time/laps
//   R  3 Driver Name          Car Model     laps, reason
//   (dann "Did Not Finish:" Abschnitt)
//   (dann "Did Not Start:" / "DNS" am Zeilenende)

function parseResultBlock(preText) {
    const entries = [];
    const lines = preText.split('\n');
    let inDnf = false;
    let inDns = false;

    for (const rawLine of lines) {
        const line = rawLine.replace(/\t/g, '  ');

        // Abschnitts-Header
        if (/did not finish/i.test(line))  { inDnf = true;  inDns = false; continue; }
        if (/did not start/i.test(line))   { inDns = true;  inDnf = false; continue; }
        if (/did not qualify/i.test(line)) { inDns = true;  inDnf = false; continue; }
        if (/fastest lap|pole position|starting grid|notes?:/i.test(line)) break;

        if (line.trim() === '') continue;

        // Format A (mit Startnummer):  "  1 11 Driver Name  Car  Zeit"
        // Format B (ohne Startnummer): "  1 Driver Name     Car  Zeit"
        // Format R (Ausfall):          "  R  9 Driver Name  Car  laps/reason"
        //                          oder "  R Driver Name     Car  laps/reason"
        let posRaw, driverRaw;
        const mA = line.match(/^\s{0,4}(\d+|R|DSQ|DQ|DNS|DNQ|EX)\s+(\d+|\?)\s+([A-Z'"''].*)/);
        const mB = line.match(/^\s{0,4}(\d+|R|DSQ|DQ|DNS|DNQ|EX)\s+([A-Z'"''].*)/);
        if (mA) {
            posRaw    = mA[1].trim();
            driverRaw = mA[3];
        } else if (mB) {
            posRaw    = mB[1].trim();
            driverRaw = mB[2];
        } else continue;

        // Fahrername: alles bis zum ersten doppelten Leerzeichen (trennt Name von Auto)
        const parts     = driverRaw.split(/\s{2,}/);
        const driverStr = parts[0].trim();
        const rest      = parts.slice(1).join('  ').trim();

        // Zeit / Status
        const lastPart  = parts[parts.length - 1] || '';
        const isDnf     = inDnf || /^R$|^DSQ$|^DQ$/i.test(posRaw);
        const isDns     = inDns || /^DNS$|^DNQ$/i.test(posRaw);

        // DNF-Grund: nach dem letzten "/" in rest
        let dnfReason   = null;
        if (isDnf) {
            const slash = lastPart.lastIndexOf('/');
            dnfReason = slash >= 0 ? lastPart.slice(slash + 1).trim() : lastPart.trim();
        }

        // Geteilte Fahrten: "Driver A/Driver B" → splitten
        const driverNames = driverStr
            .split('\n')          // manchmal Zeilenumbrüche im HTML
            .join(' ')
            .split('/')
            .map(d => d.trim())
            .filter(d => d.length > 1 && /[a-zA-Z]/.test(d));

        driverNames.forEach(name => {
            if (isDns) return; // DNS → Elo irrelevant, überspringen

            entries.push({
                pos:        isDnf ? null : (parseInt(posRaw) || null),
                dnf:        isDnf,
                dnfReason:  isDnf ? classifyDnf(dnfReason) : null,
                dnfStatus:  isDnf ? (dnfReason || null) : null,
                driver:     name,
                driverSlug: slugify(name),
            });
        });
    }

    return entries;
}

// ── Jahresseite parsen ────────────────────────────────────────────────────
function parsePage(html, year) {
    const races = [];

    // Jeden Rennabschnitt isolieren: <h4...>...</h4>...<pre>...</pre>
    // Trennzeichen: <hr>
    const sections = html.split(/<hr>/i);

    for (const section of sections) {
        // Renntitel aus <h4>
        const h4 = section.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
        if (!h4) continue;

        const titleRaw = h4[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        // Erste Zeile = Rennname, zweite Zeile = Datum + Ort
        const titleLines = titleRaw.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
        const name   = titleLines[0] || '';
        const meta   = titleLines[1] || '';           // "9 February 1947 - Rommehed..."
        const dateM  = meta.match(/^(\d+\s+\w+\s+\d{4})/);
        const date   = dateM ? dateM[1] : '';

        // <pre>-Block
        const preM = section.match(/<pre>([\s\S]*?)<\/pre>/i);
        if (!preM) continue;

        const entries = parseResultBlock(preM[1]);
        if (entries.length === 0) continue;

        races.push({ date, name, entries });
    }

    return races;
}

// ── Einzelne Rennseite (1949-Stil) parsen ────────────────────────────────
function parseSingleRacePage(html) {
    const h4 = html.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
    if (!h4) return null;
    const titleRaw  = h4[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const titleLines = titleRaw.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
    const name  = titleLines[0] || '';
    const meta  = titleLines[1] || '';
    const dateM = meta.match(/^(\d+\s+\w+\s+\d{4})/);
    const date  = dateM ? dateM[1] : '';

    const preM = html.match(/<pre>([\s\S]*?)<\/pre>/i);
    if (!preM) return null;
    const entries = parseResultBlock(preM[1]);
    return entries.length ? { date, name, entries } : null;
}

// ── Hauptprogramm ─────────────────────────────────────────────────────────
async function main() {
    let totalRaces = 0;

    for (const year of YEARS) {
        const url = `${BASE}/${year}/${year}.html`;
        console.log(`\n── ${year}  ${url}`);

        const html = await fetch(url);
        if (!html) { console.log('  ✗ nicht erreichbar'); continue; }
        console.log(`  ${html.length} Bytes`);
        await sleep(DELAY);

        let races = parsePage(html, year);

        // Wenn keine Rennen geparst → Index-Seite mit Links zu Einzelseiten (1949-Stil)
        if (races.length === 0) {
            console.log('  → Index-Seite erkannt, lade Einzelseiten …');
            const cheerio = require('cheerio');
            const $ = cheerio.load(html);
            const links = [];
            $('a[href]').each((_, el) => {
                const href = $(el).attr('href');
                if (href && !href.startsWith('http') && href.endsWith('.html')) {
                    links.push({ href, text: $(el).text().trim() });
                }
            });

            for (const { href, text } of links) {
                const raceUrl = `${BASE}/${year}/${href}`;
                process.stdout.write(`  Lade ${href} … `);
                const raceHtml = await fetch(raceUrl);
                if (!raceHtml) { console.log('fehler'); continue; }
                console.log(`${raceHtml.length}B`);
                const race = parseSingleRacePage(raceHtml);
                if (race) races.push(race);
                await sleep(DELAY);
            }
        }

        totalRaces += races.length;

        const outPath = path.join(OUT_DIR, `silhouet-${year}.json`);
        fs.writeFileSync(outPath, JSON.stringify({
            year,
            source:  'silhouet.com (non-championship)',
            scraped: new Date().toISOString(),
            races
        }, null, 2), 'utf8');

        console.log(`  ✓ ${races.length} Rennen → silhouet-${year}.json`);
    }

    console.log(`\n✓ Fertig: ${YEARS.length} Jahre, ${totalRaces} Rennen`);
}

main().catch(console.error);
