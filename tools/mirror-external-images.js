#!/usr/bin/env node
/**
 * mirror-external-images.js — laedt die extern verlinkten Logos aus manifest.json
 * nach assets-backup/external/ und schreibt das Ergebnis (Datei, Groesse, sha256,
 * HTTP-Status) zurueck ins Manifest.
 *
 * Reines Backup: die HTML bleibt unveraendert, es wird nichts umgeschrieben.
 * Wiederholte Laeufe ueberspringen bereits geladene Dateien (--force laedt neu).
 *
 * Aufruf: node tools/mirror-external-images.js [--force] [--concurrency=4]
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets-backup');
const EXT = path.join(OUT, 'external');
const MANIFEST = path.join(OUT, 'manifest.json');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const CONC = Number((args.find(a => a.startsWith('--concurrency=')) || '').split('=')[1]) || 4;

if (!fs.existsSync(MANIFEST)) {
    console.error('manifest.json fehlt — zuerst: node tools/extract-images.js');
    process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
fs.mkdirSync(EXT, { recursive: true });

// Dateiname aus der URL: bei Wikia steckt der echte Name vor /revision/latest
function fileNameFor(url) {
    let p = url.replace(/\/revision\/latest.*$/, '').replace(/\?.*$/, '');
    let name = decodeURIComponent(p.split('/').pop() || 'bild');
    name = name.replace(/[^A-Za-z0-9_.-]+/g, '_');
    if (!/\.(png|jpe?g|svg|webp|gif)$/i.test(name)) name += '.png';
    return name;
}

function fetch(url, redirects = 0) {
    return new Promise((resolve) => {
        if (redirects > 5) return resolve({ error: 'zu viele Redirects' });
        const lib = url.startsWith('https') ? https : http;
        const req = lib.get(url, {
            headers: {
                // Wikia liefert ohne UA teilweise 403; Referer-frei = kein Hotlinking-Trick,
                // wir speichern nur, was die Seite oeffentlich ausliefert.
                'User-Agent': 'Mozilla/5.0 (F1RPG asset backup; local archival)',
                'Accept': 'image/*,*/*'
            }
        }, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                res.resume();
                const next = new URL(res.headers.location, url).toString();
                return resolve(fetch(next, redirects + 1));
            }
            if (res.statusCode !== 200) {
                res.resume();
                return resolve({ status: res.statusCode, error: `HTTP ${res.statusCode}` });
            }
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve({ status: 200, buf: Buffer.concat(chunks) }));
        });
        req.on('error', e => resolve({ error: e.message }));
        req.setTimeout(30000, () => { req.destroy(); resolve({ error: 'Timeout' }); });
    });
}

(async () => {
    const list = manifest.external || [];
    const used = new Set();
    let ok = 0, skip = 0, fail = 0;
    const failures = [];

    let idx = 0;
    async function worker() {
        while (idx < list.length) {
            const entry = list[idx++];
            let name = fileNameFor(entry.url);
            while (used.has(name) && !(entry.file === name)) {
                const dot = name.lastIndexOf('.');
                name = `${name.slice(0, dot)}_${Math.random().toString(36).slice(2, 5)}${name.slice(dot)}`;
            }
            used.add(name);
            const dest = path.join(EXT, name);

            if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 0) {
                const buf = fs.readFileSync(dest);
                entry.file = name; entry.bytes = buf.length; entry.status = 'cached';
                entry.sha256 = crypto.createHash('sha256').update(buf).digest('hex');
                skip++; continue;
            }

            // 429/5xx = Wikimedia drosselt; kurz warten statt aufgeben.
            let r = await fetch(entry.url);
            for (let a = 1; a <= 3 && !r.buf && (r.status === 429 || r.status >= 500 || r.error === 'Timeout'); a++) {
                await new Promise(res => setTimeout(res, 2000 * a));
                r = await fetch(entry.url);
            }
            if (r.buf && r.buf.length > 0) {
                fs.writeFileSync(dest, r.buf);
                entry.file = name; entry.bytes = r.buf.length; entry.status = 'ok';
                entry.sha256 = crypto.createHash('sha256').update(r.buf).digest('hex');
                ok++;
            } else {
                entry.status = 'FEHLER'; entry.error = r.error || 'leer';
                delete entry.file;
                fail++; failures.push(`${entry.error}  ${entry.url}`);
            }
            if ((ok + skip + fail) % 25 === 0) process.stdout.write(`  ...${ok + skip + fail}/${list.length}\n`);
        }
    }
    await Promise.all(Array.from({ length: CONC }, worker));

    manifest.counts.externalDownloaded = ok + skip;
    manifest.counts.externalFailed = fail;
    manifest.counts.externalBytes = list.reduce((a, e) => a + (e.bytes || 0), 0);
    manifest.mirroredAt = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

    console.log(`\nGeladen: ${ok}   aus Cache: ${skip}   Fehler: ${fail}`);
    console.log(`Gesamt : ${(manifest.counts.externalBytes / 1024 / 1024).toFixed(2)} MB in ${path.relative(ROOT, EXT)}/`);
    if (failures.length) {
        console.log('\nFehlgeschlagen:');
        failures.forEach(f => console.log('  ' + f));
    }
})();
