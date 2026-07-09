/**
 * fetch-circuit-climate.js
 * Lädt Open-Meteo ERA5-Archivdaten (1991–2020) für alle F1-Strecken.
 * Berechnet pro Strecke + Monat:
 *   - rainProb[0..11]: Anteil der Tage mit Niederschlag > 1mm (0.0–1.0)
 *   - tempC[0..11]:    Durchschnittliche Lufttemperatur in °C
 *
 * Ausführen: node tests/fetch-circuit-climate.js
 * Output:    tests/circuit-climate.json
 */

'use strict';

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const OUT_FILE = path.join(__dirname, 'circuit-climate.json');
const DELAY      = 2500;  // ms zwischen Requests
const RETRY_WAIT = 35000; // ms Pause bei Rate-Limit

// Alle F1DB circuit IDs mit Koordinaten (WGS84)
const CIRCUITS = [
    // ── Aktuell/Rezent ──────────────────────────────────────────────────────
    { id: 'albert-park',      lat: -37.849,  lon: 144.968  }, // Melbourne
    { id: 'bahrain',          lat:  26.032,  lon:  50.511  },
    { id: 'baku',             lat:  40.373,  lon:  49.853  },
    { id: 'barcelona',        lat:  41.570,  lon:   2.261  }, // Catalunya
    { id: 'hungaroring',      lat:  47.579,  lon:  19.249  },
    { id: 'imola',            lat:  44.344,  lon:  11.713  },
    { id: 'interlagos',       lat: -23.701,  lon: -46.697  }, // São Paulo
    { id: 'istanbul',         lat:  40.952,  lon:  29.405  },
    { id: 'jeddah',           lat:  21.632,  lon:  39.104  },
    { id: 'kyalami',          lat: -26.012,  lon:  28.072  },
    { id: 'las-vegas',        lat:  36.272,  lon: -115.011 },
    { id: 'losail',           lat:  25.490,  lon:  51.454  }, // Qatar / Lusail
    { id: 'lusail',           lat:  25.490,  lon:  51.454  },
    { id: 'marina-bay',       lat:   1.291,  lon: 103.864  }, // Singapore
    { id: 'mexico-city',      lat:  19.404,  lon: -99.091  },
    { id: 'miami',            lat:  25.958,  lon: -80.239  },
    { id: 'monaco',           lat:  43.735,  lon:   7.421  },
    { id: 'monza',            lat:  45.621,  lon:   9.281  },
    { id: 'mugello',          lat:  43.997,  lon:  11.372  },
    { id: 'nurburgring',      lat:  50.335,  lon:   6.947  },
    { id: 'paul-ricard',      lat:  43.252,  lon:   5.791  },
    { id: 'portimao',         lat:  37.227,  lon:  -8.627  },
    { id: 'red-bull-ring',    lat:  47.220,  lon:  14.765  }, // Spielberg / Zeltweg
    { id: 'sepang',           lat:   2.760,  lon: 101.738  }, // Malaysia
    { id: 'shanghai',         lat:  31.340,  lon: 121.220  },
    { id: 'silverstone',      lat:  52.079,  lon:  -1.017  },
    { id: 'sochi',            lat:  43.409,  lon:  39.958  },
    { id: 'spa-francorchamps',lat:  50.437,  lon:   5.971  },
    { id: 'suzuka',           lat:  34.843,  lon: 136.541  },
    { id: 'yas-marina',       lat:  24.468,  lon:  54.603  }, // Abu Dhabi
    { id: 'yeongam',          lat:  34.733,  lon: 126.414  }, // Korea
    { id: 'zandvoort',        lat:  52.388,  lon:   4.540  },
    { id: 'zolder',           lat:  50.989,  lon:   5.257  },
    // ── Historisch Europa ───────────────────────────────────────────────────
    { id: 'ain-diab',         lat:  33.590,  lon:  -7.680  }, // Casablanca
    { id: 'aintree',          lat:  53.477,  lon:  -2.942  },
    { id: 'anderstorp',       lat:  57.264,  lon:  13.605  },
    { id: 'avus',             lat:  52.480,  lon:  13.248  },
    { id: 'brands-hatch',     lat:  51.357,  lon:   0.261  },
    { id: 'bremgarten',       lat:  46.961,  lon:   7.426  }, // Bern
    { id: 'clermont-ferrand', lat:  45.779,  lon:   3.110  },
    { id: 'detroit',          lat:  42.330,  lon: -83.048  },
    { id: 'dijon',            lat:  47.362,  lon:   5.101  },
    { id: 'estoril',          lat:  38.750,  lon:  -9.394  },
    { id: 'hockenheimring',   lat:  49.328,  lon:   8.566  },
    { id: 'jacarepagua',      lat: -22.976,  lon: -43.395  }, // Rio
    { id: 'jerez',            lat:  36.709,  lon:  -6.035  },
    { id: 'long-beach',       lat:  33.765,  lon: -118.192 },
    { id: 'montjuic',         lat:  41.369,  lon:   2.150  }, // Barcelona alt
    { id: 'pedralbes',        lat:  41.388,  lon:   2.118  },
    { id: 'pescara',          lat:  42.461,  lon:  14.215  },
    { id: 'porto',            lat:  41.163,  lon:  -8.621  },
    { id: 'reims',            lat:  49.253,  lon:   3.968  },
    { id: 'rouen',            lat:  49.443,  lon:   1.099  },
    { id: 'valencia',         lat:  39.459,  lon:  -0.336  },
    { id: 'watkins-glen',     lat:  42.336,  lon: -76.929  },
    { id: 'zeltweg',          lat:  47.202,  lon:  14.741  },
    // ── USA ─────────────────────────────────────────────────────────────────
    { id: 'austin',           lat:  30.133,  lon: -97.641  }, // COTA
    { id: 'dallas',           lat:  32.783,  lon: -96.797  }, // Fair Park
    { id: 'fair-park',        lat:  32.783,  lon: -96.797  },
    { id: 'indianapolis',     lat:  39.795,  lon: -86.235  },
    { id: 'las-vegas-street', lat:  36.117,  lon: -115.173 },
    { id: 'phoenix',          lat:  33.449,  lon: -112.074 },
    { id: 'riverside',        lat:  33.930,  lon: -117.251 },
    { id: 'sebring',          lat:  27.456,  lon: -81.349  },
    // ── Südamerika ──────────────────────────────────────────────────────────
    { id: 'buenos-aires',     lat: -34.544,  lon: -58.451  },
    { id: 'monsanto',         lat:  38.721,  lon:  -9.197  }, // Lissabon
    // ── Asien / Ozeanien ────────────────────────────────────────────────────
    { id: 'aida',             lat:  34.915,  lon: 134.079  }, // Okayama
    { id: 'buddh',            lat:  28.349,  lon:  77.533  }, // Greater Noida
    { id: 'fuji',             lat:  35.371,  lon: 138.926  },
    { id: 'shanghai',         lat:  31.340,  lon: 121.220  },
    { id: 'yeongam',          lat:  34.733,  lon: 126.414  },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'f1-rpg-research/1.0' } }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error('JSON parse error: ' + data.slice(0, 200))); }
            });
        });
        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
    });
}

