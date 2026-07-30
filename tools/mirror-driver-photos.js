#!/usr/bin/env node
/**
 * mirror-driver-photos.js — sichert die Fahrer-Fotos von stATSf1.com.
 *
 * Warum ein eigenes Skript: die Foto-URLs stehen NICHT in der HTML, sie werden zur
 * Laufzeit aus der Fahrer-ID gebaut (`.../photos/${lastName}.png`). Der URL-Scan in
 * extract-images.js kann sie deshalb nicht finden.
 *
 * Das Skript liest DRIVER_PHOTO_OVERRIDES / DRIVER_PHOTO_BLOCKLIST / FEEDER_PHOTO_OVERRIDES
 * direkt aus index.html — die Tabellen koennen so nie auseinanderlaufen — und bildet
 * getDriverPhotoUrl() + getDriverPhotoUrlFallback() nach, inklusive des onerror-Fallbacks
 * auf den vollen Slug.
 *
 * Aufruf: node tools/mirror-driver-photos.js [--force] [--concurrency=3] [--limit=N]
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets-backup');
const DIR = path.join(OUT, 'drivers');
const MANIFEST = path.join(OUT, 'manifest.json');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const CONC = Number((args.find(a => a.startsWith('--concurrency=')) || '').split('=')[1]) || 3;
const LIMIT = Number((args.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || 0;

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// --- Tabellen aus index.html ziehen (Quelle der Wahrheit bleibt die HTML) ---
function blockAfter(marker, closer) {
    const i = html.indexOf(marker);
    if (i < 0) return '';
    const end = html.indexOf(closer, i);
    return end < 0 ? '' : html.slice(i, end);
}
function parsePairs(body) {
    const map = {};
    const re = /'([^']+)'\s*:\s*'([^']*)'/g;
    let m;
    while ((m = re.exec(body)) !== null) map[m[1]] = m[2];
    return map;
}
const OVERRIDES = parsePairs(blockAfter('const DRIVER_PHOTO_OVERRIDES', '\n        };'));
const FEEDER = parsePairs(blockAfter('const FEEDER_PHOTO_OVERRIDES', '\n        };'));
const BLOCK = new Set((blockAfter('const DRIVER_PHOTO_BLOCKLIST', '\n        ]);').match(/'([^']+)'/g) || [])
    .map(s => s.slice(1, -1)));

const BASE = 'https://www.statsf1.com/pilotes/photos/';

// Fotos, die es auf statsf1 gibt, die die Namensregel des Spiels aber verfehlt —
// gefunden durch Absuchen der fotolosen Fahrer nach dem Muster Nachname+Initiale.
// Nur fuers Backup: das Spiel zeigt hier weiter den Avatar, solange die drei nicht
// in DRIVER_PHOTO_OVERRIDES (index.html) stehen.
const BACKUP_ONLY_ALIASES = {
    'alexander-rossi': 'rossia',      // "rossi.png" existiert nicht
    'ma-qinghua': 'ma',               // Slug-Ende "qinghua" ist der Vorname
    'pedro-de-la-rosa': 'delarosa'    // Slug-Ende "rosa" statt "delarosa"
};

// Spiegelt getDriverPhotoUrl() aus index.html
function photoUrl(id) {
    if (!id) return null;
    if (id.startsWith('feeder-')) {
        const fo = FEEDER[id];
        if (fo) return /^https?:/i.test(fo) ? fo : BASE + fo + '.png';
        return null;
    }
    if (BLOCK.has(id)) return null;
    if (OVERRIDES[id]) return BASE + OVERRIDES[id] + '.png';
    return BASE + id.split('-').pop() + '.png';
}
// Spiegelt getDriverPhotoUrlFallback() — greift im Spiel per onerror
function fallbackUrl(id) {
    if (!id || id.startsWith('feeder-') || BLOCK.has(id) || OVERRIDES[id]) return null;
    const parts = id.split('-');
    return parts.length >= 2 ? BASE + parts.slice(-2).join('-') + '.png' : null;
}

function fetch(url, redirects = 0) {
    return new Promise((resolve) => {
        if (redirects > 5) return resolve({ error: 'zu viele Redirects' });
        const req = https.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (F1RPG asset backup; local archival)', 'Accept': 'image/*,*/*' }
        }, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                res.resume();
                return resolve(fetch(new URL(res.headers.location, url).toString(), redirects + 1));
            }
            if (res.statusCode !== 200) { res.resume(); return resolve({ status: res.statusCode }); }
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve({ status: 200, buf: Buffer.concat(chunks) }));
        });
        req.on('error', e => resolve({ error: e.message }));
        req.setTimeout(30000, () => { req.destroy(); resolve({ error: 'Timeout' }); });
    });
}
async function fetchRetry(url) {
    let r = await fetch(url);
    for (let a = 1; a <= 3 && !r.buf && (r.status === 429 || r.status >= 500 || r.error === 'Timeout'); a++) {
        await new Promise(res => setTimeout(res, 2000 * a));
        r = await fetch(url);
    }
    return r;
}

