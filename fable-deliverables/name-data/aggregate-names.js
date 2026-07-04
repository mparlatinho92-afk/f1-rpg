// Aggregiert die BigQuery-Roh-CSVs (forenames.csv / surnames.csv) zu Mini-CSVs:
// Top-N Namen pro Land mit Count. Streaming, konstanter Speicher.
// Aufruf:  node aggregate-names.js forenames.csv fore_agg.csv M 150
//          node aggregate-names.js surnames.csv  sur_agg.csv  ALL 150
// Schema Input:  name,gender,country,count   (Header-Zeile wird erkannt)
// Schema Output: country,name,count          (sortiert nach country, count desc)
const fs = require('fs');
const readline = require('readline');

const [,, inFile, outFile, genderFilter = 'M', topNArg = '150'] = process.argv;
const TOP_N = parseInt(topNArg, 10);
if (!inFile || !outFile) { console.error('usage: node aggregate-names.js <in.csv> <out.csv> [M|ALL] [topN]'); process.exit(1); }

// Nur die Länder, die das Spiel braucht (ISO-2) – hält die Map klein
const WANTED = new Set(['GB','DE','IT','FR','US','BR','JP','AR','ES','NL','BE','CH','AT','SE','FI','DK','AU','NZ','CA','MX','ZA','IE','PT','MC','UY','VE','CO','RU','PL','CZ','HU','IN','IL','TH','MA','MY','ID','CN','EE','ZW','NO','IS','UA','SK','TR','GR','KR','KZ','LU','LT','LV','HR','RS','SI','BG','RO','PH','SG','HK','TW','AE','SA','EG','TN','CL','PE','EC','PA','CR','GT']);

const byCountry = new Map(); // country -> Map(name -> count)
let lines = 0, kept = 0;

const rl = readline.createInterface({ input: fs.createReadStream(inFile), crlfDelay: Infinity });
rl.on('line', (line) => {
    lines++;
    if (lines === 1 && /country/i.test(line)) return; // Header
    // simple CSV split – Datensatz enthält keine gequoteten Kommas laut Schema
    const parts = line.split(',');
    if (parts.length < 4) return;
    const name = parts[0].trim();
    const gender = parts[1].trim().toUpperCase();
    const country = parts[2].trim().toUpperCase();
    const count = parseInt(parts[3], 10);
    if (!name || !count || !WANTED.has(country)) return;
    if (genderFilter !== 'ALL' && gender !== genderFilter) return;
    let m = byCountry.get(country);
    if (!m) { m = new Map(); byCountry.set(country, m); }
    m.set(name, (m.get(name) || 0) + count); // Gender-Duplikate aufsummieren (Nachnamen)
    kept++;
    if (lines % 5000000 === 0) console.error(`  ... ${lines} Zeilen`);
});

rl.on('close', () => {
    const out = fs.createWriteStream(outFile);
    out.write('country,name,count\n');
    const countries = [...byCountry.keys()].sort();
    for (const c of countries) {
        const top = [...byCountry.get(c).entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_N);
        for (const [name, count] of top) out.write(`${c},${JSON.stringify(name)},${count}\n`);
    }
    out.end(() => console.error(`Fertig: ${lines} Zeilen gelesen, ${kept} übernommen, ${countries.length} Länder -> ${outFile}`));
});
