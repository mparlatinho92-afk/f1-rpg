#!/usr/bin/env node
/**
 * extract-images.js — Bild-Backup aus index.html
 *
 * Schreibt jede eingebettete data:image-URI als echte Datei nach assets-backup/embedded/
 * und legt ein Manifest an (Schluessel, Typ, Zeile, Groesse, sha256).
 * Zusaetzlich wird jede extern verlinkte Bild-URL im Manifest erfasst (nur Liste,
 * Download uebernimmt mirror-external-images.js).
 *
 * Aufruf: node tools/extract-images.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'index.html');
const OUT = path.join(ROOT, 'assets-backup');
const EMB = path.join(OUT, 'embedded');

const EXT_BY_MIME = {
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp',
    'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/x-icon': 'ico'
};

function slug(s) {
    return String(s).replace(/[^A-Za-z0-9_.-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'unbenannt';
}

const lines = fs.readFileSync(SRC, 'utf8').split(/\r?\n/);

fs.mkdirSync(EMB, { recursive: true });

// Beginn einer data-URI. Das Ende bestimmt der umschliessende Quote, nicht ein Zeichenfilter:
// unkodierte SVG-Favicons enthalten Leerzeichen und einfache Quotes.
const RE_DATA = /data:(image\/[a-z+.-]+)(;base64)?,/g;
// Schluessel unmittelbar vor der URI:  'DDR': "  |  "tecno": [  |  url: "
const RE_KEY_BEFORE = /['"]([^'"]{1,60})['"]\s*:\s*['"]?$/;
// Blockschluessel einer Livery-/Logo-Liste:   "tecno": [   (auch mit Zeilenkommentar dahinter)
const RE_BLOCK = /^\s*['"]([^'"]{1,60})['"]\s*:\s*\[\s*(?:\/\/.*)?$/;

const embedded = [];
const seen = new Map();   // sha256 -> erster Dateiname (Duplikate nicht doppelt schreiben)
let block = null;
const counter = new Map();

lines.forEach((line, i) => {
    const bm = line.match(RE_BLOCK);
    if (bm) block = bm[1];

    let m;
    RE_DATA.lastIndex = 0;
    while ((m = RE_DATA.exec(line)) !== null) {
        const [, mime, b64] = m;
        const before = line.slice(0, m.index);

        // Nutzlast laeuft bis zum schliessenden Quote des umschliessenden Strings/Attributs.
        const quote = (before.match(/(["'])[^"']*$/) || [])[1];
        const rest = line.slice(m.index + m[0].length);
        const end = quote ? rest.indexOf(quote) : -1;
        const payload = end >= 0 ? rest.slice(0, end) : rest.replace(/[)\s].*$/, '');
        RE_DATA.lastIndex = m.index + m[0].length + payload.length;

        let key = null;
        const km = before.match(RE_KEY_BEFORE);
        if (km) key = km[1];
        if (!key && block) {
            // Livery-Eintrag: Jahresbereich mit anhaengen, damit mehrere Zeilen pro Team eindeutig bleiben
            const yr = before.match(/from:\s*(\d{4}),\s*to:\s*(\d{4})/);
            key = yr ? `${block}_${yr[1]}-${yr[2]}` : block;
        }
        if (!key && /rel=["']icon["']/.test(line)) key = 'favicon';
        if (!key) key = `zeile${i + 1}`;

        const buf = b64
            ? Buffer.from(payload, 'base64')
            : Buffer.from(decodeURIComponent(payload), 'utf8');
        const sha = crypto.createHash('sha256').update(buf).digest('hex');
        const ext = EXT_BY_MIME[mime] || 'bin';

        let base = slug(key);
        const n = (counter.get(base) || 0) + 1;
        counter.set(base, n);
        const file = n > 1 ? `${base}__${n}.${ext}` : `${base}.${ext}`;

        const dup = seen.get(sha);
        if (!dup) {
            fs.writeFileSync(path.join(EMB, file), buf);
            seen.set(sha, file);
        }

        embedded.push({
            key, file: dup || file, mime, line: i + 1,
            bytes: buf.length, sha256: sha,
            duplicateOf: dup && dup !== file ? dup : undefined
        });
    }
});

// Externe Bild-URLs inventarisieren (keine Template-Literale mit ${...})
// Ganze URL nehmen und danach filtern — ein Abbruch an der ersten Endung zerschiesst
// sowohl Wikia (".svg.png/revision/latest") als auch Wikimedia-Thumbs (".png/330px-....png").
const RE_URL = /https?:\/\/[^"'`)\s]+/g;
const RE_IS_IMG = /\.(?:png|jpe?g|svg|webp|gif)(?:$|[/?#])/i;
const external = [];
const extSeen = new Set();
lines.forEach((line, i) => {
    let m;
    RE_URL.lastIndex = 0;
    while ((m = RE_URL.exec(line)) !== null) {
        const url = m[0].replace(/[.,;]+$/, '');
        if (!RE_IS_IMG.test(url)) continue;
        if (url.includes('${') || url.includes('{s}') || url.includes('{z}')) continue;
        if (extSeen.has(url)) continue;
        extSeen.add(url);
        external.push({ url, line: i + 1 });
    }
});

// WICHTIG: bestehendes Manifest einlesen und nur die eigenen Abschnitte ersetzen.
// Frueher wurde hier komplett ueberschrieben — das hat die Abschnitte der anderen
// Werkzeuge (driverPhotos, flags) stillschweigend geloescht.
const manifestPath = path.join(OUT, 'manifest.json');
const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : {};
manifest.generatedAt = new Date().toISOString().slice(0, 10);
manifest.source = 'index.html';
manifest.counts = Object.assign(manifest.counts || {}, {
    embedded: embedded.length,
    embeddedUniqueFiles: seen.size,
    embeddedBytes: embedded.reduce((a, e) => a + (e.duplicateOf ? 0 : e.bytes), 0),
    external: external.length
});
manifest.embedded = embedded;
manifest.external = external;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`Eingebettet : ${embedded.length} Vorkommen -> ${seen.size} Dateien (${(manifest.counts.embeddedBytes / 1024).toFixed(1)} KB)`);
console.log(`Extern      : ${external.length} URLs (nur inventarisiert)`);
console.log(`Ziel        : ${path.relative(ROOT, EMB)}/ + manifest.json`);
