#!/usr/bin/env node
// Liest einen Pool der Satzbanken direkt aus index.html und gibt ihn als JSON-Array aus.
// Wird von filter_kandidaten.py und briefing.py aufgerufen (Bestand = Quelle "bestand").
//
//   node bestand.js <index.html> <BANK.pfad.zum.pool>
//   node bestand.js ../../index.html LIVE_COMMENTARY.pit.e76
//   node bestand.js ../../index.html OBIT_BANK.abschied.werdegang.champion.mitZenit
//
// Banken sind Objektliterale ("const NAME = {") oder Nachträge ("NAME.a.b = {").
// Ein fehlender Pfad liefert [] (neuer Pool ohne Bestand), kein Fehler.
'use strict';
const fs = require('fs');

function matchBrace(src, start) {
    let d = 0, q = null;
    for (let k = start; k < src.length; k++) {
        const c = src[k];
        if (q) { if (c === '\\') { k++; continue; } if (c === q) q = null; continue; }
        if (c === "'" || c === '"' || c === '`') { q = c; continue; }
        if (c === '/' && src[k + 1] === '/') { k = src.indexOf('\n', k); continue; }
        if (c === '{') d++;
        else if (c === '}') { d--; if (!d) return k; }
    }
    return -1;
}

function literalAt(src, needle) {
    const i = src.indexOf(needle);
    if (i < 0) return null;
    const j = src.indexOf('{', i + needle.length - 1);
    const k = matchBrace(src, j);
    return k < 0 ? null : eval('(' + src.slice(j, k + 1) + ')');
}

function loadBank(src, name) {
    const bank = literalAt(src, 'const ' + name + ' = {');
    if (!bank) return null;
    // Nachträge wie "OBIT_BANK.abschied.werdegang = {" einhängen
    const re = new RegExp('\\b' + name + '((?:\\.\\w+)+) = \\{', 'g');
    let m;
    while ((m = re.exec(src))) {
        const val = literalAt(src.slice(m.index), m[0]);
        const keys = m[1].slice(1).split('.');
        let o = bank;
        keys.slice(0, -1).forEach(key => { o = o[key] = o[key] || {}; });
        o[keys[keys.length - 1]] = val;
    }
    return bank;
}

const [file, path] = process.argv.slice(2);
if (!file || !path) { console.error('Aufruf: node bestand.js <index.html> <BANK.pfad>'); process.exit(2); }
const src = fs.readFileSync(file, 'utf8');
const [name, ...keys] = path.split('.');
let o = loadBank(src, name);
if (!o) { console.error('Bank nicht gefunden: ' + name); process.exit(1); }
for (const key of keys) o = o && o[key];
process.stdout.write(JSON.stringify(Array.isArray(o) ? o : []));
