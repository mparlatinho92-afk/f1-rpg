// Gleicht F1DB_RACES in data/f1db.js gegen f1db-json-splitted/f1db-races.json ab.
//   node tools/f1db-abgleich.js              → nur Bericht, schreibt nichts
//   node tools/f1db-abgleich.js --schreiben  → übernimmt die Änderungen
// Ein Neubau von data/f1db.js ist nicht vorgesehen: die Datei trägt handgepflegte Tabellen
// (Klima, Längen, Heimrennen …) und PACE_RATINGS aus der Elo-Rechnung. Dieses Werkzeug fasst
// deshalb nur F1DB_RACES an:
//   - ab 2026 (laufende Saison) wird der Kalender komplett aus F1DB übernommen – Renn-IDs
//     dürfen sich dabei verschieben (v2026.17.0: Sepang als Lauf 16 eingeschoben)
//   - bis 2025 wird nichts geändert, Abweichungen werden nur gemeldet. Das Datum bleibt
//     das Ortsdatum: F1DB rechnet in UTC, das legt die Las-Vegas-Nachtrennen 2023/2025
//     auf Sonntag, gefahren wurde Samstagabend
// Ergebnisse, Quali und Wertung bleiben unberührt: 2025 bräuchte dazu neue Elo-Werte,
// 2026 ist die laufende Saison (Nutzer-Entscheidung 17.10.2026).
// Strecken-IDs, die F1DB umbenannt hat, werden auf die Spiel-ID zurückgeführt, weil Layout,
// Land, Klima und Länge an der alten ID hängen.
const fs = require('fs');
const path = require('path');
const wurzel = path.join(__dirname, '..');
const ziel = path.join(wurzel, 'data', 'f1db.js');
const quelle = require(path.join(wurzel, 'f1db-json-splitted', 'f1db-races.json'));
const version = fs.readFileSync(path.join(wurzel, 'f1db-version.txt'), 'utf8').trim();
const schreiben = process.argv.includes('--schreiben');

const STRECKE_ALT = { sirius: 'sochi' };   // F1DB-ID → Spiel-ID
const AB_JAHR = 2026;

let s = fs.readFileSync(ziel, 'utf8');
const muster = /^( *const F1DB_RACES = )(\{.*\});[ \t\r]*$/m;
const m = s.match(muster);
if (!m) throw new Error('F1DB_RACES nicht gefunden');
const alt = JSON.parse(m[2]);
const neu = {};

const gemeldet = [], kalender = [];
for (const [id, r] of Object.entries(alt)) if (+r[1].slice(0, 4) < AB_JAHR) neu[id] = r.slice();
for (const q of quelle) {
    const strecke = STRECKE_ALT[q.circuitId] || q.circuitId;
    const id = String(q.id);
    if (q.year >= AB_JAHR) {
        const vorher = alt[id];
        const indy = vorher && vorher[2] === strecke ? vorher[3] : (strecke === 'indianapolis' ? 1 : 0);
        neu[id] = [q.officialName, q.date, strecke, indy, q.scheduledLaps ?? q.laps];
        if (JSON.stringify(vorher) !== JSON.stringify(neu[id])) kalender.push(`${id}: ${vorher ? vorher[1] + ' ' + vorher[2] : '–'} → ${q.date} ${strecke}`);
        continue;
    }
    const r = neu[id];
    if (!r) { gemeldet.push(`${id} ${q.year} fehlt im Spiel`); continue; }
    if (r[1] !== q.date) gemeldet.push(`${id} Datum ${r[1]} ≠ F1DB ${q.date}${q.time ? ' ' + q.time + ' UTC' : ''}`);
    if (r[2] !== strecke) gemeldet.push(`${id} Strecke ${r[2]} ≠ F1DB ${strecke}`);
    if (r[0] !== q.officialName) gemeldet.push(`${id} Name „${r[0]}“ ≠ „${q.officialName}“`);
}
const roh = new Set(quelle.map(q => String(q.id)));
for (const id of Object.keys(alt)) if (!roh.has(id) && !neu[id]) kalender.push(`${id}: ${alt[id][1]} ${alt[id][2]} → entfällt`);

console.log(`F1DB ${version}: ${quelle.length} Rennen in F1DB, ${Object.keys(alt).length} → ${Object.keys(neu).length} im Spiel`);
console.log(`\nKalender ab ${AB_JAHR} (${kalender.length}):\n  ` + (kalender.join('\n  ') || '–'));
console.log(`\nBis ${AB_JAHR - 1} nur gemeldet, nicht geändert (${gemeldet.length}):\n  ` + (gemeldet.join('\n  ') || '–'));

if (!schreiben) { console.log('\nNichts geschrieben – mit --schreiben übernehmen.'); return; }
const sortiert = Object.fromEntries(Object.entries(neu).sort((a, b) => a[0] - b[0]));
s = s.replace(muster, () => m[1] + JSON.stringify(sortiert) + ';');
fs.writeFileSync(ziel, s);
console.log('\ndata/f1db.js geschrieben.');