/**
 * Für einen Standort: monatliche Regenwahrscheinlichkeit + Ø-Temperatur berechnen.
 * Datenquelle: Open-Meteo ERA5 (1991-01-01 bis 2020-12-31 = 30 Jahre)
 */
async function fetchClimate(lat, lon) {
    // 10 Jahre: zuverlässige Stichprobe, kein Timeout
    const url = `https://archive-api.open-meteo.com/v1/archive`
        + `?latitude=${lat}&longitude=${lon}`
        + `&start_date=2010-01-01&end_date=2019-12-31`
        + `&daily=precipitation_sum,temperature_2m_mean`
        + `&timezone=UTC`;

    const data = await fetchJson(url);
    if (!data.daily) throw new Error('no daily data');

    const dates   = data.daily.time;
    const precip  = data.daily.precipitation_sum;
    const temp    = data.daily.temperature_2m_mean;

    // Aggregation: pro Monat (0=Jan … 11=Dez)
    const rainDays  = new Array(12).fill(0);
    const totalDays = new Array(12).fill(0);
    const tempSum   = new Array(12).fill(0);
    const tempCnt   = new Array(12).fill(0);

    for (let i = 0; i < dates.length; i++) {
        const m = parseInt(dates[i].slice(5, 7)) - 1; // 0-based
        totalDays[m]++;
        if (precip[i] != null && precip[i] > 1.0) rainDays[m]++;
        if (temp[i] != null) { tempSum[m] += temp[i]; tempCnt[m]++; }
    }

    const rainProb = rainDays.map((r, m) => totalDays[m] > 0 ? Math.round(r / totalDays[m] * 100) / 100 : 0.20);
    const tempAvg  = tempSum.map((s, m)  => tempCnt[m]  > 0 ? Math.round(s / tempCnt[m] * 10) / 10  : 15);

    return { rainProb, tempAvg };
}

