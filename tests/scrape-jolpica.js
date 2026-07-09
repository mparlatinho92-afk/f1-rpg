/**
 * scrape-jolpica.js
 * Lädt DNF-Gründe für alle F1-Rennen 1950–2024 von der jolpica API
 * (Ergast-kompatibler Ersatz; kein API-Key nötig).
 *
 * Ausführen: node tests/scrape-jolpica.js
 * Output:    tests/jolpica-data/dnf-YYYY.json
 *
 * Datenstruktur pro Jahr:
 * {
 *   "year": 1994,
 *   "source": "jolpica/ergast",
 *   "races": [
 *     {
 *       "round": 1,
 *       "name": "Brazilian Grand Prix",
 *       "date": "1994-03-27",
 *       "entries": [
 *         { "driverSlug": "michael-schumacher", "pos": 1, "dnf": false, "status": "Finished", "dnfType": null },
 *         { "driverSlug": "damon-hill",         "pos": null, "dnf": true, "status": "Engine", "dnfType": "tech" }
 *       ]
 *     }
 *   ]
 * }
 */

const https   = require('https');
const fs      = require('fs');
const path    = require('path');

const BASE    = 'https://api.jolpi.ca/ergast/f1';
const OUT_DIR = path.join(__dirname, 'jolpica-data');
const DELAY   = 300;   // ms zwischen Requests
const YEARS   = range(1950, 2024);

// ── Verzeichnis anlegen falls nötig ───────────────────────────────────────
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function range(from, to) {
    const r = [];
    for (let y = from; y <= to; y++) r.push(y);
    return r;
}

// ── DNF-Klassifikation aus Ergast-Status ─────────────────────────────────
// Vollständige jolpica-Status-Werte: "Finished", "+1 Lap", "Engine",
// "Gearbox", "Accident", "Collision", "Spun off", "Disqualified", ...
function classifyDnf(status) {
    if (!status) return 'unknown';
    const s = status.toLowerCase();

    // Nicht-Ausfall: klassifiziert (Runde zurück etc.)
    if (/^finished$|^\+\d+ lap/.test(s))   return null;

    // Disqualifikation
    if (/disqualif/.test(s))               return 'dsq';

    // Fahler-Ausfall: Fahrfehler des Fahrers selbst
    if (/^spun off$|^spin$/.test(s))       return 'driver';
    if (/accident(?! with)|^retired$/.test(s) && !/collision|contact/.test(s)) {
        // "Accident" ohne Fremd-Bezug → Fahler; "Accident" vage → driver
        return 'driver';
    }

    // Fremdverschulden
    if (/collision|contact|collided|accident with/.test(s)) return 'collision';

    // Technik-Ausfall
    if (/engine|gearbox|transmission|clutch|oil|fuel|fire|overheating|water|radiator|suspension|wheel|tyre|tire|brake|magneto|supercharger|head gasket|differential|steering|hydraulic|electronics|electrical|exhaust|turbo|throttle|throttle control|power loss|mechanical|driveshaft|cv joint|puncture/.test(s)) {
        return 'tech';
    }

    // Sonstige strukturierte Rückstände (+"x Lap(s)") → keine DNF
    if (/^\+\d+/.test(s)) return null;

    return 'unknown';
}

// ── Fahrer-Name → Slug ────────────────────────────────────────────────────
// jolpica gibt driverId zurück (bereits als Slug), z.B. "michael_schumacher"
// → nur Unterstriche durch Bindestriche ersetzen
function toSlug(driverId) {
    return (driverId || '').replace(/_/g, '-').toLowerCase();
}

// ── HTTP-Fetch ─────────────────────────────────────────────────────────────
function fetchOnce(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url,
            { headers: { 'User-Agent': 'f1-rpg-research/1.0 (private)' } },
            res => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return fetchOnce(res.headers.location).then(resolve).catch(reject);
                }
                if (res.statusCode === 404 || res.statusCode === 403) return resolve(null);
                if (res.statusCode === 429) {
                    // Rate limit – kurz warten und nochmal
                    return setTimeout(() => fetchOnce(url).then(resolve).catch(reject), 5000);
                }
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    try { resolve(JSON.parse(data)); }
                    catch (e) { resolve(null); }
                });
            });
        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
    });
}

