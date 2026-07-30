#!/usr/bin/env node
/**
 * restore-image.js — baut aus einer Backup-Datei die data:-URI zurueck,
 * so wie sie in index.html steht. Zum Wiedereinsetzen verlorener Bilder.
 *
 * Aufruf:
 *   node tools/restore-image.js ZIM_RHO          (Schluessel aus dem Manifest)
 *   node tools/restore-image.js tecno_1969-1973
 *   node tools/restore-image.js --list           (alle Schluessel zeigen)
 *   node tools/restore-image.js ZIM_RHO --out flagge.txt
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets-backup');
const manifest = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8'));

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outFile = outIdx >= 0 ? args[outIdx + 1] : null;
const query = args.find(a => !a.startsWith('--') && a !== outFile);

if (args.includes('--list') || !query) {
    console.log('Eingebettete Bilder (Schluessel — Datei — Zeile in index.html):');
    manifest.embedded.forEach(e => console.log(`  ${e.key.padEnd(22)} ${e.file.padEnd(30)} L${e.line}`));
    process.exit(0);
}

const hit = manifest.embedded.find(e => e.key === query || e.file === query)
    || manifest.embedded.find(e => e.key.toLowerCase().includes(query.toLowerCase()));
if (!hit) {
    console.error(`Kein Eintrag fuer "${query}". Liste: node tools/restore-image.js --list`);
    process.exit(1);
}

const buf = fs.readFileSync(path.join(OUT, 'embedded', hit.file));
// SVG lag im Original teils unkodiert vor (Favicon); base64 ist aber immer gueltig
// und laesst sich ueberall einsetzen — daher einheitlich base64 ausgeben.
const uri = `data:${hit.mime};base64,${buf.toString('base64')}`;

if (outFile) {
    fs.writeFileSync(outFile, uri);
    console.log(`${hit.key} -> ${outFile} (${uri.length} Zeichen)`);
} else {
    console.error(`# ${hit.key} — urspruenglich index.html Zeile ${hit.line} (${hit.bytes} Byte)`);
    console.log(uri);
}
