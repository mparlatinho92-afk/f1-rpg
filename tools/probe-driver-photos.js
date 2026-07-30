#!/usr/bin/env node
/**
 * probe-driver-photos.js — Diagnose, kein Backup.
 *
 * Sucht fuer Fahrer, die sich im Spiel EIN Foto teilen (= mindestens einer sieht
 * ein fremdes Gesicht), den korrekten statsf1-Dateinamen. statsf1 kuerzt auf 8 Zeichen
 * ("pourchai", "osulliva") und haengt bei Namensgleichen die Initiale an ("hilld",
 * "rosbergn", "rossia") — beides wird hier durchprobiert.
 *
 * Aufruf: node tools/probe-driver-photos.js [--all]
 *   ohne Flag: nur Kollisionsgruppen (Fahrer teilen sich eine Datei)
 *   --all    : zusaetzlich alle Fahrer ohne Foto
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const BASE = 'https://www.statsf1.com/pilotes/photos/';
const ALL = process.argv.includes('--all');

const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets-backup', 'manifest.json'), 'utf8'));
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'f1db-json-splitted', 'f1db-drivers.json'), 'utf8'));
const arr = Array.isArray(raw) ? raw : (raw.drivers || Object.values(raw)[0]);
const byId = new Map(arr.map(d => [d.id, d]));

const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');

// Kandidaten nach den beobachteten statsf1-Mustern
function candidates(d) {
    const ln = norm(d.lastName), fn = norm(d.firstName);
    const fi = fn[0] || '';
    const out = new Set();
    if (!ln) return [];
    out.add(ln.slice(0, 8));
    out.add((ln + fi).slice(0, 8));           // hilld, rossia
    out.add(ln.slice(0, 7) + fi);             // lange Namen: Platz fuer die Initiale schaffen
    out.add((ln + fn).slice(0, 8));
    out.add(ln.slice(0, 6) + fn.slice(0, 2));
    // Doppelnamen: nur der erste bzw. nur der zweite Teil
    const parts = (d.lastName || '').toLowerCase().split(/[-\s]+/).map(norm).filter(Boolean);
    if (parts.length > 1) { out.add(parts[0].slice(0, 8)); out.add(parts[parts.length - 1].slice(0, 8)); }
    return [...out].filter(Boolean);
}

function head(url) {
    return new Promise(res => {
        const q = https.request(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } }, s => {
            s.resume(); res({ code: s.statusCode, len: Number(s.headers['content-length'] || 0) });
        });
        q.on('error', () => res({ code: 0 }));
        q.setTimeout(15000, () => { q.destroy(); res({ code: 0 }); });
        q.end();
    });
}

(async () => {
    // Gruppen bilden: Datei -> Fahrer
    const groups = new Map();
    for (const r of m.driverPhotos) {
        if (!r.file) continue;
        if (!groups.has(r.file)) groups.set(r.file, []);
        groups.get(r.file).push(r.id);
    }
    // feeder-Duplikate desselben Menschen sind keine Kollision
    const isDupPair = ids => {
        const real = ids.filter(i => !i.startsWith('feeder-'));
        return ids.length - real.length > 0 && real.length <= 1;
    };
    const collisions = [...groups.entries()].filter(([, ids]) => ids.length > 1 && !isDupPair(ids));

    const targets = new Map();   // id -> grund
    collisions.forEach(([f, ids]) => ids.forEach(i => { if (!i.startsWith('feeder-')) targets.set(i, 'teilt ' + f); }));
    if (ALL) m.driverPhotos.filter(r => r.status === 'kein-foto').forEach(r => targets.set(r.id, 'ohne Foto'));

    console.log(`Pruefe ${targets.size} Fahrer (${collisions.length} Kollisionsgruppen${ALL ? ' + fotolose' : ''})\n`);

    const found = {};
    for (const [id, reason] of targets) {
        const d = byId.get(id);
        if (!d) continue;
        const hits = [];
        for (const c of candidates(d)) {
            const r = await head(BASE + c + '.png');
            if (r.code === 200) hits.push({ name: c, len: r.len });
        }
        found[id] = hits;
        const label = `${id} [${d.name || d.fullName}]`;
        console.log(`${label.padEnd(52)} ${reason.padEnd(18)} ${hits.length ? hits.map(h => h.name + '.png(' + h.len + 'B)').join('  ') : '— nichts gefunden'}`);
    }

    fs.writeFileSync(path.join(ROOT, 'assets-backup', 'probe-result.json'),
        JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), collisions, found }, null, 2));
    console.log('\nRohdaten: assets-backup/probe-result.json');
})();
