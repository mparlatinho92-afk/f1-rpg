#!/usr/bin/env node
/**
 * mirror-flag-images.js — sichert die Twemoji-Flaggen, die das Spiel zur Laufzeit
 * von einem CDN laedt.
 *
 * Warum noetig: auf Windows-Desktop rendert das System Flaggen-Emojis als Buchstaben
 * ("MX" statt der mexikanischen Flagge). Deshalb baut getEmojiFlag() fuer JEDE normale
 * Nation eine Twemoji-PNG-URL zusammen (jsdelivr, Ersatz cdnjs). Diese Bilder stehen
 * nirgends in der HTML — der URL-Scan von extract-images.js kann sie nicht finden,
 * genau wie bei den Fahrer-Fotos.
 *
 * Aufruf: node tools/mirror-flag-images.js [--delay=150] [--force]
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets-backup');
const DIR = path.join(OUT, 'flags');
const MANIFEST = path.join(OUT, 'manifest.json');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const DELAY = Number((args.find(a => a.startsWith('--delay=')) || '').split('=')[1]) || 150;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Die gleiche Ableitung wie im Spiel: Alpha2 -> Regional-Indicator-Codepoints
const CDN = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/';
const MIRROR = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/';
function codepoints(alpha2) {
    const cp1 = (0x1F1E6 + alpha2.charCodeAt(0) - 65).toString(16);
    const cp2 = (0x1F1E6 + alpha2.charCodeAt(1) - 65).toString(16);
    return `${cp1}-${cp2}`;
}

function get(url) {
    return new Promise(res => {
        const q = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (F1RPG asset backup)' } }, s => {
            if ([301, 302, 307, 308].includes(s.statusCode) && s.headers.location) {
                s.resume(); return res(get(new URL(s.headers.location, url).toString()));
            }
            if (s.statusCode !== 200) { s.resume(); return res({ code: s.statusCode }); }
            const c = []; s.on('data', d => c.push(d));
            s.on('end', () => res({ code: 200, buf: Buffer.concat(c) }));
        });
        q.on('error', e => res({ error: e.message }));
        q.setTimeout(20000, () => { q.destroy(); res({ error: 'Timeout' }); });
    });
}

(async () => {
    // Alpha2-Codes aus der Tabelle im Spiel ziehen — Quelle der Wahrheit bleibt index.html
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const i = html.indexOf('FLAG_IOC_TO_ALPHA2');
    const body = html.slice(i, html.indexOf('};', i));
    const pairs = [...body.matchAll(/['"]([A-Z]{2,3})['"]\s*:\s*['"]([A-Z]{2})['"]/g)];
    const byAlpha = new Map();
    pairs.forEach(([, ioc, a2]) => { if (!byAlpha.has(a2)) byAlpha.set(a2, []); byAlpha.get(a2).push(ioc); });

    fs.mkdirSync(DIR, { recursive: true });
    console.log(`${pairs.length} IOC-Codes -> ${byAlpha.size} verschiedene Flaggen\n`);

    const rows = []; let ok = 0, cached = 0, fail = 0;
    for (const [a2, iocs] of [...byAlpha].sort()) {
        const cp = codepoints(a2);
        const file = `${cp}.png`;
        const dest = path.join(DIR, file);

        if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 0) {
            const b = fs.readFileSync(dest);
            rows.push({ alpha2: a2, ioc: iocs, file, bytes: b.length, status: 'cached', sha256: crypto.createHash('sha256').update(b).digest('hex') });
            cached++; continue;
        }
        await sleep(DELAY);
        let r = await get(CDN + file);
        if (!r.buf) r = await get(MIRROR + file);      // gleicher Ersatzweg wie im Spiel
        if (r.buf) {
            fs.writeFileSync(dest, r.buf);
            rows.push({ alpha2: a2, ioc: iocs, file, bytes: r.buf.length, status: 'ok', sha256: crypto.createHash('sha256').update(r.buf).digest('hex') });
            ok++;
        } else {
            rows.push({ alpha2: a2, ioc: iocs, status: 'FEHLER', error: r.error || ('HTTP ' + r.code) });
            fail++;
        }
        if ((ok + cached + fail) % 50 === 0) process.stdout.write(`  ...${ok + cached + fail}/${byAlpha.size}\n`);
    }

    const bytes = rows.reduce((a, r) => a + (r.bytes || 0), 0);
    const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    manifest.flags = rows;
    manifest.counts = Object.assign(manifest.counts || {}, {
        flagsTotal: byAlpha.size, flagsSaved: ok + cached, flagsFailed: fail, flagBytes: bytes
    });
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

    console.log(`\nGeladen: ${ok}   aus Cache: ${cached}   Fehler: ${fail}`);
    console.log(`Gesamt : ${(bytes / 1024).toFixed(1)} KB   Schnitt: ${(bytes / Math.max(1, ok + cached)).toFixed(0)} B/Flagge`);
    if (fail) rows.filter(r => r.status === 'FEHLER').forEach(r => console.log(`  FEHLER ${r.alpha2}: ${r.error}`));
})();
