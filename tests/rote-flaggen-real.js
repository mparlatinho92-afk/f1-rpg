#!/usr/bin/env node
/**
 * rote-flaggen-real.js — reale rote Flaggen im WM-Rennen, aus der Wikipedia-Liste.
 *
 * Quelle: tools/quellen/wiki-rote-flaggen.txt ("List of red-flagged Formula One races",
 * Wikitext, einmalig abgerufen 26.09.2026). Liefert je Eintrag Jahr, Grand Prix,
 * Runde, Neustart-Code und Ursache. Ursache → Wetter oder Unfall/sonst.
 *   N  nicht neu gestartet · Y  Neustart über volle Distanz
 *   R  fortgesetzt bis zur geplanten Distanz · S  fortgesetzt, Distanz nicht erreicht
 * ⚠ Die Liste beginnt 1971 — davor ist die rote Flagge als Verfahren nicht erfasst.
 *
 * Aufruf: node tests/rote-flaggen-real.js [--liste]
 * Schreibt tools/quellen/wiki-rote-flaggen.json.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const QUELLE = path.join(__dirname, '..', 'tools', 'quellen', 'wiki-rote-flaggen.txt');
const ZIEL = path.join(__dirname, '..', 'tools', 'quellen', 'wiki-rote-flaggen.json');

const text = fs.readFileSync(QUELLE, 'utf8');
const tabelle = text.slice(text.indexOf('Formula One World Championship races that have been red-flagged'));

// Zelle säubern: Fußnoten, Einzelnachweise, Attribute vor dem Trenner, Wikilinks
function zelle(roh) {
    let c = roh.slice(1)
        .replace(/\{\{efn[\s\S]*?\}\}/g, '')
        .replace(/<ref[^>]*\/>/g, '').replace(/<ref[\s\S]*?<\/ref>/g, '');
    const attr = c.match(/^\s*(?:(?:rowspan|colspan|align|style|scope)=[^|[\]{}]*)\|/);
    if (attr) c = c.slice(attr[0].length);
    return c.replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const liste = [];
for (const zeile of tabelle.split(/\n\|-/)) {
    const m = zeile.match(/\[\[(\d{4}) ([^|\]]*?Grand Prix)\|/);
    if (!m) continue;   // Folgezeilen (weitere Fahrer, die den Neustart verpassten)
    const roh = zeile.split('\n').filter(l => l.startsWith('|'));
    const i = roh.findIndex(l => l.includes('[[' + m[1] + ' ' + m[2]));
    const rest = roh.slice(i + 1).map(zelle);
    liste.push({ jahr: +m[1], gp: m[1] + ' ' + m[2], runde: rest[0], code: ((rest[1] || '').match(/[NYRS]/) || ['?'])[0], sieger: rest[2], ursache: rest[3] || '' });
}

// Wortgrenzen: 'hail' traf sonst 'Hailwood' (1973 faelschlich Wetter)
const WETTER = /\b(?:rain\w*|wet|weather|mist|fog|storms?|flood\w*|visibility|aquaplan\w*|downpour|hail|snow|standing water)\b/i;
const dek = {};
for (const e of liste) {
    e.wetter = WETTER.test(e.ursache);
    const d = Math.floor(e.jahr / 10) * 10;
    const z = dek[d] = dek[d] || { n: 0, wetter: 0, sonst: 0, codes: {} };
    z.n++; e.wetter ? z.wetter++ : z.sonst++;
    z.codes[e.code] = (z.codes[e.code] || 0) + 1;
}
fs.writeFileSync(ZIEL, JSON.stringify(liste, null, 1));

console.log('Rote Flaggen im Rennen (WM), gesamt', liste.length);
console.log('Dekade | n  | Wetter | Unfall/sonst | Neustart-Codes');
for (const [d, z] of Object.entries(dek))
    console.log(' ' + d, '|', String(z.n).padStart(2), '|', String(z.wetter).padStart(5), ' |', String(z.sonst).padStart(7), '     |', Object.entries(z.codes).map(([k, v]) => k + ' ' + v).join(' · '));
if (process.argv.includes('--liste'))
    for (const e of liste) console.log('  ' + e.gp.padEnd(32), 'Runde ' + String(e.runde).padEnd(4), e.code, e.wetter ? 'WETTER' : '      ', e.ursache.slice(0, 70));