async function fetchJSON(url, retries = 4) {
    for (let i = 0; i < retries; i++) {
        try {
            const data = await fetchOnce(url);
            if (data !== null) return data;
        } catch (e) {
            if (i < retries - 1) {
                console.log(`  ⟳ Retry ${i + 1} für ${url.split('/').slice(-3).join('/')} (${e.message})`);
                await sleep(3000);
            } else {
                console.log(`  ✗ Aufgegeben: ${e.message}`);
                return null;
            }
        }
    }
    return null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Ein Jahr laden (alle Rennen, paginiert) ───────────────────────────────
async function fetchYear(year) {
    const races = [];
    let offset = 0;
    const limit = 100; // max entries per request for year endpoint

    // jolpica year endpoint: /f1/{year}/results.json?limit=N&offset=N
    // Returns: MRData.RaceTable.Races[] – jede Race hat Results[]
    while (true) {
        const url = `${BASE}/${year}/results.json?limit=${limit}&offset=${offset}`;
        const data = await fetchJSON(url);

        if (!data || !data.MRData) break;

        const total   = parseInt(data.MRData.total  || '0');
        const rawRaces = (data.MRData.RaceTable || {}).Races || [];

        for (const race of rawRaces) {
            // Nur DNF-Einträge speichern – Positionen kommen aus f1db
            const entries = [];
            for (const r of (race.Results || [])) {
                const status  = r.status || '';
                const dnfType = classifyDnf(status);
                const dnf     = (r.positionText === 'R' || r.positionText === 'D' ||
                                 r.positionText === 'E' || r.positionText === 'W' ||
                                 r.positionText === 'F' || r.positionText === 'N' ||
                                 (dnfType !== null && dnfType !== 'dsq'));
                if (!dnf) continue;
                entries.push({
                    driverSlug: toSlug(r.Driver.driverId),
                    status,
                    dnfType: dnfType || 'unknown',
                });
            }

            races.push({
                round:   parseInt(race.round),
                name:    race.raceName,
                date:    race.date,
                circuit: race.Circuit ? race.Circuit.circuitId : null,
                entries,
            });
        }

        offset += limit;
        if (offset >= total) break;
        await sleep(DELAY);
    }

    // Nach Runde sortieren
    races.sort((a, b) => a.round - b.round);
    return races;
}

// ── Hauptprogramm ──────────────────────────────────────────────────────────
async function main() {
    let totalRaces   = 0;
    let totalEntries = 0;

    console.log(`jolpica DNF-Scraper – ${YEARS.length} Jahre (${YEARS[0]}–${YEARS[YEARS.length - 1]})\n`);

    for (const year of YEARS) {
        const outPath = path.join(OUT_DIR, `dnf-${year}.json`);

        // Bereits vorhanden? Überspringen (Resumability)
        if (fs.existsSync(outPath)) {
            const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
            const n = existing.races.length;
            const e = existing.races.reduce((s, r) => s + r.entries.length, 0);
            console.log(`  ${year}: ✓ bereits vorhanden (${n} Rennen, ${e} Einträge)`);
            totalRaces   += n;
            totalEntries += e;
            continue;
        }

        process.stdout.write(`  ${year} … `);
        const races = await fetchYear(year);
        const entries = races.reduce((s, r) => s + r.entries.length, 0);
        console.log(`${races.length} Rennen, ${entries} Einträge`);

        fs.writeFileSync(outPath, JSON.stringify({
            year,
            source:  'jolpica/ergast',
            scraped: new Date().toISOString(),
            races,
        }, null, 2), 'utf8');

        totalRaces   += races.length;
        totalEntries += entries;

        await sleep(DELAY);
    }

    console.log(`\n✓ Fertig: ${YEARS.length} Jahre, ${totalRaces} Rennen, ${totalEntries} Einträge`);
    console.log(`  Output: ${OUT_DIR}`);
}

main().catch(console.error);