async function main() {
    // Bestehende Ergebnisse laden (Fortschritt erhalten bei Neustart)
    const result = fs.existsSync(OUT_FILE)
        ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'))
        : {};
    const seen   = new Set();
    let ok = 0, skipped = 0, fail = 0;

    for (const circuit of CIRCUITS) {
        // Bereits vorhanden → überspringen
        if (result[circuit.id]) {
            process.stdout.write(`  ${circuit.id.padEnd(25)} … (gecacht)\n`);
            seen.add(`${circuit.lat},${circuit.lon}`);
            skipped++;
            continue;
        }

        const key = `${circuit.lat},${circuit.lon}`;
        if (seen.has(key)) {
            const first = CIRCUITS.find(c => `${c.lat},${c.lon}` === key && result[c.id]);
            if (first) { result[circuit.id] = result[first.id]; skipped++; continue; }
        }
        seen.add(key);

        process.stdout.write(`  ${circuit.id.padEnd(25)} … `);
        let retries = 3;
        let success = false;
        while (retries-- > 0) {
            try {
                const climate = await fetchClimate(circuit.lat, circuit.lon);
                result[circuit.id] = climate;
                console.log(`✓  rain Ø=${(climate.rainProb.reduce((a,b)=>a+b,0)/12*100).toFixed(0)}%  temp Ø=${(climate.tempAvg.reduce((a,b)=>a+b,0)/12).toFixed(1)}°C`);
                ok++;
                success = true;
                break;
            } catch (e) {
                if (retries > 0) {
                    process.stdout.write(`⟳ rate-limit, warte ${RETRY_WAIT/1000}s … `);
                    await sleep(RETRY_WAIT);
                } else {
                    console.log(`✗  ${e.message}`);
                    fail++;
                }
            }
        }
        // Zwischenspeichern nach jedem erfolgreichen Fetch
        if (success) fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2), 'utf8');
        await sleep(DELAY);
    }

    // Fallback für unbekannte Strecken (gemäßigtes Klima)
    result['_fallback'] = {
        rainProb: [0.20,0.18,0.22,0.28,0.32,0.30,0.28,0.28,0.30,0.28,0.22,0.20],
        tempAvg:  [5, 6, 9, 13, 17, 21, 23, 23, 19, 14, 9, 6]
    };

    fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2), 'utf8');
    console.log(`\n✓ Fertig: ${ok} neu, ${skipped} gecacht, ${fail} Fehler → circuit-climate.json`);
}

main().catch(console.error);
