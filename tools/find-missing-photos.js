#!/usr/bin/env node
/**
 * find-missing-photos.js — sucht Fotos fuer Fahrer, die im Spiel nur den Avatar bekommen.
 *
 * Arbeitet ausschliesslich auf dem BILD-Pfad (/pilotes/photos/*.png). Der ist erreichbar,
 * auch wenn die .aspx-Fahrerseiten gedrosselt sind — deshalb geht hier weiter, was ueber
 * audit-driver-photos.js gerade nicht geht.
 *
 * statsf1 benennt nicht nach einer Regel, sondern nach mehreren. Belegt sind:
 *   nachname                      moss
 *   nachname auf 8 Zeichen        deangeli   (de Angelis), perezsal (Perez-Sala)
 *   7 Zeichen + Initiale          fittipac   (Christian Fittipaldi), hilld, mossb
 *   nachname + vorname            hermanal   (Al Herman)
 *   vorname + Initiale Nachname   gerardl    (Gerard Larrousse)
 *   nachname + Ziffer             jones2     (Tom Jones), andrett2
 * Deshalb wird ein Kandidatenfaecher durchprobiert statt einer Formel.
 *
 * Aufruf: node tools/find-missing-photos.js [--delay=1000] [--ids=a,b,c]
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets-backup');
const BASE = 'https://www.statsf1.com/pilotes/photos/';
const SENTINEL = BASE + 'jones.png';          // existiert sicher -> erkennt Drosselung

const args = process.argv.slice(2);
const DELAY = Number((args.find(a => a.startsWith('--delay=')) || '').split('=')[1]) || 1000;
const ONLY = (args.find(a => a.startsWith('--ids=')) || '').split('=')[1];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');

function head(url) {
    return new Promise(res => {
        const q = https.request(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0 (F1RPG photo lookup)' } }, s => {
            s.resume(); res({ code: s.statusCode, len: Number(s.headers['content-length'] || 0) });
        });
        q.on('error', () => res({ code: 0 }));
        q.setTimeout(20000, () => { q.destroy(); res({ code: 0 }); });
        q.end();
    });
}

// Alle beobachteten Namensmuster, beste Treffer-Chance zuerst
function candidates(d) {
    const full = norm(d.lastName), fn = norm(d.firstName), fi = fn[0] || '';
    const parts = String(d.lastName || '').split(/[-\s]+/).map(norm).filter(Boolean);
    const last = parts[parts.length - 1] || '';
    const out = [];
    const add = v => { if (v && v.length > 1 && !out.includes(v)) out.push(v); };

    add(full.slice(0, 8));                       // deangeli, perezsal
    add(full);
    add(full.slice(0, 7) + fi);                  // fittipac, mossb
    add((full + fn).slice(0, 8));                // hermanal
    add(last.slice(0, 8));                       // Doppelname: nur der letzte Teil
    add(last.slice(0, 7) + fi);
    if (parts.length > 1) { add(parts[0].slice(0, 8)); add(parts.join('').slice(0, 8)); }
    add((fn + full[0]).slice(0, 8));             // gerardl
    add(full.slice(0, 7) + '2');                 // jones2, andrett2
    add((fn + full).slice(0, 8));
    return out;
}

(async () => {
    const m = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8'));
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'f1db-json-splitted', 'f1db-drivers.json'), 'utf8'));
    const arr = Array.isArray(raw) ? raw : (raw.drivers || Object.values(raw)[0]);
    const byId = new Map(arr.map(d => [d.id, d]));

    let ids = ONLY ? ONLY.split(',') : m.driverPhotos.filter(r => r.status === 'kein-foto').map(r => r.id);
    ids = ids.filter(i => byId.has(i));

    // Dateien, die schon einem anderen Fahrer gehoeren -> nicht nochmal vergeben
    const taken = new Set(m.driverPhotos.filter(r => r.file).map(r => r.file.replace(/\.png$/, '')));

    console.log(`Suche Fotos fuer ${ids.length} Fahrer (Bild-Pfad, ${DELAY}ms Abstand)\n`);
    const hits = [], misses = [];
    let reqs = 0;

    for (const id of ids) {
        const d = byId.get(id);
        let found = null;
        for (const c of candidates(d)) {
            if (taken.has(c)) continue;              // gehoert nachweislich jemand anderem
            await sleep(DELAY);
            const r = await head(BASE + c + '.png');
            reqs++;
            if (r.code === 200) { found = { name: c, len: r.len }; break; }
            if (r.code !== 200 && r.code !== 404) {
                // 302 kann "gibt es nicht" ODER Drosselung heissen -> an der Referenz pruefen
                const s = await head(SENTINEL);
                if (s.code !== 200) {
                    console.log(`\n[ABBRUCH] Quelle drosselt (Referenzbild antwortet ${s.code}). Bisheriges Ergebnis wird gesichert.`);
                    ids = []; break;
                }
            }
        }
        if (found) { hits.push({ id, name: d.name || d.fullName, file: found.name, bytes: found.len }); console.log(`  ✓ ${id.padEnd(30)} -> ${found.name}.png (${found.len}B)`); }
        else { misses.push({ id, name: d.name || d.fullName }); console.log(`  · ${id.padEnd(30)} nichts gefunden`); }
    }

    fs.writeFileSync(path.join(OUT, 'missing-photo-search.json'),
        JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), requests: reqs, hits, misses }, null, 2));

    console.log(`\nGefunden: ${hits.length}   ohne Treffer: ${misses.length}   (${reqs} Anfragen)`);
    if (hits.length) {
        console.log('\n--- Zeilen fuer DRIVER_PHOTO_OVERRIDES ---');
        hits.forEach(h => console.log(`            '${h.id}': '${h.file}',   // ${h.name}`));
    }
    console.log('\nRohdaten: assets-backup/missing-photo-search.json');
})();
