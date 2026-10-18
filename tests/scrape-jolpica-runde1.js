/**
 * scrape-jolpica-runde1.js
 * Lädt die Position jedes Fahrers nach Runde 1 für alle Rennen 1996–2024 von der
 * jolpica API (Ergast-Nachfolger, kein API-Key). Zusammen mit Startplatz und Ergebnis
 * aus F1DB trennt das die Startrunde vom Rest des Rennens.
 *
 * Ausführen: node tests/scrape-jolpica-runde1.js [vonJahr] [bisJahr]
 * Output:    tests/jolpica-data/runde1-YYYY.json
 *
 * ⚠ Rundendaten gibt es nur je Rennen (/{jahr}/{runde}/laps/1), nicht je Saison.
 *   jolpica erlaubt 500 Abfragen pro Stunde → 7,5 s Abstand, ~1 Stunde für alles.
 *   Fortsetzbar: bereits geladene Rennen werden übersprungen, die Datei wird nach
 *   jedem Rennen geschrieben.
 *
 * Datenstruktur pro Jahr:
 * { "year": 1996, "source": "jolpica/ergast", "races": [
 *     { "round": 1, "positions": { "damon_hill": 1, "villeneuve": 2, ... } } ],
 *   "drivers": { "villeneuve": { "given": "Jacques", "family": "Villeneuve", "dob": "1971-04-09" }, ... } }
 *
 * ⚠ Die Kennungen sind Ergast-IDs ("villeneuve", "verstappen"), NICHT die F1DB-Slugs.
 *   Zuordnung über "drivers" (Name + Geburtsdatum), siehe tests/start-runde1-real.js.
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const BASE    = 'https://api.jolpi.ca/ergast/f1';
const OUT_DIR = path.join(__dirname, 'jolpica-data');
const DB      = path.join(__dirname, '..', 'f1db-json-splitted');
const DELAY   = 7500;
const VON     = Number(process.argv[2] || 1996);
const BIS     = Number(process.argv[3] || 2024);

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchOnce(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'f1-rpg-research/1.0 (private)' } }, res => {
            if (res.statusCode === 429) return resolve({ rateLimit: true });
            if (res.statusCode === 404) return resolve(null);
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve(null); } });
        });
        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
    });
}

async function fetchJSON(url) {
    for (let i = 0; i < 6; i++) {
        try {
            const d = await fetchOnce(url);
            if (d && d.rateLimit) { console.log('  … Rate-Limit, warte 60 s'); await sleep(60000); continue; }
            return d;
        } catch (e) {
            console.log('  ⟳ ' + e.message);
            await sleep(10000);
        }
    }
    return null;
}

// Runden je Jahr aus F1DB, spart eine Abfrage je Saison
const rennen = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-races.json'), 'utf8'));

async function main() {
    for (let jahr = VON; jahr <= BIS; jahr++) {
        const outPath = path.join(OUT_DIR, `runde1-${jahr}.json`);
        const stand = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8'))
                                             : { year: jahr, source: 'jolpica/ergast', races: [] };
        if (!stand.drivers) {
            const d = await fetchJSON(`${BASE}/${jahr}/drivers.json?limit=100`);
            stand.drivers = {};
            for (const x of ((d && d.MRData && d.MRData.DriverTable && d.MRData.DriverTable.Drivers) || []))
                stand.drivers[x.driverId] = { given: x.givenName, family: x.familyName, dob: x.dateOfBirth };
            console.log(`  ${jahr}: ${Object.keys(stand.drivers).length} Fahrer in der Liste`);
            await sleep(DELAY);
        }
        const fertig = new Set(stand.races.map(r => r.round));
        const runden = rennen.filter(r => r.year === jahr).map(r => r.round).sort((a, b) => a - b);
        for (const rd of runden) {
            if (fertig.has(rd)) continue;
            const d = await fetchJSON(`${BASE}/${jahr}/${rd}/laps/1.json?limit=100`);
            const race = d && d.MRData && d.MRData.RaceTable && d.MRData.RaceTable.Races[0];
            const timings = (race && race.Laps && race.Laps[0] && race.Laps[0].Timings) || [];
            // leer = Abfrage gescheitert → nicht als fertig speichern, der nächste Aufruf versucht es erneut
            if (!timings.length) { console.log(`  ${jahr} R${rd}: keine Daten`); await sleep(DELAY); continue; }
            const positions = {};
            for (const t of timings) positions[t.driverId] = Number(t.position);
            stand.races.push({ round: rd, positions });
            stand.races.sort((a, b) => a.round - b.round);
            stand.scraped = new Date().toISOString();
            fs.writeFileSync(outPath, JSON.stringify(stand, null, 1), 'utf8');
            console.log(`  ${jahr} R${rd}: ${timings.length} Fahrer`);
            await sleep(DELAY);
        }
    }
    console.log('Fertig.');
}

main().catch(console.error);