// Kein Bild, sondern eine Platzhalter-/Fehlerseite? (statsf1 liefert bei Unbekannten teils HTML)
function isImage(buf) {
    if (buf.length < 100) return false;
    if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return true;
    if (buf[0] === 0xff && buf[1] === 0xd8) return true;
    if (buf.slice(0, 4).toString() === 'RIFF') return true;
    if (buf.slice(0, 3).toString() === 'GIF') return true;
    return false;
}

(async () => {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'f1db-json-splitted', 'f1db-drivers.json'), 'utf8'));
    const drivers = (Array.isArray(raw) ? raw : (raw.drivers || Object.values(raw)[0])).map(d => d.id).filter(Boolean);
    let ids = [...new Set(drivers.concat(Object.keys(OVERRIDES), Object.keys(FEEDER)))].sort();
    if (LIMIT) ids = ids.slice(0, LIMIT);

    fs.mkdirSync(DIR, { recursive: true });
    const results = [];
    const byUrl = new Map();   // dieselbe Datei bedient mehrere Fahrer (Namensvettern-Faelle)
    let ok = 0, cached = 0, none = 0, blocked = 0, fail = 0;

    let idx = 0;
    async function worker() {
        while (idx < ids.length) {
            const id = ids[idx++];
            const primary = photoUrl(id);
            if (!primary) {
                results.push({ id, status: BLOCK.has(id) ? 'blocklist-avatar' : 'kein-foto' });
                BLOCK.has(id) ? blocked++ : none++;
                continue;
            }

            const alias = BACKUP_ONLY_ALIASES[id] ? BASE + BACKUP_ONLY_ALIASES[id] + '.png' : null;
            const tryUrls = [primary, fallbackUrl(id), alias].filter(Boolean);
            let done = false;
            for (const url of tryUrls) {
                if (byUrl.has(url)) {   // schon geladen (anderer Fahrer, gleiche Datei)
                    const prev = byUrl.get(url);
                    if (prev) { results.push({ id, url, file: prev, status: 'geteilt' }); done = true; break; }
                    continue;           // von anderem Fahrer als tot bekannt -> naechsten Kandidaten,
                }                       // NICHT abbrechen (sonst verlieren Namensvettern ihren Fallback)
                const name = decodeURIComponent(url.split('/').pop()).replace(/[^A-Za-z0-9_.-]+/g, '_');
                const dest = path.join(DIR, name);

                if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 0) {
                    const buf = fs.readFileSync(dest);
                    byUrl.set(url, name);
                    results.push({ id, url, file: name, bytes: buf.length, status: 'cached',
                        sha256: crypto.createHash('sha256').update(buf).digest('hex') });
                    cached++; done = true; break;
                }

                const r = await fetchRetry(url);
                if (r.buf && isImage(r.buf)) {
                    fs.writeFileSync(dest, r.buf);
                    byUrl.set(url, name);
                    results.push({ id, url, file: name, bytes: r.buf.length, status: 'ok',
                        sha256: crypto.createHash('sha256').update(r.buf).digest('hex') });
                    ok++; done = true; break;
                }
                byUrl.set(url, null);   // URL ist tot, fuer andere Fahrer nicht nochmal versuchen
            }
            if (!done) { results.push({ id, url: primary, status: 'kein-foto' }); none++; }

            const seen = ok + cached + none + blocked + fail;
            if (seen % 50 === 0) process.stdout.write(`  ...${seen}/${ids.length}  (geladen ${ok}, ohne Foto ${none})\n`);
        }
    }
    await Promise.all(Array.from({ length: CONC }, worker));

    results.sort((a, b) => a.id.localeCompare(b.id));
    const bytes = results.reduce((a, r) => a + (r.status === 'geteilt' ? 0 : (r.bytes || 0)), 0);

    const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
    manifest.driverPhotos = results;
    manifest.counts = Object.assign(manifest.counts || {}, {
        driversTotal: ids.length,
        driverPhotosSaved: ok + cached,
        driverPhotosShared: results.filter(r => r.status === 'geteilt').length,
        driverPhotosNone: none,
        driverPhotosBlocklist: blocked,
        driverPhotoBytes: bytes
    });
    manifest.driverPhotosMirroredAt = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

    console.log(`\nFahrer gesamt   : ${ids.length}`);
    console.log(`Fotos gesichert : ${ok} neu + ${cached} aus Cache  (${(bytes / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`Mehrfach genutzt: ${manifest.counts.driverPhotosShared}`);
    console.log(`Ohne Foto       : ${none}   Blocklist (Avatar gewollt): ${blocked}`);
})();
