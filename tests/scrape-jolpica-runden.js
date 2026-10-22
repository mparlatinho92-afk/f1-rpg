/**
 * scrape-jolpica-runden.js
 * Lädt die Position JEDES Fahrers in JEDER Runde für alle Rennen 1996–2024 von der jolpica API
 * (Ergast-Nachfolger, kein API-Key). Grundlage für Rennverlauf und Überholen im Ticker.
 *
 * Ausführen (läuft ~14–15 Stunden, fortsetzbar):
 *   node tests/scrape-jolpica-runden.js [vonJahr] [bisJahr]  >> tests/jolpica-data/runden-log.txt
 * Output: tests/jolpica-data/runden-YYYY.json
 *
 * ⚠ jolpica erlaubt 500 Abfragen pro Stunde (und 4 pro Sekunde). Eine Runde × Feld ≈ 20 Einträge,
 *   eine Seite hat höchstens 100 → ~12 Seiten je Rennen, ~7 000 Abfragen insgesamt. 7,5 s Abstand
 *   = 480/Stunde. Bei 429 wartet das Skript 5 Minuten.
 * ⚠ Fortsetzbar je RENNEN: die Jahresdatei wird nach jedem fertigen Rennen geschrieben. Ein
 *   abgebrochenes Rennen wird beim nächsten Start ganz neu geladen.
 * ⚠ Kennungen sind Ergast-IDs, nicht F1DB-Slugs (s. scrape-jolpica-runde1.js, Zuordnung über
 *   "drivers": Name + Geburtsdatum).
 *
 * Datenstruktur pro Jahr (kompakt, ~100 KB je Saison):
 * { "year": 1996, "source": "jolpica/ergast",
 *   "drivers": { "villeneuve": { "given": "Jacques", "family": "Villeneuve", "dob": "1971-04-09" }, ... },
 *   "races": [ { "round": 1, "ids": ["villeneuve", "damon_hill", ...],
 *                "laps": [[0, 1, 3, ...], [1, 0, 3, ...], ...] } ] }
 *   laps[r] = Fahrer in Positionsreihenfolge nach Runde r+1, als Index in ids.
 *
 * Ausgabe-Zeilen für die Fortschrittsmeldung (Monitor greift sie ab):
 *   "RENNEN 1996 R3: 61 Runden, 13 Seiten"  ·  "JAHR 1996 fertig: 16 Rennen"  ·  "STAND …"  ·  "FEHLER …"  ·  "FERTIG"
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
const sleep = ms => new Promise(r => setTimeout(r, ms));
const zeit = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
let abfragen = 0;
const start = Date.now();

function fetchOnce(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'f1-rpg-research/1.0 (private)' } }, res => {
            if (res.statusCode === 429) { res.resume(); return resolve({ rateLimit: true }); }
            if (res.statusCode !== 200) { res.resume(); return resolve({ status: res.statusCode }); }
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve({ kaputt: true }); } });
        });
        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
    });
}

async function fetchJSON(url) {
    for (let i = 0; i < 8; i++) {
        abfragen++;
        try {
            const d = await fetchOnce(url);
            if (d && d.rateLimit) { console.log(`STAND ${zeit()} Rate-Limit erreicht, warte 5 Minuten`); await sleep(300000); continue; }
            if (d && (d.status || d.kaputt)) { console.log(`FEHLER ${zeit()} ${d.status || 'kaputtes JSON'} bei ${url}, neuer Versuch`); await sleep(30000); continue; }
            return d;
        } catch (e) {
            console.log(`FEHLER ${zeit()} ${e.message} bei ${url}, neuer Versuch`);
            await sleep(30000);
        }
    }
    return null;
}

const rennen = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-races.json'), 'utf8'));
const gesamt = rennen.filter(r => r.year >= VON && r.year <= BIS).length;
let fertigGesamt = 0;

async function main() {
    console.log(`STAND ${zeit()} Start: ${VON}–${BIS}, ${gesamt} Rennen`);
    for (let jahr = VON; jahr <= BIS; jahr++) {
        const outPath = path.join(OUT_DIR, `runden-${jahr}.json`);
        const stand = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8'))
                                             : { year: jahr, source: 'jolpica/ergast', races: [] };
        // Leere Liste = Abfrage war gescheitert (2016: achtmal 530) → beim nächsten Start neu holen
        if (!stand.drivers || !Object.keys(stand.drivers).length) {
            const d = await fetchJSON(`${BASE}/${jahr}/drivers.json?limit=100`);
            stand.drivers = {};
            for (const x of ((d && d.MRData && d.MRData.DriverTable && d.MRData.DriverTable.Drivers) || []))
                stand.drivers[x.driverId] = { given: x.givenName, family: x.familyName, dob: x.dateOfBirth };
            if (!Object.keys(stand.drivers).length) console.log(`FEHLER ${zeit()} ${jahr}: keine Fahrerliste, wird beim nächsten Start erneut versucht`);
            else if (stand.races.length) fs.writeFileSync(outPath, JSON.stringify(stand), 'utf8');   // sonst ginge sie verloren, wenn kein Rennen mehr fehlt
            await sleep(DELAY);
        }
        const fertig = new Set(stand.races.map(r => r.round));
        const runden = rennen.filter(r => r.year === jahr).map(r => r.round).sort((a, b) => a - b);
        fertigGesamt += runden.filter(rd => fertig.has(rd)).length;
        for (const rd of runden) {
            if (fertig.has(rd)) continue;
            // Seitenweise: je Seite bis zu 100 Einträge (Runde × Fahrer)
            const proRunde = {};
            let offset = 0, total = Infinity, seiten = 0, ok = true;
            while (offset < total) {
                const d = await fetchJSON(`${BASE}/${jahr}/${rd}/laps.json?limit=100&offset=${offset}`);
                seiten++;
                if (!d || !d.MRData) { ok = false; break; }
                total = Number(d.MRData.total || 0);
                const race = d.MRData.RaceTable && d.MRData.RaceTable.Races && d.MRData.RaceTable.Races[0];
                for (const lap of ((race && race.Laps) || []))
                    for (const t of (lap.Timings || []))
                        (proRunde[lap.number] = proRunde[lap.number] || []).push([t.driverId, Number(t.position)]);
                offset += 100;
                await sleep(DELAY);
                if (total === 0) break;
            }
            const nr = Object.keys(proRunde).map(Number).sort((a, b) => a - b);
            if (!ok || !nr.length) { console.log(`FEHLER ${zeit()} ${jahr} R${rd}: keine Rundendaten, wird beim nächsten Start erneut versucht`); continue; }
            const ids = [...new Set(nr.flatMap(n => proRunde[n].map(x => x[0])))];
            const idx = new Map(ids.map((id, i) => [id, i]));
            const laps = nr.map(n => proRunde[n].sort((a, b) => a[1] - b[1]).map(x => idx.get(x[0])));
            stand.races.push({ round: rd, ids, laps });
            stand.races.sort((a, b) => a.round - b.round);
            stand.scraped = new Date().toISOString();
            fs.writeFileSync(outPath, JSON.stringify(stand), 'utf8');
            fertigGesamt++;
            const std = (Date.now() - start) / 3600000;
            console.log(`RENNEN ${jahr} R${rd}: ${nr.length} Runden, ${seiten} Seiten · gesamt ${fertigGesamt}/${gesamt} · ${abfragen} Abfragen in ${std.toFixed(1)} h`);
        }
        console.log(`JAHR ${jahr} fertig: ${stand.races.length} Rennen · STAND ${zeit()} ${fertigGesamt}/${gesamt} Rennen (${(100 * fertigGesamt / gesamt).toFixed(0)} %)`);
    }
    console.log(`FERTIG ${zeit()} ${fertigGesamt}/${gesamt} Rennen, ${abfragen} Abfragen`);
}

main().catch(e => { console.log(`FEHLER ${zeit()} Abbruch: ${e.message}`); process.exit(1); });
