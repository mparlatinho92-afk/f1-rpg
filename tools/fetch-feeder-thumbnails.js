#!/usr/bin/env node
/**
 * fetch-feeder-thumbnails.js — sichert die Wikimedia-Fotos der F2/F3-Fahrer.
 *
 * Gleiche Bauart wie mirror-driver-photos.js (statsf1): Datei ins Backup, Spiel
 * verlinkt sie spaeter, nichts wird in die HTML eingebettet.
 *
 * ZWEI Besonderheiten gegenueber statsf1:
 * 1) Die gesammelten URLs zeigen auf ORIGINALE (⌀ 3 MB, in Summe ~370 MB). Wir holen
 *    stattdessen Vorschaubilder ueber die API (iiurlwidth) — ⌀ 12 KB. Selbst gebaute
 *    /thumb/-Pfade quittiert Wikimedia mit HTTP 400, siehe reference_logo_sources.
 * 2) Die Bilder stehen unter CC-Lizenzen. Lizenz und Urheber werden je Bild mitgesichert,
 *    sonst duerfen sie nicht angezeigt werden. Bilder OHNE Lizenzangabe werden
 *    uebersprungen.
 *
 * Aufruf: node tools/fetch-feeder-thumbnails.js [--breite=200] [--delay=900] [--force]
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets-backup');
const DIR = path.join(OUT, 'feeder-photos');

const args = process.argv.slice(2);
const BREITE = Number((args.find(a => a.startsWith('--breite=')) || '').split('=')[1]) || 200;
const DELAY = Number((args.find(a => a.startsWith('--delay=')) || '').split('=')[1]) || 2500;
const FORCE = args.includes('--force');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Wikimedia verlangt laut Nutzungsrichtlinie eine Kontaktangabe im User-Agent.
// Ohne sie wird deutlich haerter gedrosselt — deshalb die Repo-Adresse.
function req(url, method = 'GET', redirects = 0) {
    return new Promise(res => {
        if (redirects > 4) return res({ error: 'zu viele Redirects' });
        const r = https.request(url, { method, headers: { 'User-Agent': 'F1RPG-asset-backup/1.0 (https://github.com/mparlatinho92-afk/f1-rpg)' } }, s => {
            if ([301, 302, 307, 308].includes(s.statusCode) && s.headers.location) {
                s.resume(); return res(req(new URL(s.headers.location, url).toString(), method, redirects + 1));
            }
            if (s.statusCode !== 200) { s.resume(); return res({ code: s.statusCode }); }
            if (method === 'HEAD') { s.resume(); return res({ code: 200 }); }
            const c = []; s.on('data', d => c.push(d));
            s.on('end', () => res({ code: 200, buf: Buffer.concat(c) }));
        });
        r.on('error', e => res({ error: e.message }));
        r.setTimeout(30000, () => { r.destroy(); res({ error: 'Timeout' }); });
        r.end();
    });
}
// Wikimedia antwortet bei zu vielen Anfragen mit 429. Dann hilft nur warten —
// jeder weitere Versuch verlaengert die Sperre nur.
async function reqGeduldig(url) {
    let r = await req(url);
    for (let a = 1; a <= 5 && !r.buf && (r.code === 429 || r.code >= 500 || r.error === 'Timeout'); a++) {
        await sleep(20000 * a);
        r = await req(url);
    }
    return r;
}
const json = async url => { const r = await reqGeduldig(url); try { return JSON.parse(r.buf.toString()); } catch (e) { return null; } };

(async () => {
    // Beide Quellen zusammenfuehren: Nutzer-Skript + eigene Nachsuche
    const quellen = ['fahrerfotos_ergebnis.json', path.join('assets-backup', 'feeder-photos-found.json')];
    const byName = new Map();
    for (const q of quellen) {
        const p = path.join(ROOT, q);
        if (!fs.existsSync(p)) continue;
        for (const r of JSON.parse(fs.readFileSync(p, 'utf8'))) {
            if (!(r.found === true || r.found === 'True') || !r.image_url) continue;
            if (!byName.has(r.name)) byName.set(r.name, r);
        }
    }
    // Nur Fahrer, die auch im Spiel stehen
    const h = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const i = h.indexOf('const FEEDER_DRIVERS'), e = h.indexOf('\n        ];', i);
    const kader = new Set([...h.slice(i, e).matchAll(/\["([^"]+)",/g)].map(m => m[1]));

    const liste = [...byName.values()].filter(r => kader.has(r.name));
    const ohneLizenz = liste.filter(r => !r.license);
    const arbeit = liste.filter(r => r.license);
    console.log(`Fotos aus beiden Quellen: ${byName.size}   davon im Kader: ${liste.length}`);
    console.log(`ohne Lizenzangabe (uebersprungen): ${ohneLizenz.length}${ohneLizenz.length ? ' -> ' + ohneLizenz.map(r => r.name).join(', ') : ''}`);
    console.log(`zu sichern: ${arbeit.length}\n`);

    fs.mkdirSync(DIR, { recursive: true });
    const rows = []; let ok = 0, cached = 0, fail = 0;

    for (const r of arbeit) {
        const file = slug(r.name) + '.jpg';
        const dest = path.join(DIR, file);
        if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 0) {
            const b = fs.readFileSync(dest);
            rows.push({ name: r.name, file, bytes: b.length, license: r.license, author: r.author, source: r.image_url, status: 'cached', sha256: crypto.createHash('sha256').update(b).digest('hex') });
            cached++; continue;
        }
        await sleep(DELAY);
        const commonsFile = decodeURIComponent(r.image_url.split('/').pop());
        const meta = await json('https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size'
            + '&iiurlwidth=' + BREITE + '&titles=' + encodeURIComponent('File:' + commonsFile));
        let thumb = null;
        try { const ii = Object.values(meta.query.pages)[0].imageinfo[0]; thumb = ii.thumburl || ii.url; } catch (x) { }
        if (!thumb) { rows.push({ name: r.name, status: 'FEHLER', error: 'keine Thumbnail-URL' }); fail++; console.log(`  ${r.name.padEnd(24)} keine Thumbnail-URL`); continue; }

        await sleep(300);
        const img = await reqGeduldig(thumb);
        if (!img.buf) { rows.push({ name: r.name, status: 'FEHLER', error: img.error || ('HTTP ' + img.code) }); fail++; console.log(`  ${r.name.padEnd(24)} ${img.error || 'HTTP ' + img.code}`); continue; }
        fs.writeFileSync(dest, img.buf);
        rows.push({ name: r.name, file, bytes: img.buf.length, license: r.license, author: r.author, source: r.image_url, thumb, status: 'ok', sha256: crypto.createHash('sha256').update(img.buf).digest('hex') });
        ok++;
        if ((ok + cached + fail) % 25 === 0) console.log(`  ...${ok + cached + fail}/${arbeit.length}`);
    }

    const manifestPath = path.join(OUT, 'manifest.json');
    const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
    manifest.feederPhotos = rows;
    manifest.counts = Object.assign(manifest.counts || {}, {
        feederPhotos: rows.filter(r => r.file).length,
        feederPhotoBytes: rows.reduce((a, r) => a + (r.bytes || 0), 0),
        feederPhotosSkippedNoLicense: ohneLizenz.length
    });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    const bytes = rows.reduce((a, r) => a + (r.bytes || 0), 0);
    console.log(`\nGeladen: ${ok}   aus Cache: ${cached}   Fehler: ${fail}`);
    console.log(`Gesamt : ${(bytes / 1024 / 1024).toFixed(2)} MB   Schnitt: ${(bytes / Math.max(1, ok + cached) / 1024).toFixed(1)} KB`);
})();
