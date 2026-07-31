#!/usr/bin/env node
/**
 * audit-driver-photos.js — gleicht die Foto-Zuordnung des Spiels gegen die
 * massgebliche Quelle ab: die Fahrerseite auf statsf1 selbst.
 *
 * Warum: das Spiel RAET den Dateinamen aus der Fahrer-ID (letzter Slug-Teil).
 * statsf1 kuerzt aber auf 8 Zeichen und haengt bei Namensgleichen mal die Initiale
 * ("hilld", "nissanyr"), mal eine Ziffer ("jones2", "andrett2") an — und manchmal
 * heisst die Datei ganz anders ("hermanal" fuer Al Herman). Raten trifft daneben,
 * im schlimmsten Fall auf das Gesicht eines anderen Fahrers (Tom Jones sah Alan Jones).
 *
 * Die Seite /en/<f1db-id>.aspx nennt die Datei direkt — das ist die Wahrheit.
 *
 * Aufruf: node tools/audit-driver-photos.js [--concurrency=3] [--limit=N]
 * Ergebnis: assets-backup/photo-audit.json + fertige Tabellen zum Einsetzen in index.html
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets-backup');
const args = process.argv.slice(2);
const CONC = Number((args.find(a => a.startsWith('--concurrency=')) || '').split('=')[1]) || 3;
const LIMIT = Number((args.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || 0;
const ONLY = (args.find(a => a.startsWith('--ids=')) || '').split('=')[1];   // gezielt einzelne Fahrer

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
function blockAfter(marker, closer) {
    const i = html.indexOf(marker); if (i < 0) return '';
    const end = html.indexOf(closer, i); return end < 0 ? '' : html.slice(i, end);
}
function parsePairs(body) {
    const map = {}; const re = /'([^']+)'\s*:\s*'([^']*)'/g; let m;
    while ((m = re.exec(body)) !== null) map[m[1]] = m[2];
    return map;
}
const OVERRIDES = parsePairs(blockAfter('const DRIVER_PHOTO_OVERRIDES', '\n        };'));
const BLOCK = new Set((blockAfter('const DRIVER_PHOTO_BLOCKLIST', '\n        ]);').match(/'([^']+)'/g) || []).map(s => s.slice(1, -1)));

// Was das Spiel heute anzeigt (Dateiname ohne .png), null = Avatar
function gameFile(id) {
    if (BLOCK.has(id)) return null;
    if (OVERRIDES[id]) return OVERRIDES[id];
    return id.split('-').pop();
}

function get(url, redirects = 0) {
    return new Promise(res => {
        if (redirects > 3) return res({ code: 0 });
        const q = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (F1RPG photo audit)' } }, s => {
            if ([301, 302, 303, 307, 308].includes(s.statusCode)) { s.resume(); return res({ code: s.statusCode }); }
            if (s.statusCode !== 200) { s.resume(); return res({ code: s.statusCode }); }
            let body = '';
            s.setEncoding('utf8');
            s.on('data', c => body += c);
            s.on('end', () => res({ code: 200, body }));
        });
        q.on('error', () => res({ code: 0 }));
        q.setTimeout(30000, () => { q.destroy(); res({ code: 0 }); });
    });
}
// statsf1 drosselt: nach etwa 50 Seitenabrufen kommt statt der Seite nur noch ein 302.
// Ein 302 ist aber AUCH die normale Antwort fuer "diese Fahrerseite gibt es nicht".
// Unterscheiden laesst sich das nur an einer Referenzseite, von der wir wissen, dass es
// sie gibt: antwortet die mit 200, ist die Seite wirklich weg; antwortet sie ebenfalls
// mit 302, sind wir gesperrt und muessen warten statt weiterzuhaemmern.
const DELAY = Number((args.find(a => a.startsWith('--delay=')) || '').split('=')[1]) || 3000;
const SENTINEL = 'https://www.statsf1.com/en/alan-jones.aspx';
const sleep = ms => new Promise(x => setTimeout(x, ms));

let blockWaits = 0;
async function waitOutBlock() {
    // Wartet, bis die Referenzseite wieder antwortet. Verdoppelt die Pause bis max. 30 min.
    let wait = 60000;
    for (let i = 0; i < 40; i++) {
        const s = await get(SENTINEL);
        if (s.code === 200) {
            if (i) console.log(`  Sperre aufgehoben nach ${Math.round(i * wait / 60000)}+ min, weiter.`);
            return true;
        }
        if (!i) { blockWaits++; console.log(`  [Sperre erkannt] warte...`); }
        await sleep(wait);
        wait = Math.min(wait * 1.5, 1800000);
    }
    return false;
}
// Holt eine Seite; unterscheidet "gibt es nicht" von "wir sind gesperrt".
async function getPage(url) {
    for (let attempt = 0; attempt < 3; attempt++) {
        const r = await get(url);
        if (r.code === 200) return r;
        const s = await get(SENTINEL);
        if (s.code === 200) return r;      // Referenz lebt -> die Seite fehlt wirklich
        if (!await waitOutBlock()) return { code: -1 };   // gesperrt -> aussitzen, dann nochmal
    }
    return { code: -1 };
}

(async () => {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'f1db-json-splitted', 'f1db-drivers.json'), 'utf8'));
    const arr = Array.isArray(raw) ? raw : (raw.drivers || Object.values(raw)[0]);
    let drivers = arr.filter(d => d.id);
    if (ONLY) { const want = new Set(ONLY.split(',')); drivers = drivers.filter(d => want.has(d.id)); }
    if (LIMIT) drivers = drivers.slice(0, LIMIT);

    // Wiederaufnahme: bereits geklaerte Fahrer nicht erneut abfragen (schont die Quelle).
    const prevFile = path.join(OUT, 'photo-audit.json');
    const prev = fs.existsSync(prevFile) && !args.includes('--fresh')
        ? new Map(JSON.parse(fs.readFileSync(prevFile, 'utf8')).rows
            .filter(r => r.pageStatus === 200).map(r => [r.id, r]))
        : new Map();
    if (prev.size) console.log(`Uebernehme ${prev.size} bereits geklaerte Fahrer aus photo-audit.json`);

    const rows = [];
    let idx = 0, done = 0;
    async function worker() {
        while (idx < drivers.length) {
            const d = drivers[idx++];
            if (prev.has(d.id)) { rows.push(prev.get(d.id)); done++; continue; }
            await sleep(DELAY);
            const r = await getPage(`https://www.statsf1.com/en/${d.id}.aspx`);
            let truth = null, pageStatus = r.code;
            if (r.code === 200 && r.body) {
                const m = r.body.match(/pilotes\/photos\/([a-z0-9._-]+)\.png/i);
                if (m) truth = m[1].toLowerCase();
            }
            const game = gameFile(d.id);
            let verdict;
            if (pageStatus !== 200) verdict = 'seite-fehlt';
            else if (!truth) verdict = game ? 'seite-ohne-foto' : 'ok-avatar';
            else if (game === truth) verdict = 'ok';
            else if (!game) verdict = 'avatar-obwohl-foto-da';
            else verdict = 'FALSCHE-DATEI';

            rows.push({ id: d.id, name: d.name || d.fullName, game, truth, verdict, pageStatus });
            if (++done % 25 === 0) {
                // Zwischenstand sichern: ein Abbruch (oder eine Sperre, die nicht faellt)
                // darf die bisherige Arbeit nicht kosten — der naechste Lauf setzt darauf auf.
                fs.writeFileSync(path.join(OUT, 'photo-audit.json'),
                    JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), rows: [...rows].sort((a, b) => a.id.localeCompare(b.id)) }, null, 2));
                const geklaert = rows.filter(r => r.pageStatus === 200).length;
                process.stdout.write(`  ...${done}/${drivers.length}  (seitenverifiziert ${geklaert}, Sperren ${blockWaits})\n`);
            }
        }
    }
    await Promise.all(Array.from({ length: CONC }, worker));
    rows.sort((a, b) => a.id.localeCompare(b.id));

    const by = v => rows.filter(r => r.verdict === v);
    const wrong = by('FALSCHE-DATEI');
    const missed = by('avatar-obwohl-foto-da');
    const noPhoto = by('seite-ohne-foto');
    const noPage = by('seite-fehlt');

    fs.writeFileSync(path.join(OUT, 'photo-audit.json'),
        JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), rows }, null, 2));

    console.log(`\n=== Ergebnis ueber ${rows.length} Fahrer ===`);
    console.log(`korrekt                : ${by('ok').length}`);
    console.log(`Avatar korrekt         : ${by('ok-avatar').length}`);
    console.log(`FALSCHE DATEI          : ${wrong.length}   <- fremdes Gesicht oder falsches Bild`);
    console.log(`Avatar trotz Foto      : ${missed.length}   <- Foto existiert, wird nicht genutzt`);
    console.log(`statsf1 hat kein Foto  : ${noPhoto.length}   <- Avatar ist richtig, Blocklist unnoetig`);
    console.log(`Seite nicht gefunden   : ${noPage.length}`);

    if (wrong.length) {
        console.log('\n--- FALSCHE DATEI ---');
        wrong.forEach(r => console.log(`  ${r.id.padEnd(30)} zeigt ${String(r.game).padEnd(12)} statt ${r.truth}   [${r.name}]`));
    }
    if (missed.length) {
        console.log('\n--- Avatar trotz vorhandenem Foto ---');
        missed.forEach(r => console.log(`  ${r.id.padEnd(30)} -> ${r.truth}   [${r.name}]`));
    }

    // Fertige Tabelle: alles, wo die Slug-Regel nicht von selbst richtig liegt
    const needOverride = rows.filter(r => r.truth && r.truth !== r.id.split('-').pop());
    console.log(`\n--- Override-Zeilen fuer index.html (${needOverride.length}) ---`);
    needOverride.forEach(r => console.log(`            '${r.id}': '${r.truth}',`));
    const needBlock = noPhoto.map(r => r.id);
    console.log(`\n--- Ohne Foto bei statsf1 (${needBlock.length}), Avatar ist korrekt ---`);
    console.log(needBlock.map(i => `'${i}'`).join(', '));
    console.log('\nRohdaten: assets-backup/photo-audit.json');
})();
